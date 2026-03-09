<template>
  <div v-if="visible" class="preloader" :class="{ 'fade-out': isFadingOut }">
    <div class="typing-container">
      <span class="text">{{ text }}</span>
      <span class="cursor" :class="{ 'blink': cursorBlink, 'zoom-out': isZoomingOut }"></span>
    </div>
  </div>
</template>

<script>
import { router } from '@inertiajs/vue3';

export default {
  data() {
    return {
      text: '',
      fullText: '',
      visible: true,
      cursorBlink: false,
      charIndex: 0,
      typingTimer: null,
      isLoading: true,
      isFadingOut: false,
      isZoomingOut: false,
      isFirstVisit: false,
      firstVisitPhase: 0,
      firstVisitPhrases: ['I develop.', 'I edit.', 'I solve.'],
      firstVisitPhraseIndex: 0,
      baseText: 'Saagar - ',
    };
  },
  mounted() {
    // Check if this is the first visit using sessionStorage
    this.isFirstVisit = !sessionStorage.getItem('hasVisited');

    if (this.isFirstVisit) {
      sessionStorage.setItem('hasVisited', 'true');
      this.startFirstVisitPreloader();
    } else {
      // Normal Initial load
      this.startPreloader(this.getPageName(window.location.pathname));

      // Check if the document is already fully loaded
      if (document.readyState === 'complete') {
        this.finishLoading();
      } else {
        window.addEventListener('load', this.finishLoading);
      }
    }

    // Inertia navigation events
    this.removeStartEventListener = router.on('start', (event) => {
      this.startPreloader(this.getPageName(event.detail.visit.url.pathname));
    });

    this.removeFinishEventListener = router.on('finish', () => {
      this.finishLoading();
    });
  },
  unmounted() {
    if (this.removeStartEventListener) this.removeStartEventListener();
    if (this.removeFinishEventListener) this.removeFinishEventListener();
    window.removeEventListener('load', this.finishLoading);
    clearTimeout(this.typingTimer);
  },
  methods: {
    getPageName(path) {
      if (path === '/') return 'Home';
      if (path.startsWith('/projects/')) return 'Loading Project...';
      if (path === '/projects') return 'Projects';
      if (path === '/certifications') return 'Certifications';
      return 'Loading...';
    },
    startFirstVisitPreloader() {
      this.visible = true;
      this.text = '';
      this.charIndex = 0;
      this.firstVisitPhase = 0; // 0 = typing base, 1 = typing phrase, 2 = deleting phrase
      this.firstVisitPhraseIndex = 0;
      this.cursorBlink = false;
      this.isLoading = true; // Block closing until sequence finishes

      clearTimeout(this.typingTimer);
      this.typeFirstVisitSeq();
    },
    typeFirstVisitSeq() {
      // Phase 0: Type out "Saagar Verma - "
      if (this.firstVisitPhase === 0) {
        if (this.charIndex < this.baseText.length) {
          this.text += this.baseText.charAt(this.charIndex);
          this.charIndex++;
          this.typingTimer = setTimeout(() => this.typeFirstVisitSeq(), 20); // Extremely fast base typing
        } else {
          // Move to next phase
          this.firstVisitPhase = 1;
          this.charIndex = 0;
          this.typingTimer = setTimeout(() => this.typeFirstVisitSeq(), 50); // Minimal pause
        }
      }
      // Phase 1: Type out current phrase (e.g., "I develop.")
      else if (this.firstVisitPhase === 1) {
        const currentPhrase = this.firstVisitPhrases[this.firstVisitPhraseIndex];

        if (this.charIndex < currentPhrase.length) {
          this.text += currentPhrase.charAt(this.charIndex);
          this.charIndex++;
          this.typingTimer = setTimeout(() => this.typeFirstVisitSeq(), 30); // Instant typing
        } else {
          // If it's the last phrase ("I solve."), finish up entirely
          if (this.firstVisitPhraseIndex >= this.firstVisitPhrases.length - 1) {
            // Go to Phase 3: Total Wipe instead of finishing string
            this.firstVisitPhase = 3;
            this.typingTimer = setTimeout(() => this.typeFirstVisitSeq(), 500); // 500ms reading time before final wipe
          } else {
            // Not the last phrase, wait and transition to deleting
            this.firstVisitPhase = 2;
            this.typingTimer = setTimeout(() => this.typeFirstVisitSeq(), 200); // 200ms reading time
          }
        }
      }
      // Phase 2: Delete current phrase
      else if (this.firstVisitPhase === 2) {
        if (this.text.length > this.baseText.length) {
          this.text = this.text.slice(0, -1);
          this.typingTimer = setTimeout(() => this.typeFirstVisitSeq(), 15); // Machine-gun delete
        } else {
          this.firstVisitPhase = 1;
          this.firstVisitPhraseIndex++; // Move to next phrase
          this.charIndex = 0;
          this.typingTimer = setTimeout(() => this.typeFirstVisitSeq(), 30); // Immediate next word
        }
      }
      // Phase 3: Final total wipe out
      else if (this.firstVisitPhase === 3) {
        if (this.text.length > 0) {
          this.text = this.text.slice(0, -1);
          this.typingTimer = setTimeout(() => this.typeFirstVisitSeq(), 10); // Hyper speed delete entire text
        } else {
          // Final string is totally empty, trigger the zoom out animation
          this.cursorBlink = false;
          this.isZoomingOut = true;
          this.isLoading = false;
          // Give CSS enough time to fully expand the cursor and reveal the website inside it before fading the overall container
          this.typingTimer = setTimeout(() => this.checkDone(), 900);
        }
      }
    },
    startPreloader(targetText) {
      if (this.isFirstVisit && this.isLoading && this.firstVisitPhase !== undefined) return; // Prevent navigation from interrupting the fake sequence
      this.visible = true;
      this.text = '';
      this.fullText = targetText;
      this.charIndex = 0;
      this.cursorBlink = false;
      this.isLoading = true;

      clearTimeout(this.typingTimer);
      this.typeNext();
    },
    typeNext() {
      if (this.charIndex < this.fullText.length) {
        this.text += this.fullText.charAt(this.charIndex);
        this.charIndex++;

        let delay = 40; // Base typing speed

        // If we are still loading, and we've typed a lot of the text,
        // intentionally slow down the typing to simulate loading time
        if (this.isLoading && (this.charIndex / this.fullText.length) > 0.6) {
          delay = delay + ((this.charIndex / this.fullText.length) * 150);
        }

        // If loading finished, rush the typing
        if (!this.isLoading) {
          delay = 10;
        }

        this.typingTimer = setTimeout(() => this.typeNext(), delay);
      } else {
        this.cursorBlink = true;
        this.checkDone();
      }
    },
    finishLoading() {
      // If we are currently running the fake first-visit loop, don't finish yet.
      // We explicitly finish fake loader when the sequence ends naturally.
      if (this.isFirstVisit && this.firstVisitPhase !== undefined) {
        return;
      }

      this.isLoading = false;
      this.checkDone();
    },
    checkDone() {
      // For first visit sequence, the char index calculation varies, so just check isLoading
      if (this.isFirstVisit && this.firstVisitPhase !== undefined) {
        if (!this.isLoading) {
          this.isFadingOut = true;
          setTimeout(() => {
            this.visible = false;
            this.isFirstVisit = false; // Cleanup flag after sequence completes
          }, 800); // Wait for transition
        }
      } else if (!this.isLoading && this.charIndex >= this.fullText.length) {
        this.isFadingOut = true;
        setTimeout(() => {
          this.visible = false;
        }, 800);
      }
    }
  }
};
</script>

<style scoped>
.preloader {
  position: fixed;
  inset: 0;
  /* Background color strictly removed: The cursor's shadow now paints the entire background */
  color: var(--text);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
}

.preloader.fade-out {
  opacity: 0;
  pointer-events: none;
  transform: scale(1.05);
  /* Subtle scale up for dissolve effect */
}

.text {
  font-size: 1.5rem;
  letter-spacing: 1px;
  position: relative;
  z-index: 10;
  /* Ensures typed text stays above the cursor's huge shadow */
}

.cursor {
  position: relative;
  z-index: 5;
  display: inline-block;
  width: 14px;
  height: 1.5rem;
  margin-left: 4px;
  /* Massive shadow forms the dark background of the entire loading screen */
  box-shadow: 0 0 0 4000px var(--bg);
  border-radius: 2px;
  vertical-align: middle;
  transform-origin: center center;
  transition: transform 1.2s cubic-bezier(0.85, 0, 0.15, 1);
}

/* The actual white cursor center */
.cursor::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--accent);
  /* Solid white block */
  border-radius: 2px;
  opacity: 1;
  /* Smooth fade-out of the white solid block during zoom */
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Expanding the hole punch */
.cursor.zoom-out {
  transform: scale(300);
  /* Scales the "empty" cursor window massively */
}

/* Instead of disappearing instantly, the white cursor gracefully dissolves to reveal the website underneath as it zooms */
.cursor.zoom-out::after {
  opacity: 0;
}

/* Animate the white center only, avoiding blinking the massive shadow */
.cursor.blink::after {
  animation: blink 0.5s step-end infinite;
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
</style>
