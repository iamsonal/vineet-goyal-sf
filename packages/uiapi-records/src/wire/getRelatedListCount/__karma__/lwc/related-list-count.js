/*
 * Copyright 2019 salesforce.com, inc.
 * All Rights Reserved
 * Company Confidential
 */

import { LightningElement, wire, api } from 'lwc';
import { getRelatedListCount } from 'lds';

export default class RelatedListCount extends LightningElement {
    @api parentRecordId;
    @api relatedListName;
    wirePushCount = -1;

    @wire(getRelatedListCount, {
        parentRecordId: '$parentRecordId',
        relatedListName: '$relatedListName',
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
