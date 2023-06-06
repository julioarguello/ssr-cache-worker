/**
 *
 */
export class Counter {
    private state: DurableObjectState;
    private value!: number;

    /**
     * Constructs a counter durable object.
     *
     * @param state {DurableObjectState} the internal storage used by the durable object.
     */
    constructor(state: DurableObjectState) {
        this.state = state;

        // `blockConcurrencyWhile()` ensures no requests are delivered until initialization completes.
        this.state.blockConcurrencyWhile(async () => {
            this.value = await this.state.storage.get('value') || 0;
        }).then(r => r);
    }

    // Handle HTTP requests from clients.
    async fetch(request: Request) {
        // Apply requested action.
        let url = new URL(request.url);
        let currentValue = this.value;
        switch (url.pathname) {
            case '/increment':
                currentValue = ++this.value;
                await this.state.storage.put('value', this.value);
                break;
            case '/decrement':
                currentValue = --this.value;
                await this.state.storage.put('value', this.value);
                break;
            case '/':
                // Just serve the current value. No storage calls needed!
                break;
            default:
                return new Response('Not found', {status: 404});
        }

        // Return `currentValue`. Note that `this.value` may have been
        // incremented or decremented by a concurrent request when we
        // yielded the event loop to `await` the `storage.put` above!
        // That's why we stored the counter value created by this
        // request in `currentValue` before we used `await`.
        return new Response(String(currentValue));
    }
}