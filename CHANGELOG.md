# Changelog

All notable changes to `filament-header-filters` will be documented in this file.

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
