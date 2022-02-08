import { createCatalogGrants } from 'lds-adapters-analytics-data-service';
import { getMock as globalGetMock } from 'test-util';
import {
    mockCreateCatalogGrantsNetworkOnce,
    mockCreateCatalogGrantsNetworkErrorOnce,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/createCatalogGrants/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}
describe('basic', () => {
    [
        { permission: 'Usage', operation: 'Grant' },
        { permission: 'CreateSchema', operation: 'Revoke' },
        { permission: 'CreateTable', operation: 'Grant' },
    ].forEach(({ permission, operation }) => {
        it(`executes ${permission} with results from ${permission}.json`, async () => {
            const mock = getMock(permission);
            const grants = {
                requestId: 'requestId',
                grants: [
                    {
                        grantee: '0ZGRM0000004Dn04AE',
                        operation,
                        permission,
                        qualifiedName: 'testdb01.testSchema01.Account',
                    },
                ],
            };
            mockCreateCatalogGrantsNetworkOnce(grants, mock);
            const data = await createCatalogGrants(grants);

            expect(data).toEqual(mock);
        });
    });

    it('executes MultipleRequestsReturnOnlyGrants', async () => {
        const mock = getMock('MultipleRequestsReturnOnlyGrants');
        const grants = {
            requestId: 'requestId',
            grants: [
                {
                    grantee: '0ZGRM0000004Dn04AE',
                    operation: 'Grant',
                    permission: 'Usage',
                    qualifiedName: 'testdb01.testSchema01.Account',
                },
                {
                    grantee: '0ZGRM0000004Dn04AE',
                    operation: 'Revoke',
                    permission: 'Select',
                    qualifiedName: 'testdb01.testSchema01.Account',
                },
            ],
        };
        mockCreateCatalogGrantsNetworkOnce(grants, mock);
        const data = await createCatalogGrants(grants);

        expect(data).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        const grants = {
            requestId: 'requestId',
            grants: [
                {
                    qualifiedName: 'testdb01.testSchema01.Account',
                    grantee: '0ZGRM0000004Dn04AE',
                    operation: 'Grant',
                    permission: 'Select',
                },
                {
                    qualifiedName: 'testdb01.testSchema01.Account',
                    grantee: '0ZGRM0000004Dn04AE',
                    operation: 'Grant',
                    permission: 'Insert',
                },
                {
                    qualifiedName: 'testdb01.testSchema01.Account',
                    grantee: '0ZGRM0000004Dn04AE',
                    operation: 'Grant',
                    permission: 'Ownership',
                },
            ],
        };
        mockCreateCatalogGrantsNetworkErrorOnce(grants, mock);

        try {
            await createCatalogGrants(grants);
            // make sure we are hitting the catch
            fail('createCatalogGrants did not throw');
        } catch (e) {
            expect(e).toEqual(mock);
        }
    });
});
