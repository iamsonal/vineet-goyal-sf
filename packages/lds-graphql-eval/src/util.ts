import { FieldInfo, ObjectInfo, RelationshipInfo } from './info-types';
import {
    BooleanLiteral,
    ComparisonOperator,
    ComparisonPredicate,
    CompoundOperator,
    DoubleLiteral,
    Expression,
    IntLiteral,
    isComparisonPredicate,
    isCompoundPredicate,
    Predicate,
    StringLiteral,
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
            (field.fieldType === 'Reference' && field.relationshipName === fieldName)
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
    return { type: 'StringLiteral', value };
}

export function intLiteral(value: number): IntLiteral {
    return { type: 'IntLiteral', value };
}

export function doubleLiteral(value: number): DoubleLiteral {
    return { type: 'DoubleLiteral', value };
}

export function booleanLiteral(value: Boolean): BooleanLiteral {
    return { type: 'BooleanLiteral', value };
}

export function comparison(
    left: Expression,
    operator: ComparisonOperator,
    right: Expression
): ComparisonPredicate {
    return { type: 'comparison', left, right, operator };
}

function compoundOrSelf(children: Predicate[], operator: CompoundOperator): Predicate {
    if (children.length === 1) {
        return children[0];
    }

    return { type: 'compound', operator, children };
}

export function isEmptyPredicate(predicate: Predicate): Boolean {
    return isCompoundPredicate(predicate) ? predicate.children.length === 0 : false;
}

/**
 * Flattens the contents of child predicates of the same type as the new parent compound predicate.
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

    const compares = predicates.filter(isComparisonPredicate);

    const children = [...compares, ...flattened, ...otherCompoundPredicates];

    return compoundOrSelf(children, operator);
}

export function referencePredicate(
    fromAlias: string,
    toAlias: string,
    referenceKey: string
): ComparisonPredicate {
    return comparison({ type: 'JsonExtract', jsonAlias: fromAlias, path: referenceKey }, 'eq', {
        type: 'JsonExtract',
        jsonAlias: toAlias,
        path: 'id',
    });
}