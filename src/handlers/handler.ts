import {RequestContext} from '../context/beans/request-context'
import {ResponseContext} from '../context/beans/response-context'

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
     * @param {RequestContext} requestContext the request context.
     *
     * @return {Promise<ResponseContext>} a promise to the response context.
     */
    handle(requestContext: RequestContext): Promise<ResponseContext | undefined>;
}