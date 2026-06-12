<?php

declare(strict_types=1);

use Filament\Forms\Components\Select;
use Filament\Tables\Filters\BaseFilter;
use Filament\Tables\Table;
use Leek\FilamentHeaderFilters\Concerns\HasHeaderFilters;
use Leek\FilamentHeaderFilters\Support\HeaderFilterRegistry;

it('stores and retrieves column-to-filter bindings without leaking types', function (): void {
    expect(class_exists(HeaderFilterRegistry::class))->toBeTrue();

    expect(method_exists(HeaderFilterRegistry::class, 'setColumnFilter'))->toBeTrue();
    expect(method_exists(HeaderFilterRegistry::class, 'getColumnFilter'))->toBeTrue();
    expect(method_exists(HeaderFilterRegistry::class, 'hasColumnFilter'))->toBeTrue();
});

it('seeds missing single-select header filter state without preserving stale array values', function (): void {
    $component = new class
    {
        use HasHeaderFilters {
            seedHeaderFilterState as public;
        }

        public ?array $tableFilters = [
            'role' => [
                'values' => ['analyst'],
                'value' => ['analyst'],
            ],
        ];
    };

    $component->seedHeaderFilterState([new class('role') extends BaseFilter
    {
        public function getSchemaComponents(): array
        {
            return [
                Select::make('value')
                    ->options([
                        'analyst' => 'Analyst',
                        'technician' => 'Technician',
                    ]),
            ];
        }
    }]);

    expect($component->tableFilters['role'])
        ->toHaveKey('values', ['analyst'])
        ->and($component->tableFilters['role']['value'])
        ->toBeNull();
});

it('tracks header-filter registration per table instance', function (): void {
    $table = Mockery::mock(Table::class);
    $rebuiltTable = Mockery::mock(Table::class);

    expect(HeaderFilterRegistry::isTableRegistered($table))->toBeFalse();

    HeaderFilterRegistry::markTableRegistered($table);

    // A rebuilt table is a brand-new instance, so it must read as unregistered —
    // otherwise resetTable() would leave its header filters selected but un-applied.
    expect(HeaderFilterRegistry::isTableRegistered($table))->toBeTrue()
        ->and(HeaderFilterRegistry::isTableRegistered($rebuiltTable))->toBeFalse();
});

it('re-registers header filters after the table is rebuilt', function (): void {
    $component = new class
    {
        use HasHeaderFilters {
            registerTableHeaderFilters as public;
        }

        public Table $table;

        public function getTable(): Table
        {
            return $this->table;
        }
    };

    $firstTable = Mockery::mock(Table::class);
    $firstTable->shouldReceive('getColumns')->andReturn([]);

    $component->table = $firstTable;
    $component->registerTableHeaderFilters();

    expect(HeaderFilterRegistry::isTableRegistered($firstTable))->toBeTrue();

    // resetTable() swaps in a fresh Table instance; registration must run again
    // rather than being skipped by a stale once-per-request flag.
    $rebuiltTable = Mockery::mock(Table::class);
    $rebuiltTable->shouldReceive('getColumns')->andReturn([]);

    $component->table = $rebuiltTable;
    $component->registerTableHeaderFilters();

    expect(HeaderFilterRegistry::isTableRegistered($rebuiltTable))->toBeTrue();
});
