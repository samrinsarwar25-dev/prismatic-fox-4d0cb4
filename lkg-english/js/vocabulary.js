// Vocabulary Module - Picture Words Learning
// Handles vocabulary dashboard, word viewing, and interactive games

const vocabularyModule = (function() {
  let vocabularyData = null;
  let vocabProgress = {};
  let currentCategory = null;
  let currentWord = null;
  let currentActivity = null;

  const STORAGE_KEY = 'lkg-vocab-progress';
  const SPEECH_RATE = 0.9;
  const SPEECH_PITCH = 1;

  // Initialize module on page load
  async function init() {
    loadProgress();
    await loadVocabularyData();
    checkPageType();
  }

  // Load vocabulary data from JSON
  async function loadVocabularyData() {
    try {
      const response = await fetch('./data/vocabulary.json');
      vocabularyData = await response.json();
      return vocabularyData;
    } catch (error) {
      console.error('Error loading vocabulary data:', error);
      return null;
    }
  }

  // Determine what page we're on and initialize accordingly
  function checkPageType() {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);

    if (path.includes('vocabulary.html') && !urlParams.has('activity')) {
      initDashboard();
    } else if (urlParams.has('activity')) {
      const activity = urlParams.get('activity');
      const category = urlParams.get('category');
      initActivity(activity, category);
    }
  }

  // Initialize vocabulary dashboard
  function initDashboard() {
    if (!vocabularyData) {
      console.error('Vocabulary data not loaded');
      return;
    }

    updateStats();
    renderCategoryGrid();
    triggerRokoWelcome();
  }

  // Update statistics on dashboard
  function updateStats() {
    const totalWords = vocabularyData.vocabulary.length;
    const learnedWords = Object.keys(vocabProgress).filter(k => vocabProgress[k].viewed).length;
    const totalStars = Object.keys(vocabProgress).reduce((sum, k) => sum + (vocabProgress[k].stars || 0), 0);

    document.getElementById('total-words').textContent = totalWords;
    document.getElementById('learned-words').textContent = learnedWords;
    document.getElementById('total-stars').textContent = totalStars;
  }

  // Render category grid on dashboard
  function renderCategoryGrid() {
    const grid = document.getElementById('category-grid');
    if (!grid) return;

    grid.innerHTML = '';

    vocabularyData.categories.forEach((category, index) => {
      const categoryCard = createCategoryCard(category);
      categoryCard.style.animation = `slideIn 0.3s ease-out ${index * 0.05}s both`;
      grid.appendChild(categoryCard);
    });
  }

  // Create a single category card
  function createCategoryCard(category) {
    const card = document.createElement('a');
    card.href = `./vocabulary.html?category=${category.id}&action=view`;
    card.className = 'category-card';

    const words = vocabularyData.vocabulary.filter(w => w.category === category.id);
    const learned = words.filter(w => {
      const key = w.id;
      return vocabProgress[key] && vocabProgress[key].viewed;
    }).length;

    const progressPercent = (learned / words.length) * 100;

    card.innerHTML = `
      <div class="category-icon">${category.icon}</div>
      <div class="category-name">${category.name}</div>
      <div class="category-count">${words.length} words</div>
      <div class="category-progress">
        <div class="category-progress-bar" style="width: ${progressPercent}%"></div>
      </div>
    `;

    return card;
  }

  // Trigger Roko welcome animation
  function triggerRokoWelcome() {
    setTimeout(() => {
      rokoReact('welcome');
    }, 300);
  }

  // Speak word using Web Speech API
  function speakWord(text, onEnd = null) {
    // Stop any currently playing speech
    window.speechSynthesis.cancel();

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = SPEECH_RATE;
    utterance.pitch = SPEECH_PITCH;

    // Try to use English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  // Load progress from localStorage
  function loadProgress() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      vocabProgress = JSON.parse(stored);
    }
  }

  // Save progress to localStorage
  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vocabProgress));
    updateStats();
  }

  // Mark word as viewed
  function markWordViewed(wordId) {
    if (!vocabProgress[wordId]) {
      vocabProgress[wordId] = { viewed: true, stars: 0, completedGames: [] };
    } else {
      vocabProgress[wordId].viewed = true;
    }
    saveProgress();
  }

  // Award stars for activity completion
  function awardStars(wordId, stars) {
    if (!vocabProgress[wordId]) {
      vocabProgress[wordId] = { viewed: true, stars: 0, completedGames: [] };
    }
    vocabProgress[wordId].stars = (vocabProgress[wordId].stars || 0) + stars;
    saveProgress();
  }

  // Get category words
  function getCategoryWords(categoryId) {
    return vocabularyData.vocabulary.filter(w => w.category === categoryId);
  }

  // Get a random word from category
  function getRandomWord(categoryId) {
    const words = getCategoryWords(categoryId);
    return words[Math.floor(Math.random() * words.length)];
  }

  // Get multiple random words
  function getRandomWords(categoryId, count) {
    const words = getCategoryWords(categoryId);
    const selected = [];
    const indices = new Set();

    while (selected.length < Math.min(count, words.length)) {
      const idx = Math.floor(Math.random() * words.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        selected.push(words[idx]);
      }
    }

    return selected;
  }

  // Initialize activity
  function initActivity(activityName, categoryId) {
    currentCategory = categoryId;
    currentActivity = activityName;

    if (activityName === 'view') {
      initWordViewer(categoryId);
    } else if (activityName === 'listen-find') {
      initListenFind(categoryId);
    } else if (activityName === 'match-picture') {
      initMatchPicture(categoryId);
    } else if (activityName === 'what-is-this') {
      initWhatIsThis(categoryId);
    } else if (activityName === 'spelling-fun') {
      initSpellingFun(categoryId);
    } else if (activityName === 'memory-match') {
      initMemoryMatch(categoryId);
    }
  }

  // Word viewer for learning individual words
  function initWordViewer(categoryId) {
    const words = getCategoryWords(categoryId);
    if (words.length === 0) return;

    document.body.innerHTML = `
      <header>
        <div class="wrap header-bar">
          <a href="./vocabulary.html?category=${categoryId}" class="brand">← Back</a>
          <nav><a href="./">Home</a></nav>
        </div>
      </header>
      <main>
        <div class="wrap vocab-view-container">
          <div class="vocab-header">
            <span class="vocab-counter"><span id="word-counter">1</span>/<span id="word-total">${words.length}</span></span>
          </div>
          <div class="vocab-card" id="word-card">
            <!-- Will be filled by JavaScript -->
          </div>
          <div class="vocab-nav-buttons" id="nav-buttons">
            <!-- Navigation buttons will be added here -->
          </div>
        </div>
      </main>
      <footer>
        <div class="wrap">
          <p>&copy; 2026 Little Learners Studio | Learn with Roko! 🌟</p>
        </div>
      </footer>
    `;

    // Add styles
    if (!document.querySelector('link[href="./css/vocabulary.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = './css/vocabulary.css';
      document.head.appendChild(link);
    }

    let currentIndex = 0;

    function displayWord(index) {
      if (index < 0 || index >= words.length) return;

      currentIndex = index;
      const word = words[index];
      markWordViewed(word.id);

      const card = document.getElementById('word-card');
      if (!card) return;

      card.innerHTML = `
        <div class="vocab-illustration">${word.emoji}</div>
        <div class="vocab-word">${word.word}</div>
        <div class="vocab-pronunciation">/${word.pronunciation}/</div>
        <button class="audio-btn" id="audio-btn">🔊</button>
        <div class="vocab-meaning">${word.meaning}</div>
        <div class="vocab-sentence">"${word.sentence}"</div>
      `;

      // Add audio button listener
      document.getElementById('audio-btn').addEventListener('click', () => {
        speakWord(word.word);
      });

      document.getElementById('word-counter').textContent = index + 1;

      const navBtns = document.getElementById('nav-buttons');
      navBtns.innerHTML = `
        <button class="vocab-nav-btn" id="prev-btn" ${index === 0 ? 'disabled' : ''}>← Previous</button>
        <a href="./vocabulary.html?category=${categoryId}&activity=listen-find" class="vocab-nav-btn vocab-nav-btn-secondary">🎮 Play</a>
        <button class="vocab-nav-btn" id="next-btn" ${index === words.length - 1 ? 'disabled' : ''}>Next →</button>
      `;

      if (index > 0) {
        document.getElementById('prev-btn').addEventListener('click', () => displayWord(currentIndex - 1));
      }

      if (index < words.length - 1) {
        document.getElementById('next-btn').addEventListener('click', () => displayWord(currentIndex + 1));
      }

      rokoReact('thinking');
    }

    // Make functions globally available
    window.speakWord = speakWord;
    window.rokoReact = rokoReact;
    window.displayWord = displayWord;

    displayWord(0);
  }

  // Listen and Find activity
  function initListenFind(categoryId) {
    const words = getRandomWords(categoryId, 4);
    if (words.length < 4) return;

    let score = 0;
    let questionCount = 0;

    function nextQuestion() {
      questionCount++;
      if (questionCount > 5) {
        showActivityResult('Listen and Find', score);
        return;
      }

      const correctWord = words[Math.floor(Math.random() * words.length)];
      const choices = [correctWord];

      while (choices.length < 4) {
        const random = getRandomWord(categoryId);
        if (!choices.find(w => w.id === random.id)) {
          choices.push(random);
        }
      }

      // Shuffle choices
      choices.sort(() => Math.random() - 0.5);

      document.getElementById('activity-content').innerHTML = `
        <div class="activity-container">
          <div class="activity-instruction">Listen to the word and pick the right picture!</div>
          <div class="question-display">
            <div class="question-text">What is this?</div>
          </div>
          <div class="choices-grid" id="choices">
            ${choices.map((word, idx) => `
              <button class="choice-btn" onclick="selectChoice(${idx}, '${word.id}', '${correctWord.id}')">
                <span class="choice-image">${word.emoji}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      // Auto-play audio
      setTimeout(() => speakWord(correctWord.word), 500);
    }

    createActivityPage('listen-find', categoryId, nextQuestion);
    window.selectChoice = (idx, selected, correct) => {
      if (selected === correct) {
        score++;
        awardStars(correct, 1);
        rokoReact('success');
        setTimeout(() => nextQuestion(), 1500);
      } else {
        rokoReact('error');
      }
    };
  }

  // Match Picture activity
  function initMatchPicture(categoryId) {
    const words = getRandomWords(categoryId, 5);
    if (words.length < 5) return;

    let matched = 0;
    const pictures = [...words];
    const wordLabels = [...words].sort(() => Math.random() - 0.5);

    createActivityPage('match-picture', categoryId, () => {
      document.getElementById('activity-content').innerHTML = `
        <div class="activity-container">
          <div class="activity-instruction">Match the pictures with their words!</div>
          <div class="matching-container">
            <div class="match-column">
              <strong style="margin-bottom: 12px;">Pictures:</strong>
              ${pictures.map((w, i) => `
                <button class="match-item" data-picture="${w.id}" onclick="selectPicture('${w.id}')">
                  ${w.emoji}
                </button>
              `).join('')}
            </div>
            <div class="match-column">
              <strong style="margin-bottom: 12px;">Words:</strong>
              ${wordLabels.map((w, i) => `
                <button class="match-item" data-word="${w.id}" onclick="selectWord('${w.id}')">
                  ${w.word}
                </button>
              `).join('')}
            </div>
          </div>
          <div id="feedback"></div>
        </div>
      `;
    });

    let selectedPicture = null;
    let matchedPairs = {};

    window.selectPicture = (id) => {
      selectedPicture = id;
      document.querySelectorAll('[data-picture]').forEach(el => {
        el.classList.remove('selected');
      });
      document.querySelector(`[data-picture="${id}"]`).classList.add('selected');
    };

    window.selectWord = (id) => {
      if (!selectedPicture) return;

      if (selectedPicture === id) {
        matched++;
        matchedPairs[id] = true;
        document.querySelector(`[data-picture="${selectedPicture}"]`).classList.add('matched');
        document.querySelector(`[data-word="${id}"]`).classList.add('matched');
        awardStars(id, 1);
        rokoReact('success');
        selectedPicture = null;

        if (matched === words.length) {
          setTimeout(() => showActivityResult('Match Picture', matched), 1000);
        }
      } else {
        rokoReact('error');
      }
    };
  }

  // What Is This quiz
  function initWhatIsThis(categoryId) {
    const words = getRandomWords(categoryId, 5);
    let score = 0;
    let questionCount = 0;

    function nextQuestion() {
      questionCount++;
      if (questionCount > words.length) {
        showActivityResult('What Is This', score);
        return;
      }

      const word = words[questionCount - 1];
      const allWords = vocabularyData.vocabulary;
      const wrongChoices = [];

      while (wrongChoices.length < 2) {
        const random = allWords[Math.floor(Math.random() * allWords.length)];
        if (random.id !== word.id && !wrongChoices.find(w => w.id === random.id)) {
          wrongChoices.push(random);
        }
      }

      const choices = [word, ...wrongChoices].sort(() => Math.random() - 0.5);

      document.getElementById('activity-content').innerHTML = `
        <div class="activity-container">
          <div class="activity-instruction">What is this picture?</div>
          <div class="question-display">
            <div class="question-image">${word.emoji}</div>
          </div>
          <div class="choices-grid" id="choices">
            ${choices.map(w => `
              <button class="choice-btn" onclick="answerQuestion('${w.id}', '${word.id}')">
                <span class="choice-text">${w.word}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    createActivityPage('what-is-this', categoryId, nextQuestion);

    window.answerQuestion = (selected, correct) => {
      if (selected === correct) {
        score++;
        awardStars(correct, 1);
        document.getElementById('activity-content').innerHTML += `
          <div class="feedback success">✓ Correct! Great job!</div>
        `;
        rokoReact('success');
        setTimeout(() => nextQuestion(), 1500);
      } else {
        rokoReact('error');
        document.getElementById('activity-content').innerHTML += `
          <div class="feedback error">✗ Try again!</div>
        `;
      }
    };

    nextQuestion();
  }

  // Spelling Fun
  function initSpellingFun(categoryId) {
    const words = getRandomWords(categoryId, 5);
    let score = 0;
    let questionCount = 0;

    function nextQuestion() {
      questionCount++;
      if (questionCount > words.length) {
        showActivityResult('Spelling Fun', score);
        return;
      }

      const word = words[questionCount - 1];
      const wrongChoices = [];

      while (wrongChoices.length < 2) {
        const w = getRandomWord(categoryId);
        if (w.id !== word.id) {
          wrongChoices.push(w.word);
        }
      }

      const choices = [word.word, ...wrongChoices].sort(() => Math.random() - 0.5);

      document.getElementById('activity-content').innerHTML = `
        <div class="activity-container">
          <div class="activity-instruction">How do you spell this word?</div>
          <div class="question-display">
            <div class="question-image">${word.emoji}</div>
            <div class="question-text">Listen...</div>
          </div>
          <div class="choices-grid">
            ${choices.map(c => `
              <button class="choice-btn" onclick="answerSpelling('${c}', '${word.word}')">
                <span class="choice-text">${c}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      setTimeout(() => speakWord(word.word), 500);
    }

    createActivityPage('spelling-fun', categoryId, nextQuestion);

    window.answerSpelling = (selected, correct) => {
      if (selected === correct) {
        score++;
        awardStars(correct, 1);
        rokoReact('success');
        setTimeout(() => nextQuestion(), 1500);
      } else {
        rokoReact('error');
      }
    };

    nextQuestion();
  }

  // Memory Match game
  function initMemoryMatch(categoryId) {
    const words = getRandomWords(categoryId, 4);
    const pairs = [...words, ...words].sort(() => Math.random() - 0.5);
    let flipped = [];
    let matched = 0;
    let moves = 0;

    function checkMatch() {
      if (flipped.length !== 2) return;

      moves++;
      const [idx1, idx2] = flipped;

      if (pairs[idx1].id === pairs[idx2].id) {
        matched++;
        document.querySelectorAll('[data-memory]').forEach(el => {
          if (el.dataset.memory === pairs[idx1].id) {
            el.classList.add('matched');
          }
        });
        awardStars(pairs[idx1].id, 1);
        rokoReact('success');

        if (matched === words.length) {
          setTimeout(() => showActivityResult('Memory Match', moves, `${moves} moves!`), 500);
        }

        flipped = [];
      } else {
        rokoReact('error');
        setTimeout(() => {
          document.querySelectorAll('[data-memory]').forEach(el => {
            if (el.classList.contains('flipped') && !el.classList.contains('matched')) {
              el.classList.remove('flipped');
            }
          });
          flipped = [];
        }, 800);
      }
    }

    createActivityPage('memory-match', categoryId, () => {
      document.getElementById('activity-content').innerHTML = `
        <div class="activity-container">
          <div class="activity-instruction">Find matching pairs! Moves: <strong id="moves">0</strong></div>
          <div class="memory-grid" id="memory-grid">
            ${pairs.map((word, idx) => `
              <button class="memory-card" data-memory="${word.id}" data-index="${idx}" onclick="flipCard(${idx})">
                <span>${word.emoji}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    });

    window.flipCard = (idx) => {
      if (flipped.length >= 2 || flipped.includes(idx)) return;

      const card = document.querySelector(`[data-index="${idx}"]`);
      card.classList.add('flipped');
      flipped.push(idx);

      document.getElementById('moves').textContent = moves + 1;

      if (flipped.length === 2) {
        setTimeout(checkMatch, 600);
      }
    };
  }

  // Helper to create activity page structure
  function createActivityPage(activityName, categoryId, onReady) {
    const categoryObj = vocabularyData.categories.find(c => c.id === categoryId);
    const categoryName = categoryObj ? categoryObj.name : 'Category';

    document.body.innerHTML = `
      <header>
        <div class="wrap header-bar">
          <a href="./vocabulary.html?category=${categoryId}&action=view" class="brand">← Back</a>
          <nav><a href="./">Home</a></nav>
        </div>
      </header>
      <main>
        <div class="wrap">
          <div id="activity-content">
            <div class="activity-container">
              <div class="activity-instruction">Loading activity...</div>
            </div>
          </div>
        </div>
      </main>
      <footer>
        <div class="wrap">
          <p>&copy; 2026 Little Learners Studio | Learn with Roko! 🌟</p>
        </div>
      </footer>
    `;

    // Ensure CSS is loaded
    if (!document.querySelector('link[href="./css/vocabulary.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = './css/vocabulary.css';
      document.head.appendChild(link);
    }

    // Make critical functions globally available
    window.speakWord = speakWord;
    window.rokoReact = rokoReact;
    window.vocabularyModule = vocabularyModule;

    // Delay to ensure DOM is ready
    setTimeout(() => {
      if (onReady) onReady();
    }, 10);
  }

  // Show activity completion result
  function showActivityResult(activityName, score, extra = '') {
    const categoryId = currentCategory;
    const message = `Great job! You completed ${activityName}!`;

    document.getElementById('activity-content').innerHTML = `
      <div class="activity-container" style="text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 20px;">🎉</div>
        <h2 style="color: var(--navy);">${message}</h2>
        <div class="score-display">Score: ${score} ${extra}</div>
        <a href="./vocabulary.html?category=${categoryId}&action=view" class="vocab-nav-btn" style="display: inline-block; margin-top: 20px;">Continue Learning</a>
      </div>
    `;

    rokoReact('success');
  }

  // Roko reactions
  function rokoReact(event) {
    if (typeof window.rokoReact === 'function') {
      window.rokoReact(event);
    }
  }

  // Public API
  return {
    init,
    initDashboard,
    initActivity,
    speakWord,
    getCategoryWords,
    getRandomWord,
    getRandomWords,
    markWordViewed,
    awardStars,
    getProgress: () => vocabProgress,
    getData: () => vocabularyData
  };
})();

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  vocabularyModule.init();
});
