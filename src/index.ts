/**
 * Flow Engine - Simple Workflow Framework for Node.js
 * 
 * Easy integration with any Node.js backend framework
 */

// Export the simplified API as the main interface
export { 
  SimpleFlowEngine, 
  createFlow, 
  expressFlow, 
  fastifyFlow 
} from './SimpleFlowEngine';

export type {
  FlowStep,
  FlowContext,
  FlowResult
} from './SimpleFlowEngine';

// Export integration examples
export * from './integrations/NodeJSIntegrations';

// Export types
export * from './types';