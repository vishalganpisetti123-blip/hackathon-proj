import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = defineConfig([{ ignores: ['public/wasm/**', 'out/**'] }, ...nextVitals, ...nextTypescript]);

export default config;
