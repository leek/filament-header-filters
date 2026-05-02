<?php

declare(strict_types=1);

use Filament\Forms\Components\Select;
use Filament\Tables\Filters\BaseFilter;
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
