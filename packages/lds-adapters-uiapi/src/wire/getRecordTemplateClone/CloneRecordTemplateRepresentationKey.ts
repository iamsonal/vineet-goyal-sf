import { keyPrefix } from '../../generated/adapters/adapter-utils';
import { CloneRecordTemplateRepresentation } from '../../generated/types/CloneRecordTemplateRepresentation';

export interface KeyParams {
    cloneSourceId: string;
    recordTypeId: string | null;
}

export function keyBuilder(config: KeyParams): string {
    return (
        keyPrefix +
        'CloneTemplateRepresentation:' +
        config.cloneSourceId +
        ':' +
        (config.recordTypeId === null ? '' : config.recordTypeId) +
        '__record'
    );
}

export function keyBuilderFromType(object: CloneRecordTemplateRepresentation): string {
    let value = object.fields && object.fields.CloneSourceId && object.fields.CloneSourceId.value;
    if (typeof value !== 'string') {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error(
                'Invalid type. Expected "CloneSourceId" to be type "string" but got : ' + value
            );
        } else {
            value = '';
        }
    }

    const keyParams: KeyParams = {
        cloneSourceId: value,
        recordTypeId: object.recordTypeId,
    };
    return keyBuilder(keyParams);
}
