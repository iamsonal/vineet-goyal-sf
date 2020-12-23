import { Fragment, Luvio } from '@luvio/engine';
import {
    ResourceRequestConfig,
    select as generatedSelect,
} from '../../../generated/resources/getUiApiRecordDefaultsTemplateCloneByRecordId';
import { selectFields } from '../../../generated/fields/resources/getUiApiRecordDefaultsTemplateCloneByRecordId';

export const select: typeof generatedSelect = (
    _luvio: Luvio,
    params: ResourceRequestConfig
): Fragment => {
    let { optionalFields } = params.queryParams;
    optionalFields =
        optionalFields === undefined ? ['.CloneSourceId'] : [...optionalFields, '.CloneSourceId'];

    return selectFields({
        ...params,
        queryParams: {
            ...params.queryParams,
            optionalFields,
        },
    });
};
