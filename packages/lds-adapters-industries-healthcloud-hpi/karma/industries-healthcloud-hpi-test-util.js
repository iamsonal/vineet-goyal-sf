import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';
const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;
const URL_BASE = `/connect/health/uhs/actions`;

export const mockGetMorePatientScoresErrorNetworkOnce = (config, mockData) => {
    const paramMatch = getActionsDetails(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
};
export const mockGetMorePatientScoresNetworkOnce = (config, mockData) => {
    const paramMatch = getActionsDetails(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
};
const getActionsDetails = (params) => {
    const { actions, formFactor, recordId } = params;
    return sinon.match({
        method: 'get',
        baseUri: BASE_URI,
        basePath: URL_BASE,
        queryParams: { actions, formFactor, recordId },
    });
};
export const mockGetScoresErrorNetworkOnce = (config, mockData) => {
    const paramMatch = getMorePatientScores(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
};
export const mockGetScoresNetworkOnce = (config, mockData) => {
    const paramMatch = getMorePatientScores(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
};
const getMorePatientScores = (params) => {
    const { scoreId, limitBy, searchTerm, recordType, startIndex, range } = params;
    return sinon.match({
        method: 'get',
        baseUri: BASE_URI,
        basePath: `/connect/health/uhslist/${scoreId}`,
        queryParams: { limitBy, searchTerm, recordType, startIndex, range },
    });
};
