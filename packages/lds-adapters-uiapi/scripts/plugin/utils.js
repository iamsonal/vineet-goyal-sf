function getSuffix(id) {
    const split = id.split('#');
    return split[1].replace('/luvio', '');
}

module.exports = {
    getSuffix,
};
