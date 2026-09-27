# Test Plan: TodoMVC (https://demo.playwright.dev/todomvc/)

Application: **React • TodoMVC** (`#/` route)

Primary controls used in this plan:

- New-item field: **What needs to be done?**
- Per-item complete checkbox: **Toggle Todo**
- Per-item remove control: **Delete**
- Bulk checkbox: **Mark all as complete**
- Filters: **All**, **Active**, **Completed**
- Footer counter: **N item left** / **N items left**
- Bulk cleanup: **Clear completed** (visible only when at least one item is completed)

---

## Positive flows

### TC-001 — New todo appears in the list after Enter

**Preconditions:** Browser is on https://demo.playwright.dev/todomvc/. The list is empty (or no item named `Buy groceries` exists).

**Steps:**
1. Click the **What needs to be done?** field.
2. Type `Buy groceries`.
3. Press **Enter**.

**Expected result:** The list shows `Buy groceries` as an active item. The input is cleared. The footer appears and shows **1 item left**. Filters **All**, **Active**, and **Completed** are visible.

---

### TC-002 — Completed item is marked done and counter decreases

**Preconditions:** The list contains active items `Buy groceries` and `Walk the dog`. Footer shows **2 items left**.

**Steps:**
1. Click the **Toggle Todo** checkbox on `Buy groceries`.
2. Observe the item style and the footer.

**Expected result:** `Buy groceries` is completed (checkbox checked, text shown with strike-through). `Walk the dog` remains active. Footer shows **1 item left**. **Clear completed** becomes visible.

---

### TC-003 — Deleted item is removed from the list

**Preconditions:** The list contains `Buy groceries` and `Walk the dog`.

**Steps:**
1. Hover the `Buy groceries` row so **Delete** is visible.
2. Click **Delete** on `Buy groceries`.

**Expected result:** `Buy groceries` is gone. `Walk the dog` remains. Footer shows **1 item left**. No confirmation dialog is shown.

---

### TC-004 — Multiple todos can be added in sequence

**Preconditions:** The list is empty.

**Steps:**
1. Enter `Buy groceries` in **What needs to be done?** and press **Enter**.
2. Enter `Walk the dog` and press **Enter**.
3. Enter `Pay rent` and press **Enter**.

**Expected result:** The list contains `Buy groceries`, `Walk the dog`, and `Pay rent` in that order. Footer shows **3 items left**.

---

### TC-005 — Completing then uncompleting restores the active state

**Preconditions:** `Buy groceries` is in the list and is active.

**Steps:**
1. Click **Toggle Todo** on `Buy groceries` to complete it.
2. Click **Toggle Todo** on `Buy groceries` again.

**Expected result:** After step 1 the item is completed and the counter decreases. After step 2 the item is active again, strike-through is removed, and the counter returns to the previous active count. **Clear completed** hides if no other completed items remain.

---

## Negative flows

### TC-006 — Empty input does not create a todo

**Preconditions:** The list is empty. Focus is in **What needs to be done?**.

**Steps:**
1. Leave the field empty.
2. Press **Enter**.

**Expected result:** No list item is created. The footer, filters, **Mark all as complete**, and **Clear completed** do not appear.

---

### TC-007 — Whitespace-only input does not create a todo

**Preconditions:** The list is empty.

**Steps:**
1. Type `   ` (spaces only) in **What needs to be done?**.
2. Press **Enter**.

**Expected result:** The text is treated as empty after trim. No todo is added. The list and footer stay hidden.

---

### TC-008 — Completed items are not shown on the Active filter

**Preconditions:** `Buy groceries` is completed and `Walk the dog` is active.

**Steps:**
1. Click the **Active** filter.

**Expected result:** Only `Walk the dog` is listed. `Buy groceries` is not visible on **Active**. The URL hash is `#/active`. Footer still reports **1 item left**.

---

### TC-009 — Active items are not shown on the Completed filter

**Preconditions:** `Buy groceries` is completed and `Walk the dog` is active.

**Steps:**
1. Click the **Completed** filter.

**Expected result:** Only `Buy groceries` is listed. `Walk the dog` is not visible on **Completed**. The URL hash is `#/completed`.

---

### TC-010 — Delete does not remove other items

**Preconditions:** The list contains `Buy groceries`, `Walk the dog`, and `Pay rent`.

**Steps:**
1. Click **Delete** on `Walk the dog` only.

**Expected result:** `Walk the dog` is gone. `Buy groceries` and `Pay rent` remain unchanged. Footer shows **2 items left**.

---

### TC-011 — Completing one item does not complete siblings

**Preconditions:** `Buy groceries` and `Walk the dog` are both active.

**Steps:**
1. Click **Toggle Todo** on `Buy groceries` only.

**Expected result:** Only `Buy groceries` is completed. `Walk the dog` stays unchecked and not struck through.

---

### TC-012 — Typing without Enter does not add the todo

**Preconditions:** The list is empty.

**Steps:**
1. Type `Buy groceries` in **What needs to be done?**.
2. Click outside the field or press **Tab** without pressing **Enter**.

**Expected result:** No list item is created. The typed text remains in the input (or is still not committed as a todo). Footer stays hidden.

---

## Edge cases

### TC-013 — Leading and trailing spaces are trimmed on add

**Preconditions:** The list is empty.

**Steps:**
1. Type `  Buy groceries  ` in **What needs to be done?**.
2. Press **Enter**.

**Expected result:** The list item text is `Buy groceries` (trimmed). Footer shows **1 item left**.

---

### TC-014 — Duplicate todo titles are allowed

**Preconditions:** `Buy groceries` already exists in the list.

**Steps:**
1. Enter `Buy groceries` again in **What needs to be done?**.
2. Press **Enter**.

**Expected result:** Two separate `Buy groceries` items appear. Completing or deleting one does not change the other. Footer counts both (for example **2 items left** if both are active).

---

### TC-015 — Special characters and unicode are stored as entered

**Preconditions:** The list is empty.

**Steps:**
1. Enter `Café & milk <3 — 牛乳 #1` in **What needs to be done?**.
2. Press **Enter**.

**Expected result:** The list shows `Café & milk <3 — 牛乳 #1` exactly. Characters are not escaped as HTML entities in a broken way, and no script or markup is executed.

---

### TC-016 — Very long todo text is accepted and remains readable

**Preconditions:** The list is empty. **What needs to be done?** has no `maxlength` attribute.

**Steps:**
1. Paste a 500-character string (for example `A` repeated 500 times) into **What needs to be done?**.
2. Press **Enter**.

**Expected result:** The item is created. Layout may wrap or overflow, but the todo is stored and can still be completed or deleted.

---

### TC-017 — Single-character todo is accepted

**Preconditions:** The list is empty.

**Steps:**
1. Type `A` in **What needs to be done?**.
2. Press **Enter**.

**Expected result:** The list shows `A`. Footer shows **1 item left**.

---

### TC-018 — Mark all as complete toggles every item

**Preconditions:** The list contains active items `Buy groceries` and `Walk the dog`.

**Steps:**
1. Click **Mark all as complete**.
2. Observe the list and footer.
3. Click **Mark all as complete** again.

**Expected result:** After step 1 both items are completed, footer shows **0 items left**, and **Clear completed** is visible. After step 3 both items are active again and the footer shows **2 items left**.

---

### TC-019 — Clear completed removes only completed todos

**Preconditions:** `Buy groceries` is completed and `Walk the dog` is active. **Clear completed** is visible.

**Steps:**
1. Click **Clear completed**.

**Expected result:** `Buy groceries` is removed. `Walk the dog` remains. **Clear completed** is hidden. Footer shows **1 item left**.

---

### TC-020 — Deleting the last item returns the empty list state

**Preconditions:** The only item is `Buy groceries`.

**Steps:**
1. Click **Delete** on `Buy groceries`.

**Expected result:** The list is empty. Footer, filters, **Mark all as complete**, and **Clear completed** are hidden. **What needs to be done?** remains available.

---

### TC-021 — Script-like text is stored as plain text

**Preconditions:** The list is empty.

**Steps:**
1. Enter `<script>alert('xss')</script>` in **What needs to be done?**.
2. Press **Enter**.
3. View the list.

**Expected result:** The item appears as literal text. No alert runs. Completing and deleting the item still work.

---

### TC-022 — Todos persist after page reload

**Preconditions:** The list contains `Buy groceries` (active) and `Walk the dog` (completed).

**Steps:**
1. Reload the page.
2. Confirm the list and **All** / **Active** / **Completed** filters.

**Expected result:** Both items and their completed/active states are restored. Footer still shows **1 item left**.

---

### TC-023 — Double-click edit updates the item text

**Preconditions:** `Buy groceries` is in the list. Page hint says **Double-click to edit a todo**.

**Steps:**
1. Double-click the `Buy groceries` label.
2. Replace the text with `Buy organic groceries`.
3. Press **Enter**.

**Expected result:** The list shows `Buy organic groceries`. The completed state is unchanged. Footer count is unchanged.

---

### TC-024 — Emptying an item in edit mode removes it

**Preconditions:** `Buy groceries` is in the list.

**Steps:**
1. Double-click `Buy groceries`.
2. Clear all text in the edit field.
3. Press **Enter**.

**Expected result:** `Buy groceries` is deleted (same outcome as **Delete**). If it was the last item, the empty list state is shown.

---

### TC-025 — Escape cancels an in-progress edit

**Preconditions:** `Buy groceries` is in the list.

**Steps:**
1. Double-click `Buy groceries`.
2. Change the text to `Do not save this`.
3. Press **Escape**.

**Expected result:** Edit mode closes. The item text is still `Buy groceries`. No extra item is created.

---

## Ambiguities and gaps in the acceptance criteria

1. **Add trigger:** ACs do not say that a todo is committed only with **Enter**. There is no Add button.
2. **Complete vs uncomplete:** ACs cover completing an item, not toggling it back to active (TC-005).
3. **Delete confirmation:** ACs do not say whether delete is immediate. The app deletes immediately with no dialog.
4. **Delete visibility:** **Delete** is shown on hover; ACs do not mention this.
5. **Filters and Clear completed:** ACs omit **All** / **Active** / **Completed**, **Mark all as complete**, **Clear completed**, and the items-left counter.
6. **Edit:** The UI documents **Double-click to edit a todo**, but ACs do not include rename, cancel (Escape), or delete-by-empty-edit.
7. **Duplicates:** ACs do not say whether identical titles are unique; the app allows duplicates.
8. **Trim / empty / max length:** No rules for whitespace, empty submit, or length limits. The new-item field has no `maxlength`.
9. **Persistence:** ACs do not mention reload or `localStorage`.
10. **Scope:** ACs do not mention keyboard-only use, mobile hover (Delete hard to reach), or multi-tab sync.
