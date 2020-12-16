import { StoreLink } from '@luvio/engine';
import { ArrayPrototypePush, ObjectKeys } from '../../util/language';
import { RecordFieldTrie } from '../../util/records';
import { convertTrieToFields } from '../../util/records';
import { dedupe } from '../../validation/utils';

/**
 * Adds fields listed in the two trie parameters into the store link.
 * Functionally analogous to markNulledOutRequiredFields.
 * @param fieldsTrie
 * @param optionalFieldsTrie
 * @param storeLink
 */
export function addFieldsToStoreLink(
    fieldsTrie: RecordFieldTrie,
    optionalFieldsTrie: RecordFieldTrie,
    storeLink: StoreLink
) {
    let fields: string[] = [];
    const fieldSubtries = [] as RecordFieldTrie[];
    if (fieldsTrie) {
        ArrayPrototypePush.call(fieldSubtries, fieldsTrie);
    }
    if (optionalFieldsTrie) {
        ArrayPrototypePush.call(fieldSubtries, optionalFieldsTrie);
    }
    for (let i = 0; i < fieldSubtries.length; i++) {
        const subtrie = fieldSubtries[i];
        const fieldNames = ObjectKeys(subtrie.children);
        for (let i = 0; i < fieldNames.length; i++) {
            const fieldName = fieldNames[i];
            const childTrie = subtrie.children[fieldName];
            if (childTrie) {
                fields = [...fields, ...convertTrieToFields(childTrie)];
            }
        }
    }
    fields = dedupe(fields);
    if (fields.length > 0) {
        storeLink.data = {
            fields,
        };
    }
}
