/**
 * A persistent counter implemented on top of a durable object.
 */
export class Counter {
    private state: DurableObjectState;
    private value!: number;

    /**
     * Constructs a counter durable object.
     *
     * @param state the internal storage used by the durable object.
     */
    constructor(state: DurableObjectState) {
        this.state = state;

        // `blockConcurrencyWhile()` ensures no requests are delivered until initialization completes.
        this.state.blockConcurrencyWhile(async () => {
            this.value = await this.state.storage.get('value') || 0;
        }).then(r => r);
    }

    /**
     * Counter operations in a fetch like style.
     *
     * @param request the http request.
     */
    // Handle HTTP requests from clients.
    async fetch(request: Request) {
        // Apply requested action.
        let url = new URL(request.url);
        let oldValue = this.value;
        let newValue = this.value;
        switch (url.pathname) {
            case '/increment':
                newValue = ++this.value;
                await this.state.storage.put('value', this.value);
                console.log(`Counter incremented from '${oldValue}' to '${newValue}'`);
                break;
            case '/decrement':
                newValue = --this.value;
                await this.state.storage.put('value', this.value);
                console.log(`Counter decremented from '${oldValue}' to '${newValue}'`);
                break;
            case '/current':
            case '/':
                // Just serve the current value. No storage calls needed!
                break;
            default:
                return new Response('Not found', {status: 404});
        }

        // Return `currentValue`. Note that `this.value` may have been incremented or decremented by a concurrent
        // request when we yielded the event loop to `await` the `storage.put` above!
        // That's why we stored the counter value created by this request in `currentValue` before we used `await`.
        return new Response(String(newValue));
    }
}