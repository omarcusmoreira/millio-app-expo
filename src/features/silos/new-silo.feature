# ─────────────────────────────────────────────────────────────
# Build stage:  10 — Silos (create + show)
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 2 (household). Silos are household-scoped, not member-scoped.
# Screens:  ../../../screenshots/silos/01-list.png
# Prototype: Milio.html  →  tab "Silos" → "+ Novo silo"
# ─────────────────────────────────────────────────────────────
@silos
Feature: Create a silo

  Background:
    Given today is "2026-05-16"
    And a household with 1 members

  @integration
  Scenario: Empty silo with just a name
    When I add a silo with
      | name   | Trip |
      | value  |      |
    Then the silo "Trip" exists in the household
    And the initial value is "R$ 0,00"
    And a flash "Silo adicionado" was shown

  @integration
  Scenario: Silo with an initial value
    When I add a silo with
      | name   | Reserve     |
      | value  | R$ 5.000,00 |
    Then the silo "Reserve" exists in the household
    And the initial value is "R$ 5.000,00"
    But cash on hand is unaffected

  @integration
  Scenario: Silo with a goal
    When I add a silo with
      | name   | Trip in July    |
      | value  | R$ 2.000,00     |
      | goal   | R$ 6.000,00     |
    Then the silo "Trip in July" has goal "R$ 6.000,00"
    And the progress is "33%"
