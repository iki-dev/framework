# Contributing

Iki is still in early stages of development and things might be undocumented, if you want to contribute and help shape the project, please continue reading.

## Guidelines

### Branching Strategy

#### Main branch

The main branch is the default branch and represents the current stable release of the project. It is protected and can only be merged into by authorised maintainers. The main branch is always deployable and auto-publishes to npm@latest.

```
main (default)
├── Always deployable
├── Protected branch
├── Auto-publishes to npm@latest
└── Represents current stable release
```

#### Branch Naming Convention

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `chore/` - Maintenance, deps, tooling
- `perf/` - Performance improvements
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

## How to Contribute

### Prerequisites

- Install Node.js (>22.x) and npm.

### Workflow

- Fork the repository on GitHub.
- Clone your forked repository to your local machine.
- Create a new branch based on the appropriate branch naming convention.
- Make your changes and commit them with a descriptive message.
- Use Changesets to add a new change to the changelog (see below)
- Commit the changeset changes. (Please do this separately to your code changes to keep a cleaner commit history)
- Push your changes to your forked repository.
- Create a pull request to the main repository.

#### Using Changesets

Changesets is a tool that helps you manage your project's versioning and changelog. It allows you to create a new change entry in the changelog and automatically update the version number based on the type of change you're making.

```bash
npx changeset
```

This will prompt you to select the type of change you're making and provide a description of the change. Changesets will then create a new change entry in the changelog and update the version number accordingly.
