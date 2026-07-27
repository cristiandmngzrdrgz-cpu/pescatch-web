import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scripts de uso local — no forman parte del build de producción.
    // Tienen any/console deliberados y no necesitan cumplir las mismas reglas.
    "scripts/**",
  ]),
  // Reglas relajadas para archivos de datos/seed que no son código de app.
  {
    files: ["src/lib/seed.ts", "src/data/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
