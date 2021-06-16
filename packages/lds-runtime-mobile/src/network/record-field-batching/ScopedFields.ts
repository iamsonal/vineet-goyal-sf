/**
 * related-list-records/batch fields and optional fields could be like below.
 * /ui-api/related-list-records/batch/001R0000006l1xKIAQ/Contacts,Opportunities?
 * optionalFields=Contacts:Contact.Id,Contact.Name;Opportunities:Opportunity.Id
 *
 * the pattern is [{relativeListId}:{[fields]};{relativeListId}:{[fields]}]
 */
import { MAX_STRING_LENGTH_PER_CHUNK } from './utils';
import { ArrayPrototypeJoin } from '../../utils/language';

const SEPARATOR_BETWEEN_SCOPES = ';';
const SEPARATOR_BETWEEN_SCOPE_AND_FIELDS = ':';
const SEPARATOR_BETWEEN_FIELDS = ',';
const UNSCOPED_IDENTIFIER = 'unscoped';

export class ScopedFields {
    scope: string;
    fields: Record<string, true> = {};

    constructor(scope: string, fields: Array<string>) {
        this.scope = scope;
        for (let i = 0, len = fields.length; i < len; i += 1) {
            this.fields[fields[i]] = true;
        }
    }

    isUnScoped(): boolean {
        return this.scope === UNSCOPED_IDENTIFIER;
    }

    addField(field: string) {
        this.fields[field] = true;
    }

    addFields(fields: Array<string>) {
        fields.forEach(this.addField, this);
    }

    toQueryParameterValue(): string {
        const joinedFields = ArrayPrototypeJoin.call(
            Object.keys(this.fields),
            SEPARATOR_BETWEEN_FIELDS
        );
        return this.isUnScoped()
            ? joinedFields
            : ArrayPrototypeJoin.call(
                  [this.scope, joinedFields],
                  SEPARATOR_BETWEEN_SCOPE_AND_FIELDS
              );
    }

    toQueryParams(): string | string[] {
        return this.isUnScoped() ? Object.keys(this.fields) : this.toQueryParameterValue();
    }

    /**
     * parse Contacts:Contact.Id,Contact.Name into a QueryFields
     */
    static fromQueryParameterValue(paramValue: string): ScopedFields | undefined {
        if (paramValue === null || paramValue === '') return;
        const scopeToFields = paramValue.split(SEPARATOR_BETWEEN_SCOPE_AND_FIELDS);

        if (scopeToFields.length === 1) {
            //unscoped
            return new ScopedFields(
                UNSCOPED_IDENTIFIER,
                scopeToFields[0].split(SEPARATOR_BETWEEN_FIELDS)
            );
        } else if (scopeToFields.length === 2) {
            const scope = scopeToFields[0];
            const fields = scopeToFields[1];
            if (scope === undefined || fields === null) return;
            return new ScopedFields(scope, fields.split(SEPARATOR_BETWEEN_FIELDS));
        } else {
            return;
        }
    }
}

export class ScopedFieldsCollection {
    listIdToFieldsMap: Record<string, ScopedFields> = {};

    /**
     * merge the from ScopedFieldsCollection into current one
     * @param from
     */
    merge(from: ScopedFieldsCollection) {
        const { listIdToFieldsMap } = from;
        const scopes = Object.keys(listIdToFieldsMap);
        for (let i = 0, len = scopes.length; i < len; i += 1) {
            const scope = scopes[i];
            const scopedFields = listIdToFieldsMap[scope];

            const existingScopedFields = this.listIdToFieldsMap[scope];
            if (existingScopedFields) {
                existingScopedFields.addFields(Object.keys(scopedFields.fields));
            } else {
                this.listIdToFieldsMap[scope] = scopedFields;
            }
        }
    }

    toQueryParams(): string | string[] {
        return this.countOfUnScoped() > 0
            ? this.listIdToFieldsMap[UNSCOPED_IDENTIFIER].toQueryParams()
            : this.toQueryParameterValue();
    }

    /**
     * convert to query parameter value
     * @returns
     */
    toQueryParameterValue(): string {
        let result: string[] = [];
        const scopes = Object.keys(this.listIdToFieldsMap);
        for (let i = 0, len = scopes.length; i < len; i += 1) {
            const chunk = this.listIdToFieldsMap[scopes[i]].toQueryParameterValue();
            if (chunk !== undefined) result.push(chunk);
        }
        return ArrayPrototypeJoin.call(result, SEPARATOR_BETWEEN_SCOPES);
    }

    /**
     * split the ScopedFields into multiple ScopedFields
     * which there max fields list length will not exceeded the specified maxLength
     * @param maxLength
     */
    split(maxLength: number = MAX_STRING_LENGTH_PER_CHUNK): Array<ScopedFieldsCollection> {
        const size = this.size();
        if (size > maxLength) {
            const fieldsArray: Array<Array<string>> = [];
            const scopes = Object.keys(this.listIdToFieldsMap);
            for (let i = 0, len = scopes.length; i < len; i += 1) {
                const { scope, fields } = this.listIdToFieldsMap[scopes[i]];
                Object.keys(fields).forEach((field) => {
                    fieldsArray.push([scope, field]);
                });
            }

            // Formula:  # of fields per chunk = floor( max length per chunk / avg field length)
            const averageFieldStringLength = size / fieldsArray.length;
            const fieldsPerChunk = Math.floor(maxLength / averageFieldStringLength);

            let j = fieldsPerChunk;
            let result: Array<ScopedFieldsCollection> = [];
            let current: ScopedFieldsCollection | null = null;
            for (let i = 0, len = fieldsArray.length; i < len; i += 1) {
                const scope = fieldsArray[i][0];
                const field = fieldsArray[i][1];
                if (current === null || !current.listIdToFieldsMap[scope]) {
                    j = fieldsPerChunk;
                    current = new ScopedFieldsCollection();
                    current.listIdToFieldsMap[scope] = new ScopedFields(scope, [field]);
                    result.push(current);
                } else {
                    current.listIdToFieldsMap[scope].addField(field);
                }
                j--;
                if (j === 0) {
                    current = null;
                }
            }
            return result;
        } else if (size > 0) {
            return [this];
        } else {
            return [];
        }
    }

    size(): number {
        return this.toQueryParameterValue().length;
    }

    countOfUnScoped(): number {
        let count = 0;
        const fieldsArray = Object.values(this.listIdToFieldsMap);
        for (let i = 0, len = fieldsArray.length; i < len; i += 1) {
            if (fieldsArray[i].isUnScoped()) {
                count++;
            }
        }
        return count;
    }

    countOfScoped(): number {
        return Object.keys.length - this.countOfUnScoped();
    }

    isUnScopedMixedWithScoped(): boolean {
        return this.countOfUnScoped() > 0 && this.countOfScoped() > 0;
    }

    /**
     *
     * @param paramValue like Contacts:Contact.Id,Contact.Name;Opportunities:Opportunity.Id
     * @returns
     */
    static fromQueryParameterValue(paramValue: String | null): ScopedFieldsCollection {
        const result = new ScopedFieldsCollection();
        if (paramValue) {
            const relativeListChunks = paramValue.split(SEPARATOR_BETWEEN_SCOPES);
            if (relativeListChunks.length === 0) return result;

            for (let i = 0, len = relativeListChunks.length; i < len; i += 1) {
                const parsed = ScopedFields.fromQueryParameterValue(relativeListChunks[i]);
                if (parsed) {
                    result.listIdToFieldsMap[parsed.scope] = parsed;
                }
            }
            if (result.isUnScopedMixedWithScoped()) {
                throw Error('mixing scoped and unscoped field list is not allowed.');
            }
        }
        return result;
    }
}
