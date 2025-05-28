import { Account, Contact } from '../types';
import { accountDb, contactDb, initDatabase } from './db';
import connectivityService from './connectivity';
import { accountApi, contactApi } from './api';

// Add type declaration for the custom property we're adding to Window
declare global {
  interface Window {
    _fetchPatched?: boolean;
  }
}

// Initialize the IndexedDB when this module is imported
initDatabase().catch(error => {
  console.error('Failed to initialize offline database:', error);
});

// Set a custom header to any fetch request to bypass the service worker cache
const bypassCache = () => {
  // Monkey patch fetch to add a header for IndexedDB requests
  const originalFetch = window.fetch;
  if (!window._fetchPatched) {
    window.fetch = function(input, init) {
      // Add a custom header to identify local data requests
      if (init && 
          (input.toString().includes('/accounts') || 
           input.toString().includes('/contacts'))) {
        init.headers = init.headers || {};
        init.headers = {
          ...init.headers,
          'x-local-data': 'true',
          'Cache-Control': 'no-store, no-cache'
        };
      }
      return originalFetch(input, init);
    };
    window._fetchPatched = true;
  }
};

// Ensure the fetch is patched
bypassCache();

/**
 * Enhanced Account API with offline support
 * Always uses the api.ts interface but falls back to local storage when offline
 */
export const offlineAccountApi = {
  /**
   * Get all accounts
   * Always uses accountApi but falls back to local data if offline
   */
  getAccounts: async (): Promise<Account[]> => {
    try {
      if (connectivityService.getIsOnline()) {
        // If online, get from server and update local cache
        const accounts = await accountApi.getAccounts();
        await accountDb.saveFromServer(accounts);
        return accounts;
      } else {
        // If offline, use cached data but log the attempted API call
        console.log('Offline: Would have called accountApi.getAccounts()');
        // Always get fresh data from IndexedDB
        return await accountDb.getAll();
      }
    } catch (error) {
      console.error('Error in getAccounts, falling back to local data:', error);
      // If any error (including network), fall back to local data
      return await accountDb.getAll();
    }
  },

  /**
   * Get account by ID
   * Always uses accountApi but falls back to local data if offline
   */
  getAccount: async (id: string): Promise<Account | undefined> => {
    try {
      if (connectivityService.getIsOnline() && !id.startsWith('local_')) {
        // If online and not a local ID, get from server and update local cache
        try {
          const account = await accountApi.getAccount(id);
          await accountDb.saveFromServer([account]);
          return account;
        } catch (e) {
          // If not found on server or other error, try local data
          console.log(`API call failed for accountApi.getAccount(${id}), using local data`);
          return await accountDb.getById(id);
        }
      } else {
        // If offline or local ID, log the attempted API call
        console.log(`Offline: Would have called accountApi.getAccount(${id})`);
        // Always get fresh data from IndexedDB
        return await accountDb.getById(id);
      }
    } catch (error) {
      console.error(`Error in getAccount ${id}, falling back to local data:`, error);
      // If any error, fall back to local data
      return await accountDb.getById(id);
    }
  },

  /**
   * Create new account
   * Always attempts to use accountApi but saves locally when offline
   */
  createAccount: async (accountData: Account): Promise<Account> => {
    try {
      if (connectivityService.getIsOnline()) {
        // If online, save to server
        try {
          const newAccount = await accountApi.createAccount(accountData);
          // Save the server-created account to local DB
          await accountDb.saveFromServer([newAccount]);
          return newAccount;
        } catch (error) {
          console.error('Failed to create account on server, saving locally:', error);
          // If server create fails, log the attempt and save locally
          console.log('API call failed: accountApi.createAccount()');
          const createdAccount = await accountDb.create(accountData);
          
          // Force a refresh of the account list to reflect the local change
          // This ensures the UI is updated with local data
          return createdAccount;
        }
      } else {
        // If offline, log the attempted API call and save locally
        console.log('Offline: Would have called accountApi.createAccount()');
        const createdAccount = await accountDb.create(accountData);
        
        // Force a refresh of the account list to reflect the local change
        return createdAccount;
      }
    } catch (error) {
      console.error('Error in createAccount, saving locally:', error);
      // If any error, try to save locally
      return await accountDb.create(accountData);
    }
  },

  /**
   * Update existing account
   * Always attempts to use accountApi but updates locally when offline
   */
  updateAccount: async (id: string, accountData: Partial<Account>): Promise<Account> => {
    try {
      // For local IDs, always update locally but log the API attempt
      if (id.startsWith('local_')) {
        console.log(`Offline (local ID): Would have called accountApi.updateAccount(${id})`);
        return await accountDb.update(id, accountData);
      }

      if (connectivityService.getIsOnline()) {
        // If online, update on server
        try {
          const updatedAccount = await accountApi.updateAccount(id, accountData);
          // Update the local copy with server data
          await accountDb.saveFromServer([updatedAccount]);
          return updatedAccount;
        } catch (error) {
          console.error(`Failed to update account ${id} on server, updating locally:`, error);
          // If server update fails, log the attempt and update locally
          console.log(`API call failed: accountApi.updateAccount(${id})`);
          return await accountDb.update(id, accountData);
        }
      } else {
        // If offline, log the attempted API call and update locally
        console.log(`Offline: Would have called accountApi.updateAccount(${id})`);
        const updatedAccount = await accountDb.update(id, accountData);
        
        // Always return the fresh data from the database
        return updatedAccount;
      }
    } catch (error) {
      console.error(`Error in updateAccount ${id}, updating locally:`, error);
      // If any error, try to update locally
      return await accountDb.update(id, accountData);
    }
  },

  /**
   * Delete account
   * Always attempts to use accountApi but marks locally when offline
   */
  deleteAccount: async (id: string): Promise<void> => {
    try {
      // For local IDs, always delete locally but log the API attempt
      if (id.startsWith('local_')) {
        console.log(`Offline (local ID): Would have called accountApi.deleteAccount(${id})`);
        await accountDb.delete(id);
        return;
      }

      if (connectivityService.getIsOnline()) {
        // If online, delete from server
        try {
          await accountApi.deleteAccount(id);
          // Remove from local DB as well
          await accountDb.delete(id);
        } catch (error) {
          console.error(`Failed to delete account ${id} on server, marking locally:`, error);
          // If server delete fails, log the attempt and mark locally
          console.log(`API call failed: accountApi.deleteAccount(${id})`);
          await accountDb.delete(id);
        }
      } else {
        // If offline, log the attempted API call and mark locally
        console.log(`Offline: Would have called accountApi.deleteAccount(${id})`);
        await accountDb.delete(id);
      }
    } catch (error) {
      console.error(`Error in deleteAccount ${id}, marking locally:`, error);
      // If any error, try to mark locally
      await accountDb.delete(id);
    }
  }
};

/**
 * Enhanced Contact API with offline support
 * Always uses the api.ts interface but falls back to local storage when offline
 */
export const offlineContactApi = {
  /**
   * Get all contacts
   * Always uses contactApi but falls back to local data if offline
   */
  getContacts: async (): Promise<Contact[]> => {
    try {
      if (connectivityService.getIsOnline()) {
        // If online, get from server and update local cache
        const contacts = await contactApi.getContacts();
        await contactDb.saveFromServer(contacts);
        return contacts;
      } else {
        // If offline, log the attempted API call and use cached data
        console.log('Offline: Would have called contactApi.getContacts()');
        // Always get fresh data from IndexedDB
        return await contactDb.getAll();
      }
    } catch (error) {
      console.error('Error in getContacts, falling back to local data:', error);
      // If any error (including network), fall back to local data
      return await contactDb.getAll();
    }
  },

  /**
   * Get contacts for a specific account
   * Always uses contactApi but falls back to local data if offline
   */
  getContactsByAccount: async (accountId: string): Promise<Contact[]> => {
    try {
      // For local account IDs, use local contacts but log the API attempt
      if (accountId.startsWith('local_')) {
        console.log(`Offline (local ID): Would have called contactApi.getContactsByAccount(${accountId})`);
        return await contactDb.getByAccountId(accountId);
      }

      if (connectivityService.getIsOnline()) {
        // If online, get from server and update local cache
        try {
          const contacts = await contactApi.getContactsByAccount(accountId);
          await contactDb.saveFromServer(contacts);
          return contacts;
        } catch (error) {
          // If server error, log the attempt and get from local
          console.log(`API call failed: contactApi.getContactsByAccount(${accountId})`);
          return await contactDb.getByAccountId(accountId);
        }
      } else {
        // If offline, log the attempted API call and get from local database
        console.log(`Offline: Would have called contactApi.getContactsByAccount(${accountId})`);
        // Always get fresh data from IndexedDB
        return await contactDb.getByAccountId(accountId);
      }
    } catch (error) {
      console.error(`Error in getContactsByAccount ${accountId}, falling back to local data:`, error);
      // If any error, fall back to local data
      return await contactDb.getByAccountId(accountId);
    }
  },

  /**
   * Get contact by ID
   * Always uses contactApi but falls back to local data if offline
   */
  getContact: async (id: string): Promise<Contact | undefined> => {
    try {
      if (connectivityService.getIsOnline() && !id.startsWith('local_')) {
        // If online and not a local ID, get from server and update local cache
        try {
          const contact = await contactApi.getContact(id);
          await contactDb.saveFromServer([contact]);
          return contact;
        } catch (e) {
          // If not found on server or other error, log the attempt and try local data
          console.log(`API call failed: contactApi.getContact(${id})`);
          return await contactDb.getById(id);
        }
      } else {
        // If offline or local ID, log the attempted API call and get from local database
        console.log(`Offline: Would have called contactApi.getContact(${id})`);
        // Always get fresh data from IndexedDB
        return await contactDb.getById(id);
      }
    } catch (error) {
      console.error(`Error in getContact ${id}, falling back to local data:`, error);
      // If any error, fall back to local data
      return await contactDb.getById(id);
    }
  },

  /**
   * Create new contact
   * Always attempts to use contactApi but saves locally when offline
   */
  createContact: async (contactData: Contact): Promise<Contact> => {
    try {
      // For local account IDs, always save locally but log the API attempt
      if (contactData.AccountId && contactData.AccountId.startsWith('local_')) {
        console.log('Offline (local AccountId): Would have called contactApi.createContact()');
        const createdContact = await contactDb.create(contactData);
        return createdContact;
      }

      if (connectivityService.getIsOnline()) {
        // If online, save to server
        try {
          const newContact = await contactApi.createContact(contactData);
          // Save the server-created contact to local DB
          await contactDb.saveFromServer([newContact]);
          return newContact;
        } catch (error) {
          console.error('Failed to create contact on server, saving locally:', error);
          // If server create fails, log the attempt and save locally
          console.log('API call failed: contactApi.createContact()');
          const createdContact = await contactDb.create(contactData);
          return createdContact;
        }
      } else {
        // If offline, log the attempted API call and save locally
        console.log('Offline: Would have called contactApi.createContact()');
        const createdContact = await contactDb.create(contactData);
        return createdContact;
      }
    } catch (error) {
      console.error('Error in createContact, saving locally:', error);
      // If any error, try to save locally
      return await contactDb.create(contactData);
    }
  },

  /**
   * Update existing contact
   * Always attempts to use contactApi but updates locally when offline
   */
  updateContact: async (id: string, contactData: Partial<Contact>): Promise<Contact> => {
    try {
      // For local IDs, always update locally but log the API attempt
      if (id.startsWith('local_')) {
        console.log(`Offline (local ID): Would have called contactApi.updateContact(${id})`);
        const updatedContact = await contactDb.update(id, contactData);
        return updatedContact;
      }

      if (connectivityService.getIsOnline()) {
        // If online, update on server
        try {
          const updatedContact = await contactApi.updateContact(id, contactData);
          // Update the local copy with server data
          await contactDb.saveFromServer([updatedContact]);
          return updatedContact;
        } catch (error) {
          console.error(`Failed to update contact ${id} on server, updating locally:`, error);
          // If server update fails, log the attempt and update locally
          console.log(`API call failed: contactApi.updateContact(${id})`);
          const updatedContact = await contactDb.update(id, contactData);
          return updatedContact;
        }
      } else {
        // If offline, log the attempted API call and update locally
        console.log(`Offline: Would have called contactApi.updateContact(${id})`);
        const updatedContact = await contactDb.update(id, contactData);
        return updatedContact;
      }
    } catch (error) {
      console.error(`Error in updateContact ${id}, updating locally:`, error);
      // If any error, try to update locally
      return await contactDb.update(id, contactData);
    }
  },

  /**
   * Delete contact
   * Always attempts to use contactApi but marks locally when offline
   */
  deleteContact: async (id: string): Promise<void> => {
    try {
      // For local IDs, always delete locally but log the API attempt
      if (id.startsWith('local_')) {
        console.log(`Offline (local ID): Would have called contactApi.deleteContact(${id})`);
        await contactDb.delete(id);
        return;
      }

      if (connectivityService.getIsOnline()) {
        // If online, delete from server
        try {
          await contactApi.deleteContact(id);
          // Remove from local DB as well
          await contactDb.delete(id);
        } catch (error) {
          console.error(`Failed to delete contact ${id} on server, marking locally:`, error);
          // If server delete fails, log the attempt and mark locally
          console.log(`API call failed: contactApi.deleteContact(${id})`);
          await contactDb.delete(id);
        }
      } else {
        // If offline, log the attempted API call and mark locally
        console.log(`Offline: Would have called contactApi.deleteContact(${id})`);
        await contactDb.delete(id);
      }
    } catch (error) {
      console.error(`Error in deleteContact ${id}, marking locally:`, error);
      // If any error, try to mark locally
      await contactDb.delete(id);
    }
  }
}; 