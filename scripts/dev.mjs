import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(thisDir, '..');

export async function isPortAvailable(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

export async function findAvailablePort(startPort, host = '127.0.0.1', maxChecks = 25) {
  for (let port = startPort; port < startPort + maxChecks; port += 1) {
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }

  throw new Error(`No available port found starting from ${startPort}`);
}

function resolvePythonExecutable() {
  const candidates = [
    path.join(rootDir, '.venv', 'Scripts', 'python.exe'),
    path.join(rootDir, '.venv', 'bin', 'python'),
    process.env.PYTHON,
    'python'
  ];

  return candidates.find((candidate) => candidate && existsSync(candidate)) || 'python';
}

async function start() {
  const backendPort = await findAvailablePort(8002);
  const frontendPort = await findAvailablePort(4175);

  const backendEnv = {
    ...process.env,
    RESQ_API_URL: `http://127.0.0.1:${backendPort}`
  };

  const backend = spawn(
    resolvePythonExecutable(),
    ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', String(backendPort)],
    { cwd: rootDir, stdio: 'inherit', env: backendEnv }
  );

  const viteBin = path.join(rootDir, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js');

  const frontend = spawn(
    process.execPath,
    [viteBin, '--host', '127.0.0.1', '--port', String(frontendPort)],
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

  backend.on('exit', (code) => {
    if (code !== 0) {
      frontend.kill('SIGINT');
      process.exit(code ?? 1);
    }
  });

  frontend.on('exit', (code) => {
    if (code !== 0) {
      backend.kill('SIGINT');
      process.exit(code ?? 1);
    }
  });

  console.log(`Backend: http://127.0.0.1:${backendPort}`);
  console.log(`Frontend: http://127.0.0.1:${frontendPort}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start().catch((error) => {
    console.error('Unable to start the app:', error);
    process.exit(1);
  });
}
