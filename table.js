// Initialisation du gestionnaire de tableaux/pins
const manager = new BoardManager();

// Sélection des éléments du DOM
const modalForm = document.getElementById('new-pin');
const pinboard = document.getElementById('pinboard'); // Conteneur de tes pins

// Champs du formulaire
const inputTitre = document.getElementById('titre');
const inputDescription = document.getElementById('description');
const selectStatut = document.getElementById('statut');
const selectCouleur = document.getElementById('couleur');

// Fonction pour afficher tous les pins dans le pinboard
function renderPins() {
  pinboard.innerHTML = ''; // Nettoie le conteneur avant de re-rendre
  
  const boards = manager.getBoards();
  
  boards.forEach(board => {
    const pinElement = document.createElement('div');
    pinElement.classList.add('pin-card');
    pinElement.dataset.id = board.id;
    
    // Application de la couleur choisie (si stockée en nom ou code hex)
    if (board.color) {
      pinElement.style.backgroundColor = board.color; // ou bordure selon ton design CSS
    }

    pinElement.innerHTML = `
      <h3>${escapeHTML(board.title)}</h3>
      <p>${escapeHTML(board.description)}</p>
      <span class="badge status-${board.status}">${board.status}</span>
      <button class="delete-btn" data-id="${board.id}">×</button>
    `;

    pinboard.appendChild(pinElement);
  });
}

// 1. Écouter la soumission du formulaire
modalForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Empêche le rechargement de la page

  try {
    // 2. Récupérer les données et les envoyer au BoardManager
    manager.createBoard({
      title: inputTitre.value,
      description: inputDescription.value,
      status: selectStatut.value,
      color: selectCouleur.value // Récupère la valeur du select couleur ("yellow", "blue", etc.)
    });

    // 3. Mettre à jour l'affichage sur la page
    renderPins();

    // 4. Réinitialiser et fermer la modale
    modalForm.reset();
    modalForm.classList.add('hidden'); // Cache la modale
  } catch (error) {
    alert(error.message);
  }
});

// Gestion de la suppression d'un pin au clic
pinboard.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    manager.deleteBoard(id);
    renderPins();
  }
});

// Petite fonction de sécurité anti-XSS
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Charger les pins enregistrés dès l'ouverture de la page
document.addEventListener('DOMContentLoaded', renderPins);