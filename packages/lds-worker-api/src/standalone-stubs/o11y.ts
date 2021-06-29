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

export const mockInstrumentation = {
    error: jest.fn(),
};

export const getInstrumentation = jest.fn().mockReturnValue(mockInstrumentation);

export const idleDetector: IdleDetector = {
    requestIdleDetectedCallback,
    declareNotifierTaskSingle,
    declareNotifierTaskMulti,
    declarePollableTaskMulti,
};
