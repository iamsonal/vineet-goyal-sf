import timekeeper from 'timekeeper';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkOnce,
    mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkErrorOnce,
} from 'analytics-wave-test-util';
import WiredGetDataConnectorSourceObjectDataPreviewWithFields from '../lwc/get-data-connector-source-object-data-preview-with-fields';

const MOCK_PREFIX = 'wire/getDataConnectorSourceObjectDataPreviewWithFields/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

const TTL = 5000;

const config = {
    uriParams: {
        connectorIdOrApiName: '0ItS700000001YxKAI',
        sourceObjectName: 'car_details',
    },
    body: {
        sourceObjectFields: [
            'car_make',
            'id',
            'car_model_year',
            'last_name',
            'first_name',
            'email',
            'car_model',
        ],
    },
};

const advancedConfig = {
    uriParams: {
        connectorIdOrApiName: '0ItS700000001YxKAI',
        sourceObjectName: 'car_details',
    },
    body: {
        sourceObjectFields: [
            'car_make',
            'id',
            'car_model_year',
            'last_name',
            'first_name',
            'email',
            'car_model',
        ],
        advancedProperties: [
            { name: 'StartDate', value: '2018-01-01' },
            { name: 'ViewID', value: '174299164' },
            { name: 'EndDate', value: 'today' },
        ],
    },
};

const props = {
    connectorIdOrApiName: '0ItS700000001YxKAI',
    sourceObjectName: 'car_details',
    sourceObjectFields: [
        'car_make',
        'id',
        'car_model_year',
        'last_name',
        'first_name',
        'email',
        'car_model',
    ],
};

const advancedProps = {
    connectorIdOrApiName: '0ItS700000001YxKAI',
    sourceObjectName: 'car_details',
    sourceObjectFields: [
        'car_make',
        'id',
        'car_model_year',
        'last_name',
        'first_name',
        'email',
        'car_model',
    ],
    advancedProperties: [
        { name: 'StartDate', value: '2018-01-01' },
        { name: 'ViewID', value: '174299164' },
        { name: 'EndDate', value: 'today' },
    ],
};

describe('basic', () => {
    it('gets preview data', async () => {
        const mock = getMock('preview');
        mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkOnce(config, mock);
        const el = await setupElement(
            props,
            WiredGetDataConnectorSourceObjectDataPreviewWithFields
        );

        expect(el.getWiredData()).toEqual(mock);
        expect(el.pushCount()).toBe(1);
    });

    it('gets preview data with advanced properties', async () => {
        const mock = getMock('preview');
        mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkOnce(advancedConfig, mock);
        const el = await setupElement(
            advancedProps,
            WiredGetDataConnectorSourceObjectDataPreviewWithFields
        );

        expect(el.getWiredData()).toEqual(mock);
        expect(el.pushCount()).toBe(1);
    });

    it('does not issue network request on config with undefined query', async () => {
        const element = await setupElement(
            {},
            WiredGetDataConnectorSourceObjectDataPreviewWithFields
        );

        expect(element.pushCount()).toBe(0);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('preview');
        mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkOnce(config, mock);

        const el = await setupElement(
            props,
            WiredGetDataConnectorSourceObjectDataPreviewWithFields
        );

        expect(el.getWiredData()).toEqual(mock);
        expect(el.pushCount()).toBe(1);

        const el2 = await setupElement(
            props,
            WiredGetDataConnectorSourceObjectDataPreviewWithFields
        );
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('does fetch a second time with different params', async () => {
        const mock = getMock('preview');
        mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkOnce(config, mock);
        const el = await setupElement(
            props,
            WiredGetDataConnectorSourceObjectDataPreviewWithFields
        );
        expect(el.getWiredData()).toEqual(mock);
        expect(el.pushCount()).toBe(1);

        const newConfig = {
            uriParams: {
                connectorIdOrApiName: '0ItS700000001YxKAI',
                sourceObjectName: 'car_details',
            },
            body: {
                sourceObjectFields: ['car_make', 'id', 'car_model_year'],
                advancedProperties: [
                    { name: 'StartDate', value: '2018-01-01' },
                    { name: 'ViewID', value: '174299164' },
                    { name: 'EndDate', value: 'today' },
                ],
            },
        };
        mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkOnce(newConfig, mock);
        const newProps = {
            connectorIdOrApiName: '0ItS700000001YxKAI',
            sourceObjectName: 'car_details',
            sourceObjectFields: ['car_make', 'id', 'car_model_year'],
            advancedProperties: [
                { name: 'StartDate', value: '2018-01-01' },
                { name: 'ViewID', value: '174299164' },
                { name: 'EndDate', value: 'today' },
            ],
        };
        const el2 = await setupElement(
            newProps,
            WiredGetDataConnectorSourceObjectDataPreviewWithFields
        );
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 400s', async () => {
        // this simulates an invalid fields list passed in
        const mock = {
            ok: false,
            status: 400,
            statusText: 'BAD_REQUEST',
            body: [
                {
                    errorCode: '450',
                    message:
                        'Unable to get result data: Adapter Call method has returned failure. !Field list cannot consist only of dimensions ,must contain at least one metric!',
                },
            ],
        };
        mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkErrorOnce(config, mock);
        const el = await setupElement(
            props,
            WiredGetDataConnectorSourceObjectDataPreviewWithFields
        );
        expect(el.getWiredError()).toEqual(mock);
        expect(el.pushCount()).toBe(1);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('preview');
        mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkOnce(config, mock);

        // populate cache
        await setupElement(props, WiredGetDataConnectorSourceObjectDataPreviewWithFields);

        // second component should have the cached data without hitting network
        const element = await setupElement(
            props,
            WiredGetDataConnectorSourceObjectDataPreviewWithFields
        );

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('preview');
        const updatedData = getMock('preview-updated');
        mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkOnce(config, [
            mock,
            updatedData,
        ]);

        // populate cache
        await setupElement(props, WiredGetDataConnectorSourceObjectDataPreviewWithFields);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(
            props,
            WiredGetDataConnectorSourceObjectDataPreviewWithFields
        );

        expect(element.getWiredData()).toEqual(updatedData);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
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

        mockGetDataConnectorSourceObjectDataPreviewWithFieldsNetworkErrorOnce(config, mock);

        const el = await setupElement(
            props,
            WiredGetDataConnectorSourceObjectDataPreviewWithFields
        );
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(
            props,
            WiredGetDataConnectorSourceObjectDataPreviewWithFields
        );
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
