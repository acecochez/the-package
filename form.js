document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const state = {
        currentStep: 0,
        formData: {
            name: '',
            email: '',
            phone: '',
            plan: 'Arcade',
            billing: 'monthly',
            currency: 'GBP',
            addons: [
                { name: 'Online service' },
                { name: 'Larger storage' }
            ]
        }
    };

    const config = {
        baseCurrency: 'GBP',
        exchangeRates: {
            'GBP': 1
        },
        currencySettings: {
            'GBP': { locale: 'en-GB', currency: 'GBP' },
            'EUR': { locale: 'de-DE', currency: 'EUR' },
            'USD': { locale: 'en-US', currency: 'USD' }
        },
        basePrices: {
            monthly: {
                'Arcade': 9,
                'Advanced': 12,
                'Pro': 15,
                'Online service': 1,
                'Larger storage': 2,
                'Customizable Profile': 2
            },
            yearly: {
                'Arcade': 90,
                'Advanced': 120,
                'Pro': 150,
                'Online service': 10,
                'Larger storage': 20,
                'Customizable Profile': 20
            }
        }
    };

    const fetchRates = async () => {
        try {
            const response = await fetch(`https://api.frankfurter.app/latest?from=${config.baseCurrency}&to=EUR,USD`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data && data.rates) {
                config.exchangeRates = {
                    ...config.exchangeRates,
                    ...data.rates
                };
                updatePlanSelection();
                updateAddons();
                if (state.currentStep === 3) updateSummary();
            }
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
            
            // Switch back to GBP
            state.formData.currency = 'GBP';
            elements.currencySelector.value = 'GBP';
            updatePlanSelection();
            updateAddons();
            if (state.currentStep === 3) updateSummary();

            // Show tooltip popup
            const control = elements.currencySelector.closest('.control');
            const tooltip = document.createElement('div');
            tooltip.className = 'currency-tooltip';
            tooltip.textContent = 'Sorry, currency unavailable.';
            control.appendChild(tooltip);

            // Wait 3 seconds
            setTimeout(() => {
                // Remove tooltip
                tooltip.remove();

                // Disable other options
                Array.from(elements.currencySelector.options).forEach(option => {
                    if (option.value !== 'GBP') {
                        option.disabled = true;
                    }
                });
            }, 3000);
        }
    };

    // --- DOM Elements ---
    const elements = {
        steps: document.querySelectorAll('.step-content'),
        sidebarSteps: document.querySelectorAll('.sidebar-step'),
        planBoxes: document.querySelectorAll('.plan-box'),
        addonRows: document.querySelectorAll('.addon-row'),
        billingToggle: document.getElementById('billing-toggle'),
        currencySelector: document.getElementById('currency-selector'),
        monthlyLabel: document.getElementById('monthly-label'),
        yearlyLabel: document.getElementById('yearly-label'),
        summaryBox: document.querySelector('.summary-box'),
        totalRow: document.querySelector('.total-row'),
        inputs: {
            name: document.getElementById('name'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone')
        },
        container: document.querySelector('.step-container'),
        settingsCog: document.getElementById('settings-cog'),
        settingsModal: document.getElementById('settings-modal'),
        testModeToggle: document.getElementById('test-mode-toggle'),
        testErrorBtn: document.getElementById('test-error-btn'),
        resetBtn: document.getElementById('reset-btn'),
        mobileStepIndicator: document.getElementById('mobile-step-indicator')
    };

    // --- Utils ---
    const getPrice = (item) => {
        const basePrice = config.basePrices[state.formData.billing][item];
        const rate = config.exchangeRates[state.formData.currency];
        
        if (rate === undefined) return null;
        return basePrice * rate;
    };

    const formatPrice = (value, suffix = true) => {
        if (value === null) return 'Loading...';
        const settings = config.currencySettings[state.formData.currency];
        const formatter = new Intl.NumberFormat(settings.locale, {
            style: 'currency',
            currency: settings.currency,
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
        });
        const formatted = formatter.format(value);
        
        const b = state.formData.billing === 'monthly' ? 'mo' : 'yr';
        return suffix ? `${formatted}/${b}` : formatted;
    };

    // --- UI Updates ---
    const updateStepVisibility = () => {
        elements.steps.forEach((step, i) => step.classList.toggle('hidden', i !== state.currentStep));
        elements.sidebarSteps.forEach((step, i) => step.classList.toggle('active', i === state.currentStep));
        
        if (elements.mobileStepIndicator) {
            const stepNum = state.currentStep + 1;
            elements.mobileStepIndicator.querySelector('p').textContent = `STEP ${stepNum > 4 ? 4 : stepNum}`;
            elements.mobileStepIndicator.classList.toggle('hidden', state.currentStep >= 4);
        }
    };

    const updatePlanSelection = () => {
        elements.planBoxes.forEach(box => {
            const planName = box.querySelector('p.has-text-weight-bold').textContent;
            box.classList.toggle('is-selected', planName === state.formData.plan);
            
            const priceLabel = box.querySelector('p.has-text-grey');
            priceLabel.textContent = formatPrice(getPrice(planName));
            
            let freeLabel = box.querySelector('.free-label');
            if (state.formData.billing === 'yearly') {
                if (!freeLabel) {
                    freeLabel = document.createElement('p');
                    freeLabel.className = 'is-size-7 has-text-link free-label';
                    freeLabel.textContent = '2 months free';
                    box.querySelector('div').appendChild(freeLabel);
                }
            } else if (freeLabel) {
                freeLabel.remove();
            }
        });
    };

    const updateAddons = () => {
        elements.addonRows.forEach(row => {
            const addonName = row.querySelector('p.has-text-weight-bold').textContent;
            const checkbox = row.querySelector('input[type="checkbox"]');
            const priceLabel = row.querySelector('p.has-text-primary');
            
            priceLabel.textContent = `+${formatPrice(getPrice(addonName))}`;

            const isSelected = state.formData.addons.some(a => a.name === addonName);
            row.classList.toggle('is-selected', isSelected);
            checkbox.checked = isSelected;
        });
    };

    const updateSummary = () => {
        const { plan, billing, addons } = state.formData;
        const billingDisplay = billing === 'monthly' ? 'Monthly' : 'Yearly';
        
        const basePlanPrice = getPrice(plan);
        let total = basePlanPrice;
        let html = `
            <div class="is-flex is-justify-content-space-between is-align-items-center mb-4 pb-4" style="border-bottom: 1px solid #dbdbdb;">
                <div>
                    <p class="has-text-weight-bold">${plan} (${billingDisplay})</p>
                    <a href="#" class="is-size-7 has-text-grey" style="text-decoration: underline;" id="change-plan">Change</a>
                </div>
                <p class="has-text-weight-bold">${formatPrice(basePlanPrice)}</p>
            </div>
        `;

        addons.forEach(addon => {
            const price = getPrice(addon.name);
            if (total !== null && price !== null) {
                total += price;
            } else {
                total = null;
            }
            html += `
                <div class="is-flex is-justify-content-space-between mb-2">
                    <p class="has-text-grey is-size-7">${addon.name}</p>
                    <p class="is-size-7">+${formatPrice(price)}</p>
                </div>
            `;
        });

        elements.summaryBox.innerHTML = html;
        
        const totalText = billing === 'monthly' ? 'Total (per month)' : 'Total (per year)';
        elements.totalRow.innerHTML = `
            <p class="has-text-grey is-size-7">${totalText}</p>
            <p class="has-text-primary is-size-4 has-text-weight-bold">+${formatPrice(total)}</p>
        `;
    };

    const validateStep1 = () => {
        let isValid = true;
        Object.entries(elements.inputs).forEach(([key, input]) => {
            input.classList.remove('is-danger');
            const field = input.closest('.field');
            const existingHelp = field.querySelector('.help.is-danger');
            if (existingHelp) existingHelp.remove();

            const val = input.value.trim();
            if (!val) {
                showError(input, 'This field is required');
                isValid = false;
            } else if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                showError(input, 'The email address is not formatted correctly');
                isValid = false;
            }
        });

        if (isValid) {
            state.formData.name = elements.inputs.name.value;
            state.formData.email = elements.inputs.email.value;
            state.formData.phone = elements.inputs.phone.value;
        }
        return isValid;
    };

    const showError = (input, message) => {
        input.classList.add('is-danger');
        const help = document.createElement('p');
        help.className = 'help is-danger';
        help.textContent = message;
        input.closest('.field').appendChild(help);
    };

    // --- Event Handlers ---
    elements.container.addEventListener('click', (e) => {
        const target = e.target;

        // Next Button
        if (target.matches('.button.primary, .button.is-primary')) {
            if (state.currentStep === 0 && !validateStep1()) return;
            
            if (state.currentStep < elements.steps.length - 1) {
                if (target.textContent.trim() === 'Confirm') {
                    state.currentStep = 4;
                } else {
                    state.currentStep++;
                }
                updateStepVisibility();
                if (state.currentStep === 2) updateAddons();
                if (state.currentStep === 3) updateSummary();
            }
            return;
        }

        // Back Button
        if (target.matches('.button.is-text')) {
            if (state.currentStep > 0) {
                state.currentStep--;
                updateStepVisibility();
            }
            return;
        }

        // Change Plan Link (Summary Step)
        if (target.id === 'change-plan') {
            e.preventDefault();
            state.currentStep = 1;
            updateStepVisibility();
            return;
        }

        // Plan Box
        const planBox = target.closest('.plan-box');
        if (planBox) {
            state.formData.plan = planBox.querySelector('p.has-text-weight-bold').textContent;
            updatePlanSelection();
            return;
        }

        // Addon Row
        const addonRow = target.closest('.addon-row');
        if (addonRow) {
            const checkbox = addonRow.querySelector('input[type="checkbox"]');
            if (target !== checkbox) checkbox.checked = !checkbox.checked;
            
            const addonName = addonRow.querySelector('p.has-text-weight-bold').textContent;
            if (checkbox.checked) {
                if (!state.formData.addons.some(a => a.name === addonName)) {
                    state.formData.addons.push({ name: addonName });
                }
            } else {
                state.formData.addons = state.formData.addons.filter(a => a.name !== addonName);
            }
            updateAddons();
        }
    });

    elements.billingToggle.addEventListener('change', () => {
        state.formData.billing = elements.billingToggle.checked ? 'yearly' : 'monthly';
        const isYearly = state.formData.billing === 'yearly';
        
        elements.yearlyLabel.classList.toggle('has-text-weight-bold', isYearly);
        elements.yearlyLabel.classList.toggle('has-text-grey', !isYearly);
        elements.monthlyLabel.classList.toggle('has-text-weight-bold', !isYearly);
        elements.monthlyLabel.classList.toggle('has-text-grey', isYearly);
        
        updatePlanSelection();
        updateAddons();
    });

    elements.currencySelector.addEventListener('change', () => {
        state.formData.currency = elements.currencySelector.value;
        if (state.formData.currency !== config.baseCurrency) {
            fetchRates();
        } else {
            updatePlanSelection();
            updateAddons();
        }
    });

    // --- Settings & Test Mode ---
    const toggleModal = () => {
        elements.settingsModal.classList.toggle('is-active');
    };

    elements.settingsCog.addEventListener('click', toggleModal);
    
    elements.settingsModal.querySelector('.modal-background').addEventListener('click', toggleModal);
    elements.settingsModal.querySelector('.delete').addEventListener('click', toggleModal);

    elements.testModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('test-mode-enabled', elements.testModeToggle.checked);
    });

    elements.testErrorBtn.addEventListener('click', () => {
        // Force a fetch error by using an invalid base currency or catching the error directly
        // The most reliable way here is to just call fetchRates and expect it to fail if we can sabotage the URL
        // or just mock the failure. Since fetchRates is already there, let's trigger it with a fake currency.
        const originalBase = config.baseCurrency;
        config.baseCurrency = 'INVALID';
        fetchRates().finally(() => {
            config.baseCurrency = originalBase;
        });
    });

    elements.resetBtn.addEventListener('click', () => {
        window.location.reload();
    });

    // --- Initialize ---
    // fetchRates(); // Removed initial fetch as it's triggered on currency change
    updatePlanSelection();
    updateAddons();
    updateStepVisibility();
});
