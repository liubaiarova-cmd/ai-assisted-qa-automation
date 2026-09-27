import { expect, test, type Locator, type Page } from '@playwright/test';

const appUrl = 'https://demo.playwright.dev/todomvc/#/';

function newTodoInput(page: Page): Locator {
  return page.getByPlaceholder('What needs to be done?');
}

function todoItems(page: Page): Locator {
  return page.getByRole('listitem').filter({
    has: page.getByRole('checkbox', { name: 'Toggle Todo' }),
  });
}

function todoItem(page: Page, title: string): Locator {
  return todoItems(page).filter({
    has: page.getByText(title, { exact: true }),
  });
}

function itemsLeft(page: Page, count: number): Locator {
  const noun = count === 1 ? 'item' : 'items';
  return page.getByText(`${count} ${noun} left`, { exact: true });
}

async function addTodo(page: Page, title: string): Promise<void> {
  const input = newTodoInput(page);
  await input.click();
  await input.fill(title);
  await input.press('Enter');
}

async function deleteTodo(item: Locator): Promise<void> {
  await item.hover();
  await item.getByRole('button', { name: 'Delete' }).click();
}

async function expectEmptyList(page: Page): Promise<void> {
  await expect(todoItems(page)).toHaveCount(0);
  await expect(page.getByText(/\d+ items? left/)).toBeHidden();
  await expect(page.getByRole('link', { name: 'All', exact: true })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Active', exact: true })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Completed', exact: true })).toBeHidden();
  await expect(page.getByRole('checkbox', { name: 'Mark all as complete' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Clear completed' })).toBeHidden();
  await expect(newTodoInput(page)).toBeVisible();
}

async function expectStrikeThrough(item: Locator, title: string, completed: boolean): Promise<void> {
  const checkbox = item.getByRole('checkbox', { name: 'Toggle Todo' });
  const label = item.getByText(title, { exact: true });
  if (completed) {
    await expect(checkbox).toBeChecked();
    await expect(label).toHaveCSS('text-decoration-line', 'line-through');
  } else {
    await expect(checkbox).not.toBeChecked();
    await expect(label).toHaveCSS('text-decoration-line', 'none');
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto(appUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(newTodoInput(page)).toBeVisible();
});

test.describe('Positive flows', () => {
  test('TC-001 new todo appears in the list after Enter', async ({ page }) => {
    const input = newTodoInput(page);
    await input.click();
    await input.fill('Buy groceries');
    await input.press('Enter');

    const item = todoItem(page, 'Buy groceries');
    await expect(item).toBeVisible();
    await expectStrikeThrough(item, 'Buy groceries', false);
    await expect(input).toHaveValue('');
    await expect(itemsLeft(page, 1)).toBeVisible();
    await expect(page.getByRole('link', { name: 'All', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Active', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Completed', exact: true })).toBeVisible();
  });

  test('TC-002 completed item is marked done and counter decreases', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    await expect(itemsLeft(page, 2)).toBeVisible();

    await todoItem(page, 'Buy groceries').getByRole('checkbox', { name: 'Toggle Todo' }).click();

    await expectStrikeThrough(todoItem(page, 'Buy groceries'), 'Buy groceries', true);
    await expectStrikeThrough(todoItem(page, 'Walk the dog'), 'Walk the dog', false);
    await expect(itemsLeft(page, 1)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeVisible();
  });

  test('TC-003 deleted item is removed from the list', async ({ page }) => {
    let dialogShown = false;
    page.on('dialog', async (dialog) => {
      dialogShown = true;
      await dialog.dismiss();
    });

    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');

    await deleteTodo(todoItem(page, 'Buy groceries'));

    await expect(todoItem(page, 'Buy groceries')).toHaveCount(0);
    await expect(todoItem(page, 'Walk the dog')).toBeVisible();
    await expect(itemsLeft(page, 1)).toBeVisible();
    expect(dialogShown).toBe(false);
  });

  test('TC-004 multiple todos can be added in sequence', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    await addTodo(page, 'Pay rent');

    await expect(todoItems(page)).toHaveText(['Buy groceries', 'Walk the dog', 'Pay rent']);
    await expect(itemsLeft(page, 3)).toBeVisible();
  });

  test('TC-005 completing then uncompleting restores the active state', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await expect(itemsLeft(page, 1)).toBeVisible();

    const item = todoItem(page, 'Buy groceries');
    await item.getByRole('checkbox', { name: 'Toggle Todo' }).click();

    await expectStrikeThrough(item, 'Buy groceries', true);
    await expect(itemsLeft(page, 0)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeVisible();

    await item.getByRole('checkbox', { name: 'Toggle Todo' }).click();

    await expectStrikeThrough(item, 'Buy groceries', false);
    await expect(itemsLeft(page, 1)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeHidden();
  });
});

test.describe('Negative flows', () => {
  test('TC-006 empty input does not create a todo', async ({ page }) => {
    const input = newTodoInput(page);
    await input.click();
    await input.press('Enter');

    await expectEmptyList(page);
  });

  test('TC-007 whitespace-only input does not create a todo', async ({ page }) => {
    const input = newTodoInput(page);
    await input.click();
    await input.fill('   ');
    await input.press('Enter');

    await expectEmptyList(page);
  });

  test('TC-008 completed items are not shown on the Active filter', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    await todoItem(page, 'Buy groceries').getByRole('checkbox', { name: 'Toggle Todo' }).click();

    await page.getByRole('link', { name: 'Active', exact: true }).click();

    await expect(page).toHaveURL(/#\/active$/);
    await expect(todoItem(page, 'Walk the dog')).toBeVisible();
    await expect(todoItem(page, 'Buy groceries')).toHaveCount(0);
    await expect(itemsLeft(page, 1)).toBeVisible();
  });

  test('TC-009 active items are not shown on the Completed filter', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    await todoItem(page, 'Buy groceries').getByRole('checkbox', { name: 'Toggle Todo' }).click();

    await page.getByRole('link', { name: 'Completed', exact: true }).click();

    await expect(page).toHaveURL(/#\/completed$/);
    await expect(todoItem(page, 'Buy groceries')).toBeVisible();
    await expect(todoItem(page, 'Walk the dog')).toHaveCount(0);
  });

  test('TC-010 delete does not remove other items', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    await addTodo(page, 'Pay rent');

    await deleteTodo(todoItem(page, 'Walk the dog'));

    await expect(todoItem(page, 'Walk the dog')).toHaveCount(0);
    await expect(todoItems(page)).toHaveText(['Buy groceries', 'Pay rent']);
    await expect(itemsLeft(page, 2)).toBeVisible();
  });

  test('TC-011 completing one item does not complete siblings', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');

    await todoItem(page, 'Buy groceries').getByRole('checkbox', { name: 'Toggle Todo' }).click();

    await expectStrikeThrough(todoItem(page, 'Buy groceries'), 'Buy groceries', true);
    await expectStrikeThrough(todoItem(page, 'Walk the dog'), 'Walk the dog', false);
  });

  test('TC-012 typing without Enter does not add the todo', async ({ page }) => {
    const input = newTodoInput(page);
    await input.click();
    await input.fill('Buy groceries');
    await input.press('Tab');

    await expect(todoItem(page, 'Buy groceries')).toHaveCount(0);
    await expect(input).toHaveValue('Buy groceries');
    await expectEmptyList(page);
  });
});

test.describe('Edge cases', () => {
  test('TC-013 leading and trailing spaces are trimmed on add', async ({ page }) => {
    await addTodo(page, '  Buy groceries  ');

    await expect(todoItem(page, 'Buy groceries')).toBeVisible();
    await expect(todoItems(page)).toHaveText(['Buy groceries']);
    await expect(itemsLeft(page, 1)).toBeVisible();
  });

  test('TC-014 duplicate todo titles are allowed', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Buy groceries');

    const duplicates = todoItem(page, 'Buy groceries');
    await expect(duplicates).toHaveCount(2);
    await expect(itemsLeft(page, 2)).toBeVisible();

    await duplicates.nth(0).getByRole('checkbox', { name: 'Toggle Todo' }).click();
    await expect(duplicates.nth(0).getByRole('checkbox', { name: 'Toggle Todo' })).toBeChecked();
    await expect(duplicates.nth(1).getByRole('checkbox', { name: 'Toggle Todo' })).not.toBeChecked();

    await deleteTodo(duplicates.nth(0));
    await expect(duplicates).toHaveCount(1);
    await expect(duplicates.getByRole('checkbox', { name: 'Toggle Todo' })).not.toBeChecked();
    await expect(itemsLeft(page, 1)).toBeVisible();
  });

  test('TC-015 special characters and unicode are stored as entered', async ({ page }) => {
    const title = 'Café & milk <3 — 牛乳 #1';
    await addTodo(page, title);

    await expect(todoItem(page, title)).toBeVisible();
    await expect(todoItems(page)).toHaveText([title]);
  });

  test('TC-016 very long todo text is accepted and remains readable', async ({ page }) => {
    const title = 'A'.repeat(500);
    await expect(newTodoInput(page)).not.toHaveAttribute('maxlength');

    await addTodo(page, title);

    const item = todoItem(page, title);
    await expect(item).toBeVisible();
    await item.getByRole('checkbox', { name: 'Toggle Todo' }).click();
    await expect(item.getByRole('checkbox', { name: 'Toggle Todo' })).toBeChecked();
    await deleteTodo(item);
    await expect(item).toHaveCount(0);
  });

  test('TC-017 single-character todo is accepted', async ({ page }) => {
    await addTodo(page, 'A');

    await expect(todoItem(page, 'A')).toBeVisible();
    await expect(itemsLeft(page, 1)).toBeVisible();
  });

  test('TC-018 mark all as complete toggles every item', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');

    await page.getByText('Mark all as complete', { exact: true }).click();

    await expectStrikeThrough(todoItem(page, 'Buy groceries'), 'Buy groceries', true);
    await expectStrikeThrough(todoItem(page, 'Walk the dog'), 'Walk the dog', true);
    await expect(itemsLeft(page, 0)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeVisible();

    await page.getByText('Mark all as complete', { exact: true }).click();

    await expectStrikeThrough(todoItem(page, 'Buy groceries'), 'Buy groceries', false);
    await expectStrikeThrough(todoItem(page, 'Walk the dog'), 'Walk the dog', false);
    await expect(itemsLeft(page, 2)).toBeVisible();
  });

  test('TC-019 clear completed removes only completed todos', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    await todoItem(page, 'Buy groceries').getByRole('checkbox', { name: 'Toggle Todo' }).click();
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeVisible();

    await page.getByRole('button', { name: 'Clear completed' }).click();

    await expect(todoItem(page, 'Buy groceries')).toHaveCount(0);
    await expect(todoItem(page, 'Walk the dog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeHidden();
    await expect(itemsLeft(page, 1)).toBeVisible();
  });

  test('TC-020 deleting the last item returns the empty list state', async ({ page }) => {
    await addTodo(page, 'Buy groceries');

    await deleteTodo(todoItem(page, 'Buy groceries'));

    await expectEmptyList(page);
  });

  test('TC-021 script-like text is stored as plain text', async ({ page }) => {
    let dialogShown = false;
    page.on('dialog', async (dialog) => {
      dialogShown = true;
      await dialog.dismiss();
    });

    const title = "<script>alert('xss')</script>";
    await addTodo(page, title);

    const item = todoItem(page, title);
    await expect(item).toBeVisible();
    await expect(todoItems(page)).toHaveText([title]);
    expect(dialogShown).toBe(false);

    await item.getByRole('checkbox', { name: 'Toggle Todo' }).click();
    await expect(item.getByRole('checkbox', { name: 'Toggle Todo' })).toBeChecked();
    await deleteTodo(item);
    await expect(item).toHaveCount(0);
    expect(dialogShown).toBe(false);
  });

  test('TC-022 todos persist after page reload', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    await todoItem(page, 'Walk the dog').getByRole('checkbox', { name: 'Toggle Todo' }).click();

    await page.reload();

    await expectStrikeThrough(todoItem(page, 'Buy groceries'), 'Buy groceries', false);
    await expectStrikeThrough(todoItem(page, 'Walk the dog'), 'Walk the dog', true);
    await expect(itemsLeft(page, 1)).toBeVisible();
    await expect(page.getByRole('link', { name: 'All', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Active', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Completed', exact: true })).toBeVisible();
  });

  test('TC-023 double-click edit updates the item text', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await expect(itemsLeft(page, 1)).toBeVisible();

    await todoItem(page, 'Buy groceries').getByText('Buy groceries', { exact: true }).dblclick();
    const editor = page.getByRole('textbox', { name: 'Edit' });
    await editor.fill('Buy organic groceries');
    await editor.press('Enter');

    await expect(todoItem(page, 'Buy organic groceries')).toBeVisible();
    await expect(todoItem(page, 'Buy groceries')).toHaveCount(0);
    await expectStrikeThrough(todoItem(page, 'Buy organic groceries'), 'Buy organic groceries', false);
    await expect(itemsLeft(page, 1)).toBeVisible();
  });

  test('TC-024 emptying an item in edit mode removes it', async ({ page }) => {
    await addTodo(page, 'Buy groceries');

    await todoItem(page, 'Buy groceries').getByText('Buy groceries', { exact: true }).dblclick();
    const editor = page.getByRole('textbox', { name: 'Edit' });
    await editor.fill('');
    await editor.press('Enter');

    await expectEmptyList(page);
  });

  test('TC-025 escape cancels an in-progress edit', async ({ page }) => {
    await addTodo(page, 'Buy groceries');

    await todoItem(page, 'Buy groceries').getByText('Buy groceries', { exact: true }).dblclick();
    const editor = page.getByRole('textbox', { name: 'Edit' });
    await editor.fill('Do not save this');
    await editor.press('Escape');

    await expect(page.getByRole('textbox', { name: 'Edit' })).toBeHidden();
    await expect(todoItem(page, 'Buy groceries')).toBeVisible();
    await expect(todoItem(page, 'Do not save this')).toHaveCount(0);
    await expect(todoItems(page)).toHaveCount(1);
  });
});
