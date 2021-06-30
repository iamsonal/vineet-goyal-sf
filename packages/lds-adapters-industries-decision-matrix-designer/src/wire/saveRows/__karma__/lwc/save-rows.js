import { api, LightningElement, track } from 'lwc';
import { saveRows } from 'lds-adapters-industries-decision-matrix-designer';

export default class SaveRows extends LightningElement {
    @track rowsInput;
    @track result;
    @track matrixId;
    @track versionId;
    @track error;

    @api
    invokeSaveRows({ matrixId, versionId, rowsInput }) {
        saveRows({ matrixId, versionId, rowsInput })
            .then((data) => {
                this.result = data;
            })
            .catch((error) => {
                this.error = error;
            });
    }

    @api
    invokeSaveRowsFromFile({ matrixId, versionId, rowsInput }) {
        saveRows({ matrixId, versionId, rowsInput })
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
        return this.error.body;
    }
}
