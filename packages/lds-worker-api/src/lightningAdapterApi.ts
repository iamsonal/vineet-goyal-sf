import * as lightningActionsApi from 'lightning/uiActionsApi';
import * as lightningAppsApi from 'lightning/uiAppsApi';
import * as lightningAssistantPlatformApi from 'lightning/uiAssistantPlatformApi';
import * as lightningDuplicatesApi from 'lightning/uiDuplicatesApi';
import * as lightningLayoutApi from 'lightning/uiLayoutApi';
import * as lightningListApi from 'lightning/uiListApi';
import * as lightningLookupsApi from 'lightning/uiLookupsApi';
import * as lightningObjectApi from 'lightning/uiObjectInfoApi';
import * as lightningRecordActionsApi from 'lightning/uiRecordActionsApi';
import * as lightningRecordApi from 'lightning/uiRecordApi';
import * as lightningRecordAvatarApi from 'lightning/uiRecordAvatarApi';
import * as lightningRelatedListApi from 'lightning/uiRelatedListApi';

import * as unstableLightningRecordApi from 'lightning/unstable_uiRecordApi';
import * as unstableLightningRelatedListApi from 'lightning/unstable_uiRelatedListApi';

// graphql adapter is not yet exposed behind lightning namespace but will be part
// of the lightning platform some day... for now put it here with the rest of these
import * as gqlApi from 'force/ldsAdaptersGraphql';

export const adapterMap = Object.assign(
    {},
    gqlApi,
    unstableLightningRecordApi,
    unstableLightningRelatedListApi,
    lightningActionsApi,
    lightningAppsApi,
    lightningAssistantPlatformApi,
    lightningDuplicatesApi,
    lightningLayoutApi,
    lightningListApi,
    lightningLookupsApi,
    lightningObjectApi,
    lightningRecordActionsApi,
    lightningRecordApi,
    lightningRecordAvatarApi,
    lightningRelatedListApi
);
