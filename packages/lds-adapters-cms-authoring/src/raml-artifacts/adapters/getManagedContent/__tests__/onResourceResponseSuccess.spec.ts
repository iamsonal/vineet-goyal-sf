import { Environment, HttpStatusCode, Luvio, ResourceResponse, Store } from '@luvio/engine';
import { onResourceResponseSuccess as generatedOnResourceResponseSuccess } from '../../../../generated/adapters/getManagedContent';
import { ManagedContentDocumentRepresentation } from '../../../../generated/types/ManagedContentDocumentRepresentation';
import { onResourceResponseSuccess } from '../onResourceResponseSuccess';

jest.mock('../../../../generated/adapters/getManagedContent', () => {
    return {
        onResourceResponseSuccess: jest.fn(),
    };
});

describe('onResourceResponseSuccess', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const luvio = new Luvio(new Environment(new Store(), jest.fn()));

    const mockManagedContentDocument: ManagedContentDocumentRepresentation = {
        contentBody: {
            title: 'Sample Managed Content Title',
            body: '&lt;html&gt;&lt;body&gt;test body&lt;/body&gt;&lt;/html&gt;',
            excerpt: 'Test excerpt',
            bannerImage: {
                src: '/file-asset/Expresso1',
                sprite: 'Expresso1.jpeg',
                type: 'image/jpeg',
            },
        },
        contentKey: 'MCMOEXXY57SNBAJID2SYYWJO45LM',
        contentSpace: {
            id: '0Zuxx0000000001CAA',
            resourceUrl: '/services/data/v55.0/connect/cms/spaces/0Zuxx0000000001CAA',
        },
        contentType: {
            fullyQualifiedName: 'news',
        },
        createdBy: {
            id: '005xx000001X7fNAAS',
            resourceUrl: '/services/data/v55.0/chatter/users/005xx000001X7fNAAS',
        },
        createdDate: '2021-05-31T10:08:26.000Z',
        folder: {
            id: '9Puxx0000004C92CAE',
            resourceUrl: '/services/data/v55.0/connect/cms/folders/9Puxx0000004C92CAE',
        },
        isPublished: false,
        language: 'en_US',
        lastModifiedBy: {
            id: '005xx000001X7fNAAS',
            resourceUrl: '/services/data/v55.0/chatter/users/005xx000001X7fNAAS',
        },
        lastModifiedDate: '2021-05-31T10:08:26.000Z',
        managedContentId: '20Yxx0000011Ux4EAE',
        managedContentVariantId: '9Psxx0000004CKKCA2',
        managedContentVersionId: '5OUxx0000004DMqGAM',
        title: 'Sample Managed Content Variant Title',
        urlName: 'sample-managed-content-variant-title',
    };

    const mockResponse: ResourceResponse<ManagedContentDocumentRepresentation> = {
        status: HttpStatusCode.Ok,
        statusText: 'Ok',
        ok: true,
        headers: {},
        body: mockManagedContentDocument,
    };

    it('takes language from response if not provided', () => {
        const config = { contentKeyOrId: mockManagedContentDocument.contentKey };
        const resourceParams = {
            urlParams: { contentKeyOrId: mockManagedContentDocument.contentKey },
            queryParams: {},
        };
        const updatedResourceParams = {
            ...resourceParams,
            queryParams: {
                language: mockManagedContentDocument.language,
            },
        };
        onResourceResponseSuccess(luvio, config, resourceParams, mockResponse);

        expect(generatedOnResourceResponseSuccess).toHaveBeenCalledTimes(1);
        expect(generatedOnResourceResponseSuccess).toHaveBeenLastCalledWith(
            luvio,
            config,
            updatedResourceParams,
            mockResponse
        );
    });

    it('uses language from request params if provided', () => {
        const config = { contentKeyOrId: mockManagedContentDocument.contentKey, language: 'en_US' };
        const resourceParams = {
            urlParams: { contentKeyOrId: mockManagedContentDocument.contentKey },
            queryParams: { language: 'en_US' },
        };
        onResourceResponseSuccess(luvio, config, resourceParams, mockResponse);

        expect(generatedOnResourceResponseSuccess).toHaveBeenCalledTimes(1);
        expect(generatedOnResourceResponseSuccess).toHaveBeenLastCalledWith(
            luvio,
            config,
            resourceParams,
            mockResponse
        );
    });
});
