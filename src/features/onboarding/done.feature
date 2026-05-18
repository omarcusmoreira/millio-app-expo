# ─────────────────────────────────────────────────────────────
# Build stage:  2 — Household exists
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 1 + identity + household-choice complete.
# Screens:  ../../../screenshots/onboarding/12-done.png
# Prototype: Onboarding.html  →  final screen
# ─────────────────────────────────────────────────────────────
@onboarding @core
Feature: Final screen (payoff)
  Teaches the heart of the product: the calm number + automatic weekly suggestion.
  Collects nothing. Just prepares the user for what they'll see on the Home.

  Background:
    Given the user's name is "Marcus"

  @integration
  Scenario: Solo path
    Given householdChoice is "solo"
    When I am on "/onboarding/done"
    Then the headline is "Pronto, Marcus."
    And the subtitle mentions "calcula o que vai sobrar" and "quanto você pode gastar por semana"
    And the sub emphasizes "quanto você pode gastar por semana" in ink-1

  @integration
  Scenario: Joined path has different copy
    Given householdChoice is "join"
    When I am on "/onboarding/done"
    Then the subtitle is "Você entrou no lar. O Milio já está fazendo a conta — abra pra ver."

  @integration
  Scenario: Preview surfaces the calculation
    When I am on "/onboarding/done"
    Then I see a preview card "Início · Livre pra gastar"
    And the hero shows "R$ 7.715" in serif terracotta (R$ 22, number 42)
    And the mono caption shows "PRÓXIMO EM 15D · SALÁRIO DE MARCOS"
    And I see a second preview card "Essa semana"
    And the second card's serif shows "R$ 3.600"
    And the caption shows "de R$ 3.600" (initial state spent=0)
    And the "Registrar" button is outlined terracotta
    And the progress bar is at 0%
    And the mono footer shows "R$ 0 GASTO · 0%"

  @integration
  Scenario: Week dots in pt-BR start with S (Segunda)
    # pt-BR uses S T Q Q S S D, with the first S = Monday (Segunda)
    When I am on "/onboarding/done" with the UI in "pt-BR"
    Then the week dots are ["S", "T", "Q", "Q", "S", "S", "D"]

  @integration
  Scenario: Week dots in en-US start with M
    When I am on "/onboarding/done" with the UI in "en-US"
    Then the week dots are ["M", "T", "W", "T", "F", "S", "S"]

  @integration
  Scenario: Footnote explains the formula in prose
    Then the footnote reads "O cálculo é simples: livre pra gastar dividido pelos dias até o próximo salário, vezes 7. Você ajusta se quiser."
    And right below: "Sem ansiedade. Sem culpa."

  @e2e
  Scenario: "Abrir Milio" finishes onboarding
    When I tap "Abrir Milio"
    Then the button shows "Abrindo…" and becomes disabled
    And after 240ms navigation goes to "/(app)/home"
    And the onboarding state is marked completed in storage
