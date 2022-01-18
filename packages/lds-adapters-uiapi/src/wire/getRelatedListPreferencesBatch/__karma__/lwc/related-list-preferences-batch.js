/*
 * Copyright 2019 salesforce.com, inc.
 * All Rights Reserved
 * Company Confidential
 */

import { LightningElement, wire, api } from 'lwc';
import { getRelatedListPreferencesBatch } from 'lds-adapters-uiapi';

export default class RelatedListInfoBatch extends LightningElement {
    @api preferencesIds;
    wirePushCount = -1;

    @wire(getRelatedListPreferencesBatch, {
        preferencesIds: '$preferencesIds',
    })
    ongetRelatedListsPreferencesBatch(result) {
        this.getRelatedListPreferencesBatch = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.getRelatedListPreferencesBatch.data;
    }

    @api
    getError() {
        return this.getRelatedListPreferencesBatch.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
