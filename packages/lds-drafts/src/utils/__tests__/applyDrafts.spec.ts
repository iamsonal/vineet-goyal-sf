import { StoreLink } from '@luvio/engine';
import {
    FieldValueRepresentationNormalized,
    keyBuilderRecord,
    RecordRepresentationNormalized,
} from '@salesforce/lds-adapters-uiapi';
import { buildRecordFieldStoreKey } from '@salesforce/lds-uiapi-record-utils';

import {
    createDeleteDraftAction,
    createEditDraftAction,
    createPostDraftAction,
} from '../../__tests__/test-utils';
import { applyDrafts, DraftRecordRepresentationNormalized } from '../applyDrafts';
import { createLink } from '../records';

const recordId = 'foo';
const recordKey = keyBuilderRecord({ recordId });
const fieldName = 'Name';
const fieldNameKey = buildRecordFieldStoreKey(recordKey, fieldName);
const fieldOwnerId = 'OwnerId';
const fieldOwnerKey = buildRecordFieldStoreKey(recordKey, fieldOwnerId);
const draftOwnerIdFieldValue = 'draft-ownerId';
const draftOwnerIdKey = keyBuilderRecord({ recordId: draftOwnerIdFieldValue });
const originalFieldValue = 'Justin';
const draftOneFieldValue = 'Jason';
const draftTwoFieldValue = 'Wes';
const userId = 'user-foo';
import OpportunityObjectInfo from './data/object-Opportunity.json';

function buildMockRecord() {
    return {
        apiName: 'Opportunity',
        fields: {
            Name: createLink(fieldNameKey),
            OwnerId: createLink(fieldOwnerKey),
        },
    } as unknown as RecordRepresentationNormalized;
}

describe('applyDrafts', () => {
    describe('draft node', () => {
        it('applies created value for create action', () => {
            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {},
                [createPostDraftAction(recordKey, recordId)],
                OpportunityObjectInfo,
                userId
            );

            const record = result[recordKey] as DraftRecordRepresentationNormalized;

            expect(record.drafts.created).toBe(true);
        });
        it('applies deleted value for delete action', () => {
            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {},
                [createDeleteDraftAction(recordKey, recordId)],
                OpportunityObjectInfo,
                userId
            );

            const record = result[recordKey] as DraftRecordRepresentationNormalized;

            expect(record.drafts.deleted).toBe(true);
        });
        it('applies the edited value for edit action', () => {
            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {},
                [createEditDraftAction(recordKey, recordId, draftOneFieldValue)],
                OpportunityObjectInfo,
                userId
            );

            const record = result[recordKey] as DraftRecordRepresentationNormalized;

            expect(record.drafts.edited).toBe(true);
        });

        it('populates draftActionIds', () => {
            const draftOne = createEditDraftAction(recordKey, recordId, draftOneFieldValue);
            const draftTwo = createEditDraftAction(recordKey, recordId, draftTwoFieldValue);
            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {},
                [draftOne, draftTwo],
                OpportunityObjectInfo,
                userId
            );

            const record = result[recordKey] as DraftRecordRepresentationNormalized;

            expect(record.drafts.draftActionIds).toEqual([draftOne.id, draftTwo.id]);
        });

        it('populates latestDraftActionId', () => {
            const draftOne = createEditDraftAction(recordKey, recordId, draftOneFieldValue);
            const draftTwo = createEditDraftAction(recordKey, recordId, draftTwoFieldValue);
            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {},
                [draftOne, draftTwo],
                OpportunityObjectInfo,
                userId
            );

            const record = result[recordKey] as DraftRecordRepresentationNormalized;

            expect(record.drafts.latestDraftActionId).toEqual(draftTwo.id);
        });

        it('populates serverValues', () => {
            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {
                    [fieldNameKey]: { value: originalFieldValue },
                },
                [createEditDraftAction(recordKey, recordId, draftOneFieldValue)],
                OpportunityObjectInfo,
                userId
            );

            const record = result[recordKey] as DraftRecordRepresentationNormalized;

            expect(record.drafts.serverValues['Name'].value).toBe(originalFieldValue);
        });

        it('populates original serverValue when multiple drafts edit it', () => {
            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {
                    [fieldNameKey]: { value: originalFieldValue },
                },
                [
                    createEditDraftAction(recordKey, recordId, draftOneFieldValue),
                    createEditDraftAction(recordKey, recordId, draftTwoFieldValue),
                ],
                OpportunityObjectInfo,
                userId
            );

            const record = result[recordKey] as DraftRecordRepresentationNormalized;

            expect(record.drafts.serverValues['Name'].value).toBe(originalFieldValue);
        });

        it('preserves original serverValues if drafts already exist on record', () => {
            let mockRecord = buildMockRecord();
            mockRecord.drafts = { serverValues: { Name: { value: originalFieldValue } } };

            const result = applyDrafts(
                recordKey,
                mockRecord,
                {
                    [fieldNameKey]: { value: draftOneFieldValue },
                },
                [
                    createEditDraftAction(recordKey, recordId, draftOneFieldValue),
                    createEditDraftAction(recordKey, recordId, draftTwoFieldValue),
                ],
                OpportunityObjectInfo,
                userId
            );

            const record = result[recordKey] as DraftRecordRepresentationNormalized;

            expect(record.drafts.serverValues['Name'].value).toBe(originalFieldValue);
        });
    });

    describe('draft record metadata', () => {
        it('applies lastModifiedDate to RecordRepresentation', () => {
            const timestamp = Date.now();

            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {},
                [createEditDraftAction(recordKey, recordId, draftOneFieldValue, timestamp)],
                OpportunityObjectInfo,
                userId
            );

            const record = result[recordKey] as DraftRecordRepresentationNormalized;
            expect(record.lastModifiedDate).toBe(new Date(timestamp).toISOString());
        });
        it('applies lastModifiedById to RecordRepresentation', () => {
            const timestamp = Date.now();

            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {},
                [createEditDraftAction(recordKey, recordId, draftOneFieldValue, timestamp)],
                OpportunityObjectInfo,
                userId
            );

            const record = result[recordKey] as DraftRecordRepresentationNormalized;
            expect(record.lastModifiedById).toBe(userId);
        });
        it('updates the LastModifiedDate field', () => {
            const timestamp = Date.now();

            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {},
                [createEditDraftAction(recordKey, recordId, draftOneFieldValue, timestamp)],
                OpportunityObjectInfo,
                userId
            );

            const field = result[
                buildRecordFieldStoreKey(recordKey, 'LastModifiedDate')
            ] as FieldValueRepresentationNormalized;
            expect(field.value).toBe(new Date(timestamp).toISOString());
        });
        it('updates the LastModifiedById field', () => {
            const timestamp = Date.now();

            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {},
                [createEditDraftAction(recordKey, recordId, draftOneFieldValue, timestamp)],
                OpportunityObjectInfo,
                userId
            );

            const field = result[
                buildRecordFieldStoreKey(recordKey, 'LastModifiedById')
            ] as FieldValueRepresentationNormalized;
            expect(field.value).toBe(userId);
        });
    });

    describe('relationships', () => {
        it('updates the lookup value', () => {
            const action = createEditDraftAction(recordKey, recordId);
            action.data.body.fields = {
                ...action.data.body.fields,
                OwnerId: draftOwnerIdFieldValue,
            };

            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {},
                [action],
                OpportunityObjectInfo,
                userId
            );

            const field = result[
                buildRecordFieldStoreKey(recordKey, 'OwnerId')
            ] as FieldValueRepresentationNormalized;
            expect(field.value).toBe(draftOwnerIdFieldValue);
        });
        it('updates the relationship link', () => {
            const action = createEditDraftAction(recordKey, recordId);
            action.data.body.fields = {
                ...action.data.body.fields,
                OwnerId: draftOwnerIdFieldValue,
            };

            const result = applyDrafts(
                recordKey,
                buildMockRecord(),
                {},
                [action],
                OpportunityObjectInfo,
                userId
            );

            const record = result[recordKey] as DraftRecordRepresentationNormalized;

            expect(record.fields['Owner']).toEqual(
                createLink(buildRecordFieldStoreKey(recordKey, 'Owner'))
            );

            const field = result[
                buildRecordFieldStoreKey(recordKey, 'Owner')
            ] as FieldValueRepresentationNormalized;
            expect((field.value as StoreLink).__ref).toBe(draftOwnerIdKey);
        });
    });
});
