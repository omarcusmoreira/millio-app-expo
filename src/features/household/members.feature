# ─────────────────────────────────────────────────────────────
# Build stage:  12 — Member invite / join
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  Stage 2 (a household exists) + Stage 4 (incomes per member matter) + Stage 9 (bills can be reassigned).
# Screens:  ../../../screenshots/household/01-group.png
#           ../../../screenshots/onboarding/11-setup-lar-invite.png
# Prototype: Milio.html  →  tab "Lar" (member list, +Convidar alguém)
# ─────────────────────────────────────────────────────────────
@household
Feature: Household members

  Background:
    Given today is "2026-05-16"
    And a household with 3 members
    And a bill "Rent" of "R$ 2.850,00" due "in 5 days"
    And bill "Rent" is assigned to "Marcus"
    And a bill "Piano" of "R$ 240,00" due "yesterday"
    And bill "Piano" is assigned to "Patricia"

  @integration
  Scenario: Member list shows pending status
    When I open the "Lar" tab
    Then I see:
      | name     | status                  | dot         |
      | Marcus   | 1 pendente · R$ 2.850   | terracotta  |
      | Patricia | 1 pendente · R$ 240     | terracotta  |
      | Sofia    | 0 contas · tudo certo   | olive       |

  @integration
  Scenario: Tap on a member opens their profile
    When I tap "Marcus"
    Then navigation goes to "/member/m1"
    And I see the large avatar, name, and monthly income of Marcus

  @unit @invariant
  Scenario: Inv-10 — Removing a member reassigns bills
    Given member "Patricia" is about to be removed
    When I confirm the removal
    Then bill "Piano" is reassigned to the first remaining member
    And no bill is left orphan (assigneeId === null)

  @unit
  Scenario: Inv-10 (edge) — Last member leaves → household archived
    Given a household with 1 member "Marcus"
    When "Marcus" leaves the household
    Then the household is archived (Household.archivedAt is set)
    But bills keep their existing assigneeId

  @integration
  Scenario: Invite generates a MILIO-prefixed code
    When I tap "Convidar alguém"
    Then the sheet opens
    And generates a code in format "MILIO-XXX-XXXX"
    And generates a link "milio.app/i/..."
    And shows a QR code
