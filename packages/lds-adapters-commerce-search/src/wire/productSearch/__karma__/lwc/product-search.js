import { LightningElement, api, wire } from 'lwc';
import { productSearch } from 'lds-adapters-commerce-search';

export default class ProductSearch extends LightningElement {
    wirePushCount = -1;
    @api webstoreId;
    @api searchTerm;
    @api page;
    @api pageSize;
    @api refinements;
    @api fields;
    @api categoryId;
    @api sortOrderId;

    @wire(productSearch, {
        webstoreId: '$webstoreId',
        searchTerm: '$searchTerm',
        page: '$page',
        pageSize: '$pageSize',
        refinements: '$refinements',
        fields: '$fields',
        categoryId: '$categoryId',
        sortOrderId: '$sortOrderId',
    })
    onProductSearchResults(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getData() {
        return this.data;
    }

    @api
    getError() {
        return this.error;
    }
}
