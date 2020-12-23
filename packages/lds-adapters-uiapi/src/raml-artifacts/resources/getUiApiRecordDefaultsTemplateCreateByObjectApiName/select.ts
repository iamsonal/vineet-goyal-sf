import {
    ResourceRequestConfig,
    select as generatedSelect,
} from '../../../generated/resources/getUiApiRecordDefaultsTemplateCreateByObjectApiName';
import { dynamicSelect } from '../../../generated/types/RecordDefaultsTemplateCreateRepresentation';
import { dynamicSelect as dynamicSelect__RecordTemplateCreateRepresentation } from '../../../generated/types/RecordTemplateCreateRepresentation';
import { createPathSelectionFromFieldsArray } from '../../../util/fields';
import { Luvio, Fragment } from '@luvio/engine';
export const select: typeof generatedSelect = (
    _luvio: Luvio,
    params: ResourceRequestConfig
): Fragment => {
    let { optionalFields } = params.queryParams;
    optionalFields = optionalFields === undefined ? [] : optionalFields;

    return dynamicSelect({
        record: {
            kind: 'Link',
            name: 'record',
            fragment: dynamicSelect__RecordTemplateCreateRepresentation({
                fields: createPathSelectionFromFieldsArray([], optionalFields),
            }),
        },
    });
};
