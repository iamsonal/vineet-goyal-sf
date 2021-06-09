/*
 * Copyright 2019 salesforce.com, inc.
 * All Rights Reserved
 * Company Confidential
 */

import { LightningElement, wire, api } from 'lwc';
import { getRelatedListsCount, refresh } from 'lds-adapters-uiapi';

export default class RelatedListsCount extends LightningElement {
    @api parentRecordId;
    @api relatedListNames;
    wirePushCount = -1;

    @wire(getRelatedListsCount, {
        parentRecordId: '$parentRecordId',
        relatedListNames: '$relatedListNames',
    })
    ongetRelatedListsCount(result) {
        this.getRelatedListsCount = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.getRelatedListsCount.data;
    }

    @api
    getError() {
        return this.getRelatedListsCount.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api refresh() {
        return refresh(this.getRelatedListsCount);
    }
}
