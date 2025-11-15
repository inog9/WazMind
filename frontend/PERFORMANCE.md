# Frontend Performance Testing

## Overview

This document describes the performance testing setup for the WazMind frontend application.

## Running Performance Tests

```bash
# Run all performance tests
npm run test:performance

# Run all tests (including performance)
npm test

# Run with UI
npm run test:ui
```

## Test Categories

### 1. Component Render Performance

Tests measure how quickly React components render (thresholds adjusted for test environment):
- **FileUpload**: < 150ms (empty), < 500ms (20 files)
- **JobList**: < 100ms (empty), < 200ms (15 jobs)
- **RuleViewer**: < 100ms (empty), < 150ms (normal), < 300ms (large)
- **LoadingSkeleton**: < 30ms
- **ThemeToggle**: < 50ms
- **LoginButton**: < 30ms

### 2. Memory Leak Detection

Tests ensure components don't leak memory on repeated renders:
- Multiple render/unmount cycles
- Memory increase should be < 1MB for 10 renders

### 3. Utility Function Performance

Tests measure utility function execution time (thresholds adjusted for test environment):
- **patternDetector**: < 200ms (small), < 500ms (1000 lines), < 2000ms (10000 lines)
- **format utilities**: < 1ms per operation (file size), < 250ms (date formatting - test overhead)

### 4. Bundle Size

Expected bundle sizes:
- Main bundle: < 500KB
- Vendor bundle: < 1MB
- Total: < 2MB

## Performance Best Practices

1. **Use React.memo** for expensive components
2. **Lazy load** heavy components
3. **Debounce** frequent operations
4. **Virtualize** long lists
5. **Optimize images** and assets
6. **Code splitting** for routes

## Analyzing Bundle Size

```bash
# Build the application
npm run build

# Analyze bundle (if configured)
npm run analyze

# Check dist/ folder for actual sizes
ls -lh dist/
```

## Continuous Performance Monitoring

Consider integrating:
- **Lighthouse CI** for automated performance audits
- **Web Vitals** for real user monitoring
- **Bundle Analyzer** for size tracking

## Performance Targets

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1

