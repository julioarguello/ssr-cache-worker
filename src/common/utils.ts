/**
 * Parses `edge-control` header.
 *
 * @param str {string} the value of the custom HTTP response header `edge-control`
 * @returns {{}} an object with on property per header attribute.
 */
export const parseEdgeControlHeader = (str: string) => <Record<string, string>>(str || '')//
    .split(',')//
    .map(v => v.split('=')) //
    .reduce((acc: Record<string, any>, v) => {
        let name = v[0].trim();
        let value = v.length === 2 ? v[1].trim() : '';

        acc[decodeURIComponent(name)] = decodeURIComponent(value);
        return acc;
    }, {});

/**
 * Compares two objects.
 *
 * @param src the source object.
 * @param tgt the target object.
 * @returns {Record<string, any>} an object with the properties at target object whose values are different from source object.
 */
export const diff = function (src: Record<string, any>, tgt: Record<string, any>) {

    src = src || {};
    tgt = tgt || {};

    return Object.keys(tgt)//
        .reduce((acc: Record<string, any>, key) => {
            const srcVal = String(src[key]);
            const tgtVal = String(tgt[key]);

            if (!tgtVal.startsWith(srcVal)) {
                acc[key] = tgtVal;
            }
            return acc;
        }, {});
};
