import { keyPrefix } from '../../generated/adapters/adapter-utils';
import { RecordTemplateCloneRepresentation } from '../../generated/types/RecordTemplateCloneRepresentation';

export interface KeyParams {
    cloneSourceId: string;
    recordTypeId: string | null;
}

export function keyBuilder(config: KeyParams): string {
    return (
        keyPrefix +
        'RecordDefaultsTemplateCloneRepresentation:' +
        config.cloneSourceId +
        ':' +
        (config.recordTypeId === null ? '' : config.recordTypeId) +
        '__record'
    );
}

export function keyBuilderFromType(object: RecordTemplateCloneRepresentation): string {
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
