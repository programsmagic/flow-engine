# 🌊 Flow Engine

**Simple workflow framework for Node.js backends**

Replace complex controller logic with easy-to-use workflow steps. Integrates seamlessly with Express, Fastify, Koa, and any Node.js framework.

[![npm version](https://badge.fury.io/js/flow-engine.svg)](https://badge.fury.io/js/flow-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/flow-engine.svg)](https://nodejs.org/)

## ✨ Features

- **🎯 Super Easy** - Just create a flow and add steps
- **🔗 Framework Agnostic** - Works with Express, Fastify, Koa, or standalone
- **📦 Common Payload** - Share data across all steps automatically
- **🔄 Retry Logic** - Built-in retry with exponential backoff
- **⏱️ Timeout Support** - Prevent hanging operations
- **📊 Step Tracking** - Know exactly which steps executed
- **🔧 TypeScript Ready** - Full TypeScript support

## 🚀 Quick Start

### Installation

```bash
npm install flow-engine
# or
yarn add flow-engine
```

### Basic Usage

```typescript
import { createFlow } from 'flow-engine';

// Create a simple workflow
const flow = createFlow()
  .setCommonPayload({ apiKey: 'your-api-key' })
  .step('validate', async (data) => {
    if (!data.email) throw new Error('Email required');
    return { isValid: true };
  })
  .step('process', async (data) => {
    // Your processing logic here
    return { processed: true };
  });

// Execute the workflow
const result = await flow.execute({ email: 'user@example.com' });
console.log(result.success); // true
console.log(result.data); // { isValid: true, processed: true }
```

## 🔗 Framework Integration

### Express.js Integration

```typescript
import express from 'express';
import { createFlow, expressFlow } from 'flow-engine';

const app = express();
app.use(express.json());

// Create user registration flow
const userFlow = createFlow()
  .setCommonPayload({ timestamp: new Date().toISOString() })
  .step('validate', async (data) => {
    if (!data.email || !data.password) {
      throw new Error('Email and password required');
    }
    return { isValid: true };
  })
  .step('createUser', async (data) => {
    // Your user creation logic
    const user = { id: 1, email: data.email };
    return { user };
  })
  .step('sendEmail', async (data) => {
    // Send welcome email
    console.log(`Welcome email sent to ${data.user.email}`);
    return { emailSent: true };
  });

// Use as Express middleware
app.post('/api/users', expressFlow(userFlow), (req, res) => {
  res.json({
    success: true,
    user: req.flowResult.data.user
  });
});

app.listen(3000);
```

### Fastify Integration

```typescript
import Fastify from 'fastify';
import { createFlow } from 'flow-engine';

const fastify = Fastify();

const orderFlow = createFlow()
  .setCommonPayload({ currency: 'USD' })
  .step('validateOrder', async (data) => {
    if (!data.items?.length) throw new Error('No items');
    return { valid: true };
  })
  .step('calculateTotal', async (data) => {
    const total = data.items.reduce((sum, item) => sum + item.price, 0);
    return { total };
  })
  .step('processPayment', async (data) => {
    // Payment processing logic
    return { paymentId: 'pay_123' };
  });

fastify.post('/api/orders', async (request, reply) => {
  const result = await orderFlow.execute(request.body);
  
  if (result.success) {
    return { order: result.data };
  } else {
    reply.code(400);
    return { error: result.error };
  }
});
```

### Koa Integration

```typescript
import Koa from 'koa';
import Router from 'koa-router';
import { createFlow } from 'flow-engine';

const app = new Koa();
const router = new Router();

const authFlow = createFlow()
  .step('validateCredentials', async (data) => {
    if (!data.email || !data.password) {
      throw new Error('Invalid credentials');
    }
    return { valid: true };
  })
  .step('generateToken', async (data) => {
    const token = `jwt_${Math.random().toString(36).substr(2, 9)}`;
    return { token };
  });

router.post('/api/auth', async (ctx) => {
  const result = await authFlow.execute(ctx.request.body);
  
  if (result.success) {
    ctx.body = { token: result.data.token };
  } else {
    ctx.status = 401;
    ctx.body = { error: result.error };
  }
});
```

## 🛠️ Advanced Features

### Middleware Support

```typescript
const flow = createFlow()
  .setCommonPayload({ apiKey: process.env.API_KEY })
  .use(async (data, context) => {
    // Authentication middleware
    if (!data.apiKey) throw new Error('Unauthorized');
    context.metadata.userId = 'user_123';
  })
  .use(async (data, context) => {
    // Logging middleware
    console.log(`Processing request: ${context.executionId}`);
  })
  .step('process', async (data) => {
    return { processed: true };
  });
```

### Retry Logic & Timeouts

```typescript
const flow = createFlow()
  .step('externalAPI', async (data) => {
    // This step will retry 3 times with exponential backoff
    const response = await fetch('https://api.example.com/data');
    return { data: await response.json() };
  }, { 
    retries: 3, 
    timeout: 10000 // 10 second timeout
  });
```

### Step Dependencies

```typescript
const flow = createFlow()
  .step('fetchUser', async (data) => {
    return { user: await getUser(data.userId) };
  })
  .step('fetchOrders', async (data) => {
    return { orders: await getOrders(data.user.id) };
  }, { dependencies: ['fetchUser'] }) // This step waits for fetchUser
  .step('calculateTotal', async (data) => {
    const total = data.orders.reduce((sum, order) => sum + order.amount, 0);
    return { total };
  }, { dependencies: ['fetchOrders'] });
```

## 📊 Result Object

Every flow execution returns a detailed result:

```typescript
interface FlowResult {
  success: boolean;           // Whether the flow completed successfully
  data: any;                 // All data from all steps
  error?: string;            // Error message if failed
  executionTime: number;      // Total execution time in ms
  steps: string[];           // Array of executed step IDs
  metadata: Record<string, any>; // Custom metadata
}

// Example result
{
  success: true,
  data: {
    email: 'user@example.com',
    isValid: true,
    user: { id: 1, email: 'user@example.com' },
    emailSent: true
  },
  executionTime: 245,
  steps: ['validate', 'createUser', 'sendEmail'],
  metadata: { requestId: 'exec_123', userId: 'user_123' }
}
```

## 🎯 Real-World Examples

### E-commerce Order Processing

```typescript
const orderFlow = createFlow()
  .setCommonPayload({ 
    currency: 'USD',
    taxRate: 0.08,
    shippingRate: 5.99
  })
  .step('validateOrder', async (data) => {
    if (!data.items?.length) throw new Error('No items in order');
    if (!data.customerId) throw new Error('Customer ID required');
    return { orderValid: true };
  })
  .step('checkInventory', async (data) => {
    for (const item of data.items) {
      const available = await checkStock(item.productId);
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productId}`);
      }
    }
    return { inventoryChecked: true };
  })
  .step('calculatePricing', async (data) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.price, 0);
    const tax = subtotal * data.taxRate;
    const shipping = subtotal > 50 ? 0 : data.shippingRate;
    const total = subtotal + tax + shipping;
    
    return { subtotal, tax, shipping, total };
  })
  .step('processPayment', async (data) => {
    const payment = await stripe.charges.create({
      amount: Math.round(data.total * 100),
      currency: data.currency,
      source: data.paymentToken
    });
    return { paymentId: payment.id };
  })
  .step('createOrder', async (data) => {
    const order = await db.orders.create({
      customerId: data.customerId,
      items: data.items,
      total: data.total,
      paymentId: data.paymentId,
      status: 'confirmed'
    });
    return { order };
  })
  .step('sendConfirmation', async (data) => {
    await emailService.send({
      to: data.customer.email,
      template: 'order-confirmation',
      data: { order: data.order }
    });
    return { emailSent: true };
  });

// Use in Express route
app.post('/api/orders', expressFlow(orderFlow), (req, res) => {
  res.json({ order: req.flowResult.data.order });
});
```

### User Authentication & Authorization

```typescript
const authFlow = createFlow()
  .setCommonPayload({ 
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiry: '24h'
  })
  .step('validateCredentials', async (data) => {
    if (!data.email || !data.password) {
      throw new Error('Email and password required');
    }
    return { credentialsValid: true };
  })
  .step('findUser', async (data) => {
    const user = await db.users.findOne({ email: data.email });
    if (!user) throw new Error('User not found');
    return { user };
  })
  .step('verifyPassword', async (data) => {
    const isValid = await bcrypt.compare(data.password, data.user.passwordHash);
    if (!isValid) throw new Error('Invalid password');
    return { passwordValid: true };
  })
  .step('generateTokens', async (data) => {
    const accessToken = jwt.sign(
      { userId: data.user.id, email: data.user.email },
      data.jwtSecret,
      { expiresIn: data.tokenExpiry }
    );
    
    const refreshToken = jwt.sign(
      { userId: data.user.id },
      data.jwtSecret,
      { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
  })
  .step('updateLastLogin', async (data) => {
    await db.users.update(data.user.id, { 
      lastLoginAt: new Date() 
    });
    return { lastLoginUpdated: true };
  });
```

## 🚀 Performance Benefits

- **⚡ Fast Execution** - Steps run in sequence with optimized data passing
- **🔄 Built-in Retries** - Automatic retry with exponential backoff
- **⏱️ Timeout Protection** - Prevent hanging operations
- **📊 Execution Tracking** - Know exactly what happened and when
- **💾 Memory Efficient** - Only loads data when needed

## 🔧 API Reference

### createFlow()
Creates a new workflow instance.

```typescript
const flow = createFlow();
```

### .setCommonPayload(payload)
Sets data available to all steps.

```typescript
flow.setCommonPayload({ apiKey: 'your-key', version: '1.0' });
```

### .use(middleware)
Adds middleware that runs before each step.

```typescript
flow.use(async (data, context) => {
  console.log(`Executing step with data:`, data);
});
```

### .step(id, handler, options?)
Adds a step to the workflow.

```typescript
flow.step('process', async (data) => {
  return { processed: true };
}, { retries: 3, timeout: 5000 });
```

### .execute(inputData)
Executes the workflow with input data.

```typescript
const result = await flow.execute({ email: 'user@example.com' });
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🌊 Flow Engine** - *Simple workflow framework for Node.js backends*

[Documentation](https://prashantmishra.github.io/universal-workflow-generator) • [GitHub](https://github.com/prashantmishra/universal-workflow-generator) • [NPM](https://www.npmjs.com/package/flow-engine)