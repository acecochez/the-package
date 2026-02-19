export const elements = {
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
