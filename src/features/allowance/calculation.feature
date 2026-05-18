# ─────────────────────────────────────────────────────────────
# Build stage:  8 — Essa semana / weekly allowance
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 4 (income → nextPaycheck date) + Stage 7 (free-to-spend). Both inputs feed the formula.
# Screens:  ../../../screenshots/home/01-home.png
# Prototype: Milio.html  →  tab "Início" (allowance card)
# ─────────────────────────────────────────────────────────────
@allowance @core
Feature: Automatic weekly allowance calculation
  The suggestion = free_to_spend / days_until_next_paycheck × 7.

  Background:
    Given today is "2026-05-16"
    And a household with 1 members
    And a bank account "Itaú checking" with "R$ 10.000,00" balance
    And an income of "R$ 6.800,00" for "Marcus" every day 1

  @unit
  Scenario: Default suggestion (no override)
    Given a bill "Rent" of "R$ 2.850,00" due "in 5 days"
    When I compute the suggested weekly allowance
    # free_to_spend = 10000 - 2850 = 7150; daysToPaycheck = 16 (today 16/May → 1/Jun)
    # 7150 / 16 * 7 = 3128 (round)
    Then the suggested weekly allowance is "R$ 3.128,00"

  @unit @invariant
  Scenario: Inv-6 — Suggestion never exceeds free-to-spend
    Given a bill "Rent" of "R$ 8.000,00" due "in 5 days"
    When I compute the suggested weekly allowance
    Then the suggestion is less than or equal to free-to-spend

  @unit
  Scenario: Override beats suggestion
    Given an allowance with override "R$ 2.050,00"
    When I compute the effective allowance
    Then the effective allowance is "R$ 2.050,00"
    And the UI badge shows "VOCÊ DEFINIU"

  @unit
  Scenario: No income configured falls back to a 30-day default
    Given no recurring income
    When I compute the suggested weekly allowance
    # 10000 / 30 * 7 = 2333
    Then the suggested weekly allowance is "R$ 2.333,00"

  @unit
  Scenario: Final week before paycheck
    Given today is "2026-05-30"
    And an income of "R$ 6.800,00" for "Marcus" every day 1
    When I compute the suggested weekly allowance
    # daysToPaycheck = 2; freeToSpend = 10000; 10000 / 2 * 7 = 35000
    Then the suggestion is capped at free-to-spend
    And the effective allowance is "R$ 10.000,00"

  @integration
  Scenario: Onboarding "done" preview surfaces the calculation
    Given the app is on the onboarding "done" screen
    When the "Home" preview is rendered
    Then the hero shows "R$ 7.715" in serif terracotta
    And the "This week" card shows "R$ 3.600"
    And the mono caption shows "R$ 7.715 ÷ 15D × 7" (transparent calc)
