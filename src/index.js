import {Router} from 'itty-router';
import {RequestCtxBuilder} from './context/builders/request-ctx-builder';
import {CacheHandler} from './handlers/cache-handler';


// Create a new router
const router = Router();

/* Forbidden paths that cannot be cached */
router.all('/[a-z]{2}/(cart|order|login|my-account)*',
    async (request, env, event) => dftRenderer.fetch(request, env, event));

/* This is the last route we define, it will match anything that hasn't hit a route we've defined */
router.all('*',
    async (request, env, event) => ssrRenderer.fetch(request, env, event));

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
   * @param {any} env string key-value bindings.
   * @param {ExecutionContext} event the event.
   * @returns {Promise<Response>} the http response.
   *
   * @see [FetchEvent](https://developers.cloudflare.com/workers/runtime-apis/fetch-event#syntax-module-worker)
   */
  async fetch(request, env, event) {
    const allowedMethods = ['GET'];
    if (allowedMethods.indexOf(request.method) === -1) return new Response(
        'Method Not Allowed', {status: 405});

    const requestCtx = new RequestCtxBuilder(request, env, event).
        setRequest().
        build();

    let response;
    try {
      response = (await cacheHandler.handle(requestCtx))?.response;
    } catch (err) {
      // @ts-ignore
      const stack = JSON.stringify(err.stack) || err;

      // Copy the response and initialize body to the stack trace
      // @ts-ignore
      response = new Response(stack, {
        status: 500,
      });

      // Add the error stack into a header to find out what happened
      // @ts-ignore
      response.headers.set('x-debug-stack', stack);
      // @ts-ignore
      response.headers.set('x-debug-err', err);
    }

    // @ts-ignore
    return response;
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
   * @param {ExecutionContext} env string key-value bindings.
   * @param {ExecutionContext} event the event.
   * @returns {Promise<Response>} the http response.
   *
   * @see [FetchEvent](https://developers.cloudflare.com/workers/runtime-apis/fetch-event#syntax-module-worker)
   */
  async fetch(request, env, event) {
    return fetch(request);
  },
};

export default {
  fetch: router.handle,
};
