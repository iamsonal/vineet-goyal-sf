import { DurableStoreChange } from '@luvio/environments';

export const DefaultDurableSegment = 'DEFAULT';

export function isObject<K>(value: unknown): value is Partial<K> {
    return typeof value === 'object' && value !== null && Array.isArray(value) === false;
}

export function hasObjectInfoChanges(changes: DurableStoreChange[]) {
    const applicableChanges = changes.filter((change) => {
        return change.segment === DefaultDurableSegment && change.type === 'setEntries';
    });

    for (let index = 0; index < applicableChanges.length; index++) {
        const element = applicableChanges[index];
        if (
            //TODO [W-10451833] hardcoded ObjectInfoRepresentation should go away by moving to GQL schema
            element.ids.filter((id) => id.startsWith('UiApi::ObjectInfoRepresentation')).length > 0
        ) {
            return true;
        }
    }

    return false;
}
