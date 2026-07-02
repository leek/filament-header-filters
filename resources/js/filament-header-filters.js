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
        const overflowClearButtonClass = 'fi-select-input-overflow-clear-btn';
        const optionCheckboxClass = 'fi-select-input-option-checkbox';
        const selectedOptionClass = 'fi-select-input-option-selected';

        const selectRootSelectors = new Set();
        let isScheduled = false;
        let measurementRoot = null;
        let mutationObserver = null;
        let resizeObserver = null;
        let observedBody = null;
        let lifecycleListenersRegistered = false;
        let livewireHookRegistered = false;
        const enhancedSelects = new WeakSet();
        let measuredBadgeWidths = new WeakMap();
        let measuredOverflowBadgeWidths = new WeakMap();

        function ensureOverflowBadge(container) {
            let overflowBadge = container.querySelector(`:scope > .${overflowBadgeClass}`);

            if (overflowBadge) {
                ensureOverflowClearButton(container, overflowBadge);

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
            ensureOverflowClearButton(container, overflowBadge);

            container.appendChild(overflowBadge);

            return overflowBadge;
        }

        function ensureOverflowClearButton(container, overflowBadge) {
            let clearButton = overflowBadge.querySelector(`:scope > .${overflowClearButtonClass}`);

            if (clearButton) {
                return clearButton;
            }

            clearButton = document.createElement('button');
            clearButton.type = 'button';
            clearButton.className = ['fi-badge-delete-btn', overflowClearButtonClass].join(' ');
            clearButton.innerHTML = '<svg class="fi-icon fi-size-xs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" data-slot="icon"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"></path></svg>';
            clearButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                removeOverflowSelections(container);
            });

            overflowBadge.appendChild(clearButton);

            return clearButton;
        }

        function updateOverflowBadge(overflowBadge, overflowCount) {
            const label = overflowBadge.querySelector('.fi-badge-label');
            const text = `+${overflowCount}`;

            if (label && label.textContent !== text) {
                label.textContent = text;
            }

            const ariaLabel = `${overflowCount} more selected`;

            if (overflowBadge.getAttribute('aria-label') !== ariaLabel) {
                overflowBadge.setAttribute('aria-label', ariaLabel);
            }

            const clearButton = overflowBadge.querySelector(`:scope > .${overflowClearButtonClass}`);
            const clearLabel = `Remove ${overflowCount} hidden selections`;

            if (clearButton?.getAttribute('aria-label') !== clearLabel) {
                clearButton?.setAttribute('aria-label', clearLabel);
            }
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

            overflowBadge.querySelectorAll(`:scope > .${overflowClearButtonClass}`).forEach((clearButton) => {
                if (isHidden) {
                    if (!Object.prototype.hasOwnProperty.call(clearButton.dataset, 'responsiveOverflowTabIndex')) {
                        clearButton.dataset.responsiveOverflowTabIndex = clearButton.getAttribute('tabindex') ?? '';
                    }

                    if (clearButton.getAttribute('tabindex') !== '-1') {
                        clearButton.setAttribute('tabindex', '-1');
                    }

                    return;
                }

                restoreRemoveButton(clearButton);
            });
        }

        function clearOverflowCount(container) {
            if (container.hasAttribute('data-overflow-count')) {
                container.removeAttribute('data-overflow-count');
            }
        }

        function setOverflowCount(container, overflowCount) {
            const value = String(overflowCount);

            if (container.dataset.overflowCount !== value) {
                container.dataset.overflowCount = value;
            }
        }

        function setClassEnabled(element, className, isEnabled) {
            if (element.classList.contains(className) !== isEnabled) {
                element.classList.toggle(className, isEnabled);
            }
        }

        function clearMeasurementCache() {
            measuredBadgeWidths = new WeakMap();
            measuredOverflowBadgeWidths = new WeakMap();
        }

        function getBadgeMeasurementSignature(badge) {
            const className = Array.from(badge.classList)
                .filter((className) => className !== hiddenBadgeClass)
                .join(' ');

            return `${className}|${badge.textContent ?? ''}`;
        }

        function valuesMatch(left, right) {
            return String(left) === String(right);
        }

        function getAlpineData(element) {
            if (!element) {
                return null;
            }

            if (typeof window.Alpine?.$data === 'function') {
                return window.Alpine.$data(element);
            }

            return element._x_dataStack?.[0] ?? null;
        }

        function getSelectFromRoot(root) {
            return getAlpineData(root)?.select ?? null;
        }

        function getSelectForContainer(container) {
            return getSelectFromRoot(container.closest('.fi-select-input'));
        }

        function getHiddenOverflowValues(container) {
            return Array.from(
                container.querySelectorAll(`:scope > .${hiddenBadgeClass}:not(.${overflowBadgeClass})[data-value]`),
            ).map((badge) => badge.getAttribute('data-value'));
        }

        function removeOverflowSelections(container) {
            const select = getSelectForContainer(container);
            const valuesToRemove = getHiddenOverflowValues(container);

            if (!select || !Array.isArray(select.state) || valuesToRemove.length === 0) {
                return;
            }

            const nextState = select.state.filter((value) => {
                return !valuesToRemove.some((valueToRemove) => valuesMatch(value, valueToRemove));
            });

            if (nextState.length === select.state.length) {
                return;
            }

            select.state = nextState;

            Promise.resolve(select.updateSelectedDisplay?.()).then(() => schedule());
            select.renderOptions?.();

            if (select.isOpen) {
                select.deferPositionDropdown?.();
            }

            select.maintainFocusInMultipleMode?.();
            select.onStateChange?.(select.state);
        }

        function hasAnyOptions(options) {
            return options.some((option) => {
                if (option.options && Array.isArray(option.options)) {
                    return option.options.length > 0;
                }

                return true;
            });
        }

        function decorateOptionElement(select, optionElement) {
            if (!select.isMultiple) {
                return;
            }

            const value = optionElement.getAttribute('data-value');
            const isSelected = Array.isArray(select.state) && select.state.some((stateValue) => valuesMatch(stateValue, value));
            let checkbox = optionElement.querySelector(`:scope > .${optionCheckboxClass}`);

            if (!checkbox) {
                checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = ['fi-checkbox-input', optionCheckboxClass].join(' ');
                checkbox.tabIndex = -1;
                checkbox.setAttribute('aria-hidden', 'true');
                optionElement.prepend(checkbox);
            }

            checkbox.checked = isSelected;
            optionElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            optionElement.classList.toggle(selectedOptionClass, isSelected);
        }

        function renderOptionGroupWithSelectedOptions(select, label, options) {
            if (options.length === 0) {
                return;
            }

            const optionGroup = document.createElement('li');
            optionGroup.className = 'fi-select-input-option-group';

            const optionGroupLabel = document.createElement('div');
            optionGroupLabel.className = 'fi-dropdown-header';
            optionGroupLabel.textContent = label;

            const groupOptionsList = document.createElement('ul');
            groupOptionsList.className = 'fi-dropdown-list';

            options.forEach((option) => {
                const optionElement = select.createOptionElement(option.value, option);

                decorateOptionElement(select, optionElement);
                groupOptionsList.appendChild(optionElement);
            });

            optionGroup.appendChild(optionGroupLabel);
            optionGroup.appendChild(groupOptionsList);
            select.optionsList.appendChild(optionGroup);
        }

        function renderOptionsWithSelectedOptions() {
            this.optionsList.innerHTML = '';

            let totalRenderedCount = 0;
            const optionsToRender = this.options;
            let optionsCount = 0;
            let hasGroupedOptions = false;

            this.options.forEach((option) => {
                if (option.options && Array.isArray(option.options)) {
                    optionsCount += option.options.length;
                    hasGroupedOptions = true;

                    return;
                }

                optionsCount++;
            });

            if (hasGroupedOptions) {
                this.optionsList.className = 'fi-select-input-options-ctn';
            } else if (optionsCount > 0) {
                this.optionsList.className = 'fi-dropdown-list';
            }

            let ungroupedList = hasGroupedOptions ? null : this.optionsList;
            let renderedCount = 0;

            for (const option of optionsToRender) {
                if (this.optionsLimit > 0 && renderedCount >= this.optionsLimit) {
                    break;
                }

                if (option.options && Array.isArray(option.options)) {
                    let groupOptions = option.options;

                    if (groupOptions.length > 0) {
                        if (this.optionsLimit > 0) {
                            const remainingSlots = this.optionsLimit - renderedCount;

                            if (remainingSlots < groupOptions.length) {
                                groupOptions = groupOptions.slice(0, remainingSlots);
                            }
                        }

                        renderOptionGroupWithSelectedOptions(this, option.label, groupOptions);
                        renderedCount += groupOptions.length;
                        totalRenderedCount += groupOptions.length;
                    }

                    continue;
                }

                if (!ungroupedList && hasGroupedOptions) {
                    ungroupedList = document.createElement('ul');
                    ungroupedList.className = 'fi-dropdown-list';
                    this.optionsList.appendChild(ungroupedList);
                }

                const optionElement = this.createOptionElement(option.value, option);

                decorateOptionElement(this, optionElement);
                ungroupedList.appendChild(optionElement);
                renderedCount++;
                totalRenderedCount++;
            }

            if (totalRenderedCount === 0) {
                if (this.searchQuery) {
                    this.showNoResultsMessage();
                } else if (this.hasInitialNoOptionsMessage || this.hasDynamicOptions) {
                    this.showNoOptionsMessage();
                } else if (this.isMultiple && this.isOpen && !this.isSearchable) {
                    this.closeDropdown();
                }

                if (this.optionsList.parentNode === this.dropdown) {
                    this.dropdown.removeChild(this.optionsList);
                }

                return;
            }

            this.hideLoadingState();

            if (this.optionsList.parentNode !== this.dropdown) {
                this.dropdown.appendChild(this.optionsList);
            }
        }

        function hasAvailableOptionsWithSelectedOptions() {
            return hasAnyOptions(this.options);
        }

        function isSelectEnhanced(select) {
            return enhancedSelects.has(select)
                && select.renderOptions === renderOptionsWithSelectedOptions
                && select.hasAvailableOptions === hasAvailableOptionsWithSelectedOptions;
        }

        function enhanceSelect(select) {
            if (!select?.isMultiple || isSelectEnhanced(select)) {
                return;
            }

            select.renderOptions = renderOptionsWithSelectedOptions;
            select.hasAvailableOptions = hasAvailableOptionsWithSelectedOptions;

            enhancedSelects.add(select);
            select.renderOptions();
        }

        function enhanceSelectRoot(root) {
            enhanceSelect(getSelectFromRoot(root));
        }

        function enhanceSelects() {
            selectRootSelectors.forEach((selector) => {
                document.querySelectorAll(selector).forEach(enhanceSelectRoot);
            });
        }

        function setOverflowBadgeWidth(container, overflowBadge, isEnabled) {
            const valueContainer = container.parentElement?.classList.contains('fi-select-input-value-ctn')
                ? container.parentElement
                : null;

            if (!isEnabled) {
                container.style.removeProperty('--fi-select-input-overflow-badge-width');
                valueContainer?.style.removeProperty('--fi-select-input-overflow-badge-width');

                return;
            }

            const width = `${measureNaturalWidth(overflowBadge)}px`;

            if (container.style.getPropertyValue('--fi-select-input-overflow-badge-width') !== width) {
                container.style.setProperty('--fi-select-input-overflow-badge-width', width);
            }

            if (valueContainer?.style.getPropertyValue('--fi-select-input-overflow-badge-width') !== width) {
                valueContainer?.style.setProperty('--fi-select-input-overflow-badge-width', width);
            }
        }

        function getMeasurementRoot() {
            if (!document.body) {
                return measurementRoot;
            }

            if (!measurementRoot) {
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
            }

            if (measurementRoot.parentElement !== document.body) {
                document.body.appendChild(measurementRoot);
            }

            return measurementRoot;
        }

        function measureNaturalWidth(element, configureClone = null) {
            const clone = element.cloneNode(true);

            clone.classList.remove(hiddenBadgeClass);
            configureClone?.(clone);
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

        function measureBadgeWidth(badge) {
            const signature = getBadgeMeasurementSignature(badge);
            const cachedMeasurement = measuredBadgeWidths.get(badge);

            if (cachedMeasurement?.signature === signature) {
                return cachedMeasurement.width;
            }

            const width = measureNaturalWidth(badge);

            measuredBadgeWidths.set(badge, { signature, width });

            return width;
        }

        function measureOverflowBadgeWidth(overflowBadge, overflowCount) {
            const signature = `${getBadgeMeasurementSignature(overflowBadge)}|overflow:${overflowCount}`;
            let cachedMeasurements = measuredOverflowBadgeWidths.get(overflowBadge);

            if (!cachedMeasurements) {
                cachedMeasurements = new Map();
                measuredOverflowBadgeWidths.set(overflowBadge, cachedMeasurements);
            }

            if (cachedMeasurements.has(signature)) {
                return cachedMeasurements.get(signature);
            }

            const width = measureNaturalWidth(overflowBadge, (clone) => {
                const label = clone.querySelector('.fi-badge-label');

                if (label) {
                    label.textContent = `+${overflowCount}`;
                }
            });

            cachedMeasurements.set(signature, width);

            return width;
        }

        function getColumnGap(container) {
            const style = window.getComputedStyle(container);

            return Number.parseFloat(style.columnGap || style.gap) || 0;
        }

        function getWidthSums(widths) {
            const sums = [0];

            widths.forEach((width) => {
                sums.push(sums[sums.length - 1] + width);
            });

            return sums;
        }

        function calculateVisibleCount(container, badges, overflowBadge, badgeWidthSums) {
            const availableWidth = Math.floor(container.clientWidth);
            const gap = getColumnGap(container);

            if (availableWidth <= 0) {
                return badges.length;
            }

            for (let visibleCount = badges.length; visibleCount >= 0; visibleCount--) {
                const overflowCount = badges.length - visibleCount;
                const itemCount = visibleCount + (overflowCount > 0 ? 1 : 0);

                const overflowWidth = overflowCount > 0 ? measureOverflowBadgeWidth(overflowBadge, overflowCount) : 0;
                const width = badgeWidthSums[visibleCount] + overflowWidth + Math.max(0, itemCount - 1) * gap;

                if (width <= availableWidth) {
                    return visibleCount;
                }
            }

            return 0;
        }

        function updateContainer(container) {
            if (!(container instanceof HTMLElement) || !container.isConnected) {
                return;
            }

            setClassEnabled(container, containerClass, true);

            const badges = Array.from(container.querySelectorAll(':scope > .fi-badge'))
                .filter((badge) => !badge.classList.contains(overflowBadgeClass));
            const overflowBadge = ensureOverflowBadge(container);

            if (badges.length <= 1) {
                badges.forEach((badge) => setBadgeHidden(badge, false));
                setOverflowBadgeHidden(overflowBadge, true);
                setOverflowBadgeWidth(container, overflowBadge, false);
                setClassEnabled(container, hasOverflowClass, false);
                clearOverflowCount(container);

                return;
            }

            const badgeWidthSums = getWidthSums(badges.map((badge) => measureBadgeWidth(badge)));

            let visibleCount = calculateVisibleCount(container, badges, overflowBadge, badgeWidthSums);
            let overflowCount = badges.length - visibleCount;

            if (overflowCount > 0) {
                updateOverflowBadge(overflowBadge, overflowCount);
                visibleCount = calculateVisibleCount(container, badges, overflowBadge, badgeWidthSums);
                overflowCount = badges.length - visibleCount;
            }

            badges.forEach((badge, index) => {
                setBadgeHidden(badge, index >= visibleCount);
            });

            if (overflowCount <= 0) {
                setOverflowBadgeHidden(overflowBadge, true);
                setOverflowBadgeWidth(container, overflowBadge, false);
                setClassEnabled(container, hasOverflowClass, false);
                clearOverflowCount(container);

                return;
            }

            updateOverflowBadge(overflowBadge, overflowCount);
            setOverflowBadgeWidth(container, overflowBadge, true);

            const lastVisibleBadge = badges[visibleCount - 1];

            if (lastVisibleBadge && overflowBadge.previousElementSibling !== lastVisibleBadge) {
                lastVisibleBadge.after(overflowBadge);
            } else if (!lastVisibleBadge && badges[0] && overflowBadge.nextElementSibling !== badges[0]) {
                badges[0].before(overflowBadge);
            }

            setOverflowBadgeHidden(overflowBadge, false);
            setClassEnabled(container, hasOverflowClass, true);
            setOverflowCount(container, overflowCount);
        }

        function updateAll() {
            observeBody();
            enhanceSelects();

            const containers = new Set();

            selectors.forEach((selector) => {
                document.querySelectorAll(selector).forEach((container) => containers.add(container));
            });

            containers.forEach((container) => {
                enhanceSelect(getSelectForContainer(container));
                updateContainer(container);

                if (resizeObserver && !observedContainers.has(container)) {
                    observedContainers.add(container);
                    resizeObserver.observe(container);
                }
            });
        }

        function observeBody() {
            if (!document.body) {
                return;
            }

            getMeasurementRoot();

            mutationObserver ??= new MutationObserver((records) => {
                if (records.some(shouldScheduleForMutation)) {
                    schedule();
                }
            });

            if (observedBody === document.body) {
                return;
            }

            mutationObserver.disconnect();
            mutationObserver.observe(document.body, { childList: true, subtree: true });
            observedBody = document.body;
        }

        function touchesRegisteredSelector(element, includeDescendants = false) {
            for (const selectorSet of [selectors, selectRootSelectors]) {
                for (const selector of selectorSet) {
                    if (element.matches(selector) || element.closest(selector)) {
                        return true;
                    }

                    if (includeDescendants && element.querySelector(selector)) {
                        return true;
                    }
                }
            }

            return false;
        }

        function shouldScheduleForMutation(record) {
            if (record.target === measurementRoot || measurementRoot?.contains(record.target)) {
                return false;
            }

            const target = record.target instanceof HTMLElement ? record.target : record.target.parentElement;

            if (target && touchesRegisteredSelector(target)) {
                return true;
            }

            return [...record.addedNodes, ...record.removedNodes].some((node) => {
                if (!(node instanceof HTMLElement)) {
                    return false;
                }

                if (node === measurementRoot || measurementRoot?.contains(node)) {
                    return false;
                }

                return touchesRegisteredSelector(node, true);
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

        function scheduleAfterNavigation() {
            observeBody();
            schedule();
            window.requestAnimationFrame(schedule);
            window.setTimeout(schedule, 50);
        }

        function registerLivewireHook() {
            if (livewireHookRegistered || typeof window.Livewire?.hook !== 'function') {
                return;
            }

            window.Livewire.hook('morph.updated', schedule);
            livewireHookRegistered = true;
        }

        function start() {
            if (!document.body) {
                document.addEventListener('DOMContentLoaded', start, { once: true });

                return;
            }

            resizeObserver ??= typeof ResizeObserver === 'function'
                ? new ResizeObserver(() => {
                    clearMeasurementCache();
                    schedule();
                })
                : null;
            observeBody();

            if (lifecycleListenersRegistered) {
                return;
            }

            document.addEventListener('livewire:navigated', scheduleAfterNavigation);
            document.addEventListener('livewire:init', registerLivewireHook);
            registerLivewireHook();
            lifecycleListenersRegistered = true;
        }

        return {
            register(selector, selectRootSelector = null) {
                selectors.add(selector);

                if (selectRootSelector) {
                    selectRootSelectors.add(selectRootSelector);
                }

                start();
                schedule();
            },
            schedule,
        };
    }

    window[namespace] = window[namespace] || createResponsiveBadgeOverflow();
    window[namespace].register(
        '.fi-ta-header-filter .fi-select-input-value-badges-ctn',
        '.fi-ta-header-filter .fi-select-input',
    );
    window.dispatchEvent(new CustomEvent('filament-responsive-badge-overflow:ready', {
        detail: { overflow: window[namespace] },
    }));
})();
