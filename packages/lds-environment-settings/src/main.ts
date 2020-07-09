export enum EnvironmentSettings {
    ForceRecordTransactionsDisabled = 'forceRecordTransactionsDisabled',
}

const GATE_FORCE_RECORD_TRANSACTIONS_DISABLED =
    '$Browser.S1Features.forceRecordTransactionsDisabled';

const supportedEnvironmentSettings = {
    [EnvironmentSettings.ForceRecordTransactionsDisabled]: GATE_FORCE_RECORD_TRANSACTIONS_DISABLED,
};

/**
 * Returns aura configuration settings. Used to check gate/perm statuses.
 * @param name Name of the setting to check.
 * @returns Value of the setting, or undefined if $A is not available.
 */
export function getEnvironmentSetting(name: EnvironmentSettings): boolean | undefined {
    const environmentSetting = supportedEnvironmentSettings[name];
    if (typeof (window as any).$A !== 'undefined' && environmentSetting !== undefined) {
        return (window as any).$A.get(environmentSetting);
    }
    return undefined;
}
