export function incrementGetRecordAggregateInvokeCount() {}
export function incrementGetRecordNormalInvokeCount() {}

export const instrumentation = {
    instrumentAdapter: (adapter: any) => {
        return adapter;
    },
};

export function registerLdsCacheStats() {
    return {
        logHits() {},
        logMisses() {},
    };
}

export function logCRUDLightningInteraction() {}
