/*
 * Copyright 2019 salesforce.com, inc.
 * All Rights Reserved
 * Company Confidential
 */

import { LightningElement, wire, api } from 'lwc';
import { getRelatedListsInfo } from 'lds';

export default class RelatedListsInfo extends LightningElement {
    @api parentObjectApiName;
    @api recordTypeId;
    wirePushCount = -1;

    @wire(getRelatedListsInfo, {
        parentObjectApiName: '$parentObjectApiName',
        recordTypeId: '$recordTypeId',
    })
    onGetRelatedListsInfo(result) {
        this.relatedListsInfo = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.relatedListsInfo.data;
    }

    @api
    getError() {
        return this.relatedListsInfo.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
