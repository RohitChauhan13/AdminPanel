// DOM element references
const emailInput = document.getElementById('emailInput');
const fetchByEmailBtn = document.getElementById('fetchByEmailBtn');
const fetchAllBtn = document.getElementById('fetchAllBtn');
const clearBtn = document.getElementById('clearBtn');
const tokenListDiv = document.getElementById('tokenList');
const selectAllCheckbox = document.getElementById('selectAll');
const titleInput = document.getElementById('titleInput');
const bodyInput = document.getElementById('bodyInput');
const sendBtn = document.getElementById('sendBtn');
const customAlert = document.getElementById('customAlert');

// Store token data with email information
let tokenData = [];

// Custom alert function
function showAlert(message, type = 'success') {
    customAlert.textContent = message;
    customAlert.className = `alert ${type}`;
    customAlert.style.display = 'block';

    setTimeout(() => {
        customAlert.style.display = 'none';
    }, 3000);
}

// Clear token list
function clearTokens() {
    tokenListDiv.innerHTML = '<div class="empty-state">No tokens loaded. Use the buttons above to fetch tokens.</div>';
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
    tokenData = [];
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Display tokens with email information
function displayTokens(tokens) {
    tokenListDiv.innerHTML = '';
    tokenData = tokens;

    if (tokens.length === 0) {
        tokenListDiv.innerHTML = '<div class="empty-state">No tokens found.</div>';
        return;
    }

    tokens.forEach((tokenInfo, index) => {
        const div = document.createElement('div');
        div.className = 'token-item';

        div.innerHTML = `
            <input type="checkbox" class="tokenCheckbox" value="${index}" data-token="${tokenInfo.token}" data-email="${tokenInfo.email || 'No email'}">
            <div class="token-info">
                <div class="token-email">${tokenInfo.email || 'No email provided'}</div>
                <div class="token-value">${tokenInfo.token}</div>
                ${tokenInfo.created_at ? `<div class="token-created">Created: ${formatDate(tokenInfo.created_at)}</div>` : ''}
            </div>
        `;
        tokenListDiv.appendChild(div);
    });

    updateSelectAllState();
}

// Update select all checkbox
function updateSelectAllState() {
    const allCheckboxes = document.querySelectorAll('.tokenCheckbox');
    const checkedCheckboxes = document.querySelectorAll('.tokenCheckbox:checked');

    if (allCheckboxes.length === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (checkedCheckboxes.length === allCheckboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else if (checkedCheckboxes.length === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else {
        selectAllCheckbox.indeterminate = true;
    }
}

// Fetch token by email
fetchByEmailBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) {
        showAlert("Please enter an email", 'warning');
        emailInput.focus();
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert("Please enter a valid email address", 'warning');
        emailInput.focus();
        return;
    }

    fetchByEmailBtn.disabled = true;
    fetchByEmailBtn.textContent = 'Loading...';

    try {
        const res = await fetch(`https://rohitsbackend.onrender.com/token/${email}`, {
            cache: "no-store"
        });
        const data = await res.json();

        if (data.success && data.token) {
            // Wrap single token in array with email info
            const tokenInfo = {
                token: data.token.token,
                email: email,
                created_at: data.token.created_at
            };
            displayTokens([tokenInfo]);
            showAlert(`Found token for ${email}`, 'success');
        } else {
            displayTokens([]);
            showAlert(data.message || 'No tokens found for this email', 'warning');
        }
    } catch (err) {
        console.error('Error fetching token:', err);
        showAlert("Error fetching token. Please try again.", 'error');
        displayTokens([]);
    } finally {
        fetchByEmailBtn.disabled = false;
        fetchByEmailBtn.textContent = 'Fetch Token';
    }
});

// Fetch all tokens
fetchAllBtn.addEventListener('click', async () => {
    fetchAllBtn.disabled = true;
    fetchAllBtn.textContent = 'Loading...';

    try {
        const res = await fetch('https://rohitsbackend.onrender.com/all-token', {
            cache: "no-store"
        });
        const data = await res.json();

        if (data.success && data.tokens && data.tokens.length > 0) {
            // Map tokens to include email info
            const tokensWithInfo = data.tokens.map(tokenInfo => ({
                token: tokenInfo.token,
                email: tokenInfo.email || 'No email',
                created_at: tokenInfo.created_at
            }));

            displayTokens(tokensWithInfo);
            showAlert(`Loaded ${tokensWithInfo.length} total tokens`, 'success');
        } else {
            displayTokens([]);
            showAlert("No tokens found", 'warning');
        }
    } catch (err) {
        console.error('Error fetching all tokens:', err);
        showAlert("Error fetching all tokens. Please try again.", 'error');
        displayTokens([]);
    } finally {
        fetchAllBtn.disabled = false;
        fetchAllBtn.textContent = 'Get All Tokens';
    }
});

// Clear button
clearBtn.addEventListener('click', () => {
    clearTokens();
    emailInput.value = '';
    titleInput.value = '';
    bodyInput.value = '';
    showAlert("Cleared all data", 'success');
    emailInput.focus();
});

// Select all checkbox
selectAllCheckbox.addEventListener('change', () => {
    const allCheckboxes = document.querySelectorAll('.tokenCheckbox');
    allCheckboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
});

// Update select all when individual checkbox changes
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('tokenCheckbox')) {
        updateSelectAllState();
    }
});

// Send notification
sendBtn.addEventListener('click', async () => {
    const selectedCheckboxes = document.querySelectorAll('.tokenCheckbox:checked');
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    // Validation
    if (!title || !body) {
        showAlert("Please enter both title and message", 'warning');
        if (!title) titleInput.focus();
        else bodyInput.focus();
        return;
    }

    if (selectedCheckboxes.length === 0) {
        showAlert("Please select at least one token", 'warning');
        return;
    }

    // Prepare selected tokens and emails properly
    const selectedData = Array.from(selectedCheckboxes).map(checkbox => {
        const index = parseInt(checkbox.value);
        const tokenInfo = tokenData[index];
        return {
            token: tokenInfo.token,
            email: tokenInfo.email
        };
    });

    // Extract all tokens and emails (maintaining the mapping)
    const tokens = selectedData.map(item => item.token);
    const emails = selectedData.map(item => item.email);

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    try {
        // Send both tokens and emails as arrays to maintain proper mapping
        const payload = {
            token: tokens,  // Array of all selected tokens
            email: emails,  // Array of corresponding emails 
            title,
            body
        };

        console.log('Sending payload:', payload); // Debug log

        const res = await fetch('https://rohitsbackend.onrender.com/send-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            const uniqueEmailCount = [...new Set(emails)].length;
            showAlert(`Notification sent successfully to ${uniqueEmailCount} user(s) with ${tokens.length} token(s)`, 'success');

            // Clear form
            titleInput.value = '';
            bodyInput.value = '';

            // Uncheck all checkboxes
            const allCheckboxes = document.querySelectorAll('.tokenCheckbox');
            allCheckboxes.forEach(cb => cb.checked = false);
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else {
            showAlert(data.error || data.message || "Failed to send notification", 'error');
        }
    } catch (err) {
        console.error('Error sending notification:', err);
        showAlert("Error sending notification. Please try again.", 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Notification';
    }
});

// Enable Enter key for email input
emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchByEmailBtn.click();
    }
});

// Enable Enter key for title and body inputs
titleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        bodyInput.focus();
    }
});

bodyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Token Notification Admin Panel loaded');
    clearTokens();
    emailInput.focus();
});