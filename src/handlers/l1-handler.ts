import {AbstractHandler} from './abstract-handler';
import {RequestCtx} from '../context/beans/request-ctx'
import {ResponseCtx, CacheLevel} from '../context/beans/response-ctx'

/**
 * Cache level 1 () implementation.
 *
 * @param {RequestCtx} requestCtx the http request context.
 * @return {Promise<ResponseCtx>} a promise to the response context.
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
     * @param requestCtx the request context.
     * @protected
     */
    protected async doFetch(requestCtx: RequestCtx): Promise<Response | undefined> {

        // Check whether the value is already available in the cache
        // if not, you will need to fetch it from origin, and store it in the cache for future access
        return await L1Handler.getCache().match(requestCtx.request);
    }

    /**
     * Caches the response. Always returns true.
     *
     * @param {RequestCtx} requestCtx the request context.
     * @param {ResponseCtx} responseCtx the response context.
     */
    protected doCache(requestCtx: RequestCtx, responseCtx: ResponseCtx) {
        // Register a promise that must complete before the worker will stop running, but without affecting locking the
        // response to the client
        requestCtx.event.waitUntil(L1Handler.getCache().put(requestCtx.request, responseCtx.response.clone()));

        return true;
    }
}