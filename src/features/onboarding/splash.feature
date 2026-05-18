# ─────────────────────────────────────────────────────────────
# Build stage:  1 — Auth + identity
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 0.
# Screens:  ../../../screenshots/onboarding/01-splash.png
# Prototype: Onboarding.html  →  initial screen
# ─────────────────────────────────────────────────────────────
@onboarding
Feature: Splash screen
  The first screen. Sells the promise, not the features.

  @integration
  Scenario: Content
    Given the UI in "pt-BR"
    When I open the app for the first time
    Then I see the "Milio" wordmark with a terracotta dot
    And I see the headline in two lines:
      | Planejar sem ansiedade. |
      | Gastar sem culpa.       |
    And "Gastar sem culpa." is in terracotta
    And I see the primary button "Começar"
    And I see the secondary link "Já tenho conta"

  @integration
  Scenario: en-US version
    Given the UI in "en-US"
    When I open the app
    Then I see the headline:
      | Plan without anxiety. |
      | Spend without guilt.  |

  @integration
  Scenario: Tap "Começar" goes to auth method with intent "create"
    When I tap "Começar"
    Then navigation goes to "/auth/method"
    And the stored intent is "create"

  @integration
  Scenario: Tap "Já tenho conta" goes with intent "signin"
    When I tap "Já tenho conta"
    Then navigation goes to "/auth/method"
    And the stored intent is "signin"
