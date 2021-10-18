import { Expression, Predicate, PredicateType, ValueType } from './Predicate';

export function isExpressionEqual(lh: Expression, rh: Expression): boolean {
    if (lh.type === ValueType.StringLiteral && rh.type === ValueType.StringLiteral) {
        return lh.value === rh.value;
    }

    if (lh.type === ValueType.DoubleLiteral && rh.type === ValueType.DoubleLiteral) {
        return lh.value === rh.value;
    }

    if (lh.type === ValueType.IntLiteral && rh.type === ValueType.IntLiteral) {
        return lh.value === rh.value;
    }

    if (lh.type === ValueType.BooleanLiteral && rh.type === ValueType.BooleanLiteral) {
        return lh.value === rh.value;
    }

    if (lh.type === ValueType.StringArray && rh.type === ValueType.StringArray) {
        return isArrayEqual(lh.value, rh.value, isStrictEqual);
    }

    if (lh.type === ValueType.NumberArray && rh.type === ValueType.NumberArray) {
        return isArrayEqual(lh.value, rh.value, isStrictEqual);
    }

    if (lh.type === ValueType.DateValue && rh.type === ValueType.DateValue) {
        return lh.value === rh.value;
    }

    if (lh.type === ValueType.DateEnum && rh.type === ValueType.DateEnum) {
        return lh.value === rh.value;
    }

    if (lh.type === ValueType.DateTimeValue && rh.type === ValueType.DateTimeValue) {
        return lh.value === rh.value;
    }

    if (lh.type === ValueType.DateTimeEnum && rh.type === ValueType.DateTimeEnum) {
        return lh.value === rh.value;
    }

    if (lh.type === ValueType.NullValue && rh.type === ValueType.NullValue) {
        return true;
    }

    if (lh.type === ValueType.DateArray && rh.type === ValueType.DateArray) {
        return isArrayEqual(lh.value, rh.value, isExpressionEqual);
    }

    if (lh.type === ValueType.DateTimeArray && rh.type === ValueType.DateTimeArray) {
        return isArrayEqual(lh.value, rh.value, isExpressionEqual);
    }

    if (lh.type === ValueType.Extract && rh.type === ValueType.Extract) {
        return lh.path === rh.path && lh.jsonAlias === rh.jsonAlias;
    }

    return false;
}

function isStrictEqual<T>(l: T, r: T): boolean {
    return l === r;
}

function isArrayEqual<T>(lh: T[], rh: T[], compare: (l: T, r: T) => boolean): boolean {
    if (lh.length !== rh.length) {
        return false;
    }

    for (let index = 0; index < rh.length; index++) {
        const r = rh[index];
        const l = lh[index];

        if (compare(l, r) === false) {
            return false;
        }
    }

    return true;
}

function isPredicateEqual(lh: Predicate, rh: Predicate): boolean {
    const { nullComparison, not, comparison, compound } = PredicateType;

    if (rh.type === nullComparison && lh.type === nullComparison) {
        return rh.operator === lh.operator && isExpressionEqual(rh.left, lh.left);
    }

    if (rh.type === not && lh.type === not) {
        return isPredicateEqual(rh.child, lh.child);
    }

    if (rh.type === comparison && lh.type === comparison) {
        return (
            rh.operator === lh.operator &&
            isExpressionEqual(rh.left, lh.left) &&
            isExpressionEqual(rh.right, lh.right)
        );
    }

    if (rh.type === compound && lh.type === compound) {
        const lChildren = lh.children;
        const rChildren = rh.children;

        return isArrayEqual(lChildren, rChildren, isPredicateEqual);
    }

    return false;
}

function containsPredicate(predicates: Predicate[], predicate: Predicate): boolean {
    for (let index = 0; index < predicates.length; index++) {
        const element = predicates[index];
        if (isPredicateEqual(predicate, element)) {
            return true;
        }
    }

    return false;
}

export function removeDuplicatePredicates(predicates: Predicate[]): Predicate[] {
    return predicates.reduce(function (acc: Predicate[], b) {
        if (containsPredicate(acc, b) === false) {
            acc.push(b);
        }

        return acc;
    }, []);
}
