<?php

declare(strict_types=1);

namespace Leek\FilamentHeaderFilters\Support;

use Filament\Forms\Components\Field;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Schema;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Filters\BaseFilter;
use Filament\Tables\Table;
use WeakMap;

class HeaderFilters
{
    protected static ?WeakMap $applied = null;

    public static function supports(mixed $component): bool
    {
        if (! is_object($component)) {
            return false;
        }

        return in_array(
            InteractsWithTable::class,
            class_uses_recursive($component),
            true,
        );
    }

    public static function apply(object $component): void
    {
        if (! self::supports($component)) {
            return;
        }

        $applied = self::$applied ??= new WeakMap;

        if ($applied[$component] ?? false) {
            return;
        }

        $table = $component->getTable();

        $headerFilters = [];

        foreach ($table->getColumns() as $column) {
            if (! $column->hasHeaderFilter()) {
                continue;
            }

            $filter = $column->getHeaderFilter();
            $filter->columnName($column->getName());

            $headerFilters[] = $filter;
        }

        if (empty($headerFilters)) {
            $applied[$component] = true;

            return;
        }

        $table->pushFilters($headerFilters);

        self::hideHeaderFilterGroupsFromPanelForm($table);

        $component->cacheSchema(
            'tableHeaderFiltersForm',
            fn (): Schema => self::buildForm($component),
        );

        self::seedState($component, $headerFilters);

        $applied[$component] = true;
    }

    public static function form(object $component): Schema
    {
        if (
            method_exists($component, 'hasCachedSchema')
            && method_exists($component, 'getSchema')
            && $component->hasCachedSchema('tableHeaderFiltersForm')
        ) {
            return $component->getSchema('tableHeaderFiltersForm');
        }

        return self::buildForm($component);
    }

    public static function buildForm(object $component): Schema
    {
        $table = $component->getTable();

        $groups = [];

        foreach ($table->getHeaderFilters() as $filterName => $filter) {
            $components = $filter->getSchemaComponents();

            foreach ($components as $c) {
                if ($c instanceof Field) {
                    $c->hiddenLabel();
                }
            }

            $groups[] = Group::make()
                ->schema($components)
                ->statePath($filterName)
                ->key($filterName)
                ->columns($filter->getColumns())
                ->dense();
        }

        return $component->makeSchema()
            ->model($table->getModel())
            ->schema($groups)
            ->statePath('tableFilters')
            ->live();
    }

    /**
     * @param  array<BaseFilter>  $headerFilters
     */
    protected static function seedState(object $component, array $headerFilters): void
    {
        $component->tableFilters ??= [];

        foreach ($headerFilters as $filter) {
            $name = $filter->getName();

            if (array_key_exists($name, $component->tableFilters)) {
                continue;
            }

            $state = [];

            foreach ($filter->getSchemaComponents() as $c) {
                if (! $c instanceof Field) {
                    continue;
                }

                $state[$c->getName()] = $c->getDefaultState();
            }

            $component->tableFilters[$name] = $state;
        }
    }

    protected static function hideHeaderFilterGroupsFromPanelForm(Table $table): void
    {
        $table->filtersFormSchema(static function (array $filters) use ($table): array {
            foreach ($filters as $filterName => $group) {
                $filter = $table->getFilter($filterName);

                if ($filter instanceof BaseFilter && $filter->isHeaderFilter()) {
                    $group->hidden()->dense();
                }
            }

            return array_values($filters);
        });
    }
}
