/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** 개발 시 Vite 프록시가 붙는 백엔드 포트(frontend/.env.development) */
  readonly VITE_DEV_PROXY_API_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
