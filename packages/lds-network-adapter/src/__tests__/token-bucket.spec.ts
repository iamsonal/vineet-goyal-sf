import { TokenBucket, RATE_LIMIT_CONFIG } from '../token-bucket';
import timekeeper from 'timekeeper';

let tokenBucket;

describe('token bucket', () => {
    beforeEach(() => {
        timekeeper.freeze(Date.now());
        tokenBucket = new TokenBucket(RATE_LIMIT_CONFIG);
    });

    afterEach(() => {
        timekeeper.reset();
    });

    it('returns true when have tokens and false when the bucket is empty', () => {
        for (let i = 0; i < RATE_LIMIT_CONFIG.bucketCapacity; i++) {
            expect(tokenBucket.take(1)).toBe(true);
        }
        expect(tokenBucket.take(1)).toBe(false);
    });

    it('refill should add a token when enough time has passed', () => {
        for (let i = 0; i < RATE_LIMIT_CONFIG.bucketCapacity; i++) {
            tokenBucket.take(1);
        }
        expect(tokenBucket.take(1)).toBe(false);

        // only refill 1 token
        timekeeper.travel(Date.now() + 1000 / RATE_LIMIT_CONFIG.fillsPerSecond);
        expect(tokenBucket.take(1)).toBe(true);
        expect(tokenBucket.take(1)).toBe(false);
    });

    it('should not add more tokens than bucket capacity', () => {
        for (let i = 0; i < RATE_LIMIT_CONFIG.bucketCapacity; i++) {
            tokenBucket.take(1);
        }
        expect(tokenBucket.take(1)).toBe(false);

        // refill bucket to capacity
        timekeeper.travel(Date.now() + 1000);
        for (let i = 0; i < RATE_LIMIT_CONFIG.bucketCapacity; i++) {
            tokenBucket.take(1);
        }
        expect(tokenBucket.take(1)).toBe(false);
    });
});
