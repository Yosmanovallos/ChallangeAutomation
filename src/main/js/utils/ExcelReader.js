// src/main/js/utils/ExcelReader.js

const XLSX = require('xlsx');
const path = require('path');

class ExcelReader {
    constructor() {
        this.excelPath = path.join(__dirname, '../../../test/js/data/challenge.xlsx');
    }

    /**
     * Read all data from Excel file
     * @returns {Array} Array of objects with row data
     */
    readAllData() {
        try {
            const workbook = XLSX.readFile(this.excelPath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            console.log(`📊 Data read from Excel: ${data.length} rows`);
            return data;
        } catch (error) {
            console.error('❌ Error reading Excel file:', error);
            throw new Error(`Could not read Excel file: ${error.message}`);
        }
    }

    /**
     * Read specific row from Excel
     * @param {number} rowIndex - Row index (0-based)
     * @returns {Object} Object with row data
     */
    readRowData(rowIndex) {
        const allData = this.readAllData();
        
        if (rowIndex >= allData.length) {
            throw new Error(`Row ${rowIndex} does not exist. Total rows: ${allData.length}`);
        }
        
        return allData[rowIndex];
    }

    /**
     * Map Excel data to form fields
     * @param {Object} excelRow - Excel row data
     * @returns {Object} Mapped object for form fields
     */
    mapToFormFields(excelRow) {
        return {
            companyName: excelRow.company_name || '',
            address: excelRow.company_address || '',
            ein: excelRow.employer_identification_number || '',
            sector: excelRow.sector || '',
            automationTool: excelRow.automation_tool || '',
            annualSaving: excelRow.annual_automation_saving || '',
            date: excelRow.date_of_first_project || ''
        };
    }

    /**
     * Get total number of rows
     * @returns {number} Total number of rows
     */
    getTotalRows() {
        return this.readAllData().length;
    }
}

module.exports = { ExcelReader };