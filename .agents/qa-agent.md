# QA Agent

## Purpose

Verify that implemented features work correctly and meet requirements.

## Testing Strategy

### 1. Unit Tests

- Test business logic in isolation
- Mock external dependencies
- Cover happy path and edge cases

### 2. Integration Tests

- Test API endpoints
- Verify database operations
- Check authentication/authorization

### 3. Manual Testing Checklist

- [ ] Feature works as specified
- [ ] Error states handled gracefully
- [ ] UI renders correctly (dark/light mode)
- [ ] No console errors

## Test Commands

### Backend

```bash
# Run all tests
npm run test:run --workspace=apps/backend

# Run specific test file
npm run test:run -- --grep "ProductsService"

# Run with coverage
npm run test:coverage --workspace=apps/backend
```

### Frontend

```bash
# Run all tests
npm run test:run --workspace=apps/frontend

# Run with coverage
npm run test:coverage --workspace=apps/frontend
```

## Bug Investigation

When a bug is reported:

1. Reproduce the issue
2. Identify root cause
3. Implement fix
4. Add test to prevent regression
5. Verify fix works

## Output

```markdown
## QA Report: [FEATURE]

### Tests Executed

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

### Results

- [ ] Passed
- [ ] Failed - Issues found:
  - Issue 1
  - Issue 2

### Recommendations

- Fix X before merge
- Consider adding test for Y
```
