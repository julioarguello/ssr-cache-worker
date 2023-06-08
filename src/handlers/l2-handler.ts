import {AbstractHandler} from './abstract-handler';
import {RequestContext} from '../context/beans/request-context'
import {CacheLevel, ResponseContext} from '../context/beans/response-context'
import {match, put} from './r2-support';

/**
 * Cache level 2 implementation.
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
     * @param requestContext the request context.
     * @private
     */
    private static calculateCacheKey(requestContext: RequestContext): string {
        const url = new URL(requestContext.request.url);
        url.searchParams.sort();

        return `${url.hostname}${requestContext.env.R2_PREFIX}${url.pathname}/${url.searchParams.toString()}` //
            .replaceAll(/[?&=]/g, '/')
            .replaceAll(/\/$/g, ''); // Remove trailing slash
    }

    /**
     * Gets the R2 bucket configured as cache.
     *
     * @param requestContext the request context.
     * @private
     */
    private static getCache(requestContext: RequestContext): R2Bucket {
        return requestContext.env.R2_BUCKET
    }

    /**
     * Matches a given request with handler cache.
     *
     * @param requestContext the request context.
     */
    protected async doFetch(requestContext: RequestContext): Promise<Response | undefined> {
        return await match(requestContext, L2Handler.getCache(requestContext), L2Handler.calculateCacheKey(requestContext));
    }

    /**
     * Put HTTP response to R2.
     *
     * @param {RequestContext} requestContext the request context.
     * @param {ResponseContext} responseContext the response context.
     */
    protected doCache(requestContext: RequestContext, responseContext: ResponseContext) {

        // Register a promise that must complete before the worker will stop running, but without affecting locking the
        // response to the client
        requestContext.event.waitUntil(//
            put(requestContext, responseContext, L2Handler.getCache(requestContext), L2Handler.calculateCacheKey(requestContext)));

        return true;
    }
}