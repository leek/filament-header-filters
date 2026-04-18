<?php

declare(strict_types=1);

namespace Leek\FilamentHeaderFilters\Support;

use Filament\Tables\Columns\Column;
use Filament\Tables\Filters\BaseFilter;
use WeakMap;

class HeaderFilterRegistry
{
    /** @var WeakMap<Column, BaseFilter>|null */
    protected static ?WeakMap $columnFilters = null;

    /** @var WeakMap<BaseFilter, string>|null */
    protected static ?WeakMap $filterColumnNames = null;

    public static function setColumnFilter(Column $column, ?BaseFilter $filter): void
    {
        self::$columnFilters ??= new WeakMap;

        if ($filter === null) {
            unset(self::$columnFilters[$column]);

            return;
        }

        self::$columnFilters[$column] = $filter;
    }

    public static function getColumnFilter(Column $column): ?BaseFilter
    {
        return self::$columnFilters[$column] ?? null;
    }

    public static function hasColumnFilter(Column $column): bool
    {
        return isset(self::$columnFilters[$column]);
    }

    public static function setFilterColumnName(BaseFilter $filter, ?string $name): void
    {
        self::$filterColumnNames ??= new WeakMap;

        if ($name === null) {
            unset(self::$filterColumnNames[$filter]);

            return;
        }

        self::$filterColumnNames[$filter] = $name;
    }

    public static function getFilterColumnName(BaseFilter $filter): ?string
    {
        return self::$filterColumnNames[$filter] ?? null;
    }
}
