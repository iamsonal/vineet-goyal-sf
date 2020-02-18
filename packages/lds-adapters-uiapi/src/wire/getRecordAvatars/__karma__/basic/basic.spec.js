import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireRecordAvatar, mockGetAvatarsNetwork } from 'uiapi-test-util';

import GetRecordAvatars from '../lwc/get-record-avatars';

const MOCK_PREFIX = 'wire/getRecordAvatars/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function getAvatarByRecordId(results, recordId) {
    const result = results.find(item => {
        return item.result.recordId === recordId;
    });
    return result && result.result;
}

describe('Basic', () => {
    it('should correctly make HTTP request for requested recordIds', async () => {
        const mock = getMock('avatar-aDO0M000000GmaJWAS');

        const config = {
            recordIds: ['aDO0M000000GmaJWAS'],
        };

        mockGetAvatarsNetwork(config, mock);

        const elm = await setupElement(config, GetRecordAvatars);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualRecordAvatarsSnapshot(config.recordIds, mock);
    });

    it('should correctly emit when ThemeRecordAvatarRepresentation and PhotoRecordAvatarRepresentation avatars are mixed together', async () => {
        const mock = getMock('avatar-mixed-photo-theme');

        const config = {
            recordIds: ['001xx000003GYSZAA4', '003xx000004WhEiAAK', '005xx000001X7c9AAC'],
        };

        mockGetAvatarsNetwork(config, mock);

        const elm = await setupElement(config, GetRecordAvatars);

        expect(elm.pushCount()).toBe(1);

        expect(elm.getWiredData()).toEqualRecordAvatarsSnapshot(config.recordIds, mock);
    });
});

describe('Caching', () => {
    it('should only request uncached avatars', async () => {
        const mock = getMock('avatar-001xx0000000003AAA-001xx0000000004AAA');

        const config = {
            recordIds: ['001xx0000000003AAA', '001xx0000000004AAA'],
        };

        mockGetAvatarsNetwork(config, mock);

        await setupElement(config, GetRecordAvatars);

        const secondConfig = {
            recordIds: ['001xx0000000003AAA', '001xx0000000004AAA', '001xx0000000005AAA'], // 001xx0000000005AAA is not cached
        };

        const singleAvatarMock = getMock('avatar-001xx0000000005AAA');

        mockGetAvatarsNetwork(
            {
                recordIds: ['001xx0000000005AAA'],
            },
            singleAvatarMock
        );

        const elm = await setupElement(secondConfig, GetRecordAvatars);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualRecordAvatarsSnapshot(secondConfig.recordIds, {
            hasErrors: false,
            results: [...mock.results, ...singleAvatarMock.results],
        });
    });

    it('should not hit the network when all avatars are in the cache', async () => {
        const mock = getMock('avatar-001xx0000000003AAA-001xx0000000004AAA');

        const config = {
            recordIds: ['001xx0000000003AAA', '001xx0000000004AAA'],
        };

        mockGetAvatarsNetwork(config, mock);

        await setupElement(config, GetRecordAvatars);

        const elm = await setupElement(config, GetRecordAvatars);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualRecordAvatarsSnapshot(config.recordIds, mock);
    });

    it('should make XHR for avatars when bulk has expired', async () => {
        const mock = getMock('avatar-001xx0000000003AAA-001xx0000000004AAA-001xx0000000005AAA');

        const config = {
            recordIds: ['001xx0000000003AAA', '001xx0000000004AAA', '001xx0000000005AAA'],
        };

        mockGetAvatarsNetwork(config, mock);

        const secondMock = getMock('avatar-001xx0000000003AAA-001xx0000000004AAA');

        const secondConfig = {
            recordIds: ['001xx0000000003AAA', '001xx0000000004AAA'],
        };

        mockGetAvatarsNetwork(secondConfig, secondMock);

        await setupElement(config, GetRecordAvatars);

        const elm = await setupElement(config, GetRecordAvatars);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualRecordAvatarsSnapshot(config.recordIds, mock);

        expireRecordAvatar();

        const elm2 = await setupElement(secondConfig, GetRecordAvatars);
        expect(elm2.pushCount()).toBe(1);
        expect(elm2.getWiredData()).toEqualRecordAvatarsSnapshot(
            secondConfig.recordIds,
            secondMock
        );
    });

    it('should make XHR for expired individual avatars', async () => {
        const mock = getMock('avatar-001xx0000000003AAA-001xx0000000004AAA-001xx0000000005AAA');
        const config = {
            recordIds: ['001xx0000000003AAA', '001xx0000000004AAA', '001xx0000000005AAA'],
        };
        mockGetAvatarsNetwork(config, mock);

        // 1. Priming the store with the 3 avatars
        await setupElement(config, GetRecordAvatars);

        // 2. Expire the avatar bulk and individuals
        expireRecordAvatar();

        const secondMock = getMock('avatar-001xx0000000005AAA');
        const secondConfig = {
            recordIds: ['001xx0000000005AAA'],
        };

        // 3. Request a single avatar from network and bulk expiration should be updated
        mockGetAvatarsNetwork(secondConfig, secondMock);
        await setupElement(secondConfig, GetRecordAvatars);

        // 4. Request the two expired avatars from network, since they are individually expired in #2
        const thirdMock = getMock('avatar-001xx0000000003AAA-001xx0000000004AAA');
        const thirdConfig = {
            recordIds: ['001xx0000000003AAA', '001xx0000000004AAA'],
        };
        mockGetAvatarsNetwork(thirdConfig, thirdMock);

        const element = await setupElement(config, GetRecordAvatars);
        expect(element.getWiredData()).toEqualRecordAvatarsSnapshot(config.recordIds, mock);
    });

    it('changes to avatars cause new avatars to emit', async () => {
        const mock = getMock('avatar-001xx0000000003AAA-001xx0000000004AAA-001xx0000000005AAA');
        const config = {
            recordIds: ['001xx0000000003AAA', '001xx0000000004AAA', '001xx0000000005AAA'],
        };

        mockGetAvatarsNetwork(config, mock);

        // Priming the store
        await setupElement(config, GetRecordAvatars);

        const elm = await setupElement(config, GetRecordAvatars);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualRecordAvatarsSnapshot(config.recordIds, mock);

        // Expiring all avatars causes the rebuild to fail because it thinks everything
        // is expired. We shouldn't check TTL when rebuilding snapshots
        expireRecordAvatar();

        const secondMock = getMock('avatar-001xx0000000003AAA-001xx0000000004AAA');
        // Updating an avatar
        const avatar = getAvatarByRecordId(secondMock.results, '001xx0000000003AAA');
        avatar.backgroundColor = '#FFF';
        const secondConfig = {
            recordIds: ['001xx0000000003AAA', '001xx0000000004AAA'],
        };
        mockGetAvatarsNetwork(secondConfig, secondMock);

        await setupElement(secondConfig, GetRecordAvatars);
        expect(elm.pushCount()).toBe(2);
    });
});

describe('refresh', () => {
    it('should refresh get record avatars', async () => {
        const mock = getMock('avatar-aDO0M000000GmaJWAS');
        const refreshed = getMock('avatar-aDO0M000000GmaJWAS');
        refreshed.results[0].result.eTag = refreshed.results[0].result.eTag + '999';
        refreshed.results[0].result.backgroundColor = 'ffffff';

        const config = {
            recordIds: ['aDO0M000000GmaJWAS'],
        };

        mockGetAvatarsNetwork(config, [mock, refreshed]);

        const element = await setupElement(config, GetRecordAvatars);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualRecordAvatarsSnapshot(config.recordIds, mock);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualRecordAvatarsSnapshot(config.recordIds, refreshed);
    });
});

describe('Error', () => {
    it('should ingest partial 404 responses', async () => {
        const mock = getMock('avatar-001xx0000000004AAA-001xx00noavatarAAA-404');

        const config = {
            recordIds: ['001xx0000000004AAA', '001xx00noavatarAAA'],
        };

        mockGetAvatarsNetwork(config, mock);

        const elm = await setupElement(config, GetRecordAvatars);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualRecordAvatarsSnapshot(config.recordIds, mock);
    });

    it('should ingest partial 404 responses exposed as an array', async () => {
        const mock = getMock('avatar-001xx0000000004AAA-001xx00noavatarAAA-404-array');

        const config = {
            recordIds: ['001xx0000000004AAA', '001xx00noavatarAAA'],
        };

        mockGetAvatarsNetwork(config, mock);

        const elm = await setupElement(config, GetRecordAvatars);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualRecordAvatarsSnapshot(config.recordIds, mock);
    });

    it('should ingest single 404 responses exposed as an array', async () => {
        const mock = getMock('avatar-005B00000029o0qIAB-404');

        const config = {
            recordIds: ['005B00000029o0qIAB'],
        };

        mockGetAvatarsNetwork(config, mock);

        const elm = await setupElement(config, GetRecordAvatars);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualRecordAvatarsSnapshot(config.recordIds, mock);
    });

    it('should ingest single 400 responses exposed as an array', async () => {
        const mock = getMock('avatar-400');

        const config = {
            recordIds: ['005B00000029o0qIAB'],
        };

        mockGetAvatarsNetwork(config, mock);

        const elm = await setupElement(config, GetRecordAvatars);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualRecordAvatarsSnapshot(config.recordIds, mock);
    });
});

describe('config', () => {
    [
        { type: 'undefined', recordIds: undefined },
        { type: 'null', recordIds: null },
        { type: 'an invalid Id', recordIds: 'INVALID_ID' },
        { type: 'an array with invalid Id', recordIds: ['INVALID_ID'] },
    ].forEach(({ type, recordIds }) => {
        it(`gets no data when required param 'recordId' is ${type}`, async () => {
            const config = {
                recordIds,
            };

            const element = await setupElement(config, GetRecordAvatars);
            expect(element.pushCount()).toBe(0);
        });
    });

    it('transforms recordId from 15 char format to 18 char format', async () => {
        const mock = getMock('avatar-aDO0M000000GmaJWAS');
        const recordId18 = 'aDO0M000000GmaJWAS';
        const recordId15 = recordId18.slice(0, 15);

        const networkParams = {
            recordIds: [recordId18],
        };
        mockGetAvatarsNetwork(networkParams, mock);

        const config = {
            recordIds: [recordId15],
        };
        const elm = await setupElement(config, GetRecordAvatars);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualRecordAvatarsSnapshot([recordId18], mock);
    });
});
