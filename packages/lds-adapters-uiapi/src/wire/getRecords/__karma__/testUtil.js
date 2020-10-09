/**
 * Returns all record ids from the mock data or just one id if index is passed
 * @param {object} mock - GetRecords response representation {records : {recordId: {id: '...', fields: {...} }}}
 * @param {number} index - index of the record id [optional]
 * @returns {string|string[]} - string if index is passed, else array of recordIds
 */
export function getIdsFromGetRecordsMock(mock, index) {
    const outputIds = [];
    const { results } = mock;
    for (let index = 0, len = results.length; index < len; index += 1) {
        const { result: currentResultItem } = results[index];
        outputIds.push(currentResultItem.id);
    }
    if (index === undefined) {
        return outputIds;
    }
    return outputIds[index];
}

/**
 *
 * @param  {...object} mocks - GetRecord response representation mock object
 * @returns {object} - GetRecords response shape
 */
export function convertRecordMocktoGetRecordsMockShape(mocks) {
    const results = [];
    if (Array.isArray(mocks)) {
        for (let index = 0, len = mocks.length; index < len; index += 1) {
            results.push({
                statusCode: 200,
                result: mocks[index],
            });
        }
    } else {
        results.push({
            result: mocks,
            statusCode: 200,
        });
    }

    return {
        results,
    };
}
