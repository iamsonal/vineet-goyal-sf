import { api, LightningElement, wire, track } from 'lwc';
import { getScenarios } from 'lds-adapters-platform-admin-success-guidance';

export default class GetScenarios extends LightningElement {
    wirePushCount = -1;

    @track scenarios;
    @track error;

    @api assistantGroup;

    @wire(getScenarios, {
        assistantGroup: '$assistantGroup',
    })
    onGetScenarios({ data, error }) {
        this.scenarios = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredScenarios() {
        return this.scenarios;
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
