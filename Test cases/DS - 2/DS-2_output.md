# Test Plan: Edit Existing Program Details

## Positive flows

### TC-001 — Edit form shows current program data

**Preconditions:** User is logged in as admin; program **Web Development 2026** exists and is visible on the Programs page.

**Steps:**
1. Navigate to the Programs page.
2. Locate **Web Development 2026** in the program list.
3. Click the edit icon on **Web Development 2026**.

**Gherkin:**
```gherkin
Scenario: Admin opens edit form with existing program data
  Given I am on the Programs page
  And a program "Web Development 2026" exists
  When I click the edit icon on "Web Development 2026"
  Then I see the edit form pre-populated with the program's current data
```

**Expected result:** Edit modal or form opens with **Program Name** (or **Name**) and **Description** matching the stored values for **Web Development 2026**.

**Priority:** High

---

### TC-002 — Updated program name appears in the list after save

**Preconditions:** User is editing **Web Development 2026**; edit form is open with current data loaded.

**Steps:**
1. Change **Name** to `Web Development 2026 - Updated`.
2. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Admin updates program name and sees list refresh
  Given I am editing "Web Development 2026"
  When I change the Name to "Web Development 2026 - Updated"
  And I click Save
  Then the modal closes
  And the program list immediately shows "Web Development 2026 - Updated"
```

**Expected result:** Modal closes; **Web Development 2026** is no longer shown under the old name; **Web Development 2026 - Updated** appears in the list without a full page reload (if SPA).

**Priority:** High

---

### TC-003 — Name and other fields unchanged when only description is edited

**Preconditions:** Program exists with Name `Data Science Fundamentals` and Description `Original cohort description`; user is on the edit form for that program.

**Steps:**
1. Change **Description** to `Updated cohort description for 2026`.
2. Leave **Name** unchanged.
3. Click **Save**.
4. Re-open edit for the same program or inspect list/details.

**Gherkin:**
```gherkin
Scenario: Editing description does not alter program name
  Given I am editing a program
  And the program Name is "Data Science Fundamentals"
  And the program Description is "Original cohort description"
  When I only change the Description to "Updated cohort description for 2026"
  And I click Save
  Then the Name and other fields remain unchanged
  And the program list shows "Data Science Fundamentals"
```

**Expected result:** **Name** remains `Data Science Fundamentals`; **Description** reflects the new value; no other fields (e.g. ID, dates if shown) change unintentionally.

**Priority:** High

---

### TC-004 — Both name and description can be updated in one save

**Preconditions:** User is editing program **Cloud Computing 2026** on the Programs page.

**Steps:**
1. Change **Name** to `Cloud Computing 2026 - Advanced`.
2. Change **Description** to `Expanded curriculum with Kubernetes and Terraform`.
3. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Admin updates name and description together
  Given I am editing "Cloud Computing 2026"
  When I change the Name to "Cloud Computing 2026 - Advanced"
  And I change the Description to "Expanded curriculum with Kubernetes and Terraform"
  And I click Save
  Then the modal closes
  And the program list shows "Cloud Computing 2026 - Advanced"
```

**Expected result:** Both fields persist; list shows the new name; description matches when viewed in details or expanded row.

**Priority:** Medium

---

## Negative flows

### TC-005 — Empty program name blocks save on edit

**Preconditions:** User is editing **Web Development 2026**; edit form is open.

**Steps:**
1. Clear the **Name** field completely.
2. Attempt to click **Save**.

**Gherkin:**
```gherkin
Scenario: Clearing program name prevents save
  Given I am editing "Web Development 2026"
  When I clear the Name field
  Then the Save button is disabled
  Or I see a validation message that Name is required
  And the program list still shows "Web Development 2026"
```

**Expected result:** Save is blocked; existing program data in the list is unchanged.

**Priority:** High

---

### TC-006 — Canceling edit does not persist changes

**Preconditions:** User is editing **Web Development 2026**; edit form is open.

**Steps:**
1. Change **Name** to `Temporary Draft Name`.
2. Close the modal via **Cancel**, **X**, or dismiss without **Save**.
3. Review the Programs list.

**Gherkin:**
```gherkin
Scenario: Dismiss edit form without saving
  Given I am editing "Web Development 2026"
  When I change the Name to "Temporary Draft Name"
  And I close the edit modal without clicking Save
  Then the modal closes
  And the program list still shows "Web Development 2026"
  And the program list does not show "Temporary Draft Name"
```

**Expected result:** No changes are persisted; original name and description remain.

**Priority:** High

---

### TC-007 — Non-admin cannot edit program details

**Preconditions:** User is logged in as a non-admin; program **Web Development 2026** is visible or not per role.

**Steps:**
1. Navigate to the Programs page.
2. Look for edit icon on **Web Development 2026**.

**Gherkin:**
```gherkin
Scenario: Non-admin cannot edit programs
  Given I am logged in as a non-admin user
  And a program "Web Development 2026" exists
  When I navigate to the Programs page
  Then I do not see an edit icon on "Web Development 2026"
  Or I cannot open the edit form
```

**Expected result:** Edit action is unavailable; program data cannot be modified through the UI.

**Priority:** High

---

### TC-008 — Renaming to an existing program name is rejected

**Preconditions:** Programs **Web Development 2026** and **Cybersecurity Bootcamp** exist; user is editing **Cybersecurity Bootcamp**.

**Steps:**
1. Change **Name** to `Web Development 2026`.
2. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Duplicate name on edit is not allowed
  Given I am editing "Cybersecurity Bootcamp"
  And a program "Web Development 2026" already exists
  When I change the Name to "Web Development 2026"
  And I click Save
  Then I see a validation or error message indicating the name is already in use
  And the program list still shows "Cybersecurity Bootcamp"
```

**Expected result:** Save fails with clear feedback; **Cybersecurity Bootcamp** remains unchanged unless product allows duplicate names (then document actual behavior).

**Priority:** Medium

---

### TC-009 — Server or network failure does not show false success

**Preconditions:** User is editing a program; ability to simulate failed save (offline, 500) in test environment.

**Steps:**
1. Change **Description** to `Change pending save failure test`.
2. Trigger **Save** while the API returns an error.
3. Observe UI and list.

**Gherkin:**
```gherkin
Scenario: Failed save shows error and does not update list incorrectly
  Given I am editing "Web Development 2026"
  And the save request will fail
  When I change the Description to "Change pending save failure test"
  And I click Save
  Then I see an error message indicating the save failed
  And the program list still shows the previous description for "Web Development 2026"
```

**Expected result:** User sees error state; list data matches last successful save, not the failed attempt.

**Priority:** Medium

---

## Edge cases

### TC-010 — Leading and trailing whitespace in name is normalized on save

**Preconditions:** User is editing **Web Development 2026**.

**Steps:**
1. Change **Name** to `  Web Development 2026 - Trimmed  `.
2. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Trimmed name after edit
  Given I am editing "Web Development 2026"
  When I change the Name to "  Web Development 2026 - Trimmed  "
  And I click Save
  Then the modal closes
  And the program list shows "Web Development 2026 - Trimmed"
```

**Expected result:** Displayed and stored name excludes extraneous leading/trailing whitespace.

**Priority:** Medium

---

### TC-011 — Special characters and unicode in edited fields

**Preconditions:** User is editing **Web Development 2026**.

**Steps:**
1. Change **Name** to `AI & ML (2026) — Cohort #2`.
2. Change **Description** to `Résumé skills: NLP, CV, 100% hands-on`.
3. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Unicode and special characters persist after edit
  Given I am editing "Web Development 2026"
  When I change the Name to "AI & ML (2026) — Cohort #2"
  And I change the Description to "Résumé skills: NLP, CV, 100% hands-on"
  And I click Save
  Then the program list shows "AI & ML (2026) — Cohort #2"
```

**Expected result:** Characters render correctly in list and on re-open of edit form.

**Priority:** Medium

---

### TC-012 — Program name at maximum allowed length after edit

**Preconditions:** User is editing a program; maximum **Name** length is known or discoverable.

**Steps:**
1. Change **Name** to a string of exactly the maximum allowed length.
2. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Name at maximum length saves successfully
  Given I am editing "Web Development 2026"
  When I change the Name to a string of maximum allowed length
  And I click Save
  Then the modal closes
  And the program list shows the program with the full updated name
```

**Expected result:** Save succeeds at boundary; name is not truncated incorrectly in storage.

**Priority:** Low

---

### TC-013 — Program name one character over maximum is rejected

**Preconditions:** User is editing **Web Development 2026**.

**Steps:**
1. Change **Name** to a string one character over the maximum allowed length.
2. Attempt **Save**.

**Gherkin:**
```gherkin
Scenario: Over-length name on edit cannot be saved
  Given I am editing "Web Development 2026"
  When I change the Name to a string one character over the maximum allowed length
  Then the Save button is disabled or I see a length validation message
  And the program list still shows "Web Development 2026"
```

**Expected result:** Invalid name is not persisted; original name remains in the list.

**Priority:** Medium

---

### TC-014 — Whitespace-only name is treated as empty

**Preconditions:** User is editing **Web Development 2026**.

**Steps:**
1. Replace **Name** with only spaces (`   `).
2. Observe **Save** control.

**Gherkin:**
```gherkin
Scenario: Whitespace-only name is invalid on edit
  Given I am editing "Web Development 2026"
  When I change the Name to "   "
  Then the Save button is disabled
```

**Expected result:** Save blocked; same as create validation for empty name.

**Priority:** Medium

---

### TC-015 — Clearing description on edit (optional vs required)

**Preconditions:** User is editing a program that has a non-empty **Description**.

**Steps:**
1. Clear **Description** completely.
2. Leave **Name** unchanged.
3. Click **Save** if enabled.

**Gherkin:**
```gherkin
Scenario: Empty description on edit
  Given I am editing "Web Development 2026"
  And the Description is "Full-stack web development program"
  When I clear the Description field
  And I click Save
  Then either the program is saved with an empty Description
  Or Save is disabled and Description is required
```

**Expected result:** Behavior matches product rules for optional vs required description.

**Priority:** Medium

---

### TC-016 — No change save (save without modifications)

**Preconditions:** User opens edit form for **Web Development 2026** without changing any field.

**Steps:**
1. Click **Save** immediately.

**Gherkin:**
```gherkin
Scenario: Save without changes
  Given I am editing "Web Development 2026"
  When I click Save without changing any fields
  Then the modal closes
  And the program list still shows "Web Development 2026"
  And no duplicate entries appear in the list
```

**Expected result:** Modal closes gracefully; list unchanged; no errors or duplicate rows.

**Priority:** Low

---

### TC-017 — Script-like content in description is stored safely

**Preconditions:** User is editing **Web Development 2026**.

**Steps:**
1. Set **Description** to `<img src=x onerror=alert(1)>`.
2. Click **Save**.
3. View program in list and re-open edit.

**Gherkin:**
```gherkin
Scenario: HTML in description is not executed after edit
  Given I am editing "Web Development 2026"
  When I change the Description to "<img src=x onerror=alert(1)>"
  And I click Save
  Then no script or HTML injection runs in the browser
  And the program list still shows "Web Development 2026"
```

**Expected result:** Content is escaped or sanitized; no alert or DOM injection.

**Priority:** Low

---

### TC-018 — Concurrent edit awareness (two sessions)

**Preconditions:** Program **Web Development 2026** exists; two admin sessions open edit for the same program (if testable).

**Steps:**
1. In session A, change **Name** to `Web Development 2026 - Session A` and save.
2. In session B, change **Description** and save without refreshing.

**Gherkin:**
```gherkin
Scenario: Last write or conflict handling for concurrent edits
  Given two admins are editing "Web Development 2026"
  When the first admin saves a name change
  And the second admin saves a description change without refreshing
  Then the system either merges changes, shows a conflict warning, or applies last-write-wins consistently
```

**Expected result:** Data does not corrupt silently; user receives predictable outcome per product spec.

**Priority:** Low

---

## Ambiguities and gaps in the acceptance criteria

1. **Field naming:** AC uses **Name** in edit scenarios while create AC uses **Program Name**; confirm single label and API field mapping in the UI.
2. **Pre-populated data scope:** AC says "program's current data" but does not list which fields (only Name/Description vs metadata such as created date, status).
3. **Authorization:** Edit flows assume access from Programs page; roles besides admin are not defined.
4. **Validation parity:** Create AC disables **Create** on empty name; edit validation rules (empty name, description required, uniqueness) are not in ACs.
5. **Immediate list update:** AC requires immediate list refresh; behavior under slow network, optimistic UI, or pagination (edited item off-screen) is unspecified.
6. **Unsaved changes:** No AC for warning when closing edit with dirty fields.
7. **Rename side effects:** Changing program name may affect enrollments, URLs, or reports; out of scope in ACs but may need regression checks.
8. **Success feedback:** No AC for toast/notification on successful save or keyboard shortcuts (Enter to save).
