// from https://git.soma.salesforce.com/instrumentation/next-gen-client/blob/master/src/interfaces/IdleDetector.ts
type IdleDetectedListener = (timestamp: number) => void;
type DoneNotifier = () => void;
type IsBusyChecker = () => boolean;

interface TaskerSingle {
    readonly isBusy: boolean;
    done: DoneNotifier;
}

interface TaskerMulti {
    readonly isBusy: boolean;
    add: () => void;
    done: DoneNotifier;
}

interface IdleDetector {
    requestIdleDetectedCallback(callback: IdleDetectedListener): void;
    declareNotifierTaskSingle(name: string): TaskerSingle;
    declareNotifierTaskMulti(name: string, existingBusyCount?: number): TaskerMulti;
    declarePollableTaskMulti(name: string, isBusyChecker: IsBusyChecker): void;
}

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

interface Schema {
    namespace: string;
    name: string;
    pbjsSchema: any; // INamespace
}

interface Activity {
    stop(userSchemaOrText?: Schema | string, userData?: SchematizedData): void;
}

function stop(_userSchemaOrText?: Schema | string, _userData?: SchematizedData) {}

export const activity: Activity = {
    stop,
};

// Instrumentation
export const mockInstrumentation = {
    startActivity,
    error: jest.fn(),
};
function startActivity(_name: string): Activity {
    return activity;
}

export const getInstrumentation = jest.fn().mockReturnValue(mockInstrumentation);
