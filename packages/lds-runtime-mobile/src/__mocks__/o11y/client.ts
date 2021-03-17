import { IdleDetectedListener, IdleDetector, IsBusyChecker } from 'o11y/client';

function requestIdleDetectedCallback(_callback: IdleDetectedListener) {}

function declareNotifierTaskSingle(_name: string) {
    return {
        isBusy: false,
        done: function() {},
    };
}

function declareNotifierTaskMulti(_name: string, _existingBusyCount?: number) {
    return {
        isBusy: false,
        add: function() {},
        done: function() {},
    };
}

function declarePollableTaskMulti(_name: string, _isBusyChecker: IsBusyChecker) {}

export const idleDetector: IdleDetector = {
    requestIdleDetectedCallback,
    declareNotifierTaskSingle,
    declareNotifierTaskMulti,
    declarePollableTaskMulti,
};
