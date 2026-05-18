# ─────────────────────────────────────────────────────────────
# Build stage:  2 — Household exists (solo path) — invite/join paths gate on Stage 12.
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 1 + identity.
# Screens:  ../../../screenshots/onboarding/09-setup-lar.png
#           ../../../screenshots/onboarding/10-setup-lar-name.png
#           ../../../screenshots/onboarding/11-setup-lar-invite.png
# Prototype: Onboarding.html  →  step 4/4 (Seu lar)
# ─────────────────────────────────────────────────────────────
@onboarding @household
Feature: Household choice (penultimate step)
  The "want to share?" question comes AFTER teaching the product, so we don't
  give the impression Milio is only for families.

  Background:
    Given the user has completed onboarding steps 1-3
    And is on "setup-household"

  @integration
  Scenario: Three options available
    Then I see 3 cards:
      | title                        | subtitle                                                |
      | Criar um lar e convidar      | Pra casais, famílias e roommates. Convide o resto depois. |
      | Entrar num lar               | Use o código de convite que alguém te mandou.           |
      | Por enquanto, só eu          | Orçamento solo. Você pode convidar gente depois.        |

  @integration
  Scenario: "Por enquanto, só eu" jumps straight to done
    When I tap "Por enquanto, só eu"
    Then navigation goes to "/onboarding/done"
    And householdChoice is "solo"
    And the created household has 1 member

  @integration
  Scenario: "Criar um lar" goes to naming
    When I tap "Criar um lar e convidar"
    Then navigation goes to "/onboarding/setup-household-name"
    And householdChoice is "create"

  @integration
  Scenario: "Entrar num lar" goes to join
    When I tap "Entrar num lar"
    Then navigation goes to "/onboarding/setup-household-join"
    And householdChoice is "join"

  @integration
  Scenario: Default name uses the user's first name
    Given the user's name is "Marcus"
    When I am on "setup-household-name"
    Then the field placeholder is "Lar dos Marcus"
    And there is a "Deixar o padrão" link

  @integration
  Scenario: Invite shows QR + code + link
    When I reach "setup-household-invite"
    Then I see a QR placeholder with a terracotta dot in the center
    And I see a row "Código MILIO-742-CORN" with a "Copiar" button
    And I see a row "Link milio.app/i/742corn" with a "Copiar" button
    And there is a "Convido depois" link

  @integration
  Scenario: Copy shows a temporary confirmation
    When I tap "Copiar" on the code
    Then the button changes to "Copiado ✓" in olive
    And reverts to "Copiar" after 1500ms

  @integration
  Scenario: Join with a valid code enables the button
    When I paste "MILIO-742-CORN"
    Then a household preview appears with "Lar dos Carvalho · 3 MEMBROS"
    And the button reads "Entrar no Lar dos Carvalho"

  @integration
  Scenario: Join with an invalid code shows the error
    When I paste "ABC-123"
    Then the button is disabled
    And "Código não reconhecido. Confirme com quem te mandou." appears in terracotta
