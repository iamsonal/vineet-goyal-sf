/* istanbul ignore file */
// TODO - W-9051409 this file and the idea of composite property retrievers
// can go away once we get rid of resolveUnfulfilledSnapshot

import { ResourceRequest, ResourceResponse } from '@luvio/engine';
import { ResponsePropertyRetriever } from '@luvio/environments';
import {
    BatchRepresentation,
    RecordRepresentation,
    keyBuilderFromTypeRecord,
} from '@salesforce/lds-adapters-uiapi';

const getRecordsPropertyRetriever: ResponsePropertyRetriever<
    BatchRepresentation,
    RecordRepresentation
> = {
    canRetrieve(request: ResourceRequest) {
        const { basePath, method } = request;
        const recordIds = request.urlParams['recordIds'] as [] | undefined;
        return (
            method === 'get' &&
            recordIds !== undefined &&
            basePath === '/ui-api/records/batch/' + recordIds.join(',') + ''
        );
    },
    retrieve(response: ResourceResponse<BatchRepresentation>) {
        return response.body.results.map(result => {
            const data = result.result as RecordRepresentation;
            return { cacheKey: keyBuilderFromTypeRecord(data), data };
        });
    },
};

export { getRecordsPropertyRetriever };
