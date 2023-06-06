/** @module proxy/beans/version */
import {VersionCtxBuilder} from "../builders/version-ctx-builder";

/**
 * The version context.
 */
export class VersionCtx {
    private persisted: string;
    private live: string;
    private diff: string;
    private expired: boolean;

    /**
     * Constructs a version context using all available properties.
     *
     * @param builder {VersionCtxBuilder} a version context builder.
     */
    constructor(builder: VersionCtxBuilder) {
        this.persisted = builder.persisted;
        this.live = builder.live;
        this.diff = builder.diff;
        this.expired = builder.expired;
    }
}