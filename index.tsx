
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

declare global {
    interface Window {
        scrollToQuery: () => void;
        loadDemoQuery: (element: HTMLElement) => void;
        executeQuery: () => void;
        toggleVoiceInput: () => void;
    }
}

const apiKey = import.meta.env.VITE_API_KEY;
if (!apiKey) {
  // A simple error message for the user, in case the API key is not set.
  const queryResult = document.getElementById('queryResult');
  const queryAnalysis = document.getElementById('queryAnalysis');
  if(queryResult && queryAnalysis) {
    queryResult.classList.remove('hidden');
    queryAnalysis.innerHTML = `<p style="color: var(--danger);"><strong>Configuration Error:</strong> VITE_API_KEY is not set. Please create a .env file and add your API key.</p>`;
  }
  throw new Error("VITE_API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey });


// --- Main Application Logic ---

/**
 * Toggles the 'active' class on a database chip and updates its ARIA attribute.
 * @param {HTMLElement} chip The database chip element.
 */
function toggleDbChip(chip: HTMLElement) {
    chip.classList.toggle('active');
    const isActive = chip.classList.contains('active');
    chip.setAttribute('aria-checked', String(isActive));
}

/**
 * Sets up event listeners for database selection chips.
 */
document.querySelectorAll('.db-chip').forEach(chip => {
    chip.addEventListener('click', () => toggleDbChip(chip as HTMLElement));
    chip.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggleDbChip(chip as HTMLElement);
        }
    });
});

/**
 * Smoothly scrolls the page to the query interface section.
 */
function scrollToQuery() {
    document.getElementById('query-interface')?.scrollIntoView({
        behavior: 'smooth'
    });
}
window.scrollToQuery = scrollToQuery;

/**
 * Loads a demo query into the input box and executes it.
 * @param {HTMLElement} element The demo query element that was clicked.
 */
function loadDemoQuery(element: HTMLElement) {
    const query = element.querySelector('p')?.textContent?.replace(/"/g, '') || '';
    const queryInput = document.getElementById('queryInput') as HTMLTextAreaElement;
    if (queryInput) {
        queryInput.value = query;
    }
    scrollToQuery();
    setTimeout(() => {
        executeQuery();
    }, 500);
}
window.loadDemoQuery = loadDemoQuery;

/**
 * Executes the natural language query using the Gemini API.
 */
async function executeQuery() {
    const queryInputEl = document.getElementById('queryInput') as HTMLTextAreaElement;
    const queryInput = queryInputEl?.value;
    if (!queryInput || !queryInput.trim()) {
        alert('Please enter a query');
        return;
    }

    const selectedDbs = Array.from(document.querySelectorAll('.db-chip.active'))
        .map(chip => (chip as HTMLElement).dataset.db);

    if (selectedDbs.length === 0) {
        alert('Please select at least one database.');
        return;
    }

    const button = document.querySelector('.query-controls .cta-button') as HTMLButtonElement;
    const buttonText = document.getElementById('queryButtonText');
    const loading = document.getElementById('queryLoading');
    const resultContainer = document.getElementById('queryResult');

    // Show loading state
    buttonText?.classList.add('hidden');
    loading?.classList.remove('hidden');
    if (button) button.disabled = true;
    resultContainer?.classList.add('hidden');

    try {
        const prompt = `
You are a world-class database engineer and data analyst. Your task is to convert a natural language query into an optimized, secure, and dialect-specific query for the given databases.

**Natural Language Query:**
"${queryInput}"

**Target Databases:**
${selectedDbs.join(', ')}

**Instructions:**
1.  **Analyze the Query:** Understand the user's intent, including entities, relationships, and constraints.
2.  **Select Best Query Language:** If 'mongodb' is the only selected database or the query implies document-based data (e.g., user profiles, activity logs), generate a MongoDB Aggregation Pipeline query as a JSON string. Otherwise, generate SQL. If multiple SQL databases are selected, generate a standard, compatible SQL. If a mix of SQL and MongoDB is selected, generate a federated query comment block explaining how the two would interact, followed by the primary SQL query.
3.  **Generate the Query:** Write the query. Ensure it is optimized, secure (prevent SQL injection), and readable.
4.  **Provide Analysis & Explanation:** Briefly explain the generated query, the logic behind it, and any optimizations applied.
5.  **Return JSON:** Respond ONLY with a valid JSON object matching the provided schema. Do not include any markdown formatting like \`\`\`json.
`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                queryComplexity: { type: Type.STRING, description: "A tier rating for the query's complexity (e.g., 'Tier 1')." },
                estimatedExecutionTime: { type: Type.STRING, description: "A rough estimate of execution time (e.g., '1.5s')." },
                targetDatabases: { type: Type.STRING, description: "The database targets for the query." },
                confidenceScore: { type: Type.NUMBER, description: "A confidence score (0.0 to 1.0) for the generated query's accuracy." },
                generatedSQL: { type: Type.STRING, description: "The generated SQL or MongoDB query string." },
                queryReasoning: { type: Type.STRING, description: "A brief explanation of how the natural language query was interpreted and translated." },
                optimizationApplied: { type: Type.STRING, description: "A summary of optimizations applied to the query." }
            },
            required: ["queryComplexity", "estimatedExecutionTime", "targetDatabases", "confidenceScore", "generatedSQL", "queryReasoning", "optimizationApplied"]
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        // Make container visible immediately after API call
        resultContainer?.classList.remove('hidden');

        const resultData = JSON.parse(response.text);
        displayQueryResult(resultData);

    } catch (error) {
        console.error("Error executing query with Gemini API:", error);
        const analysis = document.getElementById('queryAnalysis');
        
        // Ensure container is visible before showing the error
        resultContainer?.classList.remove('hidden');

        if (analysis) {
             analysis.innerHTML = `<p style="color: var(--danger); grid-column: 1 / -1;">An error occurred. Please check the console for details. <br> ${error instanceof Error ? error.message : String(error)}</p>`;
        }
        displayQueryResult({}); // Clear the rest of the fields
    } finally {
        // Hide loading state
        buttonText?.classList.remove('hidden');
        loading?.classList.add('hidden');
        if (button) button.disabled = false;
    }
}
window.executeQuery = executeQuery;

/**
 * Formats and applies syntax highlighting to a SQL or MongoDB query string.
 * @param {string} code The raw query string.
 * @returns {string} The HTML string with syntax highlighting.
 */
function highlightCode(code: string): string {
    let formattedCode = code.trim();
    const isMongo = formattedCode.startsWith('[') || formattedCode.startsWith('{');

    if (isMongo) {
        try {
            // Pretty-print for readability
            formattedCode = JSON.stringify(JSON.parse(formattedCode), null, 2);
        } catch (e) {
            // It might not be valid JSON, but we can still try to highlight it.
        }
    }

    // Escape HTML special characters
    formattedCode = formattedCode
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Generic highlighting rules that work for both SQL and Mongo-like syntax
    // The order of these replacements is important to avoid conflicts.
    
    // 1. Comments (SQL-style)
    formattedCode = formattedCode.replace(/(--[^\n]*)/g, '<span class="token-comment">$1</span>');

    // 2. Strings (single and double quoted)
    formattedCode = formattedCode.replace(/('[^']*')/g, '<span class="token-string">$1</span>');
    formattedCode = formattedCode.replace(/("[^"]*")/g, '<span class="token-string">$1</span>');

    // 3. Keywords/Operators (SQL and Mongo) - case-insensitive for SQL
    const keywords = '\\b(SELECT|FROM|WHERE|LEFT|RIGHT|INNER|JOIN|ON|GROUP BY|ORDER BY|HAVING|LIMIT|AS|DISTINCT|CASE|WHEN|THEN|ELSE|END|WITH|AND|OR|NOT|IN|NOW|INTERVAL|DATE_TRUNC|AVG|SUM|COUNT|MAX|MIN|RANK|OVER|PARTITION BY|ROWS|PRECEDING|DATE_SUB|ISODate)\\b';
    formattedCode = formattedCode.replace(new RegExp(keywords, 'gi'), '<span class="token-keyword">$&</span>');
    
    // For mongo operators like "$match", the quotes are already part of the string token. We need to re-wrap them.
    const mongoOperators = /<span class="token-string">"(\$(?:match|group|project|addFields|lookup|sort|limit|unwind|cond|eq|ne|gt|gte|lt|lte|in|sum|avg|max|min|dateToString|size|subtract|divide|literal|push|ne|and|or|in))"<\/span>/g;
    formattedCode = formattedCode.replace(mongoOperators, '<span class="token-keyword">"$1"</span>');

    // 4. Numbers
    formattedCode = formattedCode.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="token-number">$1</span>');
    
    // 5. Booleans and null
    formattedCode = formattedCode.replace(/\b(true|false|null)\b/g, '<span class="token-boolean">$1</span>');

    return formattedCode;
}

/**
 * Displays the query result from the Gemini API in the UI.
 * @param {object} data The parsed JSON data from the API response.
 */
function displayQueryResult(data: any) {
    // Target specific elements for each piece of data
    const confidenceEl = document.getElementById('confidenceValue');
    const complexityEl = document.getElementById('complexityValue');
    const timeEl = document.getElementById('timeValue');
    const targetsEl = document.getElementById('targetsValue');
    const sqlCodeEl = document.getElementById('generatedSQL');
    const reasoningEl = document.getElementById('reasoningText');
    const optimizationEl = document.getElementById('optimizationText');

    if (!confidenceEl || !complexityEl || !timeEl || !targetsEl || !sqlCodeEl || !reasoningEl || !optimizationEl) {
        console.error("One or more result elements not found in the DOM.");
        return;
    }
    
    // Use fallbacks to prevent errors from incomplete API responses
    const confidence = data.confidenceScore ? `${(data.confidenceScore * 100).toFixed(0)}%` : 'N/A';
    const complexity = data.queryComplexity || 'N/A';
    const time = data.estimatedExecutionTime || 'N/A';
    const targets = data.targetDatabases || 'N/A';
    const reasoning = data.queryReasoning || 'No reasoning provided.';
    const optimization = data.optimizationApplied ? `<strong>Optimization Applied:</strong> ${data.optimizationApplied}` : '';
    const sqlQuery = data.generatedSQL || '-- No query generated --';

    confidenceEl.textContent = confidence;
    complexityEl.textContent = complexity;
    timeEl.textContent = time;
    targetsEl.textContent = targets;
    reasoningEl.textContent = reasoning;
    optimizationEl.innerHTML = optimization;
    
    sqlCodeEl.innerHTML = highlightCode(sqlQuery);
}

// --- UI Enhancements and Event Listeners ---

// Add enter key support for query input
document.getElementById('queryInput')?.addEventListener('keydown', function(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        executeQuery();
    }
});

// Add smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e: Event) {
        e.preventDefault();
        const href = this.getAttribute('href');
        if (href) {
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e: KeyboardEvent) {
    const queryInput = document.getElementById('queryInput') as HTMLTextAreaElement;
    // Ctrl/Cmd + K to focus query input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        queryInput?.focus();
    }

    // Escape to clear query input
    if (e.key === 'Escape') {
        if (queryInput) {
            queryInput.value = '';
            queryInput.focus();
        }
        document.getElementById('queryResult')?.classList.add('hidden');
    }
});

/**
 * Validates the query input in real-time for potentially harmful keywords.
 */
function validateQueryInput() {
    const queryInput = document.getElementById('queryInput') as HTMLTextAreaElement;
    if (queryInput) {
        const query = queryInput.value.toLowerCase();
        // A simple client-side check for read-only keywords. Real security is handled by the model prompt and backend.
        const isReadOnly = !['delete', 'drop', 'truncate', 'update', 'insert'].some(keyword => query.includes(keyword));
        if (!isReadOnly) {
            queryInput.style.borderColor = 'var(--warning)';
            queryInput.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
        } else {
            queryInput.style.borderColor = 'var(--border)';
            queryInput.style.boxShadow = 'none';
        }
    }
}

// Initialize the application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Enterprise Multi-Database Natural Language Query Engine Initialized');
    document.getElementById('queryInput')?.addEventListener('input', validateQueryInput);

    // --- Copy to Clipboard Logic ---
    const copyButton = document.getElementById('copyButton') as HTMLButtonElement;
    const copyText = document.getElementById('copyText');
    const copyIcon = document.getElementById('copyIcon');
    
    if (copyButton && copyText && copyIcon) {
        const originalIconHTML = copyIcon.innerHTML;

        copyButton.addEventListener('click', () => {
            const sqlCodeEl = document.getElementById('generatedSQL');
            if (!sqlCodeEl) return;

            const codeToCopy = sqlCodeEl.textContent || '';
            navigator.clipboard.writeText(codeToCopy).then(() => {
                copyText.textContent = 'Copied!';
                copyIcon.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/>
                    </svg>
                `;
                copyButton.style.color = 'var(--success)';
                
                setTimeout(() => {
                    copyText.textContent = 'Copy';
                    copyIcon.innerHTML = originalIconHTML;
                    copyButton.style.color = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                copyText.textContent = 'Failed';
                setTimeout(() => {
                    copyText.textContent = 'Copy';
                }, 2000);
            });
        });
    }
});
