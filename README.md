# Quill - PostgreSQL Database Administration Tool

A modern, web-based PostgreSQL database administration tool. Browse tables, edit records, run queries, and manage your database with an intuitive interface. Secure, fast, and easy to use.

Built with [Next.js](https://nextjs.org), React, and TypeScript. Uses a client-server architecture where the browser UI communicates with Next.js API routes that proxy connections to PostgreSQL.

<div align="center">

### 🌐 [Live Demo](http://quill.thareekanvar.com/) - Try it now!

<a href="http://quill.thareekanvar.com/" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/🌐_Live_Demo-FF6B6B?style=for-the-badge&logo=netlify" alt="Live Demo" />
</a>

</div>

<div align="center">
  <img src="public/dashboard.png" alt="Quill Dashboard" />
</div>

## ✨ Features

### Core Functionality

- **Database Management** - Connect to multiple PostgreSQL databases with encrypted local credential storage
- **Table Browser** - Explore tables, schemas, columns, indexes, and foreign keys
- **Data Operations** - Create, read, update, and delete records with password-protected mutations
- **SQL Console** - Execute custom SQL queries with syntax highlighting, query history, and transaction support
- **Schema Management** - View and manage database schemas, create tables, and modify structure
- **AI Assistant** - Chat with AI to generate SQL queries, explore data, and understand your database schema using natural language

### Advanced Features

- **Advanced Filtering** - Multi-type filters (text, number, date, boolean, foreign keys) with complex query building
- **Custom Dashboards** - Create dashboard cards and charts from database data or custom SQL queries
- **Data Visualization** - Build interactive charts (line, bar, area) with date range filtering and trend indicators
- **Global Search** - Search across all tables and data in your database
- **Multi-language Support** - English, French, and German translations
- **Dark/Light Theme** - Toggle between themes
- **Customizable Sidebar** - Organize tables with custom icons, names, and drag-and-drop ordering

## 🚀 Getting Started

### Deploy

Deploy this project to your favorite platform with one click:

<div align="center">

<a href="https://vercel.com/new/clone?repository-url=https://github.com/thareekanvar/quill" target="_blank" rel="noopener noreferrer">
  <img src="https://vercel.com/button" alt="Deploy with Vercel" />
</a>
<a href="https://app.netlify.com/start/deploy?repository=https://github.com/thareekanvar/quill" target="_blank" rel="noopener noreferrer">
  <img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" />
</a>

</div>

**Note:** 
- **Netlify**: Configuration is handled automatically via `netlify.toml`. Make sure to set your environment variables in the Netlify dashboard.

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm (recommended)
- Google AI API key (for AI chat feature) - Get one from [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/thareekanvar/quill.git
   cd postadmin
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   Create a `.env.local` file in the root directory:
   ```bash
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here
   ```
   
   **Note:** The AI chat feature requires a Google AI API key. You can get one from [Google AI Studio](https://aistudio.google.com/apikey).

4. Run the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) and connect to your PostgreSQL database.

## 🏗️ Architecture

Quill uses a **client-server architecture**:

- **Client-side (Browser)**: 
  - React UI and user interactions
  - Encrypted credential storage in IndexedDB (AES encryption)
  - Local state management and caching

- **Server-side (Next.js API Routes)**:
  - Acts as a proxy between the browser and PostgreSQL
  - Executes database queries using the `pg` library
  - Handles connection pooling and query execution

**Important**: Browsers cannot directly connect to PostgreSQL databases due to protocol and security limitations. The application requires a server component to proxy database connections. Connection strings are sent to the server over HTTPS when executing queries.

## 📖 Usage

- **Connect**: Enter your PostgreSQL connection string on the login page
- **Browse**: Select tables from the sidebar to view and edit data
- **Filter & Sort**: Use the filter panel and column headers to query data
- **Query**: Execute custom SQL queries in the SQL console
- **Dashboard**: Create custom cards and charts to visualize your data
- **Schema**: Manage database structure through the schema management interface

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **State**: Zustand, TanStack Query
- **Database**: PostgreSQL (via `pg`)
- **Other**: CryptoJS (encryption), Recharts (visualization), dnd-kit (drag & drop)

## 📁 Project Structure

```text
postadmin/
├── app/              # Next.js app directory (routes & API)
├── components/       # React components
│   ├── auth/        # Authentication
│   ├── dashboard/    # Dashboard components
│   └── ui/          # UI components (shadcn/ui)
├── hooks/           # Custom React hooks
├── lib/             # Utilities
│   ├── db/         # IndexedDB & encryption
│   ├── helpers/    # Helper functions
│   ├── postgres/   # PostgreSQL client
│   ├── stores/     # Zustand stores
│   └── translations/ # i18n
└── types/           # TypeScript definitions
```

## 🔒 Security

### Credential Storage
- Database credentials are **encrypted with AES-256** and stored locally in your browser's IndexedDB
- Encryption uses PBKDF2 key derivation (10,000 iterations) for enhanced security
- Credentials are encrypted using a user-provided password before storage

### Data Transmission
- Connection strings are sent to the server over **HTTPS** when executing queries
- The server acts as a proxy and does not log connection strings
- All API requests use HTTPS encryption in transit

### Security Best Practices
- **Use HTTPS in production** - Never deploy without SSL/TLS encryption
- **Self-host for sensitive databases** - For maximum security, deploy on your own infrastructure
- **Review server logs** - Ensure your deployment doesn't log connection strings
- All mutation operations require password confirmation
- Never commit database credentials to version control

### Security Considerations
⚠️ **Important**: While credentials are encrypted for local storage, they are decrypted and sent to the server when executing database operations. This is necessary because:
- Browsers cannot directly connect to PostgreSQL (protocol limitations)
- The server component is required to proxy database connections
- Connection strings are transmitted over HTTPS but are visible to the server

For production deployments with sensitive data, consider:
- Self-hosting on your own infrastructure
- Using a reverse proxy with additional security layers
- Implementing network-level restrictions
- Regular security audits of your deployment

## 📄 License

This project is licensed under a **Non-Commercial Open Source License**.

- ✅ **Free to use** - Use for any non-commercial purpose
- ✅ **Free to modify** - Modify the code to suit your needs
- ❌ **Cannot sell** - Cannot be sold or used in commercial products without permission
- 🔄 **Contribute changes** - Submit Pull Requests for modifications
- 📝 **Keep it open** - Distribution must include source code and license

For commercial licensing inquiries, please contact the project maintainers.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch
3. Make your changes and test thoroughly
4. Submit a Pull Request with a clear description

By contributing, you agree that your contributions will be licensed under the same Non-Commercial Open Source License.
