import { EnumValueNode } from 'graphql/language';
import {
    LuvioArgumentNode,
    LuvioObjectValueNode,
    LuvioValueNode,
} from 'packages/lds-graphql-parser/dist/ast';
import { message, PredicateError } from './Error';
import { ObjectInfo, ReferenceFieldInfo, ReferenceToInfo } from './info-types';
import { ComparisonOperator, JsonExtract, OrderBy, OrderByContainer, ValueType } from './Predicate';
import { failure, Result, success } from './Result';
import { is, isObjectValueNode } from './type-guards';
import { comparison, extractPath, getFieldInfo, referencePredicate, stringLiteral } from './util';

function fieldsToOrderBy(
    fieldValues: LuvioValueNode[],
    joinAlias: string,
    apiName: string,
    input: { [name: string]: ObjectInfo }
): Result<OrderByContainer, PredicateError> {
    const firstObject = fieldValues[0];

    if (!isObjectValueNode(firstObject)) {
        return failure<OrderByContainer, PredicateError>(
            message('Parent OrderBy node should be an object.')
        );
    }

    return Object.entries(firstObject.fields).map(([key, value]) =>
        orderBy(key, value, joinAlias, apiName, input)
    )[0];
}

function orderBy<T extends LuvioValueNode>(
    name: string,
    value: T,
    tableAlias: string,
    apiName: string,
    input: { [name: string]: ObjectInfo }
): Result<OrderByContainer, PredicateError> {
    if (!isObjectValueNode(value)) {
        return failure(message('OrderBy node must be an object.'));
    }

    return fieldsOrderBy(name, value, tableAlias, apiName, input);
}

function spanningOrderBy(
    fieldInfo: ReferenceFieldInfo,
    fieldNode: LuvioObjectValueNode,
    alias: string,
    input: { [name: string]: ObjectInfo }
): Result<OrderByContainer, PredicateError> {
    const { apiName: fieldName, referenceToInfos, relationshipName } = fieldInfo;

    const referenceInfo: ReferenceToInfo | undefined = referenceToInfos[0];
    const jsonAlias = `${alias}.${relationshipName}`;
    const joinPredicate = referencePredicate(alias, jsonAlias, fieldName);

    if (referenceInfo === undefined) {
        return failure(message(`No reference info found for ${fieldName}`));
    }

    const { apiName } = referenceInfo;
    const path = extractPath('ApiName');
    const extract: JsonExtract = { type: ValueType.Extract, jsonAlias, path };
    const typePredicate = comparison(extract, ComparisonOperator.eq, stringLiteral(apiName));

    return fieldsToOrderBy([fieldNode], jsonAlias, apiName, input).map((container) => {
        const { orderBy, joinNames: names, joinPredicates: predicates } = container;
        const joinPredicates = predicates.concat(joinPredicate, typePredicate);
        const joinNames = names.concat(jsonAlias);

        return { orderBy, joinNames, joinPredicates };
    });
}

function fieldsOrderBy(
    fieldName: string,
    fieldNode: LuvioObjectValueNode,
    alias: string,
    apiName: string,
    input: { [name: string]: ObjectInfo }
): Result<OrderByContainer, PredicateError> {
    const fieldInfoResult = getFieldInfo(apiName, fieldName, input);
    if (fieldInfoResult.isSuccess === false) {
        return failure(fieldInfoResult.error);
    }

    const fieldInfo = fieldInfoResult.value;
    if (fieldInfo === undefined) {
        return failure(message(`Field ${fieldName} for type ${apiName} not found.`));
    }

    if (fieldInfo.dataType === 'Reference' && fieldInfo.relationshipName === fieldName) {
        return spanningOrderBy(fieldInfo, fieldNode, alias, input);
    }

    return orderByDetails(fieldNode, alias, fieldName).map((orderBy) => {
        return { orderBy, joinNames: [], joinPredicates: [] };
    });
}

function orderByDetails(
    fieldNode: LuvioObjectValueNode,
    jsonAlias: string,
    path: string
): Result<OrderBy, PredicateError> {
    const extract: JsonExtract = { type: ValueType.Extract, jsonAlias, path: extractPath(path) };

    const orderField = fieldNode.fields['order'];
    const nullsField = fieldNode.fields['nulls'];

    const asc = isAsc(orderField);
    const nulls = nullsFirst(nullsField);

    if (asc.isSuccess === false) {
        return failure(asc.error);
    }

    if (nulls.isSuccess === false) {
        return failure(nulls.error);
    }

    return success({ asc: asc.value, extract, nullsFirst: nulls.value });
}

function isAsc(field: LuvioValueNode): Result<boolean, PredicateError> {
    if (field !== undefined) {
        if (is<EnumValueNode>(field, 'EnumValue')) {
            switch (field.value) {
                case 'ASC':
                    return success(true);
                case 'DESC':
                    return success(false);
                default:
                    return failure(message(`Unknown order enum ${field.value}.`));
            }
        }

        return failure(message(`OrderBy order field must be an enum.`));
    }

    return success(true);
}

function nullsFirst(field: LuvioValueNode): Result<boolean, PredicateError> {
    if (field !== undefined) {
        if (is<EnumValueNode>(field, 'EnumValue')) {
            switch (field.value) {
                case 'FIRST':
                    return success(true);
                case 'LAST':
                    return success(false);
                default:
                    return failure(message(`Unknown nulls enum ${field.value}.`));
            }
        }

        return failure(message(`OrderBy nulls field must be an enum.`));
    }

    return success(false);
}

export function parseOrderBy(
    orderByArg: LuvioArgumentNode | undefined,
    joinAlias: string,
    apiName: string,
    input: { [name: string]: ObjectInfo }
): Result<OrderByContainer | undefined, PredicateError> {
    if (orderByArg === undefined) {
        return success(undefined);
    }

    return fieldsToOrderBy([orderByArg.value], joinAlias, apiName, input);
}
