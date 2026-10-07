# DS-4: Delete program with confirmation
# Jira: https://legionqaschool.atlassian.net/browse/DS-4
# Story: As an admin user, I want to delete a program I no longer need, with a confirmation step to prevent accidental deletion.

Feature: DS-4 Delete program with confirmation

  # Happy paths

  @TC-001 @smoke
  Scenario: Admin deletes program after confirmation
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    When I confirm deletion
    Then "Test Program" is removed from the program list

  @TC-002 @smoke
  Scenario: Admin cancels delete from confirmation dialog
    Given a program "Web Development 2026" exists
    When I click the delete icon for "Web Development 2026"
    And I see the confirmation dialog
    And I click Cancel
    Then the program still exists in the list
    And "Web Development 2026" is still shown in the program list

  @TC-003
  Scenario: Delete confirmation references the program being removed
    Given a program "Cybersecurity Bootcamp" exists
    When I click the delete icon for "Cybersecurity Bootcamp"
    Then I see a confirmation dialog
    And the dialog mentions "Cybersecurity Bootcamp" or clearly indicates which program will be deleted

  @TC-004
  Scenario: Program list reflects deletion without full reload
    Given a program "Data Science Fundamentals" exists
    When I click the delete icon for "Data Science Fundamentals"
    And I confirm deletion
    Then "Data Science Fundamentals" is removed from the program list immediately

  # Negative

  @TC-005
  Scenario: Program remains when delete is not initiated
    Given a program "Test Program" exists
    When I do not click the delete icon for "Test Program"
    Then "Test Program" still exists in the list

  @TC-006
  Scenario: Dismiss confirmation without Cancel button still preserves program
    Given a program "Cloud Computing 2026" exists
    When I click the delete icon for "Cloud Computing 2026"
    And I see the confirmation dialog
    And I dismiss the dialog without confirming deletion
    Then "Cloud Computing 2026" still exists in the program list

  @TC-007
  Scenario: Non-admin cannot delete programs
    Given I am logged in as a non-admin user
    And a program "Test Program" exists
    When I navigate to the Programs page
    Then I do not see a delete icon for "Test Program"
    Or I cannot complete program deletion

  @TC-008
  Scenario: Server error on delete does not remove program from UI permanently
    Given a program "Test Program" exists
    And the delete request will fail
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then I see an error message indicating deletion failed
    And "Test Program" still exists in the program list

  @TC-009
  Scenario: Repeated confirm clicks do not break list state
    Given a program "Mobile Development 2026" exists
    When I click the delete icon for "Mobile Development 2026"
    And I confirm deletion twice quickly
    Then "Mobile Development 2026" is removed from the program list
    And no duplicate error or broken UI state appears

  # Edge cases

  @TC-010
  Scenario: Delete program with special characters in name
    Given a program "Informatique & IA - Niveau 2" exists
    When I click the delete icon for "Informatique & IA - Niveau 2"
    And I confirm deletion
    Then "Informatique & IA - Niveau 2" is removed from the program list

  @TC-011
  Scenario: Deleting the only program shows empty list state
    Given only the program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And I see an appropriate empty state message or empty table

  @TC-012
  Scenario: Long program name displays correctly in delete confirmation
    Given a program "EditBoundary255_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" exists
    When I click the delete icon for that program
    Then I see a confirmation dialog
    And the program name is fully readable or truncated with accessible full name
    When I confirm deletion
    Then the program is removed from the program list

  @TC-013
  Scenario: Deletion updates filtered program list
    Given a program "Test Program" exists
    And the program list is filtered to show "Test Program"
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And the filtered view no longer shows "Test Program"

  @TC-014
  Scenario: Delete blocked or cascades when program has dependencies
    Given a program "Test Program" exists
    And the program has active enrollments
    When I click the delete icon for "Test Program"
    Then either I see a confirmation dialog warning about dependencies
    Or I see an error that the program cannot be deleted
    And if deletion is not allowed then "Test Program" still exists in the list

  @TC-015
  Scenario: Delete confirmation is operable by keyboard
    Given a program "Test Program" exists
    When I open the delete confirmation dialog using the keyboard
    And I move focus to the confirm action and activate it
    Then "Test Program" is removed from the program list

  @TC-016
  Scenario: Post-delete feedback is shown
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And I see success feedback or no misleading error message

  @TC-017
  Scenario: Program name is available after deletion
    Given "Test Program" was deleted and no longer exists
    When I create a new program named "Test Program"
    And I fill in Description with "Recreated after delete"
    And I click Create
    Then the program is created successfully
    And the program list shows "Test Program"

  @TC-019
  Scenario: Double-click delete opens only one confirmation flow
    Given a program "Mobile Development 2026" exists
    When I double-click the delete icon for "Mobile Development 2026"
    Then I see a single confirmation dialog
    And confirming deletion removes exactly one "Mobile Development 2026" from the program list

# Ambiguities and gaps in DS-4 acceptance criteria:
# - Exact confirm button label (Delete, Yes, Confirm) is not specified.
# - Dialog warning text and irreversibility message are not in ACs.
# - Dismiss via Escape, backdrop, or X is not specified (TC-006).
# - Admin-only delete vs other roles is not stated.
# - Programs with enrollments or linked curriculum are not covered in ACs (TC-014).
# - Soft delete, audit trail, and restore are unspecified.
# - TC-013 assumes search/filter exists; Programs page may have no filter (confirm in app).
# - Native browser confirm() vs in-app modal is an implementation detail not in ACs.
