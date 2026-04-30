<?php

declare(strict_types=1);

namespace Leek\FilamentHeaderFilters\Concerns;

use Filament\Forms\Components\Field;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Schema;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Filters\BaseFilter;
use Filament\Tables\Table;

/**
 * @property-read Schema $tableHeaderFiltersForm
 *
 * @mixin InteractsWithTable
 */
trait HasHeaderFilters
{
    public function bootedHasHeaderFilters(): void
    {
        $table = $this->getTable();

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
            return;
        }

        $table->pushFilters($headerFilters);

        $this->hideHeaderFilterGroupsFromPanelForm($table);

        $this->cacheSchema(
            'tableHeaderFiltersForm',
            $this->getTableHeaderFiltersForm(...),
        );

        $this->seedHeaderFilterState($headerFilters);
    }

    /**
     * @param  array<BaseFilter>  $headerFilters
     */
    protected function seedHeaderFilterState(array $headerFilters): void
    {
        $this->tableFilters ??= [];

        foreach ($headerFilters as $filter) {
            $filterName = $filter->getName();

            if (array_key_exists($filterName, $this->tableFilters)) {
                continue;
            }

            $state = [];

            foreach ($filter->getSchemaComponents() as $component) {
                if (! $component instanceof Field) {
                    continue;
                }

                $state[$component->getName()] = $component->getDefaultState();
            }

            $this->tableFilters[$filterName] = $state;
        }
    }

    public function getTableHeaderFiltersForm(): Schema
    {
        if ((! $this->isCachingSchemas) && $this->hasCachedSchema('tableHeaderFiltersForm')) {
            return $this->getSchema('tableHeaderFiltersForm');
        }

        $table = $this->getTable();

        $groups = [];

        foreach ($table->getHeaderFilters() as $filterName => $filter) {
            $components = $filter->getSchemaComponents();

            foreach ($components as $component) {
                if ($component instanceof Field) {
                    $component->hiddenLabel();
                }
            }

            $groups[] = Group::make()
                ->schema($components)
                ->statePath($filterName)
                ->key($filterName)
                ->columns($filter->getColumns())
                ->dense();
        }

        return $this->makeSchema()
            ->model($table->getModel())
            ->schema($groups)
            ->statePath('tableFilters')
            ->live();
    }

    protected function hideHeaderFilterGroupsFromPanelForm(Table $table): void
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
