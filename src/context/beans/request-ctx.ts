import {RequestCtxBuilder} from '../builders/request-ctx-builder';
import {Env} from "../../env";

/**
 * The request context.
 */
export class RequestCtx {
    public request: Request;
    public env: Env;
    public event: ExecutionContext;
    public attempt: number;

    /**
     * Constructs a request context using all available properties.
     *
     * @param builder {RequestCtxBuilder}
     */
    constructor(builder: RequestCtxBuilder) {
        this.request = builder.request;
        this.env = builder.env;
        this.event = builder.event;
        this.attempt = 0;
    }

    /**
     * Increments the number of attempts made to fetch an SSR response from origin.
     *
     * @return {RequestCtx} `this`.
     */
    newAttempt() {
        this.attempt++;

        return this;
    }
}
