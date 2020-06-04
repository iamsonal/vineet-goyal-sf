import {
    ResourceRequestConfig,
    select as generatedSelect,
    keyBuilder,
    ingestSuccess,
    ingestError,
    createResourceRequest,
} from '../../generated/resources/getUiApiRecordDefaultsTemplateCreateByObjectApiName';
import { LDS, Fragment } from '@ldsjs/engine';
import { select as objectInfoRepresentationSelect } from '../../generated/types/ObjectInfoRepresentation';
import { buildSelectionFromFields } from '../../selectors/recordTemplate';

export { ResourceRequestConfig, createResourceRequest, keyBuilder, ingestError, ingestSuccess };

export const select: typeof generatedSelect = (
    lds: LDS,
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

export default createResourceRequest;
