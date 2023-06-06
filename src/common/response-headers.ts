/**
 * Constants to be used across different files of this worker.
 */
export class ResponseHeaders {
    /**
     * The Age header contains the time in seconds the object was in a proxy cache.
     *
     * @see [Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Age)
     *
     * @type {string}
     */
    static readonly AGE = 'age';

    /**
     * Well known `cache-control` response
     *
     * @see [HTTP header](https://developer.mozilla.org/es/docs/Web/HTTP/Headers/Cache-Control)
     *
     * @type {string}
     */
    static readonly CACHE_CONTROL = 'cache-control';

    /**
     * Well known `cd-cache-control` response
     *
     * @see [CDN-Cache-Control: Precision Control for your CDN(s)](https://developers.cloudflare.com/cache/concepts/cdn-cache-control/)
     * @see [HTTP header](https://blog.cloudflare.com/cdn-cache-control/)
     *
     * @type {string}
     */
    static readonly CDN_CACHE_CONTROL = 'cdn-cache-control';

    /**
     * A response header used for debugging at browser level edge caching status.
     *
     * Most common values are:
     *
     * - `BYPASS`
     * - `DYNAMIC`
     * - `HIT`
     *
     * @see [Understanding Cloudflare's CDN](https://support.cloudflare.com/hc/en-us/articles/200172516-Understanding-Cloudflare-s-CDN#h_a01982d4-d5b6-4744-bb9b-a71da62c160a)
     *
     * @type {string}
     */
    static readonly CF_CACHE_STATUS = 'cf-cache-status';

    /**
     * In a regular HTTP response, the Content-Disposition response header is a header indicating if the content is expected to be displayed inline in the browser, that is, as a Web page or as part of a Web page, or as an attachment, that is downloaded and saved locally.
     *
     * [Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition)
     *
     * @type {string}
     */
    static readonly CONTENT_DISPOSITION = 'Content-Disposition';

    /**
     * The Content-Encoding representation header lists any encodings that have been applied to the representation (message payload), and in what order.
     *
     * [Content-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding)
     *
     * @type {string}
     */
    static readonly CONTENT_ENCODING = 'Content-Encoding';

    /**
     * The Content-Language representation header is used to describe the language(s) intended for the audience, so users can differentiate it according to their own preferred language.
     *
     * [Content-Language](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Language)
     *
     * @type {string}
     */
    static readonly CONTENT_LANGUAGE = 'Content-Language';

    /**
     * The Content-Length header indicates the size of the message body, in bytes, sent to the recipient.
     *
     * [Content-Length](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length)
     *
     * @type {string}
     */
    static readonly CONTENT_LENGTH = 'Content-Length';

    /**
     * The Content-Range response HTTP header indicates where in a full body message a partial message belongs.
     *
     * [Content-Range](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range)
     *
     * @type {string}
     */
    static readonly CONTENT_RANGE = 'Content-Range';

    /**
     * The Content-Type representation header is used to indicate the original media type of the resource (prior to any content encoding applied for sending).
     *
     * [Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)
     *
     * @type {string}
     */
    static readonly CONTENT_TYPE = 'Content-Type';

    /**
     * The ETag (or entity tag) HTTP response header is an identifier for a specific version of a resource.
     *
     * [ETag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
     *
     * @type {string}
     */
    static readonly ETAG = 'etag';

    /**
     * The Expires HTTP header contains the date/time after which the response is considered expired.
     *
     * [Expires](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expires)
     *
     * @type {string}
     */
    static readonly EXPIRES = 'expires';

    /**
     * The Last-Modified response HTTP header contains a date and time when the origin server believes the resource was last modified.
     *
     * [Last-Modified](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified)
     *
     * @type {string}
     */
    static readonly LAST_MODIFIED = 'last-modified';

    /**
     * The Set-Cookie HTTP response header is used to send a cookie from the server to the user agent.
     *
     * [Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
     *
     * @type {string}
     */
    static readonly SET_COOKIE = 'set-cookie';

    /**
     * An ad hoc response header with useful SSR handling info for further troubleshooting.
     *
     * @type {string}
     */
    static readonly X_DEBUG_SSR = 'x-debug-ssr';

    /**
     * An ad hoc response header with useful SSR handling info for further troubleshooting.
     *
     * @type {string}
     */
    static readonly X_DEBUG_SSR_SOURCE = 'x-debug-ssr-source';

    /**
     * An ad hoc response header with useful cache versioning info for further troubleshooting.
     *
     * @type {string}
     */
    static readonly X_DEBUG_CACHE_VERSION = 'x-debug-cache-version';

    /**
     * An ad hoc response header with useful cache versioning info for further troubleshooting.
     *
     * @type {string}
     */
    static readonly X_DEBUG_CACHE_VERSION_CTX = 'x-debug-cache-version-ctx';

    /**
     * An ad hoc response header with useful error info for further troubleshooting.
     *
     * @type {string}
     */
    static readonly X_DEBUG_ERROR = 'x-debug-error';

    /**
     * An ad hoc response header with useful error stack for further troubleshooting.
     * @type {string}
     */
    static readonly X_DEBUG_ERROR_STACK = 'x-debug-error-stack';
}