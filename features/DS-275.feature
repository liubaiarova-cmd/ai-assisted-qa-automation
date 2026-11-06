# DS-275: Liubov - Delete program with confirmation
# Jira: https://legionqaschool.atlassian.net/browse/DS-275
# Story: As an admin user, I want to delete a program I no longer need, with a confirmation step to prevent accidental deletion.

Feature: DS-275 Delete program with confirmation

  # Happy paths

  Scenario: Delete program with confirmation
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog "Delete program \"Test Program\"? All its semesters and courses will be removed. This cannot be undone."
    When I confirm deletion
    Then "Test Program" is removed from the program list

  # Negative

  Scenario: Cancel program deletion
    Given I click the delete icon for "Test Program"
    When I see the confirmation dialog
    And I cancel the confirmation
    Then "Test Program" still exists in the list

  # Edge cases

  @programs-list-empty
  Scenario: Empty program list shows the empty state
    When the programs list returns 200 with data as an empty array
    Then I see "No programs yet. Create your first program to get started."

  @programs-list-malformed
  Scenario: A non-JSON programs list renders nothing
    When the programs list returns 200 with a non-JSON body
    Then the app renders nothing
    And the browser stays on /programs

  @programs-list-malformed
  Scenario: A programs list whose data is not an array renders nothing
    When the programs list returns 200 with data as an object
    Then the app renders nothing
    And the browser stays on /programs

  @programs-list-401
  Scenario: Programs list 401 shows the empty state
    When the programs list returns 401
    Then I see "No programs yet. Create your first program to get started."

  @programs-list-403
  Scenario: Programs list 403 shows the empty state
    When the programs list returns 403
    Then I see "No programs yet. Create your first program to get started."

  @programs-list-404
  Scenario: Programs list 404 shows the empty state
    When the programs list returns 404
    Then I see "No programs yet. Create your first program to get started."

  @programs-list-501
  Scenario: Programs list 501 shows the empty state
    When the programs list returns 501
    Then I see "No programs yet. Create your first program to get started."

  @programs-list-502
  Scenario: Programs list 502 shows the empty state
    When the programs list returns 502
    Then I see "No programs yet. Create your first program to get started."

  @programs-list-503
  Scenario: Programs list 503 shows the empty state
    When the programs list returns 503
    Then I see "No programs yet. Create your first program to get started."

  @programs-list-300
  Scenario: Programs list 300 shows the empty state
    When the programs list returns 300
    Then I see "No programs yet. Create your first program to get started."

  @programs-list-204
  Scenario: Programs list 204 renders nothing
    When the programs list returns 204
    Then the app renders nothing
    And the browser stays on /programs

  @programs-list-400
  Scenario: Programs list 400 shows the empty state
    When the programs list returns 400
    Then I see "No programs yet. Create your first program to get started."

  @programs-list-500
  Scenario: Programs list 500 shows the empty state
    When the programs list returns 500
    Then I see "No programs yet. Create your first program to get started."

  @programs-list-504
  Scenario: Programs list 504 shows the empty state
    When the programs list returns 504
    Then I see "No programs yet. Create your first program to get started."

  @programs-list-408
  Scenario: Programs list 408 shows the empty state
    When the programs list returns 408
    Then I see "No programs yet. Create your first program to get started."

  # Accessibility

  @programs-a11y-axe
  Scenario: Programs page WCAG scan
    Then the WCAG 2 A and 2 AA scan reports color-contrast (serious): Elements must meet minimum color contrast ratio thresholds
    And the check is informational in CI and must not turn the build red

  @programs-a11y-keyboard
  Scenario: Keyboard opens the new-program dialog
    When I tab to "+ New Program" and press Enter
    Then the New Program dialog is visible

# Ambiguities / gaps
# - Confirmation is the browser confirm dialog, not a page modal. Dismiss is Cancel. Accept is OK.
# - Live copy: Delete program "<name>"? All its semesters and courses will be removed. This cannot be undone.
# - The delete control's accessible name is "Delete <program name>".
# - Failed list statuses 401, 403, 404, 501, 502, 503, 300, 400, 500, 504, and 408 show the empty-state sentence.
# - 200 non-JSON, 200 { "data": {} }, and 204 render nothing.
#
# UI recon
# - Tool: Playwright MCP for /login, then Playwright CLI on 2026-11-06. agent-browser is not installed.
# - Base URL: https://test.didaxis.studio. Paths: /login, /programs.
# - Locators: getByRole('row').filter({ hasText: name }).getByRole('button', { name: 'Delete <name>', exact: true })
# - Axe: color-contrast (serious): Elements must meet minimum color contrast ratio thresholds
