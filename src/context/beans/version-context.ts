/** @module proxy/beans/version */
import {VersionContextBuilder} from "../builders/version-context-builder";

/**
 * The version context.
 */
export class VersionContext {
    public live: Record<string, number>;
    public expired: boolean;
    public diff: Record<string, number>;
    public persisted: Record<string, number>;
    public rDiff: Record<string, number>;

    /**
     * Constructs a version context using all available properties.
     *
     * @param builder {VersionContextBuilder} a version context builder.
     */
    constructor(builder: VersionContextBuilder) {
        this.persisted = builder.persisted;
        this.live = builder.live;
        this.diff = builder.diff;
        this.rDiff = builder.rDiff;
        this.expired = builder.expired;
    }

    /**
     * Merges former version context into this one.
     *
     * @param expiredVersionContext the former version context from a different handler.
     */
    merge(expiredVersionContext: VersionContext) {
        this.live = expiredVersionContext.live || this.live;
        this.expired ||= expiredVersionContext.expired;
        this.diff = expiredVersionContext.diff || this.diff;
        this.persisted = expiredVersionContext.persisted || this.persisted;
        this.rDiff = expiredVersionContext.rDiff || this.rDiff;

        return this;
    }
}