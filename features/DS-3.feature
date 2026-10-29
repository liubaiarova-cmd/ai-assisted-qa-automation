# DS-3: Program name validation and duplicate prevention
# Jira: https://legionqaschool.atlassian.net/browse/DS-3
# Story: As an admin user, I want the system to prevent invalid or duplicate program names so that data integrity is maintained.

Feature: DS-3 Program name validation and duplicate prevention

  # Happy paths

  @TC-001 @smoke
  Scenario: Special characters in Program Name are accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Informatique & IA - Niveau 2"
    And I fill in Description with "Programme avec caractères spéciaux"
    And I click Create
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2"

  @TC-002
  Scenario: Program Name is the only required field
    Given I am on the program creation form
    When I fill in Program Name with "Informatique & IA - Niveau 2"
    And I leave Description empty
    And I click Create
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2"

  # Negative

  @TC-003 @smoke
  Scenario: Whitespace-only Program Name is treated as empty
    Given I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Valid description"
    Then the Create button is disabled
    And the form is not submitted
    And the program list does not show a program named "   "

  @TC-004
  Scenario: Empty Program Name keeps Create disabled
    Given I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Valid description"
    Then the Create button is disabled
    And the form is not submitted

  @TC-005 @smoke
  Scenario: Duplicate program name is rejected
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Another description"
    And I click Create
    Then I see an error indicating the name already exists
    And the New Program modal stays open
    And the program list contains only one "Web Development 2026"

  # Edge cases

  @TC-006
  Scenario: Leading and trailing spaces do not create a second program
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in Program Name with "  Web Development 2026  "
    And I fill in Description with "Padded duplicate"
    And I click Create
    Then I see an error indicating the name already exists
    And the program list contains only one "Web Development 2026"

  @TC-007
  Scenario: Case-variant duplicate name is rejected
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in Program Name with "web development 2026"
    And I fill in Description with "Case variant"
    And I click Create
    Then I see an error indicating the name already exists
    And the program list contains only one "Web Development 2026"

  @TC-008
  Scenario: Single-character Program Name is accepted
    Given I am on the program creation form
    When I fill in Program Name with "A"
    And I fill in Description with "Single character name"
    And I click Create
    Then the modal closes
    And the program list shows "A"

  @TC-009
  Scenario: Program Name at 100 characters is accepted
    Given I am on the program creation form
    When I fill in Program Name with "NameLimit100_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    And I fill in Description with "Boundary test for name length"
    And I click Create
    Then the modal closes
    And the program list shows "NameLimit100_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

  @TC-010
  Scenario: Program Name over 100 characters is rejected
    Given I am on the program creation form
    When I fill in Program Name with "NameLimit100_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    And I fill in Description with "Over limit test"
    Then the Create button is disabled or I see a length validation message
    And no new program is created

  @TC-011
  Scenario: Internal spaces are preserved and are not a duplicate of a collapsed name
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in Program Name with "Web  Development  2026"
    And I fill in Description with "Internal spaces"
    And I click Create
    Then the modal closes
    And the program list shows "Web  Development  2026"
    And the program list still shows "Web Development 2026"

  @TC-012
  Scenario: HTML in Program Name is stored as text and not executed
    Given I am on the program creation form
    When I fill in Program Name with "IA <img src=x onerror=alert(1)>"
    And I fill in Description with "Markup in the name"
    And I click Create
    Then the modal closes
    And no script or HTML injection runs in the browser
    And the program list shows "IA <img src=x onerror=alert(1)>"

# Ambiguities and gaps in DS-3 acceptance criteria:
# - AC1 says "When I click Create". On the live form, Create is disabled for "   ", so the click cannot happen. TC-003 treats that disabled state as "form is not submitted".
# - AC1 says the name is trimmed and treated as empty. The field still displays the spaces; only submission is blocked. No validation message is shown.
# - AC3 expects an error that the name already exists. Live create of an exact duplicate returned HTTP 201 "Program created", closed the modal, showed no alert, and added a second row. Related bugs include DS-13, DS-153, and DS-201.
# - Case folding and trim-before-uniqueness are not in the ACs. TC-006 and TC-007 state the data-integrity expectation from the story. They were not submitted during recon.
# - Max length is not in the ACs. TC-009 and TC-010 assume 100 characters from related defects (DS-151, DS-51, DS-199). The Program Name input has no maxlength. Create stayed enabled for both a 100-character and a 101-character value. The 101-character value was not submitted.
# - Description has no required marker. AC2 says "fill other required fields"; the only required field on the form is Program Name. TC-002 covers create with an empty Description.
# - No AC for non-admin access, success toast, double-click idempotency, or edit-form uniqueness. Edit is covered by DS-2.
# - "Web Development 2026" in AC3 is a shared example name. Automation should use a unique suffix so it does not collide with existing rows, while still asserting exact-name uniqueness.
#
# UI recon:
# - Tool: Playwright MCP (user-Playwright)
# - Date: 2026-10-28
# - Base URL: https://test.didaxis.studio
# - Paths: /login, /programs
# - Login: textbox "Email", textbox "Password", button "Sign In"
# - Open form: button "+ New Program"
# - Dialog: role dialog, heading "New Program"
# - Program Name: textbox "Program Name", visible label "Program Name *", placeholder "e.g. Computer Science BSc", required, no maxlength
# - Description: textbox "Description", placeholder "Brief description", not required
# - Actions: button "Cancel", button "Create" (disabled until Program Name has non-whitespace text), unnamed banner close button
# - Also in the dialog: button "Show AI Generation Config", Total Program Hours, Default Session Hours (default 4), Default Exam Hours (default 3)
# - List: table row, button "Edit <name>", button "Delete <name>"
# - Successful create: POST /api/programs 201, message "Program created", modal closes, row is attached
# - Recon created two rows named "Informatique & IA - Niveau 2 1793236387832" while confirming special characters and the duplicate response. They were not deleted in this pass.
