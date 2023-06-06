import {RequestCtx} from '../beans/request-ctx';
import {RenderingMode, ResponseCtx} from '../beans/response-ctx';
import {Handler} from "../../handlers/handler";
import {VersionCtxBuilder} from "./version-ctx-builder";
import {VersionCtx} from "../beans/version-ctx";
import {ResponseHeaders} from "../../common/response-headers";

/**
 * Builds response contexts from a http response.
 */
export class ResponseCtxBuilder {
    headers: Headers | undefined;
    response: Response;
    source: Handler;
    renderingMode: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    versionContext!: VersionCtx;
    private readonly requestContext: RequestCtx;

    /**
     * Constructs a `ResponseContextBuilder` given the associated request context and http response.
     *
     * @param requestCtx {RequestCtx} the request context.
     * @param response {Response} the response.
     * @param source the handler which fetched the response.
     */
    constructor(requestCtx: RequestCtx, response: Response, source: Handler) {
        if (!requestCtx) throw 'invalid request context';
        if (!response) throw 'invalid response';
        if (!source) throw 'invalid source';

        this.requestContext = requestCtx;
        this.response = response;
        this.source = source;
        this.renderingMode = RenderingMode.SSR;
        this.startTime = new Date();
        this.endTime = this.startTime;
        this.duration = -1;
    }

    /**
     * Sets the rendering mode.
     *
     * The CSR app (index.html) is served with a Cache-Control:no-store header
     *
     * See https://sap.github.io/spartacus-docs/server-side-rendering-optimization/#configuring-the-ssr-optimization-engine
     *
     * @return {ResponseCtxBuilder} `this`.
     */
    setRenderingMode() {
        const url = new URL(this.requestContext.request.url);
        const cacheControl = url.searchParams.get('cdn-cache-control') || this.response.headers.get('cdn-cache-control') || 'no-store';
        const csr = cacheControl.indexOf('no-store') > -1;
        const ssr = !csr && this.response.ok;

        this.renderingMode = ssr ? RenderingMode.SSR : csr
            ? RenderingMode.CSR
            : RenderingMode.NOT;

        return this;
    }

    /**
     * Sets the response headers.
     *
     * @return {ResponseCtxBuilder} this.
     */
    setHeaders() {
        if (!this.renderingMode) throw 'invalid rendering mode';

        this.headers = new Headers(this.response.headers);

        const cdnCacheControl = this.headers.get('cdn-cache-control') || 'private';
        const forcedCdnCC = this.requestContext.env.FORCED_EDGE_CACHE_CONTROL;

        // Cache headers
        if (!this.response.ok) {
            this.headers.set(ResponseHeaders.CF_CACHE_STATUS, 'DYNAMIC');
            this.headers.set(ResponseHeaders.X_DEBUG_SSR, 'N/A');
        } else if (this.renderingMode === RenderingMode.SSR) {
            const st = this.headers.get(ResponseHeaders.CF_CACHE_STATUS);
            this.headers.set(ResponseHeaders.CF_CACHE_STATUS, st === 'DYNAMIC' ? 'MISS' : 'HIT');
            this.headers.set(ResponseHeaders.X_DEBUG_SSR, 'ON');
            this.headers.set(ResponseHeaders.X_DEBUG_SSR_SOURCE, this.source.getName());

            this.headers.delete(ResponseHeaders.SET_COOKIE);
            this.headers.set(ResponseHeaders.CDN_CACHE_CONTROL, forcedCdnCC || cdnCacheControl);
            this.headers.set(ResponseHeaders.CACHE_CONTROL, 'no-store');
        } else if (this.renderingMode === RenderingMode.CSR) {
            this.headers.set(ResponseHeaders.CF_CACHE_STATUS, 'BYPASS');
            this.headers.set(ResponseHeaders.X_DEBUG_SSR, 'OFF');
        }

        // Versioning headers
        if (this.versionContext) {
            this.headers.set(ResponseHeaders.X_DEBUG_CACHE_VERSION, JSON.stringify(this.versionContext.live));
            this.headers.set(ResponseHeaders.X_DEBUG_CACHE_VERSION_CTX, JSON.stringify(this.versionContext));
        }

        return this;
    }

    /**
     * Adapts the original response.
     *
     * @return {ResponseCtxBuilder} `this`.
     */
    setResponse() {
        this.response = new Response(this.response.body, {
            status: this.response.status,
            statusText: this.response.statusText,
            headers: this.headers || this.response.headers,
        });

        return this;
    }

    /**
     * Sets the start and end times and the duration of the request processing.
     *
     * @param startTime the start time.
     * @param endTime the end time.
     *
     * @return {ResponseCtxBuilder} `this`.
     */
    setDuration(startTime: Date, endTime: Date) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.duration = endTime.getTime() - startTime.getTime();

        return this;
    }


    /**
     * Set the resource versions.
     *
     * @return {ResponseCtxBuilder} `this`.
     */
    async setVersions() {
        const versionContextBuilder = new VersionCtxBuilder(this.requestContext, this.response)
        await versionContextBuilder.setLive();
        this.versionContext = versionContextBuilder //
            .setPersisted() //
            .setDiff() //
            .setRDiff() //
            .setExpired() //
            .build();

        return this;
    }

    /**
     * Builds a response context.
     *
     * @returns {ResponseCtx} the response context.
     */
    build() {
        return new ResponseCtx(this);
    }
}
