import { FetchResponse, HttpStatusCode, Headers } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';

export class DraftFetchResponse<T> implements FetchResponse<T> {
    status: HttpStatusCode;
    body: T;
    headers: Headers = {};

    constructor(status: HttpStatusCode, body: T) {
        this.status = status;
        this.body = body;
    }

    get statusText(): string {
        const { status } = this;

        switch (status) {
            case HttpStatusCode.Ok:
                return 'OK';
            case HttpStatusCode.NoContent:
                return 'No Content';
            case HttpStatusCode.BadRequest:
                return 'Bad Request';
            case HttpStatusCode.ServerError:
                return 'Server Error';
            default:
                return `Unexpected HTTP Status Code: ${status}`;
        }
    }

    get ok(): boolean {
        return this.status >= 200 && this.status < 300;
    }
}

export function createOkResponse(
    body: RecordRepresentation
): DraftFetchResponse<RecordRepresentation> {
    return new DraftFetchResponse(HttpStatusCode.Ok, body);
}

export function createBadRequestResponse(body: unknown) {
    return new DraftFetchResponse(HttpStatusCode.BadRequest, body);
}

export function createDeletedResponse(): DraftFetchResponse<void> {
    return new DraftFetchResponse(HttpStatusCode.NoContent, undefined);
}

export function createInternalErrorResponse() {
    return new DraftFetchResponse(HttpStatusCode.ServerError, undefined);
}
