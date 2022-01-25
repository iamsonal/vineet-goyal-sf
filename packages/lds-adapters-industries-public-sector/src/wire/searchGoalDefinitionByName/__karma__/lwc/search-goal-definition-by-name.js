import { api, LightningElement, wire } from 'lwc';
import { searchGoalDefinitionByName } from 'lds-adapters-industries-public-sector';
export default class SearchGoalDefinitionByName extends LightningElement {
    wirePushCount = -1;
    @api searchKey;

    @wire(searchGoalDefinitionByName, {
        searchKey: '$searchKey',
    })
    onSearchGoalDefinitionByName({ data, error }) {
        this.goalDefinitions = data;
        this.error = error;
        this.wirePushCount += 1;
    }
    @api
    getWiredGoalDefinitions() {
        return this.goalDefinitions;
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
