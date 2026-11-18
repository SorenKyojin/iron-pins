// ==========================================
// 1. CLASSE DE GESTION DES DONNÉES (BoardManager)
// ==========================================
class BoardManager {
  constructor(storageKey = 'my_pins') {
    this.storageKey = storageKey;
    this.boards = this.loadFromStorage();
  }

  loadFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  saveToStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.boards));
  }

  createBoard({ title, description = '', status = 'todo', color = 'yellow' }) {
    if (!title || title.trim() === '') {
      throw new Error('Le titre est obligatoire pour créer un pin.');
    }

    const newBoard = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      status: status,
      color: color,
      createdAt: new Date().toISOString()
    };

    this.boards.push(newBoard);
    this.saveToStorage();
    return newBoard;
  }

  getBoards() {
    return this.boards;
  }

  getBoardById(id) {
    return this.boards.find(board => board.id === id);
  }

  updateBoard(id, updates) {
    const index = this.boards.findIndex(board => board.id === id);
    if (index === -1) return null;

    const { id: _, createdAt: __, ...allowedUpdates } = updates;

    this.boards[index] = { ...this.boards[index], ...allowedUpdates };
    this.saveToStorage();
    return this.boards[index];
  }

  deleteBoard(id) {
    const initialLength = this.boards.length;
    this.boards = this.boards.filter(board => board.id !== id);
    
    if (this.boards.length !== initialLength) {
      this.saveToStorage();
      return true;
    }
    return false;
  }
  duplicateBoard(id) {
    const board = this.getBoardById(id);
    if (!board) return null;

    const duplicatedBoard = {
      ...board,
      id: crypto.randomUUID(),
      title: `${board.title} (Copie)`,
      createdAt: new Date().toISOString()
    };

    this.boards.push(duplicatedBoard);
    this.saveToStorage();
    return duplicatedBoard;
  }
}


// ==========================================
// 2. LOGIQUE INTERFACE & DOM
// ==========================================

const manager = new BoardManager();

const openModalBtn = document.getElementById('new-pin-btn');
const modalForm = document.getElementById('new-pin');
const pinboard = document.getElementById('pinboard'); // Balise <main id="pinboard">

const inputTitre = document.getElementById('titre');
const inputDescription = document.getElementById('description');
const selectStatut = document.getElementById('statut');
const selectCouleur = document.getElementById('couleur');

const statusMap = {
  'done': { label: 'Terminées', class: 'st-done' },
  'progress': { label: 'En cours', class: 'st-progress' },
  'todo': { label: 'À faire', class: 'st-todo' },
  'blocked': { label: 'Bloquées', class: 'st-blocked' }
};

const statusCycle = ['todo', 'progress', 'done', 'blocked'];

// Désactivation du menu contextuel par défaut du navigateur sur toute la page
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

const colorCycle = ['yellow', 'blue', 'red', 'green', 'purple'];

// Mise à jour de la fonction renderPins pour inclure le menu caché
function renderPins() {
  if (!pinboard) return;
  pinboard.innerHTML = '';
  const boards = manager.getBoards();
  
  boards.forEach(board => {
    const pinElement = document.createElement('div');
    pinElement.classList.add('pin-card');
    pinElement.dataset.id = board.id;
    
    if (board.color) {
      pinElement.style.backgroundColor = `var(--pin-${board.color})`;
      pinElement.style.setProperty('--pin-darker', `var(--pin-${board.color}-d)` );
    }

    if (board.color === 'blue') {
      pinElement.classList.add('pin-blue-text');
    }

    const currentStatusInfo = statusMap[board.status] || statusMap['todo'];

    pinElement.innerHTML = `
      <div class="pin-header">
        <span class="status-badge ${currentStatusInfo.class}" data-action="toggle-status" title="Changer le statut"></span>
        <h3 class="pin-title" contenteditable="true" spellcheck="false" title="${escapeHTML(board.title)}">${escapeHTML(board.title)}</h3>
        <button class="delete-btn" data-action="delete" title="Supprimer">×</button>
      </div>
      <p class="pin-desc" contenteditable="true" spellcheck="false">${escapeHTML(board.description)}</p>
      
      <!-- Menu contextuel caché derrière le pin -->
      <div class="pin-context-menu">
        <button data-action="duplicate">Dupliquer</button>
        <button data-action="change-color">Changer la couleur</button>
      </div>
    `;

    pinboard.appendChild(pinElement);
  });
}

// Gestion du clic droit sur un pin pour afficher le menu
pinboard.addEventListener('contextmenu', (e) => {
  const pinCard = e.target.closest('.pin-card');
  if (!pinCard) return;
  e.preventDefault();

  // Fermer les autres menus ouverts
  document.querySelectorAll('.pin-card.menu-open').forEach(card => {
    if (card !== pinCard) card.classList.remove('menu-open');
  });

  // Basculer l'état du menu sur ce pin
  pinCard.classList.toggle('menu-open');
});

// Gestion des clics (actions du menu contextuel ou fermeture)
document.addEventListener('click', (e) => {
  const pinCard = e.target.closest('.pin-card');

  // Si on clique sur une action du menu contextuel
  if (e.target.closest('.pin-context-menu')) {
    const card = e.target.closest('.pin-card');
    const id = card.dataset.id;
    const action = e.target.dataset.action;

    if (action === 'duplicate') {
      manager.duplicateBoard(id);
      renderPins(); // Ferme le menu et rafraîchit
    }

    if (action === 'change-color') {
      const board = manager.getBoardById(id);
      if (board) {
        const currentIndex = colorCycle.indexOf(board.color);
        const nextColor = colorCycle[(currentIndex + 1) % colorCycle.length];
        manager.updateBoard(id, { color: nextColor });
        renderPins();
      }
    }
    return;
  }

  // Si on clique en dehors d'un pin ouvert, on ferme tous les menus contextuels
  document.querySelectorAll('.pin-card.menu-open').forEach(card => {
    if (!card.contains(e.target)) {
      card.classList.remove('menu-open');
    }
  });
});

// Gestion de l'ouverture de la modale
if (openModalBtn) {
  openModalBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    modalForm.classList.remove('hidden');
  });
}

// Fermeture au clic en dehors
document.addEventListener('click', (e) => {
  if (modalForm && !modalForm.classList.contains('hidden')) {
    if (!modalForm.contains(e.target) && e.target !== openModalBtn) {
      modalForm.classList.add('hidden');
    }
  }
});

// Soumission du formulaire
if (modalForm) {
  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      manager.createBoard({
        title: inputTitre.value,
        description: inputDescription.value,
        status: selectStatut.value,
        color: selectCouleur.value
      });
      renderPins();
      modalForm.reset();
      modalForm.classList.add('hidden');
    } catch (error) {
      alert(error.message);
    }
  });
}

// Interactions sur le pinboard (changement de statut, édition, suppression)
if (pinboard) {
  pinboard.addEventListener('click', (e) => {
    const pinCard = e.target.closest('.pin-card');
    if (!pinCard) return;
    const id = pinCard.dataset.id;

    if (e.target.dataset.action === 'toggle-status') {
      const board = manager.getBoardById(id);
      if (board) {
        const currentIndex = statusCycle.indexOf(board.status);
        const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
        manager.updateBoard(id, { status: nextStatus });
        renderPins();
      }
    }

    if (e.target.dataset.action === 'delete') {
      // 1. Déclenche l'animation visuelle de dissolution
      pinCard.classList.add('dissolving');

      // 2. Attend la fin de la transition (350ms) avant de supprimer réellement
      setTimeout(() => {
        manager.deleteBoard(id);
        renderPins();
      }, 350);
    }
  });

  pinboard.addEventListener('blur', (e) => {
    const pinCard = e.target.closest('.pin-card');
    if (!pinCard) return;
    const id = pinCard.dataset.id;

    if (e.target.classList.contains('pin-title')) {
      const newTitle = e.target.textContent.trim();
      if (newTitle) {
        manager.updateBoard(id, { title: newTitle });
        e.target.setAttribute('title', newTitle);
      }
    }

    if (e.target.classList.contains('pin-desc')) {
      const newDesc = e.target.textContent.trim();
      manager.updateBoard(id, { description: newDesc });
    }
  }, true);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

document.addEventListener('DOMContentLoaded', renderPins);