declare module 'o11y/client' {
    // from https://git.soma.salesforce.com/instrumentation/next-gen-client/blob/master/src/interfaces/IdleDetector.ts
    export type IdleDetectedListener = (timestamp: number) => void;
    export type DoneNotifier = () => void;
    export type IsBusyChecker = () => boolean;

    export interface TaskerSingle {
        readonly isBusy: boolean;
        done: DoneNotifier;
    }

    export interface TaskerMulti {
        readonly isBusy: boolean;
        add: () => void;
        done: DoneNotifier;
    }

    // IdleDetector notifies interested parties when the next idle is detected.
    // It works in cooperation with Idle Detector Components (IDCs) that opt-in.
    // There are 3 types of IDCs:
    // 1. Single-Task IDC --> Is busy until done, never busy again.
    // 2. Multi-Task IDC --> Is busy from time-to-time, with one or more tasks.
    // 3. Poll-only IDC --> It's busy-ness can only be ascertained by calling its status checker.
    export interface IdleDetector {
        // One-time callback
        requestIdleDetectedCallback(callback: IdleDetectedListener): void;

        // A single-task is considered busy until done when the returned function is called.
        // It is assumed idle then on.
        declareNotifierTaskSingle(name: string): TaskerSingle;

        // A multi-task is for IdleDetector components that can be intermittently busy.
        // If there are already outstanding tasks (i.e. busy operations) at the time of
        // the call, it must be specified.
        //
        // The busy state is managed  by a Tasker object via an internal counter.
        // The counter is initalized to `existingBusyCount` or 0, if not specified.
        // The  `add` and `done` methods of the Tasker increment and decrement
        // the counter respectively. `isBusy` returns true if counter > 0.
        declareNotifierTaskMulti(name: string, existingBusyCount?: number): TaskerMulti;

        // This is provided for backwards-compatibility only and should not be used for new code.
        declarePollableTaskMulti(name: string, isBusyChecker: IsBusyChecker): void;
    }

    interface Instrumentation {
        error(err: Error, userSchemaOrText?: string): void;
    }

    export const getInstrumentation: (name: string) => Instrumentation;

    export const idleDetector: IdleDetector;
}
