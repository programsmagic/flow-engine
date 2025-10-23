import * as fs from 'fs-extra';
import * as path from 'path';
import { Workflow, ComponentInfo, WorkflowResult } from '../types';
import { AsyncWorkflowEngine } from '../core/AsyncWorkflowEngine';
import { WorkflowPatterns } from '../patterns/WorkflowPatterns';

export interface IntegrationOptions {
  framework: string;
  language: string;
  projectType: 'web' | 'mobile' | 'desktop' | 'api' | 'microservice' | 'library';
  deployment: 'local' | 'docker' | 'kubernetes' | 'serverless' | 'cloud';
  ciCd: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'azure-devops' | 'circleci';
  monitoring: 'prometheus' | 'datadog' | 'newrelic' | 'sentry' | 'custom';
  database: 'mysql' | 'postgresql' | 'mongodb' | 'redis' | 'elasticsearch' | 'none';
  cache: 'redis' | 'memcached' | 'memory' | 'none';
  queue: 'rabbitmq' | 'kafka' | 'sqs' | 'bull' | 'agenda' | 'none';
}

export interface IntegrationResult {
  success: boolean;
  workflows: Workflow[];
  configurations: Record<string, any>;
  deploymentFiles: string[];
  documentation: string[];
  errors: string[];
  warnings: string[];
}

export class UniversalIntegrator {
  private workflowEngine: AsyncWorkflowEngine;
  private patterns: WorkflowPatterns;

  constructor() {
    this.workflowEngine = new AsyncWorkflowEngine();
    this.patterns = new WorkflowPatterns();
  }

  /**
   * Integrate Flow with any project type
   */
  public async integrate(
    projectPath: string,
    options: IntegrationOptions
  ): Promise<IntegrationResult> {
    const result: IntegrationResult = {
      success: false,
      workflows: [],
      configurations: {},
      deploymentFiles: [],
      documentation: [],
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Analyze project structure
      const projectAnalysis = await this.analyzeProject(projectPath, options);
      
      // Step 2: Generate appropriate workflows
      const workflows = await this.generateWorkflows(projectAnalysis, options);
      
      // Step 3: Create configuration files
      const configurations = await this.createConfigurations(projectPath, options);
      
      // Step 4: Generate deployment files
      const deploymentFiles = await this.generateDeploymentFiles(projectPath, options);
      
      // Step 5: Create documentation
      const documentation = await this.generateDocumentation(projectPath, options);
      
      // Step 6: Register workflows with engine
      workflows.forEach(workflow => {
        this.workflowEngine.registerWorkflow(workflow);
      });

      result.success = true;
      result.workflows = workflows;
      result.configurations = configurations;
      result.deploymentFiles = deploymentFiles;
      result.documentation = documentation;

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  /**
   * Create CI/CD integration
   */
  public async createCICDIntegration(
    projectPath: string,
    ciCdType: IntegrationOptions['ciCd']
  ): Promise<string[]> {
    const files: string[] = [];
    
    switch (ciCdType) {
      case 'github-actions':
        files.push(await this.createGitHubActions(projectPath));
        break;
      case 'gitlab-ci':
        files.push(await this.createGitLabCI(projectPath));
        break;
      case 'jenkins':
        files.push(await this.createJenkinsFile(projectPath));
        break;
      case 'azure-devops':
        files.push(await this.createAzureDevOps(projectPath));
        break;
      case 'circleci':
        files.push(await this.createCircleCI(projectPath));
        break;
    }

    return files;
  }

  /**
   * Create Docker integration
   */
  public async createDockerIntegration(projectPath: string): Promise<string[]> {
    const files: string[] = [];
    
    // Dockerfile
    const dockerfile = await this.generateDockerfile(projectPath);
    await fs.writeFile(path.join(projectPath, 'Dockerfile'), dockerfile);
    files.push('Dockerfile');
    
    // docker-compose.yml
    const dockerCompose = await this.generateDockerCompose(projectPath);
    await fs.writeFile(path.join(projectPath, 'docker-compose.yml'), dockerCompose);
    files.push('docker-compose.yml');
    
    // .dockerignore
    const dockerIgnore = await this.generateDockerIgnore(projectPath);
    await fs.writeFile(path.join(projectPath, '.dockerignore'), dockerIgnore);
    files.push('.dockerignore');
    
    return files;
  }

  /**
   * Create Kubernetes integration
   */
  public async createKubernetesIntegration(projectPath: string): Promise<string[]> {
    const files: string[] = [];
    const k8sDir = path.join(projectPath, 'k8s');
    await fs.ensureDir(k8sDir);
    
    // Deployment
    const deployment = await this.generateK8sDeployment(projectPath);
    await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);
    files.push('k8s/deployment.yaml');
    
    // Service
    const service = await this.generateK8sService(projectPath);
    await fs.writeFile(path.join(k8sDir, 'service.yaml'), service);
    files.push('k8s/service.yaml');
    
    // ConfigMap
    const configMap = await this.generateK8sConfigMap(projectPath);
    await fs.writeFile(path.join(k8sDir, 'configmap.yaml'), configMap);
    files.push('k8s/configmap.yaml');
    
    return files;
  }

  /**
   * Create monitoring integration
   */
  public async createMonitoringIntegration(
    projectPath: string,
    monitoringType: IntegrationOptions['monitoring']
  ): Promise<string[]> {
    const files: string[] = [];
    
    switch (monitoringType) {
      case 'prometheus':
        files.push(...await this.createPrometheusIntegration(projectPath));
        break;
      case 'datadog':
        files.push(...await this.createDatadogIntegration(projectPath));
        break;
      case 'newrelic':
        files.push(...await this.createNewRelicIntegration(projectPath));
        break;
      case 'sentry':
        files.push(...await this.createSentryIntegration(projectPath));
        break;
    }
    
    return files;
  }

  private async analyzeProject(projectPath: string, options: IntegrationOptions): Promise<any> {
    // Analyze project structure and detect patterns
    const packageJsonPath = path.join(projectPath, 'package.json');
    let packageJson: any = {};
    
    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await fs.readJson(packageJsonPath);
    }
    
    return {
      name: packageJson.name || path.basename(projectPath),
      version: packageJson.version || '1.0.0',
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      scripts: packageJson.scripts || {},
      framework: options.framework,
      language: options.language,
      projectType: options.projectType
    };
  }

  private async generateWorkflows(projectAnalysis: any, options: IntegrationOptions): Promise<Workflow[]> {
    const workflows: Workflow[] = [];
    
    // Get appropriate patterns for the framework
    const patterns = this.patterns.getPatternsByFramework(options.framework);
    
    // Add framework-specific workflows
    workflows.push(...patterns);
    
    // Add project-type specific workflows
    if (options.projectType === 'api') {
      workflows.push(this.patterns.createAPIGatewayPattern());
    }
    
    if (options.framework === 'react') {
      workflows.push(this.patterns.createReactLifecyclePattern());
    }
    
    if (options.framework === 'nodejs') {
      workflows.push(this.patterns.createExpressMiddlewarePattern());
    }
    
    return workflows;
  }

  private async createConfigurations(projectPath: string, options: IntegrationOptions): Promise<Record<string, any>> {
    const configurations: Record<string, any> = {};
    
    // Flow configuration
    configurations['flow.config.js'] = {
      framework: options.framework,
      language: options.language,
      projectType: options.projectType,
      deployment: options.deployment,
      monitoring: options.monitoring,
      database: options.database,
      cache: options.cache,
      queue: options.queue
    };
    
    // Environment configuration
    configurations['.env.example'] = this.generateEnvExample(options);
    
    return configurations;
  }

  private async generateDeploymentFiles(projectPath: string, options: IntegrationOptions): Promise<string[]> {
    const files: string[] = [];
    
    // Generate deployment files based on deployment type
    switch (options.deployment) {
      case 'docker':
        files.push(...await this.createDockerIntegration(projectPath));
        break;
      case 'kubernetes':
        files.push(...await this.createKubernetesIntegration(projectPath));
        break;
      case 'serverless':
        files.push(...await this.createServerlessIntegration(projectPath));
        break;
    }
    
    return files;
  }

  private async generateDocumentation(projectPath: string, options: IntegrationOptions): Promise<string[]> {
    const files: string[] = [];
    const docsDir = path.join(projectPath, 'docs');
    await fs.ensureDir(docsDir);
    
    // README.md
    const readme = await this.generateREADME(projectPath, options);
    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
    files.push('README.md');
    
    // API Documentation
    const apiDocs = await this.generateAPIDocs(projectPath, options);
    await fs.writeFile(path.join(docsDir, 'api.md'), apiDocs);
    files.push('docs/api.md');
    
    // Deployment Guide
    const deploymentGuide = await this.generateDeploymentGuide(projectPath, options);
    await fs.writeFile(path.join(docsDir, 'deployment.md'), deploymentGuide);
    files.push('docs/deployment.md');
    
    return files;
  }

  // Helper methods for generating specific files
  private async generateDockerfile(projectPath: string): Promise<string> {
    return `# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Install Flow globally
RUN npm install -g flow

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/index.js"]`;
  }

  private async generateDockerCompose(projectPath: string): Promise<string> {
    return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - redis
      - postgres
    volumes:
      - ./workflows:/app/workflows

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: flow_db
      POSTGRES_USER: flow_user
      POSTGRES_PASSWORD: flow_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:`;
  }

  private generateEnvExample(options: IntegrationOptions): string {
    return `# Flow Configuration
FLOW_FRAMEWORK=${options.framework}
FLOW_LANGUAGE=${options.language}
FLOW_PROJECT_TYPE=${options.projectType}

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/flow_db
REDIS_URL=redis://localhost:6379

# Monitoring
MONITORING_TYPE=${options.monitoring}
SENTRY_DSN=your_sentry_dsn_here

# Deployment
DEPLOYMENT_TYPE=${options.deployment}
NODE_ENV=production
PORT=3000`;
  }

  private async generateREADME(projectPath: string, options: IntegrationOptions): Promise<string> {
    return `# Flow Integration

This project has been integrated with Flow - the universal workflow generator.

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Generate workflows
flow generate

# Start development
npm run dev
\`\`\`

## 📊 Generated Workflows

This project includes the following workflow patterns:
- MVC Pattern
- Repository Pattern
- Observer Pattern
- ${options.framework} specific patterns

## 🛠️ Configuration

Framework: ${options.framework}
Language: ${options.language}
Project Type: ${options.projectType}
Deployment: ${options.deployment}

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Flow Documentation](https://flow-tool.dev)

## 🔧 Commands

\`\`\`bash
# Generate workflows
flow generate

# Analyze project
flow analyze

# Optimize code
flow optimize
\`\`\`

Generated by Flow - Universal Workflow Generator`;
  }

  // Placeholder methods for other integrations
  private async createGitHubActions(projectPath: string): Promise<string> {
    return '.github/workflows/flow.yml';
  }

  private async createGitLabCI(projectPath: string): Promise<string> {
    return '.gitlab-ci.yml';
  }

  private async createJenkinsFile(projectPath: string): Promise<string> {
    return 'Jenkinsfile';
  }

  private async createAzureDevOps(projectPath: string): Promise<string> {
    return 'azure-pipelines.yml';
  }

  private async createCircleCI(projectPath: string): Promise<string> {
    return '.circleci/config.yml';
  }

  private async createServerlessIntegration(projectPath: string): Promise<string[]> {
    return ['serverless.yml', 'lambda.js'];
  }

  private async generateAPIDocs(projectPath: string, options: IntegrationOptions): Promise<string> {
    return `# API Documentation

Generated by Flow for ${options.framework} project.

## Endpoints

### Workflows
- GET /api/workflows - List all workflows
- POST /api/workflows - Create new workflow
- GET /api/workflows/:id - Get specific workflow

### Analysis
- GET /api/analysis - Get project analysis
- POST /api/analysis - Run new analysis

## Authentication

All endpoints require authentication via JWT token.`;
  }

  private async generateDeploymentGuide(projectPath: string, options: IntegrationOptions): Promise<string> {
    return `# Deployment Guide

## ${options.deployment.toUpperCase()} Deployment

This project is configured for ${options.deployment} deployment.

### Prerequisites
- Node.js 18+
- Flow CLI installed globally

### Steps
1. Install dependencies: \`npm install\`
2. Generate workflows: \`flow generate\`
3. Build project: \`npm run build\`
4. Deploy using ${options.deployment} configuration

### Environment Variables
See .env.example for required environment variables.

### Monitoring
Monitoring is configured for ${options.monitoring}.`;
  }

  private async generateK8sDeployment(projectPath: string): Promise<string> {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: flow-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flow-app
  template:
    metadata:
      labels:
        app: flow-app
    spec:
      containers:
      - name: flow-app
        image: flow-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"`;
  }

  private async generateK8sService(projectPath: string): Promise<string> {
    return `apiVersion: v1
kind: Service
metadata:
  name: flow-service
spec:
  selector:
    app: flow-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer`;
  }

  private async generateK8sConfigMap(projectPath: string): Promise<string> {
    return `apiVersion: v1
kind: ConfigMap
metadata:
  name: flow-config
data:
  NODE_ENV: "production"
  FLOW_ENABLED: "true"`;
  }

  private async createPrometheusIntegration(projectPath: string): Promise<string[]> {
    return ['prometheus.yml', 'grafana-dashboard.json'];
  }

  private async createDatadogIntegration(projectPath: string): Promise<string[]> {
    return ['datadog.yaml', 'dd-trace.js'];
  }

  private async createNewRelicIntegration(projectPath: string): Promise<string[]> {
    return ['newrelic.js', 'newrelic.yml'];
  }

  private async createSentryIntegration(projectPath: string): Promise<string[]> {
    return ['sentry.js', 'sentry.properties'];
  }
}
