import { factory as updateRecordAvatar } from '../index';

describe('validation', () => {
    it('throws error with bad config', async () => {
        try {
            await expect(updateRecordAvatar({} as any)(undefined as any));
        } catch (e) {
            expect(e.message).toBe('updateRecordAvatar invalid configuration');
        }
    });
});
