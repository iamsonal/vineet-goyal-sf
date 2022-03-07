import {
    getFieldInfo,
    getRelationshipInfo,
    combinePredicates,
    comparison,
    stringLiteral,
    extractPath,
} from '../util';
import infoJson from './mockData/objectInfos.json';

import { FieldInfo, ObjectInfoMap, RelationshipInfo } from '../info-types';
import {
    ComparisonOperator,
    CompoundOperator,
    CompoundPredicate,
    PredicateType,
    ValueType,
} from '../Predicate';
import { unwrappedError, unwrappedValue } from '../Result';

const objectInfoMap = infoJson as ObjectInfoMap;
describe('utils', () => {
    describe('getFieldInfo', () => {
        it('returns scalar field with matching fieldName', () => {
            const actual = getFieldInfo('TimeSheet', 'TimeSheetNumber', objectInfoMap);
            const expected: FieldInfo = {
                dataType: 'String',
                apiName: 'TimeSheetNumber',
            };
            expect(unwrappedValue(actual)).toEqual(expected);
        });

        it('returns reference field with relationshipName', () => {
            const actual = getFieldInfo('TimeSheet', 'Owner', objectInfoMap);
            const expected: FieldInfo = {
                apiName: 'OwnerId',
                dataType: 'Reference',
                relationshipName: 'Owner',
                referenceToInfos: [{ apiName: 'User' }],
            };
            expect(unwrappedValue(actual)).toEqual(expected);
        });

        it('returns undefined when no matching scalar or reference field exists', () => {
            const actual = getFieldInfo('TimeSheet', 'NotAField', objectInfoMap);
            expect(unwrappedValue(actual)).toBeUndefined();
        });

        it('returns undefined when no object info with apiName exists', () => {
            const actual = getFieldInfo('NotAType', 'NotAField', objectInfoMap);
            expect(unwrappedError(actual)).toEqual({
                type: 'MissingObjectInfoError',
                object: 'NotAType',
            });
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
            expect(unwrappedValue(actual)).toEqual(expected);
        });

        it('returns undefined when no relationship with fieldName exists', () => {
            const actual = getRelationshipInfo('TimeSheet', 'NotARelationship', objectInfoMap);
            expect(unwrappedValue(actual)).toBeUndefined();
        });

        it('returns undefined when no object info with apiName exists', () => {
            const actual = getRelationshipInfo('NotAType', 'TimeSheetEntries', objectInfoMap);
            expect(unwrappedError(actual)).toEqual({
                type: 'MissingObjectInfoError',
                object: 'NotAType',
            });
        });
    });

    describe('combinePredicates', () => {
        it('flattens compound predicates that match the given operator', () => {
            const predicate1 = comparison(
                { type: ValueType.Extract, jsonAlias: '1', path: '1' },
                ComparisonOperator.ne,
                stringLiteral('one')
            );
            const predicate2 = comparison(
                { type: ValueType.Extract, jsonAlias: '2', path: '2' },
                ComparisonOperator.ne,
                stringLiteral('dos')
            );
            const predicate3 = comparison(
                { type: ValueType.Extract, jsonAlias: '3', path: '3' },
                ComparisonOperator.ne,
                stringLiteral('tre')
            );
            const predicate4 = comparison(
                { type: ValueType.Extract, jsonAlias: '4', path: '4' },
                ComparisonOperator.ne,
                stringLiteral('quatro')
            );
            const predicate5 = comparison(
                { type: ValueType.Extract, jsonAlias: '5', path: '5' },
                ComparisonOperator.ne,
                stringLiteral('cinque')
            );

            const and: CompoundPredicate = {
                type: PredicateType.compound,
                operator: CompoundOperator.and,
                children: [predicate2, predicate3],
            };

            const and2: CompoundPredicate = {
                type: PredicateType.compound,
                operator: CompoundOperator.and,
                children: [predicate4, predicate5],
            };

            const actual = combinePredicates([and, and2, predicate1], CompoundOperator.and);
            const expected: CompoundPredicate = {
                type: PredicateType.compound,
                operator: CompoundOperator.and,
                children: [predicate1, predicate2, predicate3, predicate4, predicate5],
            };

            expect(actual).toEqual(expected);
        });

        it('does not flatten compound predicates that do not match the given operator', () => {
            const predicate1 = comparison(
                { type: ValueType.Extract, jsonAlias: '1', path: '1' },
                ComparisonOperator.ne,
                stringLiteral('one')
            );
            const predicate2 = comparison(
                { type: ValueType.Extract, jsonAlias: '2', path: '2' },
                ComparisonOperator.ne,
                stringLiteral('dos')
            );
            const predicate3 = comparison(
                { type: ValueType.Extract, jsonAlias: '3', path: '3' },
                ComparisonOperator.ne,
                stringLiteral('tre')
            );

            const or: CompoundPredicate = {
                type: PredicateType.compound,
                operator: CompoundOperator.or,
                children: [predicate2, predicate3],
            };

            const or2: CompoundPredicate = {
                type: PredicateType.compound,
                operator: CompoundOperator.or,
                children: [predicate2, predicate3],
            };

            const actual = combinePredicates([or, or2, predicate1], CompoundOperator.and);
            const expected: CompoundPredicate = {
                type: PredicateType.compound,
                operator: CompoundOperator.and,
                children: [predicate1, or2],
            };

            expect(actual).toEqual(expected);
        });

        it('includes comparison operators in resulting compound predicate', () => {
            const predicate1 = comparison(
                { type: ValueType.Extract, jsonAlias: '1', path: '1' },
                ComparisonOperator.ne,
                stringLiteral('one')
            );
            const predicate2 = comparison(
                { type: ValueType.Extract, jsonAlias: '2', path: '2' },
                ComparisonOperator.ne,
                stringLiteral('dos')
            );
            const predicate3 = comparison(
                { type: ValueType.Extract, jsonAlias: '3', path: '3' },
                ComparisonOperator.ne,
                stringLiteral('tre')
            );

            const actual = combinePredicates(
                [predicate1, predicate2, predicate3],
                CompoundOperator.and
            );
            const expected: CompoundPredicate = {
                type: PredicateType.compound,
                operator: CompoundOperator.and,
                children: [predicate1, predicate2, predicate3],
            };

            expect(actual).toEqual(expected);
        });

        it('returns a single comparison predicate if it is the only value included', () => {
            const predicate = comparison(
                { type: ValueType.Extract, jsonAlias: 'Adrian', path: 'Adrian' },
                ComparisonOperator.ne,
                stringLiteral('Adrian')
            );

            const andActual = combinePredicates([predicate], CompoundOperator.and);
            const orActual = combinePredicates([predicate], CompoundOperator.or);
            expect(andActual).toEqual(predicate);
            expect(orActual).toEqual(predicate);
        });
    });

    describe('extractPath', () => {
        it('returns correct path for Id', () => {
            const actual = extractPath('Id');
            expect(actual).toEqual('data.id');
        });

        it('returns correct path for apiName', () => {
            const actual = extractPath('ApiName');
            expect(actual).toEqual('data.apiName');
        });

        it('returns correct path for field with subfield', () => {
            const actual = extractPath('TimeSheetNumber', 'displayValue');
            expect(actual).toEqual('data.fields.TimeSheetNumber.displayValue');
        });

        it('returns correct path for field with default subfield', () => {
            const actual = extractPath('TimeSheetNumber');
            expect(actual).toEqual('data.fields.TimeSheetNumber.value');
        });
    });
});
