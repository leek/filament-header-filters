<?php

declare(strict_types=1);

namespace Leek\FilamentHeaderFilters\Macros;

use Filament\Tables\Columns\Column;
use Filament\Tables\Filters\BaseFilter;
use Filament\Tables\Table;
use Leek\FilamentHeaderFilters\Support\HeaderFilterRegistry;

class RegisterMacros
{
    public static function register(): void
    {
        self::registerColumnMacros();
        self::registerFilterMacros();
        self::registerTableMacros();
    }

    protected static function registerColumnMacros(): void
    {
        Column::macro('headerFilter', function (?BaseFilter $filter): Column {
            /** @var Column $this */
            HeaderFilterRegistry::setColumnFilter($this, $filter);

            if ($filter !== null) {
                HeaderFilterRegistry::setFilterColumnName($filter, $this->getName());
            }

            return $this;
        });

        Column::macro('getHeaderFilter', function (): ?BaseFilter {
            /** @var Column $this */
            return HeaderFilterRegistry::getColumnFilter($this);
        });

        Column::macro('hasHeaderFilter', function (): bool {
            /** @var Column $this */
            return HeaderFilterRegistry::hasColumnFilter($this);
        });
    }

    protected static function registerFilterMacros(): void
    {
        BaseFilter::macro('columnName', function (?string $name): BaseFilter {
            /** @var BaseFilter $this */
            HeaderFilterRegistry::setFilterColumnName($this, $name);

            return $this;
        });

        BaseFilter::macro('getColumnName', function (): ?string {
            /** @var BaseFilter $this */
            return HeaderFilterRegistry::getFilterColumnName($this);
        });

        BaseFilter::macro('isHeaderFilter', function (): bool {
            /** @var BaseFilter $this */
            return filled(HeaderFilterRegistry::getFilterColumnName($this));
        });
    }

    protected static function registerTableMacros(): void
    {
        Table::macro('getHeaderFilters', function (): array {
            /** @var Table $this */
            $headerFilters = [];

            foreach ($this->getColumns() as $column) {
                if (! $column->hasHeaderFilter()) {
                    continue;
                }

                if ($column->isHidden()) {
                    continue;
                }

                $filter = $column->getHeaderFilter();

                if (! $filter->isVisible()) {
                    continue;
                }

                $headerFilters[$filter->getName()] = $filter;
            }

            return $headerFilters;
        });

        Table::macro('hasHeaderFilters', function (): bool {
            /** @var Table $this */
            return count($this->getHeaderFilters()) > 0;
        });
    }
}
