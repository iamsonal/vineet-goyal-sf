import Basic from '../lwc/basic';
import { karmaNetworkAdapter } from 'lds-engine';
import {
    getMock as globalGetMock,
    mockNetworkErrorOnce,
    mockNetworkOnce,
    mockNetworkSequence,
    setupElement,
} from 'test-util';
import { URL_BASE, expireActions } from 'uiapi-test-util';
import sinon from 'sinon';

const MOCK_PREFIX = 'wire/getLookupActions/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetwork(config, mockData) {
    const paramMatch = getParamMatch(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockNetworkError(config, mockData) {
    const paramMatch = getParamMatch(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getParamMatch(config) {
    const { urlParams, queryParams } = config;
    return sinon.match({
        basePath: `${URL_BASE}/actions/lookup/${urlParams.objectApiNames.sort().join(',')}`,
        urlParams,
        queryParams,
    });
}

describe('basic', () => {
    [
        { name: 'string', value: ['Lead', 'Opportunity'] },
        { name: 'object', value: [{ objectApiName: 'Lead' }, { objectApiName: 'Opportunity' }] },
    ].forEach((testConfig) => {
        it(`gets data when adapter config is ${testConfig.name}`, async () => {
            const mockData = getMock('lookup-Lead-Opportunity');
            const resourceConfig = {
                urlParams: {
                    objectApiNames: Object.keys(mockData.actions),
                },
                queryParams: {
                    actionTypes: undefined,
                    formFactor: undefined,
                    sections: undefined,
                },
            };
            mockNetwork(resourceConfig, mockData);

            const props = { objectApiNames: testConfig.value };
            const element = await setupElement(props, Basic);

            expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
        });
    });

    it(`gets data when all queryParams set to values`, async () => {
        const mockData = getMock(
            'lookup-Opportunity-actionTypes-StandardButton-formFactor-Medium-sections-Page'
        );
        const actions = Object.keys(mockData.actions);
        const resourceConfig = {
            urlParams: {
                objectApiNames: actions,
            },
            queryParams: {
                actionTypes: ['StandardButton'],
                formFactor: 'Medium',
                sections: ['Page'],
            },
        };
        mockNetwork(resourceConfig, mockData);

        const props = { ...resourceConfig.urlParams, ...resourceConfig.queryParams };
        const element = await setupElement(props, Basic);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it(`returns error for invalid objectApiName param`, async () => {
        const mockData = getMock('lookup-objectApiName-invalid');
        const resourceConfig = {
            urlParams: {
                objectApiNames: ['InvalidFoo'],
            },
            queryParams: {
                actionTypes: undefined,
                formFactor: undefined,
                sections: undefined,
            },
        };
        mockNetworkError(resourceConfig, mockData);

        const props = { ...resourceConfig.urlParams, ...resourceConfig.queryParams };
        const element = await setupElement(props, Basic);

        const error = element.getWiredError();
        expect(error.body).toEqualSnapshotWithoutEtags(mockData);
    });

    it(`coerces invalid formFactor param to undefined`, async () => {
        const mockData = getMock('lookup-Lead-Opportunity');
        const resourceConfig = {
            urlParams: {
                objectApiNames: Object.keys(mockData.actions),
            },
            queryParams: {
                actionTypes: undefined,
                formFactor: 'MediumTypo',
                sections: undefined,
            },
        };

        const coercedResourceConfig = {
            urlParams: resourceConfig.urlParams,
            queryParams: {
                ...resourceConfig.queryParams,
                formFactor: undefined,
            },
        };
        mockNetwork(coercedResourceConfig, mockData);

        const props = { ...resourceConfig.urlParams, ...resourceConfig.queryParams };

        const element = await setupElement(props, Basic);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('lookup-Lead-Opportunity');
        const mockDataActionsKeys = Object.keys(mockData.actions);
        const resourceConfig = {
            urlParams: {
                objectApiNames: mockDataActionsKeys,
            },
            queryParams: {
                actionTypes: undefined,
                formFactor: undefined,
                sections: undefined,
            },
        };
        mockNetwork(resourceConfig, mockData);

        // populate cache
        const props = { objectApiNames: mockDataActionsKeys };
        await setupElement(props, Basic);

        // second component should have the cached data without hitting network
        const element = await setupElement(props, Basic);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mockData = getMock('lookup-Lead-Opportunity');
        const updatedData = getMock('lookup-Lead-Opportunity');
        const mockDataActionsKeys = Object.keys(mockData.actions);
        Object.assign(updatedData, {
            eTag: 'e7c7f7e02c57bdcfa9d751b5a508f907',
        });
        const resourceConfig = {
            urlParams: {
                objectApiNames: mockDataActionsKeys,
            },
            queryParams: {
                actionTypes: undefined,
                formFactor: undefined,
                sections: undefined,
            },
        };
        mockNetwork(resourceConfig, [mockData, updatedData]);

        // populate cache
        const props = { objectApiNames: mockDataActionsKeys };
        await setupElement(props, Basic);

        // expire cache
        expireActions();

        // second component should retrieve from network with updated data
        const element = await setupElement(props, Basic);

        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });
});
