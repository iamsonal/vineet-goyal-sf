import {
    RecordRepresentation,
    keyBuilderFromType as generatedKeyBuilderFromType,
} from '../../../generated/types/RecordRepresentation';
import { keyPrefix } from '../../../generated/adapters/adapter-utils';

const VIEW_ENTITY_API_NAME = 'Name';
const VIEW_ENTITY_KEY_PREFIX = `${keyPrefix}RecordViewEntityRepresentation:${VIEW_ENTITY_API_NAME}:`;

export const keyBuilderFromType: typeof generatedKeyBuilderFromType =
    function RecordRepresentationKeyBuilderFromType(object: RecordRepresentation) {
        const { apiName, id } = object;
        if (apiName === VIEW_ENTITY_API_NAME) {
            return VIEW_ENTITY_KEY_PREFIX + id;
        }

        return generatedKeyBuilderFromType(object);
    };
