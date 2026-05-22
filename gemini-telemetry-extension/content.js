// Gemini Telemetry & Observability Toolkit - Content Script
// Bridges the page's main JavaScript context (where fetch calls happen) with the extension's background worker.

// Inject the interception script directly into the page context (Main World)
function injectTracer() {
  const code = `
    (function() {
      const originalFetch = window.fetch;
      
      window.fetch = async function(...args) {
        const url = args[0];
        const options = args[1] || {};
        
        // Target only Google Gemini API calls (AI Studio or custom endpoints)
        const isGemini = typeof url === 'string' && (
          url.includes('generativelanguage.googleapis.com') || 
          url.includes('/v1beta/models') || 
          url.includes('/v1/models')
        );
        
        if (!isGemini) {
          return originalFetch.apply(this, args);
        }
        
        const startTime = performance.now();
        let promptText = '';
        let modelName = 'gemini-unknown';
        
        // Try to extract prompt and model name from request
        try {
          if (options.body) {
            const bodyData = JSON.parse(options.body);
            
            // Extract model name from URL
            const modelMatch = url.match(/models\\/([^:?\/]+)/);
            if (modelMatch && modelMatch[1]) {
              modelName = modelMatch[1];
            }
            
            // Try to extract prompt content
            if (bodyData.contents) {
              const parts = [];
              bodyData.contents.forEach(content => {
                if (content.parts) {
                  content.parts.forEach(part => {
                    if (part.text) parts.push(part.text);
                  });
                }
              });
              promptText = parts.join('\\n');
            }
          }
        } catch (e) {
          console.warn('[Gemini Telemetry] Failed to parse request payload:', e);
        }
        
        try {
          const response = await originalFetch.apply(this, args);
          const endTime = performance.now();
          const latency = Math.round(endTime - startTime);
          
          // Clone response to read its body without consuming the original stream
          const clonedRes = response.clone();
          
          clonedRes.json().then(data => {
            let inputTokens = 0;
            let outputTokens = 0;
            let completionText = '';
            
            // Handle standard Gemini response structure
            try {
              if (data.usageMetadata) {
                inputTokens = data.usageMetadata.promptTokenCount || 0;
                outputTokens = data.usageMetadata.candidatesTokenCount || 0;
              }
              
              if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const parts = [];
                data.candidates[0].content.parts.forEach(part => {
                  if (part.text) parts.push(part.text);
                });
                completionText = parts.join('\\n');
              }
              
              // If metadata was missing, approximate based on characters (1 token ~= 4 chars)
              if (inputTokens === 0 && promptText) {
                inputTokens = Math.max(1, Math.round(promptText.length / 4));
              }
              if (outputTokens === 0 && completionText) {
                outputTokens = Math.max(1, Math.round(completionText.length / 4));
              }
              
              // Dispatch captured data to isolated content script
              window.dispatchEvent(new CustomEvent('GEMINI_API_TRACED', {
                detail: {
                  model: modelName,
                  inputTokens,
                  outputTokens,
                  latency,
                  status: response.status,
                  prompt: promptText,
                  completion: completionText,
                  endpoint: url
                }
              }));
            } catch (err) {
              console.error('[Gemini Telemetry] Error processing JSON body:', err);
            }
          }).catch(err => {
            // Likely streaming response or non-JSON content
            const endTimeStream = performance.now();
            const latencyStream = Math.round(endTimeStream - startTime);
            
            // Fallback estimation for streaming or non-JSON
            window.dispatchEvent(new CustomEvent('GEMINI_API_TRACED', {
              detail: {
                model: modelName,
                inputTokens: Math.max(1, Math.round(promptText.length / 4)),
                outputTokens: 50, // Arbitrary baseline for streaming chunks
                latency: latencyStream,
                status: response.status,
                prompt: promptText,
                completion: '[Streaming or Complex Response Body]',
                endpoint: url
              }
            }));
          });
          
          return response;
        } catch (err) {
          const endTimeErr = performance.now();
          window.dispatchEvent(new CustomEvent('GEMINI_API_TRACED', {
            detail: {
              model: modelName,
              inputTokens: Math.max(1, Math.round(promptText.length / 4)),
              outputTokens: 0,
              latency: Math.round(endTimeErr - startTime),
              status: 0, // Network failure
              prompt: promptText,
              completion: 'Network/CORS error: ' + err.message,
              endpoint: url
            }
          }));
          throw err; // Re-throw original fetch error
        }
      };
    })();
  `;

  const script = document.createElement('script');
  script.textContent = code;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

// Listen to CustomEvent dispatched by main world tracer script
window.addEventListener('GEMINI_API_TRACED', (event) => {
  const data = event.detail;
  // Send data to background worker
  chrome.runtime.sendMessage({
    type: 'LOG_GEMINI_REQUEST',
    data: data
  });
});

// Run injection immediately
injectTracer();
console.log('%c⚡ Gemini Telemetry & Observability active on this page!', 'color: #00f2fe; font-weight: bold;');
