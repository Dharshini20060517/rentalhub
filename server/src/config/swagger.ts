import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const spec: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RentalHub API',
      version: '1.0.0',
      description: 'Intelligent Equipment Rental Ecosystem — REST API',
      contact: { name: 'RentalHub Team' },
    },
    servers: [{ url: `http://localhost:${env.port}/api/v1`, description: 'Development' }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'access_token' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ['src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(spec);
