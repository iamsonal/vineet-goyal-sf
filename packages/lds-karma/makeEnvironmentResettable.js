const contextSpies = Object.create(null);
const resetAllAdapterContexts = () => {
    const keys = Object.keys(contextSpies);
    for (const key of keys) {
        const { context, entries } = contextSpies[key];
        entries.forEach((entry) => {
            context.set(entry, undefined);
        });
        delete contextSpies[key];
    }
};

function makeContextSpyable(context, adapterName) {
    const existingSpy = contextSpies[adapterName];
    const contextEntries = existingSpy === undefined ? [] : [...existingSpy.entries];

    const set = function (key, value) {
        contextEntries.push(key);
        contextSpies[adapterName] = { context, entries: contextEntries };
        context.set(key, value);
    };
    return Object.create(context, {
        set: { value: set },
    });
}

function makeEnvironmentResettable(environment) {
    const withContext = function (adapter, onContextLoaded) {
        const adapterSpy = (config, context) => {
            return adapter(config, makeContextSpyable(context, adapter.name));
        };
        return environment.withContext(adapterSpy, onContextLoaded);
    };
    return Object.create(environment, {
        withContext: { value: withContext },
    });
}

export { resetAllAdapterContexts, makeEnvironmentResettable };
