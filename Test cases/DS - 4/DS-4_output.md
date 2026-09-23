# Test Plan: Delete Program with Confirmation

## Positive flows

### TC-001 — Confirmed deletion removes program from the list

**Preconditions:** User is logged in as admin; program **Test Program** exists and is visible on the Programs page.

**Steps:**
1. Navigate to the Programs page.
2. Click the delete icon for **Test Program**.
3. Verify a confirmation dialog appears.
4. Confirm deletion (e.g. click **Delete**, **Confirm**, or **Yes**).
5. Review the program list.

**Gherkin:**
```gherkin
Scenario: Admin deletes program after confirmation
  Given a program "Test Program" exists
  When I click the delete icon for "Test Program"
  Then I see a confirmation dialog
  When I confirm deletion
  Then "Test Program" is removed from the program list
```

**Expected result:** Confirmation dialog is shown before delete; after confirm, **Test Program** no longer appears in the list; no error toast unless designed as success feedback.

**Priority:** High

---

### TC-002 — Cancelled deletion keeps program in the list

**Preconditions:** Program **Web Development 2026** exists; user is on the Programs page.

**Steps:**
1. Click the delete icon for **Web Development 2026**.
2. Wait for the confirmation dialog.
3. Click **Cancel** (or equivalent dismiss action that means “do not delete”).
4. Verify the list.

**Gherkin:**
```gherkin
Scenario: Admin cancels delete from confirmation dialog
  Given I click the delete icon for a program
  And the program "Web Development 2026" exists
  When I see the confirmation dialog
  And I click Cancel
  Then the program still exists in the list
  And "Web Development 2026" is still shown in the program list
```

**Expected result:** Program remains; data unchanged; dialog closes without deleting.

**Priority:** High

---

### TC-003 — Confirmation dialog shows identifiable program context

**Preconditions:** Program **Cybersecurity Bootcamp** exists.

**Steps:**
1. Click delete for **Cybersecurity Bootcamp**.
2. Read confirmation dialog title and body.

**Gherkin:**
```gherkin
Scenario: Delete confirmation references the program being removed
  Given a program "Cybersecurity Bootcamp" exists
  When I click the delete icon for "Cybersecurity Bootcamp"
  Then I see a confirmation dialog
  And the dialog mentions "Cybersecurity Bootcamp" or clearly indicates which program will be deleted
```

**Expected result:** User can verify they are deleting the correct program before confirming.

**Priority:** Medium

---

### TC-004 — List updates immediately after successful delete

**Preconditions:** Program **Data Science Fundamentals** exists; user confirms deletion.

**Steps:**
1. Delete **Data Science Fundamentals** with confirmation.
2. Observe list without manual full page reload (SPA behavior).

**Gherkin:**
```gherkin
Scenario: Program list reflects deletion without full reload
  Given a program "Data Science Fundamentals" exists
  When I click the delete icon for "Data Science Fundamentals"
  And I confirm deletion
  Then "Data Science Fundamentals" is removed from the program list immediately
```

**Expected result:** Row/card disappears right after confirm; count decreases if shown.

**Priority:** Medium

---

## Negative flows

### TC-005 — Program is not deleted without opening confirmation

**Preconditions:** Program **Test Program** exists.

**Steps:**
1. On Programs page, verify **Test Program** is listed.
2. Do not click delete or any destructive action.
3. Refresh if needed and re-check.

**Gherkin:**
```gherkin
Scenario: Program remains when delete is not initiated
  Given a program "Test Program" exists
  When I do not click the delete icon for "Test Program"
  Then "Test Program" still exists in the list
```

**Expected result:** No accidental deletion; program persists.

**Priority:** Low

---

### TC-006 — Dismissing dialog via overlay or Escape does not delete

**Preconditions:** Program **Cloud Computing 2026** exists; dialog supports Escape or backdrop click per UI pattern.

**Steps:**
1. Click delete for **Cloud Computing 2026**.
2. Close dialog via **X**, Escape, or backdrop (if product allows).
3. Check list.

**Gherkin:**
```gherkin
Scenario: Dismiss confirmation without Cancel button still preserves program
  Given a program "Cloud Computing 2026" exists
  When I click the delete icon for "Cloud Computing 2026"
  And I see the confirmation dialog
  And I dismiss the dialog without confirming deletion
  Then "Cloud Computing 2026" still exists in the program list
```

**Expected result:** Same outcome as Cancel—no delete unless explicit confirm.

**Priority:** High

---

### TC-007 — Non-admin cannot delete programs

**Preconditions:** User is logged in as non-admin; program **Test Program** is visible or hidden per role.

**Steps:**
1. Navigate to Programs page.
2. Look for delete icon on **Test Program**.

**Gherkin:**
```gherkin
Scenario: Non-admin cannot delete programs
  Given I am logged in as a non-admin user
  And a program "Test Program" exists
  When I navigate to the Programs page
  Then I do not see a delete icon for "Test Program"
  Or I cannot complete program deletion
```

**Expected result:** Delete action unavailable; program cannot be removed via UI.

**Priority:** High

---

### TC-008 — Failed delete API leaves program in the list

**Preconditions:** Program **Test Program** exists; test environment can force delete API failure.

**Steps:**
1. Open delete confirmation for **Test Program**.
2. Confirm while server returns error.
3. Refresh list.

**Gherkin:**
```gherkin
Scenario: Server error on delete does not remove program from UI permanently
  Given a program "Test Program" exists
  And the delete request will fail
  When I click the delete icon for "Test Program"
  And I confirm deletion
  Then I see an error message indicating deletion failed
  And "Test Program" still exists in the program list
```

**Expected result:** Error shown; program remains; optimistic UI rollback if used.

**Priority:** Medium

---

### TC-009 — Double confirm does not cause unexpected errors

**Preconditions:** Program **Mobile Development 2026** exists.

**Steps:**
1. Open delete confirmation.
2. Rapidly double-click **Confirm** if button stays visible.

**Gherkin:**
```gherkin
Scenario: Repeated confirm clicks do not break list state
  Given a program "Mobile Development 2026" exists
  When I click the delete icon for "Mobile Development 2026"
  And I confirm deletion twice quickly
  Then "Mobile Development 2026" is removed from the program list
  And no duplicate error or broken UI state appears
```

**Expected result:** Single deletion; no 404 spam or duplicate requests breaking UX.

**Priority:** Medium

---

## Edge cases

### TC-010 — Delete program with special characters in name

**Preconditions:** Program **Informatique & IA - Niveau 2** exists.

**Steps:**
1. Click delete icon for that program.
2. Confirm in dialog.
3. Verify list.

**Gherkin:**
```gherkin
Scenario: Delete program with special characters in name
  Given a program "Informatique & IA - Niveau 2" exists
  When I click the delete icon for "Informatique & IA - Niveau 2"
  And I confirm deletion
  Then "Informatique & IA - Niveau 2" is removed from the program list
```

**Expected result:** Dialog displays name correctly; delete succeeds; no encoding issues.

**Priority:** Medium

---

### TC-011 — Delete last program on the page

**Preconditions:** Only one program exists: **Test Program**.

**Steps:**
1. Delete **Test Program** with confirmation.
2. Observe empty state.

**Gherkin:**
```gherkin
Scenario: Deleting the only program shows empty list state
  Given only the program "Test Program" exists
  When I click the delete icon for "Test Program"
  And I confirm deletion
  Then "Test Program" is removed from the program list
  And I see an appropriate empty state message or empty table
```

**Expected result:** Empty state is clear; **+ New Program** still available for admin.

**Priority:** Medium

---

### TC-012 — Delete program with long name in confirmation

**Preconditions:** Program exists with name at or near maximum display length.

**Steps:**
1. Trigger delete and read confirmation text.
2. Confirm deletion.

**Gherkin:**
```gherkin
Scenario: Long program name displays correctly in delete confirmation
  Given a program with a very long name exists
  When I click the delete icon for that program
  Then I see a confirmation dialog
  And the program name is fully readable or truncated with accessible full name
  When I confirm deletion
  Then the program is removed from the program list
```

**Expected result:** No layout break; user can identify program; delete completes.

**Priority:** Low

---

### TC-013 — Delete program while search or filter is active

**Preconditions:** Multiple programs exist; list filtered to show **Test Program** only.

**Steps:**
1. Apply filter/search so **Test Program** is visible.
2. Delete **Test Program** with confirmation.
3. Observe filtered list and clear filter.

**Gherkin:**
```gherkin
Scenario: Deletion updates filtered program list
  Given a program "Test Program" exists
  And the program list is filtered to show "Test Program"
  When I click the delete icon for "Test Program"
  And I confirm deletion
  Then "Test Program" is removed from the program list
  And the filtered view no longer shows "Test Program"
```

**Expected result:** Filtered view updates; no stale row; clearing filter shows accurate full list.

**Priority:** Medium

---

### TC-014 — Delete program with active enrollments or dependencies (if applicable)

**Preconditions:** **Test Program** has linked students, courses, or cohorts per product rules.

**Steps:**
1. Attempt delete via icon and confirmation.
2. Observe result.

**Gherkin:**
```gherkin
Scenario: Delete blocked or cascades when program has dependencies
  Given a program "Test Program" exists
  And the program has active enrollments
  When I click the delete icon for "Test Program"
  Then either I see a confirmation dialog warning about dependencies
  Or I see an error that the program cannot be deleted
  And if deletion is not allowed then "Test Program" still exists in the list
```

**Expected result:** Behavior matches policy—hard delete, soft delete, or block with message.

**Priority:** High

---

### TC-015 — Keyboard accessibility for confirmation dialog

**Preconditions:** Program **Test Program** exists; keyboard-only navigation.

**Steps:**
1. Focus delete control via keyboard and activate.
2. Tab to **Cancel** and **Confirm**; activate confirm with Enter/Space.

**Gherkin:**
```gherkin
Scenario: Delete confirmation is operable by keyboard
  Given a program "Test Program" exists
  When I open the delete confirmation dialog using the keyboard
  And I move focus to the confirm action and activate it
  Then "Test Program" is removed from the program list
```

**Expected result:** Focus trap in modal; focus returns sensibly after close; actions work without mouse.

**Priority:** Medium

---

### TC-016 — Undo or success notification after delete (if product provides)

**Preconditions:** Product may show toast with undo; document actual behavior.

**Steps:**
1. Delete **Test Program** with confirmation.
2. Observe notifications within 5 seconds.

**Gherkin:**
```gherkin
Scenario: Post-delete feedback is shown
  Given a program "Test Program" exists
  When I click the delete icon for "Test Program"
  And I confirm deletion
  Then "Test Program" is removed from the program list
  And I see success feedback or no misleading error message
```

**Expected result:** User receives clear success or silent delete per design; no false error.

**Priority:** Low

---

### TC-017 — Re-create program with same name after delete

**Preconditions:** **Test Program** was deleted successfully.

**Steps:**
1. Open **+ New Program**.
2. Create new program named **Test Program**.
3. Verify list.

**Gherkin:**
```gherkin
Scenario: Program name is available after deletion
  Given "Test Program" was deleted and no longer exists
  When I create a new program named "Test Program"
  Then the program is created successfully
  And the program list shows "Test Program"
```

**Expected result:** Name reuse allowed after hard delete; soft-delete may block reuse (document outcome).

**Priority:** Medium

---

## Ambiguities and gaps in the acceptance criteria

1. **Confirm control label:** AC says “confirm deletion” but not exact button text (**Delete**, **Yes**, **Confirm**).
2. **Dialog content:** No AC for warning text, irreversibility message, or showing program name (TC-003 assumed best practice).
3. **Dismiss patterns:** Cancel is specified; Escape, backdrop click, and **X** are not (TC-006).
4. **Authorization:** Only generic delete flow; admin vs other roles not stated.
5. **Dependencies:** No AC for programs with enrollments, courses, or historical data (TC-014).
6. **Soft vs hard delete:** AC says “removed from list”; archival, audit trail, and restore are unspecified.
7. **Error handling:** No AC for network or server failure during delete (TC-008).
8. **Pagination/search:** List behavior when deleted item is off-page or under filter not defined (TC-013).
9. **Success UX:** Toast, undo, or silent removal not specified.
10. **Accessibility:** Focus management and screen reader labels not in ACs.
