const { useState, useEffect, useRef } = React;

// EventCard Component
function EventCard({ eventData, position, isActive, containerWidth, containerHeight, onHover }) {
    const cardRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    // Responsive values
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;

    let cardSize, radius, angleStep;

    if (isSmallMobile) {
        cardSize = 160;
        radius = Math.min(containerWidth * 0.45, 280);
        angleStep = 45;
    } else if (isMobile) {
        cardSize = 200;
        radius = Math.min(containerWidth * 0.5, 350);
        angleStep = 40;
    } else {
        cardSize = 240;
        radius = Math.min(containerWidth * 0.55, 450);
        angleStep = 40;
    }

    // Calculate position
    const centerX = containerWidth / 2;
    const centerY = containerHeight * 0.6;

    const totalAngle = (5 - 1) * angleStep; // 5 visible cards
    const startAngle = -totalAngle / 2;
    const angle = startAngle + (position * angleStep);
    const angleRad = (angle * Math.PI) / 180;

    const x = centerX + Math.sin(angleRad) * radius - (cardSize / 2);
    const y = centerY - Math.cos(angleRad) * radius * 0.4 - (cardSize / 2);

    // Effects based on position
    const isCenter = position === 2;
    const distanceFromCenter = Math.abs(position - 2);
    const scale = isCenter ? 1.1 : Math.max(0.75, 1 - distanceFromCenter * 0.15);
    const opacity = Math.max(0.5, 1 - distanceFromCenter * 0.25);
    const zIndex = isCenter ? 15 : 10 - distanceFromCenter;
    const rotation = angle * 0.1;

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (onHover) onHover(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (onHover) onHover(false);
    };

    const cardStyle = {
        position: 'absolute',
        width: `${cardSize}px`,
        height: `${cardSize}px`,
        transform: isHovered
            ? `translate(${x}px, ${y}px) scale(${scale * 1.08}) rotate(${rotation}deg) translateY(-12px)`
            : `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`,
        opacity: opacity,
        zIndex: isHovered ? 25 : zIndex,
        transition: isHovered
            ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: isCenter
            ? '0 20px 60px rgba(102, 126, 234, 0.4), 0 0 40px rgba(102, 126, 234, 0.2)'
            : '0 10px 30px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
    };

    const imageStyle = {
        backgroundImage: `url('${eventData.imageUrl}')`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%',
        height: '100%',
    };

    return (
        <div
            ref={cardRef}
            className={`circular-card ${isCenter ? 'active-card' : ''} ${isHovered ? 'hovering' : ''}`}
            style={cardStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="event-card-image-only" style={imageStyle}></div>
            <div className="card-overlay">
                <h3 className="card-title">{eventData.title}</h3>
                <p className="card-date">{eventData.date}</p>
            </div>
        </div>
    );
}

// CircularCarousel Component
function CircularCarousel({ events }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 400 });
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef(null);
    const autoRotateRef = useRef(null);

    const visibleCards = 5;

    // Handle auto-rotation
    useEffect(() => {
        const startAutoRotation = () => {
            if (autoRotateRef.current) {
                clearInterval(autoRotateRef.current);
            }
            autoRotateRef.current = setInterval(() => {
                if (!isHovered) {
                    setCurrentIndex((prev) => (prev + 1) % events.length);
                }
            }, 3500);
        };

        startAutoRotation();

        return () => {
            if (autoRotateRef.current) {
                clearInterval(autoRotateRef.current);
            }
        };
    }, [events.length, isHovered]);

    // Handle resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const wrapper = containerRef.current.querySelector('.circular-carousel-wrapper');
                if (wrapper) {
                    setContainerDimensions({
                        width: wrapper.offsetWidth,
                        height: wrapper.offsetHeight || 400
                    });
                }
            }
        };

        updateDimensions();

        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateDimensions, 150);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
        };
    }, []);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % events.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
    };

    const handleContainerHover = (hovered) => {
        setIsHovered(hovered);
    };

    // Calculate visible cards
    const visibleIndices = [];
    for (let i = 0; i < visibleCards; i++) {
        let index = (currentIndex + i - 2 + events.length) % events.length;
        visibleIndices.push(index);
    }

    return (
        <div
            ref={containerRef}
            className="events-container"
            onMouseEnter={() => handleContainerHover(true)}
            onMouseLeave={() => handleContainerHover(false)}
        >
            <h2 className="carousel-header">Popular Events</h2>
            <div className="circular-carousel-wrapper">
                <div className="circular-carousel-track">
                    {events.map((event, cardIndex) => {
                        const visiblePosition = visibleIndices.indexOf(cardIndex);
                        if (visiblePosition === -1) return null;

                        return (
                            <EventCard
                                key={cardIndex}
                                eventData={event}
                                position={visiblePosition}
                                isActive={visiblePosition === 2}
                                containerWidth={containerDimensions.width}
                                containerHeight={containerDimensions.height}
                                onHover={handleContainerHover}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Export for use
window.CircularCarousel = CircularCarousel;
