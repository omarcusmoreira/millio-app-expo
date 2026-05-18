# ─────────────────────────────────────────────────────────────
# Build stage:  9 — Mark a bill as paid
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 6 (bills exist) + Stage 7 (Home / free-to-spend renders). Cash account from Stage 3 supplies the paid-from picker.
# Screens:  ../../../screenshots/bills/02-detail.png
# Prototype: Milio.html  →  tap a bill row → "Marcar como paga" → choose account → confirm
# ─────────────────────────────────────────────────────────────
@bills @core
Feature: Mark a bill as paid
  When I mark a bill as paid, cash drops and the bill leaves pending.
  Covers Inv-4 (marking a bill paid reduces cash) and Inv-5 (variable vs fixed).

  Background:
    Given today is "2026-05-16"
    And a household with 1 members
    And a bank account "Itaú checking" with "R$ 10.000,00" balance

  @unit @integration
  Scenario: Fixed-amount bill
    Given a bill "Rent" of "R$ 2.850,00" due "in 5 days"
    When I mark "Rent" as paid from account "Itaú checking"
    Then bill "Rent" has status "paid"
    And free-to-spend is "R$ 7.150,00"
    And a transaction of kind "bill-payment" was recorded
    And a flash "Aluguel marcada como paga" was shown

  @unit @integration
  Scenario: Variable bill paid at a value different from the estimate
    Given a variable bill "Electric" estimated at "R$ 145,00" due "in 3 days"
    When I mark "Electric" as paid from account "Itaú checking" with amount "R$ 167,80"
    Then bill "Electric" has status "paid"
    And bill "Electric" has paidAmount "R$ 167,80"
    And free-to-spend is "R$ 9.832,20"

  @unit
  Scenario: Payment cannot be zero or negative
    Given a bill "Rent" of "R$ 2.850,00" due "in 5 days"
    When I try to mark "Rent" as paid with amount "R$ 0,00"
    Then the operation is rejected with error "amountZero"

  @e2e
  Scenario: Full visual flow
    Given a bill "Internet" of "R$ 89,00" due "in 4 days"
    And the app is open on the Home screen
    When I tap "Internet" in the list
    And tap "Marcar como paga"
    And confirm with "Itaú checking"
    Then the sheet closes
    And "Internet" shows with an olive status box (paid)
    And the hero serif has updated to reflect the new free-to-spend

  @integration
  Scenario: Undoing a payment restores state
    Given a bill "Rent" of "R$ 2.850,00" due "in 5 days"
    And bill "Rent" is already paid
    When I undo the payment of "Rent"
    Then bill "Rent" has status "upcoming"
    And a reversal transaction of kind "bill-payment" with a negative amount was recorded
