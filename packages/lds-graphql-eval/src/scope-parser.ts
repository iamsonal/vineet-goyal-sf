import type { LuvioArgumentNode } from '@luvio/graphql-parser';
import type { ParserInput } from './ast-parser';
import type { PredicateError } from './Error';
import { message } from './Error';
import type { Predicate, ExistsPredicate, CompoundPredicate } from './Predicate';
import { PredicateType, ComparisonOperator, ValueType, CompoundOperator } from './Predicate';
import type { Result } from './Result';
import { success, failure } from './Result';
import { getFieldInfo, extractPath, comparison, stringLiteral } from './util';

export function scopeFilter(
    scopeArg: LuvioArgumentNode | undefined,
    jsonAlias: string,
    apiName: string,
    input: ParserInput
): Result<Predicate | undefined, PredicateError> {
    if (scopeArg === undefined) {
        return success(undefined);
    }

    const value = scopeArg.value;
    if (value.kind !== 'EnumValue') {
        return failure(message('Scope type should be an EnumValueNode.'));
    }

    const scope = value.value;

    if (scope === 'MINE') {
        const fieldInfoResult = getFieldInfo(apiName, 'OwnerId', input.objectInfoMap);
        if (fieldInfoResult.isSuccess === false) {
            return failure(fieldInfoResult.error);
        }

        const fieldInfo = fieldInfoResult.value;
        if (fieldInfo === undefined) {
            return failure(
                message('Scope MINE requires the entity type to have an OwnerId field.')
            );
        }

        return success({
            type: PredicateType.comparison,
            left: {
                type: ValueType.Extract,
                jsonAlias,
                path: extractPath(fieldInfo.apiName),
            },
            operator: ComparisonOperator.eq,
            right: stringLiteral(input.userId),
        });
    }

    if (scope === 'ASSIGNEDTOME') {
        if (apiName !== 'ServiceAppointment') {
            return failure(message('ASSIGNEDTOME can only be used with ServiceAppointment'));
        }

        return success(assignedToMe(input));
    }

    return failure(message(`Scope '${scope} is not supported.`));
}

function assignedToMe(input: ParserInput): ExistsPredicate {
    const srApiName = 'ServiceResource';
    const arApiName = 'AssignedResource';

    const apiNamePath = extractPath('ApiName');
    const serviceResourceIdPath = extractPath('ServiceResourceId');
    const serviceAppointmentIdPath = extractPath('ServiceAppointmentId');
    const relatedRecordIdPath = extractPath('RelatedRecordId');
    const idPath = extractPath('Id');

    const serviceResourceIdPredicate = comparison(
        { type: ValueType.Extract, jsonAlias: arApiName, path: serviceResourceIdPath },
        ComparisonOperator.eq,
        { type: ValueType.Extract, jsonAlias: srApiName, path: idPath }
    );
    const serviceAppointmentIdPredicate = comparison(
        { type: ValueType.Extract, jsonAlias: arApiName, path: serviceAppointmentIdPath },
        ComparisonOperator.eq,
        { type: ValueType.Extract, jsonAlias: 'ServiceAppointment', path: idPath }
    );
    const userIdPredicate = comparison(
        { type: ValueType.Extract, jsonAlias: srApiName, path: relatedRecordIdPath },
        ComparisonOperator.eq,
        stringLiteral(input.userId)
    );
    const arTypePredicate = comparison(
        { type: ValueType.Extract, jsonAlias: arApiName, path: apiNamePath },
        ComparisonOperator.eq,
        stringLiteral(arApiName, true, true)
    );
    const srTypePredicate = comparison(
        { type: ValueType.Extract, jsonAlias: srApiName, path: apiNamePath },
        ComparisonOperator.eq,
        stringLiteral(srApiName, true, true)
    );

    const compound: CompoundPredicate = {
        type: PredicateType.compound,
        operator: CompoundOperator.and,
        children: [
            serviceResourceIdPredicate,
            serviceAppointmentIdPredicate,
            userIdPredicate,
            arTypePredicate,
            srTypePredicate,
        ],
    };

    const existsPredicate: ExistsPredicate = {
        type: PredicateType.exists,
        alias: arApiName,
        joinNames: [srApiName],
        predicate: compound,
    };

    return existsPredicate;
}
