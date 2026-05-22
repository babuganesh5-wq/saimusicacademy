// Gemini DevTools Tracker - Panel Controller
// Connects to background worker, manages active stream logs, and controls the UI.

let sessionRequests = [];
let selectedRequest = null;

// Connect to background worker for live updates
const port = chrome.runtime.connect({ name: 'devtools-panel' });

// Listen for incoming messages from background worker
port.onMessage.addListener((msg) => {
  if (msg.type === 'LIVE_REQUEST') {
    addRequest(msg.request);
  } else if (msg.type === 'STORAGE_CLEARED') {
    clearUI();
  }
});

// Capture requests directly from inspected tab network requests (as robust backup!)
if (chrome.devtools && chrome.devtools.network) {
  chrome.devtools.network.onRequestFinished.addListener((request) => {
    const url = request.request.url;
    const isGemini = url.includes('generativelanguage.googleapis.com') || url.includes('/v1beta/models') || url.includes('/v1/models');
    
    if (isGemini) {
      const startTime = Date.now();
      const status = request.response.status;
      const latency = Math.round(request.time);
      const method = request.request.method;
      
      let promptText = '';
      if (request.request.postData && request.request.postData.text) {
        try {
          const bodyData = JSON.parse(request.request.postData.text);
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
        } catch (e) {
          promptText = '[Payload not JSON / could not parse]';
        }
      }

      // Read response content body
      request.getContent((content, encoding) => {
        try {
          if (!content) return;
          const data = JSON.parse(content);
          
          let inputTokens = 0;
          let outputTokens = 0;
          let completionText = '';
          
          // Extract model name from URL
          let modelName = 'gemini-unknown';
          const modelMatch = url.match(/models\/([^:?\/]+)/);
          if (modelMatch && modelMatch[1]) {
            modelName = modelMatch[1];
          }

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

          // Fallback estimations
          if (inputTokens === 0 && promptText) {
            inputTokens = Math.max(1, Math.round(promptText.length / 4));
          }
          if (outputTokens === 0 && completionText) {
            outputTokens = Math.max(1, Math.round(completionText.length / 4));
          }

          // Tell background worker to log this request (it will deduplicate or handle aggregation)
          // We only dispatch if we actually successfully parsed a response!
          chrome.runtime.sendMessage({
            type: 'LOG_GEMINI_REQUEST',
            data: {
              model: modelName,
              inputTokens,
              outputTokens,
              latency,
              status,
              prompt: promptText,
              completion: completionText,
              endpoint: url
            }
          });
        } catch (err) {
          // Streaming or binary payload, background content script already handles fallback
        }
      });
    }
  });
}

// Initial populate of requests list from chrome.storage
async function loadRequestHistory() {
  const store = await chrome.storage.local.get({ requestLogs: [] });
  sessionRequests = [...store.requestLogs];
  renderRequestList();
}

// Render left sidebar request logs list
function renderRequestList(filterQuery = '') {
  const listContainer = document.getElementById('request-list');
  listContainer.innerHTML = ''; // Clear

  const filtered = sessionRequests.filter(req => {
    const q = filterQuery.toLowerCase();
    return req.model.toLowerCase().includes(q) || 
           (req.prompt && req.prompt.toLowerCase().includes(q)) || 
           (req.completion && req.completion.toLowerCase().includes(q)) ||
           String(req.status).includes(q);
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="no-requests">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
        No matching traces found.
      </div>
    `;
    return;
  }

  filtered.forEach(req => {
    const item = document.createElement('div');
    item.className = 'request-item';
    if (selectedRequest && selectedRequest.id === req.id) {
      item.className += ' active';
    }

    // Date simple string
    const date = new Date(req.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Latency badge color class
    let latClass = 'fast';
    if (req.latency > 1500) latClass = 'slow';
    else if (req.latency > 500) latClass = 'medium';

    // Status status class badge
    const statusClass = req.status === 200 || req.status === 0 ? 'badge-success' : 'badge-error';
    const statusText = req.status === 200 ? '200 OK' : (req.status === 0 ? 'TRACED' : req.status);

    item.innerHTML = `
      <div class="req-top">
        <span class="req-model">${req.model}</span>
        <span class="req-time">${timeStr}</span>
      </div>
      <div class="req-middle">${req.prompt ? req.prompt.substring(0, 75) + (req.prompt.length > 75 ? '...' : '') : '[Empty Prompt]'}</div>
      <div class="req-bottom">
        <span class="badge ${statusClass}">${statusText}</span>
        <span class="badge badge-tokens">${req.totalTokens} tkn</span>
        <span class="badge badge-latency ${latClass}">${req.latency}ms</span>
      </div>
    `;

    item.addEventListener('click', () => selectRequest(req));
    listContainer.appendChild(item);
  });
}

// Select and inspect a specific request trace
function selectRequest(req) {
  selectedRequest = req;
  
  // Highlight in list
  const items = document.querySelectorAll('.request-item');
  items.forEach(el => el.classList.remove('active'));
  
  // Find clicked item to add active class
  loadRequestHistory(); // reload history state

  // Toggle detail pane visibility
  document.getElementById('details-empty').style.display = 'none';
  document.getElementById('details-content').style.display = 'flex';

  // Fill in metrics
  document.getElementById('det-url').textContent = req.endpoint || 'https://generativelanguage.googleapis.com/v1beta/models/' + req.model;
  
  const statusText = req.status === 200 ? '200 OK' : (req.status === 0 ? 'TRACED (OK)' : 'Error ' + req.status);
  document.getElementById('det-status').textContent = statusText;
  document.getElementById('det-status').style.color = (req.status === 200 || req.status === 0) ? 'var(--success)' : 'var(--error)';
  
  document.getElementById('det-latency').textContent = req.latency + ' ms';
  document.getElementById('det-tokens').textContent = req.totalTokens.toLocaleString() + ' tkn';
  document.getElementById('det-cost').textContent = '$' + req.cost.toFixed(5);

  // Fill tabs
  document.getElementById('box-prompt').textContent = req.prompt || '[No input prompt data received]';
  document.getElementById('box-completion').textContent = req.completion || '[No candidate completion data generated]';
  
  // Clean JSON formatting
  document.getElementById('box-raw').textContent = JSON.stringify(req, null, 2);

  // Trigger sidebar rerender to apply selection highlighting
  const currentFilter = document.getElementById('search-input').value;
  renderRequestList(currentFilter);
}

// Add a live incoming request to stream
function addRequest(req) {
  // Deduplicate: check if request is already in list
  if (sessionRequests.some(r => r.id === req.id)) return;
  
  sessionRequests.unshift(req);
  if (sessionRequests.length > 100) {
    sessionRequests.pop();
  }
  
  const currentFilter = document.getElementById('search-input').value;
  renderRequestList(currentFilter);
}

// Clear currently displayed list
function clearUI() {
  sessionRequests = [];
  selectedRequest = null;
  document.getElementById('details-empty').style.display = 'flex';
  document.getElementById('details-content').style.display = 'none';
  renderRequestList();
}

// Wire inspector Tab Buttons navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Nav highlight
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');

    // Display tab contents pane
    const targetTab = btn.getAttribute('data-tab');
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.getElementById(targetTab).classList.add('active');
  });
});

// Wire Search Filter Input
document.getElementById('search-input').addEventListener('input', (e) => {
  renderRequestList(e.target.value);
});

// Wire Clear Stream button
document.getElementById('btn-clear').addEventListener('click', () => {
  clearUI();
});

// Wire Reset Global Stats button
document.getElementById('btn-reset').addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all Gemini usage telemetry stats globally? This will clear popup stats as well.')) {
    chrome.runtime.sendMessage({ type: 'CLEAR_STORAGE' });
  }
});

// Initial load
loadRequestHistory();
