/*
 * Copyright 2019 salesforce.com, inc.
 * All Rights Reserved
 * Company Confidential
 */

import { LightningElement, wire, api } from 'lwc';
import { getRelatedListRecordsBatch, refresh } from 'lds-adapters-uiapi';

export default class Basic extends LightningElement {
    @api parentRecordId;
    @api relatedListParameters;

    wirePushCount = -1;

    @wire(getRelatedListRecordsBatch, {
        parentRecordId: '$parentRecordId',
        relatedListParameters: '$relatedListParameters',
    })
    onGetRelatedListRecordsBatch(result) {
        this.relatedListRecordsBatchData = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.relatedListRecordsBatchData.data;
    }

    @api
    getError() {
        return this.relatedListRecordsBatchData.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    async refresh() {
        return refresh(this.relatedListRecordsBatchData);
    }
}
