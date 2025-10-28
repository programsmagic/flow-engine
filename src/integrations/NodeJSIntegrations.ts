/**
 * Easy Integration Examples for Node.js Backends
 * 
 * This file demonstrates how to integrate Flow Engine with popular Node.js frameworks
 */

import { SimpleFlowEngine, createFlow, expressFlow } from '../SimpleFlowEngine';

// ============================================================================
// EXPRESS.JS INTEGRATION
// ============================================================================

export function createExpressApp() {
  // User Registration Flow
  const userRegistrationFlow = createFlow()
    .setCommonPayload({
      timestamp: new Date().toISOString(),
      source: 'api'
    })
    .use(async (data: any, context: any) => {
      // Logging middleware
      console.log(`Processing user registration: ${data.email}`);
      context.metadata.requestId = context.executionId;
    })
    .step('validate', async (data: any) => {
      if (!data.email || !data.password) {
        throw new Error('Email and password are required');
      }
      if (data.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      return { isValid: true };
    })
    .step('checkEmail', async (data: any) => {
      // Simulate database check
      if (data.email === 'existing@example.com') {
        throw new Error('Email already exists');
      }
      return { emailAvailable: true };
    })
    .step('hashPassword', async (data: any) => {
      // Simulate password hashing
      const hashedPassword = `hashed_${data.password}`;
      return { hashedPassword };
    })
    .step('createUser', async (data: any) => {
      // Simulate user creation
      const user = {
        id: Math.random().toString(36).substr(2, 9),
        email: data.email,
        name: data.name,
        createdAt: new Date().toISOString()
      };
      return { user };
    })
    .step('sendWelcomeEmail', async (data: any) => {
      // Simulate email sending
      console.log(`Sending welcome email to ${data.user.email}`);
      return { emailSent: true };
    });

  // Order Processing Flow
  const orderProcessingFlow = createFlow()
    .setCommonPayload({
      currency: 'USD',
      taxRate: 0.08
    })
    .step('validateOrder', async (data: any) => {
      if (!data.items || data.items.length === 0) {
        throw new Error('Order must contain items');
      }
      return { orderValid: true };
    })
    .step('calculateTotal', async (data: any) => {
      const subtotal = data.items.reduce((sum: number, item: any) => sum + item.price, 0);
      const tax = subtotal * data.taxRate;
      const total = subtotal + tax;
      return { subtotal, tax, total };
    })
    .step('processPayment', async (data: any) => {
      // Simulate payment processing
      if (data.total > 1000) {
        throw new Error('Payment amount too high');
      }
      return { paymentId: `pay_${Math.random().toString(36).substr(2, 9)}` };
    })
    .step('createOrder', async (data: any) => {
      const order = {
        id: `order_${Math.random().toString(36).substr(2, 9)}`,
        items: data.items,
        total: data.total,
        paymentId: data.paymentId,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };
      return { order };
    });

  return { userRegistrationFlow, orderProcessingFlow };
}

// ============================================================================
// STANDALONE USAGE (No Framework)
// ============================================================================

export async function standaloneExample() {
  // Create a simple workflow
  const workflow = createFlow()
    .setCommonPayload({
      environment: 'production',
      version: '1.0.0'
    })
    .use(async (data: any, context: any) => {
      console.log(`Starting workflow execution: ${context.executionId}`);
    })
    .step('step1', async (data: any) => {
      console.log('Executing step 1');
      return { step1Result: 'completed' };
    })
    .step('step2', async (data: any) => {
      console.log('Executing step 2');
      return { step2Result: 'completed' };
    })
    .step('step3', async (data: any) => {
      console.log('Executing step 3');
      return { step3Result: 'completed' };
    });

  // Execute the workflow
  const result = await workflow.execute({
    input: 'test data'
  });

  console.log('Workflow result:', result);
  return result;
}

// ============================================================================
// ADVANCED USAGE EXAMPLES
// ============================================================================

export function createAdvancedFlow() {
  return createFlow()
    .setCommonPayload({
      apiKey: process.env.API_KEY,
      baseUrl: process.env.BASE_URL
    })
    .use(async (data: any, context: any) => {
      // Authentication middleware
      if (!data.apiKey) {
        throw new Error('API key required');
      }
      context.metadata.authenticated = true;
    })
    .use(async (data: any, context: any) => {
      // Rate limiting middleware
      context.metadata.requestCount = (context.metadata.requestCount || 0) + 1;
    })
    .step('validate', async (data: any) => {
      // Validation step
      return { validated: true };
    })
    .step('fetchData', async (data: any, context: any) => {
      // External API call with retries
      return { externalData: 'fetched' };
    }, { retries: 3, timeout: 10000 })
    .step('processData', async (data: any) => {
      // Data processing
      return { processedData: 'processed' };
    })
    .step('saveData', async (data: any) => {
      // Database save
      return { saved: true };
    });
}

// Export everything for easy importing
export {
  SimpleFlowEngine,
  createFlow,
  expressFlow
};