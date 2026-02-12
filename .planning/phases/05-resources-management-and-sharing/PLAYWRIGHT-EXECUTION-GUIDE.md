# Playwright MCP Execution Guide - Phase 05 UAT

**Quick Start Guide for Testing Phase 05 with Playwright MCP**

This guide assumes you're starting with fresh context and need step-by-step Playwright commands.

---

## Setup (Run Once)

### 1. Environment Check
```bash
# Verify server running
curl -I http://localhost:3000

# Verify database tables exist
psql $DATABASE_URL -c "\dt resource*"
```

### 2. Create Test Image
```bash
# Create a small test PNG (1x1 transparent pixel)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-image.png

# Verify file created
ls -lh /tmp/test-image.png
```

---

## Quick Test Sequence (Core Flows)

### Test Flow 1: Login & Navigation

```javascript
// 1. Navigate to app
mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })

// 2. Take snapshot to see login page
mcp__plugin_playwright_playwright__browser_snapshot()

// 3. Fill login form (adjust selectors based on snapshot)
mcp__plugin_playwright_playwright__browser_fill_form({
  fields: [
    { name: "email", type: "textbox", ref: "[ref-from-snapshot]", value: "test@example.com" },
    { name: "password", type: "textbox", ref: "[ref-from-snapshot]", value: "TestPassword123!" }
  ]
})

// 4. Click login button
mcp__plugin_playwright_playwright__browser_click({
  element: "login button",
  ref: "[ref-from-snapshot]"
})

// 5. Wait for redirect and verify logged in
mcp__plugin_playwright_playwright__browser_wait_for({ text: "New conversation" })
```

---

### Test Flow 2: Save Resource (Critical Path)

**Goal:** Save an agent workflow as a resource

```javascript
// 1. Navigate to home/chat
mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })

// 2. Take snapshot to find UI elements
mcp__plugin_playwright_playwright__browser_snapshot()

// 3. Look for agent result message with "Save as Resource" button
// If no agent messages exist, create one first:

// Option A: Find existing "Save as Resource" button
mcp__plugin_playwright_playwright__browser_snapshot()
// Look for agent_result messages in output
mcp__plugin_playwright_playwright__browser_click({
  element: "Save as Resource button",
  ref: "[ref-from-snapshot]"
})

// 4. Fill save dialog
mcp__plugin_playwright_playwright__browser_type({
  element: "name input",
  ref: "[ref-from-snapshot]",
  text: "Test Deployment Workflow"
})

mcp__plugin_playwright_playwright__browser_type({
  element: "description textarea",
  ref: "[ref-from-snapshot]",
  text: "Automated deployment workflow for UAT testing"
})

// 5. Click Save button
mcp__plugin_playwright_playwright__browser_click({
  element: "Save Resource button",
  ref: "[ref-from-snapshot]"
})

// 6. Wait for success toast
mcp__plugin_playwright_playwright__browser_wait_for({ text: "saved successfully" })

// 7. Navigate to resources page
mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/resources" })

// 8. Verify resource appears
mcp__plugin_playwright_playwright__browser_snapshot()
// Look for "Test Deployment Workflow" in output
```

---

### Test Flow 3: Resource Browser & Search

**Goal:** Browse resources and test search

```javascript
// 1. Navigate to resources
mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/resources" })

// 2. Take snapshot
mcp__plugin_playwright_playwright__browser_snapshot()

// 3. Count resources (look for ResourceCard components in snapshot)

// 4. Test search
mcp__plugin_playwright_playwright__browser_type({
  element: "search input",
  ref: "[ref-from-snapshot]",
  text: "deploy",
  slowly: true  // Triggers debounce
})

// 5. Wait for filter to apply
mcp__plugin_playwright_playwright__browser_wait_for({ time: 0.5 })

// 6. Take snapshot to see filtered results
mcp__plugin_playwright_playwright__browser_snapshot()

// 7. Clear search
mcp__plugin_playwright_playwright__browser_type({
  element: "search input",
  ref: "[ref-from-snapshot]",
  text: ""
})

// 8. Test type filter
mcp__plugin_playwright_playwright__browser_select_option({
  element: "type filter dropdown",
  ref: "[ref-from-snapshot]",
  values: ["workflow"]
})

// 9. Verify filtered results
mcp__plugin_playwright_playwright__browser_snapshot()
```

---

### Test Flow 4: Share Resource

**Goal:** Generate share link and access it

```javascript
// 1. Go to resources page
mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/resources" })
mcp__plugin_playwright_playwright__browser_snapshot()

// 2. Click Share button on first resource
mcp__plugin_playwright_playwright__browser_click({
  element: "Share button",
  ref: "[ref-from-snapshot-for-first-resource-card]"
})

// 3. Verify ShareDialog opens
mcp__plugin_playwright_playwright__browser_snapshot()

// 4. Enter expiration (optional)
mcp__plugin_playwright_playwright__browser_type({
  element: "expiration input",
  ref: "[ref-from-snapshot]",
  text: "7"
})

// 5. Click Generate button
mcp__plugin_playwright_playwright__browser_click({
  element: "Generate Share Link button",
  ref: "[ref-from-snapshot]"
})

// 6. Wait for link to appear
mcp__plugin_playwright_playwright__browser_wait_for({ text: "/resources/share/" })

// 7. Take snapshot to capture share URL
mcp__plugin_playwright_playwright__browser_snapshot()

// 8. Extract share URL from snapshot output
// Look for: http://localhost:3000/resources/share/[21-char-token]

// 9. Open share URL in new tab
mcp__plugin_playwright_playwright__browser_tabs({ action: "new" })
mcp__plugin_playwright_playwright__browser_navigate({ url: "[share-url-from-step-8]" })

// 10. Verify public access (no auth required)
mcp__plugin_playwright_playwright__browser_snapshot()
// Should see resource preview without login
```

---

### Test Flow 5: Fork Resource

**Goal:** Fork a shared resource

```javascript
// 1. From share page (continuing from Test Flow 4)
// Or navigate to share URL directly
mcp__plugin_playwright_playwright__browser_navigate({ url: "[share-url]" })

// 2. Take snapshot
mcp__plugin_playwright_playwright__browser_snapshot()

// 3. Click Fork button
mcp__plugin_playwright_playwright__browser_click({
  element: "Fork This Resource button",
  ref: "[ref-from-snapshot]"
})

// 4. Verify ForkDialog opens
mcp__plugin_playwright_playwright__browser_snapshot()
// Should see explanation of fork behavior

// 5. Click Fork Resource button
mcp__plugin_playwright_playwright__browser_click({
  element: "Fork Resource button in dialog",
  ref: "[ref-from-snapshot]"
})

// 6. Wait for redirect to /resources
mcp__plugin_playwright_playwright__browser_wait_for({ text: "Resources" })

// 7. Verify forked resource appears
mcp__plugin_playwright_playwright__browser_snapshot()
// Look for "[Original Name] (Fork)" in output
```

---

### Test Flow 6: Execute Resource

**Goal:** Execute a saved workflow

```javascript
// 1. Navigate to resources
mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/resources" })
mcp__plugin_playwright_playwright__browser_snapshot()

// 2. Click Execute button
mcp__plugin_playwright_playwright__browser_click({
  element: "Execute button",
  ref: "[ref-for-first-resource-card-execute-button]"
})

// 3. Wait for toast notification
mcp__plugin_playwright_playwright__browser_wait_for({ text: "Starting workflow" })

// 4. Verify navigation to chat
mcp__plugin_playwright_playwright__browser_wait_for({ time: 1 })
// URL should be http://localhost:3000

// 5. Check console for agentRequest
mcp__plugin_playwright_playwright__browser_console_messages({ level: "info" })
```

---

### Test Flow 7: Image Upload

**Goal:** Upload image in chat

```javascript
// 1. Navigate to chat
mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })
mcp__plugin_playwright_playwright__browser_snapshot()

// 2. Look for "Add Image" button
// Click it
mcp__plugin_playwright_playwright__browser_click({
  element: "Add Image button",
  ref: "[ref-from-snapshot]"
})

// 3. Upload test image
mcp__plugin_playwright_playwright__browser_file_upload({
  paths: ["/tmp/test-image.png"]
})

// 4. Wait for preview
mcp__plugin_playwright_playwright__browser_wait_for({ time: 1 })
mcp__plugin_playwright_playwright__browser_snapshot()
// Should see preview image

// 5. Click Upload Image button
mcp__plugin_playwright_playwright__browser_click({
  element: "Upload Image button",
  ref: "[ref-from-snapshot]"
})

// 6. Wait for upload to complete
mcp__plugin_playwright_playwright__browser_wait_for({ text: "uploaded" })

// 7. Verify image displays inline
mcp__plugin_playwright_playwright__browser_snapshot()

// 8. Type message
mcp__plugin_playwright_playwright__browser_type({
  element: "message textarea",
  ref: "[ref-from-snapshot]",
  text: "What do you see in this image?"
})

// 9. Send message
mcp__plugin_playwright_playwright__browser_click({
  element: "Send button",
  ref: "[ref-from-snapshot]"
})

// 10. Wait for AI response
mcp__plugin_playwright_playwright__browser_wait_for({ time: 5 })
mcp__plugin_playwright_playwright__browser_snapshot()
```

---

### Test Flow 8: Web Search

**Goal:** Trigger web search from chat

```javascript
// 1. Navigate to chat
mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })
mcp__plugin_playwright_playwright__browser_snapshot()

// 2. Type search query
mcp__plugin_playwright_playwright__browser_type({
  element: "message textarea",
  ref: "[ref-from-snapshot]",
  text: "search for React 19 new features"
})

// 3. Send message
mcp__plugin_playwright_playwright__browser_click({
  element: "Send button",
  ref: "[ref-from-snapshot]"
})

// 4. Monitor network requests
mcp__plugin_playwright_playwright__browser_network_requests({
  includeStatic: false
})
// Look for POST /api/search in output

// 5. Wait for AI response
mcp__plugin_playwright_playwright__browser_wait_for({ time: 5 })
mcp__plugin_playwright_playwright__browser_snapshot()
// AI response should reference search results
```

---

## Validation Commands (Database Checks)

### Check Resources Created
```bash
psql $DATABASE_URL -c "SELECT id, name, resourceType, userId, parentResourceId, forkCount, executionCount FROM resource ORDER BY createdAt DESC LIMIT 5;"
```

### Check Share Links
```bash
psql $DATABASE_URL -c "SELECT shareToken, resourceId, expiresAt, accessCount, maxAccesses FROM resource_share ORDER BY createdAt DESC LIMIT 5;"
```

### Check Image Attachments
```bash
psql $DATABASE_URL -c "SELECT id, content, attachments FROM message WHERE attachments IS NOT NULL ORDER BY createdAt DESC LIMIT 3;"
```

### Check Uploaded Files
```bash
ls -lh public/uploads/images/
```

---

## Common Issues & Solutions

### Issue: "Save as Resource" button not found
**Solution:** Need to have agent execution first. Look for agent_result messages in conversation.

### Issue: Share link returns 404
**Solution:** Verify shareToken in URL matches database. Check token length (should be 21 chars).

### Issue: Image upload fails
**Solution:**
- Verify public/uploads/images directory exists
- Check file permissions
- Ensure file < 10MB and correct type

### Issue: Search doesn't trigger
**Solution:** Keywords must be exact: "search for", "look up", or "search:"

### Issue: Fork button missing
**Solution:** Fork button only shows on resources you don't already own (not on forked resources).

---

## Screenshot Reference

Playwright MCP saves screenshots to `.playwright-mcp/` with timestamps. Review these for visual verification:

```bash
# View recent screenshots
ls -lt .playwright-mcp/*.png | head -5

# Open latest screenshot (macOS)
open $(ls -t .playwright-mcp/*.png | head -1)
```

---

## Quick Debugging

### View Console Errors
```javascript
mcp__plugin_playwright_playwright__browser_console_messages({ level: "error" })
```

### View Network Errors
```javascript
mcp__plugin_playwright_playwright__browser_network_requests({ includeStatic: false })
// Look for status codes >= 400
```

### Inspect Element
```javascript
mcp__plugin_playwright_playwright__browser_evaluate({
  element: "element description",
  ref: "[ref]",
  function: "(el) => ({ tag: el.tagName, classes: el.className, text: el.textContent })"
})
```

---

## Test Checklist

Use this checklist when executing tests:

- [ ] **Login** - Can authenticate and reach home page
- [ ] **Save Resource** - Can save agent workflow with name/description
- [ ] **Browse Resources** - Resources page displays saved resources
- [ ] **Search Resources** - Search input filters results
- [ ] **Filter by Type** - Dropdown filters by resourceType
- [ ] **Generate Share Link** - Can create share link with expiration
- [ ] **Access Share Link** - Public access works without auth
- [ ] **Fork Resource** - Can fork and see lineage
- [ ] **Execute Resource** - Execute updates metadata
- [ ] **Upload Image** - Can upload valid image file
- [ ] **Image Validation** - Rejects invalid files
- [ ] **Web Search** - Search keywords trigger DuckDuckGo
- [ ] **Database Integrity** - All tables populated correctly

---

## Full Test Run (Copy-Paste Sequence)

**Start fresh browser session:**
```javascript
mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })
```

**Login:**
```javascript
mcp__plugin_playwright_playwright__browser_snapshot()
// Fill login form based on snapshot refs
// Click login
```

**Test resources:**
```javascript
mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000/resources" })
mcp__plugin_playwright_playwright__browser_snapshot()
```

Continue through each test flow above in sequence.

---

**End of Execution Guide**
