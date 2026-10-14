import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findAvailablePort } from './dev.mjs';

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(thisDir, '..');

async function start() {
  const backendPort = await findAvailablePort(8002);
  const frontendPort = await findAvailablePort(4175);

  const backend = spawn(
    process.platform === 'win32' ? path.join(rootDir, '.venv', 'Scripts', 'python.exe') : 'python',
    ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', String(backendPort)],
    { cwd: rootDir, stdio: 'inherit', env: { ...process.env, RESQ_API_URL: `http://127.0.0.1:${backendPort}` } }
  );

  const viteBin = path.join(rootDir, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js');

  const frontend = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(frontendPort), '--strictPort'],
    {
      cwd: path.join(rootDir, 'frontend'),
      stdio: 'inherit',
      env: {
        ...process.env,
        RESQ_API_URL: `http://127.0.0.1:${backendPort}`
      }
    }
  );

  const shutdown = () => {
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log(`Backend: http://127.0.0.1:${backendPort}`);
  console.log(`Frontend: http://127.0.0.1:${frontendPort}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start().catch((error) => {
    console.error('Unable to start the preview app:', error);
    process.exit(1);
  });
}
