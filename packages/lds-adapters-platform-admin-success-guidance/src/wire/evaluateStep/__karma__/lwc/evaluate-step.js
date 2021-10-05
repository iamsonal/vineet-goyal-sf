import { api, LightningElement, track } from 'lwc';
import { evaluateStep } from 'lds-adapters-platform-admin-success-guidance';

export default class EvaluateStep extends LightningElement {
    @track assistantTarget;
    @track stepId;
    @track stepData;
    @track error;

    @api
    invokeEvaluateStep({ assistantTarget, stepId }) {
        evaluateStep({ assistantTarget, stepId })
            .then((data) => {
                this.assistantTarget = assistantTarget;
                this.stepId = stepId;
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
