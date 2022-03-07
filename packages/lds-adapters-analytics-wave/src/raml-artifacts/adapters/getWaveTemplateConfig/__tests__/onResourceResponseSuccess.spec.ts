import { Environment, HttpStatusCode, Luvio, ResourceResponse, Store } from '@luvio/engine';
import { onResourceResponseSuccess as generatedOnResourceResponseSuccess } from '../../../../generated/adapters/getWaveTemplateConfig';
import { TemplateConfigurationRepresentation } from '../../../../generated/types/TemplateConfigurationRepresentation';
import { templateApiName, templateNameToIdCache } from '../../../utils/templateNameToIdCache';
import { onResourceResponseSuccess } from '../onResourceResponseSuccess';

jest.mock('../../../../generated/adapters/getWaveTemplateConfig', () => {
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
            const mockTemplateConfig: TemplateConfigurationRepresentation = {
                id: '0Nkxx0000004FICCA2',
                name: 'checkWireAdapterRaml',
                namespace,
                ui: { displayMessages: [], pages: [] },
                variables: {},
            };

            const mockResponse: ResourceResponse<TemplateConfigurationRepresentation> = {
                status: HttpStatusCode.Ok,
                statusText: 'Ok',
                ok: true,
                headers: {},
                body: mockTemplateConfig,
            };

            it('caches name when fetched by id', () => {
                const config = { templateIdOrApiName: mockTemplateConfig.id };
                const resourceParams = {
                    urlParams: { templateIdOrApiName: mockTemplateConfig.id },
                    queryParams: {},
                };
                onResourceResponseSuccess(luvio, config, resourceParams, mockResponse);

                expect(templateNameToIdCache.get(templateApiName(mockTemplateConfig))).toEqual(
                    mockTemplateConfig.id
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
                const config = { templateIdOrApiName: mockTemplateConfig.name };
                onResourceResponseSuccess(
                    luvio,
                    config,
                    {
                        urlParams: { templateIdOrApiName: templateApiName(mockTemplateConfig) },
                        queryParams: {},
                    },
                    mockResponse
                );

                expect(templateNameToIdCache.get(templateApiName(mockTemplateConfig))).toEqual(
                    mockTemplateConfig.id
                );
                expect(generatedOnResourceResponseSuccess).toHaveBeenCalledTimes(1);
                expect(generatedOnResourceResponseSuccess).toHaveBeenLastCalledWith(
                    luvio,
                    config,
                    { urlParams: { templateIdOrApiName: mockTemplateConfig.id }, queryParams: {} },
                    mockResponse
                );
            });
        });
    });
});
