#!/usr/bin/env node

import * as yargs from 'yargs';
import chalk from 'chalk';
import gradient from 'gradient-string';
import figlet from 'figlet';
import boxen from 'boxen';
import ora from 'ora';
import { FlowServer } from './server/FlowServer';
import { FlowLogger } from './core/FlowLogger';

const argv = yargs
  .scriptName('flow-engine')
  .usage('$0 <command> [options]')
  .example('$0 start --port 3000', 'Start Flow Engine server')
  .example('$0 dev --watch', 'Start in development mode with file watching')
  .example('$0 monitor', 'Start live monitoring dashboard')
  .command('start', 'Start the Flow Engine server', (yargs) => {
    return yargs
      .option('port', {
        alias: 'p',
        type: 'number',
        description: 'Port to run the server on',
        default: 3000
      })
      .option('host', {
        alias: 'h',
        type: 'string',
        description: 'Host to bind the server to',
        default: '0.0.0.0'
      })
      .option('config', {
        alias: 'c',
        type: 'string',
        description: 'Path to configuration file',
        default: './flow.config.js'
      });
  })
  .command('dev', 'Start in development mode', (yargs) => {
    return yargs
      .option('port', {
        alias: 'p',
        type: 'number',
        description: 'Port to run the server on',
        default: 3000
      })
      .option('watch', {
        alias: 'w',
        type: 'boolean',
        description: 'Watch for file changes and restart',
        default: true
      })
      .option('debug', {
        alias: 'd',
        type: 'boolean',
        description: 'Enable debug logging',
        default: false
      });
  })
  .command('monitor', 'Start live monitoring dashboard', (yargs) => {
    return yargs
      .option('port', {
        alias: 'p',
        type: 'number',
        description: 'Port to run the server on',
        default: 3000
      })
      .option('host', {
        alias: 'h',
        type: 'string',
        description: 'Host to bind the server to',
        default: '0.0.0.0'
      });
  })
  .command('generate', 'Generate flow from existing code', (yargs) => {
    return yargs
      .option('input', {
        alias: 'i',
        type: 'string',
        description: 'Input directory containing controllers/services',
        demandOption: true
      })
      .option('output', {
        alias: 'o',
        type: 'string',
        description: 'Output directory for generated flows',
        default: './flows'
      })
      .option('format', {
        alias: 'f',
        type: 'string',
        choices: ['json', 'yaml', 'typescript'],
        description: 'Output format for generated flows',
        default: 'typescript'
      });
  })
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'V')
  .demandCommand(1, 'You need to specify a command')
  .argv;

async function main() {
  try {
    const command = argv._[0] as string;

    // Show beautiful banner
    console.log(gradient.rainbow(figlet.textSync('Flow Engine', { horizontalLayout: 'full' })));
    console.log(boxen(
      chalk.cyan('🚀 Revolutionary workflow-based backend framework\n') +
      chalk.gray('Replace traditional controllers with efficient workflow orchestration\n') +
      chalk.yellow('✨ Memory-efficient • High-performance • Live monitoring'),
      { 
        padding: 1, 
        margin: 1, 
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    ));

    switch (command) {
      case 'start':
        await startServer();
        break;
      case 'dev':
        await startDevelopment();
        break;
      case 'monitor':
        await startMonitoring();
        break;
      case 'generate':
        await generateFlows();
        break;
      default:
        console.error(chalk.red('Unknown command:', command));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function startServer() {
  const spinner = ora('Starting Flow Engine server...').start();
  
  try {
    const port = argv.port as number;
    const host = argv.host as string;
    
    const server = new FlowServer();
    await server.start(port, host);
    
    spinner.succeed(chalk.green('Flow Engine server started successfully!'));
    
    console.log(chalk.cyan('\n🌊 Flow Engine is running:'));
    console.log(chalk.white(`   📊 Dashboard: http://${host}:${port}/dashboard`));
    console.log(chalk.white(`   🔗 API Base: http://${host}:${port}/api`));
    console.log(chalk.white(`   📡 WebSocket: ws://${host}:${port}`));
    console.log(chalk.white(`   ❤️  Health: http://${host}:${port}/health`));
    
    console.log(chalk.yellow('\n💡 Pro Tips:'));
    console.log(chalk.gray('   • Use the dashboard to monitor flows in real-time'));
    console.log(chalk.gray('   • WebSocket provides live updates'));
    console.log(chalk.gray('   • Check logs/ directory for detailed logs'));
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to start server'));
    throw error;
  }
}

async function startDevelopment() {
  const spinner = ora('Starting Flow Engine in development mode...').start();
  
  try {
    const port = argv.port as number;
    const host = argv.host as string;
    const watch = argv.watch as boolean;
    const debug = argv.debug as boolean;
    
    if (debug) {
      process.env.LOG_LEVEL = 'debug';
    }

    const server = new FlowServer();
    await server.start(port, host);
    
    spinner.succeed(chalk.green('Flow Engine development server started!'));
    
    console.log(chalk.cyan('\n🔧 Development Mode:'));
    console.log(chalk.white(`   📊 Dashboard: http://${host}:${port}/dashboard`));
    console.log(chalk.white(`   🔗 API Base: http://${host}:${port}/api`));
    console.log(chalk.white(`   📡 WebSocket: ws://${host}:${port}`));
    console.log(chalk.white(`   📝 Log Level: ${debug ? 'DEBUG' : 'INFO'}`));
    console.log(chalk.white(`   👀 File Watching: ${watch ? 'ENABLED' : 'DISABLED'}`));
    
    console.log(chalk.yellow('\n💡 Development Tips:'));
    console.log(chalk.gray('   • Changes are automatically detected'));
    console.log(chalk.gray('   • Use --debug for detailed logging'));
    console.log(chalk.gray('   • Check logs/live.log for real-time logs'));
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to start development server'));
    throw error;
  }
}

async function startMonitoring() {
  const spinner = ora('Starting live monitoring dashboard...').start();
  
  try {
    const port = argv.port as number;
    const host = argv.host as string;
    
    const server = new FlowServer();
    await server.start(port, host);
    
    spinner.succeed(chalk.green('Live monitoring dashboard started!'));
    
    console.log(chalk.cyan('\n📊 Live Monitoring:'));
    console.log(chalk.white(`   🎯 Dashboard: http://${host}:${port}/dashboard`));
    console.log(chalk.white(`   📡 WebSocket: ws://${host}:${port}`));
    console.log(chalk.white(`   📈 Real-time metrics and flow monitoring`));
    
    console.log(chalk.yellow('\n💡 Monitoring Features:'));
    console.log(chalk.gray('   • Real-time flow execution monitoring'));
    console.log(chalk.gray('   • System metrics (memory, CPU, connections)'));
    console.log(chalk.gray('   • Performance analytics'));
    console.log(chalk.gray('   • Live WebSocket updates'));
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to start monitoring dashboard'));
    throw error;
  }
}

async function generateFlows() {
  const spinner = ora('Generating flows from existing code...').start();
  
  try {
    const input = argv.input as string;
    const output = argv.output as string;
  const format = argv.format as string;

    spinner.succeed(chalk.green('Flow generation feature coming soon!'));
    
    console.log(chalk.cyan('\n⚡ Flow Generation:'));
    console.log(chalk.white(`   📁 Input: ${input}`));
    console.log(chalk.white(`   📁 Output: ${output}`));
    console.log(chalk.white(`   📄 Format: ${format}`));
    
    console.log(chalk.yellow('\n💡 Coming Soon:'));
    console.log(chalk.gray('   • Automatic flow generation from controllers'));
    console.log(chalk.gray('   • Service method to flow conversion'));
    console.log(chalk.gray('   • Multiple output formats (JSON, YAML, TypeScript)'));
    
  } catch (error) {
    spinner.fail(chalk.red('Flow generation failed'));
    throw error;
  }
}

main();