// Gemini Telemetry & Observability Toolkit - DevTools Panel Injector
// Creates a custom "Gemini Tracker" panel inside Chrome DevTools.

chrome.devtools.panels.create(
  "Gemini Tracker",            // Tab name displayed in DevTools
  "",                          // Optional icon path (omitted)
  "devtools/panel.html",       // Path to panel page (relative to extension root!)
  (panel) => {
    console.log('[Gemini Telemetry] DevTools panel successfully registered!');
  }
);
