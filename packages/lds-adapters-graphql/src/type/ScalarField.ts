import type { Reader } from '@luvio/engine';

export function readScalarFieldSelection(
    builder: Reader<any>,
    source: any,
    fieldName: string,
    sink: any
) {
    const gqlData = source[fieldName];
    if (gqlData !== undefined && gqlData !== null && gqlData.__ref !== undefined) {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error(
                `Scalar requested at "${fieldName}" but is instead an object at "${gqlData.__ref}"`
            );
        }
    }
    builder.readScalar(fieldName, source, sink);
}
