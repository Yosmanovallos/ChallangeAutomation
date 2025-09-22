// src/test/js/specs/challenge.spec.js

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../../main/js/pages/LoginPage');
const { ChallengePage } = require('../../../main/js/pages/ChallengePage');

// Import login data
const loginData = require('../data/login.json');

test.describe('Automation Challenge', () => {

    test('should complete the full automation challenge', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const challengePage = new ChallengePage(page);

        // Step 1: Login
        await loginPage.navigate();
        await loginPage.login(loginData.email, loginData.password);

        // Step 2: Complete challenge
        const result = await challengePage.completeChallenge();

        // Verify results
        expect(result.total).toBeGreaterThan(0);
        expect(result.success).toBeGreaterThan(0);
        expect(result.successRate).toBeGreaterThan(70);
    });

});
