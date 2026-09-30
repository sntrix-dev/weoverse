#!/usr/bin/env node
// Regenerates src/api/generated/schema.d.ts from the backend's OpenAPI spec.
//   npm run api:types                         → http://localhost:3002/api/docs.json (backend running)
//   npm run api:types -- ../weo-3.0/openapi.json   → a spec file built with `npm run docs:build` in weo-3.0
// Code wins over Swagger: if a live response disagrees with the generated type, fix the YAML
// in the backend module branch and regenerate (docs/05-api-integration.md).
import { execFileSync } from 'node:child_process';

const source = process.argv[2] || `${process.env.VITE_API_URL || 'http://localhost:3002'}/api/docs.json`;
const out = 'src/api/generated/schema.d.ts';
console.log(`openapi-typescript ${source} → ${out}`);
execFileSync('npx', ['openapi-typescript', source, '-o', out], { stdio: 'inherit' });
