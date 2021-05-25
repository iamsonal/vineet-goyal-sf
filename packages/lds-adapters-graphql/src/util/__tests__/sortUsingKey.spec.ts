import { sortAndCopyUsingObjectKey } from '../sortUsingKey';

describe('sortAndCopyUsingObjectKey', () => {
    it('should sort, return a new array and not mutate the original array', () => {
        const objectArray = [
            { name: 'c', value: 1 },
            { name: 'b', value: 2 },
            { name: 'a', value: 3 },
        ];
        const copyObjectArray = [...objectArray];
        const sortedObjectArray = [
            { name: 'a', value: 3 },
            { name: 'b', value: 2 },
            { name: 'c', value: 1 },
        ];

        const result = sortAndCopyUsingObjectKey(objectArray, 'name');

        expect(result).toEqual(sortedObjectArray);
        expect(objectArray).toEqual(copyObjectArray);
    });
});
