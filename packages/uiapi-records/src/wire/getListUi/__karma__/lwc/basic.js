import { api, LightningElement, wire } from 'lwc';
import { getListUi, refresh } from 'lds';

export default class Basic extends LightningElement {
    @api listViewId;
    @api pageSize;
    wirePushCount = -1;

    @wire(getListUi, {
        listViewId: '$listViewId',
        pageSize: '$pageSize',
    })
    onGetList(result) {
        this.listView = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.listView;
    }

    @api pushCount() {
        return this.wirePushCount;
    }

    @api refresh() {
        return refresh(this.listView);
    }
}
