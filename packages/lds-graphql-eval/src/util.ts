import { removeDuplicatePredicates } from './comparison';
import { FieldInfo, ObjectInfo, RelationshipInfo } from './info-types';
import {
    BooleanLiteral,
    ComparisonOperator,
    ComparisonPredicate,
    CompoundOperator,
    DoubleLiteral,
    Expression,
    IntLiteral,
    isBetweenPredicate,
    isComparisonPredicate,
    isCompoundPredicate,
    isNotPredicate,
    isNullComparisonPredicate,
    JsonExtract,
    Predicate,
    PredicateType,
    StringLiteral,
    ValueType,
} from './Predicate';

import { flatten } from './util/flatten';

export function getFieldInfo(
    apiName: string,
    fieldName: string,
    infoMap: { [name: string]: ObjectInfo }
): FieldInfo | undefined {
    const objInfo = infoMap[apiName];

    if (objInfo === undefined) {
        return undefined;
    }

    return Object.values(objInfo.fields).filter(
        (field) =>
            field.apiName === fieldName ||
            (field.dataType === 'Reference' && field.relationshipName === fieldName)
    )[0];
}

export function getRelationshipInfo(
    apiName: string,
    fieldName: string,
    infoMap: { [name: string]: ObjectInfo }
): RelationshipInfo | undefined {
    const objInfo = infoMap[apiName];

    return objInfo !== undefined ? objInfo.childRelationships[fieldName] : undefined;
}

export function stringLiteral(value: string): StringLiteral {
    return { type: ValueType.StringLiteral, value };
}

export function intLiteral(value: number): IntLiteral {
    return { type: ValueType.IntLiteral, value };
}

export function doubleLiteral(value: number): DoubleLiteral {
    return { type: ValueType.DoubleLiteral, value };
}

export function booleanLiteral(value: Boolean): BooleanLiteral {
    return { type: ValueType.BooleanLiteral, value };
}

export function comparison(
    left: JsonExtract,
    operator: ComparisonOperator,
    right: Expression
): ComparisonPredicate {
    return { type: PredicateType.comparison, left, right, operator };
}

function compoundOrSelf(children: Predicate[], operator: CompoundOperator): Predicate {
    if (children.length === 1) {
        return children[0];
    }

    return { type: PredicateType.compound, operator, children };
}

export function isEmptyPredicate(predicate: Predicate): Boolean {
    return isCompoundPredicate(predicate) ? predicate.children.length === 0 : false;
}

/**
 * Flattens the contents of child predicates of the same type as the new parent compound predicate.
 * Removes duplicate predicates found within the same compound predicate.
 *
 * @param predicates
 * @param operator
 * @returns
 */
export function combinePredicates(predicates: Predicate[], operator: CompoundOperator): Predicate {
    //compound predicates with a different type (and, or) than operator
    const otherCompoundPredicates = predicates
        .filter(isCompoundPredicate)
        .filter((pred) => pred.operator !== operator);

    const flattened = predicates
        .filter(isCompoundPredicate)
        .filter((pred) => pred.operator === operator)
        .map((pred) => pred.children)
        .reduce(flatten, []);

    const compares = predicates.filter(
        (pred) =>
            isComparisonPredicate(pred) ||
            isNullComparisonPredicate(pred) ||
            isBetweenPredicate(pred) ||
            isNotPredicate(pred)
    );

    const children = [...compares, ...flattened, ...otherCompoundPredicates];
    const uniques = removeDuplicatePredicates(children);
    return compoundOrSelf(uniques, operator);
}

export function referencePredicate(
    fromAlias: string,
    toAlias: string,
    referenceKey: string
): ComparisonPredicate {
    return comparison(
        { type: ValueType.Extract, jsonAlias: fromAlias, path: extractPath(referenceKey) },
        ComparisonOperator.eq,
        {
            type: ValueType.Extract,
            jsonAlias: toAlias,
            path: extractPath('Id'),
        }
    );
}

export function extractPath(fieldName: string, subfield: string | undefined = undefined): string {
    switch (fieldName) {
        case 'Id':
            return 'data.id';
        case 'ApiName':
            return 'data.apiName';
        default: {
            const sub = subfield !== undefined ? subfield : 'value';
            return `data.fields.${fieldName}.${sub}`;
        }
    }
}
