import {VersionContext} from '../beans/version-context';
import {RequestContext} from '../beans/request-context';
import * as Versions from '../../version/versions';
import * as Utils from '../../common/utils';
import {ResponseHeaders} from "../../common/response-headers";

/**
 * Builds version contexts from a request context.
 */
export class VersionContextBuilder {
    persisted!: Record<string, number>;
    live!: Record<string, number>;
    diff!: Record<string, number>;
    rDiff!: Record<string, number>;
    expired!: boolean;
    private readonly requestContext: RequestContext;
    private readonly response: Response;

    /**
     * Constructs a `VersionContextBuilder` given a DPC context.
     *
     * @param requestContext the request context
     * @param response the http response (do note this builder might be called
     * without a response context set into DPC context yet)
     */
    constructor(requestContext: RequestContext, response: Response) {
        if (!requestContext.request) throw 'invalid request context';
        if (!requestContext.env) throw 'invalid environment';

        this.requestContext = requestContext;
        this.response = response;
    }

    /**
     * Sets the persisted version for a given response.
     *
     * @returns {VersionContextBuilder} `this`.
     */
    setPersisted() {
        this.persisted = Versions.getPersistedVersion(this.response);
        return this;
    }

    /**
     * Sets the difference between persisted and live versions.
     *
     * @returns {VersionContextBuilder} `this`.
     */
    setDiff() {
        if (!this.live) throw 'invalid live version';

        this.diff = Utils.diff(this.persisted, this.live);

        return this;
    }

    /**
     * Sets the difference between live and persisted versions.
     *
     * @returns {VersionContextBuilder} `this`.
     */
    setRDiff() {
        // if (!this.persisted) throw 'invalid persisted version';

        this.rDiff = Utils.diff(this.live, this.persisted);

        return this;
    }

    /**
     * Sets the live version for a given response.
     *
     * @returns {VersionContextBuilder} `this`.
     */
    async setLive() {
        if (!this.requestContext.request) throw 'invalid request';

        this.live = await Versions.getLiveVersion(
            this.requestContext.request,
            this.response,
            this.requestContext.env);

        return this;
    }

    /**
     * Sets whether the persisted version is expired.
     *
     * @returns {VersionContextBuilder} `this`.
     */
    setExpired() {
        if (!this.diff) throw 'invalid versions diff';

        this.expired = Boolean(this.persisted) && (Object.keys(this.diff).length !== 0);

        if (!this.expired && this.response.headers.has(ResponseHeaders.EXPIRES)) {
            const now = new Date();
            const expires = new Date(this.response.headers.get(ResponseHeaders.EXPIRES) || now);

            this.expired = (expires.getTime() < now.getTime());
        }

        return this;
    }

    /**
     * Builds the version context.
     *
     * @returns {VersionContext}  the version context.
     */
    build() {
        return new VersionContext(this);
    }
}