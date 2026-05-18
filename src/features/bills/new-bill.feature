# ─────────────────────────────────────────────────────────────
# Build stage:  6 — Bills (create + list)
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 2 (household exists) + Stage 3 (cash account exists so paid-from is wireable).
# Screens:  ../../../screenshots/bills/01-list.png
#           ../../../screenshots/bills/02-detail.png
# Prototype: Milio.html  →  tab "Contas" → "+ Nova conta"
# ─────────────────────────────────────────────────────────────
@bills
Feature: Add a new obligation

  Background:
    Given today is "2026-05-16"
    And a household with 1 members

  @integration
  Scenario: Fixed monthly bill
    When I add a new obligation with
      | name        | Rent         |
      | amount      | R$ 2.850,00  |
      | variable    | no           |
      | repeats     | monthly      |
      | day         | 1            |
      | assignee    | Marcus       |
    Then the bill "Rent" exists in the household
    And it has status "upcoming"
    And the amount is "R$ 2.850,00"
    And a flash "Obrigação adicionada" was shown

  @integration
  Scenario: Variable bill with no estimate
    When I add a new obligation with
      | name      | Electric  |
      | variable  | yes       |
      | estimate  |           |
      | repeats   | monthly   |
      | day       | 15        |
    Then the bill "Electric" exists in the household
    And variable is true
    And amount is null
    And estimate is null
    But free-to-spend is unchanged (no subtraction)

  @unit @invariant
  Scenario: Inv-5 — Variable bill has estimate; fixed bill has amount
    When I try to create a bill with
      | name     | Invalid |
      | variable | yes     |
      | amount   | 100     |
    Then the operation is rejected with error "validation"

  @integration
  Scenario: One-time bill
    When I add a new obligation with
      | name      | Sofia's birthday   |
      | amount    | R$ 350,00          |
      | repeats   | one-time           |
      | day       | 22                 |
    Then the bill appears only in the current month
    And is not projected into future months
