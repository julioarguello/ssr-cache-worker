/** @module proxy/beans/version */
import {VersionCtxBuilder} from "../builders/version-ctx-builder";
import {DynamicObject} from "../../common/utils";

/**
 * The version context.
 */
export class VersionCtx {
    public live: DynamicObject;
    public expired: boolean;
    public diff: DynamicObject;
    private persisted: DynamicObject;
    private rDiff: DynamicObject;

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
}