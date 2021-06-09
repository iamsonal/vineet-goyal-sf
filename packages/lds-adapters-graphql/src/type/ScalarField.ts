import { Reader } from '@luvio/engine';

export function readScalarFieldSelection(
    builder: Reader<any>,
    source: any,
    fieldName: string,
    sink: any
) {
    const gqlData = source[fieldName];
    if (gqlData !== undefined && gqlData !== null && gqlData.__ref !== undefined) {
        throw new Error(
            `Scalar requested at "${fieldName}" but is instead an object at "${gqlData.__ref}"`
        );
    }
    builder.readScalar(fieldName, source, sink);
}
