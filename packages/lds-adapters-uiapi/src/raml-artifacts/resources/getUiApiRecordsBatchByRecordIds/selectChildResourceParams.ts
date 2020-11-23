import { Fragment, Luvio, Reader } from '@luvio/engine';
import { ArrayPrototypePush, ObjectFreeze } from '../../../generated/adapters/adapter-utils';
import {
    keyBuilder as getUiApiRecordsByRecordId_keyBuilder,
    ResourceRequestConfig as getUiApiRecordsByRecordId_ResourceRequestConfig,
} from '../../../generated/resources/getUiApiRecordsByRecordId';
import { BatchRepresentation } from '../../../generated/types/BatchRepresentation';
import { BatchResultRepresentation } from '../../../generated/types/BatchResultRepresentation';
import { RecordRepresentation } from '../../../generated/types/RecordRepresentation';
import { buildRecordSelector } from '../../../wire/getRecord/GetRecordFields';

export function selectChildResourceParams(
    lds: Luvio,
    childResources: getUiApiRecordsByRecordId_ResourceRequestConfig[]
): Fragment {
    const envelopeBodyPath = 'result';
    const envelopeStatusCodePath = 'statusCode';
    const envelopePath = 'results';
    return {
        kind: 'Fragment',
        reader: true,
        synthetic: true,
        read: (reader: Reader<any>) => {
            const sink = {} as BatchRepresentation;
            reader.enterPath(envelopePath);
            const results = [] as BatchRepresentation['results'];
            for (let i = 0, len = childResources.length; i < len; i += 1) {
                reader.enterPath(i);
                const childResource = childResources[i];
                const childKey = getUiApiRecordsByRecordId_keyBuilder(childResource);
                const childSnapshot = reader.read<RecordRepresentation>(
                    buildRecordSelector(
                        childResource.urlParams.recordId,
                        childResource.queryParams.fields || [],
                        childResource.queryParams.optionalFields || []
                    )
                );
                const childSink = {} as BatchResultRepresentation;
                switch (childSnapshot.state) {
                    case 'Fulfilled':
                        reader.seenIds[childKey] = true;
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
                        reader.markMissing();
                        break;
                    case 'Pending':
                        reader.markPending();
                        break;
                    case 'Stale':
                        reader.markStale();
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
