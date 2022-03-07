import type { FetchResponse, Headers } from '@luvio/engine';
import { HttpStatusCode } from '@luvio/engine';

export class AuraFetchResponse<T> implements FetchResponse<T> {
    status: HttpStatusCode;
    body: T;
    headers: Headers;

    constructor(status: HttpStatusCode, body: T, headers?: Headers) {
        this.status = status;
        this.body = body;
        this.headers = headers || {};
    }

    get statusText(): string {
        const { status } = this;

        switch (status) {
            case HttpStatusCode.Ok:
                return 'OK';
            case HttpStatusCode.NotModified:
                return 'Not Modified';
            case HttpStatusCode.NotFound:
                return 'Not Found';
            case HttpStatusCode.BadRequest:
                return 'Bad Request';
            case HttpStatusCode.ServerError:
                return 'Server Error';
            default:
                return `Unexpected HTTP Status Code: ${status}`;
        }
    }

    get ok(): boolean {
        return this.status === 200;
    }
}
