<?php

declare(strict_types=1);

use Composer\InstalledVersions;
use Filament\Actions\ActionsServiceProvider;
use Filament\Forms\FormsServiceProvider;
use Filament\Infolists\InfolistsServiceProvider;
use Filament\Notifications\NotificationsServiceProvider;
use Filament\Schemas\SchemasServiceProvider;
use Filament\Support\SupportServiceProvider;
use Filament\Tables\TablesServiceProvider;
use Filament\Widgets\WidgetsServiceProvider;
use Illuminate\Support\Facades\Blade;
use Leek\FilamentHeaderFilters\FilamentHeaderFiltersServiceProvider;
use Livewire\LivewireServiceProvider;

it('uses the 5.10 table view from filament/tables v5.10.2', function (?string $version, bool $expected): void {
    expect(FilamentHeaderFiltersServiceProvider::usesFilament510TableView($version))->toBe($expected);
})->with([
    'not installed' => [null, false],
    'v4.10.0' => ['4.10.0.0', false],
    'v5.4.1' => ['5.4.1.0', false],
    'v5.10.1' => ['5.10.1.0', false],
    'v5.10.2' => ['5.10.2.0', true],
    'v5.11.0' => ['5.11.0.0', true],
    '5.x-dev' => ['5.9999999.9999999.9999999-dev', true],
    '4.x-dev' => ['4.9999999.9999999.9999999-dev', false],
]);

it('resolves the table view for the installed Filament version', function (): void {
    $finder = view()->getFinder();

    $expectedDirectory = FilamentHeaderFiltersServiceProvider::usesFilament510TableView(InstalledVersions::getVersion('filament/tables'))
        ? 'filament-tables-5.10'
        : 'filament-tables';

    expect(realpath($finder->find('filament-tables::index')))
        ->toBe(realpath(__DIR__."/../resources/views/vendor/{$expectedDirectory}/index.blade.php"))
        // The header filter component lives in the base copy only.
        ->and(realpath($finder->find('filament-tables::components.header-filter')))
        ->toBe(realpath(__DIR__.'/../resources/views/vendor/filament-tables/components/header-filter.blade.php'));
});

it('compiles every table view copy to valid PHP', function (string $directory): void {
    // Compiling resolves every `<x-filament…>` tag, so Filament's own view
    // namespaces have to be registered.
    foreach ([
        LivewireServiceProvider::class,
        SupportServiceProvider::class,
        ActionsServiceProvider::class,
        FormsServiceProvider::class,
        InfolistsServiceProvider::class,
        NotificationsServiceProvider::class,
        SchemasServiceProvider::class,
        TablesServiceProvider::class,
        WidgetsServiceProvider::class,
    ] as $provider) {
        app()->register($provider);
    }

    $compiled = Blade::compileString(file_get_contents(__DIR__."/../resources/views/vendor/{$directory}/index.blade.php"));

    $path = tempnam(sys_get_temp_dir(), 'header-filters-view');
    file_put_contents($path, $compiled);

    exec(sprintf('%s -l %s 2>&1', escapeshellarg(PHP_BINARY), escapeshellarg($path)), $output, $exitCode);
    unlink($path);

    expect($exitCode)->toBe(0, implode("\n", $output));
})->with(['filament-tables', 'filament-tables-5.10']);
