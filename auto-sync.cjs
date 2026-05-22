const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for premium console output
const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${colors.cyan}${colors.bold}`);
console.log('  ██████╗ ██████╗  ██████╗ ████████╗ ██████╗     ███████╗██╗   ██╗███╗   ██╗ ██████╗');
console.log('  ██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔═══██╗    ██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝');
console.log('  ███████║██████╔╝██║   ██║   ██║   ██║   ██║    ███████╗ ╚████╔╝ ██╔██╗ ██║██║     ');
console.log('  ██╔══██║██╔══██╗██║   ██║   ██║   ██║   ██║    ╚════██║  ╚██╔╝  ██║╚██╗██║██║     ');
console.log('  ██║  ██║██║  ██║╚██████╔╝   ██║   ╚██████╔╝    ███████║   ██║   ██║ ╚████║╚██████╗');
console.log('  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝     ╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝');
console.log(`${colors.reset}`);
console.log(`${colors.cyan}Sai Music Academy — Real-Time Local-to-Cloud Sync Engine${colors.reset}`);
console.log('------------------------------------------------------------------------');
console.log('Watching for local file saves... Any modification will automatically sync');
console.log('to your GitHub (GaneshBabu777) and redeploy on Vercel live instantly!');
console.log('');

const WATCH_DIR = __dirname;
let debounceTimer = null;
const DEBOUNCE_DELAY = 3000; // Wait 3 seconds of inactivity before pushing to avoid typing spam
let isPushing = false;

// Files/folders to watch
const watchTargets = [
  path.join(WATCH_DIR, 'src'),
  path.join(WATCH_DIR, 'public'),
  path.join(WATCH_DIR, 'index.html'),
  path.join(WATCH_DIR, 'vite.config.ts'),
  path.join(WATCH_DIR, 'vercel.json'),
  path.join(WATCH_DIR, 'package.json')
];

// Folders to completely ignore
const ignoreTargets = [
  'node_modules',
  '.git',
  'dist',
  '.DS_Store'
];

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: WATCH_DIR }, (error, stdout, stderr) => {
      if (error) reject({ error, stderr });
      else resolve(stdout);
    });
  });
}

async function syncToCloud() {
  if (isPushing) {
    console.log(`${colors.yellow}[Sync] Push already in progress. Queueing updates...${colors.reset}`);
    triggerSync(); // Queue another check
    return;
  }

  isPushing = true;
  console.log(`${colors.yellow}[Sync] Initiating automatic push to GitHub...${colors.reset}`);

  try {
    // 1. Stage changes
    await runCommand('git add -A');
    
    // Check if there are actual changes to commit
    const status = await runCommand('git status --porcelain');
    if (!status.trim()) {
      console.log(`${colors.green}✓ Local workspace is clean. No sync required.${colors.reset}`);
      isPushing = false;
      return;
    }

    // 2. Commit changes
    const commitMsg = `Auto-sync: local save on ${new Date().toLocaleTimeString()}`;
    await runCommand(`git commit -m "${commitMsg}"`);
    console.log(`${colors.cyan}[Sync] ✓ Changes committed locally.${colors.reset}`);

    // 3. Push to GitHub
    console.log(`${colors.yellow}[Sync] Uploading code to GitHub (GaneshBabu777/saimusicacademy)...${colors.reset}`);
    await runCommand('git push origin main');
    
    console.log(`${colors.green}${colors.bold}✓ Sync Complete! GitHub updated and Vercel cloud build triggered successfully!${colors.reset}`);
    console.log('------------------------------------------------------------------------');
  } catch (err) {
    console.error(`${colors.red}✗ Sync Error:${colors.reset}`, err.stderr || err.error || err);
  } finally {
    isPushing = false;
  }
}

function triggerSync() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    syncToCloud();
  }, DEBOUNCE_DELAY);
}

// Attach watch listeners recursively where needed
function setupWatcher(targetPath) {
  if (!fs.existsSync(targetPath)) return;

  const stats = fs.statSync(targetPath);
  
  if (stats.isDirectory()) {
    // Read contents and setup listeners
    fs.readdirSync(targetPath).forEach(child => {
      if (ignoreTargets.includes(child)) return;
      setupWatcher(path.join(targetPath, child));
    });

    // Also watch the directory itself for addition/deletion of files
    fs.watch(targetPath, (eventType, filename) => {
      if (filename && ignoreTargets.some(ignored => filename.includes(ignored))) return;
      console.log(`${colors.cyan}[Change Detected]${colors.reset} in folder "${path.basename(targetPath)}": ${filename || ''} (${eventType})`);
      triggerSync();
    });
  } else {
    // Watch individual files
    fs.watch(targetPath, (eventType) => {
      console.log(`${colors.cyan}[Change Detected]${colors.reset} in file: "${path.basename(targetPath)}"`);
      triggerSync();
    });
  }
}

// Initialize watchers
watchTargets.forEach(target => {
  setupWatcher(target);
});

console.log(`${colors.green}● Sync daemon is actively listening for file saves...${colors.reset}`);
console.log('Press Ctrl + C to stop the auto-sync daemon at any time.');
console.log('------------------------------------------------------------------------');
