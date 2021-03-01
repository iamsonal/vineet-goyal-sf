import { LightningElement, api, wire } from 'lwc';
import { getOrchestrationInstanceCollection } from 'lds-adapters-platform-interaction-orchestrator';

export default class GetOrchestrationInstanceCollection extends LightningElement {
    @api relatedRecordId;

    wirePushCount = -1;

    @wire(getOrchestrationInstanceCollection, { relatedRecordId: '$relatedRecordId' })
    onGetOrchestrationInstanceCollection(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    getData() {
        return this.data;
    }

    @api
    getError() {
        return this.error.body;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
