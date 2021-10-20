import { LuvioArgumentNode } from 'packages/lds-graphql-parser/dist/ast';
import { ParserInput } from './ast-parser';
import {
    Predicate,
    PredicateType,
    ComparisonOperator,
    ValueType,
    ExistsPredicate,
    CompoundPredicate,
    CompoundOperator,
} from './Predicate';
import { Result, success, failure } from './Result';
import { getFieldInfo, extractPath, comparison, stringLiteral } from './util';

export function scopeFilter(
    scopeArg: LuvioArgumentNode | undefined,
    jsonAlias: string,
    apiName: string,
    input: ParserInput
): Result<Predicate | undefined, string> {
    if (scopeArg === undefined) {
        return success(undefined);
    }

    const value = scopeArg.value;
    if (value.kind !== 'EnumValue') {
        return failure('Scope type should be an EnumValueNode.');
    }

    const scope = value.value;

    if (scope === 'MINE') {
        const fieldInfo = getFieldInfo(apiName, 'OwnerId', input.objectInfoMap);

        if (fieldInfo === undefined) {
            return failure('Scope MINE requires the entity type to have an OwnerId field.');
        }

        return success({
            type: PredicateType.comparison,
            left: {
                type: ValueType.Extract,
                jsonAlias,
                path: extractPath(fieldInfo.apiName),
            },
            operator: ComparisonOperator.eq,
            right: {
                type: ValueType.StringLiteral,
                value: input.userId,
            },
        });
    }

    if (scope === 'ASSIGNEDTOME') {
        if (apiName !== 'ServiceAppointment') {
            return failure('ASSIGNEDTOME can only be used with ServiceAppointment');
        }

        return success(assignedToMe(input));
    }

    return failure(`Scope '${scope} is not supported.`);
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
        { type: ValueType.StringLiteral, value: input.userId }
    );
    const arTypePredicate = comparison(
        { type: ValueType.Extract, jsonAlias: arApiName, path: apiNamePath },
        ComparisonOperator.eq,
        stringLiteral(arApiName)
    );
    const srTypePredicate = comparison(
        { type: ValueType.Extract, jsonAlias: srApiName, path: apiNamePath },
        ComparisonOperator.eq,
        stringLiteral(srApiName)
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
