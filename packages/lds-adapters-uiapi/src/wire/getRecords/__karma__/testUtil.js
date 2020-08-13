/**
 * Returns all record ids from the mock data or just one id if index is passed
 * @param {object} mock - GetRecords response representation {records : {recordId: {id: '...', fields: {...} }}}
 * @param {number} index - index of the record id [optional]
 * @returns {string|string[]} - string if index is passed, else array of recordIds
 */
export function getIdsFromGetRecordsMock(mock, index) {
    const ids = Object.keys(mock.records);
    if (index === undefined) {
        return ids;
    }
    return ids[index];
}

/**
 *
 * @param  {...object} mocks - GetRecord response representation mock object
 * @returns {object} - GetRecords response shape
 */
export function convertRecordMocktoGetRecordsMockShape(...mocks) {
    const records = mocks.reduce(function(acc, currentMock) {
        acc[currentMock.id] = JSON.parse(JSON.stringify(currentMock));
        return acc;
    }, {});
    return { records };
}
