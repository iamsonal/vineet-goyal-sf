import {
    ResourceRequestConfig,
    select as generatedSelect,
} from '../../../generated/resources/getUiApiRecordDefaultsTemplateCreateByObjectApiName';
import { selectFields } from '../../../generated/fields/resources/getUiApiRecordDefaultsTemplateCreateByObjectApiName';
import { Luvio, Fragment } from '@luvio/engine';
export const select: typeof generatedSelect = (
    _luvio: Luvio,
    params: ResourceRequestConfig
): Fragment => {
    return selectFields(params);
};
