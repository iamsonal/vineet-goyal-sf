const DEBUG_LOG_PREFIX = 'lds-debug-plugin';
const DEBUG_LOG_DELIMETER = '::';

interface CounterLog {
    type: 'counter';
    id: string;
    count: number;
}

interface AdapterStart {
    type: 'adapter-start';
    timestamp: number;
    adapterId: string;
    adapterName: string;
    config: string;
}

interface AdapterCallback {
    type: 'adapter-callback';
    timestamp: number;
    adapterId: string;
}

interface AdapterUnsubscribe {
    type: 'adapter-unsubscribe';
    timestamp: number;
    adapterId: string;
}

export type DebugLog = CounterLog | AdapterStart | AdapterCallback | AdapterUnsubscribe;

function log(type: string, log: string) {
    // eslint-disable-next-line no-console
    console.log(`${[DEBUG_LOG_PREFIX, type, log].join(DEBUG_LOG_DELIMETER)}`);
}

export function debugLog(debugLog: DebugLog) {
    if (process.env.NODE_ENV === 'production') {
        return;
    }

    if (debugLog.type === 'counter') {
        // e.g: lds-debug-plugin::counter::network:10
        return log(debugLog.id, debugLog.type);
    }

    if (debugLog.type === 'adapter-start') {
        // e.g: lds-debug-plugin::adapter-start::1::123456::getRecord::{"recordId": "12345", "fields": "Account.Name"}
        return log(
            debugLog.type,
            [debugLog.adapterId, debugLog.timestamp, debugLog.adapterName, debugLog.config].join(
                DEBUG_LOG_DELIMETER
            )
        );
    }

    if (debugLog.type === 'adapter-callback') {
        // e.g: lds-debug-plugin::adapter-callback::1::123456
        return log(
            debugLog.type,
            [debugLog.adapterId, debugLog.timestamp].join(DEBUG_LOG_DELIMETER)
        );
    }

    if (debugLog.type === 'adapter-unsubscribe') {
        // e.g: lds-debug-plugin::adapter-unsubscribe::1::123456
        return log(
            debugLog.type,
            [debugLog.adapterId, debugLog.timestamp].join(DEBUG_LOG_DELIMETER)
        );
    }
}
