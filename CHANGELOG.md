# Changelog

All notable changes to `filament-header-filters` will be documented in this file.

## v2.0.9 - 2026-07-01

### Fixed
- **Responsive Multi-Select Header Filters** — Multi-select header filters now keep every selected badge that fits in the header control and collapse only the true overflow into a badge-styled `+N` count. The count width is included during measurement, so wider counts do not create a second overflow after layout.
