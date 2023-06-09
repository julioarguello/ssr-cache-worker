/**
 * Constants to be used across different files of this worker.
 */
export class RequestHeaders {

    /**
     * The CF-ray header (otherwise known as a Ray ID) is a hashed value that encodes information about the data center and the visitor’s request.
     *
     * [Cf-Ray](https://developers.cloudflare.com/fundamentals/get-started/reference/http-request-headers/#cf-ray)
     *
     * @type {string}
     */
    static readonly CF_RAY = 'cf-ray';

    /**
     * The If-Match HTTP request header makes a request conditional.
     *
     * [If-Match](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Match)
     *
     * @type {string}
     */
    static readonly IF_MATCH = 'if-match';

    /**
     * The If-None-Match HTTP request header makes the request conditional.
     *
     * [If-None_Match](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match)
     *
     * @type {string}
     */
    static readonly IF_NONE_MATCH = 'if-none-match';

    /**
     * The If-Modified-Since request HTTP header makes the request conditional-
     *
     * [If-Modified-Since](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since)
     *
     * @type {string}
     */
    static readonly IF_MODIFIED_SINCE = 'if-modified-since';

    /**
     * The If-Range HTTP request header makes a range request conditional.
     *
     * [If-Range](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Range)
     *
     * @type {string}
     */
    static readonly IF_RANGE = 'if-range';

    /**
     * The HyperText Transfer Protocol (HTTP) If-Unmodified-Since request header makes the request for the resource conditional.
     *
     * [If-Unmodified-Since](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Unmodified-Since)
     *
     * @type {string}
     */
    static readonly IF_UNMODIFIED_SINCE = 'if-unmodified-since';

    /**
     * The Range HTTP request header indicates the part of a document that the server should return.
     *
     * [Range](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range)
     *
     * @type {string}
     */
    static readonly RANGE = 'range';

    /**
     * The User-Agent request header is a characteristic string that lets servers and network peers identify the application,
     * operating system, vendor, and/or version of the requesting user agent.
     *
     * [User-Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent)
     *
     * @type {string}
     */
    static readonly USER_AGENT = 'user-agent';
}