// Base de données par défaut (chargée si rien dans le localStorage)
const defaultQuestions = [
    { id: 1, theme: "Sciences", q: "Quelle est la planète la plus chaude du système solaire ?", a: "Vénus", exp: "Malgré sa position (2ème après Mercure), son épaisse atmosphère crée un effet de serre extrême (environ 460°C).", interval: 0, next_review: 0 },
    { id: 2, theme: "Histoire", q: "En quelle année a eu lieu la chute de l'Empire romain d'Occident ?", a: "476", exp: "Le dernier empereur, Romulus Augustule, est déposé par le chef barbare Odoacre.", interval: 0, next_review: 0 },
    { id: 3, theme: "Géographie", q: "Quel est le plus long fleuve du monde ?", a: "Le Nil (ou l'Amazone)", exp: "Le débat persiste, mais le Nil est traditionnellement considéré comme le plus long (environ 6 650 km).", interval: 0, next_review: 0 },
    { id: 4, theme: "Histoire", q: "Qui a été le premier président de la Ve République en France ?", a: "Charles de Gaulle", exp: "Il a pris ses fonctions en janvier 1959 après avoir impulsé la nouvelle Constitution.", interval: 0, next_review: 0 },
    { id: 5, theme: "Sciences", q: "Que mesure l'échelle de Scoville ?", a: "La force des piments", exp: "Elle mesure la teneur en capsaïcine, le composé chimique responsable de la sensation de chaleur.", interval: 0, next_review: 0 }
];

let questions = [];
let currentCardIndex = -1;
let pendingCards = [];

// Initialisation
function initApp() {
    // Récupérer les données sauvegardées ou charger celles par défaut
    const savedData = localStorage.getItem('cultureG_data');
    if (savedData) {
        questions = JSON.parse(savedData);
        // Vérifier si de nouvelles questions ont été ajoutées dans le code
        if (questions.length < defaultQuestions.length) {
            const savedIds = questions.map(q => q.id);
            defaultQuestions.forEach(dq => {
                if (!savedIds.includes(dq.id)) questions.push(dq);
            });
            saveData();
        }
    } else {
        questions = JSON.parse(JSON.stringify(defaultQuestions));
        saveData();
    }
    loadNextCard();
}

function saveData() {
    localStorage.setItem('cultureG_data', JSON.stringify(questions));
}

function getTodayTimestamp() {
    const now = new Date();
    now.setHours(0,0,0,0);
    return now.getTime();
}

function loadNextCard() {
    const today = getTodayTimestamp();
    const selectedTheme = document.getElementById('themeFilter').value;

    // Filtrer les cartes: celles dont la date de révision est <= aujourd'hui ET qui correspondent au thème
    pendingCards = questions.filter(q => {
        const isDue = q.next_review <= today;
        const matchesTheme = (selectedTheme === "Tous" || q.theme === selectedTheme);
        return isDue && matchesTheme;
    });

    document.getElementById('statsDisplay').innerText = `Cartes à réviser aujourd'hui : ${pendingCards.length}`;

    if (pendingCards.length === 0) {
        document.getElementById('cardContainer').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
    } else {
        document.getElementById('cardContainer').style.display = 'block';
        document.getElementById('emptyState').style.display = 'none';
        
        // Prendre une carte au hasard parmi celles à réviser
        const randomIndex = Math.floor(Math.random() * pendingCards.length);
        const card = pendingCards[randomIndex];
        currentCardIndex = questions.findIndex(q => q.id === card.id);

        displayCard(card);
    }
}

function displayCard(card) {
    document.getElementById('cardTag').innerText = card.theme;
    document.getElementById('questionText').style.display = 'block';
    document.getElementById('questionText').innerText = card.q;
    document.getElementById('answerText').innerText = card.a;
    document.getElementById('explanationText').innerText = card.exp;
    
    // Cacher la réponse par défaut
    document.getElementById('answerSection').style.display = 'none';
}

function showAnswer() {
    document.getElementById('answerSection').style.display = 'flex';
}

function handleAnswer(isCorrect, event) {
    event.stopPropagation(); // Empêche le clic de se propager à la carte entière
    
    let card = questions[currentCardIndex];
    const today = getTodayTimestamp();

    if (isCorrect) {
        // Algorithme basique de répétition espacée : on double l'intervalle
        card.interval = card.interval === 0 ? 1 : card.interval * 2;
    } else {
        // Si erreur, on remet à zéro (révision demain)
        card.interval = 0;
    }

    // Calcul de la prochaine date
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + (card.interval === 0 ? 1 : card.interval));
    card.next_review = nextDate.getTime();

    saveData();
    loadNextCard();
}

// Lancer l'application au chargement
window.onload = initApp;