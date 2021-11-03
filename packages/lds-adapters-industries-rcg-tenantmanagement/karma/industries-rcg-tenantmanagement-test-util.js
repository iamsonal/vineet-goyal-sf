import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v54.0';
const BASE_URI = `/services/data/${API_VERSION}`;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockGetTenantRegistrationStatusNetworkOnce(mockData) {
    const paramMatch = tenantMgmtDataMatcher('get');
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockGetTenantRegistrationStatusNetworkErrorOnce(mockData) {
    const paramMatch = tenantMgmtDataMatcher('get');
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockUpdateTenantCertificateNetworkOnce(mockData) {
    const paramMatch = tenantMgmtDataMatcher('put');
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockUpdateTenantCertificateNetworkErrorOnce(mockData) {
    const paramMatch = tenantMgmtDataMatcher('put');
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function tenantMgmtDataMatcher(methodType) {
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/consumer-goods/tenant-registration`,
        method: methodType,
        urlParams: {},
        queryParams: {},
    });
}
