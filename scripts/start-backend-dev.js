'use strict';

/**
 * 루트 package.json 의 dev:backend 에서 사용.
 * 포트는 dev-proxy-port.js → frontend/.env.development 와 동일.
 */
const { spawn } = require('child_process');
const path = require('path');

const readPort = require('./dev-proxy-port.js');
const port = readPort();
const reload = process.argv.includes('--reload');
const backendDir = path.join(__dirname, '..', 'backend');
const isWin = process.platform === 'win32';
const pyCmd = isWin ? 'py' : 'python';
const pyVersionArgs = isWin ? ['-3.12'] : [];

const prepArgs = [...pyVersionArgs, 'run_dev_prep.py'];

const pyArgs = [
  ...pyVersionArgs,
  '-W',
  'ignore::DeprecationWarning',
  'dev_server.py',
  '--host',
  '127.0.0.1',
  '--port',
  port,
];
if (reload) pyArgs.push('--reload');

const maxRetries = process.platform === 'win32' ? 20 : 0;
const retryDelayMs = 2500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  // Ensure migrations/seed prep uses the same Python runtime as the server.
  const prepExit = await new Promise((resolve) => {
    const child = spawn(pyCmd, prepArgs, {
      cwd: backendDir,
      stdio: 'inherit',
      shell: isWin,
    });
    child.on('exit', (code, signal) => resolve({ code, signal }));
  });
  if (prepExit.signal) {
    process.kill(process.pid, prepExit.signal);
    return;
  }
  if ((prepExit.code ?? 1) !== 0) {
    process.exit(prepExit.code ?? 1);
    return;
  }

  for (let attempt = 0; ; attempt += 1) {
    const startedAt = Date.now();
    const exit = await new Promise((resolve) => {
      const child = spawn(pyCmd, pyArgs, {
        cwd: backendDir,
        stdio: 'inherit',
        shell: isWin,
      });
      child.on('exit', (code, signal) => resolve({ code, signal }));
    });

    if (exit.signal) {
      process.kill(process.pid, exit.signal);
      return;
    }

    const code = exit.code == null ? 1 : exit.code;
    const ranForMs = Date.now() - startedAt;
    const shouldRetry = code !== 0 && ranForMs < 20000 && attempt < maxRetries;
    if (!shouldRetry) {
      process.exit(code);
      return;
    }

    console.warn(
      `[backend-dev] 백엔드가 빠르게 종료되어 재시도합니다 (${attempt + 1}/${maxRetries})...`,
    );
    await sleep(retryDelayMs);
  }
}

run().catch((err) => {
  console.error('[backend-dev] 시작 중 예기치 못한 오류:', err);
  process.exit(1);
});
