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

    // from https://git.soma.salesforce.com/instrumentation/o11y-client/blob/master/packages/o11y/src/
    // and https://confluence.internal.salesforce.com/display/LIGHTINS/o11y+JavaScript+API+Reference
    export type SchematizedDataValue = any;
    export type SchematizedData = { [k: string]: SchematizedDataValue };
    export type MetricsTags = Record<string, number | string | boolean>;
    export interface Schema {
        namespace: string;
        name: string;
        pbjsSchema: any; // INamespace
    }
    export interface Activity {
        // When the stop method is called, a duration is computed since the time the activity
        // was created with Instrumentation.startActivity. When logged, the timestamp of the log
        // is the time startActivity is called, not when stop is called.
        stop(userSchemaOrText?: Schema | string, userData?: SchematizedData): void;

        // This method not only logs the error, but also associates the error's log ID captures
        // the most recent information about errors and exceptions that occur during the activity
        // and that the developer wants to be associated with the activity.
        error(error: Error, userSchemaOrText?: Schema | string, userData?: SchematizedData): void;

        // This method stops the activity and sets the stop reason to "discarded".
        discard(): void;

        // This method stops the activity and sets the stop reason as "terminated".
        // experimental, use at your own peril.
        terminate(): void;
    }

    interface Instrumentation {
        // Provides fundamental logging functionality.
        // Enforces developers to own and maintain the type of data that they log via schematization.
        log(schema: Schema, data?: SchematizedData): void;

        // This method captures information about errors and exceptions.
        //
        // On Core, the Instrumentation platform will automatically capture unhandled exceptions.
        // For other scenarios, for example, when a network request fails (and fetch doesn’t throw
        // on HTTP error codes by design), the developer can choose to use this method to log the error.
        error(err: Error, userSchemaOrText?: string, data?: SchematizedData): void;

        // This method creates an activity object with the specified name, As with all other log methods,
        // this method records the current time when called, but also captures useful information by default
        // based on a schema maintained by the Instrumentation team.
        // When the method is called, it will automatically create a distributed tracing “span” with the same name.
        startActivity(name: string): Activity;

        // This method increments an UpCounter metric identified by its name (operation),
        // whether it has any errors, and any tags (key-value pairs) provided.
        incrementCounter(
            operation: string,
            increment?: number,
            hasError?: boolean,
            tags?: MetricsTags
        ): void;

        // This method records the value for a ValueRecorder metric identified by its name (operation),
        // whether it has any errors, and any tags (key-value pairs) provided.
        trackValue(operation: string, value: number, hasError?: boolean, tags?: MetricsTags): void;
    }

    export const getInstrumentation: (name: string) => Instrumentation;

    export const idleDetector: IdleDetector;
}
