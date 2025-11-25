#!/usr/bin/env node
/**
 * Script to demonstrate the HTML parser functionality
 * Run with: node scripts/demo-parser.js
 */

// Use dynamic import since we're importing TypeScript
(async () => {
  try {
    // Dynamic import of the demo module
    const demoModule = await import('../lib/parser/demo.ts');

    // Run all demonstrations
    demoModule.runAllDemos();
  } catch (error) {
    console.error('Error running parser demo:', error);
    process.exit(1);
  }
})();
