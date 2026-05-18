# ─────────────────────────────────────────────────────────────
# Build stage:  8 — Essa semana / weekly allowance
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 8 calculation.
# Screens:  ../../../screenshots/home/01-home.png
# Prototype: Milio.html  →  tab "Início" → allowance card → "Ajustar mesada"
# ─────────────────────────────────────────────────────────────
@allowance
Feature: Manually adjust the weekly allowance

  Background:
    Given today is "2026-05-16"
    And a household with 1 members
    And a bank account "Itaú checking" with "R$ 10.000,00" balance
    And an income of "R$ 6.800,00" for "Marcus" every day 1

  @unit
  Scenario: Setting an override
    When I adjust the allowance to "R$ 1.500,00"
    Then the allowance override is "R$ 1.500,00"
    And the effective allowance is "R$ 1.500,00"
    And a flash "Mesada semanal atualizada" was shown

  @unit
  Scenario: Reverting to the automatic suggestion
    Given an allowance with override "R$ 2.050,00"
    When I revert to the suggested allowance
    Then the override is null
    And the effective allowance equals the automatic suggestion
    And a flash "Voltou pra sugestão" was shown

  @integration
  Scenario: Adjustment presets — 50%, 75%, suggested
    Given the current suggestion is "R$ 2.000,00"
    When I open the allowance adjust sheet
    Then the presets show "R$ 1.000,00 CONSERVADOR", "R$ 1.500,00 MODERADO", "R$ 2.000,00 SUGERIDO"
