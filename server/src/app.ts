import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimiter';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { sanitizeInput, securityHeaders, validateContentType } from './middleware/security';
import { auditMiddleware } from './middleware/audit.middleware';
import { swaggerSpec } from './config/swagger';
import routes from './routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(validateContentType);
app.use('/api/v1', apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

// API routes
app.use('/api/v1', routes);

// Audit logging (after routes so we have req.user)
app.use(auditMiddleware);

// 404 + error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
