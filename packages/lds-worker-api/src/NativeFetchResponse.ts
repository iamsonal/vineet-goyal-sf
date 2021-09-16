import { FetchResponse, HttpStatusCode, Headers } from '@luvio/engine';

export const NATIVE_ERROR_CODE = 'NATIVE_ERROR';

export class NativeFetchResponse<T> implements FetchResponse<T> {
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
            case HttpStatusCode.Created:
                return 'Created';
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

export function createNonMutatingAdapterErrorResponse(
    message: string = 'adapterId must be a mutating adapter'
) {
    return new NativeFetchResponse(HttpStatusCode.BadRequest, {
        errorCode: NATIVE_ERROR_CODE,
        message: message,
    });
}

export function createDraftNotCreatedErrorResponse(
    message: string = 'the adapter did not generate a draft'
) {
    return new NativeFetchResponse(HttpStatusCode.BadRequest, {
        errorCode: NATIVE_ERROR_CODE,
        message: message,
    });
}
