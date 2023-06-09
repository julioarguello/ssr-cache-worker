import {RequestContext} from '../context/beans/request-context'
import {RenderingMode, ResponseContext, CacheLevel} from '../context/beans/response-context'
import {AbstractHandler} from "./abstract-handler";
import {L1Handler} from "./l1-handler";
import {L2Handler} from "./l2-handler";
import {L3Handler} from "./l3-handler";
import {RequestHeaders} from "../common/request-headers";

/**
 * All Concrete Handlers either handle a request or pass it to the next handler
 * in the chain.
 */

/**
 * First cache handler in chain.
 */
export class CacheHandler extends AbstractHandler {

    /**
     * Constructs the handler from next handlers in chain.
     */
    constructor() {
        super(CacheLevel.L0);

        const l0Handler = this;
        const l1Handler = new L1Handler();
        const l2Handler = new L2Handler();
        const l3Handler = new L3Handler();

        l0Handler.setNext(l1Handler);
        l1Handler.setNext(l2Handler);
        l2Handler.setNext(l3Handler);
    }

    /**
     * Adds a retry policy on top of super implementation for CSR responses.
     *
     * @param requestContext the request context.
     */
    public async handle(requestContext: RequestContext): Promise<ResponseContext | undefined> {
        const responseContext = await super.handle(requestContext);

        const csr = (responseContext?.renderingMode === RenderingMode.CSR);
        if (csr) {
            console.log(`${this.getLogPrefix(requestContext)} is CSR, retrying in background`);

            requestContext.request.headers.set(RequestHeaders.USER_AGENT, 'Googlebot'); // Force SSR in origin for retries

            // Register a promise that must complete before the worker will stop running, but without affecting locking
            // the response to the client
            requestContext.event.waitUntil(this.refresh(requestContext));
        }

        return responseContext;
    }

    /**
     * This implementation is unable to fetch anything. So it always delegates into subsequent handlers.
     *
     * @param requestContext the request context.
     * @protected
     */
    protected async doFetch(requestContext: RequestContext): Promise<Response | undefined> {
        return undefined;
    }

    /**
     * This implementation is unable to cache anything. So it always returns false.
     *
     * @param requestContext the request context.
     * @param responseContext the response context.
     * @protected
     */
    protected doCache(requestContext: RequestContext, responseContext: ResponseContext) {
        return false;
    }

    /**
     * Tries to cache a page whose last rendering attempt was CSR assuming subsequent fetch attempts after a
     * configurable timeout will hit origin cache.
     *
     * @param requestContext the http request context.
     * @private
     *
     * @see [Spartacus Server-Side Rendering Optimization](https://sap.github.io/spartacus-docs/server-side-rendering-optimization/)
     */
    private async refresh(requestContext: RequestContext) {

        const env = requestContext.env;

        const retries = env.SSR_RETRIES //
            .split(',') //
            .filter((ms: string) => ms !== 'null' && ms !== '') //
            .map((item: string) => parseInt(item));

        if (retries.length > requestContext.attempt) {
            const timeout = retries[requestContext.attempt]

            console.log(`${this.getLogPrefix(requestContext)} sleeping for ${timeout} ms`);
            await this.sleep(timeout);

            return this.handle(requestContext.newAttempt());
        }
    }

    /**
     * Sleeps worker for a given period of time.
     *
     * @param ms the timeout to sleep in milliseconds.
     * @return {Promise<unknown>}
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms,);
        });
    }
}