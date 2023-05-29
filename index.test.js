import {unstable_dev} from 'wrangler';
import {describe, expect, it, beforeAll, afterAll} from 'vitest';

describe('Worker', () => {
	let worker;

	const random = Math.random();

	beforeAll(async () => {
		worker = await unstable_dev('index.js', {},
				{disableExperimentalWarning: true});
	});

	afterAll(async () => {
		await worker.stop();
	});

	it('should return index route response', async () => {
		const resp = await worker.fetch(`/es?test=${random}`);
		if (resp) {

			expect(resp.headers.get('cf-cache-status')).toBe(`BYPASS`);
		}
	});
});
