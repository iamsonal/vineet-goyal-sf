import { keyPrefix } from '../../generated/adapters/adapter-utils';
import { CloneTemplateRepresentation } from '../../generated/types/CloneTemplateRepresentation';

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
        (config.recordTypeId === null ? '' : config.recordTypeId)
    );
}

export function keyBuilderFromType(object: CloneTemplateRepresentation): string {
    let value =
        object.record &&
        object.record.fields &&
        object.record.fields.CloneSourceId &&
        object.record.fields.CloneSourceId.value;

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
        recordTypeId: object.record.recordTypeId,
    };
    return keyBuilder(keyParams);
}
