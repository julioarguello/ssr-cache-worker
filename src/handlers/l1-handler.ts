import {AbstractHandler} from './abstract-handler';
import {RequestContext} from '../context/beans/request-context'
import {ResponseContext, CacheLevel} from '../context/beans/response-context'

/**
 * Cache level 1 implementation.
 *
 * @see [FetchEvent](https://developers.cloudflare.com/workers/runtime-apis/fetch-event#syntax-module-worker)
 */
export class L1Handler extends AbstractHandler {

    /**
     * Constructs the L1 cache.
     *
     * https://developers.cloudflare.com/workers/runtime-apis/cache/
     */
    constructor() {
        super(CacheLevel.L1);
    }

    /**
     * Returns `caches.default` cache region.
     */
    private static getCache(): Cache {
        return caches.default;
    }

    /**
     * Matches a given request with handler cache.
     *
     * @param requestContext the request context.
     * @protected
     */
    protected async doFetch(requestContext: RequestContext): Promise<Response | undefined> {

        // Check whether the value is already available in the cache
        // if not, you will need to fetch it from origin, and store it in the cache for future access
        return await L1Handler.getCache().match(requestContext.request);
    }

    /**
     * Caches the response. Always returns true.
     *
     * @param {RequestContext} requestContext the request context.
     * @param {ResponseContext} responseContext the response context.
     */
    protected doCache(requestContext: RequestContext, responseContext: ResponseContext) {
        // Register a promise that must complete before the worker will stop running, but without affecting locking the
        // response to the client
        requestContext.event.waitUntil(L1Handler.getCache().put(requestContext.request, responseContext.response.clone()));

        return true;
    }
}