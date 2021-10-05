import { api, LightningElement, wire } from 'lwc';
import { getExplainabilityActionLogs } from 'lds-adapters-industries-explainability';
export default class GetExplainabilityActionLogs extends LightningElement {
    wirePushCount = -1;
    @api actionContextCode;
    @api applicationSubType;
    @api applicationType;
    @api createdAfter;
    @api createdBefore;
    @api pageSize;
    @api processType;
    @api queryMore;

    @wire(getExplainabilityActionLogs, {
        actionContextCode: '$actionContextCode',
        applicationSubType: '$applicationSubType',
        applicationType: '$applicationType',
        createdAfter: '$createdAfter',
        createdBefore: '$createdBefore',
        pageSize: '$pageSize',
        processType: '$processType',
        queryMore: '$queryMore',
    })
    onGetExplainabilityActionLogs({ data, error }) {
        this.explainabilityActionLogs = data;
        this.error = error;
        this.wirePushCount += 1;
    }
    @api
    getWiredExplainabilityActionLogs() {
        return this.explainabilityActionLogs;
    }
    @api
    pushCount() {
        return this.wirePushCount;
    }
    @api
    getError() {
        return this.error;
    }
}
