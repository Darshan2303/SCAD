import Dexie, { type Table } from 'dexie';
import type { Company } from '../types';

// FIX: Refactored to a non-subclassing pattern to resolve TypeScript error where 'version' method was not found on the extended class.
export const db = new Dexie('supplyChainDatabase') as Dexie & {
  companies: Table<Company, string>;
};

db.version(1).stores({
  companies: 'id' // Primary key
});
