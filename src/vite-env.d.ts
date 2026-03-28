/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_BASE_API_URL: string;
  readonly APP_ENABLE_NUKE: string;
  readonly APP_ENABLE_ASSIST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
