import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { saveDatabaseDb } from './sqliteHandler';

export function viteSqlitePlugin(): Plugin {
  return {
    name: 'vite-sqlite-database-handler',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        // 1. POST /api/save-database-db
        if (url === '/api/save-database-db' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', () => {
            try {
              const payload = body ? JSON.parse(body) : {};
              const result = saveDatabaseDb(payload);

              // Also provide base64 data for client direct download if desired
              const dbBuffer = fs.readFileSync(path.resolve(process.cwd(), 'database.db'));
              const base64Data = dbBuffer.toString('base64');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  ...result,
                  base64Data,
                })
              );
            } catch (err: any) {
              console.error('Error saving SQLite database.db:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  message: 'Gagal membuat database.db: ' + (err.message || String(err)),
                })
              );
            }
          });
          return;
        }

        // 2. GET /api/download-database-db
        if (url === '/api/download-database-db' && req.method === 'GET') {
          const dbPath = path.resolve(process.cwd(), 'database.db');
          if (fs.existsSync(dbPath)) {
            const stat = fs.statSync(dbPath);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/x-sqlite3');
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Content-Disposition', 'attachment; filename="database.db"');
            const fileStream = fs.createReadStream(dbPath);
            fileStream.pipe(res);
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: false,
                message: 'Berkas database.db belum dibuat. Lakukan sinkronisasi terlebih dahulu.',
              })
            );
          }
          return;
        }

        // 3. GET /api/database-db-status
        if (url === '/api/database-db-status' && req.method === 'GET') {
          const dbPath = path.resolve(process.cwd(), 'database.db');
          if (fs.existsSync(dbPath)) {
            const stat = fs.statSync(dbPath);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                exists: true,
                size: stat.size,
                sizeKb: (stat.size / 1024).toFixed(1),
                modifiedAt: stat.mtime.toISOString(),
              })
            );
          } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                exists: false,
                size: 0,
                sizeKb: '0',
                modifiedAt: null,
              })
            );
          }
          return;
        }

        next();
      });
    },
  };
}
