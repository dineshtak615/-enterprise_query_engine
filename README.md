# Enterprise Multi-Database Natural Language Query Engine

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2.0-purple)](https://vitejs.dev/)

A production-grade, multi-database natural language query engine that transforms complex business questions into optimized, secure SQL and MongoDB queries. Built with the Google Gemini API, this application provides real-time schema adaptation, enterprise-grade security, and a seamless user experience.

![Application Screenshot](https://storage.googleapis.com/project-screenshots/query-engine-screenshot.png) <!-- Placeholder for a real screenshot -->

## ✨ Key Features

-   **Advanced Natural Language Processing**: Utilizes the Gemini API for multi-intent query parsing, temporal reasoning, business context awareness, and ambiguity resolution.
-   **Multi-Database Federation**: Seamlessly generates queries across PostgreSQL, MySQL, SQLite, and MongoDB with dialect-specific optimizations.
-   **Real-time Schema Evolution**: Designed to adapt to schema changes, relationship mapping, and version management.
-   **Enterprise-Grade Security**: The model is prompted to generate secure queries, preventing common vulnerabilities like SQL injection. Includes client-side warnings for destructive keywords.
-   **High Performance**: The underlying model generates optimized queries by considering indexing, join strategies, and efficient filtering.
-   **Rich User Interface**: Features a modern, responsive UI with syntax highlighting, copy-to-clipboard functionality, and real-time query analysis.

## 🚀 Technology Stack

-   **Frontend**: HTML5, CSS3, TypeScript
-   **AI/Language Model**: Google Gemini API (`@google/genai`)
-   **Build Tool**: Vite
-   **Package Manager**: npm

## 🛠️ Local Development Setup

Follow these steps to set up and run the project on your local machine.

### Prerequisites

-   [Node.js](https://nodejs.org/) (version 18.x or later)
-   npm (included with Node.js)
-   A valid Google Gemini API Key

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/query-engine.git
cd query-engine
```

### 2. Install Dependencies

Install the necessary project dependencies using npm.

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of the project. This file will store your API key and is ignored by Git for security.

```bash
touch .env
```

Open the `.env` file and add your Google Gemini API key:

```
# .env
API_KEY=YOUR_GEMINI_API_KEY_HERE
```
**Important**: The application uses `process.env.API_KEY` to access the key. Ensure your local environment is configured to load this variable. Standard web development servers may require additional configuration to expose environment variables to the client-side. For this project's Vite setup, you would typically use `import.meta.env.VITE_API_KEY`, but per project constraints, we are using `process.env`. Ensure your hosting environment properly injects this variable.

### 4. Run the Development Server

Start the Vite development server.

```bash
npm run dev
```

The application will now be running on `http://localhost:5173` (or the next available port).

##  usage

1.  **Open the Application**: Navigate to the local URL in your web browser.
2.  **Select Databases**: Click on the database chips (e.g., PostgreSQL, MongoDB) to select your target systems. At least one must be selected.
3.  **Enter a Query**: Type a natural language question into the input box. For example, "Show me all customers from California who placed orders over $1000".
4.  **Execute**: Click the "Execute Query" button or press `Ctrl + Enter`.
5.  **View Results**: The generated query, along with a detailed analysis and explanation, will appear below. You can use the "Copy" button to copy the query to your clipboard.

## 📄 License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.
