const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON request body
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Database files
const ACCOUNTS_FILE = path.join(__dirname, 'data/accounts.json');
const CONTACTS_FILE = path.join(__dirname, 'data/contacts.json');
const TEMPLATES_FILE = path.join(__dirname, 'data/templates.json');
const ASSESSMENTS_FILE = path.join(__dirname, 'data/assessments.json');
const RESPONSES_FILE = path.join(__dirname, 'data/responses.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
};

// Initialize empty database files if they don't exist
const initDatabase = async () => {
  await ensureDataDir();

  try {
    await fs.access(ACCOUNTS_FILE);
  } catch (err) {
    // File doesn't exist, create it
    await fs.writeFile(ACCOUNTS_FILE, JSON.stringify([], 'utf8'));
  }

  try {
    await fs.access(CONTACTS_FILE);
  } catch (err) {
    // File doesn't exist, create it
    await fs.writeFile(CONTACTS_FILE, JSON.stringify([], 'utf8'));
  }
  
  try {
    await fs.access(TEMPLATES_FILE);
  } catch (err) {
    // File doesn't exist, create it
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify([], 'utf8'));
  }
  
  try {
    await fs.access(ASSESSMENTS_FILE);
  } catch (err) {
    // File doesn't exist, create it
    await fs.writeFile(ASSESSMENTS_FILE, JSON.stringify([], 'utf8'));
  }
  
  try {
    await fs.access(RESPONSES_FILE);
  } catch (err) {
    // File doesn't exist, create it
    await fs.writeFile(RESPONSES_FILE, JSON.stringify([], 'utf8'));
  }
};

// Helper functions to read and write data
const readData = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading from ${filePath}:`, err);
    return [];
  }
};

const writeData = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
    throw err;
  }
};

// API Routes

// Get all accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await readData(ACCOUNTS_FILE);
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get account by ID
app.get('/api/accounts/:id', async (req, res) => {
  try {
    const accounts = await readData(ACCOUNTS_FILE);
    const account = accounts.find(a => a.id === req.params.id);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// Create account
app.post('/api/accounts', async (req, res) => {
  try {
    const accounts = await readData(ACCOUNTS_FILE);
    const newAccount = {
      ...req.body,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    accounts.push(newAccount);
    await writeData(ACCOUNTS_FILE, accounts);
    
    res.status(201).json(newAccount);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Update account
app.put('/api/accounts/:id', async (req, res) => {
  try {
    const accounts = await readData(ACCOUNTS_FILE);
    const index = accounts.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const updatedAccount = {
      ...accounts[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    accounts[index] = updatedAccount;
    await writeData(ACCOUNTS_FILE, accounts);
    
    res.json(updatedAccount);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Delete account
app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const accounts = await readData(ACCOUNTS_FILE);
    const filteredAccounts = accounts.filter(a => a.id !== req.params.id);
    
    if (filteredAccounts.length === accounts.length) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    await writeData(ACCOUNTS_FILE, filteredAccounts);
    
    // Also delete all contacts associated with this account
    const contacts = await readData(CONTACTS_FILE);
    const updatedContacts = contacts.filter(c => c.AccountId !== req.params.id);
    await writeData(CONTACTS_FILE, updatedContacts);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Get all contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await readData(CONTACTS_FILE);
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get contacts for a specific account
app.get('/api/accounts/:accountId/contacts', async (req, res) => {
  try {
    const contacts = await readData(CONTACTS_FILE);
    const accountContacts = contacts.filter(c => c.AccountId === req.params.accountId);
    res.json(accountContacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts for account' });
  }
});

// Get contact by ID
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const contacts = await readData(CONTACTS_FILE);
    const contact = contacts.find(c => c.id === req.params.id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Create contact
app.post('/api/contacts', async (req, res) => {
  try {
    const contacts = await readData(CONTACTS_FILE);
    const newContact = {
      ...req.body,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    contacts.push(newContact);
    await writeData(CONTACTS_FILE, contacts);
    
    res.status(201).json(newContact);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update contact
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const contacts = await readData(CONTACTS_FILE);
    const index = contacts.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    const updatedContact = {
      ...contacts[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    contacts[index] = updatedContact;
    await writeData(CONTACTS_FILE, contacts);
    
    res.json(updatedContact);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete contact
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const contacts = await readData(CONTACTS_FILE);
    const filteredContacts = contacts.filter(c => c.id !== req.params.id);
    
    if (filteredContacts.length === contacts.length) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    await writeData(CONTACTS_FILE, filteredContacts);
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// TEMPLATES API

// Get all templates
app.get('/api/templates', async (req, res) => {
  try {
    const templates = await readData(TEMPLATES_FILE);
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get template by ID
app.get('/api/templates/:id', async (req, res) => {
  try {
    const templates = await readData(TEMPLATES_FILE);
    const template = templates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create template
app.post('/api/templates', async (req, res) => {
  try {
    const templates = await readData(TEMPLATES_FILE);
    const newTemplate = {
      ...req.body,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    templates.push(newTemplate);
    await writeData(TEMPLATES_FILE, templates);
    
    res.status(201).json(newTemplate);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// ASSESSMENTS API

// Get all assessments
app.get('/api/assessments', async (req, res) => {
  try {
    const assessments = await readData(ASSESSMENTS_FILE);
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// Get assessments for an account
app.get('/api/accounts/:accountId/assessments', async (req, res) => {
  try {
    const assessments = await readData(ASSESSMENTS_FILE);
    const accountAssessments = assessments.filter(a => a.accountId === req.params.accountId);
    res.json(accountAssessments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assessments for account' });
  }
});

// Get assessment by ID
app.get('/api/assessments/:id', async (req, res) => {
  try {
    const assessments = await readData(ASSESSMENTS_FILE);
    const assessment = assessments.find(a => a.id === req.params.id);
    
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// Create assessment
app.post('/api/assessments', async (req, res) => {
  try {
    const assessments = await readData(ASSESSMENTS_FILE);
    const newAssessment = {
      ...req.body,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    assessments.push(newAssessment);
    await writeData(ASSESSMENTS_FILE, assessments);
    
    res.status(201).json(newAssessment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// Update assessment
app.put('/api/assessments/:id', async (req, res) => {
  try {
    const assessments = await readData(ASSESSMENTS_FILE);
    const index = assessments.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    const updatedAssessment = {
      ...assessments[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    assessments[index] = updatedAssessment;
    await writeData(ASSESSMENTS_FILE, assessments);
    
    res.json(updatedAssessment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

// Delete assessment
app.delete('/api/assessments/:id', async (req, res) => {
  try {
    const assessments = await readData(ASSESSMENTS_FILE);
    const filteredAssessments = assessments.filter(a => a.id !== req.params.id);
    
    if (filteredAssessments.length === assessments.length) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    await writeData(ASSESSMENTS_FILE, filteredAssessments);
    
    // Also delete all responses associated with this assessment
    const responses = await readData(RESPONSES_FILE);
    const updatedResponses = responses.filter(r => r.assessmentId !== req.params.id);
    await writeData(RESPONSES_FILE, updatedResponses);
    
    res.json({ message: 'Assessment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// RESPONSES API

// Get all responses
app.get('/api/responses', async (req, res) => {
  try {
    const responses = await readData(RESPONSES_FILE);
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Get response by ID
app.get('/api/responses/:id', async (req, res) => {
  try {
    const responses = await readData(RESPONSES_FILE);
    const response = responses.find(r => r.id === req.params.id);
    
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch response' });
  }
});

// Create response
app.post('/api/responses', async (req, res) => {
  try {
    const responses = await readData(RESPONSES_FILE);
    const newResponse = {
      ...req.body,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: req.body.responses || [],
      timeline: [
        {
          id: uuidv4(),
          date: new Date().toISOString(),
          status: 'Not Started',
          message: 'Assessment response created'
        }
      ]
    };
    
    responses.push(newResponse);
    await writeData(RESPONSES_FILE, responses);
    
    res.status(201).json(newResponse);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create response' });
  }
});

// Update response
app.put('/api/responses/:id', async (req, res) => {
  try {
    const responses = await readData(RESPONSES_FILE);
    const index = responses.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    const updatedResponse = {
      ...responses[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    responses[index] = updatedResponse;
    await writeData(RESPONSES_FILE, responses);
    
    res.json(updatedResponse);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update response' });
  }
});

// Save question response
app.post('/api/responses/:id/questions', async (req, res) => {
  try {
    const responses = await readData(RESPONSES_FILE);
    const index = responses.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    const response = responses[index];
    const questionResponse = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Find if the question response already exists
    const existingIndex = response.responses.findIndex(
      r => r.questionId === req.body.questionId && r.sectionId === req.body.sectionId
    );
    
    if (existingIndex !== -1) {
      // Update existing response
      response.responses[existingIndex] = questionResponse;
    } else {
      // Add new response
      response.responses.push(questionResponse);
    }
    
    // Update status if needed
    if (response.status === 'Not Started') {
      response.status = 'In Progress';
      response.timeline.push({
        id: uuidv4(),
        date: new Date().toISOString(),
        status: 'In Progress',
        message: 'Started filling the assessment'
      });
    }
    
    response.updatedAt = new Date().toISOString();
    
    await writeData(RESPONSES_FILE, responses);
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save question response' });
  }
});

// Submit response
app.post('/api/responses/:id/submit', async (req, res) => {
  try {
    const responses = await readData(RESPONSES_FILE);
    const index = responses.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    const response = responses[index];
    response.status = 'Submitted';
    response.submittedAt = new Date().toISOString();
    response.updatedAt = new Date().toISOString();
    
    response.timeline.push({
      id: uuidv4(),
      date: new Date().toISOString(),
      status: 'Submitted',
      message: 'Assessment submitted'
    });
    
    await writeData(RESPONSES_FILE, responses);
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// For any request that doesn't match one above, serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Initialize database and start the server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
}); 