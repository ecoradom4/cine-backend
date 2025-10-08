const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const movieRoutes = require('./routes/movie.routes');
const roomRoutes = require('./routes/room.routes');
const showtimeRoutes = require('./routes/showtime.routes');
const bookingRoutes = require('./routes/booking.routes');
const branchRoutes = require('./routes/branch.routes');
const seatRoutes = require('./routes/seat.routes');
const ticketRoutes = require('./routes/ticket.routes');
const carteleraRoutes = require('./routes/cartelera.routes');
const pricingRoutes = require('./routes/pricing.routes');
const promotionRoutes = require('./routes/promotion.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const scheduleRoutes = require('./routes/schedule.routes');

// Importar middleware de errores
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.'
  }
});

// CONFIGURACIÓN SWAGGER COMPLETA
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Sistema de Cine - Cine Connect',
      version: '2.0.0',
      description: 'Documentación completa de la API para el sistema de gestión de cine',
      contact: {
        name: 'Soporte API',
        email: 'soporte@cineconnect.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Servidor local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    // TAGS EXPLÍCITOS - ESTO ES CLAVE
    tags: [
      { name: 'Autenticación', description: 'Registro, login y gestión de usuarios' },
      { name: 'Películas', description: 'Gestión del catálogo de películas' },
      { name: 'Salas', description: 'Gestión de salas de cine' },
      { name: 'Funciones', description: 'Gestión de horarios y funciones' },
      { name: 'Reservas', description: 'Sistema de reservas y bookings' },
      { name: 'Sucursales', description: 'Gestión de sucursales del cine' },
      { name: 'Asientos', description: 'Sistema de selección y reserva de asientos' },
      { name: 'Tickets', description: 'Generación y gestión de tickets' },
      { name: 'Cartelera', description: 'Consulta de películas y funciones' },
      { name: 'Precios', description: 'Sistema de precios dinámicos' },
      { name: 'Promociones', description: 'Gestión de promociones y descuentos' },
      { name: 'Facturas', description: 'Sistema de facturación' },
      { name: 'Programación', description: 'Programación en lote de funciones' },
    ]
  },
  apis: [path.join(__dirname, 'routes', '*.js')]
};

// Función de debug mejorada
function debugSwaggerSpec() {
  try {
    const spec = swaggerJsdoc(swaggerOptions);
    
    console.log('🎯 Swagger Debug:');
    console.log(`📊 Endpoints detectados: ${Object.keys(spec.paths || {}).length}`);
    console.log(`🏷️  Tags configurados: ${(spec.tags || []).length}`);
    
    // Mostrar endpoints por tag
    if (spec.paths) {
      const endpointsByTag = {};
      Object.entries(spec.paths).forEach(([path, methods]) => {
        Object.entries(methods).forEach(([method, definition]) => {
          const tags = definition.tags || ['default'];
          tags.forEach(tag => {
            if (!endpointsByTag[tag]) endpointsByTag[tag] = [];
            endpointsByTag[tag].push(`${method.toUpperCase()} ${path}`);
          });
        });
      });
      
      console.log('📋 Endpoints por tag:');
      Object.entries(endpointsByTag).forEach(([tag, endpoints]) => {
        console.log(`   ${tag}: ${endpoints.length} endpoints`);
      });
    }
    
    return spec;
  } catch (error) {
    console.error('❌ Error generando Swagger spec:', error);
    return { paths: {}, components: {} };
  }
}

const swaggerSpec = debugSwaggerSpec();

// Middlewares
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://192.168.1.31:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// SWAGGER UI CON CONFIGURACIÓN MEJORADA
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: "Cine Connect API - Documentación Completa",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true
  }
}));

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    endpoints: Object.keys(swaggerSpec.paths || {}).length
  });
});

// Ruta de diagnóstico Swagger
app.get('/swagger-info', (req, res) => {
  const endpointsByTag = {};
  
  if (swaggerSpec.paths) {
    Object.entries(swaggerSpec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, definition]) => {
        const tags = definition.tags || ['Sin etiqueta'];
        tags.forEach(tag => {
          if (!endpointsByTag[tag]) endpointsByTag[tag] = [];
          endpointsByTag[tag].push({
            method: method.toUpperCase(),
            path: path,
            summary: definition.summary || 'Sin descripción'
          });
        });
      });
    });
  }

  res.json({
    success: true,
    totalEndpoints: Object.keys(swaggerSpec.paths || {}).length,
    totalTags: (swaggerSpec.tags || []).length,
    endpointsByTag: endpointsByTag,
    allPaths: Object.keys(swaggerSpec.paths || {})
  });
});

// Ruta de inicio
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 API Cine Connect v2.0 - Funcionando correctamente',
    documentation: '/api-docs',
    health: '/health',
    swaggerInfo: '/swagger-info',
    totalEndpoints: Object.keys(swaggerSpec.paths || {}).length
  });
});

// Rutas de la API
app.use('/auth', authRoutes);
app.use('/movies', movieRoutes);
app.use('/rooms', roomRoutes);
app.use('/showtimes', showtimeRoutes);
app.use('/bookings', bookingRoutes);
app.use('/branches', branchRoutes);
app.use('/seats', seatRoutes);
app.use('/tickets', ticketRoutes);
app.use('/cartelera', carteleraRoutes);
app.use('/pricing', pricingRoutes);
app.use('/promotions', promotionRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/schedule', scheduleRoutes);

// Manejo de errores
app.use(errorHandler);

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    documentation: '/api-docs',
    availableRoutes: [
      '/auth', '/movies', '/rooms', '/showtimes', '/bookings',
      '/branches', '/seats', '/tickets', '/cartelera', '/pricing',
      '/promotions', '/invoices', '/schedule', '/health', '/api-docs'
    ]
  });
});

module.exports = app;