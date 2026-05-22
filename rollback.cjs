const { execSync } = require('child_process');
const readline = require('readline');

// Colors for premium console output
const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  magenta: '\x1b[35m'
};

console.log(`${colors.magenta}${colors.bold}========================================================================`);
console.log('   🔄 SAI MUSIC ACADEMY — AUTOMATED CLOUD ROLLBACK ENGINE');
console.log(`========================================================================${colors.reset}\n`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (err) {
    throw err.stderr || err.message;
  }
}

async function start() {
  // Check if Git is initialized
  try {
    runCommand('git rev-parse --is-inside-work-tree');
  } catch (e) {
    console.error(`${colors.red}✗ Error: Not a git repository.${colors.reset}`);
    rl.close();
    process.exit(1);
  }

  // 1. Safety Check: Check for uncommitted changes
  const status = runCommand('git status --porcelain');
  if (status.trim()) {
    console.log(`${colors.yellow}⚠️ WARNING: You have uncommitted changes in your local workspace!${colors.reset}`);
    console.log('Rolling back will overwrite these unsaved changes.\n');
    console.log('What would you like to do?');
    console.log(`  [1] ${colors.cyan}Stash changes${colors.reset} (Save them to Git memory so you can recover them later)`);
    console.log(`  [2] ${colors.red}Discard changes${colors.reset} (Deletes unsaved changes permanently)`);
    console.log(`  [3] ${colors.bold}Cancel${colors.reset} rollback operation`);
    
    rl.question(`\nSelect an option [1-3]: `, (answer) => {
      const choice = answer.trim();
      if (choice === '1') {
        console.log(`\n${colors.cyan}[System] Stashing your changes...${colors.reset}`);
        runCommand('git stash -u -m "Auto-stashed before rollback"');
        console.log(`${colors.green}✓ Changes saved to stash.${colors.reset}`);
        listVersions();
      } else if (choice === '2') {
        console.log(`\n${colors.cyan}[System] Discarding unsaved changes...${colors.reset}`);
        runCommand('git reset --hard HEAD');
        runCommand('git clean -df');
        console.log(`${colors.green}✓ Cleaned workspace.${colors.reset}`);
        listVersions();
      } else {
        console.log(`${colors.yellow}Rollback cancelled.${colors.reset}`);
        rl.close();
        process.exit(0);
      }
    });
  } else {
    listVersions();
  }
}

function listVersions() {
  console.log(`\n${colors.cyan}Fetching recent save states...${colors.reset}\n`);

  // Fetch last 5 commits
  let commits = [];
  try {
    const rawCommits = runCommand('git log -n 5 --pretty=format:"%h|%s|%ar|%ad"');
    commits = rawCommits.split('\n').map((line, index) => {
      const [hash, msg, relative, date] = line.split('|');
      return { index: index + 1, hash, msg, relative, date };
    });
  } catch (err) {
    console.error(`${colors.red}✗ Failed to fetch commits:${colors.reset}`, err);
    rl.close();
    process.exit(1);
  }

  // Fetch tags
  let tags = [];
  try {
    const rawTags = runCommand('git tag -l --format="%(refname:short)|%(contents:subject)"');
    if (rawTags) {
      tags = rawTags.split('\n').filter(Boolean).map((line, index) => {
        const [name, subject] = line.split('|');
        return { index: index + 1, name, subject };
      });
    }
  } catch (e) {
    // Tags might be empty, ignore
  }

  // Display Recent Commits
  console.log(`${colors.bold}=== RECENT LOCAL SAVE POINTS (COMMITS) ===${colors.reset}`);
  commits.forEach(c => {
    console.log(`  [${colors.green}${c.index}${colors.reset}] Commit ${colors.cyan}${c.hash}${colors.reset} — "${colors.bold}${c.msg}${colors.reset}" (${c.relative})`);
  });

  // Display Stable Releases (Tags) if any exist
  if (tags.length > 0) {
    console.log(`\n${colors.bold}=== STABLE BOOKMARK RELEASES (TAGS) ===${colors.reset}`);
    tags.forEach(t => {
      console.log(`  [${colors.yellow}T${t.index}${colors.reset}] Release ${colors.yellow}${t.name}${colors.reset} — "${t.subject}"`);
    });
  }

  console.log(`\n  [${colors.red}Q${colors.reset}] Cancel and Exit`);

  rl.question(`\nSelect the version you want to roll back to: `, (selection) => {
    const answer = selection.trim().toUpperCase();
    
    if (answer === 'Q') {
      console.log(`${colors.yellow}Rollback cancelled.${colors.reset}`);
      rl.close();
      process.exit(0);
    }

    let targetHash = null;
    let targetName = '';

    // Check if selecting a tag
    if (answer.startsWith('T')) {
      const tagIdx = parseInt(answer.substring(1)) - 1;
      if (tagIdx >= 0 && tagIdx < tags.length) {
        targetHash = tags[tagIdx].name;
        targetName = `Stable Release "${tags[tagIdx].name}"`;
      }
    } else {
      const commitIdx = parseInt(answer) - 1;
      if (commitIdx >= 0 && commitIdx < commits.length) {
        targetHash = commits[commitIdx].hash;
        targetName = `Commit "${commits[commitIdx].msg}" (${commits[commitIdx].hash})`;
      }
    }

    if (!targetHash) {
      console.log(`${colors.red}✗ Invalid selection. Rollback aborted.${colors.reset}`);
      rl.close();
      process.exit(1);
    }

    confirmRollback(targetHash, targetName);
  });
}

function confirmRollback(targetHash, targetName) {
  console.log(`\n${colors.red}${colors.bold}⚠️⚠️ CRITICAL WARNING ⚠️⚠️${colors.reset}`);
  console.log(`You are about to roll back both your local workspace AND your live website to:`);
  console.log(`👉 ${colors.cyan}${colors.bold}${targetName}${colors.reset}`);
  console.log(`This will overwrite your current live production website instantly!`);
  
  rl.question(`\nType ${colors.green}${colors.bold}YES${colors.reset} to confirm rollback or any other key to cancel: `, (confirmation) => {
    if (confirmation.trim() === 'YES') {
      executeRollback(targetHash);
    } else {
      console.log(`${colors.yellow}Rollback cancelled.${colors.reset}`);
      rl.close();
    }
  });
}

function executeRollback(target) {
  console.log(`\n${colors.cyan}[Rollback] Resetting local workspace to ${target}...${colors.reset}`);
  try {
    // 1. Reset HEAD locally
    runCommand(`git reset --hard ${target}`);
    console.log(`${colors.green}✓ Local workspace reset complete.${colors.reset}`);

    // 2. Force push to remote
    console.log(`${colors.yellow}[Rollback] Force-pushing to GitHub to update production...${colors.reset}`);
    runCommand('git push origin main --force');
    
    console.log(`\n${colors.green}${colors.bold}🎉 SUCCESS! Rollback complete!${colors.reset}`);
    console.log(`${colors.cyan}GitHub history updated. Vercel is redeploying this exact state live right now!${colors.reset}`);
    console.log('------------------------------------------------------------------------');
  } catch (err) {
    console.error(`\n${colors.red}✗ Rollback Failed:${colors.reset}\n`, err);
  } finally {
    rl.close();
  }
}

start();
