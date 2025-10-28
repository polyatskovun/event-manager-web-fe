const API_URL = 'http://localhost:8080/api/events';
let eventsCache = [];
let originalEventsState = {}; // Store original state of events for comparison

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

// Fetch events from API
async function fetchEventsFromAPI() {
    const token = checkAuth();
    if (!token) return [];

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            // Unauthorized - redirect to login
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            alert('Ваша сесія закінчилась. Будь ласка, увійдіть знову.');
            window.location.href = 'login.html';
            return [];
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const events = await response.json();
        eventsCache = events;

        // Store original state for each event (deep copy)
        events.forEach(event => {
            originalEventsState[event.id] = JSON.parse(JSON.stringify(event));
        });

        return events;
    } catch (error) {
        console.error('Error fetching events:', error);
        showError('Помилка завантаження івентів: ' + error.message);
        return [];
    }
}

// Get events (now fetches from API)
async function getEvents() {
    return await fetchEventsFromAPI();
}

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('Ви впевнені, що хочете видалити цей івент?')) {
        return;
    }

    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/${eventId}`, {
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

        // Reload events after deletion
        await renderEvents();
        showSuccess('Івент успішно видалено');
    } catch (error) {
        console.error('Error deleting event:', error);
        showError('Помилка видалення івенту: ' + error.message);
    }
}

// Show error message
function showError(message) {
    const eventsList = document.getElementById('events-list');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.gridColumn = '1/-1';
    eventsList.prepend(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
}

// Show success message
function showSuccess(message) {
    const eventsList = document.getElementById('events-list');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.gridColumn = '1/-1';
    eventsList.prepend(successDiv);

    setTimeout(() => successDiv.remove(), 3000);
}

// Compare current event state with original state
function hasEventChanged(eventId) {
    const currentEvent = eventsCache.find(e => e.id === eventId);
    const originalEvent = originalEventsState[eventId];

    if (!currentEvent || !originalEvent) return false;

    // Compare options state (most common change)
    if (currentEvent.options && originalEvent.options) {
        if (currentEvent.options.length !== originalEvent.options.length) return true;

        for (let i = 0; i < currentEvent.options.length; i++) {
            const currentOption = currentEvent.options.find(o => o.id === originalEvent.options[i].id);
            const originalOption = originalEvent.options[i];

            if (!currentOption || currentOption.done !== originalOption.done) {
                return true;
            }
        }
    }

    // Can add more field comparisons here if needed
    return false;
}

// Handle option checkbox change
function handleOptionChange(eventId, optionId, isChecked) {
    // Find the event in cache
    const event = eventsCache.find(e => e.id === eventId);
    if (!event) return;

    // Update option status in cache
    const option = event.options.find(opt => opt.id === optionId);
    if (option) {
        option.done = isChecked;
    }

    // Update visual state
    const eventCard = document.querySelector(`.event-item[data-event-id="${eventId}"]`);
    if (!eventCard) return;

    const optionElement = eventCard.querySelector(`input[data-option-id="${optionId}"]`).closest('.option-item');
    const checkboxCustom = optionElement.querySelector('.option-checkbox-custom');

    if (isChecked) {
        optionElement.classList.remove('option-pending');
        optionElement.classList.add('option-done');
        checkboxCustom.textContent = '✓';
    } else {
        optionElement.classList.remove('option-done');
        optionElement.classList.add('option-pending');
        checkboxCustom.textContent = '○';
    }

    // Check if event has changes compared to original
    const saveButton = eventCard.querySelector('.event-btn-save');
    if (saveButton) {
        if (hasEventChanged(eventId)) {
            saveButton.style.display = 'inline-block';
        } else {
            saveButton.style.display = 'none';
        }
    }
}

// Save event changes via PUT API
async function saveEvent(eventId) {
    const token = checkAuth();
    if (!token) return;

    // Find event in cache
    const event = eventsCache.find(e => e.id === eventId);
    if (!event) {
        showError('Івент не знайдено');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${eventId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(event)
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

        const updatedEvent = await response.json();

        // Update cache with response
        const index = eventsCache.findIndex(e => e.id === eventId);
        if (index !== -1) {
            eventsCache[index] = updatedEvent;
        }

        // Update original state after successful save
        originalEventsState[eventId] = JSON.parse(JSON.stringify(updatedEvent));

        // Hide save button
        const eventCard = document.querySelector(`.event-item[data-event-id="${eventId}"]`);
        if (eventCard) {
            const saveButton = eventCard.querySelector('.event-btn-save');
            if (saveButton) {
                saveButton.style.display = 'none';
            }
        }

        showSuccess('Зміни успішно збережено');
    } catch (error) {
        console.error('Error updating event:', error);
        showError('Помилка збереження змін: ' + error.message);
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
}

function getTypeLabel(type) {
    const typeLabels = {
        'BIRTHDAY': 'День народження',
        'WEDDING': 'Весілля',
        'CORPORATE': 'Корпоратив',
        'CONFERENCE': 'Конференція',
        'PARTY': 'Вечірка',
        'CHARITY': 'Благодійність',
        'OTHER': 'Інше',
        // Fallback for lowercase
        'birthday': 'День народження',
        'wedding': 'Весілля',
        'corporate': 'Корпоратив',
        'conference': 'Конференція',
        'party': 'Вечірка',
        'charity': 'Благодійність',
        'other': 'Інше'
    };
    return typeLabels[type] || type;
}

function formatTime(timeString) {
    if (!timeString) return null;
    // timeString can be "HH:MM:SS" or "HH:MM"
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
}

function formatBudget(budget) {
    if (!budget) return null;
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(budget);
}

// Generate Google Calendar link
function generateGoogleCalendarLink(event) {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

    // Event title
    const title = encodeURIComponent(event.name);

    // Event date and time
    let startDate = event.date.replace(/-/g, '');
    let endDate = startDate;

    if (event.time) {
        // If time is provided, create datetime
        const timeStr = event.time.split(':');
        startDate += `T${timeStr[0]}${timeStr[1]}00`;

        // Calculate end time (add duration or default 2 hours)
        const duration = event.duration || 2;
        const startDateTime = new Date(event.date + 'T' + event.time);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);
        const endHours = String(endDateTime.getHours()).padStart(2, '0');
        const endMinutes = String(endDateTime.getMinutes()).padStart(2, '0');
        endDate = endDateTime.toISOString().split('T')[0].replace(/-/g, '') + `T${endHours}${endMinutes}00`;
    } else {
        // All-day event
        startDate += `/${endDate}`;
        endDate = '';
    }

    // Event description
    let description = event.description || '';
    if (event.guests && event.guests.length > 0) {
        description += `\\n\\nГості: ${event.guests.map(g => g.name).join(', ')}`;
    }
    description = encodeURIComponent(description);

    // Event location
    const location = event.location ? encodeURIComponent(event.location) : '';

    // Build URL
    let url = `${baseUrl}&text=${title}`;
    if (endDate) {
        url += `&dates=${startDate}/${endDate}`;
    } else {
        url += `&dates=${startDate}`;
    }
    if (location) url += `&location=${location}`;
    if (description) url += `&details=${description}`;

    return url;
}

// Add event to Google Calendar
function addToGoogleCalendar(eventId) {
    const event = eventsCache.find(e => e.id === eventId);
    if (!event) {
        showError('Івент не знайдено');
        return;
    }

    const calendarUrl = generateGoogleCalendarLink(event);
    window.open(calendarUrl, '_blank');
}

function getTypeBadgeClass(type) {
    const typeClasses = {
        'BIRTHDAY': 'badge-birthday',
        'WEDDING': 'badge-wedding',
        'CORPORATE': 'badge-corporate',
        'CONFERENCE': 'badge-conference',
        'PARTY': 'badge-party',
        'CHARITY': 'badge-charity',
        'OTHER': 'badge-other'
    };
    return typeClasses[type] || typeClasses[type.toUpperCase()] || 'badge-other';
}

function renderEvent(event) {
    // Extract options from API format
    const optionsArray = event.options || [];

    // Get guests count
    const guestsCount = event.guests ? event.guests.length : 0;

    return `
        <div class="event-item" data-event-id="${event.id}">
            <div class="event-item-header">
                <h3 class="event-item-title">${event.name}</h3>
                <span class="event-type-badge ${getTypeBadgeClass(event.type)}">${getTypeLabel(event.type)}</span>
            </div>
            <div class="event-item-info">
                <div class="event-info-row">
                    <span class="event-info-icon">📅</span>
                    <span>${formatDate(event.date)}${event.time ? ' о ' + formatTime(event.time) : ''}</span>
                </div>
                ${event.location ? `
                <div class="event-info-row">
                    <span class="event-info-icon">📍</span>
                    <span>${event.location}</span>
                </div>
                ` : ''}
                <div class="event-info-row">
                    <span class="event-info-icon">👥</span>
                    <span>${guestsCount} ${guestsCount === 1 ? 'гість' : 'гостей'}</span>
                </div>
                ${event.duration ? `
                <div class="event-info-row">
                    <span class="event-info-icon">⏱️</span>
                    <span>${event.duration} ${event.duration === 1 ? 'година' : event.duration < 5 ? 'години' : 'годин'}</span>
                </div>
                ` : ''}
                ${event.budget ? `
                <div class="event-info-row">
                    <span class="event-info-icon">💰</span>
                    <span>${formatBudget(event.budget)}</span>
                </div>
                ` : ''}
            </div>

            ${event.description ? `
            <p class="event-description">${event.description}</p>
            ` : ''}

            <div class="event-guests">
                <div class="event-section-header">
                    <h4 class="event-section-title">Гості:</h4>
                    <button class="btn-add-guest" onclick="openAddGuestModal('${event.id}')" title="Додати гостя">
                        <span class="add-icon">+</span>
                    </button>
                </div>
                ${event.guests && event.guests.length > 0 ? `
                <div class="guests-list">
                    ${event.guests.slice(0, 3).map(guest => `
                        <div class="guest-item">
                            <div class="guest-info">
                                <span class="guest-name">${guest.name}</span>
                                ${guest.email ? `<span class="guest-email">${guest.email}</span>` : ''}
                            </div>
                            <button class="btn-remove-guest" onclick="removeGuestFromEvent('${event.id}', '${guest.id}')" title="Видалити гостя">
                                <span class="remove-icon">&times;</span>
                            </button>
                        </div>
                    `).join('')}
                    ${event.guests.length > 3 ? `
                        <div class="guests-more">+${event.guests.length - 3} ще</div>
                    ` : ''}
                </div>
                ` : `
                <p class="no-guests-message">Поки немає гостей</p>
                `}
            </div>

            <div class="event-options">
                <div class="event-section-header">
                    <h4 class="event-section-title">Опції (To-Do):</h4>
                    <button class="btn-add-option" onclick="openAddOptionModal('${event.id}')" title="Додати опцію">
                        <span class="add-icon">+</span>
                    </button>
                </div>
                ${optionsArray.length > 0 ? `
                <div class="options-list">
                    ${optionsArray.map(option => `
                        <label class="option-item ${option.done ? 'option-done' : 'option-pending'}">
                            <div class="option-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    class="option-checkbox-input"
                                    data-option-id="${option.id}"
                                    ${option.done ? 'checked' : ''}
                                    onchange="handleOptionChange('${event.id}', '${option.id}', this.checked)"
                                >
                                <span class="option-checkbox-custom">${option.done ? '✓' : '○'}</span>
                                <span class="option-name">${option.name}</span>
                            </div>
                            <button class="btn-remove-option" onclick="removeOptionFromEvent('${event.id}', '${option.id}')" title="Видалити опцію">
                                <span class="remove-icon">&times;</span>
                            </button>
                        </label>
                    `).join('')}
                </div>
                ` : `
                <p class="no-options-message">Поки немає опцій</p>
                `}
            </div>

            <div class="event-actions">
                <button class="event-btn event-btn-calendar" onclick="addToGoogleCalendar('${event.id}')" title="Додати в Google Calendar">
                    📅 Google Calendar
                </button>
                <button class="event-btn event-btn-save" style="display: none;" onclick="saveEvent('${event.id}')">Зберегти</button>
                <button class="event-btn event-btn-delete" onclick="deleteEvent('${event.id}')">Видалити</button>
            </div>
        </div>
    `;
}

function filterAndSortEvents(events) {
    const filterType = document.getElementById('filter-type').value;
    const sortBy = document.getElementById('sort-by').value;

    let filteredEvents = events;
    if (filterType !== 'all') {
        filteredEvents = events.filter(event => event.type === filterType);
    }

    filteredEvents.sort((a, b) => {
        switch (sortBy) {
            case 'date-asc':
                return new Date(b.date) - new Date(a.date);
            case 'date-desc':
                return new Date(a.date) - new Date(b.date);
            case 'name':
                return a.name.localeCompare(b.name);
            case 'budget':
                return parseInt(b.budget) - parseInt(a.budget);
            default:
                return 0;
        }
    });

    return filteredEvents;
}

// Update filter types based on available events
function updateFilterTypes(events) {
    const filterTypeSelect = document.getElementById('filter-type');
    if (!filterTypeSelect) return;

    // Get unique event types from events
    const uniqueTypes = [...new Set(events.map(event => event.type))];

    // Keep the "all" option and add only types that exist
    filterTypeSelect.innerHTML = '<option value="all">Всі типи</option>';

    uniqueTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = getTypeLabel(type);
        filterTypeSelect.appendChild(option);
    });
}

// Show loading state
function showLoading() {
    const eventsList = document.getElementById('events-list');
    const emptyState = document.getElementById('empty-state');

    eventsList.style.display = 'grid';
    emptyState.style.display = 'none';
    eventsList.innerHTML = '<div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;"><h2>Завантаження івентів...</h2></div>';
}

async function renderEvents() {
    const eventsList = document.getElementById('events-list');
    const emptyState = document.getElementById('empty-state');

    // Show loading state
    showLoading();

    // Fetch events from API
    const events = await getEvents();

    // Update filter types based on available events
    updateFilterTypes(events);

    if (events.length === 0) {
        eventsList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    const filteredEvents = filterAndSortEvents(events);

    if (filteredEvents.length === 0) {
        eventsList.innerHTML = '<div class="empty-state" style="display: block; grid-column: 1/-1;"><h2>Івентів за обраним фільтром не знайдено</h2></div>';
        emptyState.style.display = 'none';
    } else {
        eventsList.style.display = 'grid';
        emptyState.style.display = 'none';
        eventsList.innerHTML = filteredEvents.map(event => renderEvent(event)).join('');
    }
}

// Guest management
const GUESTS_API_URL = 'http://localhost:8080/api/guests';
const OPTIONS_API_URL = 'http://localhost:8080/api/options';
let currentEventId = null;
let allGuests = [];

// Fetch all guests
async function fetchAllGuests() {
    const token = checkAuth();
    if (!token) return [];

    try {
        const response = await fetch(GUESTS_API_URL, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const guests = await response.json();
        allGuests = guests;
        return guests;
    } catch (error) {
        console.error('Error fetching guests:', error);
        return [];
    }
}

// Open add guest modal
async function openAddGuestModal(eventId) {
    currentEventId = eventId;
    const modal = document.getElementById('add-guest-modal');
    modal.style.display = 'flex';

    // Load existing guests
    const guests = await fetchAllGuests();
    const select = document.getElementById('existing-guest-select');

    if (guests.length === 0) {
        select.innerHTML = '<option value="">Немає доступних гостей</option>';
    } else {
        select.innerHTML = '<option value="">Виберіть гостя...</option>' +
            guests.map(g => `<option value="${g.id}">${g.name} ${g.email ? `(${g.email})` : ''}</option>`).join('');
    }
}

// Close add guest modal
function closeAddGuestModal() {
    const modal = document.getElementById('add-guest-modal');
    modal.style.display = 'none';
    currentEventId = null;

    // Reset forms
    document.getElementById('existing-guest-select').value = '';
    document.getElementById('new-guest-form').reset();
}

// Switch tabs in modal
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    if (tabName === 'existing') {
        tabs[0].classList.add('active');
        document.getElementById('existing-guest-tab').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('new-guest-tab').classList.add('active');
    }
}

// Add existing guest to event
async function addExistingGuest() {
    const guestId = document.getElementById('existing-guest-select').value;

    if (!guestId) {
        alert('Будь ласка, виберіть гостя');
        return;
    }

    const guest = allGuests.find(g => g.id === guestId);
    if (!guest) {
        showError('Гостя не знайдено');
        return;
    }

    await addGuestToEvent(currentEventId, guest);
}

// Create new guest and add to event
async function createNewGuest(guestData) {
    const token = checkAuth();
    if (!token) {
        console.error('No auth token found');
        return null;
    }

    console.log('Creating guest with data:', guestData);
    console.log('Auth token:', token);

    try {
        const headers = getAuthHeaders();
        console.log('Request headers:', headers);

        const requestBody = JSON.stringify(guestData);
        console.log('Request body:', requestBody);

        const response = await fetch(GUESTS_API_URL, {
            method: 'POST',
            headers: headers,
            body: requestBody
        });

        console.log('Response status:', response.status);

        if (response.status === 401 || response.status === 403) {
            alert('Ваша сесія закінчилась. Будь ласка, увійдіть знову.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return null;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const newGuest = await response.json();
        console.log('Guest created successfully:', newGuest);
        return newGuest;
    } catch (error) {
        console.error('Error creating guest:', error);
        showError('Помилка створення гостя: ' + error.message);
        return null;
    }
}

// Add guest to event (update event with new guest)
async function addGuestToEvent(eventId, guest) {
    const event = eventsCache.find(e => e.id === eventId);
    if (!event) {
        showError('Івент не знайдено');
        return;
    }

    // Check if guest is already added
    if (event.guests.some(g => g.id === guest.id)) {
        alert('Цей гість вже доданий до івенту');
        return;
    }

    // Add guest to event
    event.guests.push(guest);

    // Save event
    await saveEvent(eventId);

    // Close modal and refresh
    closeAddGuestModal();
    await renderEvents();
}

// Remove guest from event
async function removeGuestFromEvent(eventId, guestId) {
    if (!confirm('Ви впевнені, що хочете видалити цього гостя з івенту?')) {
        return;
    }

    const event = eventsCache.find(e => e.id === eventId);
    if (!event) {
        showError('Івент не знайдено');
        return;
    }

    // Remove guest from event
    const originalLength = event.guests.length;
    event.guests = event.guests.filter(g => g.id !== guestId);

    if (event.guests.length === originalLength) {
        showError('Гостя не знайдено в списку');
        return;
    }

    // Save event
    await saveEvent(eventId);

    // Refresh events
    await renderEvents();
    showSuccess('Гостя видалено з івенту');
}

// Option management
// Create new option
async function createNewOption(optionData) {
    const token = checkAuth();
    if (!token) {
        console.error('No auth token found');
        return null;
    }

    try {
        const headers = getAuthHeaders();
        const response = await fetch(OPTIONS_API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(optionData)
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
            console.error('Server error:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const newOption = await response.json();
        console.log('Option created successfully:', newOption);
        return newOption;
    } catch (error) {
        console.error('Error creating option:', error);
        showError('Помилка створення опції: ' + error.message);
        return null;
    }
}

// Open add option modal
function openAddOptionModal(eventId) {
    currentEventId = eventId;
    const modal = document.getElementById('add-option-modal');
    modal.style.display = 'flex';
}

// Close add option modal
function closeAddOptionModal() {
    const modal = document.getElementById('add-option-modal');
    modal.style.display = 'none';
    currentEventId = null;
    document.getElementById('new-option-form').reset();
}

// Add option to event
async function addOptionToEvent(eventId, option) {
    const event = eventsCache.find(e => e.id === eventId);
    if (!event) {
        showError('Івент не знайдено');
        return;
    }

    // Add option to event
    event.options.push(option);

    // Save event
    await saveEvent(eventId);

    // Close modal and refresh
    closeAddOptionModal();
    await renderEvents();
    showSuccess('Опцію додано до івенту');
}

// Remove option from event
async function removeOptionFromEvent(eventId, optionId) {
    if (!confirm('Ви впевнені, що хочете видалити цю опцію з івенту?')) {
        return;
    }

    const event = eventsCache.find(e => e.id === eventId);
    if (!event) {
        showError('Івент не знайдено');
        return;
    }

    // Remove option from event
    const originalLength = event.options.length;
    event.options = event.options.filter(o => o.id !== optionId);

    if (event.options.length === originalLength) {
        showError('Опцію не знайдено в списку');
        return;
    }

    // Delete option from API
    try {
        const response = await fetch(`${OPTIONS_API_URL}/${optionId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok && response.status !== 404) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting option:', error);
    }

    // Save event
    await saveEvent(eventId);

    // Refresh events
    await renderEvents();
    showSuccess('Опцію видалено з івенту');
}

// Create new event
async function createNewEvent(eventData) {
    const token = checkAuth();
    if (!token) return null;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(eventData)
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

        const newEvent = await response.json();
        showSuccess('Івент успішно створено');
        return newEvent;
    } catch (error) {
        console.error('Error creating event:', error);
        showError('Помилка створення івенту: ' + error.message);
        return null;
    }
}

// Open create event modal
function openCreateEventModal() {
    const modal = document.getElementById('create-event-modal');
    modal.style.display = 'flex';
}

// Close create event modal
function closeCreateEventModal() {
    const modal = document.getElementById('create-event-modal');
    modal.style.display = 'none';
    document.getElementById('create-event-form').reset();
}

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    checkAuth();

    // Load events
    renderEvents();

    document.getElementById('filter-type').addEventListener('change', renderEvents);
    document.getElementById('sort-by').addEventListener('change', renderEvents);

    // Handle new guest form submission
    const newGuestForm = document.getElementById('new-guest-form');
    if (newGuestForm) {
        newGuestForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameValue = document.getElementById('new-guest-name').value.trim();
            const emailValue = document.getElementById('new-guest-email').value.trim();
            const phoneValue = document.getElementById('new-guest-phone').value.trim();

            if (!nameValue) {
                alert('Будь ласка, введіть ім\'я гостя');
                return;
            }

            // Validate email uniqueness (only if email is provided)
            if (emailValue) {
                const emailExists = allGuests.some(guest =>
                    guest.email &&
                    guest.email.toLowerCase() === emailValue.toLowerCase()
                );

                if (emailExists) {
                    alert('Гість з таким email вже існує. Будь ласка, використайте інший email або виберіть існуючого гостя.');
                    return;
                }
            }

            // Create clean guest object
            const guestData = {
                name: nameValue
            };

            // Add optional fields only if they exist
            if (emailValue) {
                guestData.email = emailValue;
            }
            if (phoneValue) {
                guestData.telephone = phoneValue;
            }

            const newGuest = await createNewGuest(guestData);
            if (newGuest) {
                await addGuestToEvent(currentEventId, newGuest);
            }
        });
    }

    // Handle new option form submission
    const newOptionForm = document.getElementById('new-option-form');
    if (newOptionForm) {
        newOptionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameValue = document.getElementById('new-option-name').value.trim();

            if (!nameValue) {
                alert('Будь ласка, введіть назву опції');
                return;
            }

            // Create option object
            const optionData = {
                name: nameValue,
                done: false
            };

            const newOption = await createNewOption(optionData);
            if (newOption) {
                await addOptionToEvent(currentEventId, newOption);
            }
        });
    }

    // Handle create event form submission
    const createEventForm = document.getElementById('create-event-form');
    if (createEventForm) {
        createEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('event-name').value.trim();
            const type = document.getElementById('event-type').value;
            const date = document.getElementById('event-date').value;
            const time = document.getElementById('event-time').value.trim();
            const location = document.getElementById('event-location').value.trim();
            const duration = document.getElementById('event-duration').value;
            const budget = document.getElementById('event-budget').value;
            const description = document.getElementById('event-description').value.trim();

            if (!name || !type || !date) {
                alert('Будь ласка, заповніть обов\'язкові поля (Назва, Тип, Дата)');
                return;
            }

            // Create event data object
            const eventData = {
                name,
                type,
                date,
                guests: [],
                options: []
            };

            // Add optional fields
            if (time) eventData.time = time;
            if (location) eventData.location = location;
            if (duration) eventData.duration = parseFloat(duration);
            if (budget) eventData.budget = parseFloat(budget);
            if (description) eventData.description = description;

            const result = await createNewEvent(eventData);

            if (result) {
                closeCreateEventModal();
                await renderEvents();
            }
        });
    }

    // Close modals on outside click
    window.onclick = (event) => {
        const guestModal = document.getElementById('add-guest-modal');
        const optionModal = document.getElementById('add-option-modal');
        const createEventModal = document.getElementById('create-event-modal');

        if (event.target === guestModal) {
            closeAddGuestModal();
        }
        if (event.target === optionModal) {
            closeAddOptionModal();
        }
        if (event.target === createEventModal) {
            closeCreateEventModal();
        }
    };
});
