/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_BASE_API_URL: string;
  readonly APP_ENABLE_NUKE: string;
  readonly APP_ENABLE_ASSIST: string;
  readonly APP_VAPID_PUBLIC_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
