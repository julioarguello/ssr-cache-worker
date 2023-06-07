import {RequestParams} from '../common/request-params'
import {ResponseHeaders} from '../common/response-headers'
import * as Utils from '../common/utils';
import {Env} from "../common/env";

/**
 * Get the version associated with a given tag and request.
 *
 * @param {string} tag the cache tag.
 * @param {Request} request the http request.
 * @param {Env} env string key-value bindings.
 * @returns {Promise<number>} the version.
 */
export const versions = async function (tag: string, request: Request, env: Env) {

    let counter = env.COUNTER;
    let id = counter.idFromName(tag);
    let obj = counter.get(id);

    let resp = await obj.fetch(request);

    return parseInt(await resp.text());
};

/**
 * Get the persisted version associated with a given response.
 *
 * @param {Response} response the http response.
 * @return {any|null} an object as result of parsing the cache version header.
 */
export const getPersistedVersion = function (response: Response) {
    const cacheVersionHeader = response.headers.get(ResponseHeaders.X_DEBUG_VERSION);

    return cacheVersionHeader ? JSON.parse(cacheVersionHeader).live : null;
};

/**
 * Gets the live version of a given resource.
 *
 * @param {Request} request the http request.
 * @param {Response} response the http response.
 * @param {Env} env string key-value bindings.
 * @param defaultTag the default tag if none.
 * @returns {Promise<{}>} live version.
 *
 * @see doGetLiveVersion
 */
export const getLiveVersion = async function (
    request: Request, response: Response, env: Env, defaultTag: string = 'default') {

    const edgeControlHeader = response.headers.get(ResponseHeaders.CDN_CACHE_CONTROL) || '';
    const edgeControl = Utils.parseEdgeControlHeader(edgeControlHeader);
    const tags = edgeControl[RequestParams.TAGS] ||
        new URL(request.url).searchParams.get(RequestParams.TAGS) || defaultTag;

    return await doGetLiveVersion(tags, env);
};

/**
 * Effective logic for getting the live version of some cache tags.
 *
 * @param tags the cache tags.
 * @param env string key-value bindings.
 * @return {Promise<{}>} an object with a property for tag with versions as values.
 */
const doGetLiveVersion = async function (tags: string, env: Env) {
    const tagArr = (tags || '').split('|');

    const result: Record<string, number> = {}

    for (const tag of tagArr) {
        result[tag] = await versions(tag, new Request('https://127.0.0.1/'), env);
    }
    return result;
};
