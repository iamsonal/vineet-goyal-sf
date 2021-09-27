/*
 * Copyright 2019 salesforce.com, inc.
 * All Rights Reserved
 * Company Confidential
 */

import { LightningElement, wire, api } from 'lwc';
import { getRelatedListCount } from 'lds-adapters-uiapi';

export default class RelatedListCount extends LightningElement {
    @api parentRecordId;
    @api relatedListId;
    wirePushCount = -1;

    @wire(getRelatedListCount, {
        parentRecordId: '$parentRecordId',
        relatedListId: '$relatedListId',
    })
    ongetRelatedListCount(result) {
        this.getRelatedListCount = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.getRelatedListCount.data;
    }

    @api
    getError() {
        return this.getRelatedListCount.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
