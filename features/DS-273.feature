# DS-273: Liubov - Edit existing program details
# Jira: https://legionqaschool.atlassian.net/browse/DS-273
# Story: As an admin user, I want to edit an existing program's details so that I can correct or update program information after creation.

Feature: DS-273 Edit existing program details

  # Happy paths

  Scenario: Open program for editing
    Given I am on the Programs page
    And a program "Web Development 2026" exists with description "Full-stack web development program"
    When I click the edit icon on "Web Development 2026"
    Then I see the Edit Program form
    And Program Name is "Web Development 2026"
    And Description is "Full-stack web development program"

  Scenario: Successfully edit a program name
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"

  Scenario: Edit preserves unchanged fields
    Given I am editing a program whose Name is "Web Development 2026"
    And Description is "Full-stack web development program"
    And Default Session Hours is 4
    And Default Exam Hours is 3
    When I only change the Description to "Updated cohort description for 2026"
    And I click Save
    Then the Name is still "Web Development 2026"
    And Default Session Hours is still 4
    And Default Exam Hours is still 3
    And the program list shows "Web Development 2026"

  # Negative

  Scenario: Cancel edit does not change the program
    Given I am editing "Web Development 2026"
    When I change the Name to "Temporary Draft Name"
    And I click Cancel
    Then the modal closes
    And the program list still shows "Web Development 2026"
    And the program list does not show "Temporary Draft Name"

  # Edge cases

  @programs-save-503
  Scenario: Save shows no error copy when update returns 503
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 503
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs
    And the list still shows the previous description

  @programs-save-401
  Scenario: Save shows no error copy when update returns 401
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 401
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

  @programs-save-403
  Scenario: Save shows no error copy when update returns 403
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 403
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

  @programs-save-404
  Scenario: Save shows no error copy when update returns 404
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 404
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

  @programs-save-501
  Scenario: Save shows no error copy when update returns 501
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 501
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

  @programs-save-502
  Scenario: Save shows no error copy when update returns 502
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 502
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

  @programs-save-400
  Scenario: Save shows no error copy when update returns 400
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 400
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

  @programs-save-409
  Scenario: Save shows no error copy when update returns 409
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 409
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

  @programs-save-422
  Scenario: Save shows no error copy when update returns 422
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 422
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

  @programs-save-429
  Scenario: Save shows no error copy when update returns 429
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 429
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

  @programs-save-500
  Scenario: Save shows no error copy when update returns 500
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 500
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

  @programs-save-504
  Scenario: Save shows no error copy when update returns 504
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 504
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

  @programs-save-408
  Scenario: Save shows no error copy when update returns 408
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 408
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

  @programs-save-300
  Scenario: Save does not crash when update returns 300
    Given I am editing "Web Development 2026"
    When the save request is fulfilled with 300
    Then the app renders nothing for the error
    And the Edit Program dialog stays open on /programs

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
    Given I am on the Programs page
    Then the WCAG 2 A and 2 AA scan reports color-contrast (serious): Elements must meet minimum color contrast ratio thresholds
    And the check is informational in CI and must not turn the build red

  @programs-a11y-keyboard
  Scenario: Keyboard opens the new-program dialog
    Given I am on the Programs page
    When I tab to "+ New Program"
    And I press Enter
    Then the New Program dialog is visible

# Ambiguities / gaps
# - The edit control is an icon button whose accessible name is "Edit <program name>", not a pencil icon without a name.
# - Save returns HTTP 200 on the live API. The list refresh was confirmed by reopening the program.
# - Failed saves leave the Edit Program dialog open and render no error string and no alert.
# - Failed list statuses listed above render "No programs yet. Create your first program to get started."
# - 200 non-JSON, 200 with data as an object, and 204 render a blank document.
#
# UI recon
# - Tool: Playwright MCP opened /login. agent-browser is not installed. Edit flow captured with Playwright CLI on 2026-11-06 against https://test.didaxis.studio.
# - Paths: /login, /programs
# - Locators: getByRole('button', { name: 'Edit <name>', exact: true }) inside getByRole('row').filter({ has: getByText(name, { exact: true }) }).filter({ hasText: description }); dialog getByRole('heading', { name: 'Edit Program' }); getByLabel('Program Name'); getByLabel('Description'); getByLabel('Default Session Hours'); getByLabel('Default Exam Hours'); getByRole('button', { name: 'Save' }); getByRole('button', { name: 'Cancel' })
# - Observed defaults: Default Session Hours 4, Default Exam Hours 3
# - Axe on the programs page: color-contrast (serious): Elements must meet minimum color contrast ratio thresholds
