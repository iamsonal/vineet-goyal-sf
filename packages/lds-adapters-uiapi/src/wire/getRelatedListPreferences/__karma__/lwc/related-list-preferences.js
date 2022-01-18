/*
 * Copyright 2019 salesforce.com, inc.
 * All Rights Reserved
 * Company Confidential
 */

import { LightningElement, wire, api } from 'lwc';
import { getRelatedListPreferences } from 'lds-adapters-uiapi';

export default class RelatedListPreferences extends LightningElement {
    @api preferencesId;
    wirePushCount = -1;

    @wire(getRelatedListPreferences, {
        preferencesId: '$preferencesId',
    })
    ongetRelatedListPreferences(result) {
        this.getRelatedListPreferences = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.getRelatedListPreferences.data;
    }

    @api
    getError() {
        return this.getRelatedListPreferences.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
