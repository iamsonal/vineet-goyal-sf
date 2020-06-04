import { PathSelection } from '@ldsjs/engine';
import { ArrayPrototypeFilter } from '../util/language';
import {
    buildSelectionFromFields as record_buildSelectionFromFields,
    API_NAME_SELECTION,
    RECORD_TYPE_ID_SELECTION,
    FIELDS_SELECTION,
} from './record';

const topLevelTemplateRecordProperties = {
    [API_NAME_SELECTION.name]: true,
    [RECORD_TYPE_ID_SELECTION.name]: true,
    [FIELDS_SELECTION.name]: true,
};

/**
 * Convert a RecordCreateDefaultTemplateRecordRepresentation into its equivalent selection.
 */
export function buildSelectionFromFields(optionalFields: string[]): PathSelection[] {
    return ArrayPrototypeFilter.call(record_buildSelectionFromFields([], optionalFields), function(
        pathSelection: PathSelection
    ) {
        return topLevelTemplateRecordProperties[pathSelection.name] === true;
    });
}
