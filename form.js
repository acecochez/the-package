import { elements } from './elements.js';
import { currencyConfig, fetchRates, getPrice, formatPrice } from './currency.js';

document.addEventListener ('DOMContentLoaded', () => {
	const state = new Proxy ({
		currentStep: 0,
		formData: {
			name: '',
			email: '',
			phone: '',
			plan: 'Arcade',
			billing: 'monthly',
			currency: 'GBP',
			addons: [
				{name: 'Online service'},
				{name: 'Larger storage'},
				{name: 'Customizable Profile'}
			]
		}
	}, {
		set (target, property, value) {
			target[property] = value;
			render ();
			return true;
		}
	});

	const render = () => {
		updateStepVisibility ();
		updatePlanSelection ();
		updateAddons ();
		if (state.currentStep === 3) updateSummary ();
	};

	const config = {
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

	const getPriceStr = (name, billing, currency) => {
		const price = getPrice (name, billing, currency, config.basePrices);
		return formatPrice (price, billing, currency);
	};

	const updateStepVisibility = () => {
		const {currentStep} = state;
		elements.steps.forEach ((step, i) => step.classList.toggle ('hidden', i !== currentStep));
		elements.sidebarSteps.forEach ((step, i) => step.classList.toggle ('active', i === currentStep));

		if (elements.mobileStepIndicator) {
			const stepNum = Math.min (currentStep + 1, 4);
			elements.mobileStepIndicatorText.textContent = `STEP ${stepNum}`;
			elements.mobileStepIndicator.classList.toggle ('hidden', currentStep >= 4);
		}
	};

	const updatePlanSelection = () => {
		const {plan, billing, currency} = state.formData;
		elements.planBoxes.forEach (box => {
			const planName = box.dataset.plan;
			box.classList.toggle ('is-selected', planName === plan);

			elements.get (box, 'p.has-text-grey').textContent = getPriceStr (planName, billing, currency);

			let freeLabel = elements.get (box, '.free-label');
			if (billing === 'yearly') {
				if (!freeLabel) {
					elements.get (box, 'div').insertAdjacentHTML ('beforeend', '<p class="is-size-7 has-text-link free-label">2 months free</p>');
				}
			} else if (freeLabel) {
				freeLabel.remove ();
			}
		});
	};

	const updateAddons = () => {
		const {billing, currency, addons} = state.formData;
		elements.addonRows.forEach (row => {
			const addonName = row.dataset.addon;
			const isSelected = addons.some (a => a.name === addonName);

			row.classList.toggle ('is-selected', isSelected);
			elements.get (row, 'input[type="checkbox"]').checked = isSelected;
			elements.get (row, 'p.has-text-primary').textContent = `+${getPriceStr (addonName, billing, currency)}`;
		});
	};

	const updateSummary = () => {
		const {plan, billing, currency, addons} = state.formData;
		const billingDisplay = billing === 'monthly' ? 'Monthly' : 'Yearly';

		let total = getPrice (plan, billing, currency, config.basePrices);
		let html = `
            <div class="is-flex is-justify-content-space-between is-align-items-center mb-4 pb-4" style="border-bottom: 1px solid #dbdbdb;">
                <div>
                    <p class="has-text-weight-bold">${plan} (${billingDisplay})</p>
                    <a href="#" class="is-size-7 has-text-grey" style="text-decoration: underline;" id="change-plan">Change</a>
                </div>
                <p class="has-text-weight-bold">${formatPrice (total, billing, currency)}</p>
            </div>
        `;

		addons.forEach (addon => {
			const price = getPrice (addon.name, billing, currency, config.basePrices);
			total = (total !== null && price !== null) ? total + price : null;
			html += `
                <div class="is-flex is-justify-content-space-between mb-2">
                    <p class="has-text-grey is-size-7">${addon.name}</p>
                    <p class="is-size-7">+${formatPrice (price, billing, currency)}</p>
                </div>
            `;
		});

		elements.summaryBox.innerHTML = html;
		elements.totalRow.innerHTML = `
            <p class="has-text-grey is-size-7">Total (per ${billing === 'monthly' ? 'month' : 'year'})</p>
            <p class="has-text-primary is-size-4 has-text-weight-bold">+${formatPrice (total, billing, currency)}</p>
        `;
	};

	const validateStep1 = () => {
		let isValid = true;
		Object.entries (elements.inputs).forEach (([key, input]) => {
			const field = elements.closest (input, '.field');
			const existingHelp = elements.get (field, '.help.is-danger');
			if (existingHelp) existingHelp.remove ();
			input.classList.remove ('is-danger');

			const val = input.value.trim ();
			if (!val) {
				showError (input, 'This field is required');
				isValid = false;
			} else if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test (val)) {
				showError (input, 'The email address is not formatted correctly');
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
		input.classList.add ('is-danger');
		elements.closest (input, '.field').insertAdjacentHTML ('beforeend', `<p class="help is-danger">${message}</p>`);
	};

	elements.container.addEventListener ('click', (e) => {
		const target = e.target;
		const nextBtn = elements.closest (target, '.button.primary, .button.is-primary');
		const backBtn = elements.closest (target, '.button.is-text');
		const changePlanBtn = target.id === 'change-plan';
		const planBox = elements.closest (target, '.plan-box');
		const addonRow = elements.closest (target, '.addon-row');

		if (nextBtn) {
			if (state.currentStep === 0 && !validateStep1 ()) return;

			if (state.currentStep < elements.steps.length - 1) {
				state.currentStep = nextBtn.textContent.trim () === 'Confirm' ? 4 : state.currentStep + 1;
			}
			return;
		}

		if (backBtn && state.currentStep > 0) {
			state.currentStep--;
			return;
		}

		if (changePlanBtn) {
			e.preventDefault ();
			state.currentStep = 1;
			return;
		}

		if (planBox) {
			state.formData.plan = planBox.dataset.plan;
			render ();
			return;
		}

		if (addonRow) {
			const checkbox = elements.get (addonRow, 'input[type="checkbox"]');
			if (target !== checkbox) checkbox.checked = !checkbox.checked;

			const addonName = addonRow.dataset.addon;
			if (checkbox.checked) {
				if (!state.formData.addons.some (a => a.name === addonName)) {
					state.formData.addons.push ({name: addonName});
				}
			} else {
				state.formData.addons = state.formData.addons.filter (a => a.name !== addonName);
			}
			render ();
		}
	});

	elements.billingToggle.addEventListener ('change', () => {
		state.formData.billing = elements.billingToggle.checked ? 'yearly' : 'monthly';
		const isYearly = state.formData.billing === 'yearly';

		elements.yearlyLabel.classList.toggle ('has-text-weight-bold', isYearly);
		elements.yearlyLabel.classList.toggle ('has-text-grey', !isYearly);
		elements.monthlyLabel.classList.toggle ('has-text-weight-bold', !isYearly);
		elements.monthlyLabel.classList.toggle ('has-text-grey', isYearly);

		render ();
	});

	elements.currencySelector.addEventListener ('change', () => {
		state.formData.currency = elements.currencySelector.value;
		if (state.formData.currency !== currencyConfig.baseCurrency) {
			fetchRates (
				() => render (),
				() => {
					// Switch back to GBP on error
					state.formData.currency = 'GBP';
					elements.currencySelector.value = 'GBP';
					render ();

					const control = elements.closest (elements.currencySelector, '.control');
					const tooltip = elements.create ('div');
					tooltip.className = 'currency-tooltip';
					tooltip.textContent = 'Sorry, currency unavailable.';
					control.appendChild (tooltip);

					setTimeout (() => {
						tooltip.remove ();

						Array.from (elements.currencySelector.options).forEach (option => {
							if (option.value !== 'GBP') {
								option.disabled = true;
							}
						});
					}, 3000);
				}
			).then (_r => {
			});
		} else {
			render ();
		}
	});

	// Settings & Test Mode
	const toggleModal = () => {
		elements.settingsModal.classList.toggle ('is-active');
	};

	elements.settingsCog.addEventListener ('click', toggleModal);
	elements.modalBackground.addEventListener ('click', toggleModal);
	elements.modalDelete.addEventListener ('click', toggleModal);

	elements.testModeToggle.addEventListener ('change', () => {
		elements.toggleBodyClass ('test-mode-enabled', elements.testModeToggle.checked);
	});

	elements.testErrorBtn.addEventListener ('click', () => {
		const originalBase = currencyConfig.baseCurrency;
		currencyConfig.baseCurrency = 'INVALID';
		fetchRates (() => {
		}, () => {
		}).finally (() => {
			currencyConfig.baseCurrency = originalBase;
		});
	});

	elements.resetBtn.addEventListener ('click', () => {
		window.location.reload ();
	});

	// Initialize
	render ();
});
