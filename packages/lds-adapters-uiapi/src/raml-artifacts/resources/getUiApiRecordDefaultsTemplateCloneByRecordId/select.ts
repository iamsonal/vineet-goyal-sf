import { Fragment, Luvio } from '@luvio/engine';
import {
    ResourceRequestConfig,
    select as generatedSelect,
} from '../../../generated/resources/getUiApiRecordDefaultsTemplateCloneByRecordId';
import { dynamicSelect } from '../../../generated/types/RecordDefaultsTemplateCloneRepresentation';
import { dynamicSelect as dynamicSelect__RecordTemplateCloneRepresentation } from '../../../generated/types/RecordTemplateCloneRepresentation';
import { createPathSelectionFromFieldsArray } from '../../../util/fields';

export const select: typeof generatedSelect = (
    _luvio: Luvio,
    params: ResourceRequestConfig
): Fragment => {
    let { optionalFields } = params.queryParams;
    optionalFields =
        optionalFields === undefined ? ['.CloneSourceId'] : [...optionalFields, '.CloneSourceId'];

    return dynamicSelect({
        record: {
            kind: 'Link',
            name: 'record',
            fragment: dynamicSelect__RecordTemplateCloneRepresentation({
                fields: createPathSelectionFromFieldsArray([], optionalFields),
            }),
        },
    });
};
