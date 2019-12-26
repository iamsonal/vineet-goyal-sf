import { keyBuilder, RecordRepresentation } from '../../generated/types/RecordRepresentation';

const VIEW_ENTITY_API_NAME = 'Name';
const VIEW_ENTITY_KEY_PREFIX = `UiApi::RecordViewEntityRepresentation:${VIEW_ENTITY_API_NAME}:`;

export default function polymorph(input: RecordRepresentation) {
    const { apiName, id } = input;
    if (apiName === VIEW_ENTITY_API_NAME) {
        return VIEW_ENTITY_KEY_PREFIX + id;
    }

    return keyBuilder({
        recordId: id,
    });
}
