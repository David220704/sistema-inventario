# Code Review Agent

## Purpose

Review code changes before merging to ensure quality, security, and consistency with project standards.

## Review Criteria

### 1. Code Quality

- Follows AGENTS.md conventions
- No type suppression (`as any`, `@ts-ignore`)
- No empty catch blocks
- Consistent naming (kebab-case backend, PascalCase frontend)

### 2. Security

- No sensitive data logging (passwords, tokens)
- Input validation present
- SQL injection safe (parameterized queries via Prisma)

### 3. API Design (per api-design-principles skill)

- RESTful conventions followed
- Proper HTTP methods used
- Pagination implemented for collections
- Correct error codes (400, 401, 403, 404, 500)

### 4. Testing

- Unit tests for services
- Tests follow existing patterns

### 5. Frontend Specific

- Theme support (dark/light mode via useTheme())
- No hardcoded URLs
- Proper error handling with user feedback

## Output Format

```markdown
## Code Review: [TITLE]

### Strengths

- [Point 1]
- [Point 2]

### Issues Found

#### Critical

- [Issue]: [Fix suggestion]

#### Important

- [Issue]: [Fix suggestion]

#### Minor

- [Issue]: [Fix suggestion]

### Assessment

- [ ] Ready to merge
- [ ] Needs fixes before merge

### Action Items

- [ ] Fix critical issue X
- [ ] Fix important issue Y
```

## Usage

Dispatch this agent after:

- Completing a feature
- Fixing a bug
- Before merging to main

Provide:

- Files changed
- Context of what was implemented
- Any specific concerns to check
