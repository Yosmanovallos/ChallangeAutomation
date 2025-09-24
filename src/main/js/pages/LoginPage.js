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
    await this.page.getByRole('button', { name: 'Start' }).waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Execute the complete login flow
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async login(email, password) {
    // 1) Start -> abre modal
    await this.page.getByRole('button', { name: 'Start' }).click();

    // 2) Cambiar a login
    const orLoginBtn = this.page.getByRole('button', { name: 'OR LOGIN', exact: true });
    await expect(orLoginBtn).toBeVisible();
    await orLoginBtn.click();

    // 3) Scoping: contenedor que tenga el botón "LOG IN"
    //    (evita que getByPlaceholder('Email') encuentre 2 elementos)
    const loginContainer = this.page
      .locator('div')
      .filter({ has: this.page.getByRole('button', { name: 'LOG IN' }) })
      .first();

    await expect(loginContainer).toBeVisible({ timeout: 10000 });

    // 4) Llenar credenciales dentro del contenedor de login
    const emailInput = loginContainer.getByPlaceholder('Email').first();
    const passwordInput = loginContainer.getByPlaceholder('Password').first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await emailInput.fill(email);
    await passwordInput.fill(password);

    // 5) Login y esperar a que se pueda iniciar el challenge
    const loginBtn = loginContainer.getByRole('button', { name: 'LOG IN' });
    await expect(loginBtn).toBeEnabled();
    await loginBtn.click();

    // Espera a que el modal se cierre y el botón "Start" esté listo de nuevo
    const startButton = this.page.locator('button:has-text("Start")');
    await expect(startButton).toBeVisible({ timeout: 10000 });

    // 6) Iniciar challenge y esperar inputs visibles
    await Promise.all([
      this.page.locator('input.bubble-element.Input').first().waitFor({ state: 'visible', timeout: 15000 }),
      startButton.click(),
    ]);
  }
}

module.exports = { LoginPage };