import {VersionCtx} from '../beans/version-ctx';
import {RequestCtx} from '../beans/request-ctx';
import * as Versions from '../../version/versions';
import * as Utils from '../../common/utils';
import {DynamicObject} from "../../common/utils";

/**
 * Builds version contexts from a request context.
 */
export class VersionCtxBuilder {
    persisted!: DynamicObject;
    live!: DynamicObject;
    diff!: DynamicObject;
    rDiff!: DynamicObject;
    expired!: boolean;
    private readonly requestContext: RequestCtx;
    private readonly response: Response;

    /**
     * Constructs a `VersionContextBuilder` given a DPC context.
     *
     * @param requestContext the request context
     * @param response the http response (do note this builder might be called
     * without a response context set into DPC context yet)
     */
    constructor(requestContext: RequestCtx, response: Response) {
        if (!requestContext.request) throw 'invalid request context';
        if (!requestContext.env) throw 'invalid environment';

        this.requestContext = requestContext;
        this.response = response;
    }

    /**
     * Sets the persisted version for a given response.
     *
     * @returns {VersionCtxBuilder} `this`.
     */
    setPersisted() {
        this.persisted = Versions.getPersistedVersion(this.response);
        return this;
    }

    /**
     * Sets the difference between persisted and live versions.
     *
     * @returns {VersionCtxBuilder} `this`.
     */
    setDiff() {
        if (!this.live) throw 'invalid live version';

        this.diff = Utils.diff(this.persisted, this.live);

        return this;
    }

    /**
     * Sets the difference between live and persisted versions.
     *
     * @returns {VersionCtxBuilder} `this`.
     */
    setRDiff() {
        // if (!this.persisted) throw 'invalid persisted version';

        this.rDiff = Utils.diff(this.live, this.persisted);

        return this;
    }

    /**
     * Sets the live version for a given response.
     *
     * @returns {VersionCtxBuilder} `this`.
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
     * @returns {VersionCtxBuilder} `this`.
     */
    setExpired() {
        if (!this.diff) throw 'invalid versions diff';

        this.expired = Boolean(this.persisted) && (Object.keys(this.diff).length !== 0);
        return this;
    }

    /**
     * Builds the version context.
     *
     * @returns {VersionCtx}  the version context.
     */
    build() {
        return new VersionCtx(this);
    }
}