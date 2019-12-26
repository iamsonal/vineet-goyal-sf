/*
 * Copyright 2019 salesforce.com, inc.
 * All Rights Reserved
 * Company Confidential
 */

import { LightningElement, wire, api } from 'lwc';
import { getRelatedListInfos } from 'lds';

export default class RelatedListInfos extends LightningElement {
    @api parentObjectApiName;
    @api recordTypeId;
    wirePushCount = -1;

    @wire(getRelatedListInfos, {
        parentObjectApiName: '$parentObjectApiName',
        recordTypeId: '$recordTypeId',
    })
    onGetRelatedListInfos(result) {
        this.relatedListInfos = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.relatedListInfos.data;
    }

    @api
    getError() {
        return this.relatedListInfos.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
