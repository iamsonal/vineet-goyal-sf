import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v53.0';
const BASE_URI = `/services/data/${API_VERSION}`;

function mockCreatePaymentsBatchScheduler(config, mockData) {
    const paramMatch = getCreatePaymentsBatchSchedulerMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function getCreatePaymentsBatchSchedulerMatcher(config) {
    let {
        schedulerName,
        startDate,
        endDate,
        preferredTime,
        frequencyCadence,
        criteriaExpression,
        status,
        filterCriteria,
    } = config;
    return sinon.match({
        body: {
            schedulerName,
            startDate,
            endDate,
            preferredTime,
            frequencyCadence,
            criteriaExpression,
            status,
            filterCriteria,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `/billing/batch/payments/schedulers`,
        queryParams: {},
    });
}

function mockCreatePaymentsBatchSchedulerErrorOnce(config, mockData) {
    const paramMatch = getCreatePaymentsBatchSchedulerMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export {
    getCreatePaymentsBatchSchedulerMatcher,
    mockCreatePaymentsBatchScheduler,
    mockCreatePaymentsBatchSchedulerErrorOnce,
};
