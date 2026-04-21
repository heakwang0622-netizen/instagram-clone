'use strict';

/**
 * 개발 시 Vite 프록시·백엔드가 같이 쓰는 포트.
 * `frontend/.env.development` 의 VITE_DEV_PROXY_API_PORT 와 동기화하세요.
 */
const fs = require('fs');
const path = require('path');

const DEFAULT = '18765';

module.exports = function readDevProxyBackendPort() {
  const envPath = path.join(__dirname, '../frontend/.env.development');
  if (!fs.existsSync(envPath)) return DEFAULT;
  const text = fs.readFileSync(envPath, 'utf8');
  const m = text.match(/^\s*VITE_DEV_PROXY_API_PORT\s*=\s*(\d+)\s*$/m);
  if (m) return m[1];
  return DEFAULT;
};
