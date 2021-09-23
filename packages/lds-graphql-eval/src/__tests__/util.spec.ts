import {
    getFieldInfo,
    getRelationshipInfo,
    combinePredicates,
    comparison,
    stringLiteral,
} from '../util';
import infoJson from './mockData/objectInfos.json';

import { FieldInfo, ObjectInfoMap, RelationshipInfo } from '../info-types';
import { CompoundPredicate } from '../Predicate';

const objectInfoMap = infoJson as ObjectInfoMap;
describe('utils', () => {
    describe('getFieldInfo', () => {
        it('returns scalar field with matching fieldName', () => {
            const actual = getFieldInfo('TimeSheet', 'TimeSheetNumber', objectInfoMap);
            const expected: FieldInfo = {
                fieldType: 'Scalar',
                dataType: 'String',
                apiName: 'TimeSheetNumber',
            };
            expect(actual).toEqual(expected);
        });

        it('returns reference field with relationshipName', () => {
            const actual = getFieldInfo('TimeSheet', 'Owner', objectInfoMap);
            const expected: FieldInfo = {
                fieldType: 'Reference',
                apiName: 'OwnerId',
                relationshipName: 'Owner',
                referenceToaApiName: 'User',
            };
            expect(actual).toEqual(expected);
        });

        it('returns undefined when no matching scalar or reference field exists', () => {
            const actual = getFieldInfo('TimeSheet', 'NotAField', objectInfoMap);
            expect(actual).toBeUndefined();
        });

        it('returns undefined when no object info with apiName exists', () => {
            const actual = getFieldInfo('NotAType', 'NotAField', objectInfoMap);
            expect(actual).toBeUndefined();
        });
    });

    describe('getRelationshipInfo', () => {
        it('returns relationship info with matching fieldName', () => {
            const actual = getRelationshipInfo('TimeSheet', 'TimeSheetEntries', objectInfoMap);
            const expected: RelationshipInfo = {
                fieldName: 'TimeSheetId',
                relationshipName: 'TimeSheetEntries',
                childObjectApiName: 'TimeSheetEntry',
            };
            expect(actual).toEqual(expected);
        });

        it('returns undefined when no relationship with fieldName exists', () => {
            const actual = getRelationshipInfo('TimeSheet', 'NotARelationship', objectInfoMap);
            expect(actual).toBeUndefined();
        });

        it('returns undefined when no object info with apiName exists', () => {
            const actual = getRelationshipInfo('NotAType', 'TimeSheetEntries', objectInfoMap);
            expect(actual).toBeUndefined();
        });
    });

    describe('combinePredicates', () => {
        it('flattens compound predicates that match the given operator', () => {
            const predicate1 = comparison(stringLiteral('1'), 'ne', stringLiteral('one'));
            const predicate2 = comparison(stringLiteral('2'), 'ne', stringLiteral('dos'));
            const predicate3 = comparison(stringLiteral('3'), 'ne', stringLiteral('tre'));
            const predicate4 = comparison(stringLiteral('4'), 'ne', stringLiteral('quatro'));
            const predicate5 = comparison(stringLiteral('5'), 'ne', stringLiteral('cinque'));

            const and: CompoundPredicate = {
                type: 'compound',
                operator: 'and',
                children: [predicate2, predicate3],
            };

            const and2: CompoundPredicate = {
                type: 'compound',
                operator: 'and',
                children: [predicate4, predicate5],
            };

            const actual = combinePredicates([and, and2, predicate1], 'and');
            const expected: CompoundPredicate = {
                type: 'compound',
                operator: 'and',
                children: [predicate1, predicate2, predicate3, predicate4, predicate5],
            };

            expect(actual).toEqual(expected);
        });

        it('does not flatten compound predicates that do not match the given operator', () => {
            const predicate1 = comparison(stringLiteral('1'), 'ne', stringLiteral('one'));
            const predicate2 = comparison(stringLiteral('2'), 'ne', stringLiteral('dos'));
            const predicate3 = comparison(stringLiteral('3'), 'ne', stringLiteral('tre'));

            const or: CompoundPredicate = {
                type: 'compound',
                operator: 'or',
                children: [predicate2, predicate3],
            };

            const or2: CompoundPredicate = {
                type: 'compound',
                operator: 'or',
                children: [predicate2, predicate3],
            };

            const actual = combinePredicates([or, or2, predicate1], 'and');
            const expected: CompoundPredicate = {
                type: 'compound',
                operator: 'and',
                children: [predicate1, or, or2],
            };

            expect(actual).toEqual(expected);
        });

        it('includes comparison operators in resulting compound predicate', () => {
            const predicate1 = comparison(stringLiteral('1'), 'ne', stringLiteral('one'));
            const predicate2 = comparison(stringLiteral('2'), 'ne', stringLiteral('dos'));
            const predicate3 = comparison(stringLiteral('3'), 'ne', stringLiteral('tre'));

            const actual = combinePredicates([predicate1, predicate2, predicate3], 'and');
            const expected: CompoundPredicate = {
                type: 'compound',
                operator: 'and',
                children: [predicate1, predicate2, predicate3],
            };

            expect(actual).toEqual(expected);
        });

        it('returns a single comparison predicate if it is the only value included', () => {
            const predicate = comparison(stringLiteral('Adrian'), 'ne', stringLiteral('Adrian'));

            const andActual = combinePredicates([predicate], 'and');
            const orActual = combinePredicates([predicate], 'or');
            expect(andActual).toEqual(predicate);
            expect(orActual).toEqual(predicate);
        });
    });
});
