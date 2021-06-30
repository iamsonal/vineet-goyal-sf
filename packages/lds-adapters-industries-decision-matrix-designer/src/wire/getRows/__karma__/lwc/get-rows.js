import { api, LightningElement, wire } from 'lwc';
import { getRows } from 'lds-adapters-industries-decision-matrix-designer';

export default class GetRows extends LightningElement {
    wirePushCount = -1;

    @api matrixId;
    @api versionId;

    @wire(getRows, {
        matrixId: '$matrixId',
        versionId: '$versionId',
    })
    onGetRows(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    invokeDownloadCSV({ matrixId, versionId, file }) {
        getRows({ matrixId, versionId, file })
            .then(({ data }) => {
                this.result = data;
            })
            .catch((error) => {
                this.error = error;
            });
    }
    @api
    getData() {
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
