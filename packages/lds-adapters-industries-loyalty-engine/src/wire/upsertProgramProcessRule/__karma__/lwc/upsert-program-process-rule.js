import { api, LightningElement, track } from 'lwc';
import { upsertProgramProcessRule } from 'lds-adapters-industries-loyalty-engine';

export default class UpsertProgramProcessRule extends LightningElement {
    @track result;
    @track error;

    @track programName;
    @track processName;
    @track ruleName;
    @track programProcessRule;

    @api
    invokeUpsertProgramProcessRule({ programName, processName, ruleName, programProcessRule }) {
        upsertProgramProcessRule({ programName, processName, ruleName, programProcessRule })
            .then((data) => {
                this.result = data;
            })
            .catch((error) => {
                this.error = error;
            });
    }

    @api
    getResult() {
        return this.result;
    }

    @api
    getError() {
        return this.error;
    }
}
