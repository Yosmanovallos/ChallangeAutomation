// src/main/js/pages/LoginPage.js

const { expect } = require('@playwright/test');

class LoginPage {

    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    /**
     * Navigate to the automation challenge page
     */
    async navigate() {
        await this.page.goto('https://www.theautomationchallenge.com/');
    }

    /**
     * Execute the complete login flow
     * @param {string} email - User email
     * @param {string} password - User password
     */
    async login(email, password) {
        // Step 1: Click 'Start' to open login modal
        await this.page.getByRole('button', { name: 'Start' }).click();

        // Step 2: Click 'OR LOGIN' in the registration modal
        await this.page.getByRole('button', { name: 'OR LOGIN', exact: true }).click();

        // Step 3: Fill the login form
        const emailInput = this.page.locator('input[placeholder="Email"]:visible');
        await emailInput.fill(email);

        const passwordInput = this.page.locator('input[placeholder="Password"]:visible');
        await passwordInput.fill(password);

        // Step 4: Click 'LOG IN' button
        await this.page.locator('button:has-text("LOG IN"):visible').click();

        // Wait for page to process login
        await this.page.waitForLoadState('domcontentloaded');

        // Step 5: Click 'Start' button to begin the challenge
        const startButton = this.page.locator('button:has-text("Start")');
        await expect(startButton).toBeVisible({ timeout: 10000 });
        await startButton.click();

        // Wait for page to load after starting challenge
        await this.page.waitForLoadState('domcontentloaded');
    }
}

module.exports = { LoginPage };
