declare module 'aura' {
    export const executeGlobalController: (
        endpoint: string,
        params: any,
        config?: ActionConfig
    ) => Promise<any>;

    export interface ActionConfig {
        background: boolean;
        hotspot: boolean;
        longRunning: boolean;
    }
}

// In some containers like Talon, "$A" is not globally available.
declare var $A:
    | {
          get(value: string): any;
      }
    | undefined;
