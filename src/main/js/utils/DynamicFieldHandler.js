// src/main/js/utils/DynamicFieldHandler.js

const { RecaptchaHandler } = require('./RecaptchaHandler');

class DynamicFieldHandler {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.recaptchaHandler = new RecaptchaHandler(page);
    }

    /**
     * Wait for page to be stable and handle reCAPTCHA if present
     */
    async waitForStability() {
        await this.page.waitForLoadState('domcontentloaded', { timeout: 3000 });
        
        // Check and handle reCAPTCHA if present
        await this.recaptchaHandler.resolveRecaptcha();
    }

    /**
     * Find all input fields and their associated labels on the page
     * @returns {Promise<Array>} Array of field objects with label and input locators
     */
    async getAvailableFields() {
        await this.waitForStability();

        // Get all input elements and their labels
        const fieldData = await this.page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input.bubble-element.Input'));
            const fields = [];

            inputs.forEach((input, index) => {
                // Try to find associated label
                let labelText = '';
                
                // Strategy 1: Look for label in same container
                let container = input.closest('div.bubble-element.Group');
                if (container) {
                    const labelEl = container.querySelector('div.bubble-element.Text');
                    if (labelEl) {
                        labelText = labelEl.textContent?.trim() || '';
                    }
                }

                // Strategy 2: Look for nearby text elements
                if (!labelText) {
                    const nearbyDivs = Array.from(document.querySelectorAll('div')).filter(div => {
                        const rect1 = input.getBoundingClientRect();
                        const rect2 = div.getBoundingClientRect();
                        const distance = Math.abs(rect1.top - rect2.top);
                        return distance < 100 && div.textContent?.trim().length > 0;
                    });

                    if (nearbyDivs.length > 0) {
                        labelText = nearbyDivs[0].textContent?.trim() || '';
                    }
                }

                fields.push({
                    index: index,
                    label: labelText,
                    tabindex: input.getAttribute('tabindex'),
                    visible: input.offsetParent !== null
                });
            });

            return fields;
        });

        return fieldData;
    }

    /**
     * Fill a specific field by label name using tabindex
     * @param {string} labelText - Label text to find
     * @param {string} value - Value to fill
     */
    async fillFieldByLabel(labelText, value) {
        try {
            // First, get the tabindex for this label from our field detection
            const fields = await this.getAvailableFields();
            const targetField = fields.find(field => field.label === labelText && field.visible);
            
            if (!targetField) {
                return false;
            }

            // Use JavaScript to fill by tabindex (most reliable)
            const success = await this.page.evaluate(({ tabindex, value }) => {
                const input = document.querySelector(`input[tabindex="${tabindex}"]`);
                if (input && input.offsetParent !== null) { // Check if visible
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
                return false;
            }, { tabindex: targetField.tabindex, value });

            if (success) {
                return true;
            }

            // Fallback: Try container strategy
            const inputInContainer = this.page.locator(`div.bubble-element.Group:has-text("${labelText}") >> input.bubble-element.Input`);
            
            if (await inputInContainer.count() > 0) {
                await inputInContainer.first().fill(value, { force: true });
                return true;
            }

            return false;

        } catch (error) {
            console.error(`❌ Error filling field "${labelText}":`, error.message);
            return false;
        }
    }

    /**
     * Fill all form fields with provided data
     * @param {Object} formData - Data to fill in the form
     */
    async fillAllFields(formData) {
        // Check for reCAPTCHA once before filling all fields
        await this.recaptchaHandler.resolveRecaptcha();
        
        const fieldMappings = {
            'Company Name': formData.companyName,
            'Address': formData.address,
            'EIN': formData.ein,
            'Sector': formData.sector,
            'Automation Tool': formData.automationTool,
            'Annual Saving': formData.annualSaving,
            'Date': formData.date
        };

        let successCount = 0;
        let totalFields = 0;

        for (const [labelText, value] of Object.entries(fieldMappings)) {
            if (!value) continue;

            totalFields++;
            const success = await this.fillFieldByLabel(labelText, value);
            if (success) {
                successCount++;
            }
        }

        return successCount === totalFields;
    }

    /**
     * Click the Submit button
     */
    async clickSubmit() {
        try {
            // Check for reCAPTCHA before submitting
            await this.recaptchaHandler.resolveRecaptcha();
            
            const submitButton = this.page.getByRole('button', { name: 'Submit' });
            await submitButton.click({ force: true });
            
            // Quick wait for page to process
            await this.page.waitForLoadState('domcontentloaded', { timeout: 3000 });
            
        } catch (error) {
            console.error('❌ Error clicking Submit button:', error.message);
            throw error;
        }
    }

    /**
     * Validate that all fields are filled correctly
     * @param {Object} formData - Expected form data
     */
    async validateFields(formData) {
        const fieldMappings = {
            'Company Name': formData.companyName,
            'Address': formData.address,
            'EIN': formData.ein,
            'Sector': formData.sector,
            'Automation Tool': formData.automationTool,
            'Annual Saving': formData.annualSaving,
            'Date': formData.date
        };

        let allValid = true;
        const fields = await this.getAvailableFields();

        for (const [labelText, expectedValue] of Object.entries(fieldMappings)) {
            if (!expectedValue) continue;

            try {
                const targetField = fields.find(field => field.label === labelText && field.visible);
                
                if (!targetField) {
                    allValid = false;
                    continue;
                }

                const actualValue = await this.page.evaluate((tabindex) => {
                    const input = document.querySelector(`input[tabindex="${tabindex}"]`);
                    return input ? input.value : '';
                }, targetField.tabindex);
                
                if (actualValue !== String(expectedValue)) {
                    allValid = false;
                }
            } catch (error) {
                allValid = false;
            }
        }

        return allValid;
    }
}

module.exports = { DynamicFieldHandler };