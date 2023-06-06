import parseRange from "range-parser";
import {RequestCtx} from '../context/beans/request-ctx'
import {ResponseCtx} from '../context/beans/response-ctx'
import {RequestHeaders} from '../common/request-headers'
import {ResponseHeaders} from '../common/response-headers'


type ParsedRange = { offset: number, length: number } | { suffix: number };

function rangeHasLength(object: ParsedRange): object is { offset: number, length: number } {
    return (<{ offset: number, length: number }>object).length !== undefined;
}

function hasBody(object: R2Object | R2ObjectBody): object is R2ObjectBody {
    return (<R2ObjectBody>object).body !== undefined;
}

function hasSuffix(range: ParsedRange): range is { suffix: number } {
    return (<{ suffix: number }>range).suffix !== undefined;
}

function getRangeHeader(range: ParsedRange, fileSize: number): string {
    return `bytes ${hasSuffix(range) ? (fileSize - range.suffix) : range.offset}-${hasSuffix(range) ? fileSize - 1 :
        (range.offset + range.length - 1)}/${fileSize}`;
}

/**
 * Puts and http response to R2.
 *
 * @param requestCtx the request context.
 * @param responseCtx the response context.
 * @param bucket the R2 bucket.
 * @param objectKey the object key.
 */
export async function put(requestCtx: RequestCtx, responseCtx: ResponseCtx, bucket: R2Bucket, objectKey: string): Promise<R2Object> {
    const response = responseCtx.response.clone()
    const resource = await response.arrayBuffer();

    const headers = responseCtx.response.headers;
    const cdnCacheControl = headers.get(ResponseHeaders.CDN_CACHE_CONTROL) || '';

    const maxAge = parseInt(cdnCacheControl.replace(/\D/g, ''), 0);
    const cacheExpiry = new Date();
    cacheExpiry.setSeconds(cacheExpiry.getSeconds() + maxAge);

    const httpMetadata = {
        cacheControl: headers.get(ResponseHeaders.CACHE_CONTROL) || undefined,
        cacheExpiry: cacheExpiry,
        contentDisposition: headers.get(ResponseHeaders.CONTENT_DISPOSITION) || undefined,
        contentEncoding: headers.get(ResponseHeaders.CONTENT_ENCODING) || undefined,
        contentLanguage: headers.get(ResponseHeaders.CONTENT_LANGUAGE) || undefined,
        contentType: headers.get(ResponseHeaders.CONTENT_TYPE) || undefined
    }

    const customMetadata = Object.fromEntries(new Map([
        [ResponseHeaders.CDN_CACHE_CONTROL, headers.get(ResponseHeaders.CDN_CACHE_CONTROL) || 'no-store'],
        [ResponseHeaders.X_DEBUG_CACHE_VERSION, headers.get(ResponseHeaders.X_DEBUG_CACHE_VERSION) || '{}']
    ]));

    return bucket.put(objectKey, resource, {
        httpMetadata: httpMetadata,
        customMetadata: customMetadata
    });
}

/**
 * Looks up a saved response by object key.
 *
 * @param requestCtx the request context.
 * @param bucket the R2 bucket.
 * @param objectKey the object key to be matched.
 */
export async function match(requestCtx: RequestCtx, bucket: R2Bucket, objectKey: string): Promise<Response | undefined> {
    let response: Response | undefined;

    // Since we produce this result from the request, we don't need to strictly use an R2Range
    let range: ParsedRange | undefined;

    let file: R2Object | R2ObjectBody | null | undefined;

    // Range handling
    const request = requestCtx.request;
    const rangeHeader = request.headers.get(RequestHeaders.RANGE);
    if (rangeHeader) {
        file = await bucket.head(objectKey);
        if (file === null) return new Response("File Not Found", {status: 404});
        const parsedRanges = parseRange(file.size, rangeHeader);
        // R2 only supports 1 range at the moment, reject if there is more than one
        if (parsedRanges !== -1 && parsedRanges !== -2 && parsedRanges.length === 1 && parsedRanges.type === "bytes") {
            let firstRange = parsedRanges[0];
            range = file.size === (firstRange.end + 1) ? {suffix: file.size - firstRange.start} : {
                offset: firstRange.start,
                length: firstRange.end - firstRange.start + 1
            };
        } else {
            return new Response("Range Not Satisfiable", {status: 416});
        }
    }

    // Etag/If-(Not)-Match handling
    // R2 requires that etag checks must not contain quotes, and the S3 spec only allows one etag
    // This silently ignores invalid or weak (W/) headers
    const getHeaderEtag = (header: string | null) => header?.trim().replace(/^['"]|['"]$/g, "");
    const ifMatch = getHeaderEtag(request.headers.get(RequestHeaders.IF_MATCH));
    const ifNoneMatch = getHeaderEtag(request.headers.get(RequestHeaders.IF_NONE_MATCH));

    const ifModifiedSince = Date.parse(request.headers.get(RequestHeaders.IF_MODIFIED_SINCE) || "");
    const ifUnmodifiedSince = Date.parse(request.headers.get(RequestHeaders.IF_UNMODIFIED_SINCE) || "");

    const ifRange = request.headers.get(RequestHeaders.IF_RANGE);
    if (range && ifRange && file) {
        const maybeDate = Date.parse(ifRange);

        if (isNaN(maybeDate) || new Date(maybeDate) > file.uploaded) {
            // httpEtag already has quotes, no need to use getHeaderEtag
            if (ifRange.startsWith("W/") || ifRange !== file.httpEtag) range = undefined;
        }
    }

    if (ifMatch || ifUnmodifiedSince) {
        file = await bucket.get(objectKey, {
            onlyIf: {
                etagMatches: ifMatch,
                uploadedBefore: ifUnmodifiedSince ? new Date(ifUnmodifiedSince) : undefined
            }, range
        });

        if (file && !hasBody(file)) {
            return new Response("Precondition Failed", {status: 412});
        }
    }

    if (ifNoneMatch || ifModifiedSince) {
        // if-none-match overrides if-modified-since completely
        if (ifNoneMatch) {
            file = await bucket.get(objectKey, {onlyIf: {etagDoesNotMatch: ifNoneMatch}, range});
        } else if (ifModifiedSince) {
            file = await bucket.get(objectKey, {onlyIf: {uploadedAfter: new Date(ifModifiedSince)}, range});
        }
        if (file && !hasBody(file)) {
            return new Response(null, {status: 304});
        }
    }

    file = await bucket.get(objectKey, {range});
    if (file) {
        const age = Math.round((new Date().getTime() - file.uploaded.getTime()) / 1000);

        const headers = new Headers(Object.fromEntries(new Map([
            [ResponseHeaders.AGE, age.toString()],
            [ResponseHeaders.CACHE_CONTROL, file.httpMetadata?.cacheControl ?? ""],
            [ResponseHeaders.CDN_CACHE_CONTROL, file?.customMetadata?.[ResponseHeaders.CDN_CACHE_CONTROL] ?? ""],
            [ResponseHeaders.CONTENT_DISPOSITION, file.httpMetadata?.contentDisposition ?? ""],
            [ResponseHeaders.CONTENT_ENCODING, file.httpMetadata?.contentEncoding ?? ""],
            [ResponseHeaders.CONTENT_LANGUAGE, file.httpMetadata?.contentLanguage ?? ""],
            [ResponseHeaders.CONTENT_LENGTH, (range ? (rangeHasLength(range) ? range.length : range.suffix) : file.size).toString()],
            [ResponseHeaders.CONTENT_RANGE, (range ? getRangeHeader(range, file.size) : "")],
            [ResponseHeaders.CONTENT_TYPE, file.httpMetadata?.contentType ?? ""],
            [ResponseHeaders.ETAG, file.httpEtag],
            [ResponseHeaders.EXPIRES, file.httpMetadata?.cacheExpiry?.toUTCString() ?? ""],
            [ResponseHeaders.LAST_MODIFIED, file.uploaded.toUTCString() ?? ""],
            [ResponseHeaders.X_DEBUG_CACHE_VERSION, file?.customMetadata?.[ResponseHeaders.X_DEBUG_CACHE_VERSION] ?? ""]
        ])));
        response = new Response((hasBody(file) && file.size !== 0) ? file.body : null, {
            status: (range ? 206 : 200),
            headers: headers
        });
    }

    return response;
}
