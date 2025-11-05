ב׳׳ה

# Living with the Rebbe CMS Implementation Roadmap

## Phase 1: Proof of Concept
- Enable HTML content posting to Community Discussions (Shluchim Exchange)
- Implement public file storage in the CMS with unauthenticated access
- Generate accessible URLs for CMS content (currently unavailable)

## Phase 2: API Integration
- **Server-Side Development**
  - Build API endpoints for CMS file operations with URL response handling
  - Create access control endpoint with authentication and permission management
  
- **File Access Settings**
  - **Access Levels:**
    - [ ] Public - Open access
    - [ ] Permissioned - Requires authentication and channel membership
    - [ ] Private - Requires authentication only
  - **Expiration Options:**
    - [ ] No expiration
    - [ ] Time-limited access (specify lifespan)

- **Micro Application Implementation**
  - Develop admin tool to scrape and import issues into Chabad Universe with a single click of a button
  - Store supporting files in CMS with configured access settings
  - Generate public URLs based on file permissions
  - Update HTML content with new URL references
  - Publish revised issues to channels with updated URLs

## Phase 3: Full Automation
- **API Key Support**
  - Extend server functions to accept API key authentication
  - Enable automated job execution without user intervention
  
- **Automated Processing**
  - Implement scheduled job to scrape archives for latest issues
  - Automatically save new content to CMS
  - Distribute issues via email to channel subscribers with updated URLs