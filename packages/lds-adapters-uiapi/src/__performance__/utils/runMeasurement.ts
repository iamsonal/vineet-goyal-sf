import type { DatabaseConnection } from '@databases/sqlite';
import connect from '@databases/sqlite';
import { buildMockNetworkAdapter } from '@luvio/adapter-test-library';
import path from 'path';
import { readFileSync } from 'fs';
import { SqliteMockDurableStore } from './sqliteDurableStore';
import type { Measurement } from './utils';
import { makeDurable } from '@luvio/environments';
import type { ResourceResponse } from '@luvio/engine';
import { Luvio, Store, Environment } from '@luvio/engine';

import { onResourceResponseSuccess as getRecordsOnResourceResponseSuccess } from '../../generated/adapters/getRecords';
import type { BatchResultRepresentation } from '../../generated/types/BatchResultRepresentation';
import type { ResourceRequestConfig as GetRecordsResourceRequestConfig } from '../../generated/resources/getUiApiRecordsBatchByRecordIds';
import type { GetRecordsConfig } from '../../raml-artifacts/adapters/getRecords/GetRecordsConfig';

import { onResourceResponseSuccess as getRelatedListRecordsOnResourceResponseSuccess } from '../../generated/adapters/getRelatedListRecords';
import type { GetRelatedListRecordsConfig } from '../../generated/adapters/getRelatedListRecords';
import type { ResourceRequestConfig as GetRelatedListRecordsRequestConfig } from '../../generated/resources/postUiApiRelatedListRecordsByParentRecordIdAndRelatedListId';

import async_hooks from 'async_hooks';

interface RecordingRequestData {
    method: string;
    path: string;
    responseBodyFileName?: string;
    url: string;
    statusCode?: string;
    statusMessage?: string;
}

interface RecordingData {
    ids: Record<string, RecordingRequestData>;
}

enum RequestType {
    RecordBatch,
    RelatedListRecords,
    Unknown,
}

interface ParsedData {
    resourceParams: any;
    config: any;
    onResourceResponseSuccessFunc: any;
    response: any;
}

class RecordingParser {
    constructor(public dataDir: string) {}

    parseData(data: RecordingData) {
        let numRecordBatch = 0;
        let numRelatedListRecords = 0;
        let numUnknown = 0;

        const parsedData: ParsedData[] = Object.values(data.ids)
            .map((requestData) => {
                const requestType = this.categorizeRequest(requestData);

                switch (requestType) {
                    case RequestType.RecordBatch:
                        numRecordBatch++;
                        return this.buildRecordBatchParsedData(requestData);
                    case RequestType.RelatedListRecords:
                        numRelatedListRecords++;
                        return this.buildRelatedListRecordsParsedData(requestData);
                    default:
                        numUnknown++;
                        return undefined;
                }
            })
            .filter((element) => element !== undefined) as ParsedData[];

        return { parsedData, numRecordBatch, numRelatedListRecords, numUnknown };
    }

    categorizeRequest(requestData: RecordingRequestData): RequestType {
        const recordBatchEndpointPrefix = '/services/data/v54.0/ui-api/records/batch/';
        const relatedListRecordsEndpointPrefix =
            '/services/data/v54.0/ui-api/related-list-records/';

        if (requestData.path.startsWith(recordBatchEndpointPrefix)) {
            return RequestType.RecordBatch;
        } else if (requestData.path.startsWith(relatedListRecordsEndpointPrefix)) {
            return RequestType.RelatedListRecords;
        }
        return RequestType.Unknown;
    }

    buildRecordBatchParsedData(request: RecordingRequestData): ParsedData | undefined {
        const url = new URL(request.url);

        const optionalFields = url.searchParams.get('optionalFields')!.split(',');

        const pathParams = url.pathname.split('/');
        const recordIds = pathParams[pathParams.length - 1].split(',');

        const config: GetRecordsConfig = {
            records: [
                {
                    recordIds,
                    optionalFields,
                },
            ],
        };

        const resourceParams: GetRecordsResourceRequestConfig = {
            urlParams: {
                recordIds,
            },
            queryParams: {
                optionalFields,
            },
        };

        if (request.responseBodyFileName === undefined) {
            return undefined;
        }

        // Recorded response path isn't quite right, have to manipulate it here
        const relativeResponsePath = request.responseBodyFileName.split('/').slice(2);

        const responsePath = path.join(this.dataDir, ...relativeResponsePath);
        const body = JSON.parse(readFileSync(responsePath).toString());

        const response: ResourceResponse<BatchResultRepresentation> = {
            body,
            status: parseInt(request.statusCode!),
            statusText: request.statusMessage!,
            ok: true,
            headers: {},
        };

        return {
            resourceParams,
            config,
            onResourceResponseSuccessFunc: getRecordsOnResourceResponseSuccess,
            response,
        };
    }

    buildRelatedListRecordsParsedData(request: RecordingRequestData): ParsedData | undefined {
        const url = new URL(request.url);

        const pathParams = url.pathname.split('/');
        const [parentRecordId, relatedListId] = pathParams.slice(-2);

        const config: GetRelatedListRecordsConfig = {
            parentRecordId,
            relatedListId,
        };

        const resourceParams: GetRelatedListRecordsRequestConfig = {
            urlParams: {
                parentRecordId,
                relatedListId,
            },
            body: {},
        };

        if (request.responseBodyFileName === undefined) {
            return undefined;
        }

        const status = parseInt(request.statusCode!);

        if (status < 200 || status >= 300) {
            return undefined;
        }

        // Recorded response path isn't quite right, have to manipulate it here
        const relativeResponsePath = request.responseBodyFileName.split('/').slice(2);

        const responsePath = path.join(this.dataDir, ...relativeResponsePath);
        const body = JSON.parse(readFileSync(responsePath).toString());

        const response: ResourceResponse<BatchResultRepresentation> = {
            body,
            status,
            statusText: request.statusMessage!,
            ok: true,
            headers: {},
        };

        return {
            resourceParams,
            config,
            onResourceResponseSuccessFunc: getRelatedListRecordsOnResourceResponseSuccess,
            response,
        };
    }
}

/**
 * Measure the ingestion stats of a batch of records. This is achieved by running the ingestion path code
 * from the adapter sans network requests.
 *
 * @param luvio - The luvio engine to use for the measurement
 * @param recordBatch - The batch of records to measure ingestion of
 * @returns The measurement results
 */
async function measureRequestIngest(luvio: Luvio, parsedData: ParsedData): Promise<Measurement> {
    let globalPromises: Promise<any>[] = [];
    const hook = async_hooks.createHook({
        init: function (asyncId, type, triggerAsyncId, resource) {
            if (type === 'PROMISE') {
                globalPromises.push(resource as Promise<any>);
            }
        },
    });

    const memoryStart = process.memoryUsage().heapUsed;
    const start = Date.now();
    hook.enable();
    luvio.handleSuccessResponse(
        () =>
            parsedData.onResourceResponseSuccessFunc(
                luvio,
                parsedData.config,
                parsedData.resourceParams,
                parsedData.response
            ),
        () => {
            return {};
        }
    );
    hook.disable();
    await Promise.all(globalPromises);
    globalPromises = [];

    const end = Date.now();
    const memoryEnd = process.memoryUsage().heapUsed;

    return { time: end - start, memory: memoryEnd - memoryStart };
}

/**
 * Runs setup code and measures the ingestion stats on a number of records by splitting it into batches
 *
 * @returns The measurement results and luvio/db instances
 */
export async function runMeasurement(data: RecordingData, dataDir: string) {
    const db: DatabaseConnection = connect();
    const durableStore = new SqliteMockDurableStore(db);
    const network = buildMockNetworkAdapter([]);

    const store = new Store({ scheduler: () => {} });
    let env = makeDurable(new Environment(store, network), {
        durableStore,
    });
    const luvio = new Luvio(env);

    process.env.NODE_ENV = 'production';

    const measurements: Measurement[] = [];

    const parser = new RecordingParser(dataDir);
    const { parsedData, numRecordBatch, numRelatedListRecords, numUnknown } =
        parser.parseData(data);

    for (let i = 0; i < parsedData.length; i++) {
        const parsedRequest = parsedData[i];
        const measurement = await measureRequestIngest(luvio, parsedRequest);
        measurements.push(measurement);
    }

    const requestTimes = measurements.map((measurement) => measurement.time);
    const requestMemory = measurements.map((measurement) => measurement.memory);

    return {
        measurements: {
            measurementsMs: requestTimes,
            memoryUsageBytes: requestMemory,
        },
        luvio,
        db,
        numRecordBatch,
        numRelatedListRecords,
        numUnknown,
    };
}
