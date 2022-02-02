import { Environment, FetchResponse, HttpStatusCode, Luvio, Store } from '@luvio/engine';
import { onResourceResponseError as generatedOnResourceResponseError } from '../../../../generated/adapters/getWaveTemplateReleaseNotes';
import { templateNameToIdCache } from '../../../utils/templateNameToIdCache';
import { onResourceResponseError } from '../onResourceResponseError';

jest.mock('../../../../generated/adapters/getWaveTemplateReleaseNotes', () => {
    return {
        onResourceResponseError: jest.fn(),
    };
});

describe('onResourceResponseError', () => {
    afterEach(() => {
        templateNameToIdCache.clear();
        jest.clearAllMocks();
    });

    const luvio = new Luvio(new Environment(new Store(), jest.fn()));

    const mockResponse: FetchResponse<unknown> = {
        status: HttpStatusCode.NotFound,
        statusText: 'Not Found',
        ok: false,
        headers: {},
        body: undefined,
    };

    it('clears name from cache', () => {
        const templateId = '0Nkxx0000004FICCA2';
        const templateName = 'ns__Foo';
        templateNameToIdCache.set(templateName, templateId);

        onResourceResponseError(
            luvio,
            { templateIdOrApiName: templateName },
            { urlParams: { templateIdOrApiName: templateName } },
            mockResponse
        );

        expect(templateNameToIdCache.get(templateName)).toBeUndefined();
        expect(generatedOnResourceResponseError).toHaveBeenCalled();
    });

    it('clears id from cache', () => {
        const templateId = '0Nkxx0000004FICCA2';
        const templateName = 'ns__Foo';
        templateNameToIdCache.set(templateName, templateId);

        onResourceResponseError(
            luvio,
            { templateIdOrApiName: templateId },
            { urlParams: { templateIdOrApiName: templateId } },
            mockResponse
        );

        expect(templateNameToIdCache.get(templateName)).toBeUndefined();
        expect(generatedOnResourceResponseError).toHaveBeenCalled();
    });
});
