jest.mock('../../generated/types/type-utils');
import {
    apexClassnameBuilder,
    apexResponseIngest,
    ApexAdapterConfig,
    APEX_TTL,
    CACHE_CONTROL,
    configBuilder,
    keyBuilder,
    shouldCache,
    validateAdapterConfig,
} from '../shared';

import { IngestPath, ResourceResponse } from '@luvio/engine';
import { createLink } from '../../generated/types/type-utils';

const CLASSNAME = 'TestController';
const CLASSNAME_WITH_NAMESPACE = 'ns__TestController';
const METHOD = 'getString';
const IS_CONTINUATION = 'false';
const NAMESPACE = 'ns';

// adapted from record-ingest.spec.ts
describe('apexResponseIngest', () => {
    const MOCK_KEY = 'MOCK_KEY';
    const mockExistingRecord = 'EXISTING_RECORD';
    const mockLink = 'MOCK_LINK';
    const timestamp = 12345;

    const mockData = {
        MOCK: 'RECORD',
    };

    const mockLds: any = {
        storePublish: jest.fn(),
        storeSetExpiration: jest.fn(),
    };

    const mockStore: any = {
        records: {
            [MOCK_KEY]: mockExistingRecord,
        },
    };

    const mockPath: IngestPath = {
        fullPath: MOCK_KEY,
        parent: null,
        propertyName: '',
    };

    createLink.mockReturnValueOnce(mockLink);

    const returnValue = apexResponseIngest(mockData, mockPath, mockLds, mockStore, timestamp);

    it('calls storePublish with the incoming payload when it does not equal the existing payload', () => {
        expect(mockLds.storePublish).toHaveBeenCalledWith(MOCK_KEY, mockData);
    });

    it('calls storeSetExpiration with key and Apex TTL (5min) plus the provided timeout', () => {
        expect(mockLds.storeSetExpiration).toHaveBeenCalledWith(MOCK_KEY, APEX_TTL + timestamp);
    });

    it('calls createLink on the key', () => {
        expect(createLink).toHaveBeenCalledWith(MOCK_KEY);
    });

    it('returns a storeLink for the given key', () => {
        expect(returnValue).toBe(mockLink);
    });
});

describe('keyBuilder', () => {
    it('returns correct cache key for regular param value', () => {
        const expectedKey = 'TestController:getString:false:{"foo":"bar","name":"LWC"}';
        expect(keyBuilder(CLASSNAME, METHOD, IS_CONTINUATION, { name: 'LWC', foo: 'bar' })).toBe(
            expectedKey
        );
    });

    it('returns correct cache key for classname with namespace', () => {
        const expectedKey = 'ns:TestController:getString:false:{"foo":"bar","name":"LWC"}';
        expect(
            keyBuilder('ns__TestController', METHOD, IS_CONTINUATION, { name: 'LWC', foo: 'bar' })
        ).toBe(expectedKey);
    });

    it('returns correct cache key for regular param value containing null values', () => {
        const expectedKey = 'TestController:getString:false:{"foo":null,"name":"LWC"}';
        expect(keyBuilder(CLASSNAME, METHOD, IS_CONTINUATION, { name: 'LWC', foo: null })).toBe(
            expectedKey
        );
    });

    it('returns correct cache key for undefined param value', () => {
        const expectedKey = 'TestController:getString:false:';
        expect(keyBuilder(CLASSNAME, METHOD, IS_CONTINUATION, undefined)).toBe(expectedKey);
    });

    it('returns correct cache key for empty object param value', () => {
        const expectedKey = 'TestController:getString:false:';
        expect(keyBuilder(CLASSNAME, METHOD, IS_CONTINUATION, {})).toBe(expectedKey);
    });

    it('returns correct cache key for nested param value', () => {
        const expectedKey =
            'TestController:getString:false:{"a":{"b":1,"c":{"d":2}},"foo":"bar","name":"LWC"}';
        expect(
            keyBuilder(CLASSNAME, METHOD, IS_CONTINUATION, {
                name: 'LWC',
                foo: 'bar',
                a: { b: 1, c: { d: 2 } },
            })
        ).toBe(expectedKey);
    });

    it('returns the same correct cache key for nested params with different key ordering', () => {
        const expectedKey =
            'TestController:getString:false:{"a":{"b":1,"c":{"d":2}},"foo":"bar","name":"LWC"}';
        expect(
            keyBuilder(CLASSNAME, METHOD, IS_CONTINUATION, {
                foo: 'bar',
                a: { c: { d: 2 }, b: 1 },
                name: 'LWC',
            })
        ).toBe(expectedKey);
    });
});

describe('validateAdapterConfig', () => {
    it('returns empty config when empty config provided', () => {
        const target = {};
        expect(validateAdapterConfig(target)).toBe(target);
    });

    it('returns config when config contains null value', () => {
        const target = { key: null };
        expect(validateAdapterConfig(target)).toBe(target);
    });

    it('returns null when config contains undefined value', () => {
        const target = { key: undefined };
        expect(validateAdapterConfig(target)).toBeNull();
    });
});

describe('configBuilder', () => {
    it('adapts ApexInvokerParams and config from adapter into Apex config', () => {
        const config = {
            toLower: true,
        };
        const expected: ApexAdapterConfig = {
            apexClass: CLASSNAME,
            apexMethod: METHOD,
            methodParams: config,
            xSFDCAllowContinuation: IS_CONTINUATION,
        };
        expect(configBuilder(config, CLASSNAME, METHOD, false)).toStrictEqual(expected);
    });
});

describe('apexClassnameBuilder', () => {
    it('returns namespace__classname, if namespace supplied', () => {
        expect(apexClassnameBuilder(NAMESPACE, CLASSNAME)).toBe(CLASSNAME_WITH_NAMESPACE);
    });
    it('returns classname without namespace, if namespace is an empty string', () => {
        expect(apexClassnameBuilder('', CLASSNAME)).toBe(CLASSNAME);
    });
});

describe('shouldCache', () => {
    it('returns true when cache-control header supplies something other than "no-cache"', () => {
        const mockResponse: ResourceResponse<any> = {
            status: 200,
            statusText: 'Ok',
            ok: true,
            headers: {
                [CACHE_CONTROL]: 'private max-age=30',
            },
            body: {},
        };
        expect(shouldCache(mockResponse)).toBe(true);
    });
    it('returns false when cache-control header supplies "no-cache"', () => {
        let mockResponse: ResourceResponse<any> = {
            status: 200,
            statusText: 'Ok',
            ok: true,
            headers: {
                [CACHE_CONTROL]: 'no-cache',
            },
            body: {},
        };
        expect(shouldCache(mockResponse)).toBe(false);
    });
    it('returns false when cache-control header is undefined', () => {
        let mockResponse: ResourceResponse<any> = {
            status: 200,
            statusText: 'Ok',
            ok: true,
            headers: {},
            body: {},
        };
        expect(shouldCache(mockResponse)).toBe(false);
    });
    it('returns false when no header is defined', () => {
        let mockResponse: ResourceResponse<any> = {
            status: 200,
            statusText: 'Ok',
            ok: true,
            headers: undefined,
            body: {},
        };
        expect(shouldCache(mockResponse)).toBe(false);
    });
});
