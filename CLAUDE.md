# CLAUDE.md

This file provides guidance for AI assistants (Claude Code and others) working in this repository. It documents the project structure, development workflows, and conventions to follow.

---

## Project Overview

**Repository:** tpogg/vibe
**Description:** A retro terminal portfolio site with an interconnected agent knowledge system.

The project contains:
1. **Terminal portfolio** (`index.html`) — a CRT-styled interactive terminal web app
2. **Agent knowledge system** (`knowledge/`) — a wiki-style knowledge graph about how agents think through external structures

---

## Repository Structure

```
vibe/
├── index.html                # Retro terminal portfolio web app
├── knowledge/                # Agent knowledge system
│   ├── index.md              # Root entry point — start here
│   ├── synthesis/            # Cross-cutting arguments
│   ├── mocs/                 # Maps of Content (topic hubs)
│   ├── notes/                # Atomic concept notes
│   ├── claims/               # Cross-domain insights
│   └── explorations/         # Open research questions
├── CLAUDE.md                 # This file
└── .github/                  # CI/CD workflows
```

---

## Development Setup

> Document the steps to get a development environment running. Example:

```bash
# Install dependencies
npm install          # or: pnpm install / yarn / pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Start development server
npm run dev
```

### Prerequisites

- List required tools, runtimes, and versions here (e.g., Node 20+, Python 3.11+, Docker)

### Environment Variables

Document required environment variables in `.env.example`. Never commit secrets or `.env` files.

---

## Development Workflow

### Branch Strategy

- **Main branch:** `main` — always deployable, protected
- **Feature branches:** `feature/<short-description>`
- **Fix branches:** `fix/<short-description>`
- **AI-generated branches:** `claude/<short-description>` (e.g., `claude/add-claude-documentation-lLJEP`)

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user authentication
fix: resolve race condition in queue processor
docs: update API reference
refactor: extract validation logic into helper
test: add coverage for edge cases in parser
chore: upgrade dependencies
```

### Pull Request Process

1. Create a focused branch from `main`
2. Make changes with clear, atomic commits
3. Ensure all tests pass and linting is clean
4. Open a PR with a descriptive title and summary
5. Address review feedback before merging

---

## Testing

> Document the testing approach once tests are in place. Example:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

**Conventions:**
- Unit tests live alongside source files or in a dedicated `tests/` directory
- Integration tests are clearly separated from unit tests
- Test files are named `*.test.ts` / `*.spec.ts` (or language equivalent)
- Aim for high coverage on business logic; avoid testing implementation details

---

## Code Style and Linting

> Document the linting and formatting tools used. Example:

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run typecheck
```

**Conventions:**
- Auto-formatting is preferred over manual style debates
- Linting rules are enforced in CI — do not skip with `--no-verify` without justification
- Follow language-idiomatic patterns (e.g., PEP 8 for Python, ESLint/Prettier for TypeScript)

---

## Key Conventions for AI Assistants

These rules apply whenever Claude Code or another AI assistant works in this repository:

### General

- Read existing code before modifying it — understand patterns before changing them
- Match the style, naming conventions, and abstractions already present in the codebase
- Prefer editing existing files over creating new ones
- Do not add features, refactors, or "improvements" beyond the stated task
- Do not add docstrings, comments, or type annotations to code you didn't change
- Do not add error handling for scenarios that cannot happen

### Security

- Never commit secrets, tokens, API keys, or credentials
- Never add `.env` files to version control
- Validate input at system boundaries (user input, external APIs); trust internal code
- Avoid OWASP Top 10 vulnerabilities: SQLi, XSS, command injection, etc.

### Git Operations

- Always develop on the designated branch (see branch strategy above)
- Use `git push -u origin <branch-name>`
- Do not force-push to `main` or shared branches
- Do not use `--no-verify` to skip hooks unless explicitly instructed
- Do not amend published commits — create new ones instead
- Stage specific files rather than `git add -A` to avoid accidentally committing sensitive files
- Do not create pull requests unless explicitly asked

### Risky Actions — Always Confirm First

Before taking any of these actions, explain the plan and ask for user confirmation:

- Deleting files, branches, or data
- Force-pushing (`git push --force`)
- Running destructive commands (`rm -rf`, `DROP TABLE`, etc.)
- Modifying CI/CD pipelines or deployment configuration
- Pushing to remote repositories
- Creating, commenting on, or closing GitHub issues and PRs

---

## Agent Knowledge System

The `knowledge/` directory contains an interconnected wiki-style knowledge graph. When working with it, follow these practices:

### Navigation

1. **Start at `knowledge/index.md`** — it lists all MOCs, synthesis notes, claims, and explorations
2. **Follow `[[wiki links]]`** to traverse between notes. Links map to file names: `[[graph-structure]]` → `knowledge/mocs/graph-structure.md`
3. **Use progressive disclosure** — read the MOC first, then drill into specific notes as needed. Don't load everything at once.

### File resolution for `[[wiki links]]`

Search in this order: `mocs/` → `notes/` → `synthesis/` → `claims/` → `explorations/`

### When adding new notes

- **One idea per note** — keep notes atomic
- **Title as claim** — use "X enables Y" not just "About X"
- **Link generously** — add `[[wiki links]]` to connect to existing notes
- **Update the parent MOC** — add the new note to the relevant MOC's list
- **Include metadata** — Type, Connected to, and a horizontal rule before content

### When modifying the knowledge system

- Don't delete notes without checking for incoming links (grep for the note name across all files)
- When splitting a note, update all files that link to it
- When a MOC grows past ~20 entries, consider extracting a sub-MOC

### Knowledge system domains

| MOC | Domain |
|-----|--------|
| `graph-structure` | Wiki links, topology, traversal |
| `agent-cognition` | Context windows, sessions, attention limits |
| `agent-cognition-hooks` | Automated quality enforcement |
| `agent-cognition-platforms` | Platform tiers, context file architecture |
| `discovery-retrieval` | Search, progressive disclosure, entry points |
| `processing-workflow` | Sessions, handoffs, pipeline stages |
| `note-quality` | Atomicity, density, evergreen principles |
| `system-evolution` | Growth, refactoring, maintenance |
| `human-agent-collaboration` | Role division, trust, interfaces |

---

## Architecture and Design Decisions

### ADR-001: Wiki-Link Knowledge Graph

- **Status:** Accepted
- **Context:** Agents need external structures to think with across sessions. Traditional docs are linear and hard to traverse selectively.
- **Decision:** Use a wiki-style knowledge graph with `[[links]]`, MOCs as hubs, and atomic notes. Plain markdown for platform-agnostic compatibility.
- **Consequences:** Enables progressive disclosure and efficient traversal. Requires ongoing link maintenance as the graph grows.

---

## CI/CD

> Document the CI/CD pipeline once it is configured. Example:

- **CI:** GitHub Actions — runs lint, tests, and type checks on every PR
- **CD:** Deployed to [platform] on merge to `main`
- **Environments:** `development`, `staging`, `production`

---

## Updating This File

Keep this file current as the project evolves. Update it when:

- New tools, frameworks, or dependencies are added
- Conventions change
- New team members or AI assistants need onboarding context
- Architectural decisions are made

Last updated: 2026-04-05
