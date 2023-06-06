import {AbstractHandler} from './abstract-handler';
import {RequestCtx} from '../context/beans/request-ctx'
import {CacheLevel, ResponseCtx} from '../context/beans/response-ctx'
import {match, put} from './r2-support';

/**
 * Cache level 2 implementation.
 *
 * @param {RequestCtx} requestCtx the http request context.
 * @return {Promise<ResponseCtx>} a promise to the response context.
 */
export class L2Handler extends AbstractHandler {

    /**
     * Constructs the L2 cache.
     */
    constructor() {
        super(CacheLevel.L2);
    }

    /**
     * Calculates cache key from request URL.
     *
     * In addition to that uses an environment prefix to force invalidation of all the cache entries in case of issue.
     *
     * @param requestCtx the request context.
     * @private
     */
    private static calculateCacheKey(requestCtx: RequestCtx): string {
        const url = new URL(requestCtx.request.url);
        url.searchParams.sort();

        return `${url.hostname}${requestCtx.env.R2_PREFIX}${url.pathname}/${url.searchParams.toString()}` //
            .replaceAll(/[?&=]/g, '/')
            .replaceAll(/\/$/g, ''); // Remove trailing slash
    }

    /**
     * Gets the R2 bucket configured as cache.
     *
     * @param requestCtx the request context.
     * @private
     */
    private static getCache(requestCtx: RequestCtx): R2Bucket {
        return requestCtx.env.R2_BUCKET
    }

    /**
     * Matches a given request with handler cache.
     *
     * @param requestCtx the request context.
     */
    protected async doFetch(requestCtx: RequestCtx): Promise<Response | undefined> {
        return await match(requestCtx, L2Handler.getCache(requestCtx), L2Handler.calculateCacheKey(requestCtx));
    }

    /**
     * Put HTTP response to R2.
     *
     * @param {RequestCtx} requestCtx the request context.
     * @param {ResponseCtx} responseCtx the response context.
     */
    protected doCache(requestCtx: RequestCtx, responseCtx: ResponseCtx) {

        // Register a promise that must complete before the worker will stop running, but without affecting locking the
        // response to the client
        requestCtx.event.waitUntil(put(requestCtx, responseCtx, L2Handler.getCache(requestCtx), L2Handler.calculateCacheKey(requestCtx)));

        return true;
    }
}