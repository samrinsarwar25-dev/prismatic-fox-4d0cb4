// LKG English App Navigation & Interaction Script

document.addEventListener('DOMContentLoaded', function() {
  // Initialize navigation
  initializeNavigation();

  // Initialize progress bar animation
  initializeProgressBar();

  // Add smooth scrolling for anchor links
  initializeSmoothScroll();
});

/**
 * Initialize navigation interactions
 */
function initializeNavigation() {
  const moduleCards = document.querySelectorAll('.module-card');

  moduleCards.forEach(card => {
    card.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      // Log for debugging
      console.log('Navigating to:', href);

      // Navigation will happen naturally via href
      // This is just for any custom behavior we might add
    });

    // Add hover animation
    card.addEventListener('mouseenter', function() {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.style.transition = 'all 0.2s ease';
      }
    });
  });
}

/**
 * Animate progress bar on page load
 */
function initializeProgressBar() {
  const progressFill = document.querySelector('.progress-fill');

  if (progressFill) {
    // Check if we have stored progress data
    const currentProgress = localStorage.getItem('lkg-progress') || 0;

    // Animate the progress bar
    setTimeout(() => {
      progressFill.style.width = currentProgress + '%';
    }, 100);
  }
}

/**
 * Smooth scroll for anchor links
 */
function initializeSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      // Don't prevent default for navigation links
      if (href === '#') {
        e.preventDefault();
        return;
      }

      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * Update progress globally (will be used by lesson completion)
 */
function updateProgress(newProgress) {
  localStorage.setItem('lkg-progress', Math.min(newProgress, 100));

  const progressFill = document.querySelector('.progress-fill');
  if (progressFill) {
    progressFill.style.width = newProgress + '%';
  }
}

/**
 * Show notification/toast message
 */
function showNotification(message, type = 'info') {
  // Simple implementation for now
  console.log(`[${type.toUpperCase()}] ${message}`);

  // Could be enhanced with a visual toast later
}

/**
 * Celebrate achievement (for games/lessons)
 */
function celebrateAchievement() {
  const emoji = ['🎉', '⭐', '🌟', '✨', '🎊'];
  const randomEmoji = emoji[Math.floor(Math.random() * emoji.length)];

  showNotification(`Great job! ${randomEmoji}`, 'success');
}

// Export functions for use in other pages
if (typeof window !== 'undefined') {
  window.LKG = {
    updateProgress,
    showNotification,
    celebrateAchievement
  };
}

/**
 * Change Roko's expression
 */
function changeRokoExpression(expression) {
  const rokoImg = document.getElementById('roko-mascot');
  if (rokoImg) {
    const expressions = {
      'happy': '../img/lkg-mascot/roko-happy.svg',
      'encouraging': '../img/lkg-mascot/roko-encouraging.svg',
      'celebrating': '../img/lkg-mascot/roko-celebrating.svg',
      'thinking': '../img/lkg-mascot/roko-thinking.svg',
      'sad': '../img/lkg-mascot/roko-sad.svg',
      'neutral': '../img/lkg-mascot/roko-neutral.svg'
    };
    
    if (expressions[expression]) {
      rokoImg.style.animation = 'none';
      setTimeout(() => {
        rokoImg.src = expressions[expression];
        rokoImg.style.animation = 'slideIn 0.4s ease-out';
      }, 10);
    }
  }
}

/**
 * Roko reacts to page events
 */
function rokoReact(event) {
  switch(event) {
    case 'welcome':
      changeRokoExpression('happy');
      setTimeout(() => changeRokoExpression('encouraging'), 2000);
      break;
    case 'success':
      changeRokoExpression('celebrating');
      celebrateAchievement();
      setTimeout(() => changeRokoExpression('happy'), 2000);
      break;
    case 'thinking':
      changeRokoExpression('thinking');
      break;
    case 'help':
      changeRokoExpression('encouraging');
      break;
    case 'error':
      changeRokoExpression('sad');
      setTimeout(() => changeRokoExpression('encouraging'), 2000);
      break;
    default:
      changeRokoExpression('neutral');
  }
}
