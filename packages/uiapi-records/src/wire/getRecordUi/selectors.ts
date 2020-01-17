import { Selector, PathSelection } from '@salesforce-lds/engine';

import { ArrayPrototypePush } from '../../util/language';
import { buildSelectionFromRecord } from '../../selectors/record';

import { RecordRepresentation } from '../../generated/types/RecordRepresentation';
import { select as objectInfoSelect } from '../../generated/types/ObjectInfoRepresentation';
import { select as recordLayoutRepresentationSelect } from '../../generated/types/RecordLayoutRepresentation';
import { select as recordLayoutUserStateRepresentationSelect } from '../../generated/types/RecordLayoutUserStateRepresentation';

const layoutSelections = recordLayoutRepresentationSelect().selections;
const objectInfoPathSelection = objectInfoSelect().selections;
const layoutUserStatePathSelector = recordLayoutUserStateRepresentationSelect().selections;

export interface RecordDef {
    recordId: string;
    recordData: RecordRepresentation;
    recordTypeId: string;
}

export function buildRecordUiSelector(
    recordDefs: RecordDef[],
    layoutTypes: string[],
    modes: string[]
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
                selections: layoutSelections,
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
        ArrayPrototypePush.call(recordSelections, {
            kind: 'Link',
            name: recordId,
            selections: buildSelectionFromRecord(recordData),
        });
    }

    return {
        kind: 'Fragment',
        selections: [
            {
                kind: 'Link',
                name: 'layoutUserStates',
                map: true,
                selections: layoutUserStatePathSelector,
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
                selections: objectInfoPathSelection,
            },
            {
                name: 'records',
                kind: 'Object',
                selections: recordSelections,
            },
        ],
    };
}
