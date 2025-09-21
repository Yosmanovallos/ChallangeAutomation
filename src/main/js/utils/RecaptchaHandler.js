// src/main/js/utils/RecaptchaHandler.js

class RecaptchaHandler {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    /**
     * Check if reCAPTCHA popup is visible
     * @returns {Promise<boolean>} True if reCAPTCHA is present
     */
    async isRecaptchaVisible() {
        try {
            // Check for the reCAPTCHA popup by looking for the warning text
            const recaptchaPopup = this.page.locator('div.bubble-element.Popup:has-text("Get through this reCAPTCHA to continue")');
            const isVisible = await recaptchaPopup.isVisible({ timeout: 1000 });
            
            if (isVisible) {
                console.log('🤖 reCAPTCHA detected!');
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Handle reCAPTCHA by clicking the checkbox
     * @returns {Promise<boolean>} True if reCAPTCHA was handled successfully
     */
    async handleRecaptcha() {
        try {
            console.log('🔧 Handling reCAPTCHA...');
            
            // Wait for reCAPTCHA popup to be fully loaded
            await this.page.waitForTimeout(1000);
            
            // Find the reCAPTCHA checkbox button
            const checkbox = this.page.locator('div.bubble-element.Popup:has-text("Get through this reCAPTCHA to continue") >> button.bubble-element.Button');
            
            if (await checkbox.count() > 0) {
                // Click the checkbox
                await checkbox.first().click({ force: true });
                console.log('✅ reCAPTCHA checkbox clicked');
                
                // Wait for reCAPTCHA to process
                await this.page.waitForTimeout(2000);
                
                // Check if reCAPTCHA popup is gone
                const isStillVisible = await this.isRecaptchaVisible();
                if (!isStillVisible) {
                    console.log('✅ reCAPTCHA completed successfully');
                    return true;
                } else {
                    console.log('⚠️ reCAPTCHA still visible, may need additional handling');
                    return false;
                }
            } else {
                console.log('❌ reCAPTCHA checkbox not found');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error handling reCAPTCHA:', error.message);
            return false;
        }
    }

    /**
     * Wait for reCAPTCHA to be resolved (if present)
     * @returns {Promise<boolean>} True if no reCAPTCHA or if resolved successfully
     */
    async waitForRecaptchaResolution() {
        try {
            const isPresent = await this.isRecaptchaVisible();
            
            if (isPresent) {
                console.log('🤖 reCAPTCHA detected, attempting to resolve...');
                const resolved = await this.handleRecaptcha();
                
                if (resolved) {
                    console.log('✅ reCAPTCHA resolved, continuing...');
                    return true;
                } else {
                    console.log('❌ Failed to resolve reCAPTCHA');
                    return false;
                }
            }
            
            return true; // No reCAPTCHA present, continue normally
            
        } catch (error) {
            console.error('❌ Error waiting for reCAPTCHA resolution:', error.message);
            return false;
        }
    }

    /**
     * Check and handle reCAPTCHA multiple times if needed
     * @param {number} maxAttempts - Maximum number of attempts to resolve reCAPTCHA
     * @returns {Promise<boolean>} True if successful
     */
    async resolveRecaptcha(maxAttempts = 3) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`🔄 reCAPTCHA resolution attempt ${attempt}/${maxAttempts}`);
            
            const resolved = await this.waitForRecaptchaResolution();
            
            if (resolved) {
                return true;
            }
            
            if (attempt < maxAttempts) {
                console.log(`⏳ Waiting before retry...`);
                await this.page.waitForTimeout(1000);
            }
        }
        
        console.log('❌ Failed to resolve reCAPTCHA after all attempts');
        return false;
    }
}

module.exports = { RecaptchaHandler };
