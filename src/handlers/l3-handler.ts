import {AbstractHandler} from './abstract-handler';
import {RequestContext} from '../context/beans/request-context'
import {CacheLevel, ResponseContext} from '../context/beans/response-context'

/**
 * Cache level 3 implementation.
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
     * @param requestContext the request context.
     */
    protected async doFetch(requestContext: RequestContext) {

        return await fetch(requestContext.request.url, requestContext.request);
    }

    /**
     * This implementation is unable to cache anything, cache is managed in origin. So it always returns false.
     *
     * @param {RequestContext} requestContext the request context.
     * @param {ResponseContext} responseContext the response context.
     */
    protected doCache(requestContext: RequestContext, responseContext: ResponseContext) {
        return false;
    }
}