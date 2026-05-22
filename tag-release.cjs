const { execSync } = require('child_process');
const readline = require('readline');

// Colors for premium console output
const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${colors.cyan}${colors.bold}========================================================================`);
console.log('   🔖 SAI MUSIC ACADEMY — STABLE RELEASE BOOKMARK SYSTEM');
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

  // Get argument if passed
  let tagName = process.argv[2];

  if (!tagName) {
    rl.question(`${colors.yellow}Enter stable version tag name (e.g. v1.0.0, stable-v1): ${colors.reset}`, (input) => {
      tagName = input.trim();
      if (!tagName) {
        console.log(`${colors.red}✗ Tag name cannot be empty. Release aborted.${colors.reset}`);
        rl.close();
        process.exit(1);
      }
      createTag(tagName);
    });
  } else {
    createTag(tagName);
  }
}

function createTag(name) {
  // Replace spaces with hyphens to make valid tag
  const sanitizedTag = name.replace(/\s+/g, '-');
  
  console.log(`\n${colors.cyan}[System] Creating stable checkpoint "${sanitizedTag}"...${colors.reset}`);

  try {
    // 1. Create Annotated Tag
    const message = `Stable checkpoint created on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    runCommand(`git tag -a "${sanitizedTag}" -m "${message}"`);
    console.log(`${colors.green}✓ Local tag "${sanitizedTag}" successfully created.${colors.reset}`);

    // 2. Push tag to GitHub
    console.log(`${colors.yellow}[Sync] Pushing tag to GitHub repository...${colors.reset}`);
    runCommand(`git push origin "${sanitizedTag}"`);
    
    console.log(`\n${colors.green}${colors.bold}🎉 Success! Checkpoint "${sanitizedTag}" is officially backed up on GitHub!${colors.reset}`);
    console.log(`${colors.cyan}If you ever need to rollback, this release checkpoint will be permanently available.${colors.reset}`);
    console.log('------------------------------------------------------------------------');
  } catch (err) {
    console.error(`\n${colors.red}✗ Failed to create or push tag:${colors.reset}\n`, err);
  } finally {
    rl.close();
  }
}

start();
