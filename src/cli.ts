#!/usr/bin/env node

import * as yargs from 'yargs';
import * as path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import { WorkflowProcessor } from './core/WorkflowProcessor';
import { ParserOptions } from './types';
import { FrameworkDetector } from './core/FrameworkDetector';

const argv = yargs
  .scriptName('flow')
  .usage('$0 <command> [options]')
  .command('generate', 'Generate workflow files from any project', (yargs) => {
    return yargs
      .option('input', {
        alias: 'i',
        type: 'string',
        description: 'Input path to project directory',
        default: './src',
        demandOption: true
      })
      .option('output', {
        alias: 'o',
        type: 'string',
        description: 'Output directory for generated files',
        default: './workflows',
        demandOption: true
      })
      .option('format', {
        alias: 'f',
        type: 'string',
        choices: ['json', 'yaml', 'mermaid', 'all'],
        description: 'Output format',
        default: 'all'
      })
      .option('diagram', {
        alias: 'd',
        type: 'boolean',
        description: 'Generate visual diagrams',
        default: true
      })
      .option('diagram-format', {
        type: 'string',
        choices: ['png', 'svg', 'pdf'],
        description: 'Diagram output format',
        default: 'png'
      })
      .option('include-comments', {
        type: 'boolean',
        description: 'Include comments in workflow',
        default: true
      })
      .option('include-validation', {
        type: 'boolean',
        description: 'Include validation rules',
        default: true
      })
      .option('include-database', {
        type: 'boolean',
        description: 'Include database queries',
        default: true
      })
      .option('include-api', {
        type: 'boolean',
        description: 'Include API calls',
        default: true
      })
      .option('framework', {
        type: 'string',
        description: 'Force specific framework (auto-detected if not specified)',
        choices: ['react', 'vue', 'angular', 'nodejs', 'nextjs', 'svelte']
      })
      .option('language', {
        type: 'string',
        description: 'Force specific language (auto-detected if not specified)',
        choices: ['javascript', 'typescript']
      })
      .option('parallel', {
        type: 'boolean',
        description: 'Enable parallel processing',
        default: true
      })
      .option('cache', {
        type: 'boolean',
        description: 'Enable caching for better performance',
        default: true
      })
      .option('workers', {
        type: 'number',
        description: 'Number of worker threads for parallel processing',
        default: 4
      })
      .option('optimize', {
        type: 'boolean',
        description: 'Include code optimization suggestions',
        default: false
      })
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Verbose output',
        default: false
      });
  })
  .command('analyze', 'Analyze project without generating files', (yargs) => {
    return yargs
      .option('input', {
        alias: 'i',
        type: 'string',
        description: 'Input path to project directory',
        default: './src',
        demandOption: true
      })
      .option('framework', {
        type: 'string',
        description: 'Force specific framework (auto-detected if not specified)',
        choices: ['react', 'vue', 'angular', 'nodejs', 'nextjs', 'svelte']
      })
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Verbose output',
        default: false
      });
  })
  .command('detect', 'Detect frameworks and languages in project', (yargs) => {
    return yargs
      .option('input', {
        alias: 'i',
        type: 'string',
        description: 'Input path to project directory',
        default: './src',
        demandOption: true
      });
  })
  .command('optimize', 'Analyze and suggest optimizations for project', (yargs) => {
    return yargs
      .option('input', {
        alias: 'i',
        type: 'string',
        description: 'Input path to project directory',
        default: './src',
        demandOption: true
      })
      .option('output', {
        alias: 'o',
        type: 'string',
        description: 'Output directory for optimization report',
        default: './optimization-report'
      })
      .option('format', {
        alias: 'f',
        type: 'string',
        choices: ['json', 'yaml', 'html', 'all'],
        description: 'Output format for optimization report',
        default: 'all'
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

    switch (command) {
      case 'generate':
        await generateWorkflows();
        break;
      case 'analyze':
        await analyzeProject();
        break;
      case 'detect':
        await detectFrameworks();
        break;
      case 'optimize':
        await optimizeProject();
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

async function generateWorkflows() {
  const options: ParserOptions = {
    inputPath: argv.input as string,
    outputPath: argv.output as string,
    format: argv.format as 'json' | 'yaml' | 'mermaid' | 'all',
    includeComments: argv.includeComments as boolean,
    includeValidation: argv.includeValidation as boolean,
    includeDatabaseQueries: argv.includeDatabase as boolean,
    includeApiCalls: argv.includeApi as boolean,
    generateDiagram: argv.diagram as boolean,
    diagramFormat: argv.diagramFormat as 'png' | 'svg' | 'pdf',
    framework: argv.framework as string,
    language: argv.language as string,
    parallel: argv.parallel as boolean,
    cache: argv.cache as boolean,
    workers: argv.workers as number,
    optimize: argv.optimize as boolean
  };

  console.log(chalk.blue('🌊 Flow - Universal Workflow Generator'));
  console.log(chalk.gray('====================================='));
  console.log(chalk.white(`Input: ${options.inputPath}`));
  console.log(chalk.white(`Output: ${options.outputPath}`));
  console.log(chalk.white(`Format: ${options.format}`));
  console.log(chalk.white(`Framework: ${options.framework || 'auto-detect'}`));
  console.log(chalk.white(`Language: ${options.language || 'auto-detect'}`));
  console.log(chalk.white(`Parallel: ${options.parallel}`));
  console.log(chalk.white(`Cache: ${options.cache}`));
  console.log(chalk.white(`Workers: ${options.workers}`));
  console.log('');

  // Validate input path
  if (!await fs.pathExists(options.inputPath)) {
    console.error(chalk.red(`❌ Input path does not exist: ${options.inputPath}`));
    process.exit(1);
  }

  // Auto-detect framework if not specified
  if (!options.framework) {
    console.log(chalk.yellow('🔍 Auto-detecting frameworks...'));
    const detectedFrameworks = await FrameworkDetector.detectFramework(options.inputPath);
    console.log(chalk.green(`✅ Detected frameworks: ${detectedFrameworks.join(', ')}`));
  }

  // Create output directory
  await fs.ensureDir(options.outputPath);

  const processor = new WorkflowProcessor();
  const result = await processor.processProject(options);

  console.log(chalk.green(`✅ Successfully generated ${result.workflows.length} workflows`));
  console.log(chalk.gray(`📁 Output directory: ${options.outputPath}`));
  console.log(chalk.gray(`⏱️  Execution time: ${result.performance.executionTime}ms`));
  console.log(chalk.gray(`💾 Memory usage: ${Math.round(result.performance.memoryUsage / 1024 / 1024)}MB`));
  console.log(chalk.gray(`📊 Cache hits: ${result.performance.cacheHits}`));
  console.log(chalk.gray(`📊 Cache misses: ${result.performance.cacheMisses}`));
  
  if (result.errors.length > 0) {
    console.log(chalk.red(`❌ Errors: ${result.errors.length}`));
    result.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
  }
  
  if (result.warnings.length > 0) {
    console.log(chalk.yellow(`⚠️  Warnings: ${result.warnings.length}`));
    result.warnings.forEach(warning => console.log(chalk.yellow(`  • ${warning}`)));
  }
}

async function analyzeProject() {
  const inputPath = argv.input as string;
  const verbose = argv.verbose as boolean;

  console.log(chalk.blue('🔍 Flow Analyzer'));
  console.log(chalk.gray('================'));
  console.log(chalk.white(`Input: ${inputPath}`));
  console.log('');

  // Validate input path
  if (!await fs.pathExists(inputPath)) {
    console.error(chalk.red(`❌ Input path does not exist: ${inputPath}`));
    process.exit(1);
  }

  const analysis = await FrameworkDetector.analyzeProjectStructure(inputPath);

  console.log(chalk.green(`✅ Analysis complete`));
  console.log(chalk.white(`📊 Frameworks: ${analysis.frameworks.join(', ')}`));
  console.log(chalk.white(`📊 Languages: ${analysis.languages.join(', ')}`));
  console.log(chalk.white(`📊 Total files: ${analysis.structure.files}`));
  console.log(chalk.white(`📊 Total directories: ${analysis.structure.directories.length}`));

  if (verbose) {
    console.log(chalk.cyan('\n📁 Directory structure:'));
    analysis.structure.directories.slice(0, 10).forEach(dir => {
      console.log(chalk.gray(`  • ${path.relative(inputPath, dir)}`));
    });
    if (analysis.structure.directories.length > 10) {
      console.log(chalk.gray(`  ... and ${analysis.structure.directories.length - 10} more`));
    }
  }
}

async function detectFrameworks() {
  const inputPath = argv.input as string;

  console.log(chalk.blue('🔍 Flow Framework Detector'));
  console.log(chalk.gray('=========================='));
  console.log(chalk.white(`Input: ${inputPath}`));
  console.log('');

  // Validate input path
  if (!await fs.pathExists(inputPath)) {
    console.error(chalk.red(`❌ Input path does not exist: ${inputPath}`));
    process.exit(1);
  }

  const detectedFrameworks = await FrameworkDetector.detectFramework(inputPath);
  const analysis = await FrameworkDetector.analyzeProjectStructure(inputPath);

  console.log(chalk.green(`✅ Detection complete`));
  console.log(chalk.white(`📊 Detected frameworks: ${detectedFrameworks.join(', ')}`));
  console.log(chalk.white(`📊 Detected languages: ${analysis.languages.join(', ')}`));
  console.log(chalk.white(`📊 Total files: ${analysis.structure.files}`));

  // Show framework details
  detectedFrameworks.forEach(framework => {
    const config = FrameworkDetector.getFrameworkConfig(framework);
    if (config) {
      console.log(chalk.cyan(`\n📦 ${config.name} (${framework}):`));
      console.log(chalk.gray(`  Language: ${config.language}`));
      console.log(chalk.gray(`  Extensions: ${config.extensions.join(', ')}`));
    }
  });
}

async function optimizeProject() {
  const inputPath = argv.input as string;
  const outputPath = argv.output as string;
  const format = argv.format as string;

  console.log(chalk.blue('⚡ Flow Optimizer'));
  console.log(chalk.gray('================'));
  console.log(chalk.white(`Input: ${inputPath}`));
  console.log(chalk.white(`Output: ${outputPath}`));
  console.log(chalk.white(`Format: ${format}`));
  console.log('');

  // Validate input path
  if (!await fs.pathExists(inputPath)) {
    console.error(chalk.red(`❌ Input path does not exist: ${inputPath}`));
    process.exit(1);
  }

  // Create output directory
  await fs.ensureDir(outputPath);

  const processor = new WorkflowProcessor();
  const result = await processor.processProject({
    inputPath,
    outputPath,
    format: 'json',
    includeComments: true,
    includeValidation: true,
    includeDatabaseQueries: true,
    includeApiCalls: true,
    generateDiagram: false,
    diagramFormat: 'png',
    parallel: true,
    cache: true,
    optimize: true
  });

  console.log(chalk.green(`✅ Optimization analysis complete`));
  console.log(chalk.gray(`📁 Report saved to: ${outputPath}`));
  console.log(chalk.gray(`⏱️  Execution time: ${result.performance.executionTime}ms`));
}

main();
