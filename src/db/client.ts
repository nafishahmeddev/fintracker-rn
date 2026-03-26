import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// This will create or open the luno database
const expoDb = openDatabaseSync('luno.db');

export const db = drizzle(expoDb, { schema });
