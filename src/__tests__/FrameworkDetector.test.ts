import { FrameworkDetector } from '../core/FrameworkDetector';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('FrameworkDetector', () => {
  const testProjectPath = path.join(__dirname, '../../test-project');

  beforeAll(async () => {
    // Create a test project structure
    await fs.ensureDir(testProjectPath);
    await fs.writeJson(path.join(testProjectPath, 'package.json'), {
      name: 'test-project',
      dependencies: {
        react: '^18.0.0',
        'vue': '^3.0.0',
        'express': '^4.18.0'
      }
    });
    
    // Create some test files
    await fs.ensureDir(path.join(testProjectPath, 'src'));
    await fs.writeFile(path.join(testProjectPath, 'src/App.jsx'), 'import React from "react";');
    await fs.writeFile(path.join(testProjectPath, 'src/App.vue'), '<template><div>Hello Vue</div></template>');
    await fs.writeFile(path.join(testProjectPath, 'src/server.js'), 'const express = require("express");');
  });

  afterAll(async () => {
    // Clean up test project
    await fs.remove(testProjectPath);
  });

  test('should detect React framework', async () => {
    const frameworks = await FrameworkDetector.detectFramework(testProjectPath);
    expect(frameworks).toContain('react');
  });

  test('should detect Vue framework', async () => {
    const frameworks = await FrameworkDetector.detectFramework(testProjectPath);
    expect(frameworks).toContain('vue');
  });

  test('should detect Node.js framework', async () => {
    const frameworks = await FrameworkDetector.detectFramework(testProjectPath);
    expect(frameworks).toContain('nodejs');
  });

  test('should analyze project structure', async () => {
    const analysis = await FrameworkDetector.analyzeProjectStructure(testProjectPath);
    expect(analysis.frameworks).toContain('react');
    expect(analysis.frameworks).toContain('vue');
    expect(analysis.frameworks).toContain('nodejs');
    expect(analysis.languages).toContain('javascript');
    expect(analysis.structure.files).toBeGreaterThan(0);
  });

  test('should get framework config', () => {
    const reactConfig = FrameworkDetector.getFrameworkConfig('react');
    expect(reactConfig).toBeDefined();
    expect(reactConfig?.name).toBe('React');
    expect(reactConfig?.language).toBe('javascript');
    expect(reactConfig?.extensions).toContain('.jsx');
    expect(reactConfig?.extensions).toContain('.tsx');
  });

  test('should return all frameworks', () => {
    const allFrameworks = FrameworkDetector.getAllFrameworks();
    expect(allFrameworks.length).toBeGreaterThan(0);
    expect(allFrameworks.some(f => f.name === 'React')).toBe(true);
    expect(allFrameworks.some(f => f.name === 'Vue')).toBe(true);
    expect(allFrameworks.some(f => f.name === 'Node.js')).toBe(true);
  });
});
