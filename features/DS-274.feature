# DS-274: Liubov - Program name validation and duplicate prevention
# Jira: https://legionqaschool.atlassian.net/browse/DS-274
# Story: As an admin user, I want the system to prevent invalid or duplicate program names so that data integrity is maintained.

Feature: DS-274 Program name validation and duplicate prevention

  # Happy paths

  Scenario: Accept program name with special characters
    Given I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill in Description with "Programme bilingue"
    And I click Create
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2"

  # Negative

  Scenario: Reject program name with only whitespace
    Given I am on the program creation form
    When I enter "   " as the program name
    Then the Create button is disabled
    And the form is not submitted

  Scenario: Reject duplicate program name
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the same name
    And I fill in Description with "Another description"
    And I click Create
    Then I see an error indicating the name already exists
    And the program list contains only one "Web Development 2026"

  # Edge cases

  @programs-save-503
  Scenario: Create shows no error copy when save returns 503
    When the create request is fulfilled with 503
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-401
  Scenario: Create shows no error copy when save returns 401
    When the create request is fulfilled with 401
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-403
  Scenario: Create shows no error copy when save returns 403
    When the create request is fulfilled with 403
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-404
  Scenario: Create shows no error copy when save returns 404
    When the create request is fulfilled with 404
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-501
  Scenario: Create shows no error copy when save returns 501
    When the create request is fulfilled with 501
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-502
  Scenario: Create shows no error copy when save returns 502
    When the create request is fulfilled with 502
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-400
  Scenario: Create shows no error copy when save returns 400
    When the create request is fulfilled with 400
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-409
  Scenario: Create shows no error copy when save returns 409
    When the create request is fulfilled with 409
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-422
  Scenario: Create shows no error copy when save returns 422
    When the create request is fulfilled with 422
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-429
  Scenario: Create shows no error copy when save returns 429
    When the create request is fulfilled with 429
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-500
  Scenario: Create shows no error copy when save returns 500
    When the create request is fulfilled with 500
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-504
  Scenario: Create shows no error copy when save returns 504
    When the create request is fulfilled with 504
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-408
  Scenario: Create shows no error copy when save returns 408
    When the create request is fulfilled with 408
    Then the app renders nothing for the error
    And the New Program dialog stays open on /programs

  @programs-save-300
  Scenario: Create does not crash when save returns 300
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
    Then the WCAG 2 A and 2 AA scan reports color-contrast (serious): Elements must meet minimum color contrast ratio thresholds
    And the check is informational in CI and must not turn the build red

  @programs-a11y-keyboard
  Scenario: Keyboard opens the new-program dialog
    When I tab to "+ New Program" and press Enter
    Then the New Program dialog is visible

# Ambiguities / gaps
# - Ticket vs UI: DS-274 says a duplicate name is rejected. On 2026-11-06 a second create of the same name returned 201 with message "Program created" and closed the dialog. No error string was shown. The scenario keeps the acceptance criterion. A human needs to confirm before any bug is filed.
# - Whitespace: the Create button is disabled, so the form cannot be submitted. The ticket also says the name is trimmed and treated as empty.
# - Failed creates render no error copy. Failed lists 401, 403, 404, 501, 502, 503, 300, 400, 500, 504, and 408 show "No programs yet. Create your first program to get started."
# - 200 non-JSON, 200 { "data": {} }, and 204 render nothing.
#
# UI recon
# - Tool: Playwright MCP for /login, then Playwright CLI on 2026-11-06. agent-browser is not installed.
# - Base URL: https://test.didaxis.studio. Paths: /login, /programs.
# - Locators: getByLabel('Program Name'), getByRole('button', { name: 'Create' }), getByText(/already|duplicate|exists|in use/i), getByRole('row').filter({ has: getByText(name, { exact: true }) })
# - Axe: color-contrast (serious): Elements must meet minimum color contrast ratio thresholds
