let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;
const OenApiKey = "OPEN_API_KEY";

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    slides[index].classList.add('active');
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
}

setInterval(nextSlide, 5000);

class EventCard {
    constructor(title, date, description, imageUrl, category) {
        this.title = title;
        this.date = date;
        this.description = description;
        this.imageUrl = imageUrl;
        this.category = category;
    }

    render() {
        const card = document.createElement('div');
        card.className = 'event-card';

        card.innerHTML = `
            <div class="event-card-image-only" style="background-image: url('${this.imageUrl}'); background-size: contain; background-position: center; background-repeat: no-repeat;"></div>
        `;

        return card;
    }
}

const eventsData = [
    {
        title: 'Birthday Celebration',
        date: 'Year-round',
        description: 'Make your birthday unforgettable with our planning tools and party ideas.',
        imageUrl: './assets/img/happy-birthday.png',
        category: 'Celebration'
    },
    {
        title: 'Halloween Party',
        date: 'October 31',
        description: 'Spooky decorations, costume ideas, and party games for a thrilling Halloween.',
        imageUrl: './assets/img/happy-halloween.png',
        category: 'Holiday'
    },
    {
        title: 'New Year Party',
        date: 'December 31',
        description: 'Ring in the new year with style! Plan the perfect celebration.',
        imageUrl: './assets/img/happy-new-year.png',
        category: 'Holiday'
    },
    {
        title: 'Christmas Gathering',
        date: 'December 25',
        description: 'Create magical Christmas moments with family and friends.',
        imageUrl: './assets/img/merry-christmas.png',
        category: 'Holiday'
    },
    {
        title: 'Wedding Anniversary',
        date: 'Year-round',
        description: 'Celebrate love and commitment with a memorable anniversary event.',
        imageUrl: './assets/img/marriage.png',
        category: 'Celebration'
    },
    {
        title: 'Graduation Party',
        date: 'Year-round',
        description: 'Honor achievements and celebrate new beginnings with a graduation party.',
        imageUrl: './assets/img/graduated.png',
        category: 'Celebration'
    }
];

// Statistics Animation
class StatsAnimator {
    constructor() {
        this.statsSection = document.querySelector('.stats-section');
        this.statNumbers = document.querySelectorAll('.stat-number');
        this.hasAnimated = false;
        this.init();
    }

    init() {
        // Create Intersection Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated) {
                    this.animateStats();
                    this.hasAnimated = true;
                }
            });
        }, {
            threshold: 0.3 // Trigger when 30% of section is visible
        });

        if (this.statsSection) {
            observer.observe(this.statsSection);
        }
    }

    animateStats() {
        const stats = [
            { element: this.statNumbers[0], target: 15247, suffix: '', animate: true },
            { element: this.statNumbers[1], target: 12500, suffix: '+', animate: true },
            { element: this.statNumbers[2], target: 98, suffix: '%', animate: false },
            { element: this.statNumbers[3], target: 50, suffix: '+', animate: false }
        ];

        stats.forEach(stat => {
            if (stat.animate) {
                this.animateNumber(stat.element, stat.target, stat.suffix);
            } else {
                // Just show the final value without animation
                stat.element.textContent = stat.target.toLocaleString() + stat.suffix;
            }
        });
    }

    animateNumber(element, target, suffix) {
        const duration = 2000; // 2 seconds
        const startTime = performance.now();
        const startValue = 0;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (easeOutQuart)
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(startValue + (target - startValue) * easeProgress);

            // Format number with comma
            const formattedNumber = current.toLocaleString();
            element.textContent = formattedNumber + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }
}

// Initialize stats animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StatsAnimator();

    // Note: Circular carousel is now handled by React (see carousel-react.jsx)
});

// Mock function for testing without OpenAI API (when quota is exceeded)
function mockAIResponse(message) {
    // Simple keyword analysis
    const lowerMessage = message.toLowerCase();

    let eventType = 'party';
    if (lowerMessage.includes('день народження') || lowerMessage.includes('birthday')) eventType = 'birthday';
    if (lowerMessage.includes('весілля') || lowerMessage.includes('wedding')) eventType = 'wedding';
    if (lowerMessage.includes('корпоратив') || lowerMessage.includes('corporate')) eventType = 'corporate';
    if (lowerMessage.includes('конференц')) eventType = 'conference';

    const guestsMatch = message.match(/(\d+)\s*(люд|гост|person|guest)/i);
    const guests = guestsMatch ? parseInt(guestsMatch[1]) : 20;

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const date = nextWeek.toISOString().split('T')[0];

    return {
        name: message.split(' ').slice(0, 3).join(' '),
        type: eventType,
        date: date,
        time: '18:00',
        location: null,
        guests: guests,
        budget: guests * 500,
        duration: 4,
        description: message,
        services: {
            catering: lowerMessage.includes('їжа') || lowerMessage.includes('кейтеринг') || lowerMessage.includes('food'),
            music: lowerMessage.includes('музик') || lowerMessage.includes('dj') || lowerMessage.includes('music'),
            photographer: lowerMessage.includes('фото') || lowerMessage.includes('photo'),
            decorations: lowerMessage.includes('декор') || lowerMessage.includes('decor')
        }
    };
}

async function sendPrompt(message) {
    // Uncomment this to use mock response instead of API (for testing)
    // return new Promise(resolve => setTimeout(() => resolve(mockAIResponse(message)), 1000));

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OenApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `Ти - професійний event планер. На основі опису користувача створи структуровані дані для івенту у форматі JSON.

Поверни ТІЛЬКИ JSON об'єкт з такими полями:
{
  "name": "назва івенту",
  "type": "один з: birthday, wedding, corporate, conference, party, other",
  "date": "дата у форматі YYYY-MM-DD (якщо не вказано, використай дату через тиждень від сьогодні)",
  "time": "час у форматі HH:MM (якщо не вказано, використай 18:00)",
  "location": "адреса або null якщо не вказано",
  "guests": число гостей (якщо не вказано, використай 20),
  "budget": бюджет у гривнях (якщо не вказано, оціни адекватний бюджет),
  "duration": тривалість у годинах (якщо не вказано, використай 4),
  "description": "детальний опис івенту",
  "services": {
    "catering": true/false,
    "music": true/false,
    "photographer": true/false,
    "decorations": true/false
  }
}

Аналізуй опис і розумно заповнюй поля. Не додавай зайвих коментарів, тільки JSON.`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content.trim();

        // Extract JSON from response (in case there's extra text)
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return JSON.parse(jsonText);
    } catch (error) {
        console.error('Error sending prompt to OpenAI:', error);
        throw error;
    }
}

// Function to fill manual form with AI-generated data
function fillFormWithAIData(data) {
    // Fill basic fields
    document.getElementById('event-name').value = data.name || '';
    document.getElementById('event-type').value = data.type || '';
    document.getElementById('event-date').value = data.date || '';
    document.getElementById('event-time').value = data.time || '';
    document.getElementById('event-location').value = data.location || '';
    document.getElementById('event-guests').value = data.guests || '';
    document.getElementById('event-budget').value = data.budget || '';
    document.getElementById('event-duration').value = data.duration || '';
    document.getElementById('event-description').value = data.description || '';

    // Fill checkboxes
    document.getElementById('need-catering').checked = data.services?.catering || false;
    document.getElementById('need-music').checked = data.services?.music || false;
    document.getElementById('need-photographer').checked = data.services?.photographer || false;
    document.getElementById('need-decorations').checked = data.services?.decorations || false;

    // Add visual feedback - highlight filled form
    const manualFormContainer = document.querySelector('.manual-event-container');
    manualFormContainer.style.border = '3px solid #667eea';
    manualFormContainer.style.animation = 'pulse 1s ease';

    // Remove highlight after animation
    setTimeout(() => {
        manualFormContainer.style.border = '';
        manualFormContainer.style.animation = '';
    }, 2000);
}

// Form submission handler for AI form
document.addEventListener('DOMContentLoaded', () => {
    const aiForm = document.querySelector('#ai-form');
    const input = document.querySelector('#prompt');
    const submitButton = aiForm.querySelector('button[type="submit"]');

    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const promptText = input.value.trim();

        if (!promptText) {
            alert('Будь ласка, опишіть ваш івент');
            return;
        }

        // Disable form while processing
        submitButton.disabled = true;
        submitButton.textContent = 'Обробка...';
        input.disabled = true;

        try {
            let eventData;

            try {
                eventData = await sendPrompt(promptText);
            } catch (apiError) {
                // If API fails with 429 or other error, use mock function
                if (apiError.message.includes('429')) {
                    console.log('API quota exceeded, using mock AI...');
                    alert('⚠️ OpenAI API недоступний (вичерпано ліміт).\n\nВикористовуємо базовий аналіз тексту замість AI.');
                    eventData = mockAIResponse(promptText);
                } else {
                    throw apiError; // Re-throw other errors
                }
            }

            // Scroll to manual form
            const manualForm = document.querySelector('#manual-event-form');
            manualForm.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Wait for scroll to finish
            setTimeout(() => {
                // Fill the manual form with AI-generated data
                fillFormWithAIData(eventData);

                // Show notification
                alert('Дані згенеровано для вашого івенту! Перевірте та відредагуйте форму нижче перед збереженням.');

                // Reset AI form
                input.value = '';
            }, 800);

        } catch (error) {
            console.error('AI Error:', error);

            // Detailed error messages
            let errorMessage = 'Помилка при обробці запиту:\n\n';

            if (error.message.includes('401')) {
                errorMessage += '🔑 Невалідний API ключ.\nБудь ласка, заповніть форму вручну.';
            } else {
                errorMessage += '❌ ' + error.message + '\n\nБудь ласка, заповніть форму вручну нижче.';
            }

            alert(errorMessage);

            // Scroll to manual form as fallback
            const manualFormSection = document.querySelector('#manual-event-section');
            if (manualFormSection) {
                manualFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } finally {
            // Re-enable form
            submitButton.disabled = false;
            submitButton.textContent = 'Створити з AI';
            input.disabled = false;
        }
    });

    // Set default values for form fields
    const setDefaultValues = () => {
        const eventDateInput = document.getElementById('event-date');
        const eventTimeInput = document.getElementById('event-time');
        const eventDurationInput = document.getElementById('event-duration');
        const eventBudgetInput = document.getElementById('event-budget');

        // Set date to next week if empty
        if (eventDateInput && !eventDateInput.value) {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            eventDateInput.value = nextWeek.toISOString().split('T')[0];
        }

        // Set time to 18:00 if empty
        if (eventTimeInput && !eventTimeInput.value) {
            eventTimeInput.value = '18:00';
        }

        // Set duration to 4 hours if empty
        if (eventDurationInput && !eventDurationInput.value) {
            eventDurationInput.value = '4';
        }

        // Set budget placeholder
        if (eventBudgetInput && !eventBudgetInput.value) {
            eventBudgetInput.placeholder = '10000';
        }
    };

    // Call default values on page load
    setDefaultValues();

    // Show auth status
    const showAuthStatus = () => {
        const authStatus = document.getElementById('auth-status');
        const token = localStorage.getItem('authToken');

        if (authStatus) {
            if (token) {
                authStatus.style.display = 'block';
                authStatus.style.backgroundColor = '#d4edda';
                authStatus.style.color = '#155724';
                authStatus.style.border = '1px solid #c3e6cb';
                authStatus.innerHTML = '✓ Ви авторизовані. Можете створювати івенти!';
            } else {
                authStatus.style.display = 'block';
                authStatus.style.backgroundColor = '#fff3cd';
                authStatus.style.color = '#856404';
                authStatus.style.border = '1px solid #ffeeba';
                authStatus.innerHTML = '⚠ Для створення івентів потрібно <a href="login.html" style="color: #667eea; text-decoration: underline;">увійти в систему</a>';
            }
        }
    };

    // Show auth status on page load
    showAuthStatus();

    // Manual event form handler
    const manualForm = document.querySelector('#manual-event-form');

    if (manualForm) {
        manualForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Check authentication
            const token = localStorage.getItem('authToken');
            console.log('Auth token check:', token ? 'Token exists' : 'No token');

            if (!token) {
                const shouldLogin = confirm('Для створення івентів потрібно увійти в систему.\nБажаєте перейти на сторінку входу?');
                if (shouldLogin) {
                    window.location.href = 'login.html';
                }
                return;
            }

            // Collect form data
            const formData = new FormData(manualForm);

            // Convert type to uppercase (backend expects BIRTHDAY, not birthday)
            const eventType = formData.get('eventType').toUpperCase();

            // Prepare event data for API (matching backend Event DTO)
            const eventData = {
                name: formData.get('eventName'),
                type: eventType,
                date: formData.get('eventDate'),
                time: formData.get('eventTime'),
                location: formData.get('eventLocation') || null,
                budget: parseFloat(formData.get('eventBudget')) || null,
                duration: parseInt(formData.get('eventDuration')) || null,
                description: formData.get('eventDescription') || null,
                guests: [], // Empty guests list initially
                options: [] // We'll add options (services) separately
            };

            // Add options based on selected services
            const services = [];
            if (formData.get('needCatering') === 'on') {
                services.push({ name: 'Кейтеринг', done: false });
            }
            if (formData.get('needMusic') === 'on') {
                services.push({ name: 'Музика/DJ', done: false });
            }
            if (formData.get('needPhotographer') === 'on') {
                services.push({ name: 'Фотограф', done: false });
            }
            if (formData.get('needDecorations') === 'on') {
                services.push({ name: 'Декорації', done: false });
            }
            eventData.options = services;

            console.log('Sending event data to API:', eventData);

            // Disable submit button
            const submitButton = manualForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Створення...';

            try {
                // Send to backend API
                const response = await fetch('http://localhost:8080/api/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(eventData)
                });

                if (response.status === 401 || response.status === 403) {
                    alert('Ваша сесія закінчилась. Будь ласка, увійдіть знову.');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                    return;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }

                const createdEvent = await response.json();
                console.log('Event created successfully:', createdEvent);

                // Display success message
                const locationText = eventData.location || 'Не вказано';
                alert(`Івент "${eventData.name}" успішно створено!\n\nДата: ${eventData.date}\nЧас: ${eventData.time}\nЛокація: ${locationText}\nБюджет: ${eventData.budget} грн`);

                // Reset form
                manualForm.reset();

                // Redirect to events page
                if (confirm('Бажаєте переглянути всі івенти?')) {
                    window.location.href = 'events.html';
                }

            } catch (error) {
                console.error('Error creating event:', error);
                alert('Помилка при створенні івенту: ' + error.message);
            } finally {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = 'Створити івент';
            }
        });
    }
});
