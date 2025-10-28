import { FlowDefinition } from '../types';

/**
 * Example: User Registration Flow
 * This replaces a traditional UserController with a flow-based approach
 */
export const UserRegistrationFlow: FlowDefinition = {
  id: 'user-registration',
  name: 'User Registration Flow',
  description: 'Complete user registration process with validation and email verification',
  version: '1.0.0',
  startNode: 'validate_input',
  nodes: [
    {
      id: 'validate_input',
      type: 'validation',
      label: 'Validate Input',
      description: 'Validate registration data',
      config: {
        rules: [
          { field: 'name', operator: 'required', message: 'Name is required' },
          { field: 'email', operator: 'email', message: 'Invalid email format' },
          { field: 'email', operator: 'required', message: 'Email is required' },
          { field: 'password', operator: 'min_length', value: 8, message: 'Password must be at least 8 characters' },
          { field: 'password', operator: 'required', message: 'Password is required' },
          { field: 'confirmPassword', operator: 'required', message: 'Password confirmation is required' }
        ]
      }
    },
    {
      id: 'check_password_match',
      type: 'condition',
      label: 'Check Password Match',
      description: 'Verify password and confirmation match',
      config: {
        condition: '$password === $confirmPassword',
        trueValue: true,
        falseValue: false
      }
    },
    {
      id: 'check_email_exists',
      type: 'database_query',
      label: 'Check Email Exists',
      description: 'Check if email already exists',
      config: {
        query: 'SELECT id FROM users WHERE email = ?',
        params: ['$email']
      }
    },
    {
      id: 'hash_password',
      type: 'transform',
      label: 'Hash Password',
      description: 'Hash password using bcrypt',
      config: {
        mapping: {
          hashedPassword: 'bcrypt($password)'
        }
      }
    },
    {
      id: 'create_user',
      type: 'database_query',
      label: 'Create User',
      description: 'Insert new user into database',
      config: {
        query: 'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())',
        params: ['$name', '$email', '$hashedPassword']
      }
    },
    {
      id: 'send_welcome_email',
      type: 'email',
      label: 'Send Welcome Email',
      description: 'Send welcome email to new user',
      config: {
        to: '$email',
        subject: 'Welcome to our platform!',
        template: 'welcome',
        data: {
          name: '$name',
          email: '$email'
        }
      }
    },
    {
      id: 'generate_response',
      type: 'transform',
      label: 'Generate Response',
      description: 'Generate API response',
      config: {
        mapping: {
          success: true,
          user: {
            id: '$userId',
            name: '$name',
            email: '$email',
            createdAt: '$createdAt'
          },
          message: 'User registered successfully'
        }
      }
    }
  ],
  edges: [
    {
      id: 'validate_to_password',
      source: 'validate_input',
      target: 'check_password_match',
      label: 'Validation passed'
    },
    {
      id: 'password_to_email',
      source: 'check_password_match',
      target: 'check_email_exists',
      label: 'Passwords match',
      condition: '$check_password_match === true'
    },
    {
      id: 'email_to_hash',
      source: 'check_email_exists',
      target: 'hash_password',
      label: 'Email available',
      condition: '!$emailExists'
    },
    {
      id: 'hash_to_create',
      source: 'hash_password',
      target: 'create_user',
      label: 'Password hashed'
    },
    {
      id: 'create_to_email',
      source: 'create_user',
      target: 'send_welcome_email',
      label: 'User created'
    },
    {
      id: 'email_to_response',
      source: 'send_welcome_email',
      target: 'generate_response',
      label: 'Email sent'
    }
  ]
};

/**
 * Example: Order Processing Flow
 */
export const OrderProcessingFlow: FlowDefinition = {
  id: 'order-processing',
  name: 'Order Processing Flow',
  description: 'Complete order processing with inventory, payment, and fulfillment',
  version: '1.0.0',
  startNode: 'validate_order',
  nodes: [
    {
      id: 'validate_order',
      type: 'validation',
      label: 'Validate Order',
      description: 'Validate order data and items',
      config: {
        rules: [
          { field: 'customerId', operator: 'required', message: 'Customer ID is required' },
          { field: 'items', operator: 'required', message: 'Order items are required' },
          { field: 'shippingAddress', operator: 'required', message: 'Shipping address is required' },
          { field: 'paymentMethod', operator: 'required', message: 'Payment method is required' }
        ]
      }
    },
    {
      id: 'check_inventory',
      type: 'database_query',
      label: 'Check Inventory',
      description: 'Check product availability and stock',
      config: {
        query: 'SELECT id, name, stock, price FROM products WHERE id IN (?)',
        params: ['$itemIds']
      }
    },
    {
      id: 'calculate_total',
      type: 'transform',
      label: 'Calculate Total',
      description: 'Calculate order total with taxes and shipping',
      config: {
        mapping: {
          subtotal: 'sum($items, item => item.quantity * item.price)',
          tax: 'subtotal * 0.08', // 8% tax
          shipping: 'subtotal > 50 ? 0 : 10', // Free shipping over $50
          total: 'subtotal + tax + shipping'
        }
      }
    },
    {
      id: 'process_payment',
      type: 'external_service',
      label: 'Process Payment',
      description: 'Process payment with payment gateway',
      config: {
        service: 'stripe',
        action: 'create_payment_intent',
        params: {
          amount: '$total',
          currency: 'usd',
          payment_method: '$paymentMethod.token'
        }
      }
    },
    {
      id: 'update_inventory',
      type: 'database_query',
      label: 'Update Inventory',
      description: 'Reduce inventory for ordered items',
      config: {
        query: 'UPDATE products SET stock = stock - ? WHERE id = ?',
        params: ['$quantity', '$productId']
      }
    },
    {
      id: 'create_order',
      type: 'database_query',
      label: 'Create Order',
      description: 'Create order record in database',
      config: {
        query: 'INSERT INTO orders (customer_id, total_amount, status, shipping_address, created_at) VALUES (?, ?, ?, ?, NOW())',
        params: ['$customerId', '$total', 'confirmed', '$shippingAddress']
      }
    },
    {
      id: 'send_confirmation',
      type: 'email',
      label: 'Send Confirmation',
      description: 'Send order confirmation email',
      config: {
        to: '$customerEmail',
        subject: 'Order Confirmation',
        template: 'order_confirmation',
        data: {
          orderId: '$orderId',
          items: '$items',
          total: '$total',
          shippingAddress: '$shippingAddress'
        }
      }
    }
  ],
  edges: [
    {
      id: 'validate_to_inventory',
      source: 'validate_order',
      target: 'check_inventory',
      label: 'Order valid'
    },
    {
      id: 'inventory_to_calculate',
      source: 'check_inventory',
      target: 'calculate_total',
      label: 'Inventory available',
      condition: '$inventoryAvailable'
    },
    {
      id: 'calculate_to_payment',
      source: 'calculate_total',
      target: 'process_payment',
      label: 'Total calculated'
    },
    {
      id: 'payment_to_update',
      source: 'process_payment',
      target: 'update_inventory',
      label: 'Payment successful'
    },
    {
      id: 'update_to_create',
      source: 'update_inventory',
      target: 'create_order',
      label: 'Inventory updated'
    },
    {
      id: 'create_to_email',
      source: 'create_order',
      target: 'send_confirmation',
      label: 'Order created'
    }
  ]
};
