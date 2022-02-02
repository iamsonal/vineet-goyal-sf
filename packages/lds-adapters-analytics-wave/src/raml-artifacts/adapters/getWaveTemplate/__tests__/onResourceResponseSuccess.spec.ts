import { Environment, HttpStatusCode, Luvio, ResourceResponse, Store } from '@luvio/engine';
import { onResourceResponseSuccess as generatedOnResourceResponseSuccess } from '../../../../generated/adapters/getWaveTemplate';
import { TemplateRepresentation } from '../../../../generated/types/TemplateRepresentation';
import { templateApiName, templateNameToIdCache } from '../../../utils/templateNameToIdCache';
import { onResourceResponseSuccess } from '../onResourceResponseSuccess';

jest.mock('../../../../generated/adapters/getWaveTemplate', () => {
    return {
        onResourceResponseSuccess: jest.fn(),
    };
});

describe('onResourceResponseSuccess', () => {
    afterEach(() => {
        templateNameToIdCache.clear();
        jest.clearAllMocks();
    });

    const luvio = new Luvio(new Environment(new Store(), jest.fn()));

    [null, 'ns'].forEach((namespace: string | null) => {
        describe(`${namespace ? 'with' : 'without'} namespace`, () => {
            const mockTemplate: TemplateRepresentation = {
                assetVersion: 49,
                configurationUrl:
                    '/services/data/v55.0/wave/templates/0Nkxx0000004FICCA2/configuration',
                createdBy: null,
                createdDate: null,
                customAttributes: [],
                description: null,
                folderSource: null,
                icons: {
                    appBadge: null,
                    templateBadge: null,
                    templatePreviews: [],
                },
                id: '0Nkxx0000004FICCA2',
                label: 'checkWireAdapterRaml',
                lastModifiedBy: null,
                lastModifiedDate: '2022-01-05T23:20:19.000Z',
                name: 'checkWireAdapterRaml',
                namespace,
                releaseInfo: {
                    notesUrl: null,
                    templateVersion: '1.0',
                },
                tags: [],
                templateType: 'app',
                url: '/services/data/v55.0/wave/templates/0Nkxx0000004FICCA2',
                videos: [],
            };

            const mockResponse: ResourceResponse<TemplateRepresentation> = {
                status: HttpStatusCode.Ok,
                statusText: 'Ok',
                ok: true,
                headers: {},
                body: mockTemplate,
            };

            it('caches name when fetched by id', () => {
                const config = { templateIdOrApiName: mockTemplate.id };
                const resourceParams = {
                    urlParams: { templateIdOrApiName: mockTemplate.id },
                    queryParams: {},
                };
                onResourceResponseSuccess(luvio, config, resourceParams, mockResponse);

                expect(templateNameToIdCache.get(templateApiName(mockTemplate))).toEqual(
                    mockTemplate.id
                );
                expect(generatedOnResourceResponseSuccess).toHaveBeenCalledTimes(1);
                expect(generatedOnResourceResponseSuccess).toHaveBeenLastCalledWith(
                    luvio,
                    config,
                    resourceParams,
                    mockResponse
                );
            });

            it('caches id when fetched by name', () => {
                const config = { templateIdOrApiName: mockTemplate.name };
                onResourceResponseSuccess(
                    luvio,
                    config,
                    {
                        urlParams: { templateIdOrApiName: templateApiName(mockTemplate) },
                        queryParams: {},
                    },
                    mockResponse
                );

                expect(templateNameToIdCache.get(templateApiName(mockTemplate))).toEqual(
                    mockTemplate.id
                );
                expect(generatedOnResourceResponseSuccess).toHaveBeenCalledTimes(1);
                expect(generatedOnResourceResponseSuccess).toHaveBeenLastCalledWith(
                    luvio,
                    config,
                    { urlParams: { templateIdOrApiName: mockTemplate.id }, queryParams: {} },
                    mockResponse
                );
            });
        });
    });
});
