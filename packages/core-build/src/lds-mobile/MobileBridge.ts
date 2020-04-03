import {
    LDS,
    Snapshot,
    isFulfilledSnapshot,
    Adapter,
    isErrorSnapshot,
    isStaleSnapshot,
    isUnfulfilledSnapshot,
} from '@ldsjs/engine';
import { isPromise } from './utils';
import { ObjectKeys } from '../utils/language';

export type AdapterMap = { [key: string]: Adapter<any, any> };

/* eslint-disable no-implicit-globals */
declare global {
    namespace __nimbus {
        namespace plugins {
            namespace lds {
                function onSnapshot(snapshot: Snapshot<unknown, unknown>, callbackId: string): void;
            }
        }
    }
}

export class MobileBridge {
    subscriptions: any = {};
    lds: LDS;
    adapterMap: AdapterMap;

    constructor(lds: LDS, adapterMap: AdapterMap) {
        if (process.env.NODE_ENV !== 'production') {
            if (__nimbus === undefined || __nimbus.plugins.lds === undefined) {
                throw Error('LDS nimbus plugin not configured');
            }
        }

        this.lds = lds;
        this.adapterMap = adapterMap;
    }

    dispatchAndSubscribe(
        snapshot: Snapshot<unknown, unknown>,
        callbackId: string,
        subscribe: boolean
    ) {
        const dispatch = __nimbus.plugins.lds.onSnapshot;

        if (
            isFulfilledSnapshot(snapshot) ||
            isErrorSnapshot(snapshot) ||
            isStaleSnapshot(snapshot)
        ) {
            dispatch(snapshot, callbackId);
        }

        if (isErrorSnapshot(snapshot) || !subscribe) {
            return;
        }

        if (isUnfulfilledSnapshot(snapshot)) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error(
                    `Unfulfilled snapshot from adapterDispatchAndSubscribe, missingPaths: ${ObjectKeys(
                        snapshot.missingPaths
                    )}`
                );
            }

            return;
        }

        return this.lds.storeSubscribe(snapshot, (updated: any) => {
            dispatch(updated, callbackId);
        });
    }

    executeAdapter(adapterId: string, config: string, callbackId: string, subscribe: boolean) {
        if (process.env.NODE_ENV !== 'production') {
            if (this.adapterMap[adapterId] === undefined) {
                throw Error(`adapter ${adapterId} not recognized`);
            }
        }

        const snapshotOrPromise = this.adapterMap[adapterId](JSON.parse(config));

        if (snapshotOrPromise === null) {
            return;
        }

        if (isPromise(snapshotOrPromise)) {
            snapshotOrPromise.then(snapshot => {
                this.dispatchAndSubscribe(snapshot, callbackId, subscribe);
            });
        } else {
            this.dispatchAndSubscribe(snapshotOrPromise, callbackId, subscribe);
        }
    }

    unsubscribe(callbackId: string) {
        const unsubscribeFn = this.subscriptions[callbackId];
        if (unsubscribeFn !== undefined) {
            unsubscribeFn();
            delete this.subscriptions[callbackId];
        }
    }
}
