<?php

declare(strict_types=1);

namespace Leek\FilamentHeaderFilters;

use Composer\InstalledVersions;
use Filament\Support\Assets\Js;
use Filament\Support\Facades\FilamentAsset;
use Illuminate\Contracts\Foundation\Application;
use Leek\FilamentHeaderFilters\Macros\RegisterMacros;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class FilamentHeaderFiltersServiceProvider extends PackageServiceProvider
{
    public static string $name = 'filament-header-filters';

    public function configurePackage(Package $package): void
    {
        $package
            ->name(static::$name)
            ->hasViews('filament-header-filters');
    }

    public function packageBooted(): void
    {
        RegisterMacros::register();

        FilamentAsset::register(
            assets: [
                Js::make('filament-header-filters', __DIR__.'/../resources/js/filament-header-filters.js'),
            ],
            package: 'leek/filament-header-filters',
        );

        $this->prependFilamentTableView();
    }

    protected function prependFilamentTableView(): void
    {
        $this->callAfterResolving('view', function ($view, Application $app): void {
            $viewsPath = __DIR__.'/../resources/views/vendor/filament-tables';

            if (is_dir($viewsPath)) {
                $view->prependNamespace('filament-tables', $viewsPath);
            }

            // Filament v5.10.2+ gets a copy of its own table view (loading
            // skeletons, the filters reset action prop, reorder a11y, …).
            // Prepended last so it wins over the base copy for `index` only;
            // `components.header-filter` still resolves from the base path.
            $viewsPath = __DIR__.'/../resources/views/vendor/filament-tables-5.10';

            if (static::usesFilament510TableView(InstalledVersions::getVersion('filament/tables')) && is_dir($viewsPath)) {
                $view->prependNamespace('filament-tables', $viewsPath);
            }
        });
    }

    /**
     * The 5.10 copy relies on table JS and translations that only ship from
     * v5.10.2 (`startTableReorder()`, `table.reordering.*`), so 5.10.0 and
     * 5.10.1 stay on the base copy. Dev branches normalize to `x.9999999…`
     * and compare as the newest release of their major.
     */
    public static function usesFilament510TableView(?string $filamentTablesVersion): bool
    {
        if (blank($filamentTablesVersion)) {
            return false;
        }

        return version_compare($filamentTablesVersion, '5.10.2', '>=');
    }
}
