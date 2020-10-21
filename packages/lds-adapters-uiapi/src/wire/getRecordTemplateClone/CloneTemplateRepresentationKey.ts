import { keyPrefix } from '../../generated/adapters/adapter-utils';
import { RecordDefaultsTemplateCloneRepresentation } from '../../generated/types/RecordDefaultsTemplateCloneRepresentation';

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
        (config.recordTypeId === null ? '' : config.recordTypeId)
    );
}

export function keyBuilderFromType(object: RecordDefaultsTemplateCloneRepresentation): string {
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
