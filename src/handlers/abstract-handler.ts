import {Handler} from './handler';
import {RequestCtx} from '../context/beans/request-ctx'
import {RenderingMode, ResponseCtx} from '../context/beans/response-ctx'
import {ResponseCtxBuilder} from "../context/builders/response-ctx-builder";
import {RequestHeaders} from "../common/request-headers";
import {ResponseHeaders} from "../common/response-headers";

/**
 * The default chaining behavior can be implemented inside a base handler class.
 */
export abstract class AbstractHandler implements Handler {
    private next: Handler | undefined;
    private readonly name: string

    /**
     * Constructs the handler given its name.
     * @param name the handler name.
     * @protected
     */
    protected constructor(name: string) {
        this.name = name;
    }

    /**
     * Sets the next handler in chain.
     * @param handler the next handler.
     */
    public setNext(handler: Handler): Handler {
        this.next = handler;
        return handler;
    }

    /**
     * Gets the next handler in chain.
     */
    public getNext(): Handler {
        return <Handler>this.next;
    }

    /**
     * Handle a given request by fetching from closer handler in chain and caching it on respective caches when required.
     *
     * @param requestCtx the request context.
     */
    public async handle(requestCtx: RequestCtx): Promise<undefined | ResponseCtx> {

        const logPrefix = this.getLogPrefix(requestCtx);

        /* Try to fetch resource  */
        let responseCtx = await this.fetch(requestCtx);

        if (responseCtx) {
            /* Resource fetched */
            console.log(`${logPrefix} fetched in ${responseCtx.duration} ms`);
        } else if (this.getNext()) {
            /* Resource cannot be fetched, try with next handler in chain */
            console.log(`${logPrefix} to be handled by ${this.getNext().getName()}`);

            responseCtx = await this.getNext().handle(requestCtx);

            /* Cache resource if and only if rendering mode is SSR */
            if (responseCtx?.renderingMode === RenderingMode.SSR) {
                if (this.doCache(requestCtx, responseCtx)) {
                    console.log(`${logPrefix} cached`);
                }
            } else {
                console.log(`${logPrefix} is not cacheable. Rendering mode is '${responseCtx?.renderingMode}'`);
            }
        } else {
            console.error(`${logPrefix} can not be fetched`);
        }

        /* Save analytics */
        requestCtx.event.waitUntil(this.analytics(requestCtx, responseCtx));

        return responseCtx;
    }

    /**
     * Gets the name of this handler.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Gets the log prefix to be used on request handler logging.
     * @param requestCtx the request context.
     * @protected
     */
    protected getLogPrefix(requestCtx: RequestCtx): string {
        const {request, attempt} = requestCtx;
        const url = new URL(request.url);
        const resource = [url.pathname, url.searchParams.toString()].filter(sp => sp !== '').join('?')

        return `[${this.name}][${attempt}] Request \'${resource}\'`;
    }

    /**
     * Fetches the response.
     *
     * @param {RequestCtx} requestCtx the request context;
     *
     * @return {ResponseCtx} a promise to the response context or undefined if not possible.
     */
    protected async fetch(requestCtx: RequestCtx): Promise<ResponseCtx | undefined> {

        const startTime = new Date();
        let response = await this.doFetch(requestCtx);
        const endTime = new Date();

        let responseCtx;
        if (response) {
            responseCtx = new ResponseCtxBuilder(requestCtx, response, this) //
                .setRenderingMode() //
                .setHeaders() //
                .setResponse() //
                .setDuration(startTime, endTime)
                .build();
        }

        return responseCtx;
    }

    /**
     * Effectively fetches the request.
     *
     * @param {RequestCtx} requestCtx the request context;
     *
     * @return {ResponseCtx} a promise to the response context or undefined if not possible.
     */
    protected abstract doFetch(requestCtx: RequestCtx): Promise<Response | undefined>;

    /**
     * Effectively caches the response.
     *
     * @param {RequestCtx} requestCtx the request context.
     * @param {ResponseCtx} responseCtx the response context.
     */
    protected abstract doCache(requestCtx: RequestCtx, responseCtx: ResponseCtx): boolean;

    /**
     * Register execution stats for further analysis.
     *
     * @param {RequestCtx} requestCtx the request context.
     * @param {ResponseCtx} responseCtx the response context.
     * @private
     */
    private analytics(requestCtx: RequestCtx, responseCtx: ResponseCtx | undefined) {

        // @ts-ignore
        const {cf} = requestCtx.request;
        // @ts-ignore<
        const {city, region, country, colo} = cf;

        return requestCtx.env.SSR_CACHE.writeDataPoint({
            'blobs': [
                requestCtx.request.headers.get(RequestHeaders.CF_RAY),
                requestCtx.request.url,
                responseCtx?.renderingMode,
                responseCtx?.response.headers.get(ResponseHeaders.CF_CACHE_STATUS),
                responseCtx?.response.headers.get(ResponseHeaders.X_DEBUG_SSR_SOURCE),
                city,
                region,
                country,
                colo
            ],
            'doubles': [
                requestCtx.attempt, //
                responseCtx?.duration, //
            ],
            'indexes': [
                this.getName(),
            ],
        });
    }
}