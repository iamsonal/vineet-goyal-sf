import { Fragment, Luvio, Reader } from '@luvio/engine';
import { ArrayPrototypePush, ObjectFreeze } from '../../../generated/adapters/adapter-utils';
import {
    keyBuilder as getUiApiRecordsByRecordId_keyBuilder,
    ResourceRequestConfig as getUiApiRecordsByRecordId_ResourceRequestConfig,
} from '../../../generated/resources/getUiApiRecordsByRecordId';
import {
    keyBuilder as getUiApiRecordsBatchByRecordIds_keyBuilder,
    ResourceRequestConfig as getUiApiRecordsBatchByRecordIds_ResourceRequestConfig,
} from '../../../generated/resources/getUiApiRecordsBatchByRecordIds';
import { BatchRepresentation } from '../../../generated/types/BatchRepresentation';
import { BatchResultRepresentation } from '../../../generated/types/BatchResultRepresentation';
import { RecordRepresentation } from '../../../generated/types/RecordRepresentation';
import { buildRecordSelector } from '../../../wire/getRecord/GetRecordFields';
import { nonCachedErrors } from './ingestSuccessChildResourceParams';

export function selectChildResourceParams(
    luvio: Luvio,
    childResources: getUiApiRecordsByRecordId_ResourceRequestConfig[],
    resourceParams: getUiApiRecordsBatchByRecordIds_ResourceRequestConfig
): Fragment {
    const envelopeBodyPath = 'result';
    const envelopeStatusCodePath = 'statusCode';
    const envelopePath = 'results';
    return {
        kind: 'Fragment',
        reader: true,
        synthetic: true,
        read: (reader: Reader<any>) => {
            // Top-level 404 lookup
            const compositeSnapshot = luvio.storeLookup<any>({
                recordId: getUiApiRecordsBatchByRecordIds_keyBuilder(resourceParams),
                node: {
                    kind: 'Fragment',
                    private: [],
                },
                variables: {},
            });
            if (compositeSnapshot.state === 'Error' && compositeSnapshot.error.status === 404) {
                return {
                    state: compositeSnapshot.state,
                    value: compositeSnapshot.error,
                };
            }
            const sink = {} as BatchRepresentation;
            reader.enterPath(envelopePath);
            const timestamp = reader.getTimeStamp();
            const results = [] as BatchRepresentation['results'];
            for (let i = 0, len = childResources.length; i < len; i += 1) {
                reader.enterPath(i);
                reader.enterPath(envelopeBodyPath);
                const childResource = childResources[i];
                const childKey = getUiApiRecordsByRecordId_keyBuilder(childResource);
                const isMissingDataBeforeChildRead = reader.getIsDataMissing();
                const childSnapshot = reader.read<RecordRepresentation>(
                    buildRecordSelector(
                        childResource.urlParams.recordId,
                        childResource.queryParams.fields || [],
                        childResource.queryParams.optionalFields || []
                    )
                );
                reader.exitPath();
                const childSink = {} as BatchResultRepresentation;
                reader.markSeenId(childKey);
                switch (childSnapshot.state) {
                    case 'Stale':
                        reader.markStale();
                    // Stale needs envelope bodies filled in so don't break
                    // eslint-disable-next-line no-fallthrough
                    case 'Fulfilled':
                        reader.enterPath(envelopeStatusCodePath);
                        reader.assignScalar(envelopeStatusCodePath, childSink, 200);
                        reader.exitPath();
                        reader.enterPath(envelopeBodyPath);
                        reader.assignNonScalar(childSink, envelopeBodyPath, childSnapshot.data);
                        reader.exitPath();
                        break;
                    case 'Error':
                        reader.enterPath(envelopeStatusCodePath);
                        reader.assignScalar(
                            envelopeStatusCodePath,
                            childSink,
                            childSnapshot.error.status
                        );
                        reader.exitPath();
                        reader.enterPath(envelopeBodyPath);
                        reader.assignNonScalar(
                            childSink,
                            envelopeBodyPath,
                            childSnapshot.error.body
                        );
                        reader.exitPath();
                        break;
                    case 'Unfulfilled':
                        // if child snapshot doesn't have any data then
                        // that means the child record key is missing
                        if (childSnapshot.data === undefined) {
                            if (reader.isRebuilding() === false) {
                                // not a rebuild, mark as missing and move on
                                reader.markMissingLink(childKey);
                                break;
                            }

                            // On rebuilds we have to check if there is a non-cached
                            // error that we know about.  If we don't do this then
                            // rebuilds will go into endless refresh loop if a child
                            // has non-cached errors (since the top-level composite
                            // snapshot will look like an Unfulfilled snapshot
                            // instead of an error snapshot).
                            const nonCachedError = nonCachedErrors[childKey];

                            if (
                                nonCachedError === undefined ||
                                nonCachedError.expiration < timestamp
                            ) {
                                reader.markMissingLink(childKey);
                            } else {
                                // if this child error was the only reason the reader
                                // is marked as missing then we want to undo that
                                if (isMissingDataBeforeChildRead === false) {
                                    reader.unMarkMissing();
                                }

                                // put status code and body into reader path
                                const { response: nonCachedBody, status: nonCachedStatus } =
                                    nonCachedError;
                                reader.enterPath(envelopeStatusCodePath);
                                reader.assignScalar(
                                    envelopeStatusCodePath,
                                    childSink,
                                    nonCachedStatus
                                );
                                reader.exitPath();
                                reader.enterPath(envelopeBodyPath);
                                reader.assignNonScalar(childSink, envelopeBodyPath, nonCachedBody);
                                reader.exitPath();
                            }
                        }
                        break;
                    case 'Pending':
                        reader.markPending();
                        break;
                }
                ObjectFreeze(childSink);
                ArrayPrototypePush.call(results, childSink);
                reader.exitPath();
            }
            reader.assignNonScalar(sink, envelopePath, results);
            ObjectFreeze(sink);
            reader.exitPath();
            return sink;
        },
    };
}
