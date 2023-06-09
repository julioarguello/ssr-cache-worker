import {ResponseContextBuilder} from '../builders/response-context-builder';
import {Handler} from "../../handlers/handler";
import {VersionContext} from "./version-context";
import {ResponseHeaders} from "../../common/response-headers";

/**
 * Rendering mode.
 *
 * @type {{SSR: string, CSR: string, NOT: string}}
 */
export const RenderingMode = {
    SSR: 'SSR',
    CSR: 'CSR',
    NOT: 'NOT',
};

/**
 * Source.
 *
 * @type {{L0: string, L1: string, L2: string, L3: string}}
 */
export const CacheLevel = {
    L0: 'L0',
    L1: 'L1',
    L2: 'L2',
    L3: 'L3',
};

/**
 * The response context.
 */
export class ResponseContext {
    public response: Response;
    public source: Handler;
    public renderingMode: string;
    public duration: number;
    public aggregatedDuration: number;
    public versionContext: VersionContext;


    /**
     * Constructs a response context using all available properties.
     *
     * @param builder {ResponseContextBuilder}
     */
    constructor(builder: ResponseContextBuilder) {
        this.response = builder.response;
        this.source = builder.source;
        this.renderingMode = builder.renderingMode;
        this.duration = builder.duration;
        this.aggregatedDuration = builder.duration;
        this.versionContext = builder.versionContext;
    }

    /**
     * Copies the value of a header from a headers object to others.
     *
     * @param name the header name.
     * @param from the source object to copy from.
     * @param to the target object.
     * @param forcedValue a value to be forced on target object.
     * @private
     */
    private static copyHeader(name: string, from: Headers, to: Headers, forcedValue: string = '') {
        const value = forcedValue || from.get(name);

        if (!value) {
            to.delete(name);
        } else {
            to.set(name, value);
        }
    }

    /**
     * Merges former response context into this one.
     *
     * Possible merges (sorted):
     * - L2.marge(L3)
     * - L1.merge(L2)
     *
     * @param expiredResponseContext the former response context from a different handler.
     */
    merge(expiredResponseContext: ResponseContext) {
        this.aggregatedDuration += expiredResponseContext.duration;
        this.versionContext.merge(expiredResponseContext.versionContext);

        const expiredHeaders = expiredResponseContext.response.headers;
        const currentHeaders = this.response.headers;
        const newHeaders = new Headers(currentHeaders);

        // this.setHeader(ResponseHeaders.AGE, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.CACHE_CONTROL, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.CDN_CACHE_CONTROL, currentHeaders, newHeaders);
        ResponseContext.copyHeader(ResponseHeaders.CF_CACHE_STATUS, expiredHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.CONTENT_DISPOSITION, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.CONTENT_ENCODING, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.CONTENT_LANGUAGE, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.CONTENT_LENGTH, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.CONTENT_RANGE, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.CONTENT_TYPE, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.ETAG, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.EXPIRES, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.LAST_MODIFIED, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.SET_COOKIE, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.X_DEBUG_RENDERING_MODE, currentHeaders, newHeaders);
        // this.setHeader(ResponseHeaders.X_DEBUG_HANDLER, currentHeaders, newHeaders);
        ResponseContext.copyHeader(ResponseHeaders.X_DEBUG_VERSION, expiredHeaders, newHeaders);

        // console.log('expiredHeaders ' + JSON.stringify(Object.fromEntries(expiredHeaders), null, 2));
        // console.log('currentHeaders ' + JSON.stringify(Object.fromEntries(currentHeaders), null, 2));
        // console.log('newHeaders ' + JSON.stringify(Object.fromEntries(newHeaders), null, 2));

        this.response = new Response(this.response.body, {
            headers: newHeaders
        })

        return this;
    }
}
