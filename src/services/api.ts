import axios from 'axios';
import { Account, Contact } from '../types';
import { log } from 'console';

// Configure base API URL based on environment
const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Account APIs
export const accountApi = {
  // Get all accounts
  getAccounts: async () => {
    try {
      console.log('Fetching accounts from server');
      const response = await api.get('/accounts');
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  // Get account by ID
  getAccount: async (id: string) => {
    try {
      const response = await api.get(`/accounts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching account ${id}:`, error);
      throw error;
    }
  },

  // Create new account
  createAccount: async (accountData: Account) => {
    try {
      console.log('Creating account on server');
      
      const response = await api.post('/accounts', accountData);
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  // Update existing account
  updateAccount: async (id: string, accountData: Partial<Account>) => {
    try {
      const response = await api.put(`/accounts/${id}`, accountData);
      return response.data;
    } catch (error) {
      console.error(`Error updating account ${id}:`, error);
      throw error;
    }
  },

  // Delete account
  deleteAccount: async (id: string) => {
    try {
      const response = await api.delete(`/accounts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting account ${id}:`, error);
      throw error;
    }
  }
};

// Contact APIs
export const contactApi = {
  // Get all contacts
  getContacts: async () => {
    try {
      const response = await api.get('/contacts');
      return response.data;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  },

  // Get contacts for a specific account
  getContactsByAccount: async (accountId: string) => {
    try {
      const response = await api.get(`/accounts/${accountId}/contacts`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contacts for account ${accountId}:`, error);
      throw error;
    }
  },

  // Get contact by ID
  getContact: async (id: string) => {
    try {
      const response = await api.get(`/contacts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contact ${id}:`, error);
      throw error;
    }
  },

  // Create new contact
  createContact: async (contactData: Contact) => {
    try {
      const response = await api.post('/contacts', contactData);
      return response.data;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  },

  // Update existing contact
  updateContact: async (id: string, contactData: Partial<Contact>) => {
    try {
      const response = await api.put(`/contacts/${id}`, contactData);
      return response.data;
    } catch (error) {
      console.error(`Error updating contact ${id}:`, error);
      throw error;
    }
  },

  // Delete contact
  deleteContact: async (id: string) => {
    try {
      const response = await api.delete(`/contacts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting contact ${id}:`, error);
      throw error;
    }
  }
};

// Assessment APIs
export const assessmentApi = {
  // Get all assessments
  getAssessments: async () => {
    try {
      const response = await api.get('/assessments');
      return response.data;
    } catch (error) {
      console.error('Error fetching assessments:', error);
      throw error;
    }
  },

  // Get assessments for an account
  getAccountAssessments: async (accountId: string) => {
    try {
      const response = await api.get(`/accounts/${accountId}/assessments`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching assessments for account ${accountId}:`, error);
      throw error;
    }
  },

  // Get assessment by ID
  getAssessment: async (id: string) => {
    try {
      const response = await api.get(`/assessments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching assessment ${id}:`, error);
      throw error;
    }
  },

  // Create new assessment
  createAssessment: async (assessmentData: any) => {
    try {
      const response = await api.post('/assessments', assessmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw error;
    }
  },

  // Update existing assessment
  updateAssessment: async (id: string, assessmentData: any) => {
    try {
      const response = await api.put(`/assessments/${id}`, assessmentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating assessment ${id}:`, error);
      throw error;
    }
  },

  // Delete assessment
  deleteAssessment: async (id: string) => {
    try {
      const response = await api.delete(`/assessments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting assessment ${id}:`, error);
      throw error;
    }
  }
};

// Template APIs
export const templateApi = {
  // Get all templates
  getTemplates: async () => {
    try {
      const response = await api.get('/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  // Get template by ID
  getTemplate: async (id: string) => {
    try {
      const response = await api.get(`/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching template ${id}:`, error);
      throw error;
    }
  }
};

// Assessment Response APIs
export const responseApi = {
  // Get all responses
  getResponses: async () => {
    try {
      const response = await api.get('/responses');
      return response.data;
    } catch (error) {
      console.error('Error fetching responses:', error);
      throw error;
    }
  },

  // Get response by ID
  getResponse: async (id: string) => {
    try {
      const response = await api.get(`/responses/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching response ${id}:`, error);
      throw error;
    }
  },

  // Create new response
  createResponse: async (responseData: any) => {
    try {
      const response = await api.post('/responses', responseData);
      return response.data;
    } catch (error) {
      console.error('Error creating response:', error);
      throw error;
    }
  },

  // Update existing response
  updateResponse: async (id: string, responseData: any) => {
    try {
      const response = await api.put(`/responses/${id}`, responseData);
      return response.data;
    } catch (error) {
      console.error(`Error updating response ${id}:`, error);
      throw error;
    }
  },

  // Submit response
  submitResponse: async (id: string) => {
    try {
      const response = await api.post(`/responses/${id}/submit`);
      return response.data;
    } catch (error) {
      console.error(`Error submitting response ${id}:`, error);
      throw error;
    }
  },

  // Save question response
  saveQuestionResponse: async (responseId: string, questionData: any) => {
    try {
      const response = await api.post(`/responses/${responseId}/questions`, questionData);
      return response.data;
    } catch (error) {
      console.error(`Error saving question response:`, error);
      throw error;
    }
  }
}; 