<?php

declare(strict_types=1);

use Filament\Support\Facades\FilamentAsset;
use Leek\FilamentHeaderFilters\FilamentHeaderFiltersServiceProvider;

it('registers the service provider', function (): void {
    expect(app()->getProviders(FilamentHeaderFiltersServiceProvider::class))
        ->not->toBeEmpty();
});

it('registers the responsive badge overflow script', function (): void {
    expect(FilamentAsset::getScriptSrc('filament-header-filters', 'leek/filament-header-filters'))
        ->not->toBeEmpty();
});
