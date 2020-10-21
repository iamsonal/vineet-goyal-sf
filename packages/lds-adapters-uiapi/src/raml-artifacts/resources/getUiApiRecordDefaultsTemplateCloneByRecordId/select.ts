import { Fragment, LDS } from '@ldsjs/engine';
import {
    ResourceRequestConfig,
    select as generatedSelect,
} from '../../../generated/resources/getUiApiRecordDefaultsTemplateCloneByRecordId';
import { select as objectInfoRepresentationSelect } from '../../../generated/types/ObjectInfoRepresentation';
import { buildSelectionFromFields } from '../../../selectors/recordTemplate';

export const select: typeof generatedSelect = (
    lds: LDS,
    params: ResourceRequestConfig
): Fragment => {
    const objectInfoSelections = objectInfoRepresentationSelect();

    let { optionalFields } = params.queryParams;
    optionalFields =
        optionalFields === undefined ? ['.CloneSourceId'] : [...optionalFields, '.CloneSourceId'];
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
