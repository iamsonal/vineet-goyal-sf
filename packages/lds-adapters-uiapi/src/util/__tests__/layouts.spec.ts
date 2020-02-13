import objectInfo from './object-info';
import layout from './layout';
import { getQualifiedFieldApiNamesFromLayout } from './../layouts';

describe('getQualifiedFieldApiNamesFromLayout', () => {
    it('should return correct field names from layout and object info', () => {
        expect(getQualifiedFieldApiNamesFromLayout(layout, objectInfo)).toEqual([
            'ADM_Work__c.Subject__c',
            'ADM_Work__c.Details_and_Steps_to_Reproduce__c',
            'ADM_Work__c.Product_Tag__r.Id',
            'ADM_Work__c.Product_Tag__r.Name',
            'ADM_Work__c.Product_Tag__c',
            'ADM_Work__c.Epic__r.Id',
            'ADM_Work__c.Epic__r.Name',
            'ADM_Work__c.Epic__c',
            'ADM_Work__c.Status__c',
            'ADM_Work__c.Test_Failure_Status__c',
            'ADM_Work__c.Impact__r.Id',
            'ADM_Work__c.Impact__r.Name',
            'ADM_Work__c.Impact__c',
            'ADM_Work__c.visual_link_num_of_Test_Failures__c',
            'ADM_Work__c.Frequency__r.Id',
            'ADM_Work__c.Frequency__r.Name',
            'ADM_Work__c.Frequency__c',
            'ADM_Work__c.Resolution__c',
            'ADM_Work__c.Priority__c',
            'ADM_Work__c.Gack_Occurrences__c',
            'ADM_Work__c.UI_Text_Status__c',
            'ADM_Work__c.Number_of_Cases__c',
            'ADM_Work__c.Help_Status__c',
            'ADM_Work__c.Due_Date__c',
            'ADM_Work__c.Sprint__r.Id',
            'ADM_Work__c.Sprint__r.Name',
            'ADM_Work__c.Sprint__c',
            'ADM_Work__c.Story_Points__c',
            'ADM_Work__c.Found_in_Build__r.Id',
            'ADM_Work__c.Found_in_Build__r.Name',
            'ADM_Work__c.Found_in_Build__c',
            'ADM_Work__c.Scheduled_Build__r.Id',
            'ADM_Work__c.Scheduled_Build__r.Name',
            'ADM_Work__c.Scheduled_Build__c',
            'ADM_Work__c.Priority_Rank__c',
            'ADM_Work__c.Type__c',
            'ADM_Work__c.Originated_From__c',
            'ADM_Work__c.Assignee__r.Id',
            'ADM_Work__c.Assignee__r.Name',
            'ADM_Work__c.Assignee__c',
            'ADM_Work__c.QA_Engineer__r.Id',
            'ADM_Work__c.QA_Engineer__r.Name',
            'ADM_Work__c.QA_Engineer__c',
            'ADM_Work__c.UE_Engineer__r.Id',
            'ADM_Work__c.UE_Engineer__r.Name',
            'ADM_Work__c.UE_Engineer__c',
            'ADM_Work__c.Product_Owner__r.Id',
            'ADM_Work__c.Product_Owner__r.Name',
            'ADM_Work__c.Product_Owner__c',
            'ADM_Work__c.System_Test_Engineer__r.Id',
            'ADM_Work__c.System_Test_Engineer__r.Name',
            'ADM_Work__c.System_Test_Engineer__c',
            'ADM_Work__c.Tech_Writer__r.Id',
            'ADM_Work__c.Tech_Writer__r.Name',
            'ADM_Work__c.Tech_Writer__c',
            'ADM_Work__c.Perforce_Status__c',
            'ADM_Work__c.Gack_First_Seen__c',
            'ADM_Work__c.Known_Issue_Link__c',
            'ADM_Work__c.Stack_Trace_Link__c',
            'ADM_Work__c.ftest__c',
            'ADM_Work__c.Occurrences_Past_30_Days__c',
            'ADM_Work__c.Readme_Notes__c',
            'ADM_Work__c.Customer__c',
            'ADM_Work__c.Age_With_Scrum_Team__c',
            'ADM_Work__c.Regressed__c',
            'ADM_Work__c.Product_Legal_Request__r.Id',
            'ADM_Work__c.Product_Legal_Request__r.Name',
            'ADM_Work__c.Product_Legal_Request__c',
            'ADM_Work__c.Epic_Rank__c',
            'ADM_Work__c.Badge__r.Id',
            'ADM_Work__c.Badge__r.Name',
            'ADM_Work__c.Badge__c',
            'ADM_Work__c.Trail__r.Id',
            'ADM_Work__c.Trail__r.Name',
            'ADM_Work__c.Trail__c',
            'ADM_Work__c.CreatedBy.Id',
            'ADM_Work__c.CreatedBy.Name',
            'ADM_Work__c.CreatedById',
            'ADM_Work__c.CreatedDate',
            'ADM_Work__c.LastModifiedBy.Id',
            'ADM_Work__c.LastModifiedBy.Name',
            'ADM_Work__c.LastModifiedById',
            'ADM_Work__c.LastModifiedDate',
        ]);
    });

    it('works with field reference true but relationshipName null', () => {
        const layout = {
            sections: [
                {
                    layoutRows: [
                        {
                            layoutItems: [
                                {
                                    layoutComponents: [
                                        {
                                            apiName: 'CloneSourceId',
                                            componentType: 'Field',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const objectInfo = {
            apiName: 'Lead',
            fields: {
                CloneSourceId: {
                    apiName: 'CloneSourceId',
                    reference: true,
                    relationshipName: null,
                },
            },
        };

        expect(getQualifiedFieldApiNamesFromLayout(layout, objectInfo)).toEqual([
            'Lead.CloneSourceId',
        ]);
    });
});
