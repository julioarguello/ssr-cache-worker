import {RequestContextBuilder} from '../builders/request-context-builder';
import {Env} from "../../common/env";

/**
 * The request context.
 */
export class RequestContext {
    public request: Request;
    public env: Env;
    public event: ExecutionContext;
    public attempt: number;

    /**
     * Constructs a request context using all available properties.
     *
     * @param builder {RequestContextBuilder}
     */
    constructor(builder: RequestContextBuilder) {
        this.request = builder.request;
        this.env = builder.env;
        this.event = builder.event;
        this.attempt = 0;
    }

    /**
     * Increments the number of attempts made to fetch an SSR response from origin.
     *
     * @return {RequestContext} `this`.
     */
    newAttempt() {
        this.attempt++;

        return this;
    }
}
