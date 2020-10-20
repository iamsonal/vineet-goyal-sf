import {
    ResourceRequestConfig,
    createResourceRequest as generatedCreateResourceRequest,
} from '../../../generated/resources/getUiApiRecordsByRecordId';
import { default as helpers_resources_getRecordFulfill_default } from '../../../helpers/resources/getRecordFulfill';

export const createResourceRequest: typeof generatedCreateResourceRequest = function getUiApiRecordsByRecordIdCreateResourceRequest(
    config: ResourceRequestConfig
) {
    return {
        ...generatedCreateResourceRequest(config),
        fulfill: helpers_resources_getRecordFulfill_default,
    };
};
