// Gemini Telemetry & Observability Toolkit - Service Worker
// Ephemeral-safe service worker that stores usage data in chrome.storage.local

const MODEL_PRICING = {
  'gemini-2.0-flash': { input: 0.075 / 1000000, output: 0.30 / 1000000 },
  'gemini-1.5-flash': { input: 0.075 / 1000000, output: 0.30 / 1000000 },
  'gemini-1.5-pro': { input: 1.25 / 1000000, output: 5.00 / 1000000 },
  'gemini-1.0-pro': { input: 0.50 / 1000000, output: 1.50 / 1000000 },
  'default': { input: 0.075 / 1000000, output: 0.30 / 1000000 }
};

// Helper to determine pricing model based on model name string
function getPricing(modelName) {
  if (!modelName) return MODEL_PRICING['default'];
  const name = modelName.toLowerCase();
  if (name.includes('gemini-2.0-flash')) return MODEL_PRICING['gemini-2.0-flash'];
  if (name.includes('gemini-1.5-flash')) return MODEL_PRICING['gemini-1.5-flash'];
  if (name.includes('gemini-1.5-pro')) return MODEL_PRICING['gemini-1.5-pro'];
  if (name.includes('gemini-1.0-pro')) return MODEL_PRICING['gemini-1.0-pro'];
  return MODEL_PRICING['default'];
}

// Calculate cost
function calculateCost(model, inputTokens, outputTokens) {
  const pricing = getPricing(model);
  const inputCost = (inputTokens || 0) * pricing.input;
  const outputCost = (outputTokens || 0) * pricing.output;
  return inputCost + outputCost;
}

// DevTools panel connection list
const devToolsPorts = new Set();

// Listen for DevTools connections
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'devtools-panel') {
    devToolsPorts.add(port);
    port.onDisconnect.addListener(() => {
      devToolsPorts.delete(port);
    });
  }
});

// Broadcast live events to open DevTools panels
function broadcastToDevTools(event) {
  for (const port of devToolsPorts) {
    try {
      port.postMessage(event);
    } catch (err) {
      console.error('Failed to send event to DevTools port:', err);
    }
  }
}

// Process and store intercepted Gemini API request data
async function logGeminiRequest(data) {
  const { model = 'gemini-1.5-flash', inputTokens = 0, outputTokens = 0, latency = 0, status = 200, prompt = '', completion = '', endpoint = '' } = data;
  
  // Calculate cost
  const cost = calculateCost(model, inputTokens, outputTokens);
  const logEntry = {
    id: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    model,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    cost,
    latency,
    status,
    prompt: prompt.length > 500 ? prompt.substring(0, 500) + '...' : prompt,
    completion: completion.length > 1000 ? completion.substring(0, 1000) + '...' : completion,
    endpoint
  };

  // Get existing stats
  const store = await chrome.storage.local.get({
    totalRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    totalLatency: 0,
    successfulRequests: 0,
    requestLogs: []
  });

  // Accumulate
  store.totalRequests += 1;
  if (status >= 200 && status < 300) {
    store.successfulRequests += 1;
  }
  store.totalInputTokens += inputTokens;
  store.totalOutputTokens += outputTokens;
  store.totalTokens += (inputTokens + outputTokens);
  store.totalCost += cost;
  store.totalLatency += latency;

  // Add to logs (max 50)
  store.requestLogs.unshift(logEntry);
  if (store.requestLogs.length > 50) {
    store.requestLogs.pop();
  }

  // Save to storage
  await chrome.storage.local.set(store);

  // Update extension badge
  updateBadge(store.totalTokens, store.totalRequests);

  // Broadcast to live DevTools
  broadcastToDevTools({ type: 'LIVE_REQUEST', request: logEntry });
}

// Update the extension badge text
async function updateBadge(totalTokens, totalRequests) {
  try {
    let badgeText = '';
    if (totalTokens >= 1000000) {
      badgeText = (totalTokens / 1000000).toFixed(1) + 'M';
    } else if (totalTokens >= 1000) {
      badgeText = (totalTokens / 1000).toFixed(0) + 'k';
    } else if (totalTokens > 0) {
      badgeText = String(totalTokens);
    }
    
    await chrome.action.setBadgeText({ text: badgeText });
    await chrome.action.setBadgeBackgroundColor({ color: '#00f2fe' });
  } catch (err) {
    console.error('Badge update error (likely no "action" configured):', err);
  }
}

// Listen for messages from Content Scripts and DevTools Panels
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG_GEMINI_REQUEST') {
    logGeminiRequest(message.data);
    sendResponse({ status: 'logged' });
  } else if (message.type === 'CLEAR_STORAGE') {
    chrome.storage.local.clear().then(() => {
      chrome.action.setBadgeText({ text: '' });
      broadcastToDevTools({ type: 'STORAGE_CLEARED' });
      sendResponse({ status: 'cleared' });
    });
    return true; // Keep message channel open for async clear
  }
});
