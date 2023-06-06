/**
 *  Environment specific bindings.
 */
export interface Env extends ExecutionContext {
    R2_BUCKET: R2Bucket,
    ORIGIN_HOST: string,
    ORIGIN_PROTOCOL: string,
    ORIGIN_PORT: number,
    TRACKING_PARAMS: string,
    FORCED_EDGE_CACHE_CONTROL: string,
    SSR_CACHE: any,
    SSR_RETRIES: string,
    R2_PREFIX: string,
    COUNTER: DurableObjectNamespace
}

/**
 * Default values for environment properties.
 */
export const DEFAULTS = {
    ORIGIN_HOST: 'www.ohgar.com',
    ORIGIN_PROTOCOL: 'https',
    ORIGIN_PORT: 443,
    TRACKING_PARAMS: [
        'gclid',
        'gclsrc',
        'fbclid',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content']
}
