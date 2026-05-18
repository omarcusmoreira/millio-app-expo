# ─────────────────────────────────────────────────────────────
# Build stage:  14 — i18n
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  All UI stages.
# Screens:  (none — pure logic / non-visual)
# Prototype: (prototype is pt-BR only)
# ─────────────────────────────────────────────────────────────
@i18n @core
Feature: Locale switch

  @integration
  Scenario: Default is pt-BR
    Given a fresh install
    When I open the app
    Then the UI is in "pt-BR"

  @integration
  Scenario: Switching to en-US preserves data
    Given the UI in "pt-BR"
    And a household with 1 members
    And a bill "Rent" of "R$ 2.850,00" due "in 5 days"
    When I switch the UI to "en-US"
    Then the "Contas" tab now reads "Bills"
    And "Rent" stays as "Rent" (user-entered data, not translated)
    And the value shows "$2,850.00" (US format)
    And free-to-spend is the same number

  @integration
  Scenario: Switching back to pt-BR restores labels
    Given the UI in "en-US"
    When I switch the UI to "pt-BR"
    Then the tab reverts to "Contas"

  @unit @invariant
  Scenario: Inv-12 — Keyset parity
    When I load messages.pt-BR.json and messages.en-US.json
    Then the keysets are identical
    And no key used in code is missing from either locale

  @unit
  Scenario: Plural rules — "1 pendente" vs "3 pendentes"
    Given the UI in "pt-BR"
    When there is 1 pending bill
    Then the text reads "1 pendente"
    When there are 3 pending bills
    Then the text reads "3 pendentes"
