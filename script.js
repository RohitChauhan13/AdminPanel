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
}

// Display tokens
function displayTokens(tokens) {
    tokenListDiv.innerHTML = '';

    if (tokens.length === 0) {
        tokenListDiv.innerHTML = '<div class="empty-state">No tokens found.</div>';
        return;
    }

    tokens.forEach(token => {
        const div = document.createElement('div');
        div.className = 'token-item';
        div.innerHTML = `
            <input type="checkbox" class="tokenCheckbox" value="${token}"> 
            <span>${token}</span>
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
            displayTokens([data.token.token]); // Wrap single token in array
            showAlert(`Found token for ${email}`, 'success');
        } else {
            displayTokens([]);
            showAlert(data.message || 'No tokens found for this email', 'warning');
        }
    } catch (err) {
        console.error('Error fetching token:', err);
        showAlert("Error fetching token. Please try again.", 'error');
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
            const tokens = data.tokens.map(t => t.token);
            displayTokens(tokens);
            showAlert(`Loaded ${tokens.length} total tokens`, 'success');
        } else {
            displayTokens([]);
            showAlert("No tokens found", 'warning');
        }
    } catch (err) {
        console.error('Error fetching all tokens:', err);
        showAlert("Error fetching all tokens. Please try again.", 'error');
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
    const selectedTokens = Array.from(document.querySelectorAll('.tokenCheckbox:checked'))
        .map(cb => cb.value);
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title || !body) {
        showAlert("Please enter both title and message", 'warning');
        return;
    }

    if (selectedTokens.length === 0) {
        showAlert("Please select at least one token", 'warning');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    try {
        const payload = {
            token: selectedTokens.length === 1 ? selectedTokens[0] : selectedTokens,
            title,
            body
        };

        const res = await fetch('https://rohitsbackend.onrender.com/send-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            showAlert(`Notification sent successfully to ${selectedTokens.length} recipient(s)`, 'success');

            titleInput.value = '';
            bodyInput.value = '';

            const allCheckboxes = document.querySelectorAll('.tokenCheckbox');
            allCheckboxes.forEach(cb => cb.checked = false);
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else {
            showAlert(data.message || "Failed to send notification", 'error');
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Token Notification Admin Panel loaded');
    emailInput.focus();
});
