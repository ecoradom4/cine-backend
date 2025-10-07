const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
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

// Configuración de Swagger ACTUALIZADA
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Sistema de Cine - Cine Connect',
      version: '1.0.0',
      description: 'Documentación completa de la API para el sistema de gestión de cine',
      contact: {
        name: 'Soporte API Cine Connect',
        email: 'soporte@cineconnect.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://cine-backend-tdsu.onrender.com' 
          : `http://localhost:${process.env.PORT || 3001}`,
        description: process.env.NODE_ENV === 'production' ? 'Producción' : 'Desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Introduce el token JWT con el formato: Bearer {token}'
        }
      },
      schemas: {
        Branch: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único de la sucursal'
            },
            name: {
              type: 'string',
              description: 'Nombre de la sucursal'
            },
            address: {
              type: 'string',
              description: 'Dirección completa'
            },
            city: {
              type: 'string',
              description: 'Ciudad donde se encuentra'
            },
            phone: {
              type: 'string',
              description: 'Teléfono de contacto'
            },
            openingHours: {
              type: 'string',
              description: 'Horario de atención'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              description: 'Estado de la sucursal'
            }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            seats: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Asientos reservados'
            },
            totalPrice: {
              type: 'number',
              description: 'Precio total de la reserva'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'cancelled', 'expired']
            },
            ticketNumber: {
              type: 'string',
              description: 'Número único del ticket'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acceso no válido o faltante',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Token no válido o expirado'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Recurso no encontrado'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Autenticación',
        description: 'Endpoints para registro, login y gestión de usuarios'
      },
      {
        name: 'Películas',
        description: 'Gestión del catálogo de películas'
      },
      {
        name: 'Salas',
        description: 'Gestión de salas de cine'
      },
      {
        name: 'Funciones',
        description: 'Gestión de horarios y funciones'
      },
      {
        name: 'Reservas',
        description: 'Sistema de reservas y bookings'
      },
      {
        name: 'Sucursales',
        description: 'Gestión de sucursales del cine'
      },
      {
        name: 'Asientos',
        description: 'Sistema de selección y reserva de asientos'
      },
      {
        name: 'Tickets',
        description: 'Generación y gestión de tickets con QR'
      },
      {
        name: 'Health',
        description: 'Verificación del estado del servidor'
      }
    ],
    security: [{
      bearerAuth: []
    }]
  },
  // ACTUALIZADO: Incluir todas las rutas
  apis: [
    './routes/*.js',
    './routes/**/*.js',
    './controllers/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

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

// Servir documentación Swagger con opciones mejoradas
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info h2 { color: #2c5aa0; }
    .swagger-ui .btn.authorize { background-color: #2c5aa0; }
    .swagger-ui .scheme-container { background-color: #f5f5f5; }
  `,
  customSiteTitle: "Cine Connect API Docs",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Ruta de health check
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verificar estado del servidor
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Servidor del cine funcionando correctamente
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Servidor del cine funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta de inicio con documentación de endpoints
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a la API de Cine Connect',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/auth',
      movies: '/movies',
      rooms: '/rooms', 
      showtimes: '/showtimes',
      bookings: '/bookings',
      branches: '/branches',
      seats: '/seats',
      tickets: '/tickets',
      health: '/health'
    },
    timestamp: new Date().toISOString()
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

// Manejo de errores
app.use(errorHandler);

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    availableEndpoints: {
      docs: '/api-docs',
      health: '/health',
      auth: '/auth',
      movies: '/movies',
      bookings: '/bookings',
      branches: '/branches', 
      seats: '/seats',
      tickets: '/tickets'
    }
  });
});

module.exports = app;