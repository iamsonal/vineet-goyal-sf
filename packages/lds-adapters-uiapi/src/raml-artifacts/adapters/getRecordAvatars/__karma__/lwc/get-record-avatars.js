import { LightningElement, wire, api } from 'lwc';
import { getRecordAvatars, refresh } from 'lds-adapters-uiapi';

export default class GetRecordAvatars extends LightningElement {
    @api recordIds;
    @api formFactor;

    wirePushCount = -1;

    @wire(getRecordAvatars, { recordIds: '$recordIds', formFactor: '$formFactor' })
    onGetAvatar(result) {
        this.avatar = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.avatar.data;
    }

    @api pushCount() {
        return this.wirePushCount;
    }

    @api getWiredError() {
        return this.avatar.error;
    }

    @api refresh() {
        return refresh(this.avatar);
    }
}
