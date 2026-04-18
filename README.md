# Filament Header Filters

[![Latest Version on Packagist](https://img.shields.io/packagist/v/leek/filament-header-filters.svg?style=flat-square)](https://packagist.org/packages/leek/filament-header-filters)
[![Total Downloads](https://img.shields.io/packagist/dt/leek/filament-header-filters.svg?style=flat-square)](https://packagist.org/packages/leek/filament-header-filters)

Inline header filters for [Filament](https://filamentphp.com/) tables. Attach any `BaseFilter` to a column header — select dropdowns, date pickers, custom schemas — as a richer alternative to `searchable(isIndividual: true)`.

This package is a free port of [filamentphp/filament#19432](https://github.com/filamentphp/filament/pull/19432).

## Requirements

- PHP 8.2+
- Filament v4.x or v5.x

## Installation

```bash
composer require leek/filament-header-filters
```

Add the `HasHeaderFilters` trait to any Livewire component that uses `InteractsWithTable` (pages, resource list pages, custom Livewire table components):

```php
use Filament\Resources\Pages\ListRecords;
use Leek\FilamentHeaderFilters\Concerns\HasHeaderFilters;

class ListOrders extends ListRecords
{
    use HasHeaderFilters;
}
```

## Usage

Call `->headerFilter()` on any column, passing any filter instance:

```php
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

TextColumn::make('status')
    ->headerFilter(
        SelectFilter::make('status')
            ->options([
                'draft' => 'Draft',
                'published' => 'Published',
            ])
            ->native(false)
    )
```

### Custom filter schemas

Use `->columns()` to place multiple fields side-by-side. Useful for numeric or date ranges:

```php
use Filament\Forms\Components\TextInput;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Illuminate\Database\Eloquent\Builder;

TextColumn::make('price')
    ->headerFilter(
        Filter::make('price')
            ->columns(2)
            ->schema([
                TextInput::make('min')->numeric()->placeholder('Min'),
                TextInput::make('max')->numeric()->placeholder('Max'),
            ])
            ->query(fn (Builder $query, array $data) => $query
                ->when($data['min'] ?? null, fn ($q, $v) => $q->where('price', '>=', $v))
                ->when($data['max'] ?? null, fn ($q, $v) => $q->where('price', '<=', $v))
            )
    )
```

## Behavior

- Header filters share state with panel filters (`$tableFilters`). Filter indicators, reset, and session persistence all work.
- Header filters are always live — they apply immediately on change, regardless of `deferFilters()`.
- Field labels inside header filters are auto-hidden; the column header acts as the label.
- Hidden columns' header filters are not applied to the query.

## How it works

The package ships:

- `Column::macro('headerFilter', ...)`, `getHeaderFilter()`, `hasHeaderFilter()`
- `BaseFilter::macro('columnName', ...)`, `getColumnName()`, `isHeaderFilter()`
- `Table::macro('getHeaderFilters', ...)`, `hasHeaderFilters()`
- A `HasHeaderFilters` Livewire trait that wires filters into the table and exposes `getTableHeaderFiltersForm()`
- A view override (`filament-tables::index`) that renders the header filter row under the column search row

The view override is a patched copy of Filament's table view. If you upgrade Filament and something breaks, please open an issue.

## Testing

```bash
composer test
```

## License

MIT. See [LICENSE.md](LICENSE.md).
