// 1. Sélection des éléments du DOM
const openModalBtn = document.getElementById('new-pin-btn');
const modalForm = document.getElementById('new-pin');

// (Optionnel recommandé) : Pour que le formulaire se comporte comme une vraie modale, 
// il est préférable de l'envelopper dans un conteneur semi-transparent (overlay).
// Si ton HTML direct est juste le <form>, on gère le clic sur la fenêtre globale.

// 2. Ouvrir la modale au clic sur le bouton
if (openModalBtn) {
  openModalBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Évite que le clic ne se propage immédiatement au document
    modalForm.classList.remove('hidden'); // Retire la classe qui cache le formulaire
    // Alternative si tu n'utilises pas de classe CSS : modalForm.style.display = 'block';
  });
}

// 3. Fermer la modale si on clique en dehors du formulaire
document.addEventListener('click', (e) => {
  // Vérifie si la modale est ouverte et si le clic n'est ni sur le bouton d'ouverture ni à l'intérieur du formulaire
  const isModalOpen = !modalForm.classList.contains('hidden'); // ou modalForm.style.display !== 'none'
  
  if (isModalOpen && !modalForm.contains(e.target) && e.target !== openModalBtn) {
    modalForm.classList.add('hidden');
    // Alternative : modalForm.style.display = 'none';
  }
});

// Empêcher la fermeture si on clique *à l'intérieur* du formulaire
modalForm.addEventListener('click', (e) => {
  e.stopPropagation();
});