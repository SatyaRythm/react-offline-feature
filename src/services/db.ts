import { openDB, IDBPDatabase } from 'idb';
import { Account, Contact } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { offlineAccountApi } from './offlineApi';
import { log } from 'console';

// Define database structure
interface DBSchema {
  accounts: {
    key: string;
    value: Account & { 
      _syncStatus: 'synced' | 'created' | 'updated' | 'deleted';
      _lastModified: number;
    };
    indexes: { '_syncStatus': string };
  };
  contacts: {
    key: string;
    value: Contact & { 
      _syncStatus: 'synced' | 'created' | 'updated' | 'deleted';
      _lastModified: number;
    };
    indexes: { '_syncStatus': string, 'AccountId': string };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      entityType: 'account' | 'contact';
      operation: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
      attempts: number;
      lastAttempt: number;
    };
  };
}

// Database version
const DB_VERSION = 1;

// Database name
const DB_NAME = 'rhythm-offline-db';

let db: IDBPDatabase<DBSchema> | null = null;

/**
 * Initialize the database
 */
export async function initDatabase() {
  if (db) return db;

  db = await openDB<DBSchema>(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion, newVersion, transaction) {
      // Create object stores if they don't exist
      if (!database.objectStoreNames.contains('accounts')) {
        const accountStore = database.createObjectStore('accounts', { keyPath: 'id' });
        accountStore.createIndex('_syncStatus', '_syncStatus');
      }

      if (!database.objectStoreNames.contains('contacts')) {
        const contactStore = database.createObjectStore('contacts', { keyPath: 'id' });
        contactStore.createIndex('_syncStatus', '_syncStatus');
        contactStore.createIndex('AccountId', 'AccountId');
      }

      if (!database.objectStoreNames.contains('syncQueue')) {
        database.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    },
  });

  return db;
}

// Helper function to clean internal properties from records
function cleanRecord<T>(record: T & { _syncStatus: string; _lastModified: number }): T {
  // Use destructuring to remove internal props
  const { _syncStatus, _lastModified, ...cleanRecord } = record;
  // Return the clean record as the original type T
  return cleanRecord as unknown as T;
}

/**
 * Account operations
 */
export const accountDb = {
  /**
   * Get all accounts
   */
  async getAll(): Promise<Account[]> {
    // Always get a fresh connection
    const database = await initDatabase();
    
    // Use a transaction to ensure data consistency
    const tx = database.transaction('accounts', 'readonly');
    const accounts = await tx.store.getAll();
    await tx.done;
    
    // Filter out deleted accounts and remove internal properties
    return accounts
      .filter(account => account._syncStatus !== 'deleted')
      .map(account => cleanRecord(account));
  },

  /**
   * Get account by ID
   */
  async getById(id: string): Promise<Account | undefined> {
    // Always get a fresh connection
    const database = await initDatabase();
    
    // Use a transaction for consistency
    const tx = database.transaction('accounts', 'readonly');
    const account = await tx.store.get(id);
    await tx.done;
    
    if (!account || account._syncStatus === 'deleted') {
      return undefined;
    }

    // Remove internal properties
    return cleanRecord(account);
  },

  /**
   * Create a new account
   */
  async create(account: Account): Promise<Account> {
    const database = await initDatabase();
    
    // Generate an ID if none exists
    if (!account.id) {
      account.id = `local_${uuidv4()}`;
    }
    
    const timestamp = Date.now();
    const accountWithMeta = {
      ...account,
      _syncStatus: 'created' as const,
      _lastModified: timestamp,
    };
    
    // Use a transaction for consistency
    const tx = database.transaction('accounts', 'readwrite');
    await tx.store.put(accountWithMeta);
    await tx.done;
    
    // Add to sync queue
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'account',
      operation: 'create',
      data: account,
      timestamp,
      attempts: 0,
      lastAttempt: 0,
    });
    
    // Return clean version of the account
    return cleanRecord(accountWithMeta);
  },

  /**
   * Update an existing account
   */
  async update(id: string, account: Partial<Account>): Promise<Account> {
    const database = await initDatabase();
    
    // Use a transaction for consistency
    const tx = database.transaction('accounts', 'readwrite');
    const existingAccount = await tx.store.get(id);
    
    if (!existingAccount || existingAccount._syncStatus === 'deleted') {
      await tx.done;
      throw new Error(`Account with ID ${id} not found`);
    }
    
    const timestamp = Date.now();
    const updatedAccount = {
      ...existingAccount,
      ...account,
      id, // Ensure ID doesn't change
      _syncStatus: existingAccount._syncStatus === 'created' ? 'created' : 'updated',
      _lastModified: timestamp,
    };
    
    await tx.store.put(updatedAccount);
    await tx.done;
    
    // Add to sync queue
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'account',
      operation: existingAccount._syncStatus === 'created' ? 'create' : 'update',
      data: { id, ...account },
      timestamp,
      attempts: 0,
      lastAttempt: 0,
    });
    
    // Return clean version
    return cleanRecord(updatedAccount);
  },

  /**
   * Delete an account
   */
  async delete(id: string): Promise<void> {
    const database = await initDatabase();
    
    // Use a transaction for consistency
    const tx = database.transaction('accounts', 'readwrite');
    const existingAccount = await tx.store.get(id);
    
    if (!existingAccount || existingAccount._syncStatus === 'deleted') {
      await tx.done;
      return; // Already deleted or doesn't exist
    }
    
    const timestamp = Date.now();
    
    // If it's a local unsaved account, remove it completely
    if (existingAccount._syncStatus === 'created' && id.startsWith('local_')) {
      await tx.store.delete(id);
    } else {
      // Otherwise mark as deleted
      await tx.store.put({
        ...existingAccount,
        _syncStatus: 'deleted',
        _lastModified: timestamp,
      });
    }
    
    await tx.done;
    
    // Add to sync queue
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'account',
      operation: 'delete',
      data: { id },
      timestamp,
      attempts: 0,
      lastAttempt: 0,
    });
  },

  /**
   * Save accounts from the server to local DB (mark as synced)
   */
  async saveFromServer(accounts: Account[]): Promise<void> {
    const database = await initDatabase();
    const tx = database.transaction('accounts', 'readwrite');
    
    for (const account of accounts) {
      if (!account.id) continue;
      
      // Only update if the local version doesn't exist or isn't modified
      const existingAccount = await tx.store.get(account.id);
      
      if (!existingAccount || existingAccount._syncStatus === 'synced') {
        await tx.store.put({
          ...account,
          _syncStatus: 'synced',
          _lastModified: Date.now(),
        });
      }
    }
    
    await tx.done;
  },
};

/**
 * Contact operations
 */
export const contactDb = {
  /**
   * Get all contacts
   */
  async getAll(): Promise<Contact[]> {
    const database = await initDatabase();
    const contacts = await database.getAll('contacts');
    
    // Filter out deleted contacts and remove internal properties
    return contacts
      .filter(contact => contact._syncStatus !== 'deleted')
      .map(contact => {
        const { _syncStatus, _lastModified, ...cleanContact } = contact;
        return cleanContact;
      });
  },

  /**
   * Get contacts by account ID
   */
  async getByAccountId(accountId: string): Promise<Contact[]> {
    const database = await initDatabase();
    const tx = database.transaction('contacts', 'readonly');
    const index = tx.store.index('AccountId');
    const contacts = await index.getAll(accountId);
    
    await tx.done;
    
    // Filter out deleted contacts and remove internal properties
    return contacts
      .filter(contact => contact._syncStatus !== 'deleted')
      .map(contact => {
        const { _syncStatus, _lastModified, ...cleanContact } = contact;
        return cleanContact;
      });
  },

  /**
   * Get contact by ID
   */
  async getById(id: string): Promise<Contact | undefined> {
    const database = await initDatabase();
    const contact = await database.get('contacts', id);
    
    if (!contact || contact._syncStatus === 'deleted') {
      return undefined;
    }

    // Remove internal properties
    const { _syncStatus, _lastModified, ...cleanContact } = contact;
    return cleanContact;
  },

  /**
   * Create a new contact
   */
  async create(contact: Contact): Promise<Contact> {
    const database = await initDatabase();
    
    // Generate an ID if none exists
    if (!contact.id) {
      contact.id = `local_${uuidv4()}`;
    }
    
    const timestamp = Date.now();
    const contactWithMeta = {
      ...contact,
      _syncStatus: 'created' as const,
      _lastModified: timestamp,
    };
    
    await database.put('contacts', contactWithMeta);
    
    // Add to sync queue
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'contact',
      operation: 'create',
      data: contact,
      timestamp,
      attempts: 0,
      lastAttempt: 0,
    });
    
    return contact;
  },

  /**
   * Update an existing contact
   */
  async update(id: string, contact: Partial<Contact>): Promise<Contact> {
    const database = await initDatabase();
    const existingContact = await database.get('contacts', id);
    
    if (!existingContact || existingContact._syncStatus === 'deleted') {
      throw new Error(`Contact with ID ${id} not found`);
    }
    
    const timestamp = Date.now();
    const updatedContact = {
      ...existingContact,
      ...contact,
      id, // Ensure ID doesn't change
      _syncStatus: existingContact._syncStatus === 'created' ? 'created' : 'updated',
      _lastModified: timestamp,
    };
    
    await database.put('contacts', updatedContact);
    
    // Add to sync queue
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'contact',
      operation: existingContact._syncStatus === 'created' ? 'create' : 'update',
      data: { id, ...contact },
      timestamp,
      attempts: 0,
      lastAttempt: 0,
    });
    
    // Return clean version
    const { _syncStatus, _lastModified, ...cleanContact } = updatedContact;
    return cleanContact;
  },

  /**
   * Delete a contact
   */
  async delete(id: string): Promise<void> {
    const database = await initDatabase();
    const existingContact = await database.get('contacts', id);
    
    if (!existingContact || existingContact._syncStatus === 'deleted') {
      return; // Already deleted or doesn't exist
    }
    
    const timestamp = Date.now();
    
    // If it's a local unsaved contact, remove it completely
    if (existingContact._syncStatus === 'created' && id.startsWith('local_')) {
      await database.delete('contacts', id);
    } else {
      // Otherwise mark as deleted
      await database.put('contacts', {
        ...existingContact,
        _syncStatus: 'deleted',
        _lastModified: timestamp,
      });
      
      // Add to sync queue
      await addToSyncQueue({
        id: uuidv4(),
        entityType: 'contact',
        operation: 'delete',
        data: { id },
        timestamp,
        attempts: 0,
        lastAttempt: 0,
      });
    }
  },

  /**
   * Save contacts from the server to local DB (mark as synced)
   */
  async saveFromServer(contacts: Contact[]): Promise<void> {
    const database = await initDatabase();
    const tx = database.transaction('contacts', 'readwrite');
    
    for (const contact of contacts) {
      // Only update if the local version doesn't exist or isn't modified
      const existingContact = await tx.store.get(contact.id!);
      
      if (!existingContact || existingContact._syncStatus === 'synced') {
        await tx.store.put({
          ...contact,
          _syncStatus: 'synced',
          _lastModified: Date.now(),
        });
      }
    }
    
    await tx.done;
  },
};

/**
 * Add an operation to the sync queue
 */
async function addToSyncQueue(operation: any): Promise<void> {
  const database = await initDatabase();
  await database.put('syncQueue', operation);
}

/**
 * Process the sync queue
 */
export async function processSyncQueue(
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  const database = await initDatabase();
  const operations = await database.getAll('syncQueue');
  
  let success = 0;
  let failed = 0;
  
  // Sort by timestamp (oldest first) to maintain order
  operations.sort((a, b) => a.timestamp - b.timestamp);
  console.log('operations in line 456', operations);

  if(operations.length > 0) {
    for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        
        try {
          // Update progress if callback provided
          if (onProgress) {
            onProgress(i + 1, operations.length);
          }
          
          // Skip if too many failed attempts (to prevent infinite retries)
          if (operation.attempts >= 5) {
            console.warn(`Operation ${operation.id} has failed too many times, skipping.`);
            failed++;
            continue;
          }
          
          // Update attempt tracking
          operation.attempts++;
          operation.lastAttempt = Date.now();
          await database.put('syncQueue', operation);
          
          // Process based on entity type and operation
          if (operation.entityType === 'account') {
            await processAccountOperation(operation);
          } else if (operation.entityType === 'contact') {
            await processContactOperation(operation);
          }
          
          // If successful, remove from queue
          await database.delete('syncQueue', operation.id);
          success++;
        } catch (error) {
          console.error(`Failed to process sync operation ${operation.id}:`, error);
          failed++;
        }
      }
  }
  
  return { success, failed };
}

/**
 * Process an account operation
 */
async function processAccountOperation(operation: any): Promise<void> {
  const { data, operation: op } = operation;
  const { accountApi } = await import('./api');
  
  if (op === 'create') {
    // For local IDs, create a new record
    if (data.id.startsWith('local_')) {
      const { id: oldId, ...accountData } = data;

      // Use accountApi instead of direct fetch
      const newAccount = await accountApi.createAccount(accountData);
      
      // Update local record with server ID
      const database = await initDatabase();
      const localAccount = await database.get('accounts', oldId);
      
      if (localAccount) {
        // Delete old record
        await database.delete('accounts', oldId);
        
        // Create new record with server ID
        await database.put('accounts', {
          ...localAccount,
          ...newAccount,
          id: newAccount.id,
          _syncStatus: 'synced',
          _lastModified: Date.now(),
        });
      }
    } else {
      // Regular create using accountApi
      const newAccount = await accountApi.createAccount(data);
      
      // Update local status
      const database = await initDatabase();
      const localAccount = await database.get('accounts', data.id);
      
      if (localAccount) {
        await database.put('accounts', {
          ...localAccount,
          ...newAccount,
          id: newAccount.id,
          _syncStatus: 'synced',
          _lastModified: Date.now(),
        });
      }
    }
  } else if (op === 'update') {
    // Skip if it's a local ID (should never happen)
    if (data.id.startsWith('local_')) {
      return;
    }
    
    // Use accountApi for update
    const updatedAccount = await accountApi.updateAccount(data.id, data);
    
    // Update local status
    const database = await initDatabase();
    const localAccount = await database.get('accounts', data.id);
    
    if (localAccount) {
      await database.put('accounts', {
        ...localAccount,
        ...updatedAccount,
        _syncStatus: 'synced',
        _lastModified: Date.now(),
      });
    }
  } else if (op === 'delete') {
    // Skip if it's a local ID (should never happen)
    if (data.id.startsWith('local_')) {
      return;
    }
    
    // Use accountApi for delete
    await accountApi.deleteAccount(data.id);
    
    // Remove from local DB
    const database = await initDatabase();
    await database.delete('accounts', data.id);
  }
}

/**
 * Process a contact operation
 */
async function processContactOperation(operation: any): Promise<void> {
  const { data, operation: op } = operation;
  const { contactApi } = await import('./api');
  
  if (op === 'create') {
    // For local IDs, create a new record
    if (data.id.startsWith('local_')) {
      const { id: oldId, ...contactData } = data;
      
      // Use contactApi instead of direct fetch
      const newContact = await contactApi.createContact(contactData);
      
      // Update local record with server ID
      const database = await initDatabase();
      const localContact = await database.get('contacts', oldId);
      
      if (localContact) {
        // Delete old record
        await database.delete('contacts', oldId);
        
        // Create new record with server ID
        await database.put('contacts', {
          ...localContact,
          ...newContact,
          id: newContact.id,
          _syncStatus: 'synced',
          _lastModified: Date.now(),
        });
      }
    } else {
      // Regular create using contactApi
      const newContact = await contactApi.createContact(data);
      
      // Update local status
      const database = await initDatabase();
      const localContact = await database.get('contacts', data.id);
      
      if (localContact) {
        await database.put('contacts', {
          ...localContact,
          ...newContact,
          _syncStatus: 'synced',
          _lastModified: Date.now(),
        });
      }
    }
  } else if (op === 'update') {
    // Skip if it's a local ID (should never happen)
    if (data.id.startsWith('local_')) {
      return;
    }
    
    // Use contactApi for update
    const updatedContact = await contactApi.updateContact(data.id, data);
    
    // Update local status
    const database = await initDatabase();
    const localContact = await database.get('contacts', data.id);
    
    if (localContact) {
      await database.put('contacts', {
        ...localContact,
        ...updatedContact,
        _syncStatus: 'synced',
        _lastModified: Date.now(),
      });
    }
  } else if (op === 'delete') {
    // Skip if it's a local ID (should never happen)
    if (data.id.startsWith('local_')) {
      return;
    }
    
    // Use contactApi for delete
    await contactApi.deleteContact(data.id);
    
    // Remove from local DB
    const database = await initDatabase();
    await database.delete('contacts', data.id);
  }
} 