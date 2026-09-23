# Test Plan: Create New Academic Program

## Positive flows

### TC-001 — Program creation form displays required fields

**Preconditions:** User is logged in as admin.

**Steps:**
1. Navigate to the Programs page.
2. Click "+ New Program".

**Gherkin:**
```gherkin
Scenario: Admin opens program creation form with required fields
  Given I am logged in as admin
  When I navigate to the Programs page
  And I click "+ New Program"
  Then I see the program creation form with fields: Program Name, Description
```

**Expected result:** The program creation form is visible and includes editable **Program Name** and **Description** fields.

**Priority:** High

---

### TC-002 — New program appears in the list after successful creation

**Preconditions:** User is logged in as admin and is on the program creation form.

**Steps:**
1. Enter `Web Development 2026` in **Program Name**.
2. Enter `Full-stack web development program` in **Description**.
3. Click **Create**.

**Gherkin:**
```gherkin
Scenario: Admin creates a program with name and description
  Given I am on the program creation form
  When I fill in Program Name with "Web Development 2026"
  And I fill in Description with "Full-stack web development program"
  And I click Create
  Then the modal closes
  And the program list shows "Web Development 2026"
```

**Expected result:** The creation modal closes; the Programs list includes a row or card for **Web Development 2026** with the entered description visible or accessible (per UI design).

**Priority:** High

---

### TC-003 — Program can be created with description only populated beyond minimum

**Preconditions:** User is on the program creation form with **Program Name** filled with a valid value.

**Steps:**
1. Enter `Data Science Fundamentals` in **Program Name**.
2. Enter a multi-sentence description in **Description**.
3. Click **Create**.

**Gherkin:**
```gherkin
Scenario: Admin creates a program with a longer description
  Given I am on the program creation form
  When I fill in Program Name with "Data Science Fundamentals"
  And I fill in Description with "Introductory data science covering Python, statistics, and machine learning basics."
  And I click Create
  Then the modal closes
  And the program list shows "Data Science Fundamentals"
```

**Expected result:** Program is created successfully and listed as **Data Science Fundamentals**.

**Priority:** Medium

---

## Negative flows

### TC-004 — Create remains disabled when Program Name is empty

**Preconditions:** User is on the program creation form.

**Steps:**
1. Leave **Program Name** empty.
2. Optionally fill **Description** with any text.
3. Observe the **Create** button state.

**Gherkin:**
```gherkin
Scenario: Empty program name blocks submission
  Given I am on the program creation form
  When I leave the Program Name field empty
  Then the Create button is disabled
```

**Expected result:** **Create** is disabled; no program is created and the modal remains open.

**Priority:** High

---

### TC-005 — Program is not created when user dismisses the modal without submitting

**Preconditions:** User opened the program creation form from the Programs page.

**Steps:**
1. Enter partial data in **Program Name** (e.g. `Draft Program`).
2. Close the modal via **Cancel**, **X**, or equivalent dismiss control without clicking **Create**.
3. Review the Programs list.

**Gherkin:**
```gherkin
Scenario: Dismissing the form does not create a program
  Given I am on the program creation form
  And I fill in Program Name with "Draft Program"
  When I close the program creation modal without clicking Create
  Then the modal closes
  And the program list does not show "Draft Program"
```

**Expected result:** No new program appears in the list; list content is unchanged from before opening the form.

**Priority:** Medium

---

### TC-006 — Non-admin user cannot access program creation

**Preconditions:** User is logged in with a role that is not admin (e.g. instructor or student, if applicable).

**Steps:**
1. Navigate to the Programs page.
2. Attempt to open program creation (+ New Program or equivalent).

**Gherkin:**
```gherkin
Scenario: Non-admin cannot open program creation
  Given I am logged in as a non-admin user
  When I navigate to the Programs page
  Then I do not see "+ New Program"
  Or I cannot open the program creation form
```

**Expected result:** Program creation is not available to non-admin users; no program creation form is shown.

**Priority:** High

---

### TC-007 — Duplicate program name does not create a second conflicting entry (if uniqueness is required)

**Preconditions:** Program **Web Development 2026** already exists in the list; admin is on the creation form.

**Steps:**
1. Enter `Web Development 2026` in **Program Name**.
2. Enter any description.
3. Click **Create** (if enabled).

**Gherkin:**
```gherkin
Scenario: Duplicate program name is rejected
  Given a program named "Web Development 2026" already exists
  And I am on the program creation form
  When I fill in Program Name with "Web Development 2026"
  And I fill in Description with "Another description"
  And I click Create
  Then I see a validation or error message indicating the name is already in use
  And the program list contains only one "Web Development 2026"
```

**Expected result:** System prevents duplicate names or shows a clear error; list does not contain two indistinguishable duplicates.

**Priority:** Medium

---

## Edge cases

### TC-008 — Program Name with leading and trailing whitespace is handled consistently

**Preconditions:** User is on the program creation form.

**Steps:**
1. Enter `  Cloud Computing 2026  ` in **Program Name** (spaces before and after).
2. Enter a valid **Description**.
3. Click **Create**.

**Gherkin:**
```gherkin
Scenario: Trimmed program name is stored and displayed
  Given I am on the program creation form
  When I fill in Program Name with "  Cloud Computing 2026  "
  And I fill in Description with "Cloud infrastructure and DevOps track"
  And I click Create
  Then the modal closes
  And the program list shows "Cloud Computing 2026"
```

**Expected result:** Stored and displayed name is trimmed to `Cloud Computing 2026` (or validation rejects whitespace-only padding per product rules).

**Priority:** Medium

---

### TC-009 — Program Name accepts special characters and unicode

**Preconditions:** User is on the program creation form.

**Steps:**
1. Enter `AI & ML (2026) — Cohort #1` in **Program Name**.
2. Enter `Topics: NLP, CV, étude` in **Description**.
3. Click **Create**.

**Gherkin:**
```gherkin
Scenario: Special characters and unicode in program fields
  Given I am on the program creation form
  When I fill in Program Name with "AI & ML (2026) — Cohort #1"
  And I fill in Description with "Topics: NLP, CV, étude"
  And I click Create
  Then the modal closes
  And the program list shows "AI & ML (2026) — Cohort #1"
```

**Expected result:** Characters render correctly in the form and list without corruption or submission failure.

**Priority:** Medium

---

### TC-010 — Program Name at maximum allowed length

**Preconditions:** User is on the program creation form; maximum length for **Program Name** is known (e.g. 255 characters) or discovered via UI.

**Steps:**
1. Enter a **Program Name** of exactly the maximum allowed length.
2. Enter a valid **Description**.
3. Click **Create**.

**Gherkin:**
```gherkin
Scenario: Program name at maximum length is accepted
  Given I am on the program creation form
  When I fill in Program Name with a string of maximum allowed length
  And I fill in Description with "Boundary test for name length"
  And I click Create
  Then the modal closes
  And the program list shows the program with the full name
```

**Expected result:** Program is created successfully at the boundary; full name is visible or truncated per design with full value stored.

**Priority:** Low

---

### TC-011 — Program Name exceeding maximum length is rejected

**Preconditions:** User is on the program creation form.

**Steps:**
1. Enter a **Program Name** one character over the maximum allowed length.
2. Attempt to click **Create**.

**Gherkin:**
```gherkin
Scenario: Over-length program name cannot be submitted
  Given I am on the program creation form
  When I fill in Program Name with a string one character over the maximum allowed length
  And I fill in Description with "Over limit test"
  Then the Create button is disabled or I see a length validation message
  And no new program is created
```

**Expected result:** Submission is blocked or field shows validation; no partial or truncated program is silently created.

**Priority:** Medium

---

### TC-012 — Empty Description behavior

**Preconditions:** User is on the program creation form.

**Steps:**
1. Enter `Cybersecurity Bootcamp` in **Program Name**.
2. Leave **Description** empty.
3. Observe **Create** button and submit if enabled.

**Gherkin:**
```gherkin
Scenario: Program creation with empty description
  Given I am on the program creation form
  When I fill in Program Name with "Cybersecurity Bootcamp"
  And I leave Description empty
  And I click Create
  Then either the program is created and listed as "Cybersecurity Bootcamp"
  Or the Create button is disabled and Description is required
```

**Expected result:** Behavior matches product rules: either optional description allows creation, or required description blocks submit with clear feedback.

**Priority:** Medium

---

### TC-013 — Program Name containing only whitespace is treated as empty

**Preconditions:** User is on the program creation form.

**Steps:**
1. Enter only spaces or tabs in **Program Name**.
2. Fill **Description** with valid text.
3. Observe **Create** button.

**Gherkin:**
```gherkin
Scenario: Whitespace-only program name is invalid
  Given I am on the program creation form
  When I fill in Program Name with "   "
  And I fill in Description with "Valid description"
  Then the Create button is disabled
```

**Expected result:** **Create** remains disabled; no program is created.

**Priority:** Medium

---

### TC-014 — XSS or script-like strings are stored safely

**Preconditions:** User is on the program creation form.

**Steps:**
1. Enter `<script>alert('xss')</script>` in **Description** (and a valid **Program Name**).
2. Click **Create**.
3. View the program in the list and open details if available.

**Gherkin:**
```gherkin
Scenario: Script tags in description are not executed
  Given I am on the program creation form
  When I fill in Program Name with "Security Test Program"
  And I fill in Description with "<script>alert('xss')</script>"
  And I click Create
  Then the modal closes
  And no script is executed in the browser
  And the program list shows "Security Test Program"
```

**Expected result:** Content is escaped or sanitized; no script execution; text may display as literal or sanitized string.

**Priority:** Low

---

## Ambiguities and gaps in the acceptance criteria

1. **Description field:** ACs do not state whether **Description** is required, optional, or has min/max length. TC-012 documents both possible outcomes until clarified.
2. **Program Name constraints:** No max length, allowed character set, or uniqueness rule is specified in ACs. TC-007, TC-010, and TC-011 assume common patterns that should be confirmed with product/engineering.
3. **Modal dismiss:** ACs do not define cancel/close behavior or unsaved-changes warning. TC-005 covers expected non-creation on dismiss.
4. **List presentation:** AC only asserts the name appears in the list; sort order, default filters, pagination, and whether description is shown inline are unspecified.
5. **Roles:** Only admin is mentioned in navigation AC; TC-006 assumes non-admins must not create programs—confirm authorized roles.
6. **Post-create feedback:** No AC for success toast, error handling on server failure, or loading state on **Create**.
7. **Edit/delete:** Out of scope for create feature but affects whether duplicate-name rules apply to rename flows.
