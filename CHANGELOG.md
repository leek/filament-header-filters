# Changelog

All notable changes to `filament-header-filters` will be documented in this file.

## v3.0.0 - 2026-10-20

### Breaking
- **Requires Filament v5.10.x (v5.10.3 or later)** — The package replaces Filament's `filament-tables::index` view with a copy that adds the header filter row. Filament changes that view in almost every release, so one copy can't serve every version. v3 ships a copy of the v5.10.3 view and requires `filament/filament: ~5.10.3`. Stay on v2.x for Filament v4.x and earlier v5.x versions.

### Fixed
- **Tables lost every table view feature added since Filament v5.4** — The v2.x view was a copy of Filament v5.4's, so on newer Filament versions every table (with or without header filters) lost `loadingSkeleton()` markup, the filters panel's Reset button (the filters component now takes a `resetAction` prop) and the v5.10 reorder accessibility. The new copy keeps all of it. Its `data-search-hidden-at` breakpoint calculation also counts header filter columns, so the column search row isn't hidden on tables whose header filter columns have no individual search. (#9, thanks @zvizvi)

## v2.0.27 - 2026-10-09

### Fixed
- **Checking a multi-select option scrolled the dropdown back to the top** — The checkbox enhancement keeps selected options in the list, but toggling one rebuilt the list (resetting the dropdown's scroll) and Filament's `maintainFocusInMultipleMode()` then focused — and scrolled to — the *first* selected option, since it expects selected options to leave the list. Toggling now keeps the dropdown's scroll position and focuses the option that was toggled.

## v2.0.26 - 2026-09-09

### Fixed
- **Every inline style write on the page forced a full-document style recalculation** — The v2.0.24 rule that hides a header filter's empty `.fi-grid-col` wrapper in the filters panel matched the Group through `:has(> .fi-sc-component[style*="display"][style*="none"])`. Blink services `:has()` arguments keyed on the `style` attribute by re-styling the ancestor chain of *any* element whose inline style changes — from `body`, the whole document — so each Alpine `x-show`, transition, tooltip or notification init cost ~90ms on a large page (a 100-card kanban board froze for ~9s while its notification bell loaded 50 rows). The hidden Group now also carries a `fi-ta-header-filter-panel-group` class and the wrapper rule matches that class instead; the inline `display: none` stays, so `removeTableFilter()` behaviour is unchanged.

## v2.0.25 - 2026-08-21

### Fixed
- **Table toolbar dropdowns rendered beneath header filters** — Because header filter cells and rows use `z-index: 20` to stack above body rows, dropdowns from the preceding table header toolbar (`.fi-ta-header-ctn`), such as the column toggle/manager or table-level filter menus, were layered underneath header filter inputs. The table header container is now elevated to `z-index: 30` with `position: relative`. (#7, thanks @mdepablo)

## v2.0.24 - 2026-07-20

### Fixed
- **Empty grid rows in the table filters panel** — The v2.0.23 fix CSS-hides each header filter's `Group` inside the table's own filters form, but Filament's schema renderer wraps every top-level schema component in its own `.fi-grid-col` grid item, which still occupied a grid row (and a `row-gap`) per header filter. With several `withHeaderFilter()` columns, these empty rows pushed the "Apply filters" button down by a large, unexplained gap. New CSS rules — scoped to Filament's filters wrappers across every layout (dropdown, modal, and above/below/before/after-content) — now hide the empty `.fi-grid-col` wrapper too. No PHP changes, so `removeTableFilter()` keeps working as fixed in v2.0.23. (#5, thanks @x-adam)

## v2.0.23 - 2026-07-17

### Fixed
- **Filter indicator remove button was a no-op** — Removing a header filter via the ✕ on its "Active filters" indicator badge never cleared the filter's state, so the filter (including any `->default()`) could not be dismissed. Two causes: Filament caches the panel filters form in `bootedInteractsWithTable()` *before* the header filters are pushed onto the table, so `removeTableFilter()` looked the filter up in a schema that didn't contain it; and the panel-form groups for header filters were schema-`hidden()`, which also makes them invisible to `getComponentByStatePath()`. The panel filters form is now re-cached after header filters register, and their panel groups are CSS-hidden instead of schema-hidden so Filament can find and reset their fields.

## v2.0.21 - 2026-07-07

### Fixed
- **Placeholder / value overlapping the chevron** — In a narrow header column, a single-line select placeholder or value longer than the available width overflowed the button's reserved chevron padding and rendered *under* the dropdown caret. The value container now clips its overflow and the value label / placeholder ellipsise, so the text stays clear of the caret.

## v2.0.19 - 2026-07-02

### Fixed
- **Responsive Multi-Select Unselecting** — Multi-select header filters now keep selected options visible in the dropdown with checkbox indicators, so selected values can be toggled off without using the selected-value badge. Collapsed overflow badges now include a clear button on the `+N` badge to remove hidden selections, and option rows/checkboxes use pointer cursors on hover.
- **Responsive Overflow Performance** — Badge measurements are cached and calculated from prefix sums so responsive overflow recalculation avoids repeated DOM measurement work during resize and Livewire morphs.

## v2.0.9 - 2026-07-01

### Fixed
- **Responsive Multi-Select Header Filters** — Multi-select header filters now keep every selected badge that fits in the header control and collapse only the true overflow into a badge-styled `+N` count. The count width is included during measurement, so wider counts do not create a second overflow after layout.
