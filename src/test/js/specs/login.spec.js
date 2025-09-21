// src/test/js/specs/login.spec.js

const { test } = require('@playwright/test');
const { LoginPage } = require('../../../main/js/pages/LoginPage');

// Import login data
const loginData = require('../data/login.json');

test.describe('Automation Challenge - Login', () => {

    test('should login successfully', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // Navigate to the page
        await loginPage.navigate();

        // Execute login process
        await loginPage.login(loginData.email, loginData.password);

        // Test will pass if login method completes without errors
    });

});
