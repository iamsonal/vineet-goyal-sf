import { api, LightningElement, wire } from 'lwc';
import { getTenantRegistrationStatus } from 'lds-adapters-industries-rcg-tenantmanagement';

export default class GetTenantRegStatus extends LightningElement {
    wirePushCount = -1;

    @wire(getTenantRegistrationStatus, {})
    OnGetTenantRegistrationStatus({ data, error }) {
        this.tenantRegistrationStatus = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredTenantRegistrationStatus() {
        return this.tenantRegistrationStatus;
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
