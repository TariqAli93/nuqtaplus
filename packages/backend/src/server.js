import Fastify from 'fastify';
import config from './config.js';
// Plugins
import securityPlugin from './plugins/security.js';
import authPlugin from './plugins/auth.js';
import errorHandlerPlugin from './plugins/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import rbacRoutes from './routes/rbacRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import currencyRoutes from './routes/currencyRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: config.logging.level,
    transport: config.logging.pretty
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
});

// Enable console.log to work alongside Pino logger
console.log('\n🚀 CodeLIMS Backend Server Starting...');
console.log('📊 Console.log statements are now visible');
console.log('⚙️  Configuration loaded');
console.log(`🔧 Environment: ${config.server.env}`);
console.log(`🌐 Host: ${config.server.host}`);
console.log(`🔌 Port: ${config.server.port}`);
console.log('─'.repeat(50));

// Start server
const start = async () => {
  try {
    // Register plugins
    await fastify.register(securityPlugin);
    await fastify.register(authPlugin);
    await fastify.register(errorHandlerPlugin);

    // Health check route
    fastify.get('/', async () => {
      return {
        status: 'ok',
        service: 'CodeLIMS Backend API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      };
    });

    fastify.get('/health', async () => {
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    });

    // Register API routes
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(customerRoutes, { prefix: '/api/customers' });
    await fastify.register(productRoutes, { prefix: '/api/products' });
    await fastify.register(saleRoutes, { prefix: '/api/sales' });
    await fastify.register(categoryRoutes, { prefix: '/api/categories' });
    await fastify.register(rbacRoutes, { prefix: '/api/rbac' });
    await fastify.register(userRoutes, { prefix: '/api/users' });
    await fastify.register(roleRoutes, { prefix: '/api/roles' });
    await fastify.register(permissionRoutes, { prefix: '/api/permissions' });
    await fastify.register(currencyRoutes, { prefix: '/api/currencies' });
    await fastify.register(settingsRoutes, { prefix: '/api/settings' });

    // Start listening
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    console.log('\n✅ Server successfully started!');
    console.log(`🌍 Server running on http://${config.server.host}:${config.server.port}`);
    console.log(`📈 Environment: ${config.server.env}`);
    console.log(`📝 Log Level: ${config.logging.level}`);
    console.log('─'.repeat(50));
    console.log('🎯 Ready to accept requests!\n');

    fastify.log.info(`Server running on http://${config.server.host}:${config.server.port}`);
    fastify.log.info(`Environment: ${config.server.env}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

export const closeServer = async () => {
  fastify.log.info('Shutting down server...');
  await fastify.close();
  fastify.log.info('Server shut down complete.');
};

fastify.post('/__shutdown__', async (req, res) => {
  fastify.log.info('🛑 Shutdown requested from Electron');
  res.send({ message: 'Shutting down...' });

  setTimeout(async () => {
    try {
      await closeServer();
      fastify.log.info('✅ Server closed via HTTP shutdown route');
      process.exit(0);
    } catch (err) {
      fastify.log.error('❌ Error closing server:', err);
      process.exit(1);
    }
  }, 200);
});

start();
