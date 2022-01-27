import * as aura from 'aura';
import networkAdapter from '../main';
import { UI_API_BASE_URI } from '../middlewares/uiapi-base';
import { buildResourceRequest, ERROR_RESPONSE } from './test-utils';

jest.mock('@salesforce/lds-environment-settings', () => {
    return {
        EnvironmentSettings: {},
        getEnvironmentSetting: () => {
            return true;
        },
    };
});

import { instrumentation } from '../instrumentation';

const instrumentationSpies = {
    logCrud: jest.spyOn(instrumentation, 'logCrud'),
};

beforeEach(() => {
    instrumentationSpies.logCrud.mockClear();
});

describe('crud logging disabled by gate', () => {
    it('does not log read event when getRecord is called', async () => {
        const request = {
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/1234`,
            urlParams: {
                recordId: '1234',
            },
            queryParams: {
                fields: ['Id'],
            },
        };

        const response = {
            id: '1234',
            fields: {
                Id: {
                    value: '1234',
                },
            },
            apiName: 'Foo',
        };

        jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(response);
        await networkAdapter(buildResourceRequest(request));

        expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(0);
    });

    it('does not log read event when getRecord is called but returns error', async () => {
        const request = {
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/1234`,
            urlParams: {
                recordId: '1234',
            },
            queryParams: {
                fields: ['Id'],
            },
        };

        jest.spyOn(aura, 'executeGlobalController').mockRejectedValueOnce(ERROR_RESPONSE);
        try {
            await networkAdapter(buildResourceRequest(request));
        } catch (err) {
            expect(instrumentationSpies.logCrud).toHaveBeenCalledTimes(0);
        }
    });
});
