import { api, LightningElement, wire } from 'lwc';
import { getProgramProcessRule } from 'lds-adapters-industries-loyalty-engine';

export default class GetProgramProcessRule extends LightningElement {
    @api programName;
    @api processName;
    @api ruleName;
    wirePushCount = -1;

    @wire(getProgramProcessRule, {
        programName: '$programName',
        processName: '$processName',
        ruleName: '$ruleName',
    })
    onGetProgramProcessRule({ data, error }) {
        this.ruleDetail = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api getWiredRuleDetail() {
        return this.ruleDetail;
    }

    @api getError() {
        return this.error;
    }

    @api pushCount() {
        return this.wirePushCount;
    }
}
