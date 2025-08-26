// LaunchDarkly Presentation App
class LDPresentationApp {
  constructor() {
    this.flags = {
      'guarded-releases-section': false,
      'experimentation-section': false,
      'ai-configs-section': false,
      'observability-section': false
    };
    
    this.ldClient = null;
    this.user = {
      key: 'presentation-user-' + Date.now(),
      name: 'Presentation User',
      custom: {
        role: 'presenter',
        session: Date.now()
      }
    };
    
    this.slideContent = new Map();
    
    this.init();
  }

  async init() {
    // Slides are now embedded in HTML, no need to load separately
    
    // Initialize Reveal.js first (with all slides visible)
    this.initReveal();
    
    // Initialize flag status indicators
    this.initFlagIndicators();
    
    // Initialize slide storage BEFORE LaunchDarkly processes flags
    this.initializeFlagSlides();
    
    // Initialize LaunchDarkly SDK (will use pre-stored slides)
    await this.initLaunchDarkly();
    
    console.log('🚀 LaunchDarkly Presentation App initialized');
  }

  initReveal() {
    Reveal.initialize({
      hash: true,
      controls: true,
      progress: true,
      center: true,
      transition: 'slide',
      
      // Enable plugins
      plugins: [RevealMarkdown, RevealHighlight, RevealNotes],
      
      // Keyboard shortcuts
      keyboard: {
        // Custom key bindings for flag toggling (for demo purposes)
        71: () => this.toggleFlag('guarded-releases-section'), // G key
        69: () => this.toggleFlag('experimentation-section'),  // E key
        65: () => this.toggleFlag('ai-configs-section'),       // A key
        79: () => this.toggleFlag('observability-section')     // O key
      }
    });

    // Add event listeners
    Reveal.on('slidechanged', (event) => {
      this.onSlideChanged(event);
    });
  }

  initFlagIndicators() {
    const indicators = document.querySelectorAll('.flag-indicator');
    indicators.forEach(indicator => {
      indicator.addEventListener('click', () => {
        const flagName = this.getFlagNameFromIndicator(indicator.id);
        if (flagName) {
          this.toggleFlag(flagName);
        }
      });
    });
  }

  getFlagNameFromIndicator(indicatorId) {
    const mapping = {
      'guarded-releases-flag': 'guarded-releases-section',
      'experimentation-flag': 'experimentation-section',
      'ai-configs-flag': 'ai-configs-section',
      'observability-flag': 'observability-section'
    };
    return mapping[indicatorId];
  }

  initializeFlagSlides() {
    console.log('🔒 Pre-storing all flag slides before LaunchDarkly initialization...');
    
    // Debug: Check if slides exist in DOM
    const allSections = document.querySelectorAll('section');
    console.log(`🔍 Total sections in DOM: ${allSections.length}`);
    
    const allFlagSlides = document.querySelectorAll('.flag-slide');
    console.log(`🔍 Found ${allFlagSlides.length} elements with .flag-slide class`);
    
    // Debug: Check what we actually found
    allFlagSlides.forEach((slide, i) => {
      console.log(`🔍 Flag slide ${i + 1}:`, {
        tagName: slide.tagName,
        className: slide.className,
        dataSection: slide.getAttribute('data-section'),
        style: slide.getAttribute('style'),
        display: slide.style.display
      });
    });
    
    // Store ALL flag slides for later use (don't remove yet)
    this.hiddenSlides = new Map();
    
    allFlagSlides.forEach((slide, index) => {
      const sectionName = slide.getAttribute('data-section');
      
      console.log(`🔍 Pre-storing slide ${index + 1}: ${sectionName}`);
      
      // Store the slide and its position info for later use
      const nextSibling = slide.nextElementSibling;
      const parent = slide.parentElement;
      
      // Store as array to handle multiple slides per section
      if (!this.hiddenSlides.has(sectionName)) {
        this.hiddenSlides.set(sectionName, []);
      }
      
      this.hiddenSlides.get(sectionName).push({
        element: slide,
        parent: parent,
        nextSibling: nextSibling
      });
      
      console.log(`📦 Pre-stored slide for ${sectionName}`);
    });
    
    console.log(`📦 Pre-stored ${allFlagSlides.length} flag slides in ${this.hiddenSlides.size} sections`);
  }

  async initLaunchDarkly() {
    try {
      // Get LaunchDarkly configuration from server
      const configResponse = await fetch('/api/config');
      const config = await configResponse.json();
      
      if (!config.clientSideId) {
        console.warn('No LaunchDarkly client-side ID configured, using simulation mode');
        this.startFlagPolling();
        return;
      }

      // Initialize LaunchDarkly client
      this.ldClient = LDClient.initialize(config.clientSideId, this.user);
      
      // Wait for initialization with timeout
      await this.ldClient.waitForInitialization(4900); // Just under 5 seconds to avoid LaunchDarkly warning
      
      // Set up flag change listeners
      this.setupFlagListeners();
      
      // Load initial flag states
      this.loadFlagsFromLD();
      
      console.log('✅ LaunchDarkly SDK initialized successfully');
    } catch (error) {
      console.warn('LaunchDarkly initialization failed, falling back to simulation:', error);
      this.startFlagPolling();
    }
  }

  setupFlagListeners() {
    if (!this.ldClient) return;
    
    Object.keys(this.flags).forEach(flagKey => {
      this.ldClient.on(`change:${flagKey}`, (current, previous) => {
        console.log(`🏁 Flag ${flagKey} changed: ${previous} → ${current}`);
        this.flags[flagKey] = current;
        this.updateUI();
        this.updateSlideContent(flagKey);
      });
    });
  }

  loadFlagsFromLD() {
    if (!this.ldClient) return;
    
    console.log('🔄 Loading flags from LaunchDarkly...');
    Object.keys(this.flags).forEach(flagKey => {
      const oldValue = this.flags[flagKey];
      this.flags[flagKey] = this.ldClient.variation(flagKey, false);
      console.log(`🏁 LaunchDarkly: ${flagKey} = ${this.flags[flagKey]} (was ${oldValue})`);
    });
    
    this.updateUI();
    this.updateAllSlideContent();
  }

  async loadFlags() {
    // Fallback method for when LaunchDarkly is not available
    try {
      const response = await fetch('/api/flags');
      const flags = await response.json();
      this.flags = { ...this.flags, ...flags };
      this.updateUI();
    } catch (error) {
      console.warn('Failed to load flags, using defaults:', error);
      this.updateUI();
    }
  }

  async toggleFlag(flagName) {
    if (this.flags.hasOwnProperty(flagName)) {
      this.flags[flagName] = !this.flags[flagName];
      console.log(`🏁 Toggled ${flagName}: ${this.flags[flagName]}`);
      
      // In a real implementation, this would update LaunchDarkly
      // For now, we'll just update the UI
      this.updateUI();
      this.updateSlideContent(flagName);
    }
  }

  updateUI() {
    // Update flag indicators
    Object.keys(this.flags).forEach(flagName => {
      const indicatorId = this.getIndicatorIdFromFlag(flagName);
      const indicator = document.getElementById(indicatorId);
      
      if (indicator) {
        indicator.classList.remove('active', 'inactive');
        indicator.classList.add(this.flags[flagName] ? 'active' : 'inactive');
      }
    });

    // Update slide highlights
    this.updateSlideHighlights();
    

  }

  getIndicatorIdFromFlag(flagName) {
    const mapping = {
      'guarded-releases-section': 'guarded-releases-flag',
      'experimentation-section': 'experimentation-flag',
      'ai-configs-section': 'ai-configs-flag',
      'observability-section': 'observability-flag'
    };
    return mapping[flagName];
  }

  updateSlideHighlights() {
    // Update the core value propositions slide based on active flags
    Object.keys(this.flags).forEach(flagName => {
      const highlightId = flagName.replace('-section', '-highlight');
      const element = document.getElementById(highlightId);
      
      if (element) {
        if (this.flags[flagName]) {
          element.classList.add('highlighted');
        } else {
          element.classList.remove('highlighted');
        }
      }
    });
  }



  updateSlideContent(flagName) {
    const sectionName = flagName.replace('-section', '');
    const isActive = this.flags[flagName];
    
    if (isActive) {
      this.showFlagSlides(sectionName);
    } else {
      this.hideFlagSlides(sectionName);
    }
    
    this.showFlagNotification(flagName, isActive);
  }

  updateAllSlideContent() {
    // Show/hide slides for all flags
    Object.keys(this.flags).forEach(flagName => {
      const sectionName = flagName.replace('-section', '');
      if (this.flags[flagName]) {
        this.showFlagSlides(sectionName);
      } else {
        this.hideFlagSlides(sectionName);
      }
    });
  }

  showFlagSlides(sectionName) {
    console.log(`🟢 SHOWING slides for ${sectionName}`);
    console.log(`🔍 hiddenSlides exists: ${!!this.hiddenSlides}`);
    console.log(`🔍 hiddenSlides has ${sectionName}: ${this.hiddenSlides && this.hiddenSlides.has(sectionName)}`);
    
    if (this.hiddenSlides) {
      console.log(`🔍 hiddenSlides keys: ${Array.from(this.hiddenSlides.keys()).join(', ')}`);
    }
    
    // Check if we have hidden slides for this section
    if (this.hiddenSlides && this.hiddenSlides.has(sectionName)) {
      const slideInfoArray = this.hiddenSlides.get(sectionName);
      console.log(`🔍 Found ${slideInfoArray.length} hidden slides for ${sectionName}`);
      
      // Find the insertion point (after "Core Value Propositions" slide)
      const slides = document.querySelector('.reveal .slides');
      const coreValueSlide = Array.from(slides.children).find(slide => 
        slide.querySelector('h2') && slide.querySelector('h2').textContent.includes('Core Value Propositions')
      );
      
      if (coreValueSlide) {
        console.log(`🎯 Found Core Value Propositions slide, inserting after it`);
        
        // Insert all slides for this section after the Core Value slide
        slideInfoArray.forEach((slideInfo, index) => {
          const { element } = slideInfo;
          
          console.log(`🔍 Re-inserting slide ${index + 1} after Core Value Propositions`);
          
          // Insert after the Core Value slide (or after the last inserted slide)
          const insertAfter = index === 0 ? coreValueSlide : slideInfoArray[index - 1].element;
          if (insertAfter.nextElementSibling) {
            slides.insertBefore(element, insertAfter.nextElementSibling);
          } else {
            slides.appendChild(element);
          }
          
          console.log(`✅ Re-inserted slide ${index + 1} for ${sectionName}`);
        });
      } else {
        console.warn(`❌ Could not find Core Value Propositions slide, appending at end`);
        // Fallback: append at end
        slideInfoArray.forEach((slideInfo, index) => {
          const { element, parent } = slideInfo;
          parent.appendChild(element);
          console.log(`✅ Re-inserted slide ${index + 1} at END for ${sectionName}`);
        });
      }
      
      // Remove from hidden slides map
      this.hiddenSlides.delete(sectionName);
      
      console.log(`✅ Re-inserted ${slideInfoArray.length} slides for ${sectionName} into DOM`);
      Reveal.sync();
    } else {
      // Slides are already visible, just make sure they're displayed
      const flagSlides = document.querySelectorAll(`section[data-section="${sectionName}"]`);
      console.log(`Found ${flagSlides.length} slides already in DOM for ${sectionName}`);
      
      flagSlides.forEach((slide, index) => {
        slide.style.display = 'block';
        console.log(`  📄 Ensured slide ${index + 1} is visible for ${sectionName}`);
      });
      
      if (flagSlides.length > 0) {
        Reveal.sync();
        console.log(`✅ Ensured ${flagSlides.length} slides are visible for ${sectionName}`);
      } else {
        console.warn(`❌ No slides found for ${sectionName} - they may not have been properly stored`);
      }
    }
  }

  hideFlagSlides(sectionName) {
    console.log(`🔴 HIDING slides for ${sectionName}`);
    
    // Use pre-stored slides instead of querying DOM
    if (this.hiddenSlides && this.hiddenSlides.has(sectionName)) {
      const slideInfoArray = this.hiddenSlides.get(sectionName);
      console.log(`Found ${slideInfoArray.length} pre-stored slides to hide for ${sectionName}`);
      
      // Remove each slide from DOM (they're already stored)
      slideInfoArray.forEach((slideInfo, index) => {
        const { element } = slideInfo;
        if (element && element.parentElement) {
          element.remove();
          console.log(`  📄 Removed slide ${index + 1} from DOM for ${sectionName}`);
        }
      });
      
      Reveal.sync();
      console.log(`❌ Removed ${slideInfoArray.length} slides from DOM for ${sectionName}`);
    } else {
      console.warn(`No pre-stored slides found to hide for ${sectionName}`);
    }
  }

  showFlagNotification(flagName, isActive) {
    const flagDisplayName = this.getFlagDisplayName(flagName);
    const status = isActive ? 'enabled' : 'disabled';
    const message = `${flagDisplayName} section ${status}`;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'flag-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${isActive ? 'var(--ld-success)' : 'var(--ld-gray)'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 5px;
      z-index: 1001;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  getFlagDisplayName(flagName) {
    const mapping = {
      'guarded-releases-section': 'Guarded Releases',
      'experimentation-section': 'Experimentation',
      'ai-configs-section': 'AI Configs',
      'observability-section': 'Observability'
    };
    return mapping[flagName] || flagName;
  }

  startFlagPolling() {
    // Poll for flag changes every 5 seconds
    // In a real implementation, this would be replaced with LaunchDarkly's streaming
    setInterval(async () => {
      await this.loadFlags();
    }, 5000);
  }

  onSlideChanged(event) {
    // Handle slide change events
    const slideIndex = event.indexh;
    console.log(`📊 Slide changed to: ${slideIndex}`);
    
    // You could add slide-specific logic here
    // For example, auto-enabling certain flags on specific slides
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ldApp = new LDPresentationApp();
});

// Add some utility functions for debugging
window.toggleAllFlags = () => {
  Object.keys(window.ldApp.flags).forEach(flag => {
    window.ldApp.toggleFlag(flag);
  });
};

window.resetFlags = () => {
  Object.keys(window.ldApp.flags).forEach(flag => {
    window.ldApp.flags[flag] = false;
  });
  window.ldApp.updateUI();
  window.ldApp.updateAllSlideContent();
};

window.debugSlides = () => {
  const allSections = document.querySelectorAll('.slides section');
  console.log(`Total sections: ${allSections.length}`);
  allSections.forEach((section, index) => {
    const dataSection = section.getAttribute('data-section');
    console.log(`Section ${index}: ${dataSection || 'main'} - ${section.querySelector('h1, h2, h3')?.textContent || 'No title'}`);
  });
};

window.cleanupSlides = () => {
  // Remove all flag sections
  const flagSections = document.querySelectorAll('section[data-section]');
  flagSections.forEach(section => section.remove());
  Reveal.sync();
  console.log(`Cleaned up ${flagSections.length} flag sections`);
};

window.resetPresentation = () => {
  // Reset all flags
  Object.keys(window.ldApp.flags).forEach(flag => {
    window.ldApp.flags[flag] = false;
  });
  
  // Clean up all slides
  window.cleanupSlides();
  
  // Update UI
  window.ldApp.updateUI();
  
  // Go back to first slide
  Reveal.slide(0);
  
  console.log('🔄 Presentation reset to original state');
};

// Add keyboard shortcuts info to console
console.log(`
🎮 Keyboard Shortcuts:
  G - Toggle Guarded Releases
  E - Toggle Experimentation  
  A - Toggle AI Configs
  O - Toggle Observability
  
🖱️  Click flag indicators in top-right to toggle
🔧 Debug: toggleAllFlags(), resetFlags()
`);
