# ─────────────────────────────────────────────────────────────
# Build stage:  11 — Silo transfer
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 10 (silos exist) + Stage 3 (cash account exists). Both ends of the transfer must be reachable.
# Screens:  ../../../screenshots/silos/01-list.png
#           ../../../screenshots/home/01-home.png
# Prototype: Milio.html  →  tab "Início" → "+" → Transferência
# ─────────────────────────────────────────────────────────────
@silos @core
Feature: Transfer between cash and silo
  A transfer preserves aggregate net worth (Inv-1) and only moves money
  between cash and silo.

  Background:
    Given today is "2026-05-16"
    And a household with 1 members
    And a bank account "Itaú checking" with "R$ 10.000,00" balance
    And a silo "Emergency fund" with "R$ 5.000,00"

  @unit @invariant
  Scenario: To the silo, cash drops
    When I transfer "R$ 1.000,00" from "Itaú checking" to silo "Emergency fund"
    Then free-to-spend is "R$ 9.000,00"
    And silo "Emergency fund" has value "R$ 6.000,00"
    And a transaction of kind "transfer-in" was recorded
    And aggregate net worth is unchanged
    And a flash "R$ 1.000 guardado em Emergency fund" was shown

  @unit @invariant
  Scenario: From the silo, cash rises
    When I transfer "R$ 500,00" from silo "Emergency fund" to "Itaú checking"
    Then free-to-spend is "R$ 10.500,00"
    And silo "Emergency fund" has value "R$ 4.500,00"
    And a transaction of kind "transfer-out" was recorded
    And aggregate net worth is unchanged

  @unit @property
  Scenario: Round-trip with the same value is idempotent
    When I transfer "R$ 1.000,00" from "Itaú checking" to silo "Emergency fund"
    And I transfer "R$ 1.000,00" from silo "Emergency fund" to "Itaú checking"
    Then free-to-spend is "R$ 10.000,00"
    And silo "Emergency fund" has value "R$ 5.000,00"

  @unit
  Scenario: Transfer larger than silo balance is rejected
    When I try to transfer "R$ 10.000,00" from silo "Emergency fund" to "Itaú checking"
    Then the operation is rejected with error "insufficient-silo-funds"
    And silo "Emergency fund" has value "R$ 5.000,00"

  @integration
  Scenario: UI shows the explainer
    Given the UI in "pt-BR"
    When I open the transfer form with direction "to silo", amount "R$ 1.000,00" and silo "Emergency fund"
    Then the explainer shows "Esse R$ 1.000 sai do livre pra gastar"
    And shows "O valor de Emergency fund sobe na mesma medida"
