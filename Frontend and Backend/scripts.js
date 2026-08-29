/**
 * Advanced Employee Management System
 * Modern ES6+ Implementation with Async/Await, Form Validation, and Advanced Features
 */

// Configuration
const CONFIG = {
    API_ENDPOINT: "https://gilvifqize.execute-api.ap-south-1.amazonaws.com/employee",
    
    
    CACHE_KEY: "employees_cache",
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Debounce function to prevent excessive API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 */
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Format currency values
 * @param {number} value - Value to format
 */
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
    }).format(value);
};

/**
 * Escape values before inserting them into table HTML
 * @param {*} value - Value to escape
 * @returns {string} - HTML-safe string
 */
const escapeHtml = (value) => {
    const element = document.createElement('div');
    element.textContent = value ?? '';
    return element.innerHTML;
};

/**
 * Show status message with animation
 * @param {string} message - Message to display
 * @param {string} type - Message type: success, error, info
 * @param {number} duration - Auto-hide duration in ms (0 = no auto-hide)
 */
const showMessage = (message, type = 'info', duration = 3000) => {
    const messageEl = document.getElementById('statusMessage');
    messageEl.textContent = message;
    messageEl.className = `status-message show ${type}`;
    
    if (duration > 0) {
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, duration);
    }
};

/**
 * Show form field error
 * @param {string} fieldId - Form field ID
 * @param {string} message - Error message
 */
const showFieldError = (fieldId, message) => {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    
    if (field) {
        field.classList.add('error');
    }
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
};

/**
 * Clear form field error
 * @param {string} fieldId - Form field ID
 */
const clearFieldError = (fieldId) => {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    
    if (field) {
        field.classList.remove('error');
    }
    if (errorEl) {
        errorEl.classList.remove('show');
        errorEl.textContent = '';
    }
};

/**
 * Validate employee form
 * @returns {boolean} - True if form is valid
 */
const validateForm = () => {
    const fields = ['employeeid', 'name', 'department', 'salary'];
    let isValid = true;
    
    fields.forEach(field => {
        const value = document.getElementById(field).value.trim();
        clearFieldError(field);
        
        if (!value) {
            showFieldError(field, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
            isValid = false;
        } else if (field === 'salary' && isNaN(parseFloat(value))) {
            showFieldError(field, 'Salary must be a valid number');
            isValid = false;
        } else if (field === 'employeeid') {
            if (value.length < 2) {
                showFieldError(field, 'Employee ID must be at least 2 characters');
                isValid = false;
            } else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                showFieldError(field, 'Employee ID can only contain letters, numbers, hyphens and underscores');
                isValid = false;
            }
        } else if (field === 'name' && value.length < 2) {
            showFieldError(field, 'Name must be at least 2 characters');
            isValid = false;
        }
    });
    
    return isValid;
};

// ==================== API FUNCTIONS ====================

/**
 * Fetch all employees from API with caching
 * @returns {Promise<Array>} - Array of employees
 */
const fetchEmployees = async () => {
    try {
        showLoadingState(true);
        
        // Check cache first
        const cached = getCache();
        if (cached) {
            console.log('Using cached employee data');
            return cached;
        }
        
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache the data
        saveCache(data);
        
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching employees:', error);
        showMessage(`Failed to load employees: ${error.message}`, 'error');
        return [];
    } finally {
        showLoadingState(false);
    }
};

/**
 * Save employee data to API
 * @param {Object} employeeData - Employee data object
 * @returns {Promise<boolean>} - True if successful
 */
const saveEmployee = async (employeeData) => {
    try {
        showLoadingState(true);
        
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(employeeData)
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        // Clear cache on successful save
        clearCache();
        
        return true;
    } catch (error) {
        console.error('Error saving employee:', error);
        showMessage(`Failed to save employee: ${error.message}`, 'error');
        return false;
    } finally {
        showLoadingState(false);
    }
};

/**
 * Delete employee from API
 * @param {string} employeeId - Employee ID to delete
 * @returns {Promise<boolean>} - True if successful
 */
const deleteEmployee = async (employeeId) => {
    try {
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ employeeid: employeeId })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        // Clear cache on successful delete
        clearCache();
        return true;
    } catch (error) {
        console.error('Error deleting employee:', error);
        showMessage(`Failed to delete employee: ${error.message}`, 'error');
        return false;
    }
};

// ==================== CACHE FUNCTIONS ====================

/**
 * Save data to localStorage cache
 * @param {Array} data - Data to cache
 */
const saveCache = (data) => {
    try {
        const cacheData = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.warn('Failed to save cache:', error);
    }
};

/**
 * Get cached data from localStorage
 * @returns {Array|null} - Cached data or null if expired/not found
 */
const getCache = () => {
    try {
        const cached = localStorage.getItem(CONFIG.CACHE_KEY);
        if (!cached) return null;
        
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache has expired
        if (now - cacheData.timestamp > CONFIG.CACHE_DURATION) {
            clearCache();
            return null;
        }
        
        return cacheData.data;
    } catch (error) {
        console.warn('Failed to retrieve cache:', error);
        return null;
    }
};

/**
 * Clear localStorage cache
 */
const clearCache = () => {
    try {
        localStorage.removeItem(CONFIG.CACHE_KEY);
    } catch (error) {
        console.warn('Failed to clear cache:', error);
    }
};

// ==================== UI FUNCTIONS ====================

/**
 * Show/hide loading spinner
 * @param {boolean} show - Show or hide
 */
const showLoadingState = (show) => {
    const spinner = document.getElementById('loadingSpinner');
    const btn = document.getElementById('getemployees');
    
    if (show) {
        spinner.classList.add('show');
        btn.disabled = true;
    } else {
        spinner.classList.remove('show');
        btn.disabled = false;
    }
};

/**
 * Clear form inputs
 */
const clearFormInputs = () => {
    const form = document.getElementById('employeeForm');
    form.reset();
    
    // Clear all error messages
    ['employeeid', 'name', 'department', 'salary'].forEach(field => {
        clearFieldError(field);
    });
};

/**
 * Display employees in table
 * @param {Array} employees - Array of employee objects
 */
const displayEmployees = (employees) => {
    const tbody = document.getElementById('employeeTableBody');
    const tableWrapper = document.getElementById('tableWrapper');
    const emptyState = document.getElementById('emptyState');
    const statsBar = document.getElementById('statsBar');
    
    if (!employees || employees.length === 0) {
        tableWrapper.classList.remove('show');
        emptyState.classList.add('show');
        statsBar.style.display = 'none';
        return;
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Add employee rows
    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(employee.employeeid)}</td>
            <td>${escapeHtml(employee.name)}</td>
            <td>${escapeHtml(employee.department)}</td>
            <td>${formatCurrency(parseFloat(employee.salary) || 0)}</td>
            <td class="action-cell">
                <button class="btn-action btn-edit" onclick="openEditModal('${escapeHtml(employee.employeeid)}', '${escapeHtml(employee.name)}', '${escapeHtml(employee.department)}', '${escapeHtml(employee.salary)}')">
                    ✏️ Edit
                </button>
                <button class="btn-action btn-delete" onclick="handleDelete('${escapeHtml(employee.employeeid)}')">
                    🗑️ Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Show table and hide empty state
    tableWrapper.classList.add('show');
    emptyState.classList.remove('show');
    
    // Update statistics
    updateStatistics(employees);
    statsBar.style.display = 'flex';
};

/**
 * Update statistics bar
 * @param {Array} employees - Array of employee objects
 */
const updateStatistics = (employees) => {
    if (!employees || employees.length === 0) return;
    
    const totalEmployees = employees.length;
    const salaries = employees.map(e => parseFloat(e.salary) || 0);
    const totalPayroll = salaries.reduce((a, b) => a + b, 0);
    const avgSalary = totalPayroll / totalEmployees;
    
    document.getElementById('totalEmployees').textContent = totalEmployees;
    document.getElementById('avgSalary').textContent = formatCurrency(avgSalary);
    document.getElementById('totalPayroll').textContent = formatCurrency(totalPayroll);
};

/**
 * Get all employees (skip cache to get latest data)
 * @returns {Promise<Array>} - Array of employees
 */
const fetchEmployeesForValidation = async () => {
    try {
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching employees for validation:', error);
        return [];
    }
};

/**
 * Check if employee ID already exists
 * @param {string} employeeId - Employee ID to check
 * @returns {Promise<boolean>} - True if ID exists
 */
const employeeIdExists = async (employeeId) => {
    const employees = await fetchEmployeesForValidation();
    return employees.some(emp => emp.employeeid === employeeId);
};

// ==================== EVENT HANDLERS ====================

/**
 * Handle form submission
 */
const handleFormSubmit = async (event) => {
    event.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        showMessage('Please fix the errors above', 'error', 2000);
        return;
    }
    
    const employeeId = document.getElementById('employeeid').value.trim();
    
    // Check if employee ID already exists
    showMessage('⏳ Checking if Employee ID exists...', 'info', 0);
    const idExists = await employeeIdExists(employeeId);
    
    if (idExists) {
        showMessage('❌ Employee ID already exists! Cannot create duplicate. Please use a different ID.', 'error', 4000);
        showFieldError('employeeid', 'This Employee ID already exists in the system');
        return;
    }
    
    // Collect form data
    const employeeData = {
        employeeid: employeeId,
        name: document.getElementById('name').value.trim(),
        department: document.getElementById('department').value.trim(),
        salary: document.getElementById('salary').value.trim()
    };
    
    // Save employee
    const success = await saveEmployee(employeeData);
    
    if (success) {
        showMessage('✅ Employee saved successfully!', 'success', 3000);
        clearFormInputs();
        // Reload employees table
        const employees = await fetchEmployees();
        displayEmployees(employees);
    }
};

/**
 * Handle delete button click
 */
const handleDelete = async (employeeId) => {
    if (!confirm(`Are you sure you want to delete employee ${employeeId}?`)) {
        return;
    }
    
    const success = await deleteEmployee(employeeId);
    
    if (success) {
        showMessage('✓ Employee deleted successfully!', 'success', 2000);
        // Reload employees table
        const employees = await fetchEmployees();
        displayEmployees(employees);
    } else {
        showMessage('Failed to delete employee', 'error');
    }
};

/**
 * Open edit modal
 * @param {string} employeeId - Employee ID
 * @param {string} name - Employee name
 * @param {string} department - Employee department
 * @param {string} salary - Employee salary
 */
const openEditModal = (employeeId, name, department, salary) => {
    document.getElementById('editEmployeeid').value = employeeId;
    document.getElementById('editName').value = name;
    document.getElementById('editDepartment').value = department;
    document.getElementById('editSalary').value = salary;
    document.getElementById('editModal').classList.add('show');
};

/**
 * Close edit modal
 */
const closeEditModal = () => {
    document.getElementById('editModal').classList.remove('show');
    document.getElementById('editForm').reset();
};

/**
 * Handle edit form submission
 */
const handleEditSubmit = async (event) => {
    event.preventDefault();
    
    const employeeId = document.getElementById('editEmployeeid').value;
    const name = document.getElementById('editName').value.trim();
    const department = document.getElementById('editDepartment').value.trim();
    const salary = document.getElementById('editSalary').value.trim();
    
    // Validate
    if (!name || !department || !salary) {
        showMessage('All fields are required', 'error', 2000);
        return;
    }
    
    if (isNaN(parseFloat(salary))) {
        showMessage('Salary must be a valid number', 'error', 2000);
        return;
    }
    
    // Prepare data
    const employeeData = {
        employeeid: employeeId,
        name: name,
        department: department,
        salary: salary
    };
    
    // Save employee
    const success = await saveEmployee(employeeData);
    
    if (success) {
        showMessage('✓ Employee updated successfully!', 'success', 2000);
        closeEditModal();
        // Reload employees table
        const employees = await fetchEmployees();
        displayEmployees(employees);
    }
};

/**
 * Handle search/filter
 */
const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const tbody = document.getElementById('employeeTableBody');
    const rows = tbody.getElementsByTagName('tr');
    
    let visibleCount = 0;
    
    Array.from(rows).forEach(row => {
        const cells = row.getElementsByTagName('td');
        const text = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
        
        if (text.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Show/hide empty message based on filtered results
    const emptyState = document.getElementById('emptyState');
    if (visibleCount === 0 && searchTerm) {
        emptyState.classList.add('show');
        emptyState.textContent = '🔍 No results found';
    } else if (visibleCount === 0) {
        emptyState.classList.add('show');
    } else {
        emptyState.classList.remove('show');
    }
};

/**
 * Handle load all employees button
 */
const handleLoadEmployees = async () => {
    const employees = await fetchEmployees();
    displayEmployees(employees);
};

// ==================== INITIALIZATION ====================

/**
 * Initialize event listeners
 */
const initEventListeners = () => {
    // Form submission
    document.getElementById('employeeForm').addEventListener('submit', handleFormSubmit);
    
    // Edit form submission
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    
    // Clear form button
    document.getElementById('clearForm').addEventListener('click', clearFormInputs);
    
    // Load employees button
    document.getElementById('getemployees').addEventListener('click', handleLoadEmployees);
    
    // Search input (with debounce)
    document.getElementById('searchInput').addEventListener(
        'input',
        debounce(handleSearch, 300)
    );
    
    // Close modal when clicking outside
    document.getElementById('editModal').addEventListener('click', (event) => {
        if (event.target.id === 'editModal') {
            closeEditModal();
        }
    });
    
    // Clear field errors on input
    ['employeeid', 'name', 'department', 'salary'].forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', () => {
            clearFieldError(fieldId);
        });
    });
};

/**
 * Initialize application
 */
const initApp = () => {
    console.log('🚀 Employee Management System Initialized');
    initEventListeners();
};

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
