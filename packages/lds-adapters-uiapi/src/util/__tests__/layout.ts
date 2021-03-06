export default {
    eTag: '2586778b776d04676c424c5910b64b94',
    id: '00hT0000000wjHSIAY',
    layoutType: 'Full',
    mode: 'View',
    sections: [
        {
            collapsible: false,
            columns: 1,
            heading: 'Subject',
            id: '01BT0000000zdtnMAA',
            layoutRows: [
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Subject',
                            layoutComponents: [
                                {
                                    apiName: 'Subject__c',
                                    componentType: 'Field',
                                    label: 'Subject',
                                },
                            ],
                            lookupIdApiName: null,
                            required: true,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Details and Steps to Reproduce',
                            layoutComponents: [
                                {
                                    apiName: 'Details_and_Steps_to_Reproduce__c',
                                    componentType: 'Field',
                                    label: 'Details and Steps to Reproduce',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
            ],
            rows: 2,
            useHeading: false,
        },
        {
            collapsible: false,
            columns: 2,
            heading: 'Information',
            id: '01BT0000000zdtmMAA',
            layoutRows: [
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Product Tag',
                            layoutComponents: [
                                {
                                    apiName: 'Product_Tag__c',
                                    componentType: 'Field',
                                    label: 'Product Tag',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Epic',
                            layoutComponents: [
                                {
                                    apiName: 'Epic__c',
                                    componentType: 'Field',
                                    label: 'Epic',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Status',
                            layoutComponents: [
                                {
                                    apiName: 'Status__c',
                                    componentType: 'Field',
                                    label: 'Status',
                                },
                            ],
                            lookupIdApiName: null,
                            required: true,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Test Failure Status',
                            layoutComponents: [
                                {
                                    apiName: 'Test_Failure_Status__c',
                                    componentType: 'Field',
                                    label: 'Test Failure Status',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Impact',
                            layoutComponents: [
                                {
                                    apiName: 'Impact__c',
                                    componentType: 'Field',
                                    label: 'Impact',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: 'Test Failures',
                            layoutComponents: [
                                {
                                    apiName: 'visual_link_num_of_Test_Failures__c',
                                    componentType: 'Field',
                                    label: 'Test Failures',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Frequency',
                            layoutComponents: [
                                {
                                    apiName: 'Frequency__c',
                                    componentType: 'Field',
                                    label: 'Frequency',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Test Resolution',
                            layoutComponents: [
                                {
                                    apiName: 'Resolution__c',
                                    componentType: 'Field',
                                    label: 'Test Resolution',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: 'Priority',
                            layoutComponents: [
                                {
                                    apiName: 'Priority__c',
                                    componentType: 'Field',
                                    label: 'Priority',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: 'Gack Occurrences - 1 year',
                            layoutComponents: [
                                {
                                    apiName: 'Gack_Occurrences__c',
                                    componentType: 'Field',
                                    label: 'Gack Occurrences - 1 year',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'UI Text Status',
                            layoutComponents: [
                                {
                                    apiName: 'UI_Text_Status__c',
                                    componentType: 'Field',
                                    label: 'UI Text Status',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: 'Cases',
                            layoutComponents: [
                                {
                                    apiName: 'Number_of_Cases__c',
                                    componentType: 'Field',
                                    label: 'Cases',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Doc Status',
                            layoutComponents: [
                                {
                                    apiName: 'Help_Status__c',
                                    componentType: 'Field',
                                    label: 'Doc Status',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Due Date',
                            layoutComponents: [
                                {
                                    apiName: 'Due_Date__c',
                                    componentType: 'Field',
                                    label: 'Due Date',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
            ],
            rows: 7,
            useHeading: false,
        },
        {
            collapsible: true,
            columns: 2,
            heading: 'Sprint Details',
            id: '01BB0000000AEGvMAO',
            layoutRows: [
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Sprint',
                            layoutComponents: [
                                {
                                    apiName: 'Sprint__c',
                                    componentType: 'Field',
                                    label: 'Sprint',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Story Points',
                            layoutComponents: [
                                {
                                    apiName: 'Story_Points__c',
                                    componentType: 'Field',
                                    label: 'Story Points',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Found in Build',
                            layoutComponents: [
                                {
                                    apiName: 'Found_in_Build__c',
                                    componentType: 'Field',
                                    label: 'Found in Build',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: true,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Scheduled Build',
                            layoutComponents: [
                                {
                                    apiName: 'Scheduled_Build__c',
                                    componentType: 'Field',
                                    label: 'Scheduled Build',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Backlog Rank',
                            layoutComponents: [
                                {
                                    apiName: 'Priority_Rank__c',
                                    componentType: 'Field',
                                    label: 'Backlog Rank',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Type',
                            layoutComponents: [
                                {
                                    apiName: 'Type__c',
                                    componentType: 'Field',
                                    label: 'Type',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: '',
                            layoutComponents: [
                                {
                                    apiName: null,
                                    componentType: 'EmptySpace',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Originated From',
                            layoutComponents: [
                                {
                                    apiName: 'Originated_From__c',
                                    componentType: 'Field',
                                    label: 'Originated From',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
            ],
            rows: 4,
            useHeading: true,
        },
        {
            collapsible: true,
            columns: 2,
            heading: 'Assignments',
            id: '01BT00000010VR4MAM',
            layoutRows: [
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Assigned To',
                            layoutComponents: [
                                {
                                    apiName: 'Assignee__c',
                                    componentType: 'Field',
                                    label: 'Assigned To',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'QA Engineer',
                            layoutComponents: [
                                {
                                    apiName: 'QA_Engineer__c',
                                    componentType: 'Field',
                                    label: 'QA Engineer',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'UE Engineer',
                            layoutComponents: [
                                {
                                    apiName: 'UE_Engineer__c',
                                    componentType: 'Field',
                                    label: 'UE Engineer',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Product Owner',
                            layoutComponents: [
                                {
                                    apiName: 'Product_Owner__c',
                                    componentType: 'Field',
                                    label: 'Product Owner',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Performance Engineer',
                            layoutComponents: [
                                {
                                    apiName: 'System_Test_Engineer__c',
                                    componentType: 'Field',
                                    label: 'Performance Engineer',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Tech Writer',
                            layoutComponents: [
                                {
                                    apiName: 'Tech_Writer__c',
                                    componentType: 'Field',
                                    label: 'Tech Writer',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                    ],
                },
            ],
            rows: 3,
            useHeading: true,
        },
        {
            collapsible: true,
            columns: 2,
            heading: 'Other Information',
            id: '01BB0000005ECQCMA4',
            layoutRows: [
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Source Control Status',
                            layoutComponents: [
                                {
                                    apiName: 'Perforce_Status__c',
                                    componentType: 'Field',
                                    label: 'Source Control Status',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: 'Gack First Seen',
                            layoutComponents: [
                                {
                                    apiName: 'Gack_First_Seen__c',
                                    componentType: 'Field',
                                    label: 'Gack First Seen',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: 'Known Issue Link',
                            layoutComponents: [
                                {
                                    apiName: 'Known_Issue_Link__c',
                                    componentType: 'Field',
                                    label: 'Known Issue Link',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: 'Stack Trace Link',
                            layoutComponents: [
                                {
                                    apiName: 'Stack_Trace_Link__c',
                                    componentType: 'Field',
                                    label: 'Stack Trace Link',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Test',
                            layoutComponents: [
                                {
                                    apiName: 'ftest__c',
                                    componentType: 'Field',
                                    label: 'Test',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: 'Gack Occurrences - 30 days',
                            layoutComponents: [
                                {
                                    apiName: 'Occurrences_Past_30_Days__c',
                                    componentType: 'Field',
                                    label: 'Gack Occurrences - 30 days',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Readme Notes',
                            layoutComponents: [
                                {
                                    apiName: 'Readme_Notes__c',
                                    componentType: 'Field',
                                    label: 'Readme Notes',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Customer',
                            layoutComponents: [
                                {
                                    apiName: 'Customer__c',
                                    componentType: 'Field',
                                    label: 'Customer',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: 'Age With Scrum Team',
                            layoutComponents: [
                                {
                                    apiName: 'Age_With_Scrum_Team__c',
                                    componentType: 'Field',
                                    label: 'Age With Scrum Team',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Regressed',
                            layoutComponents: [
                                {
                                    apiName: 'Regressed__c',
                                    componentType: 'Field',
                                    label: 'Regressed',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Product Legal Request',
                            layoutComponents: [
                                {
                                    apiName: 'Product_Legal_Request__c',
                                    componentType: 'Field',
                                    label: 'Product Legal Request',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Epic Rank',
                            layoutComponents: [
                                {
                                    apiName: 'Epic_Rank__c',
                                    componentType: 'Field',
                                    label: 'Epic Rank',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: '',
                            layoutComponents: [
                                {
                                    apiName: null,
                                    componentType: 'EmptySpace',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Trailhead Badge',
                            layoutComponents: [
                                {
                                    apiName: 'Badge__c',
                                    componentType: 'Field',
                                    label: 'Trailhead Badge',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                    ],
                },
                {
                    layoutItems: [
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: '',
                            layoutComponents: [
                                {
                                    apiName: null,
                                    componentType: 'EmptySpace',
                                },
                            ],
                            lookupIdApiName: null,
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: true,
                            editableForUpdate: true,
                            label: 'Trailhead Trail',
                            layoutComponents: [
                                {
                                    apiName: 'Trail__c',
                                    componentType: 'Field',
                                    label: 'Trailhead Trail',
                                },
                            ],
                            lookupIdApiName: 'Id',
                            required: false,
                            sortable: false,
                        },
                    ],
                },
            ],
            rows: 8,
            useHeading: true,
        },
        {
            collapsible: true,
            columns: 2,
            heading: 'System Information',
            id: '01BT0000000zdtrMAA',
            layoutRows: [
                {
                    layoutItems: [
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: 'Created By',
                            layoutComponents: [
                                {
                                    apiName: 'CreatedById',
                                    componentType: 'Field',
                                    label: 'Created By ID',
                                },
                                {
                                    apiName: 'CreatedDate',
                                    componentType: 'Field',
                                    label: 'Created Date',
                                },
                            ],
                            lookupIdApiName: 'CreatedById',
                            required: false,
                            sortable: false,
                        },
                        {
                            editableForNew: false,
                            editableForUpdate: false,
                            label: 'Last Modified By',
                            layoutComponents: [
                                {
                                    apiName: 'LastModifiedById',
                                    componentType: 'Field',
                                    label: 'Last Modified By ID',
                                },
                                {
                                    apiName: 'LastModifiedDate',
                                    componentType: 'Field',
                                    label: 'Last Modified Date',
                                },
                            ],
                            lookupIdApiName: 'LastModifiedById',
                            required: false,
                            sortable: false,
                        },
                    ],
                },
            ],
            rows: 1,
            useHeading: true,
        },
    ],
};
