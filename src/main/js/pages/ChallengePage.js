// src/main/js/pages/ChallengePage.js

const { ExcelReader } = require('../utils/ExcelReader');
const { DynamicFieldHandler } = require('../utils/DynamicFieldHandler');

class ChallengePage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.excelReader = new ExcelReader();
        this.fieldHandler = new DynamicFieldHandler(page);
    }

    /**
     * Process a single row from Excel
     * @param {number} rowIndex - Row index to process
     */
    async processRow(rowIndex) {
        try {
            console.log(`\n📝 Processing row ${rowIndex + 1}`);
            
            // Get data from Excel
            const rowData = this.excelReader.readRowData(rowIndex);
            const formData = this.excelReader.mapToFormFields(rowData);
            
            console.log('Row data:', formData);

            // Wait for fields to be ready
            await this.fieldHandler.waitForStability();

            // Fill all fields
            const fillSuccess = await this.fieldHandler.fillAllFields(formData);
            
            if (!fillSuccess) {
                throw new Error('Failed to fill all fields');
            }

            // Validate fields before submit
            const validationSuccess = await this.fieldHandler.validateFields(formData);
            
            if (!validationSuccess) {
                throw new Error('Field validation failed');
            }

            // Click Submit
            await this.fieldHandler.clickSubmit();

            console.log(`✅ Row ${rowIndex + 1} processed successfully`);
            return true;

        } catch (error) {
            console.error(`❌ Error processing row ${rowIndex + 1}:`, error.message);
            throw error;
        }
    }

    /**
     * Complete the full challenge
     */
    async completeChallenge() {
        try {
            const totalRows = this.excelReader.getTotalRows();
            console.log(`🚀 Starting challenge with ${totalRows} rows`);

            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < totalRows; i++) {
                try {
                    await this.processRow(i);
                    successCount++;
                    
                } catch (error) {
                    errorCount++;
                    console.error(`Row ${i + 1} failed, continuing with next row...`);
                    
                    // Quick recovery wait
                    await this.page.waitForTimeout(500);
                }
            }

            const result = {
                total: totalRows,
                success: successCount,
                errors: errorCount,
                successRate: (successCount / totalRows) * 100
            };

            console.log(`\n🏁 Challenge completed!`);
            console.log(`✅ Successful: ${result.success}`);
            console.log(`❌ Errors: ${result.errors}`);
            console.log(`📊 Success rate: ${result.successRate.toFixed(2)}%`);

            return result;

        } catch (error) {
            console.error('❌ Fatal error in challenge:', error.message);
            throw error;
        }
    }
}

module.exports = { ChallengePage };
