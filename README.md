# 🌊 Flow

**The trendy universal workflow generator** - Generate beautiful workflow diagrams from any npm project. Whether it's React, Vue.js, Node.js, or any other framework - Flow has you covered!

## 🚀 Features

### Universal Support
- **Frontend Frameworks**: React, Vue.js, Angular, Svelte, Next.js
- **Backend Frameworks**: Node.js, Express, NestJS, Fastify
- **Languages**: JavaScript, TypeScript, JSX, TSX, Vue SFC
- **Auto-Detection**: Automatically detects frameworks and languages

### Advanced Analysis
- **Code Parsing**: Extracts methods, functions, classes, and components
- **Dependency Analysis**: Identifies imports, exports, and dependencies
- **API Call Detection**: Finds HTTP requests and API integrations
- **Database Query Analysis**: Identifies database operations and ORM usage
- **Validation Rules**: Extracts form validation and data validation logic
- **Lifecycle Events**: Detects framework-specific lifecycle methods

### Performance & Scalability
- **Parallel Processing**: Multi-threaded execution for large codebases
- **Intelligent Caching**: Reduces processing time for repeated operations
- **Memory Optimization**: Efficient memory usage for large projects
- **Worker Threads**: Utilizes multiple CPU cores for better performance

### Multiple Output Formats
- **JSON**: Structured data for programmatic use
- **YAML**: Human-readable configuration format
- **Mermaid**: Interactive flowcharts and diagrams
- **Visual Diagrams**: PNG, SVG, PDF exports
- **HTML Reports**: Interactive web-based reports

## 📦 Installation

```bash
# Global installation (trendy!)
npm install -g flow

# Local installation
npm install --save-dev flow

# Using npx (no installation required)
npx flow generate --input ./src --output ./workflows
```

## 🎯 Quick Start

### Basic Usage

```bash
# Generate workflows for any project
flow generate --input ./src --output ./workflows

# Analyze project without generating files
flow analyze --input ./src

# Detect frameworks and languages
flow detect --input ./src

# Get optimization suggestions
flow optimize --input ./src --output ./optimization-report
```

### Advanced Usage

```bash
# Specify framework and language
flow generate --input ./src --output ./workflows --framework react --language typescript

# Enable parallel processing and caching
flow generate --input ./src --output ./workflows --parallel --cache --workers 8

# Generate specific output formats
flow generate --input ./src --output ./workflows --format json --diagram-format svg

# Include optimization analysis
flow generate --input ./src --output ./workflows --optimize
```

## 🏗️ Architecture

### Modular Design
The tool is built with a modular architecture where each framework has its own specialized components:

```
src/
├── core/
│   ├── FrameworkDetector.ts    # Auto-detects frameworks
│   ├── WorkflowProcessor.ts    # Main processing engine
│   └── TaskCore.ts            # Separate task cores for efficiency
├── parsers/
│   ├── BaseParser.ts          # Base parser with common functionality
│   ├── ReactParser.ts         # React-specific parsing
│   ├── VueParser.ts           # Vue.js-specific parsing
│   ├── NodeParser.ts          # Node.js-specific parsing
│   └── ...                    # Other framework parsers
├── generators/
│   ├── WorkflowGenerator.ts   # Workflow generation
│   ├── DiagramGenerator.ts    # Visual diagram generation
│   └── MermaidGenerator.ts    # Mermaid diagram generation
└── types/
    └── index.ts               # Universal type definitions
```

### Task Cores
Each major operation has its own dedicated task core for maximum efficiency:

- **ParserTaskCore**: Handles code parsing and analysis
- **GeneratorTaskCore**: Generates workflows and diagrams
- **AnalyzerTaskCore**: Performs code analysis and metrics
- **OptimizerTaskCore**: Suggests performance optimizations

## 🔧 Configuration

### Command Line Options

| Option | Description | Default | Values |
|--------|-------------|---------|--------|
| `--input, -i` | Input project directory | `./src` | Any valid path |
| `--output, -o` | Output directory | `./workflows` | Any valid path |
| `--format, -f` | Output format | `all` | `json`, `yaml`, `mermaid`, `all` |
| `--framework` | Force specific framework | Auto-detect | `react`, `vue`, `angular`, `nodejs`, `nextjs`, `svelte` |
| `--language` | Force specific language | Auto-detect | `javascript`, `typescript` |
| `--parallel` | Enable parallel processing | `true` | `true`, `false` |
| `--cache` | Enable caching | `true` | `true`, `false` |
| `--workers` | Number of worker threads | `4` | Any positive integer |
| `--optimize` | Include optimizations | `false` | `true`, `false` |
| `--verbose, -v` | Verbose output | `false` | `true`, `false` |

### Framework-Specific Options

#### React
- Detects JSX/TSX files
- Analyzes hooks, lifecycle methods, and components
- Identifies state management patterns

#### Vue.js
- Detects .vue single-file components
- Analyzes composition API and options API
- Identifies Vue-specific lifecycle methods

#### Node.js
- Detects Express routes and middleware
- Analyzes database queries and API calls
- Identifies server lifecycle events

#### Angular
- Detects TypeScript decorators
- Analyzes services, components, and modules
- Identifies Angular-specific patterns

## 📊 Output Examples

### JSON Output
```json
{
  "workflows": [
    {
      "id": "UserController_createUser",
      "name": "UserController::createUser",
      "description": "Workflow for creating a new user",
      "framework": "nodejs",
      "nodes": [
        {
          "id": "node_1",
          "type": "start",
          "label": "Start",
          "description": "Entry point for createUser"
        },
        {
          "id": "node_2",
          "type": "validation",
          "label": "Validation",
          "description": "Input validation"
        }
      ],
      "edges": [
        {
          "id": "edge_1",
          "source": "node_1",
          "target": "node_2",
          "label": "Validate input"
        }
      ]
    }
  ],
  "statistics": {
    "totalComponents": 15,
    "totalMethods": 45,
    "frameworks": { "nodejs": 10, "react": 5 },
    "languages": { "typescript": 12, "javascript": 3 }
  }
}
```

### Mermaid Diagram
```mermaid
graph TD
    A[Start] --> B[Validation]
    B --> C[Database Query]
    C --> D[API Call]
    D --> E[Process Data]
    E --> F[End]
```

## 🚀 Performance

### Benchmarks
- **Small Project** (< 100 files): ~2-5 seconds
- **Medium Project** (100-1000 files): ~10-30 seconds
- **Large Project** (1000+ files): ~1-5 minutes

### Optimization Features
- **Parallel Processing**: Utilizes all available CPU cores
- **Intelligent Caching**: Reduces redundant processing
- **Memory Management**: Efficient memory usage for large codebases
- **Incremental Processing**: Only processes changed files

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/universal-workflow-generator/universal-workflow-generator.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Full Documentation](https://universal-workflow-generator.dev)
- **Issues**: [GitHub Issues](https://github.com/universal-workflow-generator/universal-workflow-generator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/universal-workflow-generator/universal-workflow-generator/discussions)

## 🙏 Acknowledgments

- Built with TypeScript for type safety
- Uses Acorn for JavaScript parsing
- Leverages Mermaid for diagram generation
- Inspired by modern workflow visualization tools

---

**Made with ❤️ for the developer community**
