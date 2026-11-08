# Documentation Template (Structure)

A consistent, thorough documentation entry for every change made to Nox.

## Header (Metadata)

- **Title:** Short, descriptive title of the change
- **Changes:** One-line summary of what changed
- **Date:** YYYY-MM-DD (when the change was made)
- **Agent/tool:** Which agent or tool performed the work (e.g., Antigravity, Paseo, Copilot)
- **Conversation reference:** Link to the conversation / session that produced it
- **Author:** Person responsible (optional)
- **Status:** Draft / Review / Approved / Deprecated
- **Related issues/PRs:** Links to issues, PRs, or tasks (optional)

## Body

### 1. What was fixed / changed
Clear description of the problem and the fix or feature introduced.

### 2. Motivation / Why
Why this change was needed; context, user impact, business reason.

### 3. File references
List of files created, modified, or deleted, with paths relative to vault root.

| File | Action | Notes |
|------|--------|-------|
| path/to/file.ext | Created / Modified / Deleted | brief note |

### 4. Technical details
- Implementation approach
- Key functions, classes, or modules touched
- Dependencies added/removed/updated
- Configuration changes

### 5. Testing
- How it was tested (manual / automated)
- Test cases covered
- Edge cases considered
- Results / screenshots (if any)

### 6. Impact & side effects
- Breaking changes (yes/no + details)
- Performance implications
- Security implications
- Migration steps required (if any)

### 7. Rollback plan
Steps to revert the change safely if needed.

### 8. Follow-ups / TODO
Outstanding work, known limitations, or next steps.

### 9. References
- Docs, specs, or external links consulted
- Related notes: [[Nox - The Web-based E-learning platform]]

---

## Change log index

| Date | Title | Agent/tool | Status |
|------|-------|------------|--------|
| YYYY-MM-DD | Sample entry | Tool | Status |

---

## Conventions
- Use ISO dates (YYYY-MM-DD).
- Use relative file paths from vault root.
- Keep entries atomic: one logical change per entry.
- Link related entries with [[wikilinks]].
- Tag entries for searchability, e.g. #docs #fix #feature.

---

## Sample entry

### Sample Header
- **Changes:** Created a change in file X
- **Date:** 2026-11-02 (YYYY-MM-DD)
- **Agent/tool:** Antigravity, Paseo
- **Conversation reference:** (*Hyperlink*)
- **Status:** Approved

### Sample Body
- **What was fixed:** Description of the fix
- **File references:** `path/to/file.ext` (Modified)
- **Technical details:** …
- **Testing:** …
- **Impact:** …
- **Rollback:** …
- **Follow-ups:** …
