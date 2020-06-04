import { Store, LDS, Environment } from '@ldsjs/engine';
import {
    ingest,
    keyBuilder,
    CreateRecordTemplateRepresentation,
} from '../../generated/types/CreateRecordTemplateRepresentation';

import { getTrackedFields } from '../recordTemplate';

import recordTemplate from './data/sampleRecordTemplate';

function buildSampleRecordTemplate(): CreateRecordTemplateRepresentation {
    return JSON.parse(JSON.stringify(recordTemplate));
}

describe('getTrackedFields', () => {
    it('should return correct tracked fields 1 level deep', () => {
        const store = new Store();
        const lds = new LDS(new Environment(store, () => Promise.reject()));

        const key = keyBuilder({
            apiName: 'Account',
            recordTypeId: '012000000000000AAA',
        });

        ingest(buildSampleRecordTemplate(), { fullPath: key, parent: null }, lds, store, 0);
        const fields = getTrackedFields(lds, key, []);
        expect(fields).toEqual([
            'Account.CreatedDate',
            'Account.Name',
            'Account.Owner.City',
            'Account.Owner.Id',
            'Account.OwnerId',
        ]);
    });

    it('should include fields passed to getTrackedFields', () => {
        const store = new Store();
        const lds = new LDS(new Environment(store, () => Promise.reject()));

        const key = keyBuilder({
            apiName: 'Account',
            recordTypeId: '012000000000000AAA',
        });

        ingest(buildSampleRecordTemplate(), { fullPath: key, parent: null }, lds, store, 0);
        const fields = getTrackedFields(lds, key, ['Account.Foo']);
        expect(fields).toEqual([
            'Account.CreatedDate',
            'Account.Foo',
            'Account.Name',
            'Account.Owner.City',
            'Account.Owner.Id',
            'Account.OwnerId',
        ]);
    });

    it('should dedupe fields passed to getTrackedFields', () => {
        const store = new Store();
        const lds = new LDS(new Environment(store, () => Promise.reject()));

        const key = keyBuilder({
            apiName: 'Account',
            recordTypeId: '012000000000000AAA',
        });

        ingest(buildSampleRecordTemplate(), { fullPath: key, parent: null }, lds, store, 0);
        const fields = getTrackedFields(lds, key, ['Account.Name']);
        expect(fields).toEqual([
            'Account.CreatedDate',
            'Account.Name',
            'Account.Owner.City',
            'Account.Owner.Id',
            'Account.OwnerId',
        ]);
    });
});
