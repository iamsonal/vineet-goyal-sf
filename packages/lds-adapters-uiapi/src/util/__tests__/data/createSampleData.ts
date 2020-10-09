export default function createSampleData(etag: number) {
    return {
        apiName: 'Account',
        childRelationships: {},
        eTag: '233f17c01db43cdfe6fe618c6c8cfd51',
        fields: {
            CreatedDate: {
                displayValue: '1/9/2018 3:59 PM',
                value: '2018-01-09T23:59:03.000Z',
            },
            Name: {
                displayValue: 'SFDX Account Display Value',
                value: 'SFDX Account',
            },
            Owner: {
                displayValue: null,
                value: {
                    apiName: 'User',
                    childRelationships: {},
                    eTag: 'a9e1190574bf35302f0708f7b7cf225f',
                    fields: {
                        City: {
                            displayValue: null,
                            value: 'Atlanta',
                        },
                        Id: {
                            displayValue: null,
                            value: '005T1000000HkSeIAK',
                        },
                        LastModifiedBy: {
                            displayValue: 'Frank non-leaf Display Name',
                            value: {
                                apiName: 'User',
                                id: '005000000000000005',
                                lastModifiedById: '005xx0000000000001',
                                lastModifiedDate: '2018-06-12T22:06:29.000Z',
                                systemModstamp: '2018-06-12T22:06:29.000Z',
                                weakEtag: 0,
                                childRelationships: {},
                                eTag: '0195812b95aacbd2e0d20b6b078fbb18',
                                recordTypeId: null,
                                recordTypeInfo: null,
                                fields: {
                                    Name: {
                                        value: 'Frank',
                                        displayValue: 'Frank Leaf Display Value',
                                    },
                                },
                            },
                        },
                    },
                    id: '005T1000000HkSeIAK',
                    lastModifiedById: '005T1000000HkSeIAK',
                    lastModifiedDate: '2019-08-30T00:38:00.000Z',
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: '2019-08-30T00:38:00.000Z',
                    weakEtag: 0,
                },
            },
            OwnerId: {
                displayValue: null,
                value: '005T1000000HkSeIAK',
            },
        },
        id: '001T1000001nFt5IAE',
        lastModifiedById: '005T1000000HkSeIAK',
        lastModifiedDate: '2019-08-30T00:38:02.000Z',
        recordTypeId: '012000000000000AAA',
        recordTypeInfo: null,
        systemModstamp: '2019-08-30T00:38:02.000Z',
        weakEtag: etag,
    };
}
