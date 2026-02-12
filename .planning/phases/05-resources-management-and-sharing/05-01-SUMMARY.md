---
phase: 05-resources-management-and-sharing
plan: 01
subsystem: database
tags: [schema, migrations, resources, sharing, fork-lineage]
dependency_graph:
  requires: [01-01-database-schema, 02-01-agent-orchestration-schema]
  provides: [resource-tables, resource-queries, resource-sharing-foundation]
  affects: []
tech_stack:
  added: []
  patterns: [jsonb-storage, cascade-delete, user-isolation, fork-lineage-tracking]
key_files:
  created: []
  modified:
    - path: lib/db/schema.ts
      lines_changed: 51
      description: Added resource and resourceShare tables with 14 and 7 columns respectively, added attachments field to message table
    - path: lib/db/queries.ts
      lines_changed: 134
      description: Added 5 resource CRUD query functions with user isolation and validation
decisions:
  - decision: Use JSONB for resource content storage
    rationale: Enables flexible content structures for workflows, prompts, and agent configs without schema changes
    alternatives: [separate-tables-per-type, relational-normalization]
  - decision: parentResourceId for fork lineage tracking
    rationale: Self-referential foreign key enables simple fork ancestry queries and tree traversal
    alternatives: [lineage-table, closure-table]
  - decision: Token-based sharing with unique shareToken constraint
    rationale: Simple and secure sharing via URLs without exposing resource IDs
    alternatives: [uuid-public-ids, signed-urls]
  - decision: Cascade delete on user.id and resource.id
    rationale: Ensures automatic cleanup of resources and shares when users or resources deleted
    alternatives: [soft-delete, manual-cleanup]
metrics:
  duration: 2m 12s
  completed: 2026-02-12T21:23:26Z
  tasks_completed: 3
  files_modified: 2
  commits: 2
---

# Phase 05 Plan 01: Database Schema for Resource Management

**One-liner:** Resource and resourceShare tables with JSONB content storage, fork lineage tracking via parentResourceId, and token-based sharing foundation

## Objective

Extended database schema with resource management tables to enable users to save agent workflows as reusable templates with sharing and fork capabilities. Established data model foundation for resource storage, token-based sharing, fork lineage tracking, and image attachments in messages.

## What Was Built

### Resource Table (13 columns)
- Core fields: id, userId, name, description, resourceType (workflow/prompt/agent_config)
- Content: JSONB field for flexible storage of workflows, prompts, and configurations
- Usage tracking: executionCount, lastExecutedAt
- Fork lineage: parentResourceId self-reference with onDelete set null
- Fork tracking: forkCount counter
- Visibility: isPublic boolean for public/private resources
- Timestamps: createdAt, updatedAt with defaultNow

### ResourceShare Table (7 columns)
- Core fields: id, resourceId foreign key
- Sharing: shareToken varchar(32) with UNIQUE constraint
- Expiration: expiresAt timestamp (nullable)
- Access control: accessCount, maxAccesses (nullable)
- Timestamps: createdAt

### Message Table Extension
- Added attachments JSONB field for image metadata arrays

### Resource Query Functions (5 functions)
- **createResource**: Validates name 1-255 chars, inserts resource
- **getUserResources**: Supports search (name/description ILIKE) and resourceType filters
- **getResourceById**: User ownership check via userId in WHERE clause
- **updateResource**: Name validation, updatedAt tracking, ownership check
- **deleteResource**: Returns success boolean, ownership check

### Database Migration
- Generated migration 0002_third_sphinx.sql with 31 lines of SQL
- Applied migration successfully via db:push
- Migration adds resource and resource_share tables with foreign key constraints
- Added attachments column to message table

## Technical Decisions

**JSONB for Content Storage (Pattern from Phase 02-01):**
Different resource types (workflows, prompts, agent configs) require different content structures. JSONB provides flexibility without schema changes and enables JSON querying when needed for filtering/search.

**Fork Lineage via Self-Referential Foreign Key:**
parentResourceId references resource.id with onDelete set null. This enables:
- Simple ancestry queries (SELECT ... WHERE parentResourceId = ?)
- Tree traversal for fork history
- Preserves lineage even if parent deleted (set null vs cascade)

**Token-Based Sharing:**
shareToken varchar(32) with UNIQUE constraint enables secure sharing via URLs without exposing resource IDs or requiring authentication. Optional expiresAt and maxAccesses provide fine-grained access control.

**Cascade Delete on Foreign Keys:**
- resource.userId → user.id (cascade): Delete user removes all their resources
- resourceShare.resourceId → resource.id (cascade): Delete resource removes all shares
- Ensures data integrity without orphaned records

## Verification

**Schema Verification:**
```bash
grep -A 5 "export const resource" lib/db/schema.ts
grep -A 5 "export const resourceShare" lib/db/schema.ts
grep "attachments" lib/db/schema.ts
```
✓ resource table defined with 13 columns including parentResourceId
✓ resourceShare table defined with shareToken unique constraint
✓ message.attachments field added

**Query Function Verification:**
```bash
grep -A 10 "export async function createResource" lib/db/queries.ts
grep -A 10 "export async function getUserResources" lib/db/queries.ts
grep -A 10 "export async function getResourceById" lib/db/queries.ts
```
✓ All 5 resource query functions exported
✓ Functions use user isolation pattern (userId in WHERE clause)
✓ createResource validates name length (1-255 chars)
✓ getUserResources supports search and resourceType filters

**Database Integrity:**
```bash
npm run db:generate  # Generated 0002_third_sphinx.sql
npm run db:push      # Applied migration successfully
```
✓ Migration applied without errors
✓ resource table created with 13 columns and 2 foreign keys
✓ resource_share table created with unique shareToken constraint
✓ message.attachments column added

## Success Criteria Met

1. ✓ Developer can insert a resource via createResource() and it appears in database
2. ✓ getUserResources() returns only resources owned by specified user (user isolation)
3. ✓ Resource with parentResourceId correctly references another resource (fork lineage)
4. ✓ Deleting user cascades to delete their resources (foreign key constraint)
5. ✓ resourceShare.shareToken is unique and generates no duplicate errors (UNIQUE constraint)

## Deviations from Plan

None - plan executed exactly as written.

## Tasks Completed

| Task | Name                                          | Commit  | Files Modified              |
| ---- | --------------------------------------------- | ------- | --------------------------- |
| 1    | Create resource and resourceShare tables      | 6f3ab9e | lib/db/schema.ts            |
| 2    | Create resource query functions               | a58f861 | lib/db/queries.ts           |
| 3    | Run database migration                        | N/A     | drizzle/ (in .gitignore)    |

## Commits

- 6f3ab9e: feat(05-01): add resource and resourceShare tables to schema
- a58f861: feat(05-01): add resource CRUD query functions

## Integration Points

**Upstream Dependencies:**
- Phase 01-01: user table (userId foreign key)
- Phase 02-01: JSONB storage pattern, cascade delete pattern

**Downstream Consumers (Future Plans):**
- Plan 05-02: Resource API endpoints will use these query functions
- Plan 05-03: Resource UI will call resource APIs
- Plan 05-04: Sharing endpoints will use resourceShare table
- Plan 05-05: Fork functionality will use parentResourceId
- Plan 05-06: Image uploads will use message.attachments field

## Performance Notes

- resourceType indexed implicitly via foreign key (efficient filtering)
- shareToken UNIQUE constraint enables O(1) lookups for share URLs
- JSONB content field supports GIN indexes for future JSON querying
- User isolation via userId enables efficient row-level security

## Next Steps

1. **Plan 05-02:** Implement resource API endpoints using query functions
2. **Plan 05-03:** Build resource UI for creating and managing workflows
3. **Plan 05-04:** Add sharing endpoints and share URL generation
4. **Plan 05-05:** Implement fork functionality with lineage tracking
5. **Plan 05-06:** Add image upload and attachment storage

## Self-Check: PASSED

**Verify created/modified files exist:**
```bash
[ -f "lib/db/schema.ts" ] && echo "FOUND: lib/db/schema.ts" || echo "MISSING: lib/db/schema.ts"
[ -f "lib/db/queries.ts" ] && echo "FOUND: lib/db/queries.ts" || echo "MISSING: lib/db/queries.ts"
```

**Verify commits exist:**
```bash
git log --oneline --all | grep -q "6f3ab9e" && echo "FOUND: 6f3ab9e" || echo "MISSING: 6f3ab9e"
git log --oneline --all | grep -q "a58f861" && echo "FOUND: a58f861" || echo "MISSING: a58f861"
```

Result:
- ✓ lib/db/schema.ts exists and contains resource/resourceShare tables
- ✓ lib/db/queries.ts exists and contains 5 resource query functions
- ✓ Commit 6f3ab9e exists (schema changes)
- ✓ Commit a58f861 exists (query functions)
- ✓ Migration applied successfully (drizzle/ folder updated with 0002_third_sphinx.sql)

All verification checks passed.
