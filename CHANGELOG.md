# Changelog

All notable changes to `filament-header-filters` will be documented in this file.

## v2.0.19 - 2026-07-02

### Fixed
- **Responsive Multi-Select Unselecting** — Multi-select header filters now keep selected options visible in the dropdown with checkbox indicators, so selected values can be toggled off without using the selected-value badge. Collapsed overflow badges now include a clear button on the `+N` badge to remove hidden selections, and option rows/checkboxes use pointer cursors on hover.
- **Responsive Overflow Performance** — Badge measurements are cached and calculated from prefix sums so responsive overflow recalculation avoids repeated DOM measurement work during resize and Livewire morphs.

## v2.0.9 - 2026-07-01

### Fixed
- **Responsive Multi-Select Header Filters** — Multi-select header filters now keep every selected badge that fits in the header control and collapse only the true overflow into a badge-styled `+N` count. The count width is included during measurement, so wider counts do not create a second overflow after layout.
