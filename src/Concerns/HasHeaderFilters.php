<?php

declare(strict_types=1);

namespace Leek\FilamentHeaderFilters\Concerns;

use Filament\Schemas\Schema;
use Filament\Tables\Concerns\InteractsWithTable;
use Leek\FilamentHeaderFilters\Support\HeaderFilters;

/**
 * @property-read Schema $tableHeaderFiltersForm
 *
 * @mixin InteractsWithTable
 */
trait HasHeaderFilters
{
    public function bootedHasHeaderFilters(): void
    {
        HeaderFilters::apply($this);
    }

    public function getTableHeaderFiltersForm(): Schema
    {
        return HeaderFilters::form($this);
    }
}
