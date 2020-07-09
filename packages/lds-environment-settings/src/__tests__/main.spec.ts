(global as any).window = {};

import { getEnvironmentSetting, EnvironmentSettings } from '../main';

let auraGetSpy = jest.fn();

window.$A = {
    get: auraGetSpy,
};

beforeEach(() => {
    auraGetSpy.mockReset();
});

describe('getEmnvironmentSetting', () => {
    it('should call $A.get with allowed name parameter', () => {
        getEnvironmentSetting(EnvironmentSettings.ForceRecordTransactionsDisabled);
        expect(auraGetSpy).toHaveBeenCalledTimes(1);
        expect(auraGetSpy).toHaveBeenCalledWith(
            '$Browser.S1Features.forceRecordTransactionsDisabled'
        );
    });

    it('should call $A.get with allowed name parameter, but not defined on client', () => {
        auraGetSpy.mockReturnValueOnce(undefined);
        const value = getEnvironmentSetting(EnvironmentSettings.ForceRecordTransactionsDisabled);
        expect(auraGetSpy).toHaveBeenCalledTimes(1);
        expect(auraGetSpy).toHaveBeenCalledWith(
            '$Browser.S1Features.forceRecordTransactionsDisabled'
        );
        expect(value).toBe(undefined);
    });
});
