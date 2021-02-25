import { api, LightningElement, wire, track } from 'lwc';
import { getActiveScenarios } from 'lds-adapters-platform-admin-success-guidance';

export default class GetActiveScenarios extends LightningElement {
    wirePushCount = -1;

    @track scenarios;
    @track error;

    @api assistantGroup;

    @wire(getActiveScenarios, {
        assistantGroup: '$assistantGroup',
    })
    onGetActiveScenarios({ data, error }) {
        this.scenarios = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredActiveScenarios() {
        return this.scenarios;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error.body;
    }
}
