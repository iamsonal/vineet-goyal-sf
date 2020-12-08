interface RateLimitConfig {
    bucketCapacity: number;
    fillsPerSecond: number;
}

const RATE_LIMIT_CONFIG: RateLimitConfig = {
    bucketCapacity: 100,
    fillsPerSecond: 100,
};

class TokenBucket {
    readonly bucketCapacity: number;
    readonly refillTokensPerMilliSecond: number;
    private tokens: number;
    private lastRefillTime: number;
    private static instance: TokenBucket;

    /**
     * Constructs an instance of Token Bucket for rate limiting
     *
     * @param bucket The token holding capacity of the bucket
     * @param refillTokensPerSecond The number of tokens replenished every second
     */
    public constructor(config: RateLimitConfig) {
        this.bucketCapacity = config.bucketCapacity;
        this.refillTokensPerMilliSecond = config.fillsPerSecond / 1000;
        this.tokens = config.bucketCapacity;
        this.lastRefillTime = Date.now();
    }

    /**
     * Refills the bucket and removes desired number of tokens
     *
     * @param removeTokens number of tokens to be removed from the bucket should be >= 0
     * @returns {boolean} true if removing token was succesful
     */

    public take(removeTokens: number): boolean {
        // refill tokens before removing
        this.refill();
        const { tokens } = this;
        const remainingTokens = tokens - removeTokens;

        if (remainingTokens >= 0) {
            this.tokens = remainingTokens;
            return true;
        }
        return false;
    }

    private refill(): void {
        const { bucketCapacity, tokens, refillTokensPerMilliSecond, lastRefillTime } = this;
        const now = Date.now();
        const timePassed = now - lastRefillTime;
        // Number of tokens should be integer so something like Math.floor is desired
        // Using Bitwise NOT ~ twice will achieve the same result with performance benefits
        const calculatedTokens = tokens + ~~(timePassed * refillTokensPerMilliSecond);

        this.tokens = bucketCapacity < calculatedTokens ? bucketCapacity : calculatedTokens;
        this.lastRefillTime = now;
    }
}

export default new TokenBucket(RATE_LIMIT_CONFIG);
