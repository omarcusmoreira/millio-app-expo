# ─────────────────────────────────────────────────────────────
# Build stage:  1 — Auth + identity
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 0 (domain types) only.
# Screens:  ../../../screenshots/onboarding/02-method.png
#           ../../../screenshots/onboarding/03-email.png
#           ../../../screenshots/onboarding/04-magic.png
# Prototype: Onboarding.html  →  splash → method → email → magic
# ─────────────────────────────────────────────────────────────
@auth
Feature: Authentication methods

  Background:
    Given intent is "create" (signup)

  @integration
  Scenario: Method screen has every option
    When I am on "/auth/method"
    Then I see the headline "Vamos começar."
    And I see buttons:
      | Continuar com Apple   |
      | Continuar com Google  |
    And I see an "OU" separator
    And I see "Continuar com e-mail"

  @integration
  Scenario: Apple and Google jump to identity (mocked)
    When I tap "Continuar com Apple"
    Then navigation goes to "/onboarding/identity"
    And authMethod is "apple"

  @integration
  Scenario: Email opens an input
    When I tap "Continuar com e-mail"
    Then navigation goes to "/auth/email"

  @integration
  Scenario: Invalid email keeps the button disabled
    Given I am on "/auth/email"
    When I type "abc"
    Then the "Continuar" button has opacity 0.4

  @integration
  Scenario: Toggle between magic and password
    Given I am on "/auth/email"
    When I select "Usar senha"
    Then the subtitle changes to "A gente pede uma senha em seguida."
    And continuing with a valid email goes to "/auth/password"

  @integration
  Scenario: 6-digit magic code
    Given I am on "/auth/magic" with email "marcus@example.com"
    When I type "123456"
    Then the "Confirmar" button is enabled
    And tapping it goes to "/onboarding/identity"

  @integration
  Scenario: Magic with fewer than 6 digits is disabled
    Given I am on "/auth/magic"
    When I type "12345"
    Then the "Confirmar" button has opacity 0.4

  @integration
  Scenario: Signin path has different copy
    Given intent is "signin"
    When I am on "/auth/method"
    Then the headline is "Que bom te ver."
    And the subtitle is "Escolha como entrar."
