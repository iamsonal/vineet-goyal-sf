import tokenBucket from '../utils/tokenBucket';
import timekeeper from 'timekeeper';

describe('token bucket', () => {
    beforeEach(() => {
        timekeeper.travel(Date.now() + 1000);
    });

    it('returns true when have tokens and false when the bucket is empty', () => {
        const BUCKET_SIZE = 100;
        for (let i = 0; i < BUCKET_SIZE; i++) {
            expect(tokenBucket.take(1)).toBe(true);
        }
        expect(tokenBucket.take(1)).toBe(false);
    });

    it('refill should add a token when enough time has passed', () => {
        const BUCKET_SIZE = 100;
        for (let i = 0; i < BUCKET_SIZE; i++) {
            expect(tokenBucket.take(1)).toBe(true);
        }
        expect(tokenBucket.take(1)).toBe(false);

        timekeeper.travel(Date.now() + 10);
        expect(tokenBucket.take(1)).toBe(true);
        expect(tokenBucket.take(1)).toBe(false);
    });

    it('should not add more tokens than bucket capacity', () => {
        const BUCKET_SIZE = 100;
        for (let i = 0; i < BUCKET_SIZE; i++) {
            expect(tokenBucket.take(1)).toBe(true);
        }
        expect(tokenBucket.take(1)).toBe(false);

        timekeeper.travel(Date.now() + 1000);
        for (let i = 0; i < BUCKET_SIZE; i++) {
            expect(tokenBucket.take(1)).toBe(true);
        }
        expect(tokenBucket.take(1)).toBe(false);
    });
});
