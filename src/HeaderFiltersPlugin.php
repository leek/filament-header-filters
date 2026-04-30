<?php

declare(strict_types=1);

namespace Leek\FilamentHeaderFilters;

use Filament\Contracts\Plugin;
use Filament\Panel;
use Leek\FilamentHeaderFilters\Support\HeaderFilters;

class HeaderFiltersPlugin implements Plugin
{
    protected static bool $listenersRegistered = false;

    public static function make(): static
    {
        return app(static::class);
    }

    public function getId(): string
    {
        return 'leek-filament-header-filters';
    }

    public function register(Panel $panel): void
    {
        if (static::$listenersRegistered) {
            return;
        }

        static::$listenersRegistered = true;

        $apply = static function (object $component): void {
            HeaderFilters::apply($component);
        };

        \Livewire\after('mount', $apply);
        \Livewire\after('hydrate', $apply);
    }

    public function boot(Panel $panel): void
    {
        //
    }
}
