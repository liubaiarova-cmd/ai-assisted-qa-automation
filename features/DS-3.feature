# DS-3: Program name validation and duplicate prevention
# Jira: https://legionqaschool.atlassian.net/browse/DS-3
# Story: As an admin user, I want program names validated so that duplicates and invalid names are prevented.

Feature: DS-3 Program name validation and duplicate prevention

  # Happy paths

  @TC-001 @smoke
  Scenario: Program name with ampersand, hyphen, and accented characters
    Given I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill in Description with "Programme bilingue en informatique et intelligence artificielle"
    And I click Create
    Then the program is created successfully
    And the program list shows "Informatique & IA - Niveau 2"

  @TC-002
  Scenario: Valid simple program name creates program
    Given I am on the program creation form
    When I enter "Mobile Development 2026" as the program name
    And I fill in Description with "iOS and Android curriculum"
    And I click Create
    Then the program is created successfully
    And the program list shows "Mobile Development 2026"

  @TC-003
  Scenario: Program name with multiple internal spaces
    Given I am on the program creation form
    When I enter "Full   Stack   Engineering" as the program name
    And I fill in Description with "Engineering track with spaced name"
    And I click Create
    Then the program is created successfully

  # Negative

  @TC-004 @smoke
  Scenario: Whitespace-only name is trimmed and rejected
    Given I am on the program creation form
    When I enter "   " as the program name
    And I click Create
    Then the form is not submitted (name is trimmed, treated as empty)

  @TC-005 @smoke
  Scenario: Duplicate program name on create
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the same name
    Then I see an error indicating the name already exists

  @TC-006
  Scenario: Empty program name is rejected
    Given I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Description without name"
    Then the Create button is disabled
    And no program is created

  @TC-007
  Scenario: Failed duplicate create leaves database unchanged
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the same name
    And I see an error indicating the name already exists
    Then after I refresh the Programs page
    And the program list still contains only one "Web Development 2026"

  @TC-008
  Scenario: Rename to existing program name is rejected
    Given a program "Web Development 2026" already exists
    And I am editing "Cybersecurity Bootcamp"
    When I change the Program Name to "Web Development 2026"
    And I click Save
    Then I see an error indicating the name already exists
    And the program list still shows "Cybersecurity Bootcamp"

  # Edge cases

  @TC-009
  Scenario: Trimmed valid name is accepted
    Given I am on the program creation form
    When I enter "  Unique Program Alpha  " as the program name
    And I fill in Description with "Trim test program"
    And I click Create
    Then the program is created successfully
    And the program list shows "Unique Program Alpha"

  @TC-010
  Scenario: Case-variant duplicate name is rejected
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the program name "web development 2026"
    Then I see an error indicating the name already exists

  @TC-011
  Scenario: Unicode-normalized duplicate prevention
    Given a program "Café Program" already exists
    When I try to create a new program with a visually equivalent "Café Program" name
    Then I see an error indicating the name already exists
    Or the system treats the names as distinct per unicode rules

  @TC-012
  Scenario: Maximum length program name is valid
    Given I am on the program creation form
    When I enter "Web Development 2026 XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" as the program name
    And I fill in Description with "Boundary test for name length"
    And I click Create
    Then the program is created successfully

  @TC-013
  Scenario: Over-maximum program name cannot be created
    Given I am on the program creation form
    When I enter "Web Development 2026 XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY" as the program name
    And I fill in Description with "Over limit test"
    Then the Create button is disabled or I see a length validation message
    And no program is created

  @TC-014
  Scenario: Additional special characters in program name
    Given I am on the program creation form
    When I enter "DevOps (2026) \"Fast Track\" #1" as the program name
    And I fill in Description with "Special character name test"
    And I click Create
    Then the program is created successfully

  @TC-015
  Scenario: Control characters in program name
    Given I am on the program creation form
    When I enter a program name containing tab or newline characters
    Then the Create button is disabled or I see a validation message
    Or the name is sanitized and created per product rules

  @TC-016
  Scenario: Reuse name after deletion
    Given no program "Web Development 2026" currently exists
    And a program with that name was previously deleted
    When I enter "Web Development 2026" as the program name
    And I fill in Description with "Reused name after delete"
    And I click Create
    Then the program is created successfully

  @TC-017
  Scenario: Duplicate error references program name
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the same name
    Then I see an error indicating the name already exists
    And the error is associated with the Program Name field or clearly names "Web Development 2026"

# Ambiguities and gaps in DS-3 acceptance criteria:
# - Duplicate AC describes create only; TC-008 assumes the same rule on edit — confirm scope.
# - Case sensitivity for duplicates is not specified (TC-010).
# - Max length not in ACs; TC-012/TC-013 assume 100 characters — confirm with engineering (100 vs 255).
# - Error UX (inline vs toast, exact copy) is not defined.
# - Uniqueness scope (global vs tenant) and soft-delete blocking reuse are unspecified.
# - "Other required fields" implies Description may be required elsewhere but is not stated in ACs.
