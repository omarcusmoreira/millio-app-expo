# Milio — UI Checklist

Items remaining before feature-complete on the current set of screens.
Check off each item as it lands.

---

## Pending

- [x] **Profile / member page** — `app/member/[id].tsx` showing member's recurring
  incomes and current-month assigned bills. Household member rows tap to navigate,
  with ChevronRight disclosure indicator.

- [x] **Add modal — action kinds** — 4 cards: Despesa → Renda → (divider) → Nova conta →
  Novo silo. Transfer and Atualizar silo deferred. `addTransaction` added to store.

- [x] **Home "Essa semana" card — weekday dots** — the prototype shows `S T Q Q S S D`
  in the top-right of the allowance card, with the current day's initial accented
  (terracotta, bolder). Currently absent from `AllowanceCard.tsx`.

- [x] **BillItem assignee alignment** — `rightCol` now uses `alignSelf: stretch` +
  `justifyContent: space-between` so Money aligns with the name and Avatar aligns
  with the meta row. Home screen now passes `assignee` to `BillItem`.

---

## Done

- [x] Month navigation on bills screen (Mar → Apr → May → Jun → Jul mock data)
- [x] Categories / labels as pills on home screen bill rows
- [x] Category + label pickers in NewBillSheet (single-select)
- [x] Copy: "Valor variável" (was "Valor varia a cada vez")
- [x] Recurrence overhaul: inline date picker + monthly toggle + installments count
- [x] Bills screen header: title row + month nav + PENDENTE / PAGO stats
- [x] Bills screen filter: segmented control (surfaceSoft bg, white active fill)
- [x] Silos screen header: Silos h1 + NÃO GASTÁVEL mono + KPI block
- [x] Household screen header: MEU LAR eyebrow + household name h1
- [x] StatusBox: white check icon for paid state
- [x] BillItem: assignee avatar below amount in right column
- [x] Tab bar: square add button (48×48, borderRadius 12) centered in slot
