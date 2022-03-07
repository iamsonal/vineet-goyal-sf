const query = /* GraphQL */ `
    query {
        __typename
        uiapi {
            __typename
            query {
                __typename
                Account(where: { Name: { like: "Account1" } }) {
                    __typename
                    edges {
                        __typename
                        node {
                            Name {
                                __typename
                                value
                                displayValue
                            }
                            ...defaultRecordFields
                        }
                        cursor
                    }
                    pageInfo {
                        hasNextPage
                        hasPreviousPage
                    }
                    totalCount
                }
            }
        }
    }
    fragment defaultRecordFields on Record {
        __typename
        ApiName
        WeakEtag
        Id
        DisplayValue
        SystemModstamp {
            value
        }
        LastModifiedById {
            value
        }
        LastModifiedDate {
            value
        }
        RecordTypeId(fallback: true) {
            value
        }
    }
`;

module.exports = {
    query,
    variables: {},
};
