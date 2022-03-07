import { LightningElement, api, wire } from 'lwc';
import { getRules } from 'lds-adapters-platform-flow-builder';

export default class GetRules extends LightningElement {
    @api flowTriggerType;
    @api recordTriggerType;

    wirePushCount = -1;

    @wire(getRules, {
        flowTriggerType: '$flowTriggerType',
        recordTriggerType: '$recordTriggerType',
    })
    onGetRules(results) {
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
        return this.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
