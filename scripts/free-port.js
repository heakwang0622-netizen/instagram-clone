/**
 * 개발용: 지정 포트(인자 없으면 dev-proxy-port.js → frontend/.env.development)에 LISTEN 중인 프로세스를 종료합니다.
 * Windows에서 netstat 문자열·로캘 차이로 PID를 놓치거나 잘못된 포트 매칭이 날 수 있어
 * 가능하면 Get-NetTCPConnection을 쓰고, LISTEN이 사라질 때까지 짧게 반복합니다.
 */
const { execSync } = require('child_process');

const readDevProxyBackendPort = require('./dev-proxy-port.js');
const port = process.argv[2] || readDevProxyBackendPort();

function sleepSync(ms) {
  try {
    execSync(`powershell -NoProfile -Command "Start-Sleep -Milliseconds ${ms}"`, { stdio: 'ignore' });
  } catch {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      /* busy-wait fallback */
    }
  }
}

/** @param {string} localAddr @param {string} portStr */
function localAddressEndsWithPort(localAddr, portStr) {
  const m6 = localAddr.match(/\]:(\d+)$/);
  if (m6) return m6[1] === portStr;
  const m4 = localAddr.match(/:(\d+)$/);
  if (m4) return m4[1] === portStr;
  return false;
}

function collectPidsNetstat() {
  const pids = new Set();
  let out;
  try {
    out = execSync('netstat -ano', { encoding: 'utf8' });
  } catch {
    return pids;
  }
  for (const line of out.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 5) continue;
    const proto = parts[0];
    if (!/^TCP/i.test(proto)) continue;
    const localAddr = parts[1];
    const state = parts[parts.length - 2];
    const pid = parts[parts.length - 1];
    if (!localAddressEndsWithPort(localAddr, port)) continue;
    if (!/LISTEN/i.test(state)) continue;
    if (/^\d+$/.test(pid)) pids.add(pid);
  }
  return pids;
}

function collectPidsPowerShell() {
  const pids = new Set();
  try {
    const out = execSync(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`,
      { encoding: 'utf8' },
    );
    for (const line of out.split(/\r?\n/)) {
      const t = line.trim();
      if (/^\d+$/.test(t)) pids.add(t);
    }
  } catch {
    /* cmdlet 없음·권한 등 */
  }
  return pids;
}

function collectAllPids() {
  const s = new Set([...collectPidsPowerShell(), ...collectPidsNetstat()]);
  return s;
}

function killPids(pids) {
  for (const pid of pids) {
    if (pid === '0' || pid === '4') {
      console.warn(
        `[free-port] PID ${pid} 은(는) 시스템 예약일 수 있어 건너뜁니다. 포트 ${port} 충돌이 계속되면 다른 앱·예약 범위를 확인하세요.`,
      );
      continue;
    }
    console.log(`[free-port] 포트 ${port} 점유 PID ${pid} 종료`);
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
    } catch {
      /* ignore */
    }
  }
}

function freeWindows() {
  let hadAny = false;
  for (let round = 0; round < 25; round++) {
    const pids = collectAllPids();
    if (pids.size === 0) break;
    hadAny = true;
    console.log(`[free-port] 정리 라운드 ${round + 1}: PID ${[...pids].join(', ')}`);
    killPids(pids);
    sleepSync(350);
  }
  const left = collectAllPids();
  if (left.size === 0 && !hadAny) {
    console.log(`[free-port] 포트 ${port} 을(를) 쓰는 프로세스 없음`);
  } else if (left.size === 0) {
    console.log(`[free-port] 포트 ${port} LISTEN 정리 완료`);
  } else {
    console.warn(
      `[free-port] 경고: 포트 ${port} 에 LISTEN 이 남아 있습니다 (PID: ${[...left].join(', ')}). 백엔드가 WinError 10048 로 종료될 수 있습니다.`,
    );
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
