/**
 * Filament Header Filters — JavaScript enhancements
 *
 * Features:
 * 1. Responsive Multi-Select Badge Overflow — show +N only when badges run out of space
 */

// ==========================================================================
// Responsive Multi-Select Badge Overflow
// ==========================================================================

;(function () {
    const namespace = 'FilamentResponsiveBadgeOverflow';

    function createResponsiveBadgeOverflow() {
        const selectors = new Set();
        const observedContainers = new WeakSet();
        const overflowBadgeClass = 'fi-select-input-overflow-count-badge';
        const hiddenBadgeClass = 'fi-select-input-overflow-hidden-badge';
        const containerClass = 'fi-select-input-responsive-overflow';
        const hasOverflowClass = 'fi-select-input-has-overflow-badge';

        let isScheduled = false;
        let measurementRoot = null;
        let mutationObserver = null;
        let resizeObserver = null;

        function ensureOverflowBadge(container) {
            let overflowBadge = container.querySelector(`:scope > .${overflowBadgeClass}`);

            if (overflowBadge) {
                return overflowBadge;
            }

            overflowBadge = document.createElement('span');
            overflowBadge.className = [
                'fi-badge',
                'fi-size-md',
                'fi-color',
                'fi-color-primary',
                'fi-text-color-600',
                'dark:fi-text-color-200',
                overflowBadgeClass,
                hiddenBadgeClass,
            ].join(' ');
            overflowBadge.innerHTML = '<span class="fi-badge-label-ctn"><span class="fi-badge-label"></span></span>';

            container.appendChild(overflowBadge);

            return overflowBadge;
        }

        function updateOverflowBadge(overflowBadge, overflowCount) {
            const label = overflowBadge.querySelector('.fi-badge-label');
            const text = `+${overflowCount}`;

            if (label && label.textContent !== text) {
                label.textContent = text;
            }

            overflowBadge.setAttribute('aria-label', `${overflowCount} more selected`);
        }

        function restoreRemoveButton(removeButton) {
            if (!Object.prototype.hasOwnProperty.call(removeButton.dataset, 'responsiveOverflowTabIndex')) {
                return;
            }

            const tabIndex = removeButton.dataset.responsiveOverflowTabIndex;

            if (tabIndex === '') {
                removeButton.removeAttribute('tabindex');
            } else {
                removeButton.setAttribute('tabindex', tabIndex);
            }

            delete removeButton.dataset.responsiveOverflowTabIndex;
        }

        function setBadgeHidden(badge, isHidden) {
            const wasHidden = badge.classList.contains(hiddenBadgeClass);

            if (wasHidden !== isHidden) {
                badge.classList.toggle(hiddenBadgeClass, isHidden);
            }

            if (badge.hasAttribute('aria-hidden') !== isHidden) {
                badge.toggleAttribute('aria-hidden', isHidden);
            }

            badge.querySelectorAll('.fi-badge-delete-btn').forEach((removeButton) => {
                if (isHidden) {
                    if (!Object.prototype.hasOwnProperty.call(removeButton.dataset, 'responsiveOverflowTabIndex')) {
                        removeButton.dataset.responsiveOverflowTabIndex = removeButton.getAttribute('tabindex') ?? '';
                    }

                    if (removeButton.getAttribute('tabindex') !== '-1') {
                        removeButton.setAttribute('tabindex', '-1');
                    }

                    return;
                }

                restoreRemoveButton(removeButton);
            });
        }

        function setOverflowBadgeHidden(overflowBadge, isHidden) {
            const wasHidden = overflowBadge.classList.contains(hiddenBadgeClass);

            if (wasHidden !== isHidden) {
                overflowBadge.classList.toggle(hiddenBadgeClass, isHidden);
            }

            if (overflowBadge.hasAttribute('aria-hidden') !== isHidden) {
                overflowBadge.toggleAttribute('aria-hidden', isHidden);
            }

            if (isHidden && overflowBadge.hasAttribute('aria-label')) {
                overflowBadge.removeAttribute('aria-label');
            }
        }

        function getMeasurementRoot() {
            if (measurementRoot) {
                return measurementRoot;
            }

            measurementRoot = document.createElement('div');
            measurementRoot.setAttribute('aria-hidden', 'true');
            measurementRoot.dataset.filamentResponsiveBadgeOverflowMeasurer = 'true';
            measurementRoot.style.position = 'fixed';
            measurementRoot.style.visibility = 'hidden';
            measurementRoot.style.pointerEvents = 'none';
            measurementRoot.style.inset = '0 auto auto 0';
            measurementRoot.style.width = 'max-content';
            measurementRoot.style.maxWidth = 'none';
            measurementRoot.style.height = 'auto';
            measurementRoot.style.overflow = 'visible';
            measurementRoot.style.contain = 'layout style';
            measurementRoot.style.whiteSpace = 'nowrap';

            document.body.appendChild(measurementRoot);

            return measurementRoot;
        }

        function measureNaturalWidth(element) {
            const clone = element.cloneNode(true);

            clone.classList.remove(hiddenBadgeClass);
            clone.style.position = 'static';
            clone.style.visibility = 'hidden';
            clone.style.pointerEvents = 'none';
            clone.style.width = 'max-content';
            clone.style.maxWidth = 'none';
            clone.style.clipPath = 'none';
            clone.style.inset = 'auto';
            clone.style.display = 'inline-flex';

            getMeasurementRoot().appendChild(clone);

            const width = Math.ceil(clone.getBoundingClientRect().width);

            clone.remove();

            return width;
        }

        function getColumnGap(container) {
            const style = window.getComputedStyle(container);

            return Number.parseFloat(style.columnGap || style.gap) || 0;
        }

        function sumWidths(widths, count) {
            return widths.slice(0, count).reduce((total, width) => total + width, 0);
        }

        function calculateVisibleCount(container, badges, overflowBadge, badgeWidths) {
            const availableWidth = Math.floor(container.clientWidth);
            const gap = getColumnGap(container);

            if (availableWidth <= 0) {
                return badges.length;
            }

            for (let visibleCount = badges.length; visibleCount >= 1; visibleCount--) {
                const overflowCount = badges.length - visibleCount;
                const itemCount = visibleCount + (overflowCount > 0 ? 1 : 0);

                if (overflowCount > 0) {
                    updateOverflowBadge(overflowBadge, overflowCount);
                }

                const overflowWidth = overflowCount > 0 ? measureNaturalWidth(overflowBadge) : 0;
                const width = sumWidths(badgeWidths, visibleCount) + overflowWidth + Math.max(0, itemCount - 1) * gap;

                if (width <= availableWidth || visibleCount === 1) {
                    return visibleCount;
                }
            }

            return 1;
        }

        function updateContainer(container) {
            if (!(container instanceof HTMLElement) || !container.isConnected) {
                return;
            }

            container.classList.add(containerClass);

            const badges = Array.from(container.querySelectorAll(':scope > .fi-badge'))
                .filter((badge) => !badge.classList.contains(overflowBadgeClass));
            const overflowBadge = ensureOverflowBadge(container);

            if (badges.length <= 1) {
                badges.forEach((badge) => setBadgeHidden(badge, false));
                setOverflowBadgeHidden(overflowBadge, true);
                container.classList.remove(hasOverflowClass);
                container.removeAttribute('data-overflow-count');

                return;
            }

            const badgeWidths = badges.map((badge) => measureNaturalWidth(badge));

            let visibleCount = calculateVisibleCount(container, badges, overflowBadge, badgeWidths);
            let overflowCount = badges.length - visibleCount;

            if (overflowCount > 0) {
                updateOverflowBadge(overflowBadge, overflowCount);
                visibleCount = calculateVisibleCount(container, badges, overflowBadge, badgeWidths);
                overflowCount = badges.length - visibleCount;
            }

            badges.forEach((badge, index) => {
                setBadgeHidden(badge, index >= visibleCount);
            });

            if (overflowCount <= 0) {
                setOverflowBadgeHidden(overflowBadge, true);
                container.classList.remove(hasOverflowClass);
                container.removeAttribute('data-overflow-count');

                return;
            }

            updateOverflowBadge(overflowBadge, overflowCount);

            const lastVisibleBadge = badges[visibleCount - 1];

            if (lastVisibleBadge && overflowBadge.previousElementSibling !== lastVisibleBadge) {
                lastVisibleBadge.after(overflowBadge);
            }

            setOverflowBadgeHidden(overflowBadge, false);
            container.classList.add(hasOverflowClass);
            container.dataset.overflowCount = String(overflowCount);
        }

        function updateAll() {
            const containers = new Set();

            selectors.forEach((selector) => {
                document.querySelectorAll(selector).forEach((container) => containers.add(container));
            });

            containers.forEach((container) => {
                updateContainer(container);

                if (resizeObserver && !observedContainers.has(container)) {
                    observedContainers.add(container);
                    resizeObserver.observe(container);
                }
            });
        }

        function schedule() {
            if (isScheduled) {
                return;
            }

            isScheduled = true;

            window.requestAnimationFrame(() => {
                isScheduled = false;
                updateAll();
            });
        }

        function start() {
            if (mutationObserver) {
                return;
            }

            if (!document.body) {
                document.addEventListener('DOMContentLoaded', start, { once: true });

                return;
            }

            resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
            getMeasurementRoot();

            mutationObserver = new MutationObserver((records) => {
                const onlyMeasured = records.every((record) => {
                    return record.target === measurementRoot || measurementRoot?.contains(record.target);
                });

                if (!onlyMeasured) {
                    schedule();
                }
            });
            mutationObserver.observe(document.body, { childList: true, subtree: true });

            document.addEventListener('livewire:navigated', schedule);

            const registerLivewireHook = () => {
                window.Livewire?.hook?.('morph.updated', schedule);
            };

            document.addEventListener('livewire:init', registerLivewireHook);
            registerLivewireHook();
        }

        return {
            register(selector) {
                selectors.add(selector);
                start();
                schedule();
            },
            schedule,
        };
    }

    window[namespace] = window[namespace] || createResponsiveBadgeOverflow();
    window[namespace].register('.fi-ta-header-filter .fi-select-input-value-badges-ctn');
})();
