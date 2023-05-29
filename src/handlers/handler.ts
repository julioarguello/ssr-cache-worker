import {RequestCtx} from '../context/beans/request-ctx'
import {ResponseCtx} from '../context/beans/response-ctx'

/**
 * The Handler interface declares a method for building the chain of handlers.
 * It also declares a method for executing a request.
 */
export interface Handler {

    /**
     * Gets the name of this handler.
     */
    getName(): string;

    /**
     * Set the next handler in chain.
     *
     * @param {Handler} handler the next handler in chain.
     */
    setNext(handler: Handler): Handler;

    /**
     * Handle a given request.
     *
     * @param {RequestCtx} requestCtx the request context.
     *
     * @return {Promise<ResponseCtx>} a promise to the response context.
     */
    handle(requestCtx: RequestCtx): Promise<ResponseCtx | undefined>;
}