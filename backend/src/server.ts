import 'dotenv/config';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { checkDatabase, pool } from './db';
import authRoutes from './routes/authRoutes';
import auditRoutes from './routes/auditRoutes';
import batchRoutes from './routes/batchRoutes';
import catalogRoutes from './routes/catalogRoutes';
import executionRoutes from './routes/executionRoutes';
import packagingRoutes from './routes/packagingRoutes';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// CORS: orígenes permitidos separados por coma (por defecto, el dev server de Vite).
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));

// Healthcheck (público): estado del proceso y de la conexión a PostgreSQL.
app.get('/api/health', async (_req: Request, res: Response) => {
  const dbUp = await checkDatabase();
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    database: dbUp ? 'up' : 'down',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/batches', executionRoutes);
app.use('/api/batches', packagingRoutes);
app.use('/api/batches', auditRoutes);
app.use('/api/catalogs', catalogRoutes);

// 404 para rutas inexistentes.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Ruta no encontrada.' });
});

// Manejador de errores centralizado: no filtra detalles internos al cliente.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server] Error no controlado:', err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error interno del servidor.' });
});

const server = app.listen(PORT, () => {
  console.log(`[server] API escuchando en http://localhost:${PORT} (CORS: ${allowedOrigins.join(', ')})`);
});

// Cierre ordenado: deja de aceptar peticiones y libera el pool.
function shutdown(signal: string): void {
  console.log(`[server] ${signal} recibido, cerrando...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;
