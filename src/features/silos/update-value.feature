# ─────────────────────────────────────────────────────────────
# Build stage:  10 — Silos (create + show)
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 10 silo creation. Inv-3 — revaluation does NOT touch cashOnHand.
# Screens:  ../../../screenshots/silos/01-list.png
# Prototype: Milio.html  →  tab "Silos" → tap a silo → "Atualizar valor"
# ─────────────────────────────────────────────────────────────
@silos
Feature: Update a silo's value (revaluation)
  Updating a value does NOT move cash. It's an asset revaluation — Inv-3.

  Background:
    Given today is "2026-05-16"
    And a household with 1 members
    And a bank account "Itaú checking" with "R$ 10.000,00" balance
    And a silo "Apartment" with "R$ 642.000,00"

  @unit @invariant
  Scenario: Raising the value does not touch cash
    When I update silo "Apartment" value to "R$ 654.000,00"
    Then silo "Apartment" has value "R$ 654.000,00"
    And free-to-spend stays "R$ 10.000,00"
    And a transaction of kind "asset-update" was recorded with delta "R$ 12.000,00"

  @unit @invariant
  Scenario: Lowering the value also does not touch cash
    When I update silo "Apartment" value to "R$ 620.000,00"
    Then silo "Apartment" has value "R$ 620.000,00"
    And free-to-spend stays "R$ 10.000,00"

  @unit
  Scenario: Setting the same value is a no-op (no transaction)
    When I update silo "Apartment" value to "R$ 642.000,00"
    Then no new transaction was recorded
    And silo "Apartment" updatedAt did not change

  @integration
  Scenario: UI shows delta
    When I open the update-value form for silo "Apartment"
    And fill in "R$ 654.000,00"
    Then the delta shown is "+R$ 12.000 vs. valor anterior" in olive
    And the explainer shows "Isso não move dinheiro. Atualizar um silo nunca muda seu \"livre pra gastar\""
