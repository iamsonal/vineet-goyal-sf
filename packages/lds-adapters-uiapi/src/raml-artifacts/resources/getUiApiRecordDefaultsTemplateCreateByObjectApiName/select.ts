import {
    ResourceRequestConfig,
    select as generatedSelect,
} from '../../../generated/resources/getUiApiRecordDefaultsTemplateCreateByObjectApiName';
import { Luvio, Fragment } from '@luvio/engine';
import { select as objectInfoRepresentationSelect } from '../../../generated/types/ObjectInfoRepresentation';
import { buildSelectionFromFields } from '../../../selectors/recordTemplate';

export const select: typeof generatedSelect = (
    lds: Luvio,
    params: ResourceRequestConfig
): Fragment => {
    const objectInfoSelections = objectInfoRepresentationSelect();

    let { optionalFields } = params.queryParams;
    optionalFields = optionalFields === undefined ? [] : optionalFields;
    const recordSelections = buildSelectionFromFields(optionalFields);

    return {
        kind: 'Fragment',
        private: [],
        selections: [
            {
                kind: 'Link',
                name: 'objectInfos',
                map: true,
                fragment: objectInfoSelections,
            },
            {
                kind: 'Link',
                name: 'record',
                fragment: {
                    kind: 'Fragment',
                    private: [],
                    selections: recordSelections,
                },
            },
        ],
    };
};
