/**
 * Gemini Telemetry & Observability Utility - Codebase Level Hook
 * 
 * This module monkey-patches the global fetch API to automatically track, measure, 
 * and record Gemini LLM API usage metrics (token counts, prompt details, response latency, 
 * and estimated cost) inside your local project environment.
 * 
 * Traced statistics are saved to a local dashboard file: 'gemini-usage.json' in your workspace.
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'gemini-usage.json');

// Premium console color codes
const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const PRICING = {
  'gemini-2.0-flash': { input: 0.075 / 1000000, output: 0.30 / 1000000 },
  'gemini-1.5-flash': { input: 0.075 / 1000000, output: 0.30 / 1000000 },
  'gemini-1.5-pro': { input: 1.25 / 1000000, output: 5.00 / 1000000 },
  'gemini-1.0-pro': { input: 0.50 / 1000000, output: 1.50 / 1000000 },
  'default': { input: 0.075 / 1000000, output: 0.30 / 1000000 }
};

// Calculate cost based on model and token counts
function calculateCost(model, inputTokens, outputTokens) {
  const modelName = (model || '').toLowerCase();
  let pricing = PRICING.default;
  
  if (modelName.includes('gemini-2.0-flash')) pricing = PRICING['gemini-2.0-flash'];
  else if (modelName.includes('gemini-1.5-flash')) pricing = PRICING['gemini-1.5-flash'];
  else if (modelName.includes('gemini-1.5-pro')) pricing = PRICING['gemini-1.5-pro'];
  else if (modelName.includes('gemini-1.0-pro')) pricing = PRICING['gemini-1.0-pro'];
  
  const cost = (inputTokens * pricing.input) + (outputTokens * pricing.output);
  return cost;
}

// Persist the request log entry into the local gemini-usage.json file
function recordTelemetry(logEntry) {
  let store = {
    totalRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    successfulRequests: 0,
    avgLatencyMs: 0,
    requestLogs: []
  };

  try {
    if (fs.existsSync(LOG_FILE)) {
      const data = fs.readFileSync(LOG_FILE, 'utf8');
      store = { ...store, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error reading existing telemetry log file:', err.message);
  }

  // Accumulate statistics
  store.totalRequests += 1;
  if (logEntry.status === 200) {
    store.successfulRequests += 1;
  }
  store.totalInputTokens += logEntry.inputTokens;
  store.totalOutputTokens += logEntry.outputTokens;
  store.totalTokens += logEntry.totalTokens;
  store.totalCost += logEntry.cost;
  
  // Running average latency
  const currentTotalLatency = (store.avgLatencyMs * (store.totalRequests - 1)) + logEntry.latency;
  store.avgLatencyMs = Math.round(currentTotalLatency / store.totalRequests);

  // Prepend log entry
  store.requestLogs.unshift(logEntry);
  if (store.requestLogs.length > 50) {
    store.requestLogs.pop(); // Cap log history at 50
  }

  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing telemetry update to disk:', err.message);
  }

  return store;
}

/**
 * Activate the fetch telemetry interceptor monkey-patch
 */
function activateTelemetry() {
  if (globalThis.fetch && globalThis.fetch.isPatchedByTelemetry) {
    return; // Already active
  }

  const originalFetch = globalThis.fetch;

  const patchedFetch = async function(url, options = {}) {
    const urlStr = typeof url === 'string' ? url : (url.url || '');
    const isGeminiCall = urlStr.includes('generativelanguage.googleapis.com') || 
                         urlStr.includes('/v1beta/models') || 
                         urlStr.includes('/v1/models');

    if (!isGeminiCall) {
      return originalFetch.apply(this, arguments);
    }

    const startTime = Date.now();
    let promptText = '';
    let modelName = 'gemini-1.5-flash';

    // Parse request prompt payload
    try {
      if (options.body) {
        const bodyData = JSON.parse(options.body);
        
        // Match model
        const modelMatch = urlStr.match(/models\/([^:?\/]+)/);
        if (modelMatch && modelMatch[1]) {
          modelName = modelMatch[1];
        }

        if (bodyData.contents) {
          const parts = [];
          bodyData.contents.forEach(content => {
            if (content.parts) {
              content.parts.forEach(part => {
                if (part.text) parts.push(part.text);
              });
            }
          });
          promptText = parts.join('\n');
        }
      }
    } catch (e) {
      promptText = '[Could not parse request body]';
    }

    try {
      const response = await originalFetch.apply(this, arguments);
      const latency = Date.now() - startTime;
      
      const clonedResponse = response.clone();
      clonedResponse.json().then(data => {
        let inputTokens = 0;
        let outputTokens = 0;
        let completionText = '';

        if (data.usageMetadata) {
          inputTokens = data.usageMetadata.promptTokenCount || 0;
          outputTokens = data.usageMetadata.candidatesTokenCount || 0;
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const parts = [];
          data.candidates[0].content.parts.forEach(part => {
            if (part.text) parts.push(part.text);
          });
          completionText = parts.join('\n');
        }

        // Fallback estimation (1 token ~= 4 characters)
        if (inputTokens === 0 && promptText) {
          inputTokens = Math.max(1, Math.round(promptText.length / 4));
        }
        if (outputTokens === 0 && completionText) {
          outputTokens = Math.max(1, Math.round(completionText.length / 4));
        }

        const cost = calculateCost(modelName, inputTokens, outputTokens);
        const logEntry = {
          id: 'node_req_' + Date.now(),
          timestamp: new Date().toISOString(),
          model: modelName,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          cost,
          latency,
          status: response.status,
          prompt: promptText,
          completion: completionText,
          endpoint: urlStr
        };

        const store = recordTelemetry(logEntry);
        console.log(`\n${colors.green}⚡ [Gemini Traced] ${colors.bold}${modelName} call recorded!${colors.reset}`);
        console.log(`   Tokens: ${inputTokens} in / ${outputTokens} out (Total: ${inputTokens + outputTokens})`);
        console.log(`   Latency: ${latency}ms | Est. Cost: $${cost.toFixed(6)}`);
        console.log(`   Aggregated session total: ${store.totalTokens.toLocaleString()} tokens | Cost: $${store.totalCost.toFixed(5)}\n`);
      }).catch(err => {
        // Response wasn't JSON or failed to read
      });

      return response;
    } catch (err) {
      const latency = Date.now() - startTime;
      const logEntry = {
        id: 'node_req_' + Date.now(),
        timestamp: new Date().toISOString(),
        model: modelName,
        inputTokens: Math.max(1, Math.round(promptText.length / 4)),
        outputTokens: 0,
        totalTokens: Math.max(1, Math.round(promptText.length / 4)),
        cost: 0,
        latency,
        status: 500,
        prompt: promptText,
        completion: `Failed fetch execution: ${err.message}`,
        endpoint: urlStr
      };
      recordTelemetry(logEntry);
      throw err; // Propagate exception
    }
  };

  patchedFetch.isPatchedByTelemetry = true;
  globalThis.fetch = patchedFetch;
}

// Export module functions
module.exports = {
  activateTelemetry,
  calculateCost,
  recordTelemetry
};

// ============================================================================
// DEMONSTRATION RUNNER
// If run directly (e.g. node gemini-telemetry.cjs), it simulates Gemini API requests
// and prints a premium console usage dashboard.
// ============================================================================
if (require.main === module) {
  console.log(`${colors.cyan}${colors.bold}`);
  console.log('  ██████╗ ███████╗███╗   ███╗██╗███╗   ██╗██╗     ████████╗███████╗██╗     ███████╗');
  console.log('  ██╔════╝ ██╔════╝████╗ Maryland ████╗  ██║██║     ╚══██╔══╝██╔════╝██║     ██╔════╝');
  console.log('  ██║  ███╗█████╗  ██╔████╔██║██║██╔██╗ ██║██║        ██║   █████╗  ██║     █████╗  ');
  console.log('  ██║   ██║██╔══╝  ██║╚██╔╝██║██║██║╚██╗██║██║        ██║   ██╔══╝  ██║     ██╔══╝  ');
  console.log('  ╚██████╔╝███████╗██║ ╚═╝ ██║██║██║ ╚████║██║        ██║   ███████╗███████╗███████╗');
  console.log('   ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝        ╚═╝   ╚══════╝╚══════╝╚══════╝');
  console.log(`${colors.reset}`);
  console.log(`${colors.cyan}Gemini Codebase Telemetry — Local Verification Console${colors.reset}`);
  console.log('------------------------------------------------------------------------');
  
  // Mock global fetch to allow running simulated requests locally
  globalThis.fetch = function(url, options) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const body = JSON.parse(options.body);
        const prompt = body.contents[0].parts[0].text;
        
        // Mock Gemini response data structure
        const mockResponse = {
          candidates: [{
            content: {
              parts: [{ text: `Mock Gemini Response for prompt: "${prompt}". Your music academy website has beautiful UI styling and dynamic animations.` }]
            },
            finishReason: 'STOP'
          }],
          usageMetadata: {
            promptTokenCount: Math.round(prompt.length / 4) + 5,
            candidatesTokenCount: 38,
            totalTokenCount: Math.round(prompt.length / 4) + 43
          }
        };

        resolve({
          status: 200,
          clone: function() {
            return {
              json: () => Promise.resolve(mockResponse)
            };
          }
        });
      }, 350); // Simulate 350ms network delay
    });
  };

  // Activate interception
  activateTelemetry();
  console.log(`${colors.green}● Local Telemetry Fetch Monkey-patch activated!${colors.reset}`);
  console.log(`Writing logs to: ${colors.bold}${LOG_FILE}${colors.reset}\n`);

  // Simulate a model request
  async function runSimulations() {
    console.log(`${colors.yellow}[Sim] Sending prompt to gemini-2.0-flash...${colors.reset}`);
    await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{ parts: [{ text: "How can I integrate audio hooks to the web UI?" }] }]
      })
    });

    console.log(`${colors.yellow}[Sim] Sending prompt to gemini-1.5-pro...${colors.reset}`);
    await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Compose a short melodic structure for Carnatic Flute learners." }] }]
      })
    });

    // Read generated stats file and output nice summary
    if (fs.existsSync(LOG_FILE)) {
      const stats = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
      console.log('------------------------------------------------------------------------');
      console.log(`${colors.cyan}${colors.bold}📊 TELEMETRY RECONCILIATION SUMMARY:${colors.reset}`);
      console.log(`   Total Requests:      ${colors.bold}${stats.totalRequests}${colors.reset}`);
      console.log(`   Successful Requests: ${colors.bold}${stats.successfulRequests}${colors.reset}`);
      console.log(`   Avg Response Latency:${colors.bold} ${stats.avgLatencyMs} ms${colors.reset}`);
      console.log(`   Tokens Input:        ${colors.green}${stats.totalInputTokens.toLocaleString()}${colors.reset}`);
      console.log(`   Tokens Output:       ${colors.green}${stats.totalOutputTokens.toLocaleString()}${colors.reset}`);
      console.log(`   Tokens Total:        ${colors.green}${stats.totalTokens.toLocaleString()}${colors.reset}`);
      console.log(`   Estimated API Cost:  ${colors.magenta}${colors.bold}$${stats.totalCost.toFixed(5)}${colors.reset}`);
      console.log('------------------------------------------------------------------------');
      console.log(`${colors.green}✓ Verification Complete. All telemetry traces stored successfully!${colors.reset}`);
    }
  }

  runSimulations();
}
