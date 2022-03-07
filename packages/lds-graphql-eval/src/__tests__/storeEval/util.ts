import { StoreMetadata, StoreResolveResultState, TTLStrategy } from '@luvio/engine';
import { EvalSnapshot, SnapshotState } from '../../storeEval/snapshot';

export const TABLE_ATTRS_DB_RESULT = `{"LdsSoupValue": "TABLE_1_1", "LdsSoupTable": "TABLE_1", "LdsSoupKey": "TABLE_1_0"}`;
export const TABLE_ATTRS_JSON = {
    jsonColumn: 'TABLE_1_1',
    jsonTable: 'TABLE_1',
    keyColumn: 'TABLE_1_0',
};

export function buildTTLStrategy(staleDuration: number = 0): TTLStrategy {
    return (timestamp: number, metadata: StoreMetadata | undefined, valueIsError: boolean) => {
        if (metadata !== undefined) {
            const { expirationTimestamp } = metadata;

            if (timestamp > expirationTimestamp) {
                if (timestamp <= expirationTimestamp + staleDuration && valueIsError !== true) {
                    return StoreResolveResultState.Stale;
                }
                return StoreResolveResultState.NotPresent;
            }
        }

        if (valueIsError === true) {
            return StoreResolveResultState.Error;
        }

        return StoreResolveResultState.Found;
    };
}

export function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

export const evaluationResults = (expiration: number) => `
{
    "data": {
      "uiapi": {
        "query": {
          "TimeSheet": {
            "edges": [
              {
                "node": {
                  "TimeSheetNumber": { "value": "TS-0728", "displayValue": null },
                  "_drafts": null,
                  "Id": "1tsx0000000004zAAA",
                  "_metadata": {
                    "ingestionTimestamp": 1634703582297,
                    "expirationTimestamp": ${expiration},
                    "representationName": "RecordRepresentation",
                    "namespace": "UiApi::",
                    "staleTimestamp": 9007199254740991
                  },
                  "TimeSheetEntries": {
                    "edges": [
                      {
                        "node": {
                          "_drafts": null,
                          "Id": "1tsx0000000008MAAZ",
                          "_metadata": {
                            "ingestionTimestamp": 1634703585585,
                            "expirationTimestamp": ${expiration},
                            "representationName": "RecordRepresentation",
                            "namespace": "UiApi::",
                            "staleTimestamp": 9007199254740991
                          }
                        }
                      }
                    ]
                  }
                }
              },
              {
                "node": {
                  "TimeSheetNumber": { "value": "TS-0446", "displayValue": null },
                  "_drafts": null,
                  "Id": "1tsx0000000008MAAQ",
                  "_metadata": {
                    "ingestionTimestamp": 1634703585585,
                    "expirationTimestamp": ${expiration},
                    "representationName": "RecordRepresentation",
                    "namespace": "UiApi::",
                    "staleTimestamp": 9007199254740991
                  }
                }
              }
            ]
          }
        }
      }
    }
  }
  `;

export const snapshotTemplate = (expiration: number, state: SnapshotState): EvalSnapshot => {
    return {
        recordId: 'GraphQL::graphql',
        variables: {},
        seenRecords: {
            'UiApi::RecordRepresentation:1tsx0000000004zAAA': true,
            'UiApi::RecordRepresentation:1tsx0000000008MAAQ': true,
            'UiApi::RecordRepresentation:1tsx0000000008MAAZ': true,
        },
        select: {
            node: { kind: 'Fragment', private: [] },
            recordId: 'GraphQL::graphql',
            variables: {},
        },
        state: state as any,
        data: {
            data: {
                uiapi: {
                    query: {
                        TimeSheet: {
                            edges: [
                                {
                                    node: {
                                        Id: '1tsx0000000004zAAA',
                                        TimeSheetNumber: {
                                            displayValue: null,
                                            value: 'TS-0728',
                                        },
                                        _drafts: null,
                                        _metadata: {
                                            expirationTimestamp: expiration,
                                            ingestionTimestamp: 1634703582297,
                                            namespace: 'UiApi::',
                                            representationName: 'RecordRepresentation',
                                            staleTimestamp: 9007199254740991,
                                        },
                                        TimeSheetEntries: {
                                            edges: [
                                                {
                                                    node: {
                                                        Id: '1tsx0000000008MAAZ',
                                                        _drafts: null,
                                                        _metadata: {
                                                            expirationTimestamp: expiration,
                                                            ingestionTimestamp: 1634703585585,
                                                            namespace: 'UiApi::',
                                                            representationName:
                                                                'RecordRepresentation',
                                                            staleTimestamp: 9007199254740991,
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                                {
                                    node: {
                                        Id: '1tsx0000000008MAAQ',
                                        TimeSheetNumber: {
                                            displayValue: null,
                                            value: 'TS-0446',
                                        },
                                        _drafts: null,
                                        _metadata: {
                                            expirationTimestamp: expiration,
                                            ingestionTimestamp: 1634703585585,
                                            namespace: 'UiApi::',
                                            representationName: 'RecordRepresentation',
                                            staleTimestamp: 9007199254740991,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        },
    };
};
