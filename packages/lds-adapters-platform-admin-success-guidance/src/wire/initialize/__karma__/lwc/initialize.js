import { api, LightningElement, track } from 'lwc';
import { initialize } from 'lds-adapters-platform-admin-success-guidance';

export default class Initialize extends LightningElement {
    @track payload;
    @track error;

    @api
    invokeInitialize({ assistantTarget }) {
        initialize({ assistantTarget })
            .then((payload) => {
                this.payload = payload;
            })
            .catch((error) => {
                this.error = error;
            });
    }

    @api
    getPayload() {
        return this.payload;
    }

    @api
    getError() {
        return this.error;
    }
}
