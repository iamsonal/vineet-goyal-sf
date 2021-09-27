import { ResourceRequest } from '@luvio/engine';

export interface Instrumentation {
    networkRateLimitExceeded(): void;
    duplicateRequest(cb: () => ResourceRequest): void;
    aggregateUiChunkCount(cb: () => number): void;
    getRecordNormalInvoke(): void;
    getRecordAggregateInvoke(): void;
    getRecordAggregateRetry(): void;
    aggregateUiConnectError(): void;
}

const NO_OP = () => {};

const defaultInstrumentation: Instrumentation = {
    networkRateLimitExceeded: NO_OP,
    duplicateRequest: NO_OP,
    aggregateUiConnectError: NO_OP,
    aggregateUiChunkCount: NO_OP,
    getRecordNormalInvoke: NO_OP,
    getRecordAggregateRetry: NO_OP,
    getRecordAggregateInvoke: NO_OP,
};

export function getInstrumentation(partial: Partial<Instrumentation>) {
    return { ...defaultInstrumentation, ...partial };
}
