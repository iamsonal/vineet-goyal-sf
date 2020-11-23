import { Luvio } from '@luvio/engine';
import { deleteRecordAdapterFactory } from '../../generated/adapters/deleteRecord';

export const factory = (lds: Luvio) => {
    const deleteRecordAdapterInstance = deleteRecordAdapterFactory(lds);
    return (recordId: unknown) => deleteRecordAdapterInstance({ recordId: recordId as string });
};
