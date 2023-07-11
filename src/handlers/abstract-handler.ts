import {Handler} from './handler';
import {RequestContext} from '../context/beans/request-context'
import {RenderingMode, ResponseContext} from '../context/beans/response-context'
import {ResponseContextBuilder} from "../context/builders/response-context-builder";
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
     * @param requestContext the request context.
     */
    public async handle(requestContext: RequestContext): Promise<undefined | ResponseContext> {

        /* Try to fetch resource  */
        let responseContext = await this.fetch(requestContext);

        const logPrefix = this.getLogPrefix(requestContext, responseContext);

        const fetched = Boolean(responseContext);
        const expired = responseContext?.versionContext?.expired || false;

        if (fetched) {
            /* Resource fetched */
            console.log(`${logPrefix} fetched in ${responseContext?.duration} ms`);
        }

        if (expired) {
            /* Resource expired */
            console.log(`${logPrefix} expired ${JSON.stringify(responseContext?.versionContext.diff)}`);
        }

        if (!fetched || expired) {
            if (this.getNext()) {
                /* Resource cannot be fetched or is expired, try with next handler in chain */
                console.log(`${logPrefix} to be handled by ${this.getNext().getName()}`);

                const expiredResponseContext = responseContext;
                responseContext = await this.getNext().handle(requestContext);
                if (responseContext && expiredResponseContext) {
                    console.log(`${logPrefix} merging expired version`);
                    responseContext.merge(expiredResponseContext);
                }

                /* Cache resource if and only if rendering mode is SSR */
                if (responseContext?.renderingMode === RenderingMode.SSR) {
                    if (this.doCache(requestContext, responseContext)) {
                        console.log(`${logPrefix} cached`);
                    }
                } else {
                    console.log(`${logPrefix} is not cacheable. Rendering mode is '${responseContext?.renderingMode}'`);
                }
            } else {
                console.error(`${logPrefix} can not be fetched`);
            }
        }

        /* Save analytics */
        requestContext.event.waitUntil(this.analytics(requestContext, responseContext));

        return responseContext;
    }

    /**
     * Gets the name of this handler.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Gets the log prefix to be used on request handler logging.
     * @param requestContext the request context.
     * @param responseContext the response context.
     * @protected
     */
    protected getLogPrefix(requestContext: RequestContext, responseContext: ResponseContext | undefined = undefined): string {
        const {request, attempt} = requestContext;
        const url = new URL(request.url);
        const resource = [url.pathname, url.searchParams.toString()].filter(sp => sp !== '').join('?')

        return `[${this.name}][${attempt}][${responseContext?.response?.status || '---'}] Request \'${resource}\'`;
    }

    /**
     * Fetches the response.
     *
     * @param {RequestContext} requestContext the request context;
     *
     * @return {ResponseContext} a promise to the response context or undefined if not possible.
     */
    protected async fetch(requestContext: RequestContext): Promise<ResponseContext | undefined> {

        const startTime = new Date();
        let response = await this.doFetch(requestContext);
        const endTime = new Date();

        let responseContext;
        if (response) {
            const responseContextBuilder = new ResponseContextBuilder(requestContext, response, this);

            await responseContextBuilder.setVersions();

            responseContext = responseContextBuilder //
                .setRenderingMode() //
                .setHeaders() //
                .setResponse() //
                .setDuration(startTime, endTime) //
                .build();
        }

        return responseContext;
    }

    /**
     * Effectively fetches the request.
     *
     * @param {RequestContext} requestContext the request context;
     *
     * @return {ResponseContext} a promise to the response context or undefined if not possible.
     */
    protected abstract doFetch(requestContext: RequestContext): Promise<Response | undefined>;

    /**
     * Effectively caches the response.
     *
     * @param {RequestContext} requestContext the request context.
     * @param {ResponseContext} responseContext the response context.
     */
    protected abstract doCache(requestContext: RequestContext, responseContext: ResponseContext): boolean;

    /**
     * Register execution stats for further analysis.
     *
     * @param {RequestContext} requestContext the request context.
     * @param {ResponseContext} responseContext the response context.
     * @private
     */
    private analytics(requestContext: RequestContext, responseContext: ResponseContext | undefined) {

        // @ts-ignore
        const {cf} = requestContext.request;
        // @ts-ignore<
        const {city, region, country, colo} = cf;

        return requestContext.env.SSR_CACHE.writeDataPoint({
            'blobs': [
                requestContext.request.headers.get(RequestHeaders.CF_RAY),
                requestContext.request.url,
                responseContext?.renderingMode,
                responseContext?.response.headers.get(ResponseHeaders.CF_CACHE_STATUS),
                responseContext?.response.headers.get(ResponseHeaders.X_DEBUG_HANDLER),
                city,
                region,
                country,
                colo,
                requestContext.request.headers.get(RequestHeaders.USER_AGENT), // 20230711
            ],
            'doubles': [
                requestContext.attempt, //
                responseContext?.duration, //
                responseContext?.response.status // 20230711
            ],
            'indexes': [
                this.getName(),
            ],
        });
    }
}