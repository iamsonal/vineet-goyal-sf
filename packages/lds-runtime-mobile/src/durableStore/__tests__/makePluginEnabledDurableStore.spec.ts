import { MockDurableStore } from '@luvio/adapter-test-library';
import { DefaultDurableSegment } from '@luvio/environments';
import { flushPromises } from '../../__tests__/testUtils';
import { makePluginEnabledDurableStore } from '../makePluginEnabledDurableStore';

describe('makePluginEnableDurableStore tests', () => {
    it('calls registered plugins', async () => {
        const durableStore = new MockDurableStore();
        const beforeSetSpy = jest.fn();
        const pluginEnabled = makePluginEnabledDurableStore(durableStore);
        pluginEnabled.registerPlugins([
            {
                beforeSet: beforeSetSpy,
            },
        ]);
        const key = 'key';
        pluginEnabled.setEntries({ [key]: { data: {} } }, DefaultDurableSegment);
        await flushPromises();
        expect(beforeSetSpy).toBeCalledTimes(1);
        expect(beforeSetSpy.mock.calls[0][0]).toBe(key);
        expect(beforeSetSpy.mock.calls[0][2]).toBe(DefaultDurableSegment);
    });
    it('works on non default segments', async () => {
        const durableStore = new MockDurableStore();
        const beforeSetSpy = jest.fn();
        const pluginEnabled = makePluginEnabledDurableStore(durableStore);
        pluginEnabled.registerPlugins([
            {
                beforeSet: beforeSetSpy,
            },
        ]);
        const key = 'key';
        pluginEnabled.setEntries({ [key]: { data: {} } }, 'RANDOM');
        await flushPromises();
        expect(beforeSetSpy).toBeCalledTimes(1);
        expect(beforeSetSpy.mock.calls[0][0]).toBe(key);
        expect(beforeSetSpy.mock.calls[0][2]).toBe('RANDOM');
    });
});
