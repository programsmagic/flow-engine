import { Flow } from '../index';
import { AsyncWorkflowEngine } from '../core/AsyncWorkflowEngine';
import { WorkflowPatterns } from '../patterns/WorkflowPatterns';
import { UniversalIntegrator } from '../integrations/UniversalIntegrator';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('Flow Integration Tests', () => {
  let flow: Flow;
  let testProjectPath: string;

  beforeAll(async () => {
    // Create test project structure
    testProjectPath = path.join(__dirname, '../../test-project');
    await fs.ensureDir(testProjectPath);
    
    // Create sample files for different frameworks
    await createTestProject(testProjectPath);
  });

  afterAll(async () => {
    // Cleanup test project
    await fs.remove(testProjectPath);
  });

  beforeEach(() => {
    flow = new Flow({
      framework: 'auto-detect',
      language: 'auto-detect',
      parallel: true,
      cache: true
    });
  });

  describe('Framework Detection', () => {
    test('should detect React project', async () => {
      const result = await flow.detect(testProjectPath);
      expect(result.frameworks).toContain('react');
      expect(result.languages).toContain('javascript');
    });

    test('should detect Vue project', async () => {
      const result = await flow.detect(testProjectPath);
      expect(result.frameworks).toContain('vue');
    });

    test('should detect Node.js project', async () => {
      const result = await flow.detect(testProjectPath);
      expect(result.frameworks).toContain('nodejs');
    });
  });

  describe('Workflow Generation', () => {
    test('should generate React workflows', async () => {
      const result = await flow.generate({
        input: testProjectPath,
        output: path.join(testProjectPath, 'workflows'),
        framework: 'react'
      });

      expect(result.workflows.length).toBeGreaterThan(0);
      expect(result.workflows.some(w => w.framework === 'react')).toBe(true);
    });

    test('should generate Vue workflows', async () => {
      const result = await flow.generate({
        input: testProjectPath,
        output: path.join(testProjectPath, 'workflows'),
        framework: 'vue'
      });

      expect(result.workflows.length).toBeGreaterThan(0);
      expect(result.workflows.some(w => w.framework === 'vue')).toBe(true);
    });

    test('should generate Node.js workflows', async () => {
      const result = await flow.generate({
        input: testProjectPath,
        output: path.join(testProjectPath, 'workflows'),
        framework: 'nodejs'
      });

      expect(result.workflows.length).toBeGreaterThan(0);
      expect(result.workflows.some(w => w.framework === 'nodejs')).toBe(true);
    });
  });

  describe('Async Workflow Engine', () => {
    let engine: AsyncWorkflowEngine;

    beforeEach(() => {
      engine = new AsyncWorkflowEngine({
        maxConcurrency: 5,
        timeout: 30000,
        enableCaching: true,
        enableMetrics: true
      });
    });

    test('should execute workflows asynchronously', async () => {
      const patterns = WorkflowPatterns.getAllPatterns();
      
      // Register workflows
      patterns.forEach(pattern => {
        engine.registerWorkflow(pattern);
      });

      // Execute workflows in parallel
      const executions = await engine.executeWorkflowsParallel([
        'mvc-pattern',
        'repository-pattern',
        'observer-pattern'
      ]);

      expect(executions.length).toBe(3);
      expect(executions.every(exec => exec.status === 'completed')).toBe(true);
    });

    test('should execute workflows in sequence', async () => {
      const patterns = WorkflowPatterns.getAllPatterns();
      
      patterns.forEach(pattern => {
        engine.registerWorkflow(pattern);
      });

      const executions = await engine.executeWorkflowsSequence([
        'mvc-pattern',
        'repository-pattern'
      ]);

      expect(executions.length).toBe(2);
      expect(executions[0].status).toBe('completed');
      expect(executions[1].status).toBe('completed');
    });

    test('should handle conditional execution', async () => {
      const patterns = WorkflowPatterns.getAllPatterns();
      
      patterns.forEach(pattern => {
        engine.registerWorkflow(pattern);
      });

      const executions = await engine.executeWorkflowsConditional([
        {
          condition: () => true,
          workflowId: 'mvc-pattern'
        },
        {
          condition: () => false,
          workflowId: 'repository-pattern'
        }
      ]);

      expect(executions.length).toBe(1);
      expect(executions[0].metadata.workflowId).toBe('mvc-pattern');
    });

    test('should provide execution metrics', async () => {
      const patterns = WorkflowPatterns.getAllPatterns();
      
      patterns.forEach(pattern => {
        engine.registerWorkflow(pattern);
      });

      await engine.executeWorkflow('mvc-pattern');
      
      const metrics = engine.getMetrics();
      expect(metrics.totalExecutions).toBe(1);
      expect(metrics.successfulExecutions).toBe(1);
      expect(metrics.successRate).toBe(100);
    });
  });

  describe('Universal Integration', () => {
    let integrator: UniversalIntegrator;

    beforeEach(() => {
      integrator = new UniversalIntegrator();
    });

    test('should integrate with React project', async () => {
      const result = await integrator.integrate(testProjectPath, {
        framework: 'react',
        language: 'javascript',
        projectType: 'web',
        deployment: 'docker',
        ciCd: 'github-actions',
        monitoring: 'sentry',
        database: 'postgresql',
        cache: 'redis',
        queue: 'bull'
      });

      expect(result.success).toBe(true);
      expect(result.workflows.length).toBeGreaterThan(0);
      expect(result.deploymentFiles.length).toBeGreaterThan(0);
      expect(result.documentation.length).toBeGreaterThan(0);
    });

    test('should create Docker integration', async () => {
      const files = await integrator.createDockerIntegration(testProjectPath);
      
      expect(files).toContain('Dockerfile');
      expect(files).toContain('docker-compose.yml');
      expect(files).toContain('.dockerignore');
    });

    test('should create Kubernetes integration', async () => {
      const files = await integrator.createKubernetesIntegration(testProjectPath);
      
      expect(files).toContain('k8s/deployment.yaml');
      expect(files).toContain('k8s/service.yaml');
      expect(files).toContain('k8s/configmap.yaml');
    });

    test('should create CI/CD integration', async () => {
      const files = await integrator.createCICDIntegration(testProjectPath, 'github-actions');
      
      expect(files).toContain('.github/workflows/flow.yml');
    });
  });

  describe('Performance Tests', () => {
    test('should handle large projects efficiently', async () => {
      const startTime = Date.now();
      
      const result = await flow.generate({
        input: testProjectPath,
        output: path.join(testProjectPath, 'workflows'),
        parallel: true,
        workers: 4
      });

      const executionTime = Date.now() - startTime;
      
      expect(result.workflows.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(10000); // Should complete in under 10 seconds
    });

    test('should use caching effectively', async () => {
      // First run
      const result1 = await flow.generate({
        input: testProjectPath,
        output: path.join(testProjectPath, 'workflows'),
        cache: true
      });

      // Second run (should use cache)
      const result2 = await flow.generate({
        input: testProjectPath,
        output: path.join(testProjectPath, 'workflows'),
        cache: true
      });

      expect(result1.workflows.length).toBe(result2.workflows.length);
      expect(result2.performance.cacheHits).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid input gracefully', async () => {
      const result = await flow.generate({
        input: '/nonexistent/path',
        output: path.join(testProjectPath, 'workflows')
      });

      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle parsing errors gracefully', async () => {
      // Create file with syntax errors
      const errorFile = path.join(testProjectPath, 'error.js');
      await fs.writeFile(errorFile, 'invalid javascript syntax {');
      
      const result = await flow.generate({
        input: testProjectPath,
        output: path.join(testProjectPath, 'workflows')
      });

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

async function createTestProject(projectPath: string): Promise<void> {
  // Create package.json
  await fs.writeJson(path.join(projectPath, 'package.json'), {
    name: 'test-project',
    version: '1.0.0',
    dependencies: {
      react: '^18.0.0',
      vue: '^3.0.0',
      express: '^4.18.0'
    }
  });

  // Create React component
  const reactDir = path.join(projectPath, 'src', 'components');
  await fs.ensureDir(reactDir);
  await fs.writeFile(path.join(reactDir, 'App.jsx'), `
import React, { useState, useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);

  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}

export default App;
  `);

  // Create Vue component
  const vueDir = path.join(projectPath, 'src', 'components');
  await fs.ensureDir(vueDir);
  await fs.writeFile(path.join(vueDir, 'App.vue'), `
<template>
  <div>
    <h1>{{ message }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      message: 'Hello Vue!',
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++;
    }
  },
  mounted() {
    console.log('Component mounted');
  }
}
</script>
  `);

  // Create Node.js server
  const serverDir = path.join(projectPath, 'server');
  await fs.ensureDir(serverDir);
  await fs.writeFile(path.join(serverDir, 'index.js'), `
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  res.json({ id: 1, name, email });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
  `);
}
