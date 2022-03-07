import type { DraftAction, DraftIdMappingEntry, QueueOperation } from './DraftQueue';

/**
 * Defines the store where drafts are persisted
 */

export interface DraftStore {
    writeAction(action: DraftAction<unknown, unknown>): Promise<void>;
    getAllDrafts(): Promise<DraftAction<unknown, unknown>[]>;
    deleteDraft(actionId: string): Promise<void>;
    deleteByTag(tag: string): Promise<void>;
    completeAction(
        queueOperations: QueueOperation[],
        mapping: DraftIdMappingEntry | undefined
    ): Promise<void>;
}
