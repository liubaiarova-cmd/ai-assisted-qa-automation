# Test Plan: Edit Existing Program Details (DS-2)

**Feature:** Edit existing program details  
**App:** https://test.didaxis.studio/programs  
**Source:** Jira [DS-2](https://legionqaschool.atlassian.net/browse/DS-2) — *Edit existing program details*

Verified against the live Programs page (admin session). The table has **Program** as the only named column. Each row shows **Program Name** and **Description**, plus **Edit {Program Name}** and **Delete {Program Name}** buttons. There is no search, filter, or pagination.

The edit UI is an **Edit Program** modal with:

- **Program Name \*** (required textbox)
- **Description** (optional textarea)
- **▸ Show AI Generation Config** (fields are already visible while the toggle still says Show)
- **Total Program Hours**, **Default Session Hours** (default `4`), **Default Exam Hours** (default `3`), **Target Audience**, **Focus Areas**, **Sync/Async Ratio** (`70% sync / 30% async`)
- **Cancel** and **Save**
- Unlabeled modal close button in the dialog banner

Save uses `PATCH /api/programs/{id}` with `{ name, description, total_hours, default_session_hours, default_exam_hours, target_audience, focus_areas, sync_async_ratio }`.

## Positive flows

### TC-001 — Edit form shows current program data

**Preconditions:** User is logged in as admin; program **Web Development 2026** exists and is visible on the Programs page.

**Steps:**
1. Navigate to the Programs page (`/programs`).
2. Locate **Web Development 2026** in the program table.
3. Click the **Edit Web Development 2026** button on that row.

**Gherkin:**
```gherkin
Scenario: Admin opens edit form with existing program data
  Given I am on the Programs page
  And a program "Web Development 2026" exists
  When I click the edit icon on "Web Development 2026"
  Then I see the Edit Program form pre-populated with the program's current data
```

**Expected result:** An **Edit Program** dialog opens. **Program Name** and **Description** match the stored values. **Save** and **Cancel** are visible. **Default Session Hours** is `4` and **Default Exam Hours** is `3` unless previously changed.

**Priority:** High

---

### TC-002 — Updated program name appears in the list after save

**Preconditions:** User is editing **Web Development 2026**; **Edit Program** form is open with current data loaded.

**Steps:**
1. Change **Program Name** to `Web Development 2026 - Updated`.
2. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Admin updates program name and sees list refresh
  Given I am editing "Web Development 2026"
  When I change the Program Name to "Web Development 2026 - Updated"
  And I click Save
  Then the modal closes
  And the program list immediately shows "Web Development 2026 - Updated"
```

**Expected result:** Modal closes; the old name is gone from the table; **Web Development 2026 - Updated** appears in the list without a full page reload. With a very large list, the row can update before the modal finishes closing.

**Priority:** High

---

### TC-003 — Name and other fields unchanged when only description is edited

**Preconditions:** Program exists with Program Name `Data Science Fundamentals` and Description `Original cohort description`; user is on the **Edit Program** form for that program.

**Steps:**
1. Change **Description** to `Updated cohort description for 2026`.
2. Leave **Program Name** unchanged.
3. Click **Save**.
4. Confirm the table row and re-open **Edit Program**.

**Gherkin:**
```gherkin
Scenario: Editing description does not alter program name
  Given I am editing a program
  And the Program Name is "Data Science Fundamentals"
  And the Description is "Original cohort description"
  When I only change the Description to "Updated cohort description for 2026"
  And I click Save
  Then the Program Name and other fields remain unchanged
  And the program list shows "Data Science Fundamentals"
```

**Expected result:** Table still shows **Data Science Fundamentals**. Description in the row is `Updated cohort description for 2026`. Re-opening edit shows the same **Program Name**, **Default Session Hours** `4`, and **Default Exam Hours** `3`.

**Priority:** High

---

### TC-004 — Both program name and description can be updated in one save

**Preconditions:** User is editing program **Cloud Computing 2026** on the Programs page.

**Steps:**
1. Change **Program Name** to `Cloud Computing 2026 - Advanced`.
2. Change **Description** to `Expanded curriculum with Kubernetes and Terraform`.
3. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Admin updates name and description together
  Given I am editing "Cloud Computing 2026"
  When I change the Program Name to "Cloud Computing 2026 - Advanced"
  And I change the Description to "Expanded curriculum with Kubernetes and Terraform"
  And I click Save
  Then the modal closes
  And the program list shows "Cloud Computing 2026 - Advanced"
```

**Expected result:** Both fields persist. The table row shows the new **Program Name** and new **Description**.

**Priority:** Medium

---

### TC-019 — Edit form includes AI generation config fields

**Preconditions:** User is logged in as admin; a program exists; **Edit Program** is open.

**Steps:**
1. Inspect the **Edit Program** dialog.
2. Note the **▸ Show AI Generation Config** control and the fields below it.

**Gherkin:**
```gherkin
Scenario: Edit form exposes AI generation config
  Given I am editing "Web Development 2026"
  Then I see fields Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas
  And I see Sync/Async Ratio "70% sync / 30% async"
  And I see a "Show AI Generation Config" control
```

**Expected result:** Those fields are present on the live edit form even while the toggle label still reads **▸ Show AI Generation Config**. **Default Session Hours** is `4` and **Default Exam Hours** is `3` for a newly created program.

**Priority:** Medium

---

## Negative flows

### TC-005 — Empty program name blocks save on edit

**Preconditions:** User is editing **Web Development 2026**; **Edit Program** form is open.

**Steps:**
1. Clear the **Program Name** field completely.
2. Observe **Save**.

**Gherkin:**
```gherkin
Scenario: Clearing program name prevents save
  Given I am editing "Web Development 2026"
  When I clear the Program Name field
  Then the Save button is disabled
  And the program list still shows "Web Development 2026"
```

**Expected result:** **Save** is disabled. The existing table row is unchanged. (The control is not hidden; it stays visible and disabled.)

**Priority:** High

---

### TC-006 — Canceling edit does not persist changes

**Preconditions:** User is editing **Web Development 2026**; **Edit Program** form is open.

**Steps:**
1. Change **Program Name** to `Temporary Draft Name`.
2. Click **Cancel**.
3. Review the Programs table.

**Gherkin:**
```gherkin
Scenario: Dismiss edit form without saving
  Given I am editing "Web Development 2026"
  When I change the Program Name to "Temporary Draft Name"
  And I close the edit modal without clicking Save
  Then the modal closes
  And the program list still shows "Web Development 2026"
  And the program list does not show "Temporary Draft Name"
```

**Expected result:** No changes are persisted; original **Program Name** and **Description** remain.

**Priority:** High

---

### TC-007 — Non-admin cannot edit program details

**Preconditions:** User is logged in as a non-admin; program **Web Development 2026** is visible or not per role.

**Steps:**
1. Navigate to the Programs page.
2. Look for **Edit Web Development 2026** on that row.

**Gherkin:**
```gherkin
Scenario: Non-admin cannot edit programs
  Given I am logged in as a non-admin user
  And a program "Web Development 2026" exists
  When I navigate to the Programs page
  Then I do not see an edit icon on "Web Development 2026"
  Or I cannot open the edit form
```

**Expected result:** Edit action is unavailable; program data cannot be modified through the UI. (Not verified on the live site in this pass — admin is the only `.env` account.)

**Priority:** High

---

### TC-008 — Renaming to an existing program name is currently accepted

**Preconditions:** Programs **Web Development 2026** and **Cybersecurity Bootcamp** exist; user is editing **Cybersecurity Bootcamp**.

**Steps:**
1. Change **Program Name** to `Web Development 2026`.
2. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Duplicate name on edit is currently allowed
  Given I am editing "Cybersecurity Bootcamp"
  And a program "Web Development 2026" already exists
  When I change the Program Name to "Web Development 2026"
  And I click Save
  Then the save succeeds
  And the program list shows two rows named "Web Development 2026"
```

**Expected result:** Live app does **not** show a duplicate/uniqueness error. `PATCH /api/programs/{id}` returns **200**. The table can contain two rows with the same **Program Name**. This contradicts typical uniqueness rules and DS-2 subtasks, but it is current behavior.

**Priority:** Medium

---

### TC-009 — Server or network failure does not show false success

**Preconditions:** User is editing a program; ability to simulate failed save (offline, 500) in test environment.

**Steps:**
1. Change **Description** to `Change pending save failure test`.
2. Trigger **Save** while `PATCH /api/programs/{id}` returns 500.
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

**Expected result:** User sees error state; list data matches last successful save, not the failed attempt. The modal should remain open with the in-progress **Description**.

**Priority:** Medium

---

### TC-022 — Closing edit with the banner X does not persist changes

**Preconditions:** User is editing **Web Development 2026**; **Edit Program** form is open.

**Steps:**
1. Change **Program Name** to `Closed Without Save`.
2. Click the unlabeled close button in the dialog banner.
3. Review the Programs table.

**Gherkin:**
```gherkin
Scenario: Banner close discards unsaved edit
  Given I am editing "Web Development 2026"
  When I change the Program Name to "Closed Without Save"
  And I click the dialog close button
  Then the modal closes
  And the program list still shows "Web Development 2026"
```

**Expected result:** Same as **Cancel** — draft **Program Name** is not written to the table.

**Priority:** Medium

---

## Edge cases

### TC-010 — Leading and trailing whitespace in name is trimmed on save

**Preconditions:** User is editing **Web Development 2026**.

**Steps:**
1. Change **Program Name** to `  Web Development 2026 - Trimmed  `.
2. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Trimmed name after edit
  Given I am editing "Web Development 2026"
  When I change the Program Name to "  Web Development 2026 - Trimmed  "
  And I click Save
  Then the modal closes
  And the program list shows "Web Development 2026 - Trimmed"
```

**Expected result:** Displayed name is trimmed. Save stays enabled while the padded value still contains non-space characters.

**Priority:** Medium

---

### TC-011 — Special characters and unicode in edited fields

**Preconditions:** User is editing **Web Development 2026**.

**Steps:**
1. Change **Program Name** to `AI & ML (2026) — Cohort #2`.
2. Change **Description** to `Résumé skills: NLP, CV, 100% hands-on`.
3. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Unicode and special characters persist after edit
  Given I am editing "Web Development 2026"
  When I change the Program Name to "AI & ML (2026) — Cohort #2"
  And I change the Description to "Résumé skills: NLP, CV, 100% hands-on"
  And I click Save
  Then the program list shows "AI & ML (2026) — Cohort #2"
```

**Expected result:** Characters render correctly in the table and on re-open of **Edit Program**. The live list already contains names such as **Informatique & IA - Niveau 2** and **日本語プログラム 2026**.

**Priority:** Medium

---

### TC-012 — Program name of 255 characters saves on edit

**Preconditions:** User is editing a program. The **Program Name** textbox has no `maxlength`.

**Steps:**
1. Change **Program Name** to a unique 255-character string.
2. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Name at 255 characters saves successfully
  Given I am editing "Web Development 2026"
  When I change the Program Name to a unique 255-character string
  And I click Save
  Then the modal closes
  And the program list shows the program with the full updated name
```

**Expected result:** **Save** stays enabled. The full name is stored and shown in the table.

**Priority:** Low

---

### TC-013 — Program name over 255 characters is currently accepted

**Preconditions:** User is editing **Web Development 2026**. There is no client-side max length on **Program Name**.

**Steps:**
1. Change **Program Name** to a unique 256-character string.
2. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Over-length name on edit currently saves
  Given I am editing "Web Development 2026"
  When I change the Program Name to a unique 256-character string
  And I click Save
  Then the save succeeds
  And the program list shows the full 256-character name
```

**Expected result:** Live app does **not** disable **Save** and does **not** show a length error. A 256-character name can be stored. The table already contains 256-character **A…** / **B…** names.

**Priority:** Medium

---

### TC-014 — Whitespace-only name is treated as empty

**Preconditions:** User is editing **Web Development 2026**.

**Steps:**
1. Replace **Program Name** with only spaces (`   `).
2. Observe **Save**.

**Gherkin:**
```gherkin
Scenario: Whitespace-only name is invalid on edit
  Given I am editing "Web Development 2026"
  When I change the Program Name to "   "
  Then the Save button is disabled
```

**Expected result:** **Save** is disabled, same as a fully empty **Program Name**.

**Priority:** Medium

---

### TC-015 — Clearing description on edit is allowed

**Preconditions:** User is editing a program that has a non-empty **Description**.

**Steps:**
1. Clear **Description** completely.
2. Leave **Program Name** unchanged.
3. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Empty description on edit
  Given I am editing "Web Development 2026"
  And the Description is "Full-stack web development program"
  When I clear the Description field
  And I click Save
  Then the program is saved with an empty Description
```

**Expected result:** **Description** is optional (no asterisk). Save succeeds. The table row no longer shows the previous description text. Re-opening edit shows an empty **Description**.

**Priority:** Medium

---

### TC-016 — Save without modifications leaves a single row

**Preconditions:** User opens **Edit Program** for **Web Development 2026** without changing any field.

**Steps:**
1. Click **Save** immediately (**Save** is enabled with no dirty-state check).

**Gherkin:**
```gherkin
Scenario: Save without changes
  Given I am editing "Web Development 2026"
  When I click Save without changing any fields
  Then the modal closes
  And the program list still shows "Web Development 2026"
  And no duplicate entries appear in the list
```

**Expected result:** Modal closes; list unchanged; still exactly one row for that **Program Name**.

**Priority:** Low

---

### TC-017 — Script-like content in description is stored safely

**Preconditions:** User is editing **Web Development 2026**.

**Steps:**
1. Set **Description** to `<img src=x onerror=alert(1)>`.
2. Click **Save**.
3. View the program in the table and re-open edit.

**Gherkin:**
```gherkin
Scenario: HTML in description is not executed after edit
  Given I am editing "Web Development 2026"
  When I change the Description to "<img src=x onerror=alert(1)>"
  And I click Save
  Then no script or HTML injection runs in the browser
  And the program list still shows "Web Development 2026"
```

**Expected result:** Content is stored as text; no alert or DOM injection.

**Priority:** Low

---

### TC-018 — Concurrent edit awareness (two sessions)

**Preconditions:** Program **Web Development 2026** exists; two admin sessions open edit for the same program.

**Steps:**
1. In session A, change **Program Name** to `Web Development 2026 - Session A` and save.
2. In session B, change **Description** and save without refreshing.

**Gherkin:**
```gherkin
Scenario: Last write or conflict handling for concurrent edits
  Given two admins are editing "Web Development 2026"
  When the first admin saves a name change
  And the second admin saves a description change without refreshing
  Then the system either merges changes, shows a conflict warning, or applies last-write-wins consistently
```

**Expected result:** Data does not corrupt silently; user receives a predictable last-write-wins or conflict outcome. ACs do not specify this.

**Priority:** Low

---

### TC-020 — Default session and exam hours stay set when only description is edited

**Preconditions:** Newly created program (hours still at defaults `4` and `3`); user is on **Edit Program**.

**Steps:**
1. Confirm **Default Session Hours** is `4` and **Default Exam Hours** is `3`.
2. Change only **Description**.
3. Click **Save**.
4. Re-open **Edit Program**.

**Gherkin:**
```gherkin
Scenario: Description edit preserves default hours
  Given I am editing a program with Default Session Hours 4 and Default Exam Hours 3
  When I only change the Description
  And I click Save
  Then Default Session Hours is still 4
  And Default Exam Hours is still 3
```

**Expected result:** PATCH still sends `default_session_hours: 4` and `default_exam_hours: 3`. Re-opened form shows those values. This is the “other fields remain unchanged” part of the Jira AC.

**Priority:** High

---

### TC-021 — Single-character program name is accepted on edit

**Preconditions:** User is editing a program.

**Steps:**
1. Change **Program Name** to `A`.
2. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Single-character Program Name is accepted on edit
  Given I am editing "Web Development 2026"
  When I change the Program Name to "A"
  And I click Save
  Then the program list shows "A"
```

**Expected result:** **Save** enables for a single non-space character. The table shows `A`. Use a unique single character plus suffix in automation so the row can be found in a large list.

**Priority:** Low

---

### TC-023 — Case-only duplicate program name is currently accepted on edit

**Preconditions:** Program **Web Development 2026** exists; user is editing a different program.

**Steps:**
1. Change **Program Name** to `web development 2026` (same letters, different case) if an exact case-variant of an existing name is used.
2. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Case-variant duplicate name on edit is currently allowed
  Given a program "Web Development 2026" exists
  And I am editing a different program
  When I change the Program Name to "web development 2026"
  And I click Save
  Then the save succeeds
```

**Expected result:** Live list already contains mixed-case names such as **web development 2026** next to **Web Development 2026**. No case-insensitive uniqueness check is visible.

**Priority:** Medium

---

## Ambiguities and gaps in the acceptance criteria

1. **Field naming:** Jira ACs say **Name**; the UI label is **Program Name \***. Tests use **Program Name**.
2. **Pre-populated data scope:** AC says "program's current data" but does not list AI config fields. The live form also includes **Total Program Hours**, **Default Session Hours**, **Default Exam Hours**, **Target Audience**, **Focus Areas**, and **Sync/Async Ratio**.
3. **AI toggle vs fields:** Toggle reads **▸ Show AI Generation Config** while those fields are already visible (matches DS-223).
4. **Authorization:** Edit flows assume admin. Non-admin behavior is not in the ACs. Only admin credentials are in `.env`.
5. **Validation:** Empty / whitespace-only **Program Name** disables **Save**. **Description** is optional. Uniqueness and max length are **not** enforced on the live edit form, despite several DS-2 subtasks.
6. **Immediate list update:** List rows update as soon as PATCH + GET `/api/programs` complete. With 5,000+ unpaginated rows the modal can stay open longer than the row update.
7. **Unsaved changes:** **Cancel** and the banner close control discard edits. There is no dirty-state warning.
8. **Success feedback:** No toast on successful save. **Save** stays enabled even when nothing changed.
9. **No search/filter/pagination** on Programs, so locating a row after rename depends on exact text match in a very large table.
