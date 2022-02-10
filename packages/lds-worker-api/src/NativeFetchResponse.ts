import type { FetchResponse, Headers } from '@luvio/engine';
import { HttpStatusCode } from '@luvio/engine';

export const NATIVE_ERROR_CODE = 'NATIVE_ERROR';
export const NON_MUTATING_ADAPTER_MESSAGE = 'adapterId must be a mutating adapter';
export const NO_DRAFT_CREATED_MESSAGE = 'the adapter did not generate a draft';
export const DRAFT_DOESNT_EXIST_MESSAGE = 'the specified draft does not exist';

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

export function createNativeErrorResponse(message: string) {
    return new NativeFetchResponse(HttpStatusCode.BadRequest, {
        errorCode: NATIVE_ERROR_CODE,
        message: message,
    });
}
