import { api, LightningElement, track } from 'lwc';
import { evaluateStep } from 'lds-adapters-platform-admin-success-guidance';

export default class EvaluateStep extends LightningElement {
    @track stepName;
    @track stepData;
    @track error;

    @api
    invokeEvaluateStep({ stepName }) {
        evaluateStep({ stepName })
            .then((data) => {
                this.stepName = stepName;
                this.stepData = data;
            })
            .catch((error) => {
                this.error = error;
            });
    }

    @api
    getStepData() {
        return this.stepData;
    }

    @api
    getError() {
        return this.error;
    }
}
