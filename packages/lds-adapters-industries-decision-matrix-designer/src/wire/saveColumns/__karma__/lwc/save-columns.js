import { api, LightningElement, track } from 'lwc';
import { saveColumns } from 'lds-adapters-industries-decision-matrix-designer';

export default class SaveColumns extends LightningElement {
    @track columns;
    @track result;
    @track matrixId;
    @track error;

    @api
    invokeSaveColumns({ matrixId, columns }) {
        saveColumns({ matrixId, columns })
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
