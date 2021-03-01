import { LightningElement, api, wire } from 'lwc';
import { getOrchestrationInstance } from 'lds-adapters-platform-interaction-orchestrator';

export default class GetOrchestrationInstance extends LightningElement {
    @api instanceId;

    wirePushCount = -1;

    @wire(getOrchestrationInstance, { instanceId: '$instanceId' })
    onGetOrchestrationInstance(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    get orchestrationInstanceData() {
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
