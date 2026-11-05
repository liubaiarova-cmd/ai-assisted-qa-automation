Feature: Program semester panel

  Scenario: Selecting a program shows its semester panel
    Given an admin is on the Programs page
    And a program exists with no semesters
    When the admin selects that program row
    Then the semester panel heading shows that program name
    And the panel shows "Semesters & scheduling config"
    And "Manage Courses" and "+ Semester" are available
    And "Generate Curriculum" is disabled
    And the panel shows "No semesters yet"
    And the URL remains the Programs page

  Scenario: Create Semester stays disabled until required fields are filled
    Given the semester panel is open for a program with no semesters
    When the admin chooses "+ Semester"
    Then a "New Semester" dialog is shown
    And Semester Name, Start Date, and End Date are empty
    And "Create Semester" is disabled
    When the admin cancels the dialog
    Then the dialog is closed
    And the panel still shows "No semesters yet"

  # Locators: getByRole('row').filter({ has: getByText(name, exact) }) then the name text;
  # getByRole('heading', { level: 4, name }); getByRole('button', { name: '+ Semester' });
  # getByRole('button', { name: /Generate Curriculum/ }); getByText('No semesters yet');
  # dialog filtered by heading "New Semester"; getByLabel('Semester Name' | 'Start Date' | 'End Date');
  # getByRole('button', { name: 'Create Semester' | 'Cancel' }).
  #
  # Coverage gap: create, edit, delete, validation, and list specs never open the
  # semester panel under a selected program. This flow is the entry to semesters.
  # Ambiguities: row click does not change the URL; the panel renders under the table.
  # Generate Curriculum stays disabled while the panel says "No semesters yet".
  # UI recon: user-Playwright browser_snapshot / browser_find, 2026-11-04,
  # https://test.didaxis.studio/programs. Signed-in admin session.
