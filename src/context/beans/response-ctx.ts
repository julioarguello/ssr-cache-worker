import {ResponseCtxBuilder} from '../builders/response-ctx-builder';
import {Handler} from "../../handlers/handler";
import {VersionCtx} from "./version-ctx";

/**
 * Rendering mode.
 *
 * @type {{SSR: string, CSR: string, NOT: string}}
 */
export const RenderingMode = {
    SSR: 'SSR',
    CSR: 'CSR',
    NOT: 'NOT',
};

/**
 * Source.
 *
 * @type {{L0: string, L1: string, L2: string, L3: string}}
 */
export const CacheLevel = {
    L0: 'L0',
    L1: 'L1',
    L2: 'L2',
    L3: 'L3',
};

/**
 * The response context.
 */
export class ResponseCtx {
    public response: Response;
    public source: Handler;
    public renderingMode: string;
    public duration: number;
    public versionContext: VersionCtx;


    /**
     * Constructs a response context using all available properties.
     *
     * @param builder {ResponseCtxBuilder}
     */
    constructor(builder: ResponseCtxBuilder) {
        this.response = builder.response;
        this.source = builder.source;
        this.renderingMode = builder.renderingMode;
        this.duration = builder.duration;
        this.versionContext = builder.versionContext;
    }
}
