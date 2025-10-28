#!/usr/bin/env node

/**
 * Flow Engine CLI - Simple workflow framework for Node.js
 */

import { createFlow } from './SimpleFlowEngine';
import { runAllExamples } from './examples/SimpleExamples';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  console.log('🌊 Flow Engine - Simple workflow framework for Node.js\n');

  switch (command) {
    case 'demo':
    case 'examples':
      console.log('Running Flow Engine examples...\n');
      await runAllExamples();
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      if (!command) {
        showHelp();
      } else {
        console.log(`❌ Unknown command: ${command}`);
        console.log('Run "flow-engine help" for available commands.');
        process.exit(1);
      }
  }
}

function showHelp() {
  console.log(`
🌊 Flow Engine - Simple workflow framework for Node.js

USAGE:
  flow-engine <command>

COMMANDS:
  demo, examples    Run example workflows
  help, --help, -h  Show this help message

EXAMPLES:
  # Run example workflows
  flow-engine demo

  # Show help
  flow-engine help

QUICK START:
  npm install flow-engine-simple
  
  import { createFlow } from 'flow-engine-simple';
  
  const flow = createFlow()
    .step('validate', async (data) => { /* validation */ })
    .step('process', async (data) => { /* processing */ });
  
  const result = await flow.execute(inputData);

DOCUMENTATION:
  https://programsmagic.github.io/flow-engine
`);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the CLI
main().catch((error) => {
  console.error('❌ CLI Error:', error);
  process.exit(1);
});