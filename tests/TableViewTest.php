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
use Livewire\LivewireServiceProvider;

it('resolves the table view to the package copy', function (): void {
    $finder = view()->getFinder();

    expect(realpath($finder->find('filament-tables::index')))
        ->toBe(realpath(__DIR__.'/../resources/views/vendor/filament-tables/index.blade.php'))
        ->and(realpath($finder->find('filament-tables::components.header-filter')))
        ->toBe(realpath(__DIR__.'/../resources/views/vendor/filament-tables/components/header-filter.blade.php'));
});

it('only differs from the installed Filament table view by the header filter edits', function (): void {
    // `diff` lines prefixed `<` come from Filament's stock view. Any stock
    // line beyond the ones the header filter edits replace means Filament
    // changed the view and the copy needs re-syncing.
    exec(sprintf(
        'diff %s %s',
        escapeshellarg(InstalledVersions::getInstallPath('filament/tables').'/resources/views/index.blade.php'),
        escapeshellarg(__DIR__.'/../resources/views/vendor/filament-tables/index.blade.php'),
    ), $output);

    $replacedStockLines = array_values(array_map(
        fn (string $line): string => trim(substr($line, 1)),
        array_filter($output, fn (string $line): bool => str_starts_with($line, '<')),
    ));

    expect($output)->not->toBeEmpty()
        ->and($replacedStockLines)->toBe([
            '$isColumnSearchVisible = $isSearchableByColumn();',
            "if (! \$columnState['isIndividuallySearchable']) {",
        ]);
});

it('compiles the table view to valid PHP', function (): void {
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

    $compiled = Blade::compileString(file_get_contents(__DIR__.'/../resources/views/vendor/filament-tables/index.blade.php'));

    $path = tempnam(sys_get_temp_dir(), 'header-filters-view');
    file_put_contents($path, $compiled);

    exec(sprintf('%s -l %s 2>&1', escapeshellarg(PHP_BINARY), escapeshellarg($path)), $output, $exitCode);
    unlink($path);

    expect($exitCode)->toBe(0, implode("\n", $output));
});
