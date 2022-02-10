import { ObjectKeys } from './language';

import * as lightningAppsApi from 'lightning/uiAppsApi';
import * as unstableLightningAppsApi from 'lightning/unstable_uiAppsApi';
import * as lightningLayoutApi from 'lightning/uiLayoutApi';
import * as unstableLightningLayoutApi from 'lightning/unstable_uiLayoutApi';
import * as lightningListApi from 'lightning/uiListApi';
import * as unstableLightningListApi from 'lightning/unstable_uiListApi';
import * as lightningLookupsApi from 'lightning/uiLookupsApi';
import * as unstableLightningLookupsApi from 'lightning/unstable_uiLookupsApi';
import * as lightningObjectApi from 'lightning/uiObjectInfoApi';
import * as unstableLightningObjectApi from 'lightning/unstable_uiObjectInfoApi';
import * as lightningRecordActionsApi from 'lightning/uiRecordActionsApi';
import * as unstableLightningRecordActionsApi from 'lightning/unstable_uiRecordActionsApi';
import * as lightningRecordApi from 'lightning/uiRecordApi';
import * as unstableLightningRecordApi from 'lightning/unstable_uiRecordApi';
import * as lightningRecordAvatarApi from 'lightning/uiRecordAvatarApi';
import * as unstableLightningRecordAvatarApi from 'lightning/unstable_uiRecordAvatarApi';
import * as lightningRelatedListApi from 'lightning/uiRelatedListApi';
import * as unstableLightningRelatedListApi from 'lightning/unstable_uiRelatedListApi';

// graphql adapter is not yet exposed behind lightning namespace but will be part
// of the lightning platform some day... for now put it here with the rest of these
import * as gqlApi from 'force/ldsAdaptersGraphql';
import { AdapterRequestContext } from '@luvio/engine';

export const IMPERATIVE_ADAPTER_SUFFIX = '_imperative';
export const UNSTABLE_ADAPTER_PREFIX = 'unstable_';

function extractWireAdapterName(adapterName: string): string {
    const parts = adapterName.split(UNSTABLE_ADAPTER_PREFIX);

    if (parts.length > 1) {
        return parts[1].substr(0, parts[1].indexOf(IMPERATIVE_ADAPTER_SUFFIX));
    }

    return adapterName.substr(0, adapterName.indexOf(IMPERATIVE_ADAPTER_SUFFIX));
}

// all adapters
const adapterMap = Object.assign(
    {},
    gqlApi,
    lightningAppsApi,
    lightningLayoutApi,
    lightningListApi,
    lightningLookupsApi,
    lightningObjectApi,
    lightningRecordActionsApi,
    lightningRecordApi,
    lightningRecordAvatarApi,
    lightningRelatedListApi,
    unstableLightningAppsApi,
    unstableLightningLayoutApi,
    unstableLightningListApi,
    unstableLightningLookupsApi,
    unstableLightningObjectApi,
    unstableLightningRecordActionsApi,
    unstableLightningRecordApi,
    unstableLightningRecordAvatarApi,
    unstableLightningRelatedListApi
);

export type AdapterCallbackValue = {
    data: unknown | undefined;
    error: unknown | undefined;
};

export type AdapterCallback = (value: AdapterCallbackValue) => void;

type Invoke = (
    config: any,
    requestContext: AdapterRequestContext | undefined,
    onResponse: (value: AdapterCallbackValue) => void
) => void;

type Subscribe = (
    config: any,
    requestContext: AdapterRequestContext | undefined,
    onResponse: (value: AdapterCallbackValue) => void
) => () => void;

const imperativeAdapterMap: Record<string, { invoke: Invoke; subscribe: Subscribe }> = {};

const imperativeAdapterNames = ObjectKeys(adapterMap).filter((name) =>
    name.endsWith(IMPERATIVE_ADAPTER_SUFFIX)
);

for (let i = 0; i < imperativeAdapterNames.length; i++) {
    const adapterName = imperativeAdapterNames[i];
    imperativeAdapterMap[adapterName] = adapterMap[adapterName];
    delete adapterMap[adapterName];
    // remove the corresponding wire adapter from the adapter map
    const wireAdapterName = extractWireAdapterName(adapterName);
    delete adapterMap[wireAdapterName];
}

export { imperativeAdapterMap, adapterMap as dmlAdapterMap };
