import { FetchResponse, HttpStatusCode, Headers } from '@luvio/engine';

export const DRAFT_ERROR_CODE = 'DRAFT_ERROR';

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

export function createOkResponse<T>(body: T): DraftFetchResponse<T> {
    return new DraftFetchResponse(HttpStatusCode.Ok, body);
}

export function createBadRequestResponse(body: unknown) {
    return new DraftFetchResponse(HttpStatusCode.BadRequest, body);
}

export function createDraftSynthesisErrorResponse() {
    return new DraftFetchResponse(HttpStatusCode.BadRequest, {
        errorCode: DRAFT_ERROR_CODE,
        message: 'failed to synthesize draft response',
    });
}

export function createDeletedResponse(): DraftFetchResponse<void> {
    return new DraftFetchResponse(HttpStatusCode.NoContent, undefined);
}

export function createInternalErrorResponse() {
    return new DraftFetchResponse(HttpStatusCode.ServerError, undefined);
}
