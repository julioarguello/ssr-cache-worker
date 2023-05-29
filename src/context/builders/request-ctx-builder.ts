import {RequestCtx} from '../beans/request-ctx';
import {DEFAULTS, Env} from "../../env";

/**
 * Builds request contexts from a http request.
 */
export class RequestCtxBuilder {
    request: Request;
    readonly env: any;
    event: ExecutionContext;

    /**
     * Constructs a `RequestContextBuilder` given a http request.
     *
     * @param request {Request} the request.
     * @param env {} string key-value bindings.
     * @param {ExecutionContext} event the event.
     */
    constructor(request: Request, env: Env, event: ExecutionContext) {
        if (!request) throw 'invalid request';

        this.request = request;
        this.env = env;
        this.event = event;
    }

    /**
     * Adapts the original request by setting right host and removing silly params.
     *
     * @return {RequestCtxBuilder} `this`.
     */
    setRequest() {
        const originUrl = new URL(this.request.url);
        originUrl.host = this.env.ORIGIN_HOST || DEFAULTS.ORIGIN_HOST;
        originUrl.protocol = this.env.ORIGIN_PROTOCOL || DEFAULTS.ORIGIN_PROTOCOL;
        originUrl.port = this.env.ORIGIN_PORT || DEFAULTS.ORIGIN_PORT;

        const trackingParams = this.env.TRACKING_PARAMS
            ? this.env.TRACKING_PARAMS.split(',')
            : DEFAULTS.TRACKING_PARAMS;

        trackingParams.forEach((param: string) => {
            if (originUrl.searchParams.has(param)) {
                originUrl.searchParams.delete(param);
            }
        });

        this.request = new Request(originUrl.toString(), this.request);

        return this;
    }

    /**
     * Builds a request context.
     *
     * @returns {RequestCtx} the request context.
     */
    build() {
        return new RequestCtx(this);
    }
}
