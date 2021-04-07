import { StoreLink } from '@luvio/engine';
import { addFieldsToStoreLink } from '../normalize';

describe('addFieldsToStoreLink', () => {
    it('add fields in fieldsTrie to storeLink data', () => {
        const storeLink: StoreLink = {
            __ref: 'record-field-store-key',
        };

        const fieldsTrie = {
            name: 'Test__r',
            scalar: false,
            children: {
                Id: {
                    name: 'Id',
                    scalar: true,
                    children: {},
                },
            },
        };

        const optionalFieldsTrie = {
            name: '',
            children: {},
        };

        addFieldsToStoreLink(fieldsTrie, optionalFieldsTrie, storeLink);

        expect(storeLink.data).toEqual({ fields: ['Id'] });
    });

    it('add optional fields in fieldsTrie to storeLink data', () => {
        const storeLink: StoreLink = {
            __ref: 'record-field-store-key',
        };

        const fieldsTrie = {
            name: '',
            children: {},
        };
        const optionalFieldsTrie = {
            name: 'Test__r',
            scalar: false,
            optional: true,
            children: {
                Id: {
                    name: 'Id',
                    scalar: true,
                    optional: true,
                    children: {},
                },
            },
        };

        addFieldsToStoreLink(fieldsTrie, optionalFieldsTrie, storeLink);

        expect(storeLink.data).toEqual({ fields: ['Id'] });
    });
});
