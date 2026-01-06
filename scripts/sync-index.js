const fs = require('fs');
const path = require('path');

// Safe logging function that won't crash if log directory doesn't exist
function safeLog(entry) {
  try {
    const logPath = '/home/kt/Desktop/NorthStar/.cursor/debug.log';
    const logDir = path.dirname(logPath);
    if (fs.existsSync(logDir)) {
      fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    }
  } catch (err) {
    // Silently ignore logging errors - don't crash the script
  }
}

const buildIndexPath = path.join(__dirname, '../build/index.html');
const rootIndexPath = path.join(__dirname, '../index.html');

// #region agent log
safeLog({
  sessionId: 'debug-session',
  runId: 'run1',
  hypothesisId: 'A',
  location: 'scripts/sync-index.js:18',
  message: 'Checking if build/index.html exists',
  data: { exists: fs.existsSync(buildIndexPath) },
  timestamp: Date.now()
});
// #endregion

if (!fs.existsSync(buildIndexPath)) {
  console.error('Error: build/index.html does not exist. Run npm run build first.');
  // #region agent log
  safeLog({
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'C',
    location: 'scripts/sync-index.js:26',
    message: 'Build index.html not found',
    data: { buildIndexPath },
    timestamp: Date.now()
  });
  // #endregion
  process.exit(1);
}

// #region agent log
const buildContent = fs.readFileSync(buildIndexPath, 'utf8');
const existingRootContent = fs.existsSync(rootIndexPath) ? fs.readFileSync(rootIndexPath, 'utf8') : null;
safeLog({
  sessionId: 'debug-session',
  runId: 'run1',
  hypothesisId: 'A',
  location: 'scripts/sync-index.js:38',
  message: 'Comparing build and root index.html content',
  data: { 
    buildExists: true,
    rootExists: !!existingRootContent,
    buildLength: buildContent.length,
    rootLength: existingRootContent ? existingRootContent.length : 0,
    areEqual: existingRootContent === buildContent
  },
  timestamp: Date.now()
});
// #endregion

// Extract script and link tags from build/index.html
const scriptMatch = buildContent.match(/<script[^>]*src="([^"]+)"[^>]*>/);
const linkMatch = buildContent.match(/<link[^>]*href="([^"]+)"[^>]*>/);

// #region agent log
safeLog({
  sessionId: 'debug-session',
  runId: 'run1',
  hypothesisId: 'B',
  location: 'scripts/sync-index.js:72',
  message: 'Extracted asset paths from build/index.html',
  data: { 
    scriptSrc: scriptMatch ? scriptMatch[1] : null,
    linkHref: linkMatch ? linkMatch[1] : null,
    hasScriptTag: !!scriptMatch,
    hasLinkTag: !!linkMatch
  },
  timestamp: Date.now()
});
// #endregion

// Read public/index.html as template for formatting
const publicIndexPath = path.join(__dirname, '../public/index.html');
const publicContent = fs.existsSync(publicIndexPath) ? fs.readFileSync(publicIndexPath, 'utf8') : null;

// #region agent log
safeLog({
  sessionId: 'debug-session',
  runId: 'run1',
  hypothesisId: 'B',
  location: 'scripts/sync-index.js:88',
  message: 'Reading public/index.html template',
  data: { 
    publicExists: !!publicContent,
    publicLength: publicContent ? publicContent.length : 0
  },
  timestamp: Date.now()
});
// #endregion

// Root index.html should match public/index.html structure but include script tags from build
// This ensures it works when served statically while maintaining formatting
// npm start uses public/index.html (not root/index.html), so root can have script tags
let rootContent;

// #region agent log
safeLog({
  sessionId: 'debug-session',
  runId: 'run1',
  hypothesisId: 'A',
  location: 'scripts/sync-index.js:114',
  message: 'Decision: root/index.html needs script tags from current build, formatted like public/index.html',
  data: { 
    publicExists: !!publicContent,
    scriptMatch: !!scriptMatch,
    linkMatch: !!linkMatch,
    scriptSrc: scriptMatch ? scriptMatch[1] : null,
    linkHref: linkMatch ? linkMatch[1] : null,
    reason: 'Root/index.html needs current build script tags to work when served statically. npm start uses public/index.html separately.'
  },
  timestamp: Date.now()
});
// #endregion

if (publicContent && scriptMatch && linkMatch) {
  // Convert absolute paths to relative paths (strip /NorthStar/ prefix)
  // This is needed because the <base href="/NorthStar/" /> tag makes relative paths work correctly
  const scriptSrc = scriptMatch[1].startsWith('/NorthStar/') 
    ? scriptMatch[1].substring('/NorthStar/'.length)
    : scriptMatch[1];
  const linkHref = linkMatch[1].startsWith('/NorthStar/')
    ? linkMatch[1].substring('/NorthStar/'.length)
    : linkMatch[1];
  
  // Create formatted root/index.html based on public/index.html but with current build script tags
  // This ensures it works when served statically while maintaining formatting
  rootContent = publicContent.replace(
    '    <title>Chef Card Game</title>\n  </head>',
    `    <title>Chef Card Game</title>\n    <script defer="defer" src="${scriptSrc}"></script>\n    <link href="${linkHref}" rel="stylesheet">\n  </head>`
  );
  
  // #region agent log
  safeLog({
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'A',
    location: 'scripts/sync-index.js:128',
    message: 'Created root/index.html from public template with current build script tags',
    data: { 
      rootLength: rootContent.length,
      hasScriptTag: rootContent.includes(scriptSrc),
      hasLinkTag: rootContent.includes(linkHref),
      formatted: true,
      scriptSrc: scriptSrc,
      linkHref: linkHref,
      originalScriptSrc: scriptMatch[1],
      originalLinkHref: linkMatch[1]
    },
    timestamp: Date.now()
  });
  // #endregion
  
  // Copy static files to root/static/ so they're available for static serving
  const staticSource = path.join(__dirname, '../build/static');
  const staticDest = path.join(__dirname, '../static');
  if (fs.existsSync(staticSource)) {
    // Remove old static directory if it exists
    if (fs.existsSync(staticDest)) {
      fs.rmSync(staticDest, { recursive: true, force: true });
    }
    // Copy build/static to root/static
    fs.cpSync(staticSource, staticDest, { recursive: true });
    
    // #region agent log
    safeLog({
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A',
      location: 'scripts/sync-index.js:155',
      message: 'Copied build/static to root/static',
      data: { 
        source: staticSource,
        dest: staticDest,
        success: fs.existsSync(staticDest)
      },
      timestamp: Date.now()
    });
    // #endregion
  }
  
  // Also update deploy/index.html to match build/index.html (formatted)
  const deployIndexPath = path.join(__dirname, '../deploy/index.html');
  if (fs.existsSync(deployIndexPath)) {
    fs.writeFileSync(deployIndexPath, rootContent, 'utf8');
    
    // #region agent log
    safeLog({
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A',
      location: 'scripts/sync-index.js:175',
      message: 'Updated deploy/index.html with current build references',
      data: { 
        deployLength: rootContent.length,
        hasScriptTag: rootContent.includes(scriptSrc),
        hasLinkTag: rootContent.includes(linkHref)
      },
      timestamp: Date.now()
    });
    // #endregion
  }
} else {
  // Fallback: use build/index.html directly if we can't format it
  rootContent = buildContent;
  
  // #region agent log
  safeLog({
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'C',
    location: 'scripts/sync-index.js:190',
    message: 'Falling back to build/index.html (direct copy)',
    data: { 
      rootLength: rootContent.length,
      reason: !publicContent ? 'public/index.html not found' : (!scriptMatch || !linkMatch ? 'script/link tags not found' : 'unknown')
    },
    timestamp: Date.now()
  });
  // #endregion
}

fs.writeFileSync(rootIndexPath, rootContent, 'utf8');

// #region agent log
safeLog({
  sessionId: 'debug-session',
  runId: 'run1',
  hypothesisId: 'A',
  location: 'scripts/sync-index.js:130',
  message: 'Wrote root/index.html',
  data: { success: true, formatted: !!publicContent && !!scriptMatch && !!linkMatch },
  timestamp: Date.now()
});
// #endregion

console.log('✓ Synced all index.html files with current build references');

