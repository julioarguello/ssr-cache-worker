import {AbstractHandler} from './abstract-handler';
import {RequestCtx} from '../context/beans/request-ctx'
import {CacheLevel, ResponseCtx} from '../context/beans/response-ctx'

/**
 * Cache level 3 implementation.
 *
 * @param {RequestCtx} requestCtx the http request context.
 * @return {Promise<ResponseCtx>} a promise to the response context.
 *
 * @see [FetchEvent](https://developers.cloudflare.com/workers/runtime-apis/fetch-event#syntax-module-worker)
 */
export class L3Handler extends AbstractHandler {

    /**
     * Constructs the L3 cache.
     *
     * L3 represent Cloudflare origin.
     */
    constructor() {
        super(CacheLevel.L3);
    }

    /**
     * Fetches the response from origin.
     *
     * @param requestCtx the request context.
     */
    protected async doFetch(requestCtx: RequestCtx) {

        return await fetch(requestCtx.request.url, requestCtx.request);
    }

    /**
     * This implementation is unable to cache anything, cache is managed in origin. So it always returns false.
     *
     * @param {RequestCtx} requestCtx the request context.
     * @param {ResponseCtx} responseCtx the response context.
     */
    protected doCache(requestCtx: RequestCtx, responseCtx: ResponseCtx) {
        return false;
    }
}