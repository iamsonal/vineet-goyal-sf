// Add karma utils for your adapters in this file
import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v55.0';
const BASE_URI = `/services/data/${API_VERSION}`;

export function clone(obj) {
    // this is needed for compat tests, because the toEqual matcher can't
    // handle the polyfilled Proxy
    return JSON.parse(JSON.stringify(obj));
}

export function mockPredictionsNetworkOnce(config, mockData) {
    const paramMatch = predictionsDataMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockPredictionsExtractedRecordOverridesNetworkOnce(config, mockData) {
    const paramMatch = predictionsDetailedDataMatcher(config);
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export function mockPredictionsNetworkErrorOnce(config, mockData) {
    const paramMatch = predictionsDataMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function predictionsDataMatcher(config) {
    let { usecaseDefinition, predictionDefinition, inputType, records } = config;
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/aiaccelerator/predictions`,
        method: 'post',
        body: {
            usecaseDefinition,
            predictionDefinition,
            inputType,
            records,
        },
        headers: {},
        queryParams: {},
    });
}

function predictionsDetailedDataMatcher(config) {
    let {
        usecaseDefinition,
        predictionDefinition,
        inputType,
        records,
        columnNames,
        insightsSettings,
        featureColumnMap,
        insightColumnMap,
        suggestionColumnMap,
        featureExtractionParameters,
        enableSuggestionPersistence,
        async,
    } = config;
    return sinon.match({
        baseUri: BASE_URI,
        basePath: `/connect/aiaccelerator/predictions`,
        method: 'post',
        body: {
            usecaseDefinition,
            predictionDefinition,
            inputType,
            records,
            columnNames,
            insightsSettings,
            featureColumnMap,
            insightColumnMap,
            suggestionColumnMap,
            featureExtractionParameters,
            enableSuggestionPersistence,
            async,
        },
        headers: {},
        queryParams: {},
    });
}
