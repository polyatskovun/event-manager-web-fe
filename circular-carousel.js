class CircularCarousel {
    constructor(containerId, events) {
        this.container = document.getElementById(containerId);
        this.events = events;
        this.currentIndex = 0;
        this.visibleCards = 5;
        this.autoRotateInterval = null;
        this.cards = [];
        this.isHovered = false;
        
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.startAutoRotation();
        this.handleResize();
    }

    render() {
        this.container.innerHTML = `
            <div class="carousel-header">
                <h2>Popular Events</h2>
                <div class="carousel-controls">
                    <button class="carousel-btn prev-btn" aria-label="Previous events">←</button>
                    <button class="carousel-btn next-btn" aria-label="Next events">→</button>
                </div>
            </div>
            <div class="circular-carousel-wrapper">
                <div class="circular-carousel-track"></div>
            </div>
        `;

        const track = this.container.querySelector('.circular-carousel-track');
        
        // Create cards for each event
        this.events.forEach((eventData, index) => {
            const cardElement = this.createCard(eventData, index);
            track.appendChild(cardElement);
            this.cards.push(cardElement);
        });

        this.updateCarousel();
    }

    createCard(eventData, index) {
        const card = document.createElement('div');
        card.className = 'circular-card';
        card.dataset.index = index;
        
        card.innerHTML = `
            <div class="event-card-image-only" 
                 style="background-image: url('${eventData.imageUrl}'); 
                        background-size: contain; 
                        background-position: center; 
                        background-repeat: no-repeat;">
            </div>
            <div class="card-overlay">
                    <h3 class="card-title">${eventData.title}</h3>
                    <p class="card-date">${eventData.date}</p>
                </div>
        `;

        return card;
    }

    attachEventListeners() {
        const prevBtn = this.container.querySelector('.prev-btn');
        const nextBtn = this.container.querySelector('.next-btn');

        prevBtn?.addEventListener('click', () => this.prev());
        nextBtn?.addEventListener('click', () => this.next());

        // Pause auto-rotation on hover
        this.container.addEventListener('mouseenter', () => {
            this.isHovered = true;
            this.stopAutoRotation();
        });

        this.container.addEventListener('mouseleave', () => {
            this.isHovered = false;
            if (!this.isHovered) {
                this.startAutoRotation();
            }
        });
    }

    updateCarousel() {
        const containerWidth = this.container.offsetWidth;
        const containerHeight = this.container.querySelector('.circular-carousel-wrapper')?.offsetHeight || 400;
        
        // Calculate responsive values
        const isMobile = window.innerWidth <= 768;
        const isSmallMobile = window.innerWidth <= 480;
        
        let cardSize, radius, angleStep;
        
        if (isSmallMobile) {
            cardSize = 160;
            radius = Math.min(containerWidth * 0.3, 200);
            angleStep = 35;
        } else if (isMobile) {
            cardSize = 200;
            radius = Math.min(containerWidth * 0.32, 250);
            angleStep = 32;
        } else {
            cardSize = 240;
            radius = Math.min(containerWidth * 0.35, 300);
            angleStep = 30;
        }

        // Calculate visible cards indices
        const visibleIndices = [];
        for (let i = 0; i < this.visibleCards; i++) {
            let index = (this.currentIndex + i - 2 + this.events.length) % this.events.length;
            visibleIndices.push(index);
        }

        this.cards.forEach((card, cardIndex) => {
            const visiblePosition = visibleIndices.indexOf(cardIndex);
            
            if (visiblePosition !== -1) {
                this.positionCard(card, visiblePosition, containerWidth, containerHeight, 
                                radius, angleStep, cardSize);
            } else {
                card.style.display = 'none';
            }
        });
    }

    positionCard(card, position, containerWidth, containerHeight, radius, angleStep, cardSize) {
        card.style.display = 'block';
        
        // Calculate arc position
        const centerX = containerWidth / 2;
        const centerY = containerHeight * 0.7;
        
        // Angle calculation
        const startAngle = -60; // Start from -60 degrees
        const angle = startAngle + (position * angleStep);
        const angleRad = (angle * Math.PI) / 180;
        
        // Calculate position
        const x = centerX + Math.sin(angleRad) * radius - (cardSize / 2);
        const y = centerY - Math.cos(angleRad) * radius * 0.5 - (cardSize / 2);
        
        // Calculate scale and effects based on position
        const isCenter = position === 2;
        const distanceFromCenter = Math.abs(position - 2);
        const scale = isCenter ? 1.1 : Math.max(0.75, 1 - distanceFromCenter * 0.15);
        const opacity = Math.max(0.5, 1 - distanceFromCenter * 0.25);
        const zIndex = isCenter ? 15 : 10 - distanceFromCenter;
        const rotation = angle * 0.2; // Subtle rotation
        
        // Apply transforms and styles
        card.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`;
        card.style.opacity = opacity;
        card.style.zIndex = zIndex;
        card.style.width = `${cardSize}px`;
        card.style.height = `${cardSize}px`;
        
        // Update card class and hover effects
        if (isCenter) {
            card.classList.add('active-card');
        } else {
            card.classList.remove('active-card');
        }
        
        this.attachCardHoverEffects(card, x, y, scale, rotation, zIndex);
    }

    attachCardHoverEffects(card, x, y, scale, rotation, zIndex) {
        // Remove existing event listeners to prevent duplicates
        card.onmouseenter = null;
        card.onmouseleave = null;
        
        card.onmouseenter = () => {
            if (!card.classList.contains('hovering')) {
                card.classList.add('hovering');
                card.style.transform = `translate(${x}px, ${y}px) scale(${scale * 1.08}) rotate(${rotation}deg) translateY(-12px)`;
                card.style.zIndex = 25;
                card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            }
        };
        
        card.onmouseleave = () => {
            card.classList.remove('hovering');
            card.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`;
            card.style.zIndex = zIndex;
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        };
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.events.length;
        this.updateCarousel();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.events.length) % this.events.length;
        this.updateCarousel();
    }

    startAutoRotation() {
        this.stopAutoRotation(); // Clear existing interval
        this.autoRotateInterval = setInterval(() => {
            if (!this.isHovered) {
                this.next();
            }
        }, 3500);
    }

    stopAutoRotation() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
    }

    handleResize() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateCarousel();
            }, 150);
        });
    }

    // Public method to go to specific index
    goToIndex(index) {
        if (index >= 0 && index < this.events.length) {
            this.currentIndex = index;
            this.updateCarousel();
        }
    }

    // Public method to add new events
    addEvents(newEvents) {
        newEvents.forEach(eventData => {
            this.events.push(eventData);
            const cardElement = this.createCard(eventData, this.events.length - 1);
            this.container.querySelector('.circular-carousel-track').appendChild(cardElement);
            this.cards.push(cardElement);
        });
        this.updateCarousel();
    }

    // Cleanup method
    destroy() {
        this.stopAutoRotation();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircularCarousel;
}
