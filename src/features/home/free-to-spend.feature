# ─────────────────────────────────────────────────────────────
# Build stage:  7 — Home / free-to-spend
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 3 (cash account) + Stage 5 (transactions move cashOnHand) + Stage 6 (bills supply totalPending). Without all three, the hero is meaningless.
# Screens:  ../../../screenshots/home/01-home.png
# Prototype: Milio.html  →  tab "Início" (Livre pra gastar)
# ─────────────────────────────────────────────────────────────
@home @core
Feature: Free to spend
  As a person who uses Milio
  I want to see a number that reflects what's left after my bills
  So I can spend without guilt

  Background:
    Given today is "2026-05-16"
    And a household with 1 members
    And a bank account "Itaú checking" with "R$ 10.000,00" balance
    And an income of "R$ 6.800,00" for "Marcus" every day 1

  @unit
  Scenario: No pending bills, equals cash on hand
    When I compute free-to-spend
    Then free-to-spend is "R$ 10.000,00"

  @unit
  Scenario: With pending bills, subtracts them
    Given a bill "Rent" of "R$ 2.850,00" due "in 5 days"
    And a bill "Electric" of "R$ 145,00" due "in 3 days"
    When I compute free-to-spend
    Then free-to-spend is "R$ 7.005,00"

  @unit @invariant
  Scenario: Never negative (Inv-2)
    Given a bill "Rent" of "R$ 8.000,00" due "in 5 days"
    And a bill "Health plan" of "R$ 4.500,00" due "in 10 days"
    When I compute free-to-spend
    Then free-to-spend is "R$ 0,00"
    And free-to-spend is not negative

  @unit
  Scenario: Variable bill uses estimate, not the paid amount
    Given a variable bill "Electric" estimated at "R$ 145,00" due "in 3 days"
    When I compute free-to-spend
    Then free-to-spend is "R$ 9.855,00"

  @unit
  Scenario: Paid bill drops out of subtraction
    Given a bill "Rent" of "R$ 2.850,00" due "in 5 days"
    And bill "Rent" is already paid
    When I compute free-to-spend
    Then free-to-spend is "R$ 7.150,00"

  @integration
  Scenario: Home hero displays in terracotta, pt-BR format
    Given the UI in "pt-BR"
    When I open the Home screen
    Then the hero shows "R$ 10.000" in serif terracotta
    And the text color is "#C26B4D"
    And the eyebrow shows "Livre pra gastar"
