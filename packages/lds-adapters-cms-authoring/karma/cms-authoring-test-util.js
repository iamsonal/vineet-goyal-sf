import { karmaNetworkAdapter } from 'lds-engine';
import { mockNetworkOnce, mockNetworkErrorOnce, mockNetworkSequence } from 'test-util';
import sinon from 'sinon';

const API_VERSION = 'v53.0';
const BASE_URI = `/services/data/${API_VERSION}`;

function mockCreateDeployment(config, mockData) {
    const paramMatch = getCreateDeploymentsMatcher(config);
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function getCreateDeploymentsMatcher(config) {
    let {
        contentSpaceId,
        channelIds,
        description,
        contentIds,
        executeStagedDeployments,
        scheduledDate,
    } = config;
    return sinon.match({
        body: {
            contentSpaceId,
            channelIds,
            description,
            contentIds,
            executeStagedDeployments,
            scheduledDate,
        },
        headers: {},
        method: 'post',
        baseUri: BASE_URI,
        basePath: `/cms/deployments`,
        queryParams: {},
    });
}

function mockCreateDeploymentsErrorOnce(config, mockData) {
    const paramMatch = getCreateDeploymentsMatcher(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

export { getCreateDeploymentsMatcher, mockCreateDeployment, mockCreateDeploymentsErrorOnce };
