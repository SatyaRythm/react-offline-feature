# Rhythm Mobile - Salesforce Mobile App

A React-based mobile application for Salesforce users to manage accounts and contacts on the go. The application is designed to be responsive and work on mobile devices, providing essential Salesforce functionality for field sales and service teams.

## Features

- **Account Management:**
  - View list of accounts
  - Create new accounts
  - View account details
  - Edit account information
  - Delete accounts

- **Contact Management:**
  - View list of contacts
  - Create new contacts
  - View contact details
  - Edit contact information
  - Delete contacts
  - Associate contacts with accounts

## Technology Stack

- **Frontend:**
  - React
  - TypeScript
  - Material UI
  - React Router
  - Formik & Yup (form handling and validation)
  - Axios (API requests)

- **Backend:**
  - Node.js
  - Express
  - File-based JSON storage (for demo purposes)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd rhythm-mobile
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm run dev
   ```
   This will start the React development server on port 3000.

4. In a separate terminal, start the backend server
   ```
   node server.js
   ```
   This will start the backend API server on port 3001.

5. Open your browser and navigate to `http://localhost:3000`

## Deployment to Heroku

### Prerequisites

- Heroku CLI installed
- Heroku account

### Deployment Steps

1. Create a new Heroku app
   ```
   heroku create rhythm-mobile-app
   ```

2. Push to Heroku
   ```
   git push heroku main
   ```

3. Open the app
   ```
   heroku open
   ```

## Project Structure

- `/src` - React application source code
  - `/components` - Reusable React components
  - `/pages` - Page components
    - `/Accounts` - Account-related pages
    - `/Contacts` - Contact-related pages
  - `/services` - API service modules
  - `/types` - TypeScript type definitions

- `/server.js` - Express backend server
- `/data` - Directory for JSON data storage (created on first run)

## Environment Variables

- `PORT` - Port for the server (default: 3001)
- `REACT_APP_API_URL` - API URL for development (default: http://localhost:3001/api)

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Salesforce](https://www.salesforce.com/) for inspiration
- [Material UI](https://mui.com/) for the component library
- [Create React App](https://create-react-app.dev/) for bootstrapping the project
