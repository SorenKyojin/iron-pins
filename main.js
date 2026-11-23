// ==========================================
// 1. CLASSE DE GESTION DES DONNÉES (BoardManager)
// ==========================================
class BoardManager {
  constructor(metaKey = 'iron_tables_meta') {
    this.metaKey = metaKey;
    this.meta = this.loadMeta();
    this.pins = [];
    if (this.meta.activeId) {
      this.pins = this.loadBoardPins(this.meta.activeId);
    }
  }

  loadMeta() {
    const raw = localStorage.getItem(this.metaKey);
    return raw ? JSON.parse(raw) : { tables: [], activeId: null };
  }

  saveMeta() {
    localStorage.setItem(this.metaKey, JSON.stringify(this.meta));
  }

  // Génère un ID lisible type "table1", "table2", etc.
  generateTableId() {
    let index = this.meta.tables.length + 1;
    let candidate = `table${index}`;
    while (this.meta.tables.some(t => t.id === candidate) || localStorage.getItem(candidate) !== null) {
      index++;
      candidate = `table${index}`;
    }
    return candidate;
  }

  loadBoardPins(tableId) {
    const raw = localStorage.getItem(tableId);
    return raw ? JSON.parse(raw) : [];
  }

  saveBoardPins() {
    if (!this.meta.activeId) return;
    localStorage.setItem(this.meta.activeId, JSON.stringify(this.pins));
  }

  // Crée un nouveau tableau vide (nouvelle clé dans le localStorage)
  createTable(name) {
    if (!name || !name.trim()) {
      throw new Error('Le nom du tableau est obligatoire.');
    }
    const id = this.generateTableId();
    const newTable = {
      id,
      name: name.trim(),
      createdAt: new Date().toISOString()
    };

    this.meta.tables.push(newTable);
    this.meta.activeId = id;
    this.pins = [];

    this.saveMeta();
    this.saveBoardPins(); // Crée la clé "tableX" avec "[]"
    return newTable;
  }

  getTables() {
    return this.meta.tables;
  }

  getActiveTable() {
    if (!this.meta.activeId) return null;
    return this.meta.tables.find(t => t.id === this.meta.activeId) || null;
  }

  openTable(tableId) {
    const exists = this.meta.tables.some(t => t.id === tableId);
    if (!exists) return false;
    this.meta.activeId = tableId;
    this.pins = this.loadBoardPins(tableId);
    this.saveMeta();
    return true;
  }

  // Ferme le tableau ouvert (sauf s'il s'agit du seul tableau)
  closeTable() {
    if (!this.meta.activeId || this.meta.tables.length <= 1) {
      return false;
    }
    this.meta.activeId = null;
    this.pins = [];
    this.saveMeta();
    return true;
  }

  renameTable(tableId, newName) {
    const table = this.meta.tables.find(t => t.id === tableId);
    if (table && newName.trim()) {
      table.name = newName.trim();
      this.saveMeta();
    }
  }

  // Supprime la clé du tableau dans le localStorage et ouvre un autre tableau si disponible
  deleteActiveTable() {
    const currentId = this.meta.activeId;
    if (!currentId) return null;

    localStorage.removeItem(currentId);
    this.meta.tables = this.meta.tables.filter(t => t.id !== currentId);

    const nextTable = this.meta.tables[0] || null;
    this.meta.activeId = nextTable ? nextTable.id : null;
    this.pins = nextTable ? this.loadBoardPins(nextTable.id) : [];

    this.saveMeta();
    return nextTable;
  }

  // --- CRUD des pins du tableau actif ---

  getPins() {
    return this.pins;
  }

  getPinById(pinId) {
    return this.pins.find(p => p.id === pinId);
  }

  createPin({ title, description = '', status = 'todo', color = 'yellow' }) {
    if (!this.meta.activeId) {
      throw new Error('Veuillez d’abord créer ou ouvrir un tableau.');
    }
    if (!title || !title.trim()) {
      throw new Error('Le titre est obligatoire.');
    }
    const pin = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      status,
      color,
      createdAt: new Date().toISOString()
    };
    this.pins.push(pin);
    this.saveBoardPins();
    return pin;
  }

  updatePin(pinId, updates) {
    const idx = this.pins.findIndex(p => p.id === pinId);
    if (idx === -1) return null;
    this.pins[idx] = { ...this.pins[idx], ...updates };
    this.saveBoardPins();
    return this.pins[idx];
  }

  duplicatePin(pinId) {
    const pin = this.getPinById(pinId);
    if (!pin) return null;
    const copy = {
      ...pin,
      id: crypto.randomUUID(),
      title: `${pin.title} (Copie)`,
      createdAt: new Date().toISOString()
    };
    this.pins.push(copy);
    this.saveBoardPins();
    return copy;
  }

  deletePin(pinId) {
    const before = this.pins.length;
    this.pins = this.pins.filter(p => p.id !== pinId);
    if (this.pins.length !== before) {
      this.saveBoardPins();
      return true;
    }
    return false;
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
  const boards = manager.getPins();
  
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
      manager.duplicatePin(id);
      renderPins(); // Ferme le menu et rafraîchit
    }

    if (action === 'change-color') {
      const board = manager.getPinById(id);
      if (board) {
        const currentIndex = colorCycle.indexOf(board.color);
        const nextColor = colorCycle[(currentIndex + 1) % colorCycle.length];
        manager.updatePin(id, { color: nextColor });
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
      manager.createPin({
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
      const board = manager.getPinById(id);
      if (board) {
        const currentIndex = statusCycle.indexOf(board.status);
        const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
        manager.updatePin(id, { status: nextStatus });
        renderPins();
      }
    }

    if (e.target.dataset.action === 'delete') {
      // 1. Déclenche l'animation visuelle de dissolution
      pinCard.classList.add('dissolving');

      // 2. Attend la fin de la transition (350ms) avant de supprimer réellement
      setTimeout(() => {
        manager.deletePin(id);
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
        manager.updatePin(id, { title: newTitle });
        e.target.setAttribute('title', newTitle);
      }
    }

    if (e.target.classList.contains('pin-desc')) {
      const newDesc = e.target.textContent.trim();
      manager.updatePin(id, { description: newDesc });
    }
  }, true);
}

const tableMenuBtn = document.getElementById('board-menu-btn');
const tableMenu = document.querySelector('.table-menu');
const topBar = document.querySelector('.top-bar');
const boardTitleEl = document.getElementById('board-title');

// Boutons fixes dans .table-menu (Nouveau, Fermer, Supprimer)
const [btnNewTable, btnCloseTable, btnDeleteTable] = tableMenu
  ? tableMenu.querySelectorAll('.menu-btn')
  : [];
const separatorEl = tableMenu ? tableMenu.querySelector('.h-separator') : null;

function closeTableMenu() {
  if (tableMenu) tableMenu.classList.add('hidden');
}

function renderTableMenu() {
  if (!tableMenu) return;

  const tables = manager.getTables();
  const activeTable = manager.getActiveTable();

  // "Fermer" désactivé s'il n'y a pas de tableau ouvert ou s'il n'y en a qu'un seul
  if (btnCloseTable) {
    btnCloseTable.disabled = !activeTable || tables.length <= 1;
  }

  // "Supprimer" désactivé s'il n'y a aucun tableau ouvert
  if (btnDeleteTable) {
    btnDeleteTable.disabled = !activeTable;
  }

  // Supprime les anciens boutons de tableaux situés après le séparateur
  if (separatorEl) {
    let next = separatorEl.nextElementSibling;
    while (next) {
      const toRemove = next;
      next = next.nextElementSibling;
      toRemove.remove();
    }

    // Ajoute la liste de tous les tableaux créés
    tables.forEach(table => {
      const itemBtn = document.createElement('button');
      itemBtn.type = 'button';
      itemBtn.className = 'menu-btn';
      itemBtn.textContent = table.name;

      const isCurrent = activeTable && table.id === activeTable.id;
      if (isCurrent) {
        itemBtn.disabled = true;
        itemBtn.classList.add('is-current');
      } else {
        itemBtn.addEventListener('click', () => {
          manager.openTable(table.id);
          closeTableMenu();
          refreshBoardView();
        });
      }

      tableMenu.appendChild(itemBtn);
    });
  }
}

function refreshBoardView() {
  const activeTable = manager.getActiveTable();

  if (!activeTable) {
    // Aucun tableau ouvert : on cache la top-bar (et les pins)
    if (topBar) topBar.classList.add('hidden');
    if (boardTitleEl) boardTitleEl.textContent = '';
  } else {
    // Tableau ouvert : on affiche la top-bar et le nom du tableau
    if (topBar) topBar.classList.remove('hidden');
    if (boardTitleEl) {
      boardTitleEl.textContent = activeTable.name;
      boardTitleEl.setAttribute('contenteditable', 'true');
      boardTitleEl.setAttribute('spellcheck', 'false');
    }
  }

  renderTableMenu();
  if (typeof renderPins === 'function') {
    renderPins();
  }
}
function positionTableMenu() {
  if (!tableMenuBtn || !tableMenu) return;

  const btnRect = tableMenuBtn.getBoundingClientRect();
  const gap = 8; // Espace vertical en pixels sous le bouton

  tableMenu.style.position = 'fixed';
  tableMenu.style.top = `${Math.round(btnRect.bottom + gap)}px`;
  // Aligne le bord droit du menu sur le bord droit du bouton "Tableau..."
  tableMenu.style.right = `${Math.round(window.innerWidth - btnRect.right)}px`;
  tableMenu.style.left = 'auto';
  tableMenu.style.bottom = 'auto';
}

// Ouverture / fermeture du menu au clic sur "Tableau..."
if (tableMenuBtn && tableMenu) {
  tableMenuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof renderTableMenu === 'function') {
      renderTableMenu();
    }
    const willOpen = tableMenu.classList.contains('hidden');
    tableMenu.classList.toggle('hidden');
    if (willOpen) {
      positionTableMenu();
    }
  });
}

window.addEventListener('resize', () => {
  if (tableMenu && !tableMenu.classList.contains('hidden')) {
    positionTableMenu();
  }
});

// Fermeture du menu si on clique en dehors
document.addEventListener('click', (e) => {
  if (tableMenu && !tableMenu.classList.contains('hidden') && e.target !== tableMenuBtn) {
    closeTableMenu();
  }
});

// Action "Nouveau" : crée un nouveau tableau vide (nouvelle clé localStorage)
if (btnNewTable) {
  btnNewTable.addEventListener('click', () => {
    const name = prompt('Nom du nouveau tableau :');
    if (name && name.trim()) {
      manager.createTable(name);
      closeTableMenu();
      refreshBoardView();
    }
  });
}

// Action "Fermer" : ferme le tableau ouvert et cache la top-bar
if (btnCloseTable) {
  btnCloseTable.addEventListener('click', () => {
    if (manager.closeTable()) {
      closeTableMenu();
      refreshBoardView();
    }
  });
}

// Action "Supprimer" : supprime la clé du tableau et ouvre un autre tableau s'il en existe
if (btnDeleteTable) {
  btnDeleteTable.addEventListener('click', () => {
    manager.deleteActiveTable();
    closeTableMenu();
    refreshBoardView();
  });
}

// Renommer le tableau en cliquant sur son nom à gauche
if (boardTitleEl) {
  boardTitleEl.addEventListener('blur', () => {
    const activeTable = manager.getActiveTable();
    if (!activeTable) return;
    const newName = boardTitleEl.textContent.trim();
    if (newName) {
      manager.renameTable(activeTable.id, newName);
      renderTableMenu();
    } else {
      boardTitleEl.textContent = activeTable.name;
    }
  });

  boardTitleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      boardTitleEl.blur();
    }
  });
}

document.addEventListener('DOMContentLoaded', refreshBoardView);

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

document.addEventListener('DOMContentLoaded', renderPins);