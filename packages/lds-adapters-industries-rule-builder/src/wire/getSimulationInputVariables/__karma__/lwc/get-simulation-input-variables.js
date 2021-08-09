import { api, LightningElement, wire } from 'lwc';

import { getSimulationInputVariables } from 'lds-adapters-industries-rule-builder';

export default class GetSimulationInputVariables extends LightningElement {
    wirePushCount = -1;

    @api id;
    @api inputVariables;

    @wire(getSimulationInputVariables, {
        id: '$id',
        inputVariables: '$inputVariables',
    })
    onGetSimulationInputVariables({ data, error }) {
        this.simulationInputVariables = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredSimulationInputVariables() {
        return this.simulationInputVariables;
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
