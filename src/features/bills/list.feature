# ─────────────────────────────────────────────────────────────
# Build stage:  6 — Bills (create + list)
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 2 + Stage 3. Bills must exist to filter, so most scenarios seed several via Background.
# Screens:  ../../../screenshots/bills/01-list.png
# Prototype: Milio.html  →  tab "Contas"
# ─────────────────────────────────────────────────────────────
@bills
Feature: Bills list with filters and month

  Background:
    Given today is "2026-05-16"
    And a household with 1 members
    And a bill "Rent" of "R$ 2.850,00" due "in 5 days"
    And a bill "Electric" of "R$ 145,00" due "in 3 days"
    And a bill "Internet" of "R$ 89,00" due "yesterday"
    And bill "Internet" is already paid
    And a bill "Piano" of "R$ 240,00" due "10 days ago"

  @integration
  Scenario: "All" filter shows every bill
    When I open the "Bills" tab
    And apply the filter "Todas"
    Then the list contains 4 items

  @integration
  Scenario: "Upcoming" filter shows only unpaid bills
    When I apply the filter "Próximas"
    Then the list contains 3 items
    And does not include "Internet"

  @integration
  Scenario: "Paid" filter shows only paid bills
    When I apply the filter "Pagas"
    Then the list contains 1 item
    And includes "Internet"

  @unit @invariant
  Scenario: Status derived by date — overdue
    When I compute the status of "Piano"
    Then the status is "overdue"

  @unit @invariant
  Scenario Outline: Status derived by date
    When I compute the status of an unpaid bill with due date <due>
    Then the status is "<status>"

    Examples:
      | due           | status   |
      | in 5 days     | upcoming |
      | today         | upcoming |
      | tomorrow      | upcoming |
      | yesterday     | overdue  |
      | 10 days ago   | overdue  |

  @integration
  Scenario: Past month shows historical mode
    When I navigate to month "2026-04"
    Then the eyebrow shows "MÊS PASSADO · HISTÓRICO"
    And every bill has status "paid" (demo mode)
    And the "Nova obrigação" button is not visible

  @integration
  Scenario: Future month shows projection mode
    When I navigate to month "2026-07"
    Then the eyebrow shows "MÊS FUTURO · PROJEÇÃO"
    And the summary shows "Projetado" instead of "Pendente"
