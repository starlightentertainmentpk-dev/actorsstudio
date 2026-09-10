# Sub-Prompt 17 — Vitest Testing Suite Setup

**Phase:** Tier 1 — Step 17 of 17  
**Depends on:** All previous phases.  
**Delivers:** Configured testing harness and integration tests validating onboarding rules, auth schema constraints, and status updates.

---

## Context

The master brief requires a testing suite (Vitest/Playwright) to prevent regressions on core registration, application, and booking flows. Currently, the workspace has no testing dependencies, test run scripts, or spec files configured. We will configure Vitest as the primary runner for unit and integration tests.

---

## Tasks

### 1. Install Testing Dependencies
Install the required test runner packages:
- Run in terminal:
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
  ```

### 2. Configure Vitest
Create a configuration file at the root: `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Create a setup file at the root: `vitest.setup.ts`:
```ts
import '@testing-library/jest-dom'
```

### 3. Add Script to package.json
Update your [package.json](file:///c:/My%20Drive/My%20Drive/ActorsStudio/package.json) to include the test execution script:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

### 4. Write Core Unit Tests
Create unit tests for form validators to ensure onboarding limits, requirements, and emails are checked properly:
- File: `src/lib/validations/onboarding.test.ts`
- Write tests validating:
  - [talent-onboarding.ts](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/lib/validations/talent-onboarding.ts) schema (checks height, weight, required dob).
  - [producer-onboarding.ts](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/lib/validations/producer-onboarding.ts) schema (checks valid company types).
  - [casting-call.ts](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/lib/validations/casting-call.ts) schema (checks deadlines must be future dates).

Example test:
```ts
import { describe, it, expect } from 'vitest'
import { talentStep1Schema } from './talent-onboarding'

describe('Talent Onboarding Validation', () => {
  it('should accept a complete Step 1 profile', () => {
    const result = talentStep1Schema.safeParse({
      full_name: 'Fawad Khan',
      city: 'Lahore',
      dob: '1981-11-29',
      gender: 'male',
    })
    expect(result.success).toBe(true)
  })

  it('should reject profiles with empty names', () => {
    const result = talentStep1Schema.safeParse({
      full_name: '',
      city: 'Lahore',
      dob: '1981-11-29',
      gender: 'male',
    })
    expect(result.success).toBe(false)
  })
})
```

---

## Verification

1. **Run Tests:**
   - Execute in terminal:
     ```bash
     npm run test
     ```
   - Verify that Vitest boots, runs the validation tests, and passes with zero errors.
