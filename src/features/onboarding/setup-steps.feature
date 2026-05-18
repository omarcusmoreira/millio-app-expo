# ─────────────────────────────────────────────────────────────
# Build stage:  2 — Household exists
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 1 (a name in transient state).
# Screens:  ../../../screenshots/onboarding/06-setup-bills.png
#           ../../../screenshots/onboarding/07-setup-incomes.png
#           ../../../screenshots/onboarding/08-setup-silos.png
# Prototype: Onboarding.html  →  steps 1/4 to 3/4
# ─────────────────────────────────────────────────────────────
@onboarding
Feature: Explanatory setup steps (no data collected)
  Steps 1/4 through 3/4 (bills, income, silos) are purely educational —
  they teach the product's mental model before the payoff screen.

  Background:
    Given the user has just set their name to "Marcus"

  @integration
  Scenario Outline: Each explanation step has
    Given the user is on "<step>"
    Then the step indicator shows "<index>/4 · <label>"
    And there is a preview card labeled "<previewLabel>"
    And there is a quiet footer in ink-3
    And there is a primary "Continuar" button
    But there are no input fields

    Examples:
      | step             | index | label        | previewLabel    |
      | setup-bills      | 1     | Suas contas  | Contas · maio   |
      | setup-incomes    | 2     | Sua renda    | Perfil · Marcus |
      | setup-silos      | 3     | Seus silos   | Silos           |

  @integration
  Scenario: Step indicator does not wrap on small screens
    Given the viewport is 320×568
    When I am on "setup-incomes"
    Then "2/4 · Sua renda" does not wrap
    And the 4 dots remain visible

  @integration
  Scenario: Step indicator at step 4 (household) reads "4/4 · Seu lar"
    When I am on "setup-household"
    Then the step indicator shows "4/4 · Seu lar"

  @integration
  Scenario: Back navigation works on every step
    Given I am on "setup-silos"
    When I tap back
    Then I am on "setup-incomes"
