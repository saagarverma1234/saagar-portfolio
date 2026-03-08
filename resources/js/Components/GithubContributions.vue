<template>
    <section class="github-section section" :class="{ 'is-focused': hoveredDay }" id="github">
        <!-- Overlay is purely visual backdrop -->
        <div class="github-overlay" :class="{ 'active': hoveredDay }"></div>

        <div class="container github-content">
            <div class="header fade-up">
                <h2 class="section-title font-mono">03. GitHub Contributions</h2>
                <div class="contribution-count font-mono">
                    <span class="count">{{ totalContributions }}</span> contributions in {{ selectedYear }}
                </div>
            </div>

            <div class="calendar-card-container">
                <div class="calendar-card fade-up" style="animation-delay: 100ms" @mousemove="updateTooltipPos">
                    <transition name="grid-fade" mode="out-in">
                        <div class="calendar-wrapper" :key="selectedYear">
                            <div class="calendar-header">
                                <div class="months">
                                    <span v-for="month in months" :key="month">{{ month }}</span>
                                </div>
                            </div>

                            <div class="calendar-body">
                                <div class="days-labels font-mono">
                                    <span>Mon</span>
                                    <span>Wed</span>
                                    <span>Fri</span>
                                </div>
                                <div class="grid-wrapper">
                                    <div class="grid">
                                        <div v-for="(day, index) in contributionData" :key="index" class="day"
                                            :class="[`level-${day.level}`, { 'hovered': hoveredDay === day, 'is-future': day.future }]"
                                            @mouseenter="handleMouseEnter(day)" @mouseleave="handleMouseLeave">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </transition>

                    <div class="calendar-footer">
                        <a href="https://github.com/saagarverma1234" target="_blank" class="footer-link">
                            Learn how we count contributions
                        </a>
                        <div class="legend">
                            <span>Less</span>
                            <div class="legend-cells">
                                <div class="day level-0"></div>
                                <div class="day level-1"></div>
                                <div class="day level-2"></div>
                                <div class="day level-3"></div>
                                <div class="day level-4"></div>
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="year-selector fade-up" style="animation-delay: 200ms">
                <button v-for="year in availableYears" :key="year" @click="selectedYear = year"
                    :class="{ active: selectedYear === year }" class="year-btn font-mono">
                    {{ year }}
                </button>
            </div>
        </div>

        <!-- Typing Tooltip - Moved outside container to ensure z-alignment -->
        <transition name="tooltip-fade">
            <div v-if="hoveredDay" class="typing-tooltip font-mono" :style="tooltipStyle">
                <span class="typing-text">{{ typedText }}</span><span class="cursor">|</span>
            </div>
        </transition>
    </section>
</template>

<script>
export default {
    data() {
        const currentYear = new Date().getFullYear();
        return {
            selectedYear: currentYear,
            availableYears: Array.from({ length: 6 }, (_, i) => currentYear - i),
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            totalContributions: 0,
            contributionData: [],
            hoveredDay: null,
            typedText: "",
            typingInterval: null,
            mouseX: 0,
            mouseY: 0
        };
    },
    computed: {
        tooltipStyle() {
            return {
                left: `${this.mouseX}px`,
                top: `${this.mouseY - 50}px`
            };
        }
    },
    watch: {
        selectedYear: {
            immediate: true,
            handler() {
                this.generateMockData();
            }
        }
    },
    methods: {

        generateMockData() {
            const data = [];
            const isCurrentYear = this.selectedYear === new Date().getFullYear();
            const today = new Date();

            // Deterministic simulation based on date so it doesn't change every hover but updates daily
            const getPseudoRandomLevel = (index) => {
                const seed = this.selectedYear * 1000 + index;
                const x = Math.sin(seed) * 10000;
                const rand = x - Math.floor(x);
                if (rand > 0.9) return 4;
                if (rand > 0.75) return 3;
                if (rand > 0.55) return 2;
                if (rand > 0.35) return 1;
                return 0;
            };

            const startDate = new Date(this.selectedYear, 0, 1);
            const totalDays = 371; // Roughly a year in the grid

            for (let i = 0; i < totalDays; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);

                // Don't show future data in pseudo-simulation
                if (isCurrentYear && currentDate > today) {
                    data.push({ id: i, level: 0, count: 0, date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), future: true });
                    continue;
                }

                const level = getPseudoRandomLevel(i);
                data.push({
                    id: i,
                    level: level,
                    count: level === 0 ? 0 : (level * 3 + (i % 5)),
                    date: currentDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })
                });
            }
            this.contributionData = data;
            this.totalContributions = data.reduce((acc, curr) => acc + curr.count, 0);
        },
        handleMouseEnter(day) {
            if (this.hoveredDay && this.hoveredDay.id === day.id) return;

            this.hoveredDay = day;
            this.startTypingAnimation(`${day.count} contributions on ${day.date}`);
        },
        handleMouseLeave() {
            this.hoveredDay = null;
            this.typedText = "";
            if (this.typingInterval) clearInterval(this.typingInterval);
        },
        updateTooltipPos(event) {
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        },
        startTypingAnimation(text) {
            if (this.typingInterval) clearInterval(this.typingInterval);
            this.typedText = "";
            let i = 0;
            this.typingInterval = setInterval(() => {
                if (i < text.length) {
                    this.typedText += text.charAt(i);
                    i++;
                } else {
                    clearInterval(this.typingInterval);
                }
            }, 10); // Speed up typing animation
        }
    }
}
</script>

<style scoped>
.github-section {
    padding: 8rem 0;
    position: relative;
    /* Ensure only siblings outside this section get blurred */
}

/* Local backdrop within the section */
.github-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(12px);
    z-index: 999;
    /* Below tooltip but above everything else */
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;
}

.github-overlay.active {
    opacity: 1;
}

.github-content {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1000;
    /* Must be on top of overlay */
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 2rem;
}

.section-title {
    font-size: 2rem;
    color: var(--accent);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.section-title::after {
    content: "";
    display: block;
    height: 1px;
    width: 150px;
    background-color: var(--border);
}

.contribution-count {
    font-size: 1.125rem;
    opacity: 0.8;
}

.count {
    color: var(--text);
    font-weight: 700;
}

.calendar-card {
    background-color: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 100%;
    position: relative;
    z-index: 21;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.calendar-card-container {
    display: flex;
    justify-content: center;
    width: 100%;
}

.calendar-wrapper {
    min-width: fit-content;
    position: relative;
    transition: opacity 0.3s ease;
}

.calendar-wrapper.is-loading {
    opacity: 0.5;
}

.loading-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
}

.spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.calendar-header {
    margin-bottom: 0.75rem;
    padding-left: 3rem;
}

.months {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    opacity: 0.6;
    width: 686px;
}

.calendar-body {
    display: flex;
    gap: 1rem;
}

.days-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1rem 0;
    font-size: 0.75rem;
    opacity: 0.6;
}

.grid-wrapper {
    flex: 1;
}

.grid {
    display: grid;
    grid-template-columns: repeat(53, 10px);
    grid-template-rows: repeat(7, 10px);
    grid-auto-flow: column;
    gap: 3px;
}

.day {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background-color: var(--muted);
    opacity: 0.1;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s ease, opacity 0.2s ease;
    cursor: pointer;
}

.day.is-future {
    opacity: 0.05 !important;
    cursor: default;
    pointer-events: none;
}

.day:hover {
    transform: scale(1.4);
    background-color: var(--accent) !important;
    opacity: 1 !important;
    z-index: 100;
    box-shadow: 0 0 15px var(--accent);
}

/* GitHub Levels Styles */
.level-1 {
    background-color: #0e4429;
    opacity: 1;
}

.level-2 {
    background-color: #006d32;
    opacity: 1;
}

.level-3 {
    background-color: #26a641;
    opacity: 1;
}

.level-4 {
    background-color: #39d353;
    opacity: 1;
}

.calendar-footer {
    margin-top: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    width: 100%;
}

.footer-link {
    opacity: 0.6;
    text-decoration: none;
}

.footer-link:hover {
    text-decoration: underline;
    opacity: 1;
}

.legend {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    opacity: 0.8;
}

.legend-cells {
    display: flex;
    gap: 4px;
}

/* Tooltip Styles */
.typing-tooltip {
    position: fixed;
    background: #000;
    color: #fff;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.85rem;
    pointer-events: none;
    z-index: 2000;
    /* Always on very top */
    white-space: nowrap;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.15);
    transform: translateX(-50%);
    backdrop-filter: blur(4px);
}

.cursor {
    animation: blink 0.7s infinite;
    margin-left: 2px;
    color: var(--accent);
    font-weight: bold;
}

@keyframes blink {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0;
    }
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
}

/* Grid Transition */
.grid-fade-enter-active,
.grid-fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.1);
}

.grid-fade-enter-from {
    opacity: 0;
    transform: scale(0.98);
}

.grid-fade-leave-to {
    opacity: 0;
    transform: scale(1.02);
}

.year-selector {
    margin-top: 2rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    position: relative;
    z-index: 21;
}

.year-btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    background: var(--card-bg);
    border: 1px solid var(--border);
    color: var(--text);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.year-btn:hover {
    border-color: var(--accent);
}

.year-btn.active {
    background: var(--accent);
    color: var(--bg);
    border-color: var(--accent);
}

@media (max-width: 900px) {
    .calendar-card {
        padding: 1.5rem 1rem;
    }

    .grid {
        gap: 3px;
    }

    .day {
        width: 8px;
        height: 8px;
    }

    .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
}
</style>

<style>
/* Global styles for the blur effect */
.github-section.is-focused~*:not(.github-overlay) {
    filter: blur(8px);
    transition: filter 0.3s ease;
    pointer-events: none;
}
</style>
