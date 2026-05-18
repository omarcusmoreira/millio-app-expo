# ─────────────────────────────────────────────────────────────
# Build stage:  2 — Household exists (setup taxonomy follows the household).
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 2 onboarding complete. The household entity exists and contains 1 member.
# Screens:  ../../../screenshots/household/01-group.png
# Prototype: Milio.html  →  tab "Lar"
# ─────────────────────────────────────────────────────────────
@household @setup
Feature: Setup — categories, labels, bank accounts

  Background:
    Given a household with 1 members
    And I am on the "Lar" tab

  # ── CATEGORIES ─────────────────────────────────────────────
  @integration
  Scenario: Create a category
    When I go to "Categorias"
    And tap "Nova categoria"
    And fill in name "Mercado" and color "olive"
    And save
    Then a category "Mercado" with color "olive" exists
    And a flash "Categoria adicionada" was shown

  @integration
  Scenario: Show usage count
    Given a category "Mercado" with 3 associated transactions
    When I see the category in the list
    Then the meta shows "3 usos"

  @unit @invariant
  Scenario: Inv-14 — Set with no duplicates
    Given a bill with tags ["Casa", "Casa", "Filhos"]
    When the bill is saved
    Then the persisted tags are ["Casa", "Filhos"]

  # ── LABELS ─────────────────────────────────────────────────
  @integration
  Scenario: Labels are chips without color
    When I go to "Etiquetas"
    Then labels appear as outlined chips with no dot
    And there is no color picker

  # ── BANK ACCOUNTS ──────────────────────────────────────────
  @integration
  Scenario: Create a bank account
    When I go to "Contas bancárias"
    And add "Nubank conjunta" with last4 "9088" and owner "Patricia"
    Then the account exists
    And the shown avatar is Patricia's

  @unit
  Scenario: Last4 accepts digits only
    When I type "abcd1234" in the last4 field
    Then the saved value is "1234"
    And the field shows "1234"
