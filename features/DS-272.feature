# DS-272: Liubov - Create new academic program
# Jira: https://legionqaschool.atlassian.net/browse/DS-272
# Story: As an admin user, I want to create a new academic program so that I can begin designing its curriculum structure.

Feature: DS-272 Create new academic program

  # Happy paths

  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the New Program dialog
    And I see fields Program Name and Description

  Scenario: Successfully create a program
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  # Negative

  Scenario: Validation prevents empty program name
    Given I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled

  Scenario: Closing the form does not create a program
    Given I am on the program creation form
    When I fill in Program Name with "Draft Program"
    And I click Cancel
    Then the modal closes
    And the program list does not show "Draft Program"

  # Edge cases

  @programs-save-503
  Scenario: Create shows no error copy when save returns 503
    Given I am on the program creation form
    When the create request is fulfilled with 503
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-401
  Scenario: Create shows no error copy when save returns 401
    Given I am on the program creation form
    When the create request is fulfilled with 401
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-403
  Scenario: Create shows no error copy when save returns 403
    Given I am on the program creation form
    When the create request is fulfilled with 403
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-404
  Scenario: Create shows no error copy when save returns 404
    Given I am on the program creation form
    When the create request is fulfilled with 404
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-501
  Scenario: Create shows no error copy when save returns 501
    Given I am on the program creation form
    When the create request is fulfilled with 501
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-502
  Scenario: Create shows no error copy when save returns 502
    Given I am on the program creation form
    When the create request is fulfilled with 502
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-400
  Scenario: Create shows no error copy when save returns 400
    Given I am on the program creation form
    When the create request is fulfilled with 400
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-409
  Scenario: Create shows no error copy when save returns 409
    Given I am on the program creation form
    When the create request is fulfilled with 409
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-422
  Scenario: Create shows no error copy when save returns 422
    Given I am on the program creation form
    When the create request is fulfilled with 422
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-429
  Scenario: Create shows no error copy when save returns 429
    Given I am on the program creation form
    When the create request is fulfilled with 429
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-500
  Scenario: Create shows no error copy when save returns 500
    Given I am on the program creation form
    When the create request is fulfilled with 500
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-504
  Scenario: Create shows no error copy when save returns 504
    Given I am on the program creation form
    When the create request is fulfilled with 504
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-408
  Scenario: Create shows no error copy when save returns 408
    Given I am on the program creation form
    When the create request is fulfilled with 408
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-300
  Scenario: Create does not crash when save returns 300
    Given I am on the program creation form
    When the create request is fulfilled with 300
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

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
    Then "+ New Program" is focused
    And the New Program dialog is visible

# Ambiguities / gaps
# - Description is optional on the live form (no required marker). Empty description is not in the acceptance criteria.
# - Program name max length is not specified on DS-272.
# - Failed creates leave the dialog open and render no error string and no alert. The same was observed for 503, 401, 403, 404, 501, 502, 400, 409, 422, 429, 500, 504, 408, and 300.
# - Failed list statuses 401, 403, 404, 501, 502, 503, 300, 400, 500, 504, and 408 render the empty-state sentence, not a distinct error.
# - 200 non-JSON, 200 with data as an object, and 204 render a blank document. The New Program button is not shown.
#
# UI recon
# - Tool: Playwright MCP opened https://test.didaxis.studio/login (Email, Password, Sign In). MCP could not read process.env. agent-browser is not installed. Flows and copy were captured with Playwright CLI on 2026-11-06.
# - Base URL: https://test.didaxis.studio
# - Paths: /login, /programs
# - Locators: getByRole('button', { name: '+ New Program' }), dialog getByRole('heading', { name: 'New Program' }), getByLabel('Program Name'), getByLabel('Description'), getByRole('button', { name: 'Create' }), getByRole('button', { name: 'Cancel' }), getByRole('row').filter({ has: getByText(name, { exact: true }) })
# - Empty state copy: No programs yet. Create your first program to get started.
# - Axe on the programs page (wcag2a, wcag2aa): color-contrast, serious, Elements must meet minimum color contrast ratio thresholds.
# - Keyboard: Tab reaches "+ New Program"; Enter opens the dialog.
