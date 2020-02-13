import { LightningElement, wire, api } from 'lwc';
import { getDeliveryChannels } from 'lds';

export default class GetDeliveryChannels extends LightningElement {
    wirePushCount = -1;

    @api page;
    @api pageSize;

    @wire(getDeliveryChannels, { page: '$page', pageSize: '$pageSize' })
    onGetDeliveryChannels(results) {
        this.data = results.data;
        this.wirePushCount += 1;
    }

    @api
    get channels() {
        return this.data.channels;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
