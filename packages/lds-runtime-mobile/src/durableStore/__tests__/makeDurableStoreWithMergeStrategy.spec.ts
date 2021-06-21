import {
    makeDurableStoreWithMergeStrategy,
    MergeStrategy,
} from '../makeDurableStoreWithMergeStrategy';

class MockMergeStrategy implements MergeStrategy {
    shouldMerge(_incomingKeys: string[]): boolean {
        return true;
    }
    mergeDurableEntries = jest.fn();
}
describe('makeDrableStoreWithMergeStrategy', () => {
    it('undefined result from durable store does not call merge strategy', async () => {
        const getEntriesSpy = jest.fn().mockResolvedValue(undefined);
        const setEntriesSpy = jest.fn().mockResolvedValue(Promise.resolve());
        const durableStore = {
            getEntries: getEntriesSpy,
            setEntries: setEntriesSpy,
        } as any;

        const withMerge = makeDurableStoreWithMergeStrategy(durableStore);
        const strategy = new MockMergeStrategy();

        withMerge.registerMergeStrategy(strategy);

        await withMerge.setEntries(
            {
                foo: { data: { bar: true } },
            },
            'DEFAULT'
        );

        expect(strategy.mergeDurableEntries).toBeCalledTimes(0);
    });

    it('empty result set does not call merge strategy', async () => {
        const getEntriesSpy = jest.fn().mockResolvedValue({});
        const setEntriesSpy = jest.fn().mockResolvedValue(Promise.resolve());
        const durableStore = {
            getEntries: getEntriesSpy,
            setEntries: setEntriesSpy,
        } as any;

        const withMerge = makeDurableStoreWithMergeStrategy(durableStore);
        const strategy = new MockMergeStrategy();

        withMerge.registerMergeStrategy(strategy);

        await withMerge.setEntries(
            {
                foo: { data: { bar: true } },
            },
            'DEFAULT'
        );

        expect(strategy.mergeDurableEntries).toBeCalledTimes(0);
    });

    it('calls merge strategy with existing and incoming records', async () => {
        const getEntriesSpy = jest.fn().mockResolvedValue({
            foo: { data: { baz: true } },
        });
        const setEntriesSpy = jest.fn().mockResolvedValue(Promise.resolve());
        const durableStore = {
            getEntries: getEntriesSpy,
            setEntries: setEntriesSpy,
        } as any;

        const withMerge = makeDurableStoreWithMergeStrategy(durableStore);
        const mockedMerge = { foo: { data: { bar: true, baz: true } } };
        const strategy = new MockMergeStrategy();
        strategy.mergeDurableEntries = jest.fn().mockResolvedValue(mockedMerge);

        withMerge.registerMergeStrategy(strategy);

        await withMerge.setEntries(
            {
                foo: { data: { bar: true } },
            },
            'DEFAULT'
        );

        expect(strategy.mergeDurableEntries).toBeCalledTimes(1);
        expect(setEntriesSpy).toBeCalledWith(mockedMerge, 'DEFAULT');
    });

    it('runs next queue item when merge strategy throws', async () => {
        const getEntriesSpy = jest.fn().mockResolvedValue({
            foo: { data: { baz: true } },
        });
        const setEntriesSpy = jest.fn().mockResolvedValue(Promise.resolve());
        const durableStore = {
            getEntries: getEntriesSpy,
            setEntries: setEntriesSpy,
        } as any;

        const withMerge = makeDurableStoreWithMergeStrategy(durableStore);
        const mockedReject = { bad: true };
        const mockedMerge2 = { foo: { data: { bar: true, baz: true, biz: true } } };
        const strategy = new MockMergeStrategy();
        strategy.mergeDurableEntries = jest
            .fn()
            .mockRejectedValueOnce(mockedReject)
            .mockResolvedValueOnce(mockedMerge2);

        withMerge.registerMergeStrategy(strategy);

        const first = withMerge.setEntries(
            {
                foo: { data: { bar: true } },
            },
            'DEFAULT'
        );

        const second = withMerge.setEntries(
            {
                foo: { data: { bar: true } },
            },
            'DEFAULT'
        );

        (await expect(first)).rejects.toEqual(mockedReject);
        await second;
        expect(setEntriesSpy).toBeCalledTimes(1);
        expect(setEntriesSpy).toBeCalledWith(mockedMerge2, 'DEFAULT');
    });
});
