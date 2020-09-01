import { LDS } from '@ldsjs/engine';
import { deleteRecordAdapterFactory } from '../../generated/adapters/deleteRecord';

export const factory = (lds: LDS) => {
    const deleteRecordAdapterInstance = deleteRecordAdapterFactory(lds);
    return (recordId: unknown) => deleteRecordAdapterInstance({ recordId: recordId as string });
};
