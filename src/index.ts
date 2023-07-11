import {Router} from 'itty-router';
import {RequestContextBuilder} from './context/builders/request-context-builder';
import {CacheHandler} from './handlers/cache-handler';
import {ResponseHeaders} from './common/response-headers';
import {versions} from "./version/versions";
import {Env} from './common/env';

// In order for the workers runtime to find the class that implements
// our Durable Object namespace, we must export it from the root module.
export {Counter} from './version/counter'

// Create a new router
const router = Router();

/* Forbidden paths that cannot be cached */
router.all('/ssr/tags/:tag/:operation',
    async (request: Request, env: Env, event: ExecutionContext) => tagRenderer.fetch(request, env, event));

/* Forbidden paths that cannot be cached */
router.all('/[a-z]{2}/(cart|order|login|my-account|wishlist|checkout)*',
    async (request: Request, env: Env, event: ExecutionContext) => dftRenderer.fetch(request, env, event));

/* This is the last route we define, it will match anything that hasn't hit a route we've defined */
router.all('*',
    async (request: Request, env: Env, event: ExecutionContext) => ssrRenderer.fetch(request, env, event));

const cacheHandler = new CacheHandler();

/**
 * Handler to render and cache SPA pages.
 *
 * Honors cache headers sent by origin.
 *
 * @author [Julio Argüello](mailto:jarguello@seidor.com)
 * @since 20230114
 */
const ssrRenderer = {
    /**
     * Forwards a given request to origin forcing cache honoring origin headers.
     *
     * @param {Request} request the http request.
     * @param {Env} env string key-value bindings.
     * @param event the event.
     * @returns {Promise<Response>} the http response.
     *
     * @see [FetchEvent](https://developers.cloudflare.com/workers/runtime-apis/fetch-event#syntax-module-worker)
     */
    fetch: async function (request: Request, env: Env, event: ExecutionContext) {
        const allowedMethods = ['GET'];
        if (allowedMethods.indexOf(request.method) === -1) return new Response(
            'Method Not Allowed', {status: 405});

        const requestContext = new RequestContextBuilder(request, env, event) //
            .setRequest() //
            .build();

        let response;
        try {
            response = (await cacheHandler.handle(requestContext))?.response;
        } catch (err) {
            const error = <Error>err;
            const stack = JSON.stringify(error.stack);

            // Copy the response and initialize body to the stack trace
            response = new Response(stack, {
                status: 500,
            });

            // Add the error stack into a header to find out what happened
            response.headers.set(ResponseHeaders.X_DEBUG_ERROR_STACK, stack);
            response.headers.set(ResponseHeaders.X_DEBUG_ERROR, error.message || String(err));
        }

        return response;
    },
};

/**
 * Handler to manage cache tags.
 *
 * @author [Julio Argüello](mailto:jarguello@seidor.com)
 * @since 20230606
 */
const tagRenderer = {

    /**
     * Forwards a given request to origin AS IS.
     *
     * @param {Request} request the http request.
     * @param {Env} env string key-value bindings.
     * @param event the event.
     * @returns {Promise<Response>} the http response.
     *
     * @see [FetchEvent](https://developers.cloudflare.com/workers/runtime-apis/fetch-event#syntax-module-worker)
     */
    async fetch(request: Request, env: Env, event: ExecutionContext) {

        // @ts-ignore
        const {tag, operation} = request.params;

        const count = await versions(tag, new Request(`https://127.0.0.1/${operation}`, request), env);

        return new Response(`${count}`);
    },
};

/**
 * Handler to fetch requests from origin without any additional treatment.
 *
 *
 * @author [Julio Argüello](mailto:jarguello@seidor.com)
 * @since 20230121
 */
const dftRenderer = {

    /**
     * Forwards a given request to origin AS IS.
     *
     * @param {Request} request the http request.
     * @param {Env} env string key-value bindings.
     * @param event the event.
     * @returns {Promise<Response>} the http response.
     *
     * @see [FetchEvent](https://developers.cloudflare.com/workers/runtime-apis/fetch-event#syntax-module-worker)
     */
    async fetch(request: Request, env: Env, event: ExecutionContext) {
        return fetch(request);
    },
};

export default {
    fetch: router.handle
};
