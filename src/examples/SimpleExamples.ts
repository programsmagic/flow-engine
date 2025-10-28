/**
 * Simple Flow Engine Examples
 * 
 * This file demonstrates the easy-to-use Flow Engine API
 */

import { createFlow, expressFlow } from '../SimpleFlowEngine';

// ============================================================================
// BASIC USAGE EXAMPLE
// ============================================================================

export async function basicExample() {
  console.log('🌊 Basic Flow Engine Example');
  
  // Create a simple workflow
  const flow = createFlow()
    .setCommonPayload({
      timestamp: new Date().toISOString(),
      environment: 'production'
    })
    .step('validate', async (data) => {
      console.log('✅ Validating input...');
      if (!data.email) {
        throw new Error('Email is required');
      }
      return { isValid: true };
    })
    .step('process', async (data) => {
      console.log('⚡ Processing data...');
      // Simulate some processing
      await new Promise(resolve => setTimeout(resolve, 100));
      return { processed: true, processedAt: new Date().toISOString() };
    })
    .step('save', async (data) => {
      console.log('💾 Saving data...');
      // Simulate database save
      const record = {
        id: Math.random().toString(36).substr(2, 9),
        email: data.email,
        processedAt: data.processedAt,
        createdAt: new Date().toISOString()
      };
      return { record };
    });

  // Execute the workflow
  const result = await flow.execute({
    email: 'user@example.com',
    name: 'John Doe'
  });

  console.log('📊 Result:', result);
  return result;
}

// ============================================================================
// EXPRESS INTEGRATION EXAMPLE
// ============================================================================

export function createExpressExample() {
  const express = require('express');
  const app = express();
  app.use(express.json());

  // User Registration Flow
  const userRegistrationFlow = createFlow()
    .setCommonPayload({
      timestamp: new Date().toISOString(),
      source: 'api'
    })
    .use(async (data, context) => {
      // Logging middleware
      console.log(`📝 Processing user registration: ${data.email}`);
      context.metadata.requestId = context.executionId;
    })
    .step('validate', async (data) => {
      if (!data.email || !data.password) {
        throw new Error('Email and password are required');
      }
      if (data.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      return { isValid: true };
    })
    .step('checkEmail', async (data) => {
      // Simulate database check
      if (data.email === 'existing@example.com') {
        throw new Error('Email already exists');
      }
      return { emailAvailable: true };
    })
    .step('hashPassword', async (data) => {
      // Simulate password hashing
      const hashedPassword = `hashed_${data.password}`;
      return { hashedPassword };
    })
    .step('createUser', async (data) => {
      // Simulate user creation
      const user = {
        id: Math.random().toString(36).substr(2, 9),
        email: data.email,
        name: data.name,
        createdAt: new Date().toISOString()
      };
      return { user };
    })
    .step('sendWelcomeEmail', async (data) => {
      // Simulate email sending
      console.log(`📧 Sending welcome email to ${data.user.email}`);
      return { emailSent: true };
    });

  // Order Processing Flow
  const orderProcessingFlow = createFlow()
    .setCommonPayload({
      currency: 'USD',
      taxRate: 0.08
    })
    .step('validateOrder', async (data) => {
      if (!data.items || data.items.length === 0) {
        throw new Error('Order must contain items');
      }
      return { orderValid: true };
    })
    .step('calculateTotal', async (data) => {
      const subtotal = data.items.reduce((sum: number, item: any) => sum + item.price, 0);
      const tax = subtotal * data.taxRate;
      const total = subtotal + tax;
      return { subtotal, tax, total };
    })
    .step('processPayment', async (data) => {
      // Simulate payment processing
      if (data.total > 1000) {
        throw new Error('Payment amount too high');
      }
      return { paymentId: `pay_${Math.random().toString(36).substr(2, 9)}` };
    })
    .step('createOrder', async (data) => {
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

  // Routes
  app.post('/api/users/register', expressFlow(userRegistrationFlow), (req: any, res: any) => {
    res.json({
      success: true,
      user: req.flowResult.data.user,
      message: 'User registered successfully'
    });
  });

  app.post('/api/orders', expressFlow(orderProcessingFlow), (req: any, res: any) => {
    res.json({
      success: true,
      order: req.flowResult.data.order,
      message: 'Order processed successfully'
    });
  });

  return app;
}

// ============================================================================
// ADVANCED FEATURES EXAMPLE
// ============================================================================

export async function advancedFeaturesExample() {
  console.log('🚀 Advanced Features Example');
  
  const flow = createFlow()
    .setCommonPayload({
      apiKey: 'your-api-key',
      baseUrl: 'https://api.example.com'
    })
    .use(async (data, context) => {
      // Authentication middleware
      if (!data.apiKey) {
        throw new Error('API key required');
      }
      context.metadata.authenticated = true;
      console.log('🔐 Authentication middleware passed');
    })
    .use(async (data, context) => {
      // Rate limiting middleware
      context.metadata.requestCount = (context.metadata.requestCount || 0) + 1;
      console.log(`📊 Request count: ${context.metadata.requestCount}`);
    })
    .step('validate', async (data) => {
      console.log('✅ Validation step');
      return { validated: true };
    })
    .step('fetchData', async (data, context) => {
      console.log('🌐 Fetching external data...');
      // Simulate external API call with retries
      await new Promise(resolve => setTimeout(resolve, 200));
      return { externalData: 'fetched successfully' };
    }, { retries: 3, timeout: 10000 })
    .step('processData', async (data) => {
      console.log('⚡ Processing data...');
      return { processedData: 'processed successfully' };
    })
    .step('saveData', async (data) => {
      console.log('💾 Saving data...');
      return { saved: true, savedAt: new Date().toISOString() };
    });

  const result = await flow.execute({
    input: 'test data'
  });

  console.log('📊 Advanced result:', result);
  return result;
}

// ============================================================================
// ERROR HANDLING EXAMPLE
// ============================================================================

export async function errorHandlingExample() {
  console.log('❌ Error Handling Example');
  
  const flow = createFlow()
    .step('step1', async (data) => {
      console.log('✅ Step 1 executed');
      return { step1: 'completed' };
    })
    .step('step2', async (data) => {
      console.log('❌ Step 2 will fail');
      throw new Error('Step 2 failed intentionally');
    })
    .step('step3', async (data) => {
      console.log('This step should not execute');
      return { step3: 'completed' };
    });

  const result = await flow.execute({ test: true });
  
  console.log('📊 Error result:', result);
  console.log('Success:', result.success); // false
  console.log('Error:', result.error); // "Step 2 failed intentionally"
  console.log('Steps executed:', result.steps); // ['step1']
  
  return result;
}

// ============================================================================
// RETRY LOGIC EXAMPLE
// ============================================================================

export async function retryLogicExample() {
  console.log('🔄 Retry Logic Example');
  
  let attemptCount = 0;
  
  const flow = createFlow()
    .step('unreliableStep', async (data) => {
      attemptCount++;
      console.log(`🔄 Attempt ${attemptCount}`);
      
      if (attemptCount < 3) {
        throw new Error(`Attempt ${attemptCount} failed`);
      }
      
      console.log('✅ Success on attempt 3');
      return { success: true, attempts: attemptCount };
    }, { retries: 3, timeout: 5000 });

  const result = await flow.execute({ test: true });
  
  console.log('📊 Retry result:', result);
  return result;
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

export async function runAllExamples() {
  console.log('🌊 Flow Engine Examples\n');
  
  try {
    await basicExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await advancedFeaturesExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await errorHandlingExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await retryLogicExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    console.log('✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}
