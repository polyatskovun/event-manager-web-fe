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

// Event data
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

// Initialize carousel and stats animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize circular carousel
    const carousel = new CircularCarousel('events-container', eventsData);
    
    // Store carousel instance globally for potential external access
    window.eventCarousel = carousel;
    
    new StatsAnimator();
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

    // Manual event form handler
    const manualForm = document.querySelector('#manual-event-form');

    if (manualForm) {
        manualForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect form data
            const formData = new FormData(manualForm);
            const eventData = {
                id: Date.now().toString(), // Generate unique ID
                name: formData.get('eventName'),
                type: formData.get('eventType'),
                date: formData.get('eventDate'),
                time: formData.get('eventTime'),
                location: formData.get('eventLocation'),
                guests: formData.get('eventGuests'),
                budget: formData.get('eventBudget'),
                duration: formData.get('eventDuration'),
                description: formData.get('eventDescription'),
                services: {
                    catering: formData.get('needCatering') === 'on',
                    music: formData.get('needMusic') === 'on',
                    photographer: formData.get('needPhotographer') === 'on',
                    decorations: formData.get('needDecorations') === 'on'
                },
                createdAt: new Date().toISOString()
            };

            // Save to localStorage
            const events = JSON.parse(localStorage.getItem('events') || '[]');
            events.push(eventData);
            localStorage.setItem('events', JSON.stringify(events));

            console.log('Event data:', eventData);

            // Display success message
            const locationText = eventData.location || 'Не вказано';
            alert(`Івент "${eventData.name}" успішно створено!\n\nДата: ${eventData.date}\nЧас: ${eventData.time}\nЛокація: ${locationText}\nГостей: ${eventData.guests}\nБюджет: ${eventData.budget} грн`);

            // Reset form
            manualForm.reset();

            // Redirect to events page
            if (confirm('Бажаєте переглянути всі івенти?')) {
                window.location.href = 'events.html';
            }
        });
    }
});
