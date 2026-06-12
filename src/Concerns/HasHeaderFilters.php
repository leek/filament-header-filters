<?php

declare(strict_types=1);

namespace Leek\FilamentHeaderFilters\Concerns;

use Filament\Forms\Components\Field;
use Filament\Forms\Components\Select;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Schema;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Filters\BaseFilter;
use Filament\Tables\Table;
use Leek\FilamentHeaderFilters\Support\HeaderFilterRegistry;

/**
 * @property-read Schema $tableHeaderFiltersForm
 *
 * @mixin InteractsWithTable
 */
trait HasHeaderFilters
{
    public function bootedHasHeaderFilters(): void
    {
        $this->registerTableHeaderFilters();
    }

    public function renderingHasHeaderFilters(): void
    {
        $this->registerTableHeaderFilters();
    }

    protected function registerTableHeaderFilters(): void
    {
        if (! $this->hasInitializedTableForHeaderFilters()) {
            return;
        }

        $table = $this->getTable();

        // Registration is tracked per Table instance, not via a once-per-request flag:
        // resetTable() rebuilds the table from scratch (a new instance) and drops the
        // filters pushed below, so a flag would leave them selected but un-applied.
        if (HeaderFilterRegistry::isTableRegistered($table)) {
            return;
        }

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
            HeaderFilterRegistry::markTableRegistered($table);

            return;
        }

        $table->pushFilters($headerFilters);

        $this->hideHeaderFilterGroupsFromPanelForm($table);

        $this->cacheSchema(
            'tableHeaderFiltersForm',
            $this->getTableHeaderFiltersForm(...),
        );

        $this->seedHeaderFilterState($headerFilters);

        HeaderFilterRegistry::markTableRegistered($table);
    }

    protected function hasInitializedTableForHeaderFilters(): bool
    {
        return isset($this->table);
    }

    /**
     * @param  array<BaseFilter>  $headerFilters
     */
    protected function seedHeaderFilterState(array $headerFilters): void
    {
        $this->tableFilters ??= [];

        foreach ($headerFilters as $filter) {
            $filterName = $filter->getName();
            $state = $this->tableFilters[$filterName] ?? [];

            if (! is_array($state)) {
                $state = [];
            }

            foreach ($filter->getSchemaComponents() as $component) {
                if (! $component instanceof Field) {
                    continue;
                }

                $fieldName = $component->getName();

                if (! array_key_exists($fieldName, $state)) {
                    $state[$fieldName] = $component->getDefaultState();
                }

                if ($component instanceof Select && (! $component->isMultiple()) && is_array($state[$fieldName])) {
                    $state[$fieldName] = null;
                }
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
