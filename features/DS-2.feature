# DS-2: Edit existing program details
# Jira: https://legionqaschool.atlassian.net/browse/DS-2
# Story: As an admin user, I want to edit program details so that I can keep program information accurate.

Feature: DS-2 Edit existing program details

  # Happy paths

  @TC-001 @smoke
  Scenario: Admin opens edit form with existing program data
    Given I am on the Programs page
    And a program "Web Development 2026" exists
    When I click the edit icon on "Web Development 2026"
    Then I see the Edit Program form pre-populated with the program's current data

  @TC-002 @smoke
  Scenario: Admin updates program name and sees list refresh
    Given I am editing "Web Development 2026"
    When I change the Program Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"

  @TC-003 @smoke
  Scenario: Editing description does not alter program name
    Given I am editing a program
    And the Program Name is "Data Science Fundamentals"
    And the Description is "Original cohort description"
    When I only change the Description to "Updated cohort description for 2026"
    And I click Save
    Then the Program Name and other fields remain unchanged
    And the program list shows "Data Science Fundamentals"

  @TC-004
  Scenario: Admin updates name and description together
    Given I am editing "Cloud Computing 2026"
    When I change the Program Name to "Cloud Computing 2026 - Advanced"
    And I change the Description to "Expanded curriculum with Kubernetes and Terraform"
    And I click Save
    Then the modal closes
    And the program list shows "Cloud Computing 2026 - Advanced"

  @TC-019
  Scenario: Edit form exposes AI generation config
    Given I am editing "Web Development 2026"
    Then I see fields Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas
    And I see Sync/Async Ratio "70% sync / 30% async"
    And I see a "Show AI Generation Config" control

  @TC-020
  Scenario: Description edit preserves default hours
    Given I am editing a program with Default Session Hours 4 and Default Exam Hours 3
    When I only change the Description
    And I click Save
    Then Default Session Hours is still 4
    And Default Exam Hours is still 3

  # Negative

  @TC-005
  Scenario: Clearing program name prevents save
    Given I am editing "Web Development 2026"
    When I clear the Program Name field
    Then the Save button is disabled
    And the program list still shows "Web Development 2026"

  @TC-006
  Scenario: Dismiss edit form without saving
    Given I am editing "Web Development 2026"
    When I change the Program Name to "Temporary Draft Name"
    And I close the edit modal without clicking Save
    Then the modal closes
    And the program list still shows "Web Development 2026"
    And the program list does not show "Temporary Draft Name"

  @TC-007
  Scenario: Non-admin cannot edit programs
    Given I am logged in as a non-admin user
    And a program "Web Development 2026" exists
    When I navigate to the Programs page
    Then I do not see an edit icon on "Web Development 2026"
    And I cannot open the edit form

  @TC-008
  Scenario: Duplicate name on edit is currently allowed
    Given I am editing "Cybersecurity Bootcamp"
    And a program "Web Development 2026" already exists
    When I change the Program Name to "Web Development 2026"
    And I click Save
    Then the save succeeds
    And the program list shows two rows named "Web Development 2026"

  @TC-009
  Scenario: Failed save shows error and does not update list incorrectly
    Given I am editing "Web Development 2026"
    And the save request will fail
    When I change the Description to "Change pending save failure test"
    And I click Save
    Then I see an error message indicating the save failed
    And the program list still shows the previous description for "Web Development 2026"

  @TC-022
  Scenario: Banner close discards unsaved edit
    Given I am editing "Web Development 2026"
    When I change the Program Name to "Closed Without Save"
    And I click the dialog close button
    Then the modal closes
    And the program list still shows "Web Development 2026"

  # Edge cases

  @TC-010
  Scenario: Trimmed name after edit
    Given I am editing "Web Development 2026"
    When I change the Program Name to "  Web Development 2026 - Trimmed  "
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026 - Trimmed"

  @TC-011
  Scenario: Unicode and special characters persist after edit
    Given I am editing "Web Development 2026"
    When I change the Program Name to "AI & ML (2026) — Cohort #2"
    And I change the Description to "Résumé skills: NLP, CV, 100% hands-on"
    And I click Save
    Then the program list shows "AI & ML (2026) — Cohort #2"

  @TC-012
  Scenario: Name at 255 characters saves successfully
    Given I am editing "Web Development 2026"
    When I change the Program Name to "EditBoundary255_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    And I click Save
    Then the modal closes
    And the program list shows the program with the full updated name

  @TC-013
  Scenario: Over-length name on edit currently saves
    Given I am editing "Web Development 2026"
    When I change the Program Name to "EditBoundary255_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY"
    And I click Save
    Then the save succeeds
    And the program list shows the full 256-character name

  @TC-014
  Scenario: Whitespace-only name is invalid on edit
    Given I am editing "Web Development 2026"
    When I change the Program Name to "   "
    Then the Save button is disabled

  @TC-015
  Scenario: Empty description on edit
    Given I am editing "Web Development 2026"
    And the Description is "Full-stack web development program"
    When I clear the Description field
    And I click Save
    Then the program is saved with an empty Description

  @TC-016
  Scenario: Save without changes
    Given I am editing "Web Development 2026"
    When I click Save without changing any fields
    Then the modal closes
    And the program list still shows "Web Development 2026"
    And no duplicate entries appear in the list

  @TC-017
  Scenario: HTML in description is not executed after edit
    Given I am editing "Web Development 2026"
    When I change the Description to "<img src=x onerror=alert(1)>"
    And I click Save
    Then no script or HTML injection runs in the browser
    And the program list still shows "Web Development 2026"

  @TC-018
  Scenario: Last write or conflict handling for concurrent edits
    Given two admins are editing "Web Development 2026"
    When the first admin saves a name change
    And the second admin saves a description change without refreshing
    Then the system either merges changes, shows a conflict warning, or applies last-write-wins consistently

  @TC-021
  Scenario: Single-character Program Name is accepted on edit
    Given I am editing "Web Development 2026"
    When I change the Program Name to "A"
    And I click Save
    Then the program list shows "A"

  @TC-023
  Scenario: Case-variant duplicate name on edit is currently allowed
    Given a program "Web Development 2026" exists
    And I am editing a different program
    When I change the Program Name to "web development 2026"
    And I click Save
    Then the save succeeds

# Ambiguities and gaps in DS-2 acceptance criteria:
# - Jira AC uses "Name"; the UI label is "Program Name *".
# - AC "program's current data" does not list AI config fields (Total Program Hours, Default Session Hours, etc.).
# - Non-admin edit behavior is not in ACs.
# - Live app may not enforce uniqueness or max length on edit (TC-008, TC-013 document current behavior vs desired).
# - No AC for unsaved-changes warning, success toast, or concurrent edit policy (TC-018).
# - "Immediately" updating the list is unspecified for very large unpaginated tables.
