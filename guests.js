const GUESTS_API_URL = 'http://localhost:8080/api/guests';
let guestsCache = [];
let currentGuestId = null; // For editing

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return token;
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Fetch all guests from API
async function fetchGuests() {
    const token = checkAuth();
    if (!token) return [];

    try {
        const response = await fetch(GUESTS_API_URL, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            alert('Ваша сесія закінчилась. Будь ласка, увійдіть знову.');
            window.location.href = 'login.html';
            return [];
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const guests = await response.json();
        guestsCache = guests;
        return guests;
    } catch (error) {
        console.error('Error fetching guests:', error);
        showError('Помилка завантаження гостей: ' + error.message);
        return [];
    }
}

// Create new guest
async function createGuest(guestData) {
    const token = checkAuth();
    if (!token) return null;

    try {
        const response = await fetch(GUESTS_API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(guestData)
        });

        if (response.status === 401 || response.status === 403) {
            alert('Ваша сесія закінчилась. Будь ласка, увійдіть знову.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return null;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const newGuest = await response.json();
        showSuccess('Гостя успішно створено');
        return newGuest;
    } catch (error) {
        console.error('Error creating guest:', error);
        showError('Помилка створення гостя: ' + error.message);
        return null;
    }
}

// Update guest
async function updateGuest(guestId, guestData) {
    const token = checkAuth();
    if (!token) return null;

    try {
        const response = await fetch(`${GUESTS_API_URL}/${guestId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(guestData)
        });

        if (response.status === 401 || response.status === 403) {
            alert('Помилка авторизації. Будь ласка, увійдіть знову.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return null;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const updatedGuest = await response.json();
        showSuccess('Гостя успішно оновлено');
        return updatedGuest;
    } catch (error) {
        console.error('Error updating guest:', error);
        showError('Помилка оновлення гостя: ' + error.message);
        return null;
    }
}

// Delete guest
async function deleteGuest(guestId) {
    if (!confirm('Ви впевнені, що хочете видалити цього гостя?')) {
        return;
    }

    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${GUESTS_API_URL}/${guestId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            alert('Ваша сесія закінчилась. Будь ласка, увійдіть знову.');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await renderGuests();
        showSuccess('Гостя успішно видалено');
    } catch (error) {
        console.error('Error deleting guest:', error);
        showError('Помилка видалення гостя: ' + error.message);
    }
}

// Render single guest card
function renderGuest(guest) {
    return `
        <div class="guest-card">
            <div class="guest-card-header">
                <div class="guest-avatar">
                    ${guest.name.charAt(0).toUpperCase()}
                </div>
                <div class="guest-card-info">
                    <h3 class="guest-card-name">${guest.name}</h3>
                    ${guest.email ? `<p class="guest-card-email">${guest.email}</p>` : ''}
                </div>
            </div>
            ${guest.telephone ? `
            <div class="guest-card-detail">
                <span class="detail-icon">📞</span>
                <span>${guest.telephone}</span>
            </div>
            ` : ''}
            <div class="guest-card-actions">
                <button class="btn-card btn-edit" onclick="openEditGuestModal('${guest.id}')">
                    <span>✏️</span> Редагувати
                </button>
                <button class="btn-card btn-delete" onclick="deleteGuest('${guest.id}')">
                    <span>🗑️</span> Видалити
                </button>
            </div>
        </div>
    `;
}

// Filter guests by search query
function filterGuests(guests, searchQuery) {
    if (!searchQuery) return guests;

    const query = searchQuery.toLowerCase().trim();
    return guests.filter(guest =>
        guest.name.toLowerCase().includes(query) ||
        (guest.email && guest.email.toLowerCase().includes(query))
    );
}

// Render all guests
async function renderGuests() {
    const guestsList = document.getElementById('guests-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-guest');

    // Show loading
    guestsList.style.display = 'grid';
    emptyState.style.display = 'none';
    guestsList.innerHTML = '<div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;"><h2>Завантаження гостей...</h2></div>';

    const guests = await fetchGuests();
    const searchQuery = searchInput ? searchInput.value : '';
    const filteredGuests = filterGuests(guests, searchQuery);

    if (guests.length === 0) {
        guestsList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    if (filteredGuests.length === 0) {
        guestsList.innerHTML = '<div class="empty-state" style="display: block; grid-column: 1/-1;"><h2>Гостей за вашим запитом не знайдено</h2></div>';
        emptyState.style.display = 'none';
    } else {
        guestsList.style.display = 'grid';
        emptyState.style.display = 'none';
        guestsList.innerHTML = filteredGuests.map(guest => renderGuest(guest)).join('');
    }
}

// Open guest modal (create mode)
function openGuestModal() {
    currentGuestId = null;
    const modal = document.getElementById('guest-modal');
    const modalTitle = document.getElementById('modal-title');
    const submitBtn = document.getElementById('submit-btn');
    const form = document.getElementById('guest-form');

    modalTitle.textContent = 'Додати гостя';
    submitBtn.textContent = 'Створити';
    form.reset();
    modal.style.display = 'flex';
}

// Open guest modal (edit mode)
function openEditGuestModal(guestId) {
    const guest = guestsCache.find(g => g.id === guestId);
    if (!guest) {
        showError('Гостя не знайдено');
        return;
    }

    currentGuestId = guestId;
    const modal = document.getElementById('guest-modal');
    const modalTitle = document.getElementById('modal-title');
    const submitBtn = document.getElementById('submit-btn');

    modalTitle.textContent = 'Редагувати гостя';
    submitBtn.textContent = 'Зберегти';

    // Fill form with guest data
    document.getElementById('guest-name').value = guest.name || '';
    document.getElementById('guest-email').value = guest.email || '';
    document.getElementById('guest-phone').value = guest.telephone || '';

    modal.style.display = 'flex';
}

// Close guest modal
function closeGuestModal() {
    const modal = document.getElementById('guest-modal');
    modal.style.display = 'none';
    currentGuestId = null;
    document.getElementById('guest-form').reset();
}

// Show error message
function showError(message) {
    const guestsList = document.getElementById('guests-list');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.gridColumn = '1/-1';
    guestsList.prepend(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
}

// Show success message
function showSuccess(message) {
    const guestsList = document.getElementById('guests-list');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.gridColumn = '1/-1';
    guestsList.prepend(successDiv);

    setTimeout(() => successDiv.remove(), 3000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    renderGuests();

    // Search functionality
    const searchInput = document.getElementById('search-guest');
    if (searchInput) {
        searchInput.addEventListener('input', renderGuests);
    }

    // Handle guest form submission
    const guestForm = document.getElementById('guest-form');
    if (guestForm) {
        guestForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('guest-name').value.trim();
            const email = document.getElementById('guest-email').value.trim();
            const phone = document.getElementById('guest-phone').value.trim();

            if (!name) {
                alert('Будь ласка, введіть ім\'я гостя');
                return;
            }

            // Validate email uniqueness (only if email is provided)
            if (email) {
                const emailExists = guestsCache.some(guest =>
                    guest.email &&
                    guest.email.toLowerCase() === email.toLowerCase() &&
                    guest.id !== currentGuestId
                );

                if (emailExists) {
                    alert('Гість з таким email вже існує. Будь ласка, використайте інший email.');
                    return;
                }
            }

            // Create guest data object
            const guestData = { name };
            if (email) guestData.email = email;
            if (phone) guestData.telephone = phone;

            let result;
            if (currentGuestId) {
                // Update existing guest
                result = await updateGuest(currentGuestId, guestData);
            } else {
                // Create new guest
                result = await createGuest(guestData);
            }

            if (result) {
                closeGuestModal();
                await renderGuests();
            }
        });
    }

    // Close modal on outside click
    window.onclick = (event) => {
        const modal = document.getElementById('guest-modal');
        if (event.target === modal) {
            closeGuestModal();
        }
    };
});
