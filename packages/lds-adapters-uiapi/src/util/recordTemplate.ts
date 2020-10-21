import { LDS, ProxyGraphNode } from '@ldsjs/engine';
import {
    FieldValueRepresentation,
    FieldValueRepresentationNormalized,
} from '../generated/types/FieldValueRepresentation';
import {
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../generated/types/RecordRepresentation';
import {
    RecordTemplateCreateRepresentationNormalized,
    RecordTemplateCreateRepresentation,
} from '../generated/types/RecordTemplateCreateRepresentation';
import {
    RecordTemplateCloneRepresentationNormalized,
    RecordTemplateCloneRepresentation,
} from '../generated/types/RecordTemplateCloneRepresentation';
import {
    isGraphNode,
    FieldValueRepresentationLinkState,
    extractTrackedFields as extractTrackedFields_records,
} from './records';
import { MAX_RECORD_DEPTH } from '../selectors/record';
import { ArrayPrototypePush } from './language';
import { dedupe } from '../validation/utils';

type RecordRepresentationLikeNormalized =
    | RecordTemplateCloneRepresentationNormalized
    | RecordTemplateCreateRepresentationNormalized;
type RecordRepresentationLike =
    | RecordTemplateCreateRepresentation
    | RecordTemplateCloneRepresentation;

export function extractTrackedFields(
    node: ProxyGraphNode<RecordRepresentationLikeNormalized, RecordRepresentationLike>,
    parentFieldName: string,
    fieldsList: string[] = []
): string[] {
    // Filter Error and null nodes
    if (!isGraphNode(node)) {
        return [];
    }

    const fields = node.object('fields');
    const keys = fields.keys();

    for (let i = 0, len = keys.length; i < len; i += 1) {
        const key = keys[i];
        const fieldValueRep = fields.link<
            FieldValueRepresentationNormalized,
            FieldValueRepresentation,
            FieldValueRepresentationLinkState
        >(key);

        const fieldName = `${parentFieldName}.${key}`;
        if (fieldValueRep.isMissing()) {
            ArrayPrototypePush.call(fieldsList, fieldName);
            continue;
        }

        const field = fieldValueRep.follow();

        // Filter Error and null nodes
        if (!isGraphNode(field)) {
            continue;
        }

        if (field.isScalar('value') === false) {
            const spanning = field
                .link<RecordRepresentationNormalized, RecordRepresentation>('value')
                .follow();

            extractTrackedFields_records(
                spanning,
                fieldName,
                fieldsList,
                {},
                MAX_RECORD_DEPTH // Only get tracked fields 1 level deep
            );
        } else {
            const state = fieldValueRep.linkData();
            if (state !== undefined) {
                const { fields } = state;
                for (let s = 0, len = fields.length; s < len; s += 1) {
                    const childFieldName = fields[s];
                    ArrayPrototypePush.call(fieldsList, `${fieldName}.${childFieldName}`);
                }
            } else {
                ArrayPrototypePush.call(fieldsList, fieldName);
            }
        }
    }

    return fieldsList;
}

export function getTrackedFields(lds: LDS, key: string, fieldsFromConfig?: string[]): string[] {
    const fieldsList = fieldsFromConfig === undefined ? [] : [...fieldsFromConfig];

    const graphNode = lds.getNode<RecordRepresentationLikeNormalized, RecordRepresentationLike>(
        key
    );
    if (!isGraphNode(graphNode)) {
        return fieldsList;
    }

    const fileName = graphNode.scalar('apiName');
    const fields = extractTrackedFields(graphNode, fileName, fieldsList);

    return dedupe(fields).sort();
}
