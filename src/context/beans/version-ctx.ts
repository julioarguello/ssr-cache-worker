/** @module proxy/beans/version */
import {VersionCtxBuilder} from "../builders/version-ctx-builder";

/**
 * The version context.
 */
export class VersionCtx {
    public live: Record<string, number>;
    public expired: boolean;
    public diff: Record<string, number>;
    public persisted: Record<string, number>;
    public rDiff: Record<string, number>;

    /**
     * Constructs a version context using all available properties.
     *
     * @param builder {VersionCtxBuilder} a version context builder.
     */
    constructor(builder: VersionCtxBuilder) {
        this.persisted = builder.persisted;
        this.live = builder.live;
        this.diff = builder.diff;
        this.rDiff = builder.rDiff;
        this.expired = builder.expired;
    }

    /**
     * Merges former version context into this one.
     *
     * @param expiredVersionCtx the former version context from a different handler.
     */
    merge(expiredVersionCtx: VersionCtx) {
        this.live = expiredVersionCtx.live || this.live;
        this.expired ||= expiredVersionCtx.expired;
        this.diff = expiredVersionCtx.diff || this.diff;
        this.persisted = expiredVersionCtx.persisted || this.persisted;
        this.rDiff = expiredVersionCtx.rDiff || this.rDiff;

        return this;
    }
}