// Gemini Telemetry & Observability Toolkit - Popup Controller
// Retrives aggregated telemetry from storage and renders the premium dashboard.

async function loadDashboard() {
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

  // Calculate percentages and rates
  const successRate = store.totalRequests > 0 
    ? Math.round((store.successfulRequests / store.totalRequests) * 100) 
    : 100;
  
  const avgLatency = store.totalRequests > 0 
    ? Math.round(store.totalLatency / store.totalRequests) 
    : 0;

  // Render metrics cards
  document.getElementById('val-cost').textContent = '$' + store.totalCost.toFixed(5);
  document.getElementById('val-requests').textContent = store.totalRequests + ' total requests';
  document.getElementById('val-latency').textContent = avgLatency + ' ms';
  document.getElementById('val-success').textContent = successRate + '% success rate';
  
  // Render tokens
  document.getElementById('val-tokens').textContent = store.totalTokens.toLocaleString() + ' tkn';
  document.getElementById('val-input').textContent = 'In: ' + store.totalInputTokens.toLocaleString();
  document.getElementById('val-output').textContent = 'Out: ' + store.totalOutputTokens.toLocaleString();

  // Progress Bar
  const tokenBar = document.getElementById('token-bar');
  if (store.totalTokens > 0) {
    const inputRatio = (store.totalInputTokens / store.totalTokens) * 100;
    tokenBar.style.width = inputRatio + '%';
  } else {
    tokenBar.style.width = '0%';
  }

  // Render logs list
  const logsList = document.getElementById('logs-list');
  logsList.innerHTML = ''; // Clear

  if (store.requestLogs.length === 0) {
    logsList.innerHTML = `
      <div class="no-logs">No Gemini requests traced yet. Make a request in AI Studio or open the local web UI!</div>
    `;
    return;
  }

  store.requestLogs.forEach(log => {
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    
    // Format timestamp
    const date = new Date(log.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Status colors
    const statusText = log.status === 200 ? 'Success' : ('Err ' + log.status);
    const statusStyle = log.status === 200 ? 'color: var(--success);' : 'color: var(--error);';

    logItem.innerHTML = `
      <div class="log-header">
        <span class="log-model">${log.model}</span>
        <span class="log-time">${timeStr}</span>
      </div>
      <div class="log-stats">
        <span>In: <strong>${log.inputTokens}</strong></span>
        <span>Out: <strong>${log.outputTokens}</strong></span>
        <span>Lat: <strong>${log.latency}ms</strong></span>
        <span style="${statusStyle}"><strong>${statusText}</strong></span>
      </div>
      <div class="log-snippet" title="${log.prompt.replace(/"/g, '&quot;')}">${log.prompt || '[Empty Prompt]'}</div>
    `;
    logsList.appendChild(logItem);
  });
}

// Wire buttons
document.getElementById('btn-reset').addEventListener('click', async () => {
  if (confirm('Are you sure you want to reset all Gemini usage telemetry stats? This cannot be undone.')) {
    await chrome.runtime.sendMessage({ type: 'CLEAR_STORAGE' });
    window.location.reload();
  }
});

document.getElementById('btn-devtools').addEventListener('click', () => {
  alert('💡 To view the live Gemini Tracker stream:\n1. Open Chrome DevTools (F12 or Right Click -> Inspect) on any webpage.\n2. Locate and click the "Gemini Tracker" panel tab along the top bar!\n3. Perform Gemini API requests to see them appear live!');
});

// Real-time update if data changes in background while popup is open
chrome.storage.onChanged.addListener((changes) => {
  if (changes.totalTokens || changes.requestLogs) {
    loadDashboard();
  }
});

// Initial load
document.addEventListener('DOMContentLoaded', loadDashboard);
