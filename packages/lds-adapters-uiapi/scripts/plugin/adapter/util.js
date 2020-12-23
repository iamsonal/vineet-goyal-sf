function adapterConfigInterfaceName(adapter) {
    const name = adapter.name;

    return `${name.charAt(0).toUpperCase()}${name.slice(1)}Config`;
}

module.exports = {
    adapterConfigInterfaceName,
};
