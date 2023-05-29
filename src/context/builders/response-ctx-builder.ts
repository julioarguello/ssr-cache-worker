import {RequestCtx} from '../beans/request-ctx';
import {RenderingMode, ResponseCtx} from '../beans/response-ctx';
import {Handler} from "../../handlers/handler";

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
    private requestContext: RequestCtx;

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
        const cacheControl = url.searchParams.get('cdn-cache-control') || this.response.headers.get('cdn-cache-control')  || 'no-store';
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

        if (!this.response.ok) {
            this.headers.set('cf-cache-status', 'DYNAMIC');
            this.headers.set('x-debug-ssr', 'N/A');
        } else if (this.renderingMode === RenderingMode.SSR) {
            const st = this.headers.get('cf-cache-status');
            this.headers.set('cf-cache-status', st === 'DYNAMIC' ? 'MISS' : 'HIT');
            this.headers.set('x-debug-ssr', 'ON');
            this.headers.set('x-debug-ssr-source', this.source.getName());

            this.headers.delete('set-cookie');
            this.headers.set('cdn-cache-control', forcedCdnCC || cdnCacheControl);
            this.headers.set('cache-control', 'no-store');
        } else if (this.renderingMode === RenderingMode.CSR) {
            this.headers.set('cf-cache-status', 'BYPASS');
            this.headers.set('x-debug-ssr', 'OFF');
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
     */
    setDuration(startTime: Date, endTime: Date) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.duration = endTime.getTime() - startTime.getTime();

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
