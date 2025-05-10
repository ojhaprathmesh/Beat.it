// Utility functions for handling theme animations and effects

// Animate form labels when focused/filled
const initializeFormLabels = () => {
    const inputs = document.querySelectorAll('.form-control');
    
    inputs.forEach(input => {
      // Check initial state and trigger positioning immediately
      if (input.value) {
        input.classList.add('has-value');
      }
      
      // Force apply styles on load for required inputs
      if (input.required || input.value) {
        input.classList.add('has-value');
        input.parentElement.classList.add('has-initial-value');
      }
      
      // Handle focus and blur events
      input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
      });
      
      input.addEventListener('blur', () => {
        input.parentElement.classList.remove('focused');
        if (input.value) {
          input.classList.add('has-value');
        } else {
          input.classList.remove('has-value');
        }
      });
      
      // Handle input changes
      input.addEventListener('input', () => {
        if (input.value) {
          input.classList.add('has-value');
        } else {
          input.classList.remove('has-value');
        }
      });
    });
  };
  
  // Apply background animation effect
  const initializeBackgroundEffect = () => {
    const container = document.querySelector('.animated-background');
    if (!container) return;
    
    // Create animated elements
    for (let i = 0; i < 5; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'animated-bubble';
      
      // Randomize size and position
      const size = Math.random() * 100 + 50;
      bubble.style.width = size + 'px';
      bubble.style.height = size + 'px';
      bubble.style.left = Math.random() * 100 + '%';
      bubble.style.animationDelay = Math.random() * 5 + 's';
      bubble.style.animationDuration = Math.random() * 10 + 15 + 's';
      
      container.appendChild(bubble);
    }
  };
  
  // Initialize theme elements
  const initializeTheme = () => {
    // Use defer to ensure the DOM is fully loaded before initializing
    setTimeout(() => {
      initializeFormLabels();
      initializeBackgroundEffect();
    }, 10);
  };
  
  // Export for use in other files
  window.themeUtils = {
    initializeTheme
  };