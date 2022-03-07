import type { PathSelection } from '@luvio/engine';
import type { RecordFieldTrie } from '../util/records';
import type { RecordRepresentation } from '../generated/types/RecordRepresentation';
import { dynamicSelect } from '../generated/types/RecordRepresentation';
import type { FieldMapRepresentation } from '../util/fields';
import {
    createPathSelection,
    createPathSelectionFromValue,
    convertRecordFieldsArrayToTrie,
} from '../util/fields';

const CHILD_RELATIONSHIP_SELECTION: PathSelection = {
    // We don't support RecordRep.childRelationships because it has a nasty
    // degenerate case of multiple pages of child records
    kind: 'Object',
    name: 'childRelationships',
};

// This selection is a client-side only selection and will only
// be applied to a RecordRepresentation in environments configured with
// drafts when the record has draft changes applied to it
// TODO [W-8237087]: explore if this selection can only be added in environments where drafts are enabled
const DRAFTS_SELECTION: PathSelection = {
    kind: 'Object',
    opaque: true,
    name: 'drafts',
    required: false,
};

export function isSpanningRecord(
    fieldValue: null | string | number | boolean | RecordRepresentation
): fieldValue is RecordRepresentation {
    return fieldValue !== null && typeof fieldValue === 'object';
}

export function createRecordSelection(fieldDefinition: RecordFieldTrie): PathSelection[] {
    const sel = dynamicSelect({
        childRelationships: CHILD_RELATIONSHIP_SELECTION,
        fields: createPathSelection('fields', fieldDefinition),
    });
    return [...sel.selections, DRAFTS_SELECTION];
}

/**
 * Convert a list of fields and optional fields into RecordRepresentation its equivalent
 * selection.
 */
export function buildSelectionFromFields(
    fields: string[],
    optionalFields: string[] = []
): PathSelection[] {
    return createRecordSelection(convertRecordFieldsArrayToTrie(fields, optionalFields));
}

/**
 * Convert a RecordRepresentationLike into its equivalent selection.
 */
export function buildSelectionFromRecord(record: FieldMapRepresentation): PathSelection[] {
    const sel = dynamicSelect({
        childRelationships: CHILD_RELATIONSHIP_SELECTION,
        fields: createPathSelectionFromValue(record.fields),
    });
    return [...sel.selections, DRAFTS_SELECTION];
}
