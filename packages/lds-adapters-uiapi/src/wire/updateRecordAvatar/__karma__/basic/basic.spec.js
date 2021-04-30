import { updateRecordAvatar } from 'lds-adapters-uiapi';
import { karmaNetworkAdapter } from 'lds-engine';
import {
    mockNetworkOnce,
    getMock as globalGetMock,
    setupElement,
    mockNetworkSequence,
    mockNetworkErrorOnce,
} from 'test-util';
import { URL_BASE } from 'uiapi-test-util';
import sinon from 'sinon';

import GetRecordAvatars from '../../../getRecordAvatars/__karma__/lwc/get-record-avatars';

const MOCK_PREFIX = 'wire/updateRecordAvatar/__karma__/basic/data/';
const recordId = '001xx0000000005AAA';
const externalId = 'external';
const photoUrl = 'http:salesforce.com/photo';
const actionType = 'action';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetwork(recordId, body, mockData) {
    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/record-avatars/${recordId}/association`,
        method: 'post',
        body: { ...body },
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetRecordAvatarsNetwork(config, mockData) {
    const recordIds = config.recordIds.join(',');
    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/record-avatars/batch/${recordIds}`,
    });
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockNetworkErrorUpdateAvatar(recordId, body, errorResponse) {
    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/record-avatars/${recordId}/association`,
        method: 'post',
        body: { ...body },
    });
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, errorResponse);
}

describe('Update Avatar record', () => {
    it('update avatar call correctly calls update and returns mocked response type theme', async () => {
        const updateParams = { externalId: externalId, photoUrl: photoUrl, actionType: actionType };
        const mockResponse = getMock('avatar-001xx0000000005AAA');
        mockNetwork(recordId, updateParams, mockResponse);

        //update avatar
        updateParams.recordId = recordId;
        const response = await updateRecordAvatar(updateParams);

        //assert
        expect(response).toEqualSnapshotWithoutEtags(mockResponse);
    });

    it('update avatar call correctly calls update and returns mocked response type photo', async () => {
        const updateParams = { externalId: externalId, photoUrl: photoUrl, actionType: actionType };
        const mockResponse = getMock('photoavatar-001xx0000000005AAA');
        mockNetwork(recordId, updateParams, mockResponse);

        //update avatar
        updateParams.recordId = recordId;
        const response = await updateRecordAvatar(updateParams);

        //assert
        expect(response).toEqualSnapshotWithoutEtags(mockResponse);
    });

    it('update avatar publishes to listening getRecordAvatars wired adapters with different avatars (theme->photo)', async () => {
        //setup
        const updateParams = { externalId: externalId, photoUrl: photoUrl, actionType: actionType };
        const getRecordAvatarConfig = { recordIds: [recordId] };
        const mockResponse = getMock('photoavatar-001xx0000000005AAA');
        const getAvatarResponse = getMock('getavatar-001xx0000000005AAA');
        mockGetRecordAvatarsNetwork(getRecordAvatarConfig, getAvatarResponse);
        //create lwc component with a getRecordAvatars observer
        const wireA = await setupElement(getRecordAvatarConfig, GetRecordAvatars);
        expect(wireA.getWiredData()).toEqualRecordAvatarsSnapshot(
            getRecordAvatarConfig.recordIds,
            getAvatarResponse
        );
        mockNetwork(recordId, updateParams, mockResponse);
        updateParams.recordId = recordId;

        //update avatar for record id matching wire adapter
        await updateRecordAvatar(updateParams);
        let mockResponseReformatted = {
            results: [{ result: mockResponse, statusCode: 200 }],
        };
        //Wire adapter should be updated with new data
        expect(wireA.getWiredData()).toEqualRecordAvatarsSnapshot(
            getRecordAvatarConfig.recordIds,
            mockResponseReformatted
        );
        expect(wireA.pushCount()).toBe(2);
    });

    it('update avatar publishes to listening getRecordAvatars wired adapters with photo->photo', async () => {
        //setup
        const updateParams = { externalId: externalId, photoUrl: photoUrl, actionType: actionType };
        const getRecordAvatarConfig = { recordIds: [recordId] };
        const mockResponse = getMock('avatar-001xx0000000005AAA');
        const getAvatarResponse = getMock('getavatar-001xx0000000005AAA');
        mockGetRecordAvatarsNetwork(getRecordAvatarConfig, getAvatarResponse);
        //create lwc component with a getRecordAvatars observer
        const wireA = await setupElement(getRecordAvatarConfig, GetRecordAvatars);
        expect(wireA.getWiredData()).toEqualRecordAvatarsSnapshot(
            getRecordAvatarConfig.recordIds,
            getAvatarResponse
        );
        mockNetwork(recordId, updateParams, mockResponse);
        updateParams.recordId = recordId;

        //update avatar for record id matching wire adapter
        await updateRecordAvatar(updateParams);
        let mockResponseReformatted = {
            results: [{ result: mockResponse, statusCode: 200 }],
        };
        //Wire adapter should be updated with new data
        expect(wireA.getWiredData()).toEqualRecordAvatarsSnapshot(
            getRecordAvatarConfig.recordIds,
            mockResponseReformatted
        );
        expect(wireA.pushCount()).toBe(2);
    });

    it('test Server error', async () => {
        //set up test data
        const updateParams = { externalId: externalId, photoUrl: photoUrl, actionType: actionType };
        const mockResponse = getMock('avatar-error');
        mockNetworkErrorUpdateAvatar(recordId, updateParams, mockResponse);
        updateParams.recordId = recordId;

        //call update
        try {
            await updateRecordAvatar(updateParams);
            fail('update avatar should error out and not hit this point');
        } catch (e) {
            const mockErrorResponse = {
                body: mockResponse,
                ok: false,
                status: 500,
                statusText: 'Server Error',
            };
            expect(mockErrorResponse).toEqual(e);
            expect(e).toBeImmutable();
        }
    });
});
