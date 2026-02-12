# Phase 05 UAT Plan - Resources Management & Sharing

**Phase:** 05 - Resources Management & Sharing
**Test Date:** 2026-02-12
**Tester:** Playwright MCP Automation
**Application URL:** http://localhost:3000

## Prerequisites

### Environment Setup
- [ ] Database migrated (resource, resourceShare tables exist)
- [ ] Next.js dev server running on port 3000
- [ ] `.env.local` configured with DATABASE_URL and GOOGLE_GENERATIVE_AI_API_KEY
- [ ] Test user credentials available (or create during test)

### Test Data Requirements
- Test user email: test@example.com
- Test user password: TestPassword123!
- Test images: Have a valid PNG/JPEG file ready (< 10MB)

---

## Test Suite 1: Resource Lifecycle (Save → Browse → Search)

### Test 1.1: Save Agent Workflow as Resource

**Objective:** Verify users can save completed agent workflows as Resources

**Prerequisites:**
- User logged in
- At least one conversation with agent execution completed

**Steps:**
1. Navigate to home page (/)
2. If no conversations exist, create one and trigger an agent execution
3. Look for an agent result message with "Save as Resource" button
4. Click "Save as Resource" button
5. Verify SaveResourceDialog opens
6. Enter name: "Test Deployment Workflow"
7. Enter description: "Automated deployment workflow for testing"
8. Click "Save Resource" button
9. Wait for success toast notification
10. Navigate to /resources page

**Expected Results:**
- SaveResourceDialog displays with name and description inputs
- Save button disabled until name entered
- Success toast appears: "Resource saved successfully"
- Resource appears in browser grid with:
  - Name: "Test Deployment Workflow"
  - Type: "workflow"
  - Timestamp: "just now" or similar
  - Description visible on card

**Verification Queries:**
```sql
SELECT id, name, description, resourceType, userId,
       parentResourceId, forkCount, executionCount, createdAt
FROM resource
WHERE name = 'Test Deployment Workflow'
ORDER BY createdAt DESC LIMIT 1;
```

**Automation Notes:**
- Use `browser_snapshot` to find "Save as Resource" button
- Use `browser_click` with button ref
- Use `browser_type` for name and description inputs
- Use `browser_snapshot` on /resources to verify card appears

---

### Test 1.2: Resource Browser Display

**Objective:** Verify Resources page displays saved resources correctly

**Steps:**
1. Navigate to /resources
2. Verify page header shows "Resources"
3. Verify page description shows explanatory text
4. Verify resource grid displays
5. Count resource cards visible
6. Verify each card shows:
   - Resource name
   - Resource type badge
   - Created timestamp
   - Description (or "No description")
   - Action buttons (Execute, Share, Delete)

**Expected Results:**
- Header: "Resources"
- Grid layout (responsive: 1 col mobile, 2 cols tablet, 3 cols desktop)
- All saved resources visible
- Cards have hover effects
- Empty state shows if no resources: "No resources found. Save your first workflow to get started."

**Automation Notes:**
- Use `browser_snapshot` to capture page structure
- Verify grid container exists with class matching "grid"
- Count ResourceCard components

---

### Test 1.3: Resource Search Functionality

**Objective:** Verify search filters resources by name and description

**Prerequisites:**
- At least 3 resources saved with different names:
  - "Deploy Application"
  - "Monitor Services"
  - "Deploy Infrastructure"

**Steps:**
1. Navigate to /resources
2. Count total resources displayed
3. Click into search input
4. Type "deploy" (lowercase)
5. Wait for debounce (300ms)
6. Count filtered resources
7. Verify only resources with "deploy" in name/description shown
8. Clear search input
9. Verify all resources reappear

**Expected Results:**
- Search is case-insensitive
- Search matches both name and description
- Results filter in real-time (300ms debounce)
- Empty search shows all resources
- Search for "deploy" shows 2 results (Deploy Application, Deploy Infrastructure)
- Search for "monitor" shows 1 result

**Automation Notes:**
- Use `browser_type` with `slowly: true` to trigger debounce
- Use `browser_wait_for` with textGone to verify filtering
- Count cards after each search

---

### Test 1.4: Resource Type Filter

**Objective:** Verify type dropdown filters resources correctly

**Prerequisites:**
- Resources of different types exist (workflow, prompt, agent_config)

**Steps:**
1. Navigate to /resources
2. Locate type filter dropdown (default: "All Types")
3. Click dropdown
4. Select "Workflows"
5. Verify only workflow resources shown
6. Click dropdown
7. Select "All Types"
8. Verify all resources shown again

**Expected Results:**
- Dropdown shows options: All Types, Workflows, Prompts, Agent Configs
- Selecting filter updates resource list immediately
- Empty state if no resources match filter
- Filter persists during search (both filters work together)

**Automation Notes:**
- Use `browser_select_option` for dropdown
- Verify filtered results with `browser_snapshot`

---

## Test Suite 2: Resource Sharing

### Test 2.1: Generate Share Link

**Objective:** Verify users can create shareable links for resources

**Steps:**
1. Navigate to /resources
2. Click "Share" button on first resource
3. Verify ShareDialog opens
4. Verify expiration input present (optional)
5. Enter "7" in expiration days input
6. Click "Generate Share Link" button
7. Wait for share URL to appear
8. Verify URL format: http://localhost:3000/resources/share/[token]
9. Verify token length is 21 characters
10. Click copy button
11. Verify success toast: "Link copied to clipboard"

**Expected Results:**
- ShareDialog opens with clear instructions
- Expiration input accepts numbers
- Generate button creates link
- URL displayed in read-only input
- Copy button shows checkmark after click
- Token is 21 characters (128-bit entropy)

**Verification Queries:**
```sql
SELECT id, resourceId, shareToken, expiresAt,
       accessCount, maxAccesses, createdAt
FROM resource_share
ORDER BY createdAt DESC LIMIT 1;
```

**Automation Notes:**
- Use `browser_click` for Share button on ResourceCard
- Use `browser_type` for expiration input
- Use `browser_evaluate` to read clipboard if needed
- Extract shareToken from URL for later tests

---

### Test 2.2: Access Shared Resource (Public)

**Objective:** Verify shared links work without authentication

**Prerequisites:**
- Share link generated from Test 2.1

**Steps:**
1. Copy share URL from Test 2.1
2. Open new browser tab or incognito window
3. Navigate to share URL
4. Verify page loads without login redirect
5. Verify resource preview displays:
   - Resource name
   - Resource type
   - Fork count
   - Execution count
   - Description
   - Workflow preview
6. Verify "Fork This Resource" button present
7. Check if clicking Fork redirects to login (no auth)

**Expected Results:**
- Page loads without authentication
- All resource metadata visible
- Workflow content displayed (request text, step count)
- Fork button visible but requires login to use
- No userId or sensitive data exposed

**Verification Queries:**
```sql
-- Verify accessCount incremented
SELECT shareToken, accessCount
FROM resource_share
WHERE shareToken = '[token-from-test-2.1]';
```

**Automation Notes:**
- Use `browser_tabs` to open new tab
- Use `browser_navigate` to share URL
- Use `browser_snapshot` to verify content
- Check accessCount incremented in database

---

### Test 2.3: Share Link Expiration

**Objective:** Verify expired share links return error

**Prerequisites:**
- Ability to create share link with short expiration (1 minute)

**Steps:**
1. Navigate to /resources
2. Click Share on a resource
3. Enter "1" minute expiration (requires manual database edit for testing)
4. Generate link
5. Access link immediately → should work
6. Update database: `UPDATE resource_share SET expiresAt = NOW() - INTERVAL '1 minute' WHERE shareToken = '[token]'`
7. Access link again
8. Verify error page displays
9. Verify error message: "Share link has expired"
10. Verify HTTP status 410 (Gone)

**Expected Results:**
- Valid link works before expiration
- Expired link returns clear error
- Error page shows helpful message
- HTTP 410 status code
- No resource content leaked

**Automation Notes:**
- Use `browser_network_requests` to verify 410 status
- Requires database manipulation between steps
- Use Bash tool for SQL updates

---

### Test 2.4: Share Link Access Limits

**Objective:** Verify maxAccesses limit enforced

**Prerequisites:**
- Share link with maxAccesses: 2

**Steps:**
1. Create resource share with maxAccesses = 2 (database insert)
2. Access share link (first access)
3. Verify accessCount = 1
4. Access share link (second access)
5. Verify accessCount = 2
6. Access share link (third access)
7. Verify error: "Share link access limit reached"
8. Verify HTTP status 429 (Too Many Requests)

**Expected Results:**
- First 2 accesses work normally
- Third access returns error
- accessCount increments correctly
- HTTP 429 status
- Clear error message

**Automation Notes:**
- Requires database setup for share with limits
- Multiple navigation attempts
- Verify network response codes

---

## Test Suite 3: Resource Forking

### Test 3.1: Fork Resource with Lineage

**Objective:** Verify users can fork resources and lineage tracked

**Prerequisites:**
- User logged in
- Resource available to fork (from share link or own resource)

**Steps:**
1. Navigate to shared resource page or /resources
2. Click "Fork" button (or "Fork This Resource" on share page)
3. Verify ForkDialog opens
4. Read fork explanation text
5. Click "Fork Resource" button
6. Wait for success toast
7. Verify redirect to /resources
8. Locate forked resource in grid
9. Verify fork name: "[Original Name] (Fork)"
10. Verify badge/text: "Forked from original"
11. Verify fork has separate resource ID

**Expected Results:**
- ForkDialog explains fork behavior clearly
- Fork button creates independent copy
- Fork name appends " (Fork)"
- parentResourceId set to original resource ID
- Fork appears in forking user's workspace
- Original resource forkCount incremented
- Fork has isPublic = false (private by default)

**Verification Queries:**
```sql
-- Verify fork created
SELECT id, name, parentResourceId, userId, isPublic
FROM resource
WHERE name LIKE '% (Fork)'
ORDER BY createdAt DESC LIMIT 1;

-- Verify original forkCount incremented
SELECT id, name, forkCount
FROM resource
WHERE id = (
  SELECT parentResourceId
  FROM resource
  WHERE name LIKE '% (Fork)'
  ORDER BY createdAt DESC LIMIT 1
);
```

**Automation Notes:**
- Use `browser_click` for Fork button
- Verify dialog content with `browser_snapshot`
- Check redirect with URL verification
- Query database to verify lineage

---

### Test 3.2: Forked Resource Independence

**Objective:** Verify fork modifications don't affect original

**Prerequisites:**
- Forked resource from Test 3.1

**Steps:**
1. Navigate to /resources
2. Locate forked resource
3. Note original resource ID and content
4. Modify fork description (requires edit functionality)
5. Verify original resource unchanged
6. Delete fork
7. Verify original resource still exists

**Expected Results:**
- Fork has separate database row
- Changes to fork don't affect original
- Deleting fork doesn't cascade to original
- Fork shows "Forked from [original]" lineage

**Automation Notes:**
- May require edit functionality (not in current phase)
- Use database queries to verify independence
- Delete via DELETE /api/resources/[id]

---

## Test Suite 4: Resource Execution

### Test 4.1: Execute Resource Workflow

**Objective:** Verify executing resource updates metadata

**Prerequisites:**
- User logged in
- Resource with workflow content saved

**Steps:**
1. Navigate to /resources
2. Note resource executionCount (should be 0)
3. Click "Execute" button on resource
4. Verify toast notification appears
5. Verify navigation to / (chat page)
6. Check console/network for agentRequest extraction
7. Query database for updated executionCount
8. Query database for updated lastExecutedAt

**Expected Results:**
- Execute button calls executeResource Server Action
- executionCount increments by 1
- lastExecutedAt timestamp updated
- agentRequest extracted from resource.content
- Toast: "Starting workflow execution..."
- User redirected to chat page

**Known Limitation:**
- TODO at resource-card.tsx:34 indicates auto-trigger pending
- Agent execution must be manually triggered in chat

**Verification Queries:**
```sql
SELECT id, name, executionCount, lastExecutedAt
FROM resource
WHERE name = 'Test Deployment Workflow'
ORDER BY updatedAt DESC LIMIT 1;
```

**Automation Notes:**
- Use `browser_click` for Execute button
- Use `browser_console_messages` to check for agentRequest
- Verify metadata updates via database query

---

## Test Suite 5: Multimodal Input

### Test 5.1: Image Upload in Chat

**Objective:** Verify users can upload images in chat interface

**Prerequisites:**
- User logged in
- Test image file available (PNG, < 10MB)
- Path to test image: /tmp/test-image.png

**Steps:**
1. Navigate to / (chat page)
2. Locate message input area
3. Click "Add Image" button
4. Verify file picker appears
5. Select test image file
6. Verify image preview displays (max 200px width)
7. Verify "Upload Image" button appears
8. Click "Upload Image"
9. Wait for upload completion
10. Verify uploaded image displays inline (max 150px)
11. Verify image has unique filename with nanoid
12. Type message: "Describe this image"
13. Click Send
14. Wait for AI response

**Expected Results:**
- Add Image button visible and clickable
- File picker accepts image types only
- Preview shows before upload
- Upload triggers uploadImage Server Action
- Image saved to public/uploads/images/[nanoid].[ext]
- Inline display after upload
- Image URL passed with message
- message.attachments JSONB populated
- AI receives multimodal message format

**Verification:**
```bash
# Check uploaded file exists
ls -lh public/uploads/images/
```

```sql
-- Verify attachments field populated
SELECT id, content, attachments, createdAt
FROM message
WHERE attachments IS NOT NULL
ORDER BY createdAt DESC LIMIT 1;
```

**Automation Notes:**
- Use `browser_file_upload` for image selection
- Use `browser_snapshot` to verify preview
- Use `browser_click` for upload button
- Check filesystem for uploaded file
- Verify database attachments JSONB field

---

### Test 5.2: Image Upload Validation

**Objective:** Verify upload validation rejects invalid files

**Test Cases:**

**5.2a: File Too Large (> 10MB)**
1. Attempt to upload 15MB image
2. Verify client-side validation
3. Verify error toast: "File too large. Maximum size: 10MB"
4. Verify upload prevented

**5.2b: Invalid File Type**
1. Attempt to upload .txt file
2. Verify error toast: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP"
3. Verify upload prevented

**5.2c: Valid File Types**
1. Test JPEG → should work
2. Test PNG → should work
3. Test GIF → should work
4. Test WebP → should work

**Expected Results:**
- Client-side validation prevents invalid uploads
- Clear error messages for each validation failure
- Only allowed types accepted
- Size limit enforced

**Automation Notes:**
- Create test files of various sizes/types
- Use `browser_file_upload` for each test
- Verify toast messages appear

---

## Test Suite 6: Web Search Integration

### Test 6.1: Search Keyword Detection

**Objective:** Verify chat detects search keywords and triggers search

**Steps:**
1. Navigate to / (chat page)
2. Type message: "search for React 19 new features"
3. Click Send
4. Monitor network requests
5. Verify POST to /api/search with query
6. Wait for AI response
7. Verify response includes search results context

**Expected Results:**
- Keywords detected: "search for", "look up", "search:"
- POST /api/search called with extracted query
- DuckDuckGo API queried
- Top 5 results returned
- Results formatted into contextPrompt
- AI system prompt includes search context
- AI response references search findings

**Automation Notes:**
- Use `browser_type` for message
- Use `browser_network_requests` to verify API calls
- Check response includes search context

---

### Test 6.2: Search Context Injection

**Objective:** Verify search results injected into AI context

**Steps:**
1. Type: "search for TypeScript 5.0 features"
2. Send message
3. Capture AI response
4. Verify response mentions specific features from search
5. Verify response quality (relevant to search query)

**Expected Results:**
- Search results fetched from DuckDuckGo
- Results formatted: "[1] Title\nSnippet\nURL: ..."
- contextPrompt injected into system message
- AI response incorporates search findings
- AI may cite sources or URLs

**Automation Notes:**
- Use `browser_console_messages` to check context injection
- Verify AI response content quality manually

---

## Test Suite 7: Database Integrity

### Test 7.1: Foreign Key Cascade Deletes

**Objective:** Verify cascade deletes work correctly

**Steps:**
1. Create test user
2. Create resource for user
3. Create resourceShare for resource
4. Note resource ID and share ID
5. Delete user
6. Verify resource deleted (cascade)
7. Verify resourceShare deleted (cascade)

**Expected Results:**
- Deleting user cascades to resources
- Deleting resource cascades to shares
- No orphaned records

**Verification Queries:**
```sql
-- Should return 0 rows after user delete
SELECT COUNT(*) FROM resource WHERE userId = '[deleted-user-id]';
SELECT COUNT(*) FROM resource_share WHERE resourceId = '[deleted-resource-id]';
```

---

### Test 7.2: Share Token Uniqueness

**Objective:** Verify shareToken unique constraint works

**Steps:**
1. Create share link for resource A
2. Attempt to insert duplicate shareToken manually
3. Verify unique constraint error
4. Create another share link for resource B
5. Verify different token generated

**Expected Results:**
- shareToken has UNIQUE constraint
- Duplicate tokens rejected
- nanoid(21) generates unique tokens

**Automation Notes:**
- Use Bash tool for SQL inserts
- Verify constraint error thrown

---

## Test Suite 8: Edge Cases & Error Handling

### Test 8.1: Unauthenticated Access

**Objective:** Verify protected routes require authentication

**Test Cases:**
- GET /api/resources → 401
- POST /api/search → 401
- POST /api/resources/[id]/execute → 401
- /resources page → redirect to /login

**Automation Notes:**
- Clear cookies to simulate logout
- Attempt access to protected routes
- Verify 401 or redirect responses

---

### Test 8.2: Resource Ownership Validation

**Objective:** Verify users can only modify their own resources

**Steps:**
1. User A creates resource
2. Note resource ID
3. User B attempts to delete User A's resource
4. Verify 404 or unauthorized error
5. Verify resource still exists

**Expected Results:**
- All mutations check userId ownership
- Unauthorized users cannot modify others' resources
- deleteResource checks ownership
- updateResource checks ownership (if implemented)

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Start Next.js dev server: `npm run dev`
- [ ] Verify database connection
- [ ] Run migrations: `npm run db:push`
- [ ] Create test user account
- [ ] Create test image files
- [ ] Open Playwright MCP session

### Test Execution Order
1. [ ] Test Suite 1: Resource Lifecycle (4 tests)
2. [ ] Test Suite 2: Resource Sharing (4 tests)
3. [ ] Test Suite 3: Resource Forking (2 tests)
4. [ ] Test Suite 4: Resource Execution (1 test)
5. [ ] Test Suite 5: Multimodal Input (2 tests)
6. [ ] Test Suite 6: Web Search (2 tests)
7. [ ] Test Suite 7: Database Integrity (2 tests)
8. [ ] Test Suite 8: Edge Cases (2 tests)

### Post-Test Cleanup
- [ ] Review screenshots in .playwright-mcp/
- [ ] Review console logs
- [ ] Review network request logs
- [ ] Clean up test data from database
- [ ] Document any failures or issues

---

## Expected Outcomes Summary

### Success Criteria
- All 18 requirements from Phase 05 validated
- Resource save/browse/search/filter working
- Share links generate with correct tokens
- Fork creates independent copies with lineage
- Image upload accepts valid files, rejects invalid
- Web search triggers on keywords
- AI receives multimodal messages
- All database constraints enforced
- All auth guards working

### Known Limitations
- Execute button has TODO (agent auto-trigger pending)
- Multi-user scenarios require separate browser contexts
- AI quality testing is subjective (manual verification needed)

---

## Test Report Template

```markdown
# Phase 05 UAT Report

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** http://localhost:3000
**Database:** PostgreSQL [version]

## Summary
- Tests Executed: X / 19
- Tests Passed: X
- Tests Failed: X
- Tests Blocked: X

## Detailed Results

### Test 1.1: Save Agent Workflow as Resource
**Status:** [PASS/FAIL/BLOCKED]
**Notes:** [Details]
**Screenshots:** [Paths]

[Repeat for each test]

## Issues Found
1. [Issue description]
   - Severity: [High/Medium/Low]
   - Steps to reproduce
   - Expected vs Actual

## Recommendations
[Next steps, fixes needed, etc.]
```

---

**End of UAT Plan**
