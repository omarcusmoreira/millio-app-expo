# ─────────────────────────────────────────────────────────────
# Build stage:  1 — Auth + identity
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 0; user has authenticated (Stage 1 earlier scenarios).
# Screens:  ../../../screenshots/onboarding/05-identity.png
# Prototype: Onboarding.html  →  "Como te chamamos?"
# ─────────────────────────────────────────────────────────────
@onboarding @auth
Feature: Identity — first name only

  Background:
    Given the user has just authenticated

  @integration
  Scenario: Valid name enables the button
    When I type "Marcus" in the "First name" field
    Then the avatar preview shows "M" in terracotta
    And the "Continuar" button is enabled

  @integration
  Scenario: Initial is derived automatically
    When I type "Patricia"
    Then the avatar preview shows "P"
    And there is no separate "Initial" field

  @integration
  Scenario: Empty keeps the button disabled
    When the field is empty
    Then the "Continuar" button has opacity 0.4
    And does not respond to tap

  @integration
  Scenario: Accents preserved, first letter capitalized
    When I type "ana"
    Then the avatar preview shows "A"
    And on confirm, member.name stays "ana" (case of full name not changed)
    And member.initial is "A"

  @integration
  Scenario: Continue goes to setup-bills (not to the household step)
    When I type "Marcus" and tap "Continuar"
    Then navigation goes to "/onboarding/setup-bills"
    # Household is now the penultimate step, not the first
