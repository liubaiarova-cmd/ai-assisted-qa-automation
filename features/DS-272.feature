# DS-272: Create new academic program
# Jira: https://legionqaschool.atlassian.net/browse/DS-272
# Story: As an admin user, I want to create a new academic program so that I can begin designing its curriculum structure.

Feature: DS-272 Create new academic program

  # Happy paths

  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the program creation form with fields: Program Name, Description

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
    Then the Create button is disabled
    And the form is not submitted

  Scenario: Closing the form does not create a program
    Given I am on the program creation form
    And I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    When I close the program creation modal without clicking Create
    Then the modal closes
    And the program list does not show "Web Development 2026"

  # Edge cases

  Scenario: Whitespace-only Program Name is treated as empty
    Given I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    And the form is not submitted

  Scenario: Special characters in Program Name are accepted
    Given I am on the program creation form
    When I fill in Program Name with "Informatique & IA - Niveau 2"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2"

  Scenario: Program Name at 100 characters
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026 XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes or the length rule shown by the product applies
    And the outcome is recorded without inventing a validation sentence

  Scenario: Empty Description on create
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I leave Description empty
    And I click Create
    Then either the program is created and listed as "Web Development 2026" or Create stays disabled if Description is required
    And the branch taken is the one the form actually allows

  # Programs network edge cases — save
  # Fulfill only the save call under test. Continue every other method. Do not assert the fulfilled status code.

  @programs-save-503
  Scenario: Save fulfilled with 503
    Given I am on the program creation form
    And the next program save request is fulfilled with status 503
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error for status 503, or the app renders nothing for that error
    And only that save request is mocked

  @programs-save-401
  Scenario: Save fulfilled with 401
    Given I am on the program creation form
    And the next program save request is fulfilled with status 401
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error or redirect for this status, or the app renders nothing, and no error string is quoted because UI recon was skipped
    And only that save request is mocked

  @programs-save-403
  Scenario: Save fulfilled with 403
    Given I am on the program creation form
    And the next program save request is fulfilled with status 403
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error or redirect for this status, or the app renders nothing, and no error string is quoted because UI recon was skipped
    And only that save request is mocked

  @programs-save-404
  Scenario: Save fulfilled with 404
    Given I am on the program creation form
    And the next program save request is fulfilled with status 404
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error or redirect for this status, or the app renders nothing, and no error string is quoted because UI recon was skipped
    And only that save request is mocked

  @programs-save-501
  Scenario: Save fulfilled with 501
    Given I am on the program creation form
    And the next program save request is fulfilled with status 501
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error or redirect for this status, or the app renders nothing, and no error string is quoted because UI recon was skipped
    And only that save request is mocked

  @programs-save-502
  Scenario: Save fulfilled with 502
    Given I am on the program creation form
    And the next program save request is fulfilled with status 502
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error or redirect for this status, or the app renders nothing, and no error string is quoted because UI recon was skipped
    And only that save request is mocked

  @programs-save-400
  Scenario: Save fulfilled with 400
    Given I am on the program creation form
    And the next program save request is fulfilled with status 400
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error or redirect for this status, or the app renders nothing, and no error string is quoted because UI recon was skipped
    And only that save request is mocked

  @programs-save-409
  Scenario: Save fulfilled with 409
    Given I am on the program creation form
    And the next program save request is fulfilled with status 409
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error or redirect for this status, or the app renders nothing, and no error string is quoted because UI recon was skipped
    And only that save request is mocked

  @programs-save-422
  Scenario: Save fulfilled with 422
    Given I am on the program creation form
    And the next program save request is fulfilled with status 422
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error or redirect for this status, or the app renders nothing, and no error string is quoted because UI recon was skipped
    And only that save request is mocked

  @programs-save-429
  Scenario: Save fulfilled with 429
    Given I am on the program creation form
    And the next program save request is fulfilled with status 429
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error or redirect for this status, or the app renders nothing, and no error string is quoted because UI recon was skipped
    And only that save request is mocked

  @programs-save-500
  Scenario: Save fulfilled with 500
    Given I am on the program creation form
    And the next program save request is fulfilled with status 500
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error or redirect for this status, or the app renders nothing, and no error string is quoted because UI recon was skipped
    And only that save request is mocked

  @programs-save-504
  Scenario: Save fulfilled with 504
    Given I am on the program creation form
    And the next program save request is fulfilled with status 504
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error or redirect for this status, or the app renders nothing, and no error string is quoted because UI recon was skipped
    And only that save request is mocked

  @programs-save-408
  Scenario: Save fulfilled with 408
    Given I am on the program creation form
    And the next program save request is fulfilled with status 408
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the page shows the live save error or redirect for this status, or the app renders nothing, and no error string is quoted because UI recon was skipped
    And only that save request is mocked

  @programs-save-300
  Scenario: Save fulfilled with 300
    Given I am on the program creation form
    And the next program save request is fulfilled with status 300
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the app does not crash, and the rendered copy is unquoted because UI recon was skipped
    And only that save request is mocked

  # Programs network edge cases — list
  # Fulfill only GET /api/programs. Continue every other method. A failed list is not asserted as the empty state.

  @programs-list-empty
  Scenario: Programs list fulfilled with 200 and an empty data array
    Given the programs list request is fulfilled with status 200 and body {"data":[]}
    When I navigate to the Programs page
    Then I see "No programs yet. Create your first program to get started."
    And I see the prompt to create the first program
    And only the list request is mocked

  @programs-list-malformed
  Scenario: Programs list fulfilled with 200 and a non-JSON body
    Given the programs list request is fulfilled with status 200 and a non-JSON body
    When I navigate to the Programs page
    Then the app does not crash
    And no message string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-malformed
  Scenario: Programs list fulfilled with 200 and data that is not an array
    Given the programs list request is fulfilled with status 200 and body {"data":{}}
    When I navigate to the Programs page
    Then the app does not crash
    And no message string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-401
  Scenario: Programs list fulfilled with 401
    Given the programs list request is fulfilled with status 401
    When I navigate to the Programs page
    Then the programs page stays loaded without a crash, or it redirects
    And the empty-state message is not asserted, because UI recon did not show this failed list
    And no error string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-403
  Scenario: Programs list fulfilled with 403
    Given the programs list request is fulfilled with status 403
    When I navigate to the Programs page
    Then the programs page stays loaded without a crash, or it redirects
    And the empty-state message is not asserted, because UI recon did not show this failed list
    And no error string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-404
  Scenario: Programs list fulfilled with 404
    Given the programs list request is fulfilled with status 404
    When I navigate to the Programs page
    Then the programs page stays loaded without a crash, or it redirects
    And the empty-state message is not asserted, because UI recon did not show this failed list
    And no error string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-501
  Scenario: Programs list fulfilled with 501
    Given the programs list request is fulfilled with status 501
    When I navigate to the Programs page
    Then the programs page stays loaded without a crash, or it redirects
    And the empty-state message is not asserted, because UI recon did not show this failed list
    And no error string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-502
  Scenario: Programs list fulfilled with 502
    Given the programs list request is fulfilled with status 502
    When I navigate to the Programs page
    Then the programs page stays loaded without a crash, or it redirects
    And the empty-state message is not asserted, because UI recon did not show this failed list
    And no error string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-503
  Scenario: Programs list fulfilled with 503
    Given the programs list request is fulfilled with status 503
    When I navigate to the Programs page
    Then the programs page stays loaded without a crash, or it redirects
    And the empty-state message is not asserted, because UI recon did not show this failed list
    And no error string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-300
  Scenario: Programs list fulfilled with 300
    Given the programs list request is fulfilled with status 300
    When I navigate to the Programs page
    Then the programs page stays loaded without a crash, or it redirects
    And the empty-state message is not asserted, because UI recon did not show this failed list
    And no error string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-204
  Scenario: Programs list fulfilled with 204
    Given the programs list request is fulfilled with status 204
    When I navigate to the Programs page
    Then the programs page stays loaded without a crash, or it redirects
    And the empty-state message is not asserted, because UI recon did not show this failed list
    And no error string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-400
  Scenario: Programs list fulfilled with 400
    Given the programs list request is fulfilled with status 400
    When I navigate to the Programs page
    Then the programs page stays loaded without a crash, or it redirects
    And the empty-state message is not asserted, because UI recon did not show this failed list
    And no error string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-500
  Scenario: Programs list fulfilled with 500
    Given the programs list request is fulfilled with status 500
    When I navigate to the Programs page
    Then the programs page stays loaded without a crash, or it redirects
    And the empty-state message is not asserted, because UI recon did not show this failed list
    And no error string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-504
  Scenario: Programs list fulfilled with 504
    Given the programs list request is fulfilled with status 504
    When I navigate to the Programs page
    Then the programs page stays loaded without a crash, or it redirects
    And the empty-state message is not asserted, because UI recon did not show this failed list
    And no error string is quoted because UI recon was skipped
    And only the list request is mocked

  @programs-list-408
  Scenario: Programs list fulfilled with 408
    Given the programs list request is fulfilled with status 408
    When I navigate to the Programs page
    Then the programs page stays loaded without a crash, or it redirects
    And the empty-state message is not asserted, because UI recon did not show this failed list
    And no error string is quoted because UI recon was skipped
    And only the list request is mocked

  # Accessibility
  # Informational in CI. These checks must not turn the build red.
  # Axe uses withTags wcag2a and wcag2aa inside runA11yCheck. No include or exclude unless a third-party widget is noisy.
  # Keyboard uses ProgramsPage.newProgramButton and NewProgramModal.dialog. No inline locators.

  @programs-a11y-axe
  Scenario: Programs page axe scan reports WCAG 2 A and 2 AA violations
    Given I am logged in as admin
    When I navigate to the Programs page
    And an axe scan runs with tags wcag2a and wcag2aa
    Then each violation is reported with its id, impact, and help
    And the list is whatever the scan returns, not a claim that there are none
    And the check does not fail the CI job

  @programs-a11y-keyboard
  Scenario: Keyboard opens the New Program dialog
    Given I am on the Programs page
    When I tab until the "+ New Program" button is focused
    And I press Enter
    Then the New Program dialog is visible

# Ambiguities / gaps
# - AC does not say whether Description is required, whether names must be unique, or the max length. The 100-character scenario does not assume a limit beyond the related historical note that the input has no maxlength.
# - AC says click "+ New Program" and fields Program Name and Description. The page object uses those accessible names. This run did not confirm them live.
# - Success toast text is not in the AC. Do not assert a toast string.
# - Non-admin access is not in the AC.
#
# UI recon
# - Skipped recon. DIDAXIS_EMAIL and DIDAXIS_PASSWORD are unset, and /workspace/.env is absent. DIDAXIS_URL is also unset.
# - Date: 2026-11-05
# - Base URL not opened this run. Fallback documented by the skill: https://test.didaxis.studio
# - Paths not walked: /login, /programs
# - Tool: none. Playwright MCP (user-Playwright) is not in the tool catalog. agent-browser and Playwright CLI were not used because login env is missing.
# - Locator hints below come from pages/ProgramsPage.ts, pages/NewProgramModal.ts, pages/LoginPage.ts, and tests/support/didaxis-programs.ts. They were not re-checked on the live UI this run.
#   - getByLabel('Email'), getByLabel('Password'), getByRole('button', { name: 'Sign In' })
#   - getByRole('button', { name: '+ New Program' })
#   - dialog getByRole('heading', { name: 'New Program' }) and getByRole('heading', { name: 'Edit Program' })
#   - dialog getByLabel('Program Name'), dialog getByLabel('Description')
#   - dialog getByRole('button', { name: 'Create' }), getByRole('button', { name: 'Cancel' }), getByRole('button', { name: 'Save' })
#   - getByRole('row').filter({ has: getByText(name, { exact: true }) })
#   - row getByRole('button', { name: 'Edit <name>', exact: true }) and getByRole('button', { name: 'Delete <name>', exact: true })
#   - empty prompt getByRole('button', { name: 'Create Program' })
#   - empty copy constant emptyProgramsMessage: "No programs yet. Create your first program to get started."
# - Historical recon in features/DS-3.feature (2026-10-28, Playwright MCP) is not a substitute for this run. It recorded Create disabled for whitespace-only names, no maxlength, Description optional, and an exact duplicate POST returning 201 with a second row and no alert.
# - Network scenarios must not invent error or empty-state copy. The empty-list scenario quotes emptyProgramsMessage only as the repo constant. Every other network Then says the string was not read. If the page renders nothing, assert that the programs shell stayed up and do not add a sentence.
# - Accessibility scan was not run. Do not record the violation list as "none".
# - Example names in the ticket collide across workers. Specs should suffix them with Date.now() and track only real POST 201 ids.

