import { api, LightningElement, wire } from 'lwc';
import { getCaseServicePlan } from 'lds-adapters-industries-public-sector';
export default class GetCaseServicePlan extends LightningElement {
    wirePushCount = -1;

    @api caseServicePlanId;

    @wire(getCaseServicePlan, {
        caseServicePlanId: '$caseServicePlanId',
    })
    onGetCaseServicePlan({ data, error }) {
        this.caseServicePlan = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredCaseServicePlan() {
        return this.caseServicePlan;
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
