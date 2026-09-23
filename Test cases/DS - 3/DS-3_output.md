# Test Plan: Program Name Validation and Duplicate Prevention

## Positive flows

### TC-001 — Program name with special characters and accents is accepted

**Preconditions:** User is logged in as admin; no program named **Informatique & IA - Niveau 2** exists; user is on the program creation form.

**Steps:**
1. Enter `Informatique & IA - Niveau 2` in **Program Name**.
2. Fill **Description** with `Programme bilingue en informatique et intelligence artificielle`.
3. Click **Create**.

**Gherkin:**
```gherkin
Scenario: Program name with ampersand, hyphen, and accented characters
  Given I am on the program creation form
  When I enter "Informatique & IA - Niveau 2" as the program name
  And I fill other required fields
  And I click Create
  Then the program is created successfully
```

**Expected result:** Program is created; modal closes; program list shows **Informatique & IA - Niveau 2** with correct rendering of `&`, `-`, and `é` in related fields.

**Priority:** High

---

### TC-002 — Standard alphanumeric program name is accepted

**Preconditions:** User is on the program creation form; name **Mobile Development 2026** does not already exist.

**Steps:**
1. Enter `Mobile Development 2026` in **Program Name**.
2. Enter `iOS and Android curriculum` in **Description**.
3. Click **Create**.

**Gherkin:**
```gherkin
Scenario: Valid simple program name creates program
  Given I am on the program creation form
  When I enter "Mobile Development 2026" as the program name
  And I fill in Description with "iOS and Android curriculum"
  And I click Create
  Then the program is created successfully
  And the program list shows "Mobile Development 2026"
```

**Expected result:** Program is persisted and listed without validation errors.

**Priority:** Medium

---

### TC-003 — Program name with internal spaces is accepted

**Preconditions:** User is on the program creation form; duplicate name check passes.

**Steps:**
1. Enter `Full   Stack   Engineering` (multiple spaces between words) in **Program Name**.
2. Fill required fields and click **Create**.

**Gherkin:**
```gherkin
Scenario: Program name with multiple internal spaces
  Given I am on the program creation form
  When I enter "Full   Stack   Engineering" as the program name
  And I fill other required fields
  And I click Create
  Then the program is created successfully
```

**Expected result:** Program is created; displayed name follows product rules (preserve or normalize internal whitespace consistently).

**Priority:** Low

---

## Negative flows

### TC-004 — Whitespace-only program name is not submitted

**Preconditions:** User is on the program creation form.

**Steps:**
1. Enter `   ` (spaces only) in **Program Name**.
2. Fill **Description** with `Valid description text`.
3. Click **Create** or observe **Create** button state.

**Gherkin:**
```gherkin
Scenario: Whitespace-only name is trimmed and rejected
  Given I am on the program creation form
  When I enter "   " as the program name
  And I click Create
  Then the form is not submitted (name is trimmed, treated as empty)
```

**Expected result:** No program is created; modal stays open; **Create** is disabled or inline validation indicates **Program Name** is required; list unchanged.

**Priority:** High

---

### TC-005 — Duplicate program name shows error and blocks creation

**Preconditions:** Program **Web Development 2026** already exists; user is on the program creation form.

**Steps:**
1. Enter `Web Development 2026` in **Program Name**.
2. Enter `Another description for duplicate attempt` in **Description**.
3. Click **Create**.

**Gherkin:**
```gherkin
Scenario: Duplicate program name on create
  Given a program "Web Development 2026" already exists
  When I try to create a new program with the same name
  Then I see an error indicating the name already exists
```

**Expected result:** Error message is visible (field-level or banner); second program is not created; list still contains exactly one **Web Development 2026**.

**Priority:** High

---

### TC-006 — Empty Program Name cannot be submitted

**Preconditions:** User is on the program creation form.

**Steps:**
1. Leave **Program Name** empty.
2. Fill **Description** with `Description without name`.
3. Attempt to click **Create**.

**Gherkin:**
```gherkin
Scenario: Empty program name is rejected
  Given I am on the program creation form
  When I leave the Program Name field empty
  And I fill in Description with "Description without name"
  Then the Create button is disabled
  And no program is created
```

**Expected result:** Submission blocked; behavior consistent with whitespace-only name after trim.

**Priority:** High

---

### TC-007 — Duplicate name does not partially persist on failed create

**Preconditions:** **Web Development 2026** exists; user attempts duplicate create.

**Steps:**
1. Submit duplicate name as in TC-005.
2. Refresh the Programs page.
3. Search or scan the full list.

**Gherkin:**
```gherkin
Scenario: Failed duplicate create leaves database unchanged
  Given a program "Web Development 2026" already exists
  When I try to create a new program with the same name
  And I see an error indicating the name already exists
  Then after I refresh the Programs page
  And the program list still contains only one "Web Development 2026"
```

**Expected result:** No ghost rows, draft entries, or duplicate IDs after error.

**Priority:** Medium

---

### TC-008 — Duplicate check on edit renames to existing name

**Preconditions:** Programs **Web Development 2026** and **Cybersecurity Bootcamp** exist; user opens edit for **Cybersecurity Bootcamp**.

**Steps:**
1. Change **Program Name** to `Web Development 2026`.
2. Click **Save**.

**Gherkin:**
```gherkin
Scenario: Rename to existing program name is rejected
  Given a program "Web Development 2026" already exists
  And I am editing "Cybersecurity Bootcamp"
  When I change the Program Name to "Web Development 2026"
  And I click Save
  Then I see an error indicating the name already exists
  And the program list still shows "Cybersecurity Bootcamp"
```

**Expected result:** Duplicate prevention applies on edit, not only on create (unless product explicitly scopes AC to create only).

**Priority:** High

---

## Edge cases

### TC-009 — Leading and trailing whitespace around valid name

**Preconditions:** **Web Development 2026** does not exist (or use a unique base name); user is on creation form.

**Steps:**
1. Enter `  Unique Program Alpha  ` in **Program Name**.
2. Fill required fields and click **Create**.

**Gherkin:**
```gherkin
Scenario: Trimmed valid name is accepted
  Given I am on the program creation form
  When I enter "  Unique Program Alpha  " as the program name
  And I fill other required fields
  And I click Create
  Then the program is created successfully
  And the program list shows "Unique Program Alpha"
```

**Expected result:** Trimmed name is stored; duplicate checks use normalized form so `  Unique Program Alpha  ` does not bypass uniqueness of `Unique Program Alpha`.

**Priority:** Medium

---

### TC-010 — Duplicate detection is case-insensitive (if product rule)

**Preconditions:** Program **Web Development 2026** exists.

**Steps:**
1. Enter `web development 2026` in **Program Name**.
2. Fill required fields and click **Create**.

**Gherkin:**
```gherkin
Scenario: Case-variant duplicate name is rejected
  Given a program "Web Development 2026" already exists
  When I try to create a new program with the program name "web development 2026"
  Then I see an error indicating the name already exists
```

**Expected result:** Either case-insensitive duplicate is blocked, or distinct casing is allowed—outcome must match documented rule (test documents expected strict duplicate prevention).

**Priority:** Medium

---

### TC-011 — Duplicate after Unicode normalization

**Preconditions:** Program name with composed vs decomposed unicode (if applicable).

**Steps:**
1. Create or assume program **Café Program**.
2. Attempt create with visually similar name using different unicode representation of **é**.

**Gherkin:**
```gherkin
Scenario: Unicode-normalized duplicate prevention
  Given a program "Café Program" already exists
  When I try to create a new program with a visually equivalent "Café Program" name
  Then I see an error indicating the name already exists
  Or the system treats the names as distinct per unicode rules
```

**Expected result:** Consistent normalization before uniqueness check; no duplicate display names that users cannot distinguish.

**Priority:** Low

---

### TC-012 — Program name at maximum allowed length

**Preconditions:** User is on creation form; max length known (e.g. 255).

**Steps:**
1. Enter a **Program Name** of exactly maximum length (unique).
2. Fill **Description** and click **Create**.

**Gherkin:**
```gherkin
Scenario: Maximum length program name is valid
  Given I am on the program creation form
  When I enter a program name of exactly the maximum allowed length
  And I fill other required fields
  And I click Create
  Then the program is created successfully
```

**Expected result:** Boundary length accepted; name appears correctly in list.

**Priority:** Low

---

### TC-013 — Program name exceeding maximum length is rejected

**Preconditions:** User is on creation form.

**Steps:**
1. Enter a name one character over the maximum.
2. Attempt **Create**.

**Gherkin:**
```gherkin
Scenario: Over-maximum program name cannot be created
  Given I am on the program creation form
  When I enter a program name one character over the maximum allowed length
  Then the Create button is disabled or I see a length validation message
  And no program is created
```

**Expected result:** Validation prevents submit; no truncated name stored silently.

**Priority:** Medium

---

### TC-014 — Program name with parentheses, quotes, and hash

**Preconditions:** Unique name; user on creation form.

**Steps:**
1. Enter `DevOps (2026) "Fast Track" #1` in **Program Name**.
2. Fill required fields and click **Create**.

**Gherkin:**
```gherkin
Scenario: Additional special characters in program name
  Given I am on the program creation form
  When I enter "DevOps (2026) \"Fast Track\" #1" as the program name
  And I fill other required fields
  And I click Create
  Then the program is created successfully
```

**Expected result:** Name saves and displays without breaking list layout or escaping issues.

**Priority:** Medium

---

### TC-015 — Tabs and newline characters in program name

**Preconditions:** User is on creation form.

**Steps:**
1. Enter a name containing tab or newline (e.g. paste `Program\tName` or two lines).
2. Attempt **Create**.

**Gherkin:**
```gherkin
Scenario: Control characters in program name
  Given I am on the program creation form
  When I enter a program name containing tab or newline characters
  Then the Create button is disabled or I see a validation message
  Or the name is sanitized and created per product rules
```

**Expected result:** No broken UI rows; invalid control chars rejected or stripped explicitly.

**Priority:** Low

---

### TC-016 — Same name allowed after original program is deleted (if delete exists)

**Preconditions:** **Web Development 2026** existed and was deleted; user on creation form.

**Steps:**
1. Enter `Web Development 2026` in **Program Name**.
2. Click **Create**.

**Gherkin:**
```gherkin
Scenario: Reuse name after deletion
  Given no program "Web Development 2026" currently exists
  And a program with that name was previously deleted
  When I enter "Web Development 2026" as the program name
  And I fill other required fields
  And I click Create
  Then the program is created successfully
```

**Expected result:** Name is available again when no active program holds it (soft-delete rules may differ).

**Priority:** Low

---

### TC-017 — Error message clarity for duplicate

**Preconditions:** **Web Development 2026** exists; user attempts duplicate.

**Steps:**
1. Trigger duplicate error (TC-005).
2. Read error text and association with **Program Name** field.

**Gherkin:**
```gherkin
Scenario: Duplicate error references program name
  Given a program "Web Development 2026" already exists
  When I try to create a new program with the same name
  Then I see an error indicating the name already exists
  And the error is associated with the Program Name field or clearly names "Web Development 2026"
```

**Expected result:** User understands which name conflicts; error is accessible (screen reader / aria).

**Priority:** Medium

---

## Ambiguities and gaps in the acceptance criteria

1. **Edit vs create:** Duplicate AC describes create only; TC-008 assumes the same rule on edit—confirm scope.
2. **Case sensitivity:** AC uses exact string **Web Development 2026**; case-insensitive duplicates are not specified (TC-010).
3. **Trim rules:** Whitespace AC covers trim-to-empty; internal spaces and tab/newline handling are unspecified (TC-003, TC-015).
4. **Error UX:** AC requires an error for duplicate but not exact copy, placement (inline vs toast), or whether **Create** stays enabled.
5. **Max length:** Not in ACs; TC-012 and TC-013 need confirmed limits from design/API.
6. **Allowed character set:** Special-character AC shows one positive example; rejection rules for `<`, `/`, emoji, or SQL-like strings are not defined.
7. **Uniqueness scope:** Global vs per-organization or per-academic year is not stated.
8. **Soft delete / archived programs:** Whether archived names block reuse is not covered (TC-016).
9. **"Other required fields":** AC does not define **Description** requirement; tests assume description is fillable and may be required elsewhere.
10. **Timing:** No AC for duplicate check on blur vs on submit, or debounced async validation.
