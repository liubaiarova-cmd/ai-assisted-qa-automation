# DS-1: Create new academic program
# Jira: https://legionqaschool.atlassian.net/browse/DS-1
# Story: As an admin user, I want to create a new academic program so that I can begin designing its curriculum structure.

Feature: DS-1 Create new academic program

  # Happy paths

  @TC-001 @smoke
  Scenario: Admin opens program creation form with Program Name and Description
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the program creation form with fields: Program Name, Description

  @TC-002 @smoke
  Scenario: Admin creates program Web Development 2026 with description
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  @TC-003
  Scenario: Admin creates program with a longer description
    Given I am on the program creation form
    When I fill in Program Name with "Data Science Fundamentals"
    And I fill in Description with "Introductory data science covering Python, statistics, and machine learning basics."
    And I click Create
    Then the modal closes
    And the program list shows "Data Science Fundamentals"

  # Negative

  @TC-004 @smoke
  Scenario: Empty Program Name keeps Create disabled
    Given I am on the program creation form
    When I leave the Program Name field empty
    Then the Create button is disabled

  @TC-005
  Scenario: Closing the modal without Create does not add a program
    Given I am on the program creation form
    And I fill in Program Name with "Draft Program"
    When I close the program creation modal without clicking Create
    Then the modal closes
    And the program list does not show "Draft Program"

  @TC-006
  Scenario: Non-admin cannot open program creation
    Given I am logged in as a non-admin user
    When I navigate to the Programs page
    Then I do not see "+ New Program"
    And I cannot open the program creation form

  @TC-007
  Scenario: Duplicate program name Web Development 2026 is rejected
    Given a program named "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Another description"
    And I click Create
    Then I see a validation or error message indicating the name is already in use
    And the program list contains only one "Web Development 2026"

  @TC-015
  Scenario: Double-clicking Create creates only one program
    Given I am on the program creation form
    When I fill in Program Name with "Mobile Development 2026"
    And I fill in Description with "iOS and Android development track"
    And I double-click Create
    Then the modal closes
    And the program list contains exactly one "Mobile Development 2026"

  # Edge cases

  @TC-008
  Scenario: Leading and trailing spaces on Program Name are trimmed on create
    Given I am on the program creation form
    When I fill in Program Name with "  Cloud Computing 2026  "
    And I fill in Description with "Cloud infrastructure and DevOps track"
    And I click Create
    Then the modal closes
    And the program list shows "Cloud Computing 2026"

  @TC-009
  Scenario: Special characters and unicode in Program Name and Description
    Given I am on the program creation form
    When I fill in Program Name with "AI & ML (2026) — Cohort #1"
    And I fill in Description with "Topics: NLP, CV, étude"
    And I click Create
    Then the modal closes
    And the program list shows "AI & ML (2026) — Cohort #1"

  @TC-010
  Scenario: Program Name at assumed maximum length of 100 characters is accepted
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026 XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    And I fill in Description with "Boundary test for name length"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026 XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

  @TC-011
  Scenario: Program Name over assumed maximum length of 100 characters is rejected
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026 XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY"
    And I fill in Description with "Over limit test"
    Then the Create button is disabled or I see a length validation message
    And no new program is created

  @TC-012
  Scenario: Program creation with empty Description
    Given I am on the program creation form
    When I fill in Program Name with "Cybersecurity Bootcamp"
    And I leave Description empty
    And I click Create
    Then either the program is created and listed as "Cybersecurity Bootcamp"
    Or the Create button is disabled and Description is required

  @TC-013
  Scenario: Whitespace-only Program Name is treated as empty
    Given I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Valid description"
    Then the Create button is disabled

  @TC-014
  Scenario: Script-like content in Description is not executed
    Given I am on the program creation form
    When I fill in Program Name with "Security Test Program"
    And I fill in Description with "<script>alert('xss')</script>"
    And I click Create
    Then the modal closes
    And no script is executed in the browser
    And the program list shows "Security Test Program"

# Ambiguities and gaps in DS-1 acceptance criteria (resolve before automating TC-010/TC-011):
# - Description: required vs optional; min/max length not specified (TC-012 covers both outcomes).
# - Program Name: max length, allowed characters, and uniqueness are not in Jira AC; TC-007 and TC-010/TC-011 assume uniqueness and a 100-character max from common product patterns — confirm with engineering (related bugs mention 100 and 255).
# - Modal dismiss: cancel/X behavior and unsaved-changes warning not specified (TC-005).
# - List UI: sort order, filters, pagination, and whether Description appears inline are unspecified.
# - Roles: only admin is named in AC; TC-006 assumes non-admins must not create programs.
# - Post-create UX: success toast, loading state on Create, and server/API error messaging are not specified.
# - Double-click / idempotency: not in Jira AC; TC-015 documents expected guard based on related defects (DS-110, SS-26).
