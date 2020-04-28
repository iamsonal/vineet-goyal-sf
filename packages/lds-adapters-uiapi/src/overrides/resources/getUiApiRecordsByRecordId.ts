import {
    ResourceRequestConfig,
    select,
    keyBuilder,
    ingestSuccess,
    ingestError,
    createResourceRequest as generatedCreateResourceRequest,
} from '../../generated/resources/getUiApiRecordsByRecordId';
import { default as helpers_resources_getRecordFulfill_default } from '../../helpers/resources/getRecordFulfill';
export { ResourceRequestConfig, select, keyBuilder, ingestSuccess, ingestError };

export const createResourceRequest: typeof generatedCreateResourceRequest = function getUiApiRecordsByRecordIdCreateResourceRequest(
    config: ResourceRequestConfig
) {
    return {
        ...generatedCreateResourceRequest(config),
        fulfill: helpers_resources_getRecordFulfill_default,
    };
};

export default createResourceRequest;
