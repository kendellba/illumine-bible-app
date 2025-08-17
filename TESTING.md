# Testing Guide for Illumine Bible App

This document provides comprehensive information about the testing strategy and implementation for the Illumine Bible App.

## Testing Strategy

The app follows a testing pyramid approach with three levels of testing:

### 1. Unit Tests (70% of tests)
- **Composables**: Business logic and state management
- **Utilities**: Data transformation and validation functions  
- **Components**: Individual component behavior and props
- **Services**: API interactions and data processing

### 2. Integration Tests (20% of tests)
- **Store Integration**: Pinia store interactions
- **API Integration**: Supabase client operations
- **Offline Sync**: IndexedDB operations and sync logic
- **Component Integration**: Complex component interactions

### 3. End-to-End Tests (10% of tests)
- **Critical User Flows**: Authentication, reading, bookmarking
- **Offline Scenarios**: PWA functionality and data persistence
- **Cross-Device Sync**: Multi-session synchronization

## Test Structure

```
src/
├── components/
│   ├── __tests__/           # Component unit tests
│   └── Component.vue
├── composables/
│   ├── __tests__/           # Composable unit tests
│   └── useComposable.ts
├── services/
│   ├── __tests__/           # Service unit and integration tests
│   └── service.ts
├── stores/
│   ├── __tests__/           # Store unit and integration tests
│   └── store.ts
├── utils/
│   ├── __tests__/           # Utility unit tests
│   └── utility.ts
├── views/
│   ├── __tests__/           # View component tests
│   └── View.vue
└── test-utils/              # Shared test utilities
    └── index.ts

e2e/                         # End-to-end tests
├── auth.spec.ts
├── bible-reading.spec.ts
├── bookmarking.spec.ts
├── search.spec.ts
└── pwa.spec.ts
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run unit tests once (CI mode)
npm run test:unit:run

# Run tests in watch mode
npm run test:unit -- --watch

# Run specific test file
npm run test:unit -- src/composables/__tests__/useAuth.test.ts

# Run tests with coverage
npm run test:unit -- --coverage
```

### End-to-End Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific E2E test
npm run test:e2e -- auth.spec.ts
```

### All Tests
```bash
# Run all tests (unit + E2E)
npm run test:all
```

## Test Configuration

### Vitest Configuration
- **Environment**: jsdom for DOM testing
- **Setup Files**: Automatic mock setup
- **Coverage**: Istanbul provider with detailed reporting
- **Globals**: Auto-imported test functions

### Playwright Configuration
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Testing**: Pixel 5, iPhone 12
- **Base URL**: http://localhost:4173 (preview server)
- **Retries**: 2 retries on CI, 0 locally

## Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingOptions } from '@/test-utils'
import MyComponent from '../MyComponent.vue'

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    const wrapper = mount(MyComponent, createTestingOptions())
    
    expect(wrapper.find('[data-testid="component"]').exists()).toBe(true)
  })
})
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should perform action', async ({ page }) => {
    await page.click('[data-testid="button"]')
    await expect(page.locator('[data-testid="result"]')).toBeVisible()
  })
})
```

## Test Utilities

The app provides comprehensive test utilities in `src/test-utils/index.ts`:

### Mock Data Generators
- `createMockUser()` - Generate mock user data
- `createMockVerse()` - Generate mock verse data
- `createMockBookmark()` - Generate mock bookmark data
- `createMockNote()` - Generate mock note data
- `createMockHighlight()` - Generate mock highlight data

### Store Mocks
- `createMockAppStore()` - Mock app store
- `createMockBibleStore()` - Mock bible store
- `createMockUserStore()` - Mock user store

### Service Mocks
- `createMockBibleContentService()` - Mock bible content service
- `createMockUserContentService()` - Mock user content service
- `createMockSyncService()` - Mock sync service

### Setup Helpers
- `setupTestPinia()` - Setup Pinia for testing
- `createTestingOptions()` - Create Vue Test Utils options
- `createMockLocalStorage()` - Mock localStorage
- `createMockIndexedDB()` - Mock IndexedDB

## Testing Best Practices

### 1. Test Structure
- Use descriptive test names
- Group related tests with `describe` blocks
- Use `beforeEach` for common setup
- Clean up mocks between tests

### 2. Component Testing
- Test component behavior, not implementation
- Use `data-testid` attributes for reliable element selection
- Test user interactions and state changes
- Mock external dependencies

### 3. Store Testing
- Test state mutations and getters
- Test async actions with proper mocking
- Verify side effects and error handling
- Test store persistence

### 4. Service Testing
- Mock external API calls
- Test error handling and retry logic
- Verify data transformation
- Test offline scenarios

### 5. E2E Testing
- Focus on critical user journeys
- Test cross-browser compatibility
- Verify PWA functionality
- Test offline/online transitions

## Mocking Strategies

### 1. External Services
```typescript
vi.mock('@/services/supabase', () => ({
  supabase: createMockSupabase()
}))
```

### 2. Browser APIs
```typescript
vi.mock('navigator', () => ({
  serviceWorker: {
    register: vi.fn(),
    getRegistration: vi.fn()
  }
}))
```

### 3. Vue Router
```typescript
vi.mock('vue-router', () => ({
  useRouter: () => createMockRouter(),
  useRoute: () => ({ name: 'home', params: {} })
}))
```

## Coverage Requirements

- **Overall Coverage**: Minimum 80%
- **Critical Paths**: 95% coverage required
- **New Features**: 90% coverage required
- **Bug Fixes**: Must include regression tests

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Release branches

### CI Pipeline
1. Install dependencies
2. Run linting
3. Run unit tests with coverage
4. Build application
5. Run E2E tests
6. Generate test reports

## Debugging Tests

### Unit Tests
```bash
# Debug specific test
npm run test:unit -- --reporter=verbose src/path/to/test.ts

# Debug with browser devtools
npm run test:unit -- --inspect-brk
```

### E2E Tests
```bash
# Debug with Playwright inspector
npm run test:e2e -- --debug

# Run with trace viewer
npm run test:e2e -- --trace on
```

## Performance Testing

### Bundle Analysis
```bash
# Analyze bundle size
npm run build -- --analyze

# Check for performance regressions
npm run test:performance
```

### Lighthouse Testing
E2E tests include Lighthouse audits for:
- Performance scores
- Accessibility compliance
- PWA requirements
- SEO optimization

## Accessibility Testing

### Automated Testing
- axe-core integration in component tests
- WCAG compliance checks
- Keyboard navigation testing
- Screen reader compatibility

### Manual Testing
- Test with actual screen readers
- Verify keyboard-only navigation
- Check color contrast ratios
- Validate ARIA attributes

## Test Data Management

### Fixtures
- Use consistent test data across tests
- Store complex test data in fixture files
- Version control test data changes

### Database State
- Reset database state between tests
- Use transactions for test isolation
- Mock external data sources

## Troubleshooting

### Common Issues

1. **Flaky Tests**
   - Add proper wait conditions
   - Use deterministic test data
   - Avoid time-based assertions

2. **Slow Tests**
   - Mock heavy operations
   - Use test-specific configurations
   - Parallelize test execution

3. **Memory Leaks**
   - Clean up event listeners
   - Clear timers and intervals
   - Reset global state

### Getting Help

- Check test logs for detailed error messages
- Use debugging tools and breakpoints
- Consult team documentation
- Review similar test implementations

## Future Improvements

- Visual regression testing
- Performance benchmarking
- Cross-device testing
- Automated accessibility audits
- API contract testing