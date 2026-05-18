# ─────────────────────────────────────────────────────────────
# Build stage:  8 — Essa semana / weekly allowance
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 8 calculation + Stage 5 expense flow (the spend writes a Transaction).
# Screens:  ../../../screenshots/home/01-home.png
# Prototype: Milio.html  →  tab "Início" → allowance card "Registrar"
# ─────────────────────────────────────────────────────────────
@allowance
Feature: Log a weekly spend

  Background:
    Given today is "2026-05-16"
    And a household with 1 members
    And a bank account "Itaú checking" with "R$ 10.000,00" balance
    And an allowance with override "R$ 2.000,00"

  @unit @invariant
  Scenario: Spend adds to "spent" and drops "remaining"
    When I log an allowance spend of "R$ 142,40" labeled "Mercado"
    Then the week spent is "R$ 142,40"
    And the allowance remaining is "R$ 1.857,60"
    And a transaction of kind "allowance-spend" was recorded
    And a flash "R$ 142,40 registrado" was shown

  @unit
  Scenario: Multiple spends sum
    When I log an allowance spend of "R$ 142,40" labeled "Mercado"
    And I log an allowance spend of "R$ 68,50" labeled "Jantar"
    And I log an allowance spend of "R$ 23,00" labeled "Café"
    Then the week spent is "R$ 233,90"
    And the allowance remaining is "R$ 1.766,10"

  @unit
  Scenario: Exceeding the allowance does not block, but signals
    When I log an allowance spend of "R$ 2.500,00" labeled "Big purchase"
    Then the week spent is "R$ 2.500,00"
    And the allowance remaining is "R$ 0,00" (clamped)
    And the card shows 125% in terracotta
    And the hero serif is in terracotta-pressed
