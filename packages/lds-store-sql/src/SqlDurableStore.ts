import { DurableStore } from '@luvio/environments';
import { SqlStore } from './SqlStore';

/**
 * A DurableStore implementation that also supports evaluating SQL queries against
 * the default DurableStore segment
 */
export type SqlDurableStore = SqlStore & DurableStore;
