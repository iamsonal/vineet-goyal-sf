import type { Luvio } from '@luvio/engine';
import { deleteRecordAdapterFactory } from '../../generated/adapters/deleteRecord';

export const factory = (luvio: Luvio) => {
    const deleteRecordAdapterInstance = deleteRecordAdapterFactory(luvio);
    return (recordId: unknown) => deleteRecordAdapterInstance({ recordId: recordId as string });
};
