import { keyBuilder, RecordRepresentation } from '../../generated/types/RecordRepresentation';
import { keyPrefix } from '../../generated/adapters/adapter-utils';
const VIEW_ENTITY_API_NAME = 'Name';
const VIEW_ENTITY_KEY_PREFIX = `${keyPrefix}RecordViewEntityRepresentation:${VIEW_ENTITY_API_NAME}:`;

export default function polymorph(input: RecordRepresentation) {
    const { apiName, id } = input;
    if (apiName === VIEW_ENTITY_API_NAME) {
        return VIEW_ENTITY_KEY_PREFIX + id;
    }

    return keyBuilder({
        recordId: id,
    });
}
