/*
 * Copyright 2019 salesforce.com, inc.
 * All Rights Reserved
 * Company Confidential
 */

import { LightningElement, wire, api } from 'lwc';
import { getRelatedListInfoBatch } from 'lds';

export default class RelatedListInfoBatch extends LightningElement {
    @api parentObjectApiName;
    @api relatedListNames;
    wirePushCount = -1;

    @wire(getRelatedListInfoBatch, {
        parentObjectApiName: '$parentObjectApiName',
        relatedListNames: '$relatedListNames',
    })
    ongetRelatedListsCount(result) {
        this.getRelatedListInfoBatch = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.getRelatedListInfoBatch.data;
    }

    @api
    getError() {
        return this.getRelatedListInfoBatch.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
