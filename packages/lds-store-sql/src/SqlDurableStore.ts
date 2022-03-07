import type { DurableStore } from '@luvio/environments';
import type { SqlStore } from './SqlStore';

/**
 * A DurableStore implementation that also supports evaluating SQL queries against
 * the default DurableStore segment
 */
export type SqlDurableStore = SqlStore & DurableStore;
