# ─────────────────────────────────────────────────────────────
# Build stage:  14 — i18n
# See ../../../build-order.md for the full dependency DAG.
#
# Prereqs:  All UI stages (every component must accept locale before this can be exercised).
# Screens:  (none — pure logic / non-visual)
# Prototype: (prototype is pt-BR only; toggle is a Stage 14 deliverable)
# ─────────────────────────────────────────────────────────────
@i18n
Feature: Locale-sensitive formatting

  # ── CURRENCY ───────────────────────────────────────────────
  @unit
  Scenario Outline: Format currency
    Given the locale is "<locale>"
    When I format the value <value>
    Then the result is "<formatted>"

    Examples:
      | locale | value      | formatted     |
      | pt-BR  | 1234.56    | R$ 1.234,56   |
      | pt-BR  | 1234       | R$ 1.234      |
      | pt-BR  | 0          | R$ 0          |
      | pt-BR  | -500       | −R$ 500       |
      | pt-BR  | 1000000    | R$ 1.000.000  |
      | en-US  | 1234.56    | $1,234.56     |
      | en-US  | 1234       | $1,234        |
      | en-US  | -500       | −$500         |

  # ── DATES ──────────────────────────────────────────────────
  @unit
  Scenario Outline: Format short date
    Given the locale is "<locale>"
    When I format the date "2026-05-15"
    Then the result is "<formatted>"

    Examples:
      | locale | formatted |
      | pt-BR  | 15 de mai |
      | en-US  | May 15    |

  # ── RELATIVE DATES ─────────────────────────────────────────
  @unit
  Scenario Outline: Format relative date
    Given the locale is "<locale>"
    And today is "2026-05-16"
    When I format the relative date "<date>"
    Then the result is "<formatted>"

    Examples:
      | locale | date       | formatted        |
      | pt-BR  | 2026-05-16 | hoje             |
      | pt-BR  | 2026-05-17 | amanhã           |
      | pt-BR  | 2026-05-15 | ontem            |
      | pt-BR  | 2026-05-19 | em 3 dias        |
      | pt-BR  | 2026-05-13 | 3 dias atrasada  |
      | pt-BR  | 2026-05-30 | 30 de mai        |
      | en-US  | 2026-05-19 | in 3 days        |
      | en-US  | 2026-05-13 | 3 days late      |

  # ── "AGO" SCALES ───────────────────────────────────────────
  @unit
  Scenario: "Ago" values on silos
    Given the locale is "pt-BR"
    When I format "3 days ago"
    Then the result is "HÁ 3D"
    When I format "2 weeks ago"
    Then the result is "HÁ 2SEM"
    When I format "4 months ago"
    Then the result is "HÁ 4M"
    When I format "2 years ago"
    Then the result is "HÁ 2A"
