// Global variables
let names = [];
let isSelecting = false;
let gameInProgress = false;
let currentPlayerIndex = 0;
let teeth = [];
let mines = [];
let losers = [];

// DOM elements
const nameInput = document.getElementById('nameInput');
const addBtn = document.getElementById('addBtn');
const nameList = document.getElementById('nameList');
const selectCount = document.getElementById('selectCount');
const selectCountValue = document.getElementById('selectCountValue');
const selectBtn = document.getElementById('selectBtn');
const gameSection = document.getElementById('gameSection');
const teethGrid = document.getElementById('teethGrid');
const currentPlayerName = document.getElementById('currentPlayerName');
const gameStatus = document.getElementById('gameStatus');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');
const resetBtn = document.getElementById('resetBtn');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    updateSliderValue();
    updateSelectButton();
    
    // Event listeners
    addBtn.addEventListener('click', addName);
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addName();
        }
    });
    
    selectCount.addEventListener('input', updateSliderValue);
    selectBtn.addEventListener('click', selectPeople);
    resetBtn.addEventListener('click', resetSelection);
    
    // Prevent form submission on Enter in input
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
});

// Add name to the list
function addName() {
    const name = nameInput.value.trim();
    
    if (!name) {
        showNotification('Please enter a name!', 'error');
        return;
    }
    
    if (names.includes(name)) {
        showNotification('This name is already added!', 'error');
        return;
    }
    
    if (names.length >= 10) {
        showNotification('Maximum 10 people allowed!', 'error');
        return;
    }
    
    names.push(name);
    nameInput.value = '';
    updateNameList();
    updateSelectButton();
    showNotification(`${name} added successfully!`, 'success');
}

// Remove name from the list
function removeName(nameToRemove) {
    names = names.filter(name => name !== nameToRemove);
    updateNameList();
    updateSelectButton();
    showNotification(`${nameToRemove} removed!`, 'info');
}

// Update the name list display
function updateNameList() {
    if (names.length === 0) {
        nameList.innerHTML = '<p class="empty-message">No players added yet. Add some people to get started!</p>';
        return;
    }
    
    nameList.innerHTML = names.map(name => `
        <div class="name-item">
            <span class="name-text">${name}</span>
            <button class="btn-remove" onclick="removeName('${name}')">Remove</button>
        </div>
    `).join('');
}

// Update slider value display
function updateSliderValue() {
    const value = selectCount.value;
    selectCountValue.textContent = value;
    updateSelectButton();
}

// Update select button state
function updateSelectButton() {
    const canSelect = names.length > 0 && 
                     parseInt(selectCount.value) <= names.length && 
                     !isSelecting;
    
    selectBtn.disabled = !canSelect;
    
    if (names.length === 0) {
        selectBtn.textContent = 'Add players first!';
    } else if (parseInt(selectCount.value) > names.length) {
        selectBtn.textContent = `Need ${parseInt(selectCount.value) - names.length} more players!`;
    } else {
        selectBtn.textContent = 'Start Game!';
    }
}

// Start the alligator teeth game
async function selectPeople() {
    if (isSelecting || names.length === 0) return;
    
    isSelecting = true;
    gameInProgress = true;
    selectBtn.disabled = true;
    selectBtn.textContent = 'Game in Progress...';
    
    // Hide previous results
    resultsSection.style.display = 'none';
    
    // Initialize game
    initializeGame();
    
    // Show game section
    gameSection.style.display = 'block';
    gameSection.scrollIntoView({ behavior: 'smooth' });
    
    // Start the game
    startGame();
}

// Initialize the alligator teeth game
function initializeGame() {
    // Reset game state
    currentPlayerIndex = 0;
    teeth = [];
    mines = [];
    losers = [];
    
    // Create 20 teeth
    for (let i = 0; i < 20; i++) {
        teeth.push({
            id: i,
            isMine: false,
            isPulled: false,
            element: null
        });
    }
    
    // Place mines randomly
    const numMines = parseInt(selectCount.value);
    const minePositions = [];
    
    while (minePositions.length < numMines) {
        const randomPos = Math.floor(Math.random() * 20);
        if (!minePositions.includes(randomPos)) {
            minePositions.push(randomPos);
            teeth[randomPos].isMine = true;
        }
    }
    
    mines = minePositions;
    
    // Display teeth
    displayTeeth();
    
    // Update current player
    updateCurrentPlayer();
}

// Display the teeth grid
function displayTeeth() {
    teethGrid.innerHTML = teeth.map((tooth, index) => `
        <div class="tooth" id="tooth-${index}" onclick="pullTooth(${index})">
            ${index + 1}
        </div>
    `).join('');
    
    // Store element references
    teeth.forEach((tooth, index) => {
        tooth.element = document.getElementById(`tooth-${index}`);
    });
}

// Start the game
function startGame() {
    updateGameStatus("Choose a tile to dishwash!");
}

// Pull a tooth
function pullTooth(toothIndex) {
    if (!gameInProgress || teeth[toothIndex].isPulled) return;
    
    const tooth = teeth[toothIndex];
    const currentPlayer = names[currentPlayerIndex];
    
    // Mark tooth as pulled
    tooth.isPulled = true;
    tooth.element.classList.add('pulled');
    
    if (tooth.isMine) {
        // Mine exploded!
        tooth.element.classList.add('mine');
        losers.push(currentPlayer);
        
        updateGameStatus(`${currentPlayer} is out!`);
        
        // Check if game should continue
        if (losers.length >= parseInt(selectCount.value)) {
            endGame();
        } else {
            // Next player's turn
            nextPlayer();
        }
    } else {
        // Safe tooth
        tooth.element.classList.add('safe');
        updateGameStatus(`${currentPlayer} is safe!`);
        
        // Next player's turn
        setTimeout(() => {
            nextPlayer();
        }, 1000);
    }
}

// Move to next player
function nextPlayer() {
    do {
        currentPlayerIndex = (currentPlayerIndex + 1) % names.length;
    } while (losers.includes(names[currentPlayerIndex]) && losers.length < names.length);
    
    updateCurrentPlayer();
    updateGameStatus("Choose a tile to dishwash!");
}

// Update current player display
function updateCurrentPlayer() {
    currentPlayerName.textContent = names[currentPlayerIndex];
}

// Update game status message
function updateGameStatus(message) {
    gameStatus.textContent = message;
}

// End the game
function endGame() {
    gameInProgress = false;
    
    // Show all mines
    teeth.forEach(tooth => {
        if (tooth.isMine && !tooth.isPulled) {
            tooth.element.classList.add('mine');
        }
    });
    
    // Display results
    displayFinalResults(losers);
    
    // Reset button state
    selectBtn.textContent = 'Play Again!';
    selectBtn.disabled = false;
    isSelecting = false;
    
    // Show results
    setTimeout(() => {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 2000);
    
    // Show notification
    showNotification('Game Over!', 'success');
}



// Get random names
function getRandomNames(count) {
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Display temporary results during spinning
function displayTemporaryResults(selectedNames) {
    resultsContainer.innerHTML = selectedNames.map((name, index) => `
        <div class="result-item" style="animation-delay: ${index * 0.1}s;">
            🍽️ ${name}
        </div>
    `).join('');
}

// Display final results
function displayFinalResults(selectedNames) {
    resultsContainer.innerHTML = selectedNames.map((name, index) => `
        <div class="result-item" style="animation-delay: ${index * 0.1}s;">
            ${name} Is The Dishwasher!
        </div>
    `).join('');
}

// Reset selection
function resetSelection() {
    resultsSection.style.display = 'none';
    gameSection.style.display = 'none';
    resultsContainer.innerHTML = '';
    teethGrid.innerHTML = '';
    teeth = [];
    mines = [];
    losers = [];
    gameInProgress = false;
    currentPlayerIndex = 0;
    updateSelectButton();
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: type === 'error' ? '#ff6b6b' : 
                   type === 'success' ? '#51cf66' : '#4dabf7',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '25px',
        fontSize: '14px',
        fontWeight: '600',
        zIndex: '1000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        animation: 'slideDown 0.3s ease-out'
    });
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add fadeOut animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// Add some fun easter eggs
let clickCount = 0;
document.querySelector('header h1').addEventListener('click', function() {
    clickCount++;
    if (clickCount === 5) {
        showNotification('🎉 You found the secret! You get a free pass from dish duty!', 'success');
        clickCount = 0;
    }
});

// Add haptic feedback for mobile
function addHapticFeedback() {
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
}

// Add haptic feedback to buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', addHapticFeedback);
});