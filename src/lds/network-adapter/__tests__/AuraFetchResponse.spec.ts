import { AuraFetchResponse } from '../AuraFetchResponse';

describe('FetchResponse', () => {
    it('should set status and body properties during construction', () => {
        const response = new AuraFetchResponse(200, { message: 'test' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'test' });
    });

    describe('ok getter', () => {
        it('returns true if the status is 200', () => {
            const okResponse = new AuraFetchResponse(200, {});
            expect(okResponse.ok).toBe(true);
        });

        it('returns false if the status is not 200', () => {
            const notOkResponse = new AuraFetchResponse(400, {});
            expect(notOkResponse.ok).toBe(false);
        });
    });

    describe('statusText getter', () => {
        [[200, 'OK'], [304, 'Not Modified'], [404, 'Not Found'], [400, 'Bad Request']].forEach(
            ([statusCode, statusText]) => {
                it(`returns "${statusText}" for ${statusCode} responses`, () => {
                    const response = new AuraFetchResponse(statusCode as number, {});
                    expect(response.statusText).toBe(statusText);
                });
            }
        );
    });
});
