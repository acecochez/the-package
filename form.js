import { elements } from './elements.js';
import { currencyConfig, fetchRates, getPrice, formatPrice } from './currency.js';

document.addEventListener ('DOMContentLoaded', () => {
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
				{name: 'Online service'},
				{name: 'Larger storage'}
			]
		}
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

	const updateStepVisibility = () => {
		elements.steps.forEach ((step, i) => step.classList.toggle ('hidden', i !== state.currentStep));
		elements.sidebarSteps.forEach ((step, i) => step.classList.toggle ('active', i === state.currentStep));

		if (elements.mobileStepIndicator) {
			const stepNum = state.currentStep + 1;
			elements.mobileStepIndicator.querySelector ('p').textContent = `STEP ${stepNum > 4 ? 4 : stepNum}`;
			elements.mobileStepIndicator.classList.toggle ('hidden', state.currentStep >= 4);
		}
	};

	const updatePlanSelection = () => {
		elements.planBoxes.forEach (box => {
			const planName = box.querySelector ('p.has-text-weight-bold').textContent;
			box.classList.toggle ('is-selected', planName === state.formData.plan);

			const priceLabel = box.querySelector ('p.has-text-grey');
			const planPrice = getPrice (planName, state.formData.billing, state.formData.currency, config.basePrices);
			priceLabel.textContent = formatPrice (planPrice, state.formData.billing, state.formData.currency);

			let freeLabel = box.querySelector ('.free-label');
			if (state.formData.billing === 'yearly') {
				if (!freeLabel) {
					freeLabel = document.createElement ('p');
					freeLabel.className = 'is-size-7 has-text-link free-label';
					freeLabel.textContent = '2 months free';
					box.querySelector ('div').appendChild (freeLabel);
				}
			} else if (freeLabel) {
				freeLabel.remove ();
			}
		});
	};

	const updateAddons = () => {
		elements.addonRows.forEach (row => {
			const addonName = row.querySelector ('p.has-text-weight-bold').textContent;
			const checkbox = row.querySelector ('input[type="checkbox"]');
			const priceLabel = row.querySelector ('p.has-text-primary');

			const addonPrice = getPrice (addonName, state.formData.billing, state.formData.currency, config.basePrices);
			priceLabel.textContent = `+${formatPrice (addonPrice, state.formData.billing, state.formData.currency)}`;

			const isSelected = state.formData.addons.some (a => a.name === addonName);
			row.classList.toggle ('is-selected', isSelected);
			checkbox.checked = isSelected;
		});
	};

	const updateSummary = () => {
		const {plan, billing, addons} = state.formData;
		const billingDisplay = billing === 'monthly' ? 'Monthly' : 'Yearly';

		const basePlanPrice = getPrice (plan, state.formData.billing, state.formData.currency, config.basePrices);
		let total = basePlanPrice;
		let html = `
            <div class="is-flex is-justify-content-space-between is-align-items-center mb-4 pb-4" style="border-bottom: 1px solid #dbdbdb;">
                <div>
                    <p class="has-text-weight-bold">${plan} (${billingDisplay})</p>
                    <a href="#" class="is-size-7 has-text-grey" style="text-decoration: underline;" id="change-plan">Change</a>
                </div>
                <p class="has-text-weight-bold">${formatPrice (basePlanPrice, state.formData.billing, state.formData.currency)}</p>
            </div>
        `;

		addons.forEach (addon => {
			const price = getPrice (addon.name, state.formData.billing, state.formData.currency, config.basePrices);
			if (total !== null && price !== null) {
				total += price;
			} else {
				total = null;
			}
			html += `
                <div class="is-flex is-justify-content-space-between mb-2">
                    <p class="has-text-grey is-size-7">${addon.name}</p>
                    <p class="is-size-7">+${formatPrice (price, state.formData.billing, state.formData.currency)}</p>
                </div>
            `;
		});

		elements.summaryBox.innerHTML = html;

		const totalText = billing === 'monthly' ? 'Total (per month)' : 'Total (per year)';
		elements.totalRow.innerHTML = `
            <p class="has-text-grey is-size-7">${totalText}</p>
            <p class="has-text-primary is-size-4 has-text-weight-bold">+${formatPrice (total, state.formData.billing, state.formData.currency)}</p>
        `;
	};

	const validateStep1 = () => {
		let isValid = true;
		Object.entries (elements.inputs).forEach (([key, input]) => {
			input.classList.remove ('is-danger');
			const field = input.closest ('.field');
			const existingHelp = field.querySelector ('.help.is-danger');
			if (existingHelp) existingHelp.remove ();

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
		const help = document.createElement ('p');
		help.className = 'help is-danger';
		help.textContent = message;
		input.closest ('.field').appendChild (help);
	};

	elements.container.addEventListener ('click', (e) => {
		const target = e.target;

		// Next Button
		if (target.matches ('.button.primary, .button.is-primary')) {
			if (state.currentStep === 0 && !validateStep1 ()) return;

			if (state.currentStep < elements.steps.length - 1) {
				if (target.textContent.trim () === 'Confirm') {
					state.currentStep = 4;
				} else {
					state.currentStep++;
				}
				updateStepVisibility ();
				if (state.currentStep === 2) updateAddons ();
				if (state.currentStep === 3) updateSummary ();
			}
			return;
		}

		// Back Button
		if (target.matches ('.button.is-text')) {
			if (state.currentStep > 0) {
				state.currentStep--;
				updateStepVisibility ();
			}
			return;
		}

		if (target.id === 'change-plan') {
			e.preventDefault ();
			state.currentStep = 1;
			updateStepVisibility ();
			return;
		}

		const planBox = target.closest ('.plan-box');
		if (planBox) {
			state.formData.plan = planBox.querySelector ('p.has-text-weight-bold').textContent;
			updatePlanSelection ();
			return;
		}

		const addonRow = target.closest ('.addon-row');
		if (addonRow) {
			const checkbox = addonRow.querySelector ('input[type="checkbox"]');
			if (target !== checkbox) checkbox.checked = !checkbox.checked;

			const addonName = addonRow.querySelector ('p.has-text-weight-bold').textContent;
			if (checkbox.checked) {
				if (!state.formData.addons.some (a => a.name === addonName)) {
					state.formData.addons.push ({name: addonName});
				}
			} else {
				state.formData.addons = state.formData.addons.filter (a => a.name !== addonName);
			}
			updateAddons ();
		}
	});

	elements.billingToggle.addEventListener ('change', () => {
		state.formData.billing = elements.billingToggle.checked ? 'yearly' : 'monthly';
		const isYearly = state.formData.billing === 'yearly';

		elements.yearlyLabel.classList.toggle ('has-text-weight-bold', isYearly);
		elements.yearlyLabel.classList.toggle ('has-text-grey', !isYearly);
		elements.monthlyLabel.classList.toggle ('has-text-weight-bold', !isYearly);
		elements.monthlyLabel.classList.toggle ('has-text-grey', isYearly);

		updatePlanSelection ();
		updateAddons ();
	});

	elements.currencySelector.addEventListener ('change', () => {
		state.formData.currency = elements.currencySelector.value;
		if (state.formData.currency !== currencyConfig.baseCurrency) {
			fetchRates (
				() => {
					updatePlanSelection ();
					updateAddons ();
					if (state.currentStep === 3) updateSummary ();
				},
				() => {
					// Switch back to GBP on error
					state.formData.currency = 'GBP';
					elements.currencySelector.value = 'GBP';
					updatePlanSelection ();
					updateAddons ();
					if (state.currentStep === 3) updateSummary ();

					const control = elements.currencySelector.closest ('.control');
					const tooltip = document.createElement ('div');
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
			).then (_r => {});
		} else {
			updatePlanSelection ();
			updateAddons ();
		}
	});

	// --- Settings & Test Mode ---
	const toggleModal = () => {
		elements.settingsModal.classList.toggle ('is-active');
	};

	elements.settingsCog.addEventListener ('click', toggleModal);

	elements.settingsModal.querySelector ('.modal-background').addEventListener ('click', toggleModal);
	elements.settingsModal.querySelector ('.delete').addEventListener ('click', toggleModal);

	elements.testModeToggle.addEventListener ('change', () => {
		document.body.classList.toggle ('test-mode-enabled', elements.testModeToggle.checked);
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
	updatePlanSelection ();
	updateAddons ();
	updateStepVisibility ();
});
