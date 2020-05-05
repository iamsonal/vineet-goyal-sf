/*
 * Copyright 2019 salesforce.com, inc.
 * All Rights Reserved
 * Company Confidential
 */

import { LightningElement, wire, api } from 'lwc';
import { getRelatedListRecords, refresh } from 'lds';

export default class Basic extends LightningElement {
    @api parentRecordId;
    @api relatedListId;
    @api fields;
    @api optionalFields;
    @api pageToken;
    @api pageSize;
    @api sortBy;

    wirePushCount = -1;

    @wire(getRelatedListRecords, {
        parentRecordId: '$parentRecordId',
        relatedListId: '$relatedListId',
        fields: '$fields',
        optionalFields: '$optionalFields',
        pageToken: '$pageToken',
        pageSize: '$pageSize',
        sortBy: '$sortBy',
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

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    async refresh() {
        return refresh(this.relatedListRecordsData);
    }
}
