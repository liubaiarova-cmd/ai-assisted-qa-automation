# DS-5: Program list filtering and display
# Jira: https://legionqaschool.atlassian.net/browse/DS-5
# Story: As an admin user, I want to see all programs in a clear list so that I can quickly find and manage them.

Feature: DS-5 Program list filtering and display

  # Happy paths

  @TC-001 @smoke
  Scenario: Programs page lists names and descriptions
    Given programs exist in the system
    And a program "Web Development 2026" exists with description "Full-stack web development program"
    And a program "Data Science Fundamentals" exists with description "Introductory data science curriculum"
    When I navigate to the Programs page
    Then I see a list showing each program's name and description
    And I see "Web Development 2026" with description "Full-stack web development program"
    And I see "Data Science Fundamentals" with description "Introductory data science curriculum"

  @TC-002 @smoke
  Scenario: Empty programs list shows guidance to create first program
    Given no programs exist
    When I navigate to the Programs page
    Then I see a message indicating no programs have been created
    And I see a prompt to create the first program

  @TC-003
  Scenario: Empty state create prompt opens creation flow
    Given no programs exist
    When I navigate to the Programs page
    And I follow the prompt to create the first program
    And I create a program "Mobile Development 2026" with description "iOS and Android track"
    Then I see a list showing "Mobile Development 2026" and its description
    And I no longer see the empty state message

  @TC-004
  Scenario: Program list updates after create
    Given programs exist in the system
    When I create a new program "Cloud Computing 2026" with description "AWS and Azure fundamentals"
    Then I see "Cloud Computing 2026" in the program list with its description

  # Negative

  @TC-005
  Scenario: Unauthorized user cannot view program list
    Given I am not logged in
    When I navigate to the Programs page
    Then I do not see the program list with names and descriptions
    And I am redirected to login or see an access denied message

  @TC-006
  Scenario: Populated list hides empty state messaging
    Given a program "Web Development 2026" exists
    When I navigate to the Programs page
    Then I see a list showing each program's name and description
    And I do not see a message indicating no programs have been created

  @TC-007
  Scenario: Load error is distinct from empty programs
    Given the programs list cannot be loaded
    When I navigate to the Programs page
    Then I do not see the empty state prompt to create the first program as if no programs exist
    And I see an error or retry option

  @TC-008
  Scenario: Non-admin empty list without create affordance
    Given no programs exist
    And I am logged in as a non-admin user without create permission
    When I navigate to the Programs page
    Then I see a message indicating no programs have been created
    And I do not see an actionable prompt to create the first program

  # Edge cases

  @TC-009
  Scenario: Special characters in name and description render correctly
    Given a program "Informatique & IA - Niveau 2" exists with description "Programme bilingue — 100% pratique"
    When I navigate to the Programs page
    Then I see "Informatique & IA - Niveau 2" in the list
    And I see the description "Programme bilingue — 100% pratique"

  @TC-010
  Scenario: Long text in list does not break layout
    Given a program "EditBoundary255_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" exists with a long description
    When I navigate to the Programs page
    Then I see the program in the list
    And the name and description are readable via truncation, wrap, or expand without overlapping other rows

  @TC-011
  Scenario: Program without description still listed with name
    Given a program "Cybersecurity Bootcamp" exists with an empty description
    When I navigate to the Programs page
    Then I see "Cybersecurity Bootcamp" in the list
    And the description area shows empty, em dash, or "No description" per design

  @TC-012
  Scenario: Paginated program list shows name and description on each page
    Given more programs exist than fit on one page
    When I navigate to the Programs page
    And I go to the next page of programs
    Then I see each program's name and description on that page

  @TC-013
  Scenario: Filter programs by name substring
    Given programs "Web Development 2026", "Data Science Fundamentals", and "Web Design 2026" exist
    When I navigate to the Programs page
    And I filter the list by "Web"
    Then I see "Web Development 2026" and "Web Design 2026" in the list
    And I do not see "Data Science Fundamentals" in the filtered results

  @TC-014
  Scenario: No results for filter is not the same as no programs in system
    Given programs exist in the system
    When I navigate to the Programs page
    And I filter the list by "ZZZ-No-Match"
    Then I see a no results message for the current filter
    And I do not see the global empty state prompt to create the first program

  @TC-015
  Scenario: Program list sort by name
    Given programs "Alpha Program", "Beta Program", and "Gamma Program" exist
    When I navigate to the Programs page
    And I sort the list by name ascending
    Then programs appear in order "Alpha Program", "Beta Program", "Gamma Program"

  @TC-016
  Scenario: List reflects edit and delete operations
    Given a program "Web Development 2026" exists
    When I navigate to the Programs page
    And I rename the program to "Web Development 2026 - Updated"
    Then the list shows "Web Development 2026 - Updated" with the correct description
    When I delete "Web Development 2026 - Updated"
    Then the program is removed from the list

  @TC-017
  Scenario: List safely renders description content
    Given a program "Security Test Program" exists with description "<b>Bold</b> <script>alert(1)</script>"
    When I navigate to the Programs page
    Then I see "Security Test Program" in the list
    And no script runs in the browser
    And the description is shown as plain or sanitized text

  @TC-018
  Scenario: Program list readable on small screens
    Given programs exist in the system
    When I navigate to the Programs page on a narrow viewport
    Then I see each program's name and description without horizontal clipping of critical text

# Ambiguities and gaps in DS-5 acceptance criteria:
# - Title mentions filtering; ACs only cover full list and empty state — TC-013/TC-014 may not apply if no filter UI exists.
# - List format (table vs cards), row actions, and default sort order are unspecified.
# - Pagination vs single long scroll is not in ACs (TC-012); live app may render all rows without pagination.
# - Empty description display rules are unspecified (TC-011).
# - Exact empty-state copy and CTA label are not defined.
# - Loading skeleton vs error vs true empty state must be distinguishable (TC-007).
# - Role rules for empty-state create prompt are not in ACs (TC-008).
