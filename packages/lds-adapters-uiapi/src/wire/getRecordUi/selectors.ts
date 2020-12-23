import { Selector, PathSelection } from '@luvio/engine';

import { ArrayPrototypePush } from '../../util/language';
import { buildSelectionFromFields } from '../../selectors/record';
import { extractFields } from '../../util/fields';

import { RecordRepresentation } from '../../generated/types/RecordRepresentation';
import { select as objectInfoSelect } from '../../generated/types/ObjectInfoRepresentation';
import { select as recordLayoutRepresentationSelect } from '../../generated/types/RecordLayoutRepresentation';
import { select as recordLayoutUserStateRepresentationSelect } from '../../generated/types/RecordLayoutUserStateRepresentation';

const layoutSelections = recordLayoutRepresentationSelect();
const objectInfoPathSelection = objectInfoSelect();
const layoutUserStatePathSelector = recordLayoutUserStateRepresentationSelect();

export interface RecordDef {
    recordId: string;
    recordData: RecordRepresentation;
    recordTypeId: string;
}

export function buildRecordUiSelector(
    recordDefs: RecordDef[],
    layoutTypes: string[],
    modes: string[],
    recordOptionalFields: { [key: string]: string[] }
): Selector<any>['node'] {
    const layoutTypeSelections: PathSelection[] = [];

    for (let i = 0, len = layoutTypes.length; i < len; i += 1) {
        const layoutType = layoutTypes[i];
        const modeSelections: PathSelection[] = [];
        const sel: PathSelection = {
            kind: 'Object',
            name: layoutType,
            selections: modeSelections,
        };
        for (let m = 0; m < modes.length; m += 1) {
            const mode = modes[m];
            const modeSel: PathSelection = {
                kind: 'Link',
                name: mode,
                fragment: layoutSelections,
            };

            ArrayPrototypePush.call(modeSelections, modeSel);
        }

        ArrayPrototypePush.call(layoutTypeSelections, sel);
    }

    const recordLayoutSelections: PathSelection[] = [];
    const recordSelections: PathSelection[] = [];

    for (let i = 0, len = recordDefs.length; i < len; i += 1) {
        const { recordId, recordData } = recordDefs[i];

        ArrayPrototypePush.call(recordLayoutSelections, {
            kind: 'Object',
            name: recordData.apiName,
            required: false,
            map: true,
            selections: layoutTypeSelections,
        });
        const optionalFields = recordOptionalFields[recordId];
        const fields = extractFields(recordData);
        ArrayPrototypePush.call(recordSelections, {
            kind: 'Link',
            name: recordId,
            fragment: {
                kind: 'Fragment',
                selections: buildSelectionFromFields(fields, optionalFields),
                private: ['eTag', 'weakEtag'],
            },
        });
    }

    return {
        kind: 'Fragment',
        private: ['eTag'],
        selections: [
            {
                kind: 'Link',
                name: 'layoutUserStates',
                map: true,
                fragment: layoutUserStatePathSelector,
            },
            {
                kind: 'Object',
                name: 'layouts',
                selections: recordLayoutSelections,
            },
            {
                kind: 'Link',
                name: 'objectInfos',
                map: true,
                fragment: objectInfoPathSelection,
            },
            {
                name: 'records',
                kind: 'Object',
                selections: recordSelections,
            },
        ],
    };
}
