// from https://git.soma.salesforce.com/instrumentation/next-gen-client/blob/master/src/interfaces/IdleDetector.ts
import type { IdleDetector, Activity, Schema } from 'o11y/dist/modules/o11y/client/interfaces';
type IdleDetectedListener = (timestamp: number) => void;
type IsBusyChecker = () => boolean;

function requestIdleDetectedCallback(_callback: IdleDetectedListener) {}

function declareNotifierTaskSingle(_name: string) {
    return {
        isBusy: false,
        done: function () {},
    };
}

function declareNotifierTaskMulti(_name: string, _existingBusyCount?: number) {
    return {
        isBusy: false,
        add: function () {},
        done: function () {},
    };
}

function declarePollableTaskMulti(_name: string, _isBusyChecker: IsBusyChecker) {}

export const idleDetector: IdleDetector = {
    requestIdleDetectedCallback,
    declareNotifierTaskSingle,
    declareNotifierTaskMulti,
    declarePollableTaskMulti,
};

// Activity
// from https://git.soma.salesforce.com/instrumentation/o11y-client/blob/master/packages/o11y/src/
// and https://confluence.internal.salesforce.com/display/LIGHTINS/o11y+JavaScript+API+Reference
type SchematizedDataValue = any;
type SchematizedData = { [k: string]: SchematizedDataValue };

function stop(_userSchemaOrText?: Schema | string, _userData?: SchematizedData) {}
function error(_error: Error, _userSchemaOrText?: Schema | string, _userData?: SchematizedData) {}

export const activity: Partial<Activity> = {
    stop,
    error,
};

// Instrumentation
type MetricsTags = Record<string, number | string | boolean>;

function startActivity(_name: string): Activity {
    return activity as Activity;
}

export const mockInstrumentation = {
    startActivity,
    error: () => {},
    trackValue: (
        _operation: string,
        _value: number,
        _hasError?: boolean,
        _tags?: MetricsTags
    ) => {},
    incrementCounter: (
        _operation: string,
        _increment?: number,
        _hasError?: boolean,
        _tags?: MetricsTags
    ) => {},
};

export const getInstrumentation = () => {
    return mockInstrumentation;
};
