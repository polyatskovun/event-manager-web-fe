function getEvents() {
    const eventsJSON = localStorage.getItem('events');
    return eventsJSON ? JSON.parse(eventsJSON) : [];
}

function deleteEvent(eventId) {
    if (confirm('Ви впевнені, що хочете видалити цей івент?')) {
        let events = getEvents();
        events = events.filter(event => event.id !== eventId);
        localStorage.setItem('events', JSON.stringify(events));
        renderEvents();
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
}

function getTypeLabel(type) {
    const typeLabels = {
        'birthday': 'День народження',
        'wedding': 'Весілля',
        'corporate': 'Корпоратив',
        'conference': 'Конференція',
        'party': 'Вечірка',
        'other': 'Інше'
    };
    return typeLabels[type] || type;
}

function renderEvent(event) {
    const servicesArray = [];
    if (event.services.catering) servicesArray.push('Кейтеринг');
    if (event.services.music) servicesArray.push('Музика/DJ');
    if (event.services.photographer) servicesArray.push('Фотограф');
    if (event.services.decorations) servicesArray.push('Декорації');

    return `
        <div class="event-item">
            <div class="event-item-header">
                <h3 class="event-item-title">${event.name}</h3>
                <span class="event-type-badge">${getTypeLabel(event.type)}</span>
            </div>
            <div class="event-item-info">
                <div class="event-info-row">
                    <span class="event-info-icon">📅</span>
                    <span>${formatDate(event.date)} о ${event.time}</span>
                </div>
                ${event.location ? `
                <div class="event-info-row">
                    <span class="event-info-icon">📍</span>
                    <span>${event.location}</span>
                </div>
                ` : ''}
                <div class="event-info-row">
                    <span class="event-info-icon">👥</span>
                    <span>${event.guests} гостей</span>
                </div>
                <div class="event-info-row">
                    <span class="event-info-icon">💰</span>
                    <span>${parseInt(event.budget).toLocaleString()} грн</span>
                </div>
                ${event.duration ? `
                <div class="event-info-row">
                    <span class="event-info-icon">⏱️</span>
                    <span>${event.duration} годин</span>
                </div>
                ` : ''}
            </div>
            ${event.description ? `
            <p class="event-description">${event.description}</p>
            ` : ''}
            ${servicesArray.length > 0 ? `
            <div class="event-services">
                ${servicesArray.map(service => `<span class="service-tag">${service}</span>`).join('')}
            </div>
            ` : ''}
            <div class="event-actions">
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

function renderEvents() {
    const eventsList = document.getElementById('events-list');
    const emptyState = document.getElementById('empty-state');
    const events = getEvents();

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

document.addEventListener('DOMContentLoaded', () => {
    renderEvents();

    document.getElementById('filter-type').addEventListener('change', renderEvents);
    document.getElementById('sort-by').addEventListener('change', renderEvents);
});
