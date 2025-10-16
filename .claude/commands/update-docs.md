# Update Documentation : Automatically Update All Project Documentation

This command automatically analyzes the project structure and updates all documentation files to keep them in sync with the codebase.

## Usage

To update all documentation files:
```
/update-docs
```

## What This Command Does

1. **Self-Update First**: Analyzes the project and updates this `/update-docs` command itself to ensure it reflects all current documentation files

2. **Analyze Project Structure**: Scans the entire project to understand:
   - Current features and components
   - API endpoints and integrations
   - Database models and schemas
   - Testing coverage and status
   - Recent changes and additions
   
3. **Identify Documentation Files**: Automatically discovers all documentation files:
   - `README.md` (root project README)
   - `CLAUDE.md` (Claude Code assistant instructions)
   - `QUICKSTART.md` (quick start guide)
   - `DEPLOYMENT.md` (deployment instructions)
   - `ARCHITECTURE.md` (system architecture documentation)
   - `DECISIONS.md` (technical decisions log)
   - `MVP_SCOPE.md` (MVP scope definition)
   - `PROJECT_REVIEW.md` (project review documentation)
   - `API_SPECIFICATION.md` (API specification document)
   - `FUTURE_FEATURES.md` (future features roadmap)
   - `docs/ARCHIVE/` folder containing historical documentation:
     - `DEPLOYMENT_GUIDE.md`
     - `DEVELOPMENT_GUIDE.md`
     - `MVP_PLAN.md`
     - `README.md`
     - `TESTING_PLAN.md`
     - `WEEK_1_SPRINT.md`
   - `.claude/agents/` specialized AI agents:
     - `valu-iframe-specialist.md`
     - `media-processor-agent.md`
     - `mongodb-newsletter-specialist.md`
     - `email-notification-agent.md`
     - `mock-api-specialist.md`
     - `newsletter-scraper-agent.md`
   - `.claude/commands/` command documentation:
     - `save.md`
     - `session-current.md`
     - `session-end.md`
     - `session-help.md`
     - `session-list.md`
     - `session-start.md`
     - `session-update.md`
     - `update-docs.md` (this file)
   - `.claude/sessions/` session tracking files
   - Any other documentation files discovered during analysis

4. **Update Documentation**: For each file:
   - Updates feature lists based on implemented functionality
   - Updates component and hook listings
   - Updates API endpoint documentation
   - Updates database schema documentation
   - Updates project structure diagrams
   - Updates test coverage information (57 test files with 859 tests - 854 passing, 5 skipped)
   - Updates environment variable requirements
   - Maintains consistent information across all docs

5. **Verify Consistency**: Ensures all documentation files contain matching information

6. **Summary Report**: Shows what was updated in each file

## Documentation Update Strategy

### Files to Update

1. **CLAUDE.md**:
   - Project structure and key files
   - Architecture decisions
   - Development guidelines
   - Important notes and patterns
   - Valu/ChabadUniverse integration details
   - MVP scope clarification

2. **README.md**:
   - Project overview and purpose
   - Tech stack and dependencies
   - Getting Started instructions
   - Available scripts
   - Project structure
   - Development workflow

3. **QUICKSTART.md**:
   - Rapid setup instructions
   - Environment configuration
   - Common development tasks
   - Testing commands

4. **Architecture & Planning Files**:
   - `ARCHITECTURE.md` - System design and components
   - `DECISIONS.md` - Technical decision log
   - `MVP_SCOPE.md` - MVP feature definitions
   - `PROJECT_REVIEW.md` - Project status and review
   - `API_SPECIFICATION.md` - API design specifications
   - `FUTURE_FEATURES.md` - Roadmap and future enhancements

5. **Deployment Files**:
   - `DEPLOYMENT.md` - Deployment instructions and configuration
   - Environment variables
   - Vercel configuration

6. **Self-Update** (`.claude/commands/update-docs.md`):
   - Discovers any new documentation files in the project
   - Updates its own file list to include newly found docs
   - Ensures the command stays current with project structure
   - Updates implementation steps based on project patterns

### Update Process

For each documentation file:
1. Read the current content
2. Analyze the entire codebase for relevant information
3. Update sections with accurate, current data
4. Ensure consistency with other documentation
5. Preserve manual content and custom sections

## Best Practices

- **Automatic Analysis**: Always analyzes the project first to ensure accuracy
- **Comprehensive Updates**: Updates ALL documentation files in one pass
- **Consistency**: Ensures all files contain matching information
- **Preserves Custom Content**: Maintains manually added sections
- **Current State**: Reflects the actual implementation, not plans

## Implementation Steps

1. **Self-Update Phase**:
   - Scan for all `*.md` files and documentation pages
   - Update this command file with any newly discovered documentation
   - Ensure all documentation paths are current
   - Note: Old summary files have been archived to `docs/archive/` folder

2. **Analysis Phase**:
   - Scan project structure using Glob patterns
   - Read and analyze:
     - Component directories (`components/**`)
     - Pages and API routes (`pages/**`)
     - Hooks and contexts (`hooks/**`, `contexts/**`)
     - Test files (`__tests__/**`)
     - Configuration files

3. **Update Phase**:
   - For each documentation file:
     - Identify sections that need updating
     - Update with current, accurate information
     - Maintain formatting and structure
   - Ensure consistency across all files

4. **Summary Phase**:
   - Provide a detailed summary of all updates made
   - List any new documentation files discovered
   - DO NOT automatically commit - let user review changes first