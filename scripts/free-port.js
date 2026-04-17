/**
 * 개발용: 지정 포트(기본 8000)에 LISTENING 중인 프로세스를 종료합니다.
 * Windows WinError 10048(포트 사용 중) 시 npm run dev 재실행 전에 쓰입니다.
 */
const { execSync } = require('child_process');

const port = process.argv[2] || '8000';

function freeWindows() {
  let out;
  try {
    out = execSync('netstat -ano', { encoding: 'utf8' });
  } catch {
    return;
  }
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!/LISTENING/i.test(line)) continue;
    if (!line.includes(`:${port}`)) continue;
    const parts = line.trim().split(/\s+/);
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last)) pids.add(last);
  }
  for (const pid of pids) {
    console.log(`[free-port] 포트 ${port} 점유 PID ${pid} 종료`);
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
    } catch {
      /* ignore */
    }
  }
  if (pids.size === 0) {
    console.log(`[free-port] 포트 ${port} 을(를) 쓰는 프로세스 없음`);
  }
}

function freeUnix() {
  try {
    execSync(`npx --yes kill-port ${port}`, { stdio: 'inherit' });
  } catch {
    /* 포트가 비어 있으면 kill-port가 실패할 수 있음 */
  }
}

if (process.platform === 'win32') {
  freeWindows();
} else {
  freeUnix();
}
