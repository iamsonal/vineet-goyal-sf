import type { Fragment, Luvio } from '@luvio/engine';
import type {
    ResourceRequestConfig,
    select as generatedSelect,
} from '../../../generated/resources/getUiApiRecordDefaultsTemplateCloneByRecordId';
import { selectFields } from '../../../generated/fields/resources/getUiApiRecordDefaultsTemplateCloneByRecordId';

export const select: typeof generatedSelect = (
    luvio: Luvio,
    params: ResourceRequestConfig
): Fragment => {
    let { optionalFields } = params.queryParams;
    optionalFields =
        optionalFields === undefined ? ['.CloneSourceId'] : [...optionalFields, '.CloneSourceId'];

    return selectFields(luvio, {
        ...params,
        queryParams: {
            ...params.queryParams,
            optionalFields,
        },
    });
};
