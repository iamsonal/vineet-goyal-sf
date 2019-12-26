/*
 * Copyright 2019 salesforce.com, inc.
 * All Rights Reserved
 * Company Confidential
 */

import { LightningElement, wire, api } from 'lwc';
import { getRelatedListRecords } from 'lds';

export default class Basic extends LightningElement {
    @api parentRecordId;
    @api relatedListId;
    @api fields;

    wirePushCount = -1;

    @wire(getRelatedListRecords, {
        parentRecordId: '$parentRecordId',
        relatedListId: '$relatedListId',
        fields: '$fields',
    })
    onGetRelatedListRecords(result) {
        this.relatedListRecordsData = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.relatedListRecordsData.data;
    }

    @api
    getError() {
        return this.relatedListRecordsData.error;
    }
}
