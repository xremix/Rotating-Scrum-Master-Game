const nameForm = document.getElementById('nameForm');
const nameInput = document.getElementById('nameInput');
const namesList = document.getElementById('namesList');
const startBtn = document.getElementById('startBtn');
const announcement = document.getElementById('announcement');
const cardsArea = document.getElementById('cardsArea');

let names = [];
let gameStarted = false;
let winnerIndex = null;
let remainingIndices = [];
let flipped = [];
let isFlipping = false; // Prevent card clicks during flip or after winner

const RECENT_KEY = 'teamgame_recent_names';
const pokerNumbers = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getRecentNames() {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
}
function saveRecentNames(namesArr) {
    localStorage.setItem(RECENT_KEY, JSON.stringify(namesArr));
}
function addRecentName(name) {
    let recent = getRecentNames();
    if (!recent.includes(name)) {
        recent.unshift(name);
        if (recent.length > 12) recent = recent.slice(0, 12);
        saveRecentNames(recent);
    }
}
function renderRecentNames() {
    const recent = getRecentNames().filter(n => !names.includes(n));
    const recentNamesDiv = document.getElementById('recentNames');
    if (recent.length === 0) {
        recentNamesDiv.innerHTML = '';
        return;
    }
    recentNamesDiv.innerHTML = '<span style="font-size:15px;color:#2193b0;font-weight:bold;">Recent:</span> ' +
        recent.map(n => `<span class="name-tag" style="background:#b3e5fc;position:relative;display:inline-flex;align-items:center;">
    <span style="cursor:pointer;" onclick="addNameFromRecent('${n}')">${n}</span>
    <button class='remove-recent' title='Remove' onclick="removeRecentName('${n}')" style='margin-left:6px;background:none;border:none;color:#2193b0;font-size:16px;cursor:pointer;padding:0 4px;line-height:1;border-radius:50%;transition:background 0.2s;'><b>&times;</b></button>
</span>`).join(' ');
}
window.addNameFromRecent = function (name) {
    if (name && !names.includes(name)) {
        names.push(name);
        renderNames();
        addRecentName(name);
        renderRecentNames();
        nameInput.focus();
    }
}
window.removeRecentName = function (name) {
    let recent = getRecentNames();
    recent = recent.filter(n => n !== name);
    saveRecentNames(recent);
    renderRecentNames();
}

nameForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (name && !names.includes(name)) {
        names.push(name);
        nameInput.value = '';
        renderNames();
        addRecentName(name);
        renderRecentNames();
    }
    nameInput.focus(); // Always focus after adding
});

function renderNames() {
    namesList.innerHTML = names.map(n => `<span class="name-tag">${n}</span>`).join(' ');
    startBtn.disabled = names.length < 2;
    nameInput.focus(); // Always focus after rendering
    renderRecentNames();
}

startBtn.addEventListener('click', () => {
    if (names.length < 2) return;
    gameStarted = true;
    nameForm.style.display = 'none';
    startBtn.style.display = 'none';
    announcement.textContent = '';
    setupGame();
});

function setupGame() {
    cardsArea.innerHTML = '';
    flipped = Array(names.length).fill(false);
    remainingIndices = Array.from({ length: names.length }, (_, i) => i);
    winnerIndex = Math.floor(Math.random() * names.length);
    chosenNames = Array(names.length).fill(null);
    // Prepare and shuffle poker numbers
    let pokerNumsPool = [];
    while (pokerNumsPool.length < names.length) {
        pokerNumsPool = pokerNumsPool.concat(pokerNumbers);
    }
    pokerNumsPool = shuffleArray(pokerNumsPool).slice(0, names.length);
    for (let i = 0; i < names.length; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = i;
        const pokerNum = pokerNumsPool[i];
        card.innerHTML = `
    <div class="card-inner">
        <div class="card-front">
            <span class="poker-num top-left">${pokerNum}</span>
            <span class="poker-num bottom-right">${pokerNum}</span>
            <div class="card-center">
                <img src="https://media2.dev.to/dynamic/image/width=800,height=,fit=scale-down,gravity=auto,format=auto/https%3A%2F%2Fthepracticaldev.s3.amazonaws.com%2Fi%2Fssr57rvag7ona3z9d68h.png" alt="Scrum Master" width="128" height="128" style="object-fit:contain;">
            </div>
        </div>
        <div class="card-back"></div>
    </div>
`;
        card.addEventListener('click', () => handleCardClick(i));
        cardsArea.appendChild(card);
    }
    nextTurn();
}

let currentIdx = null;
let chosenNames = [];

function nextTurn() {
    if (remainingIndices.length === 0) return;
    // Pick a random name to announce
    currentIdx = remainingIndices[Math.floor(Math.random() * remainingIndices.length)];
    const name = names[currentIdx];
    const funPrompts = [
        "Are you brave enough to flip a card, NAME?",
        "NAME, do you feel lucky today? Pick a card and find out!",
        "It's your moment, NAME! Will you risk it for the biscuit?",
        "NAME, legend says only the bold flip the card. Are you bold?",
        "Time to test your fate, NAME. Choose wisely!",
        "NAME, fortune favors the daring. Take your pick!",
        "Rumor has it, NAME always picks the winning card. Prove it!",
        "NAME, if you pick the Scrum Master, you owe everyone coffee!",
        "Pick a card, any card, NAME. What could possibly go wrong?",
        "NAME, the cards are calling your name. Will you answer?",
        "If you flip the Scrum Master, you get bragging rights, NAME!",
        "NAME, may the odds be ever in your favor. Flip a card!",
        "Choose a card, NAME. No pressure... or is there?",
        "NAME, destiny awaits behind one of these cards!",
        "Feeling adventurous, NAME? Go ahead, take the risk!",
        "NAME, if you don't pick, the universe will pick for you!",
        "Pick wisely, NAME. The Scrum Master title is at stake!",
        "NAME, are you ready to shuffle your fate?",
        "Flip a card, NAME. The suspense is real!",
        "NAME, this is your chance to shine (or just have fun)!"
    ];
    const chosenPromptRaw = funPrompts[Math.floor(Math.random() * funPrompts.length)];
    const chosenPrompt = chosenPromptRaw.replace(/NAME/g, name);
    announcement.innerHTML = `<span style='font-size:2.2em;font-weight:bold;color:#185a9d;text-shadow:1px 1px 0 #6dd5ed;'>${name}</span><br><span style='font-size:1.1em;'>${chosenPrompt}</span>`;
    for (let i = 0; i < cardsArea.children.length; i++) {
        cardsArea.children[i].style.boxShadow = '';
    }
}

function handleCardClick(idx) {
    if (!gameStarted) return;
    if (flipped[idx]) return;
    if (isFlipping) return;
    // Assign the current name to the chosen card
    chosenNames[idx] = names[currentIdx];
    flipCard(idx);
}

function showConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    canvas.style.display = 'block';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const confettiCount = 180;
    const confetti = [];
    for (let i = 0; i < confettiCount; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            r: 8 + Math.random() * 12,
            d: Math.random() * confettiCount,
            color: `hsl(${Math.random() * 360},80%,60%)`,
            tilt: Math.random() * 10,
            tiltAngle: 0
        });
    }
    let angle = 0;
    let tiltAngle = 0;
    function drawConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < confettiCount; i++) {
            let c = confetti[i];
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.tilt * Math.PI / 180);
            ctx.beginPath();
            ctx.ellipse(0, 0, c.r, c.r / 2, 0, 0, 2 * Math.PI);
            ctx.fillStyle = c.color;
            ctx.fill();
            ctx.restore();
        }
        updateConfetti();
    }
    function updateConfetti() {
        angle += 0.01;
        tiltAngle += 0.1;
        for (let i = 0; i < confettiCount; i++) {
            let c = confetti[i];
            c.y += (Math.cos(angle + c.d) + 3 + c.r / 2) / 2;
            c.x += Math.sin(angle) * 2;
            c.tilt = Math.sin(tiltAngle + i) * 10;
            if (c.y > canvas.height) {
                c.x = Math.random() * canvas.width;
                c.y = -10;
            }
        }
    }
    let duration = 0;
    function animate() {
        drawConfetti();
        duration += 16;
        if (duration < 4000) {
            requestAnimationFrame(animate);
        } else {
            canvas.style.display = 'none';
        }
    }
    animate();
    // Ensure canvas resizes with window
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function flipCard(idx) {
    isFlipping = true;
    const card = cardsArea.children[idx];
    const back = card.querySelector('.card-back');
    const front = card.querySelector('.card-front');
    const name = chosenNames[idx] || '';
    front.classList.add('suspense');
    back.innerHTML = '';
    back.className = 'card-back';
    card.classList.add('flipping');
    setTimeout(() => {
        card.classList.remove('flipping');
        card.classList.add('flipped-anim');
        if (idx === winnerIndex) {
            // Choose a random icon for the scrum master
            const icons = [
                'fa-user-secret',
                'fa-user-ninja',
                'fa-person-military-pointing',
                'fa-robot',
                'fa-dragon',
                'fa-users-rectangle',
                'fa-user-graduate'
            ];
            const chosenIcon = icons[Math.floor(Math.random() * icons.length)];
            back.innerHTML = `
                <div class="winner">
                    <i class="fa ${chosenIcon}" style="color:#fff;font-size:2.5em;margin-top:10px;"></i><br/>
                    SCRUM MASTER<br>
                    <span style="font-size:0.8em;">${name}</span><br>
                </div>
            `;
            back.classList.add('winner');
            announcement.textContent = `🟩 ${name} is the SCRUM MASTER! 🟩`;
            setTimeout(showConfetti, 1000);
            remainingIndices = [];
            isFlipping = true; // Block further clicks after winner
        } else {
            back.innerHTML = `
                <div class="not-winner">
                    <i class="fa fa-user" style="color:#fff;font-size:2.5em;margin-top:10px;"></i><br/>
                    Participant<br>
                    <span style="font-size:0.8em;">${name}</span><br>
                </div>
            `;
            back.classList.add('not-winner');
            setTimeout(() => {
                isFlipping = false; // Allow clicks after animation
                nextTurn();
            }, 700);
            remainingIndices = remainingIndices.filter(i => i !== currentIdx);
        }
        front.classList.remove('suspense');
    }, 1200);
    flipped[idx] = true;
}

window.onload = function () {
    nameInput.focus(); // Focus at the beginning
    renderRecentNames();
};
