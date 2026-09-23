# Test Plan: Program List Filtering and Display

## Positive flows

### TC-001 — Program list shows name and description for each program

**Preconditions:** User is logged in as admin; at least three programs exist, for example **Web Development 2026**, **Data Science Fundamentals**, and **Cybersecurity Bootcamp**, each with a non-empty description.

**Steps:**
1. Navigate to the Programs page.
2. Review each row or card in the program list.
3. Compare displayed text to known program data.

**Gherkin:**
```gherkin
Scenario: Programs page lists names and descriptions
  Given programs exist in the system
  And a program "Web Development 2026" exists with description "Full-stack web development program"
  And a program "Data Science Fundamentals" exists with description "Introductory data science curriculum"
  When I navigate to the Programs page
  Then I see a list showing each program's name and description
  And I see "Web Development 2026" with description "Full-stack web development program"
  And I see "Data Science Fundamentals" with description "Introductory data science curriculum"
```

**Expected result:** Every program in the system appears in the list with correct **name** and **description** visible (inline or on expand per UI design).

**Priority:** High

---

### TC-002 — Empty state message and create prompt when no programs exist

**Preconditions:** No programs exist in the system (or test tenant is empty); user is logged in as admin.

**Steps:**
1. Navigate to the Programs page.
2. Read on-page messaging and primary actions.

**Gherkin:**
```gherkin
Scenario: Empty programs list shows guidance to create first program
  Given no programs exist
  When I navigate to the Programs page
  Then I see a message indicating no programs have been created
  And I see a prompt to create the first program
```

**Expected result:** Empty state copy is clear; **+ New Program** or equivalent CTA is visible and leads to program creation when clicked.

**Priority:** High

---

### TC-003 — Create first program from empty state CTA

**Preconditions:** No programs exist; user is admin on Programs page empty state.

**Steps:**
1. Click the prompt or **+ New Program** from empty state.
2. Create program **Mobile Development 2026** with description `iOS and Android track`.
3. Save and return to list view.

**Gherkin:**
```gherkin
Scenario: Empty state create prompt opens creation flow
  Given no programs exist
  When I navigate to the Programs page
  And I follow the prompt to create the first program
  And I create a program "Mobile Development 2026" with description "iOS and Android track"
  Then I see a list showing "Mobile Development 2026" and its description
  And I no longer see the empty state message
```

**Expected result:** After first program is created, list view replaces empty state and shows the new program details.

**Priority:** Medium

---

### TC-004 — List reflects newly created program without manual refresh

**Preconditions:** Programs already exist; user creates another program from Programs page.

**Steps:**
1. Note current list on Programs page.
2. Create **Cloud Computing 2026** with description `AWS and Azure fundamentals`.
3. Observe list after modal closes.

**Gherkin:**
```gherkin
Scenario: Program list updates after create
  Given programs exist in the system
  When I create a new program "Cloud Computing 2026" with description "AWS and Azure fundamentals"
  Then I see "Cloud Computing 2026" in the program list with its description
```

**Expected result:** New entry appears immediately with correct name and description.

**Priority:** Medium

---

## Negative flows

### TC-005 — Program list is not shown to unauthorized users

**Preconditions:** User is not logged in or lacks permission to view programs.

**Steps:**
1. Attempt to open the Programs page URL directly.
2. Observe redirect or error.

**Gherkin:**
```gherkin
Scenario: Unauthorized user cannot view program list
  Given I am not logged in
  When I navigate to the Programs page
  Then I do not see the program list with names and descriptions
  And I am redirected to login or see an access denied message
```

**Expected result:** No program data leaked; no empty state with create prompt for unauthorized users unless role allows.

**Priority:** High

---

### TC-006 — Empty state is not shown when programs exist

**Preconditions:** At least one program exists, e.g. **Web Development 2026**.

**Steps:**
1. Navigate to Programs page.
2. Verify empty state elements are absent.

**Gherkin:**
```gherkin
Scenario: Populated list hides empty state messaging
  Given a program "Web Development 2026" exists
  When I navigate to the Programs page
  Then I see a list showing each program's name and description
  And I do not see a message indicating no programs have been created
```

**Expected result:** Standard list view only; no conflicting empty-state copy.

**Priority:** High

---

### TC-007 — Failed load does not show false empty state

**Preconditions:** Ability to simulate API failure when loading programs list.

**Steps:**
1. Navigate to Programs page while list API fails.
2. Observe UI.

**Gherkin:**
```gherkin
Scenario: Load error is distinct from empty programs
  Given the programs list cannot be loaded
  When I navigate to the Programs page
  Then I do not see the empty state prompt to create the first program as if no programs exist
  And I see an error or retry option
```

**Expected result:** User is not misled into thinking the catalog is empty when data failed to load.

**Priority:** Medium

---

### TC-008 — Non-admin does not see create prompt on empty list (if restricted)

**Preconditions:** No programs exist; user is non-admin without create permission.

**Steps:**
1. Navigate to Programs page.
2. Check for create-first-program prompt.

**Gherkin:**
```gherkin
Scenario: Non-admin empty list without create affordance
  Given no programs exist
  And I am logged in as a non-admin user without create permission
  When I navigate to the Programs page
  Then I see a message indicating no programs have been created
  And I do not see an actionable prompt to create the first program
```

**Expected result:** Empty informational state only; no **+ New Program** if role forbids creation.

**Priority:** Medium

---

## Edge cases

### TC-009 — Programs with special characters display correctly in list

**Preconditions:** Program **Informatique & IA - Niveau 2** exists with description `Programme bilingue — 100% pratique`.

**Steps:**
1. Navigate to Programs page.
2. Inspect list rendering for that program.

**Gherkin:**
```gherkin
Scenario: Special characters in name and description render correctly
  Given a program "Informatique & IA - Niveau 2" exists with description "Programme bilingue — 100% pratique"
  When I navigate to the Programs page
  Then I see "Informatique & IA - Niveau 2" in the list
  And I see the description "Programme bilingue — 100% pratique"
```

**Expected result:** `&`, accents, and em dash display without HTML entities or truncation errors.

**Priority:** Medium

---

### TC-010 — Long program name and description in list layout

**Preconditions:** Program exists with very long name and multi-paragraph description (near max length).

**Steps:**
1. Open Programs page.
2. Verify list row layout, tooltip, or expand for overflow.

**Gherkin:**
```gherkin
Scenario: Long text in list does not break layout
  Given a program with a very long name and description exists
  When I navigate to the Programs page
  Then I see the program in the list
  And the name and description are readable via truncation, wrap, or expand without overlapping other rows
```

**Expected result:** Table/cards remain usable; full text available via hover, expand, or details view.

**Priority:** Medium

---

### TC-011 — Program with empty description still appears in list

**Preconditions:** Program **Cybersecurity Bootcamp** exists with blank **Description** if product allows.

**Steps:**
1. Navigate to Programs page.
2. Locate **Cybersecurity Bootcamp**.

**Gherkin:**
```gherkin
Scenario: Program without description still listed with name
  Given a program "Cybersecurity Bootcamp" exists with an empty description
  When I navigate to the Programs page
  Then I see "Cybersecurity Bootcamp" in the list
  And the description area shows empty, em dash, or "No description" per design
```

**Expected result:** Name always shown; empty description handled consistently.

**Priority:** Medium

---

### TC-012 — Large number of programs and pagination or scroll

**Preconditions:** Many programs exist (e.g. 50+); pagination or virtual scroll enabled if applicable.

**Steps:**
1. Navigate to Programs page.
2. Scroll or move to next page.
3. Verify names and descriptions load correctly on each page.

**Gherkin:**
```gherkin
Scenario: Paginated program list shows name and description on each page
  Given more programs exist than fit on one page
  When I navigate to the Programs page
  And I go to the next page of programs
  Then I see each program's name and description on that page
```

**Expected result:** No missing rows; stable sort; performance acceptable.

**Priority:** Low

---

### TC-013 — Search or filter narrows visible programs (filtering)

**Preconditions:** Programs **Web Development 2026**, **Data Science Fundamentals**, and **Web Design 2026** exist; search/filter control is on Programs page.

**Steps:**
1. Navigate to Programs page.
2. Enter `Web` in search/filter.
3. Review visible rows.

**Gherkin:**
```gherkin
Scenario: Filter programs by name substring
  Given programs "Web Development 2026", "Data Science Fundamentals", and "Web Design 2026" exist
  When I navigate to the Programs page
  And I filter the list by "Web"
  Then I see "Web Development 2026" and "Web Design 2026" in the list
  And I do not see "Data Science Fundamentals" in the filtered results
```

**Expected result:** Filter matches name (and description if designed); clearing filter restores full list.

**Priority:** Medium

---

### TC-014 — Filter with no matches shows appropriate empty results state

**Preconditions:** Programs exist; user applies filter with no matches, e.g. `ZZZ-No-Match`.

**Steps:**
1. Navigate to Programs page.
2. Apply filter `ZZZ-No-Match`.

**Gherkin:**
```gherkin
Scenario: No results for filter is not the same as no programs in system
  Given programs exist in the system
  When I navigate to the Programs page
  And I filter the list by "ZZZ-No-Match"
  Then I see a no results message for the current filter
  And I do not see the global empty state prompt to create the first program
```

**Expected result:** Distinct “no search results” vs “no programs at all”; user can clear filter.

**Priority:** Medium

---

### TC-015 — Sort order is consistent (if sort control exists)

**Preconditions:** Multiple programs with distinct names exist.

**Steps:**
1. Open Programs page.
2. Sort by name A–Z if available.
3. Verify order; toggle Z–A if available.

**Gherkin:**
```gherkin
Scenario: Program list sort by name
  Given programs "Alpha Program", "Beta Program", and "Gamma Program" exist
  When I navigate to the Programs page
  And I sort the list by name ascending
  Then programs appear in order "Alpha Program", "Beta Program", "Gamma Program"
```

**Expected result:** Sort applies to full dataset or current page per design; descriptions stay paired with correct names.

**Priority:** Low

---

### TC-016 — List updates after edit and delete

**Preconditions:** **Web Development 2026** exists on Programs page.

**Steps:**
1. Edit name to **Web Development 2026 - Updated**; save.
2. Confirm list shows new name and unchanged description unless edited.
3. Delete program; confirm removal from list.

**Gherkin:**
```gherkin
Scenario: List reflects edit and delete operations
  Given a program "Web Development 2026" exists
  When I navigate to the Programs page
  And I rename the program to "Web Development 2026 - Updated"
  Then the list shows "Web Development 2026 - Updated" with the correct description
  When I delete "Web Development 2026 - Updated"
  Then the program is removed from the list
```

**Expected result:** List stays in sync with CRUD without stale entries.

**Priority:** High

---

### TC-017 — HTML in description is not executed in list

**Preconditions:** Program exists with description `<b>Bold</b> <script>alert(1)</script>`.

**Steps:**
1. Navigate to Programs page.
2. View description in list.

**Gherkin:**
```gherkin
Scenario: List safely renders description content
  Given a program "Security Test Program" exists with description "<b>Bold</b> <script>alert(1)</script>"
  When I navigate to the Programs page
  Then I see "Security Test Program" in the list
  And no script runs in the browser
  And the description is shown as plain or sanitized text
```

**Expected result:** XSS-safe rendering in list view.

**Priority:** Low

---

### TC-018 — Responsive layout on narrow viewport

**Preconditions:** At least two programs exist; mobile or narrow browser width.

**Steps:**
1. Open Programs page at narrow width.
2. Verify name and description remain accessible.

**Gherkin:**
```gherkin
Scenario: Program list readable on small screens
  Given programs exist in the system
  When I navigate to the Programs page on a narrow viewport
  Then I see each program's name and description without horizontal clipping of critical text
```

**Expected result:** Responsive cards/table; horizontal scroll or stack layout acceptable if content remains readable.

**Priority:** Low

---

## Ambiguities and gaps in the acceptance criteria

1. **Filtering:** Feature title mentions filtering; ACs only cover full list and empty state. TC-013 and TC-014 assume search/filter exists—confirm controls, fields searched (name only vs description), and match rules.
2. **List format:** AC does not specify table vs cards, columns beyond name/description, or actions (edit/delete icons) on the same view.
3. **Sort and pagination:** Not in ACs; behavior may vary by implementation (TC-012, TC-015).
4. **Empty description:** AC requires description in list; handling when description is null/empty is unspecified (TC-011).
5. **Empty state copy:** Exact message text and whether CTA is **+ New Program** or inline link not defined.
6. **Roles:** Create prompt on empty state may be admin-only (TC-008); AC does not mention roles.
7. **Loading states:** Skeleton, spinner, and error vs empty not distinguished (TC-007).
8. **Ordering default:** Default sort order (created date, alphabetical) not specified.
9. **Multi-tenant:** “Programs exist in the system” scope (global vs organization) not clarified.
10. **Accessibility:** List semantics (table headers, row labels for screen readers) not in ACs.
