/*
 This file is only being created to temporarily export getActiveScenarios and getActiveQuestionnaires, since
 we are officially renaming them to getScenarios and getQuestionnaires. This is so we won't break uiAssistantPlatformApi
 in lightning-components by removing them.  Once the new apis names are officially published, we will safely remove
 the old api names from uiAssistantPlatformApi, and then later remove this file. W-9311748 was opened to track this
 work
*/

export * from './generated/artifacts/sfdc';
export {
    getQuestionnaires as getActiveQuestionnaires,
    getAssistantList as getActiveScenarios,
    saveAssistantList as updateScenarios,
} from './generated/artifacts/sfdc';
