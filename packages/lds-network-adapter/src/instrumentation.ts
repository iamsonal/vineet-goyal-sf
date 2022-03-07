import type { ResourceRequest } from '@luvio/engine';

export interface Instrumentation {
    networkRateLimitExceeded(): void;
    duplicateRequest(cb: () => ResourceRequest): void;
    aggregateUiChunkCount(cb: () => number): void;
    getRecordNormalInvoke(): void;
    getRecordAggregateInvoke(): void;
    getRecordAggregateRetry(): void;
    aggregateUiConnectError(): void;
    getRecordAggregateResolve(cb: () => { recordId: string; apiName: string }): void;
    getRecordAggregateReject(cb: () => string): void;
}

const NO_OP = () => {};

export let instrumentation: Instrumentation = {
    networkRateLimitExceeded: NO_OP,
    duplicateRequest: NO_OP,
    aggregateUiConnectError: NO_OP,
    aggregateUiChunkCount: NO_OP,
    getRecordNormalInvoke: NO_OP,
    getRecordAggregateRetry: NO_OP,
    getRecordAggregateInvoke: NO_OP,
    getRecordAggregateResolve: NO_OP,
    getRecordAggregateReject: NO_OP,
};

export function instrument(newInstrumentation: Partial<Instrumentation>) {
    instrumentation = Object.assign(instrumentation, newInstrumentation);
}
