# DS-3: Program name validation and duplicate prevention
# Jira: https://legionqaschool.atlassian.net/browse/DS-3
# Story: As an admin user, I want the system to prevent invalid or duplicate program names so that data integrity is maintained.

Feature: DS-3 Program name validation and duplicate prevention

  # Happy paths

  @TC-001 @smoke
  Scenario: Program name with ampersand, hyphen, and accented characters is accepted
    Given I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill in Description with "Programme bilingue en informatique et intelligence artificielle"
    And I click Create
    Then the program is created successfully
    And the program list shows "Informatique & IA - Niveau 2"

  @TC-002
  Scenario: A simple valid program name is accepted
    Given I am on the program creation form
    When I enter "Mobile Development 2026" as the program name
    And I fill in Description with "iOS and Android curriculum"
    And I click Create
    Then the program is created successfully
    And the program list shows "Mobile Development 2026"

  # Negative

  @TC-003 @smoke
  Scenario: Whitespace-only program name is trimmed and rejected
    Given I am on the program creation form
    When I enter "   " as the program name
    And I click Create
    Then the form is not submitted
    And no program is created

  @TC-004 @smoke
  Scenario: Duplicate program name is rejected on create
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the name "Web Development 2026"
    Then I see an error indicating the name already exists
    And the program list contains only one "Web Development 2026"

  @TC-005
  Scenario: Empty program name is rejected
    Given I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Description without a program name"
    Then the form is not submitted
    And no program is created

  @TC-006
  Scenario: A rejected duplicate does not add a second program
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the name "Web Development 2026"
    And I see an error indicating the name already exists
    Then after I refresh the Programs page
    And the program list still contains only one "Web Development 2026"

  # Edge cases

  @TC-007
  Scenario: Leading and trailing spaces around a valid name are trimmed
    Given I am on the program creation form
    When I enter "  Unique Program Alpha  " as the program name
    And I fill in Description with "Trim test program"
    And I click Create
    Then the program is created successfully
    And the program list shows "Unique Program Alpha"

  @TC-008
  Scenario: A case-variant of an existing name is treated as a duplicate
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the name "web development 2026"
    Then I see an error indicating the name already exists
    And the program list contains only one "Web Development 2026"

  @TC-009
  Scenario: Multiple internal spaces in a program name are preserved
    Given I am on the program creation form
    When I enter "Full   Stack   Engineering" as the program name
    And I fill in Description with "Engineering track with spaced name"
    And I click Create
    Then the program is created successfully
    And the program list shows "Full   Stack   Engineering"

  @TC-010
  Scenario: Program name at the maximum allowed length is accepted
    Given I am on the program creation form
    When I enter a program name of the maximum allowed length
    And I fill in Description with "Boundary test for name length"
    And I click Create
    Then the program is created successfully

  @TC-011
  Scenario: Program name longer than the maximum is rejected
    Given I am on the program creation form
    When I enter a program name one character over the maximum allowed length
    And I fill in Description with "Over limit test"
    Then the form is not submitted
    And no program is created

  @TC-012
  Scenario: Parentheses, quotes, and a hash in a program name are accepted
    Given I am on the program creation form
    When I enter "DevOps (2026) \"Fast Track\" #1" as the program name
    And I fill in Description with "Special character name test"
    And I click Create
    Then the program is created successfully
    And the program list shows "DevOps (2026) \"Fast Track\" #1"

  @TC-013
  Scenario: A deleted program name can be used again
    Given no program named "Web Development 2026" currently exists
    And a program with that name was previously deleted
    When I enter "Web Development 2026" as the program name
    And I fill in Description with "Reused name after delete"
    And I click Create
    Then the program is created successfully
    And the program list shows "Web Development 2026"

# Ambiguities and gaps in DS-3 acceptance criteria:
# - The ticket names three scenarios only: whitespace-only rejection, special characters ("Informatique & IA - Niveau 2"), and duplicate "Web Development 2026".
# - "Other required fields" are not named. Description is used here because the create form exposes it; confirm whether Description is required.
# - Whitespace AC says the form is not submitted after click. It does not say whether Create stays disabled or an error is shown.
# - Duplicate AC does not define error copy, inline vs toast, or whether the message includes the program name.
# - Duplicate AC is create-only. Rename-to-existing on edit is out of scope until confirmed.
# - Case sensitivity (TC-008), internal-space preservation (TC-009), and reuse after delete (TC-013) are not specified.
# - Maximum name length is not specified, so TC-010 and TC-011 cannot use a concrete limit until engineering confirms it.
# - Uniqueness scope (global vs tenant) and whether soft-deleted names stay reserved are not specified.
