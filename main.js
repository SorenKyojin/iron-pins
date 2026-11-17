const taskForm = document.getElementById('new-pin');
const pinboard = document.getElementById('pinboard');
const STORAGE_KEY = 'pins_data';

function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}
function saveToStorage(pins) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
}
let pins = loadFromStorage();

function afficherTaches() {
    pinboard.innerHTML = "";
    pins.forEach((pin) => {
        const carte = document.createElement("div");
        carte.classList.add("pin-card", pin.couleur);
        const titre = document.createElement("h3");
        titre.textContent = pin.titre;
        const description = document.createElement("p");
        description.textContent = pin.description;
        const statut = document.createElement("span");
        statut.textContent = `Statut: ${pin.statut}`;
        carte.append(titre, description, statut);
        pinboard.append(carte);
    });
}

let listeDeTaches = loadFromStorage();

function supprimerTaches(nomDeLaTache) {
    listeDeTaches = listeDeTaches.filter(tache => tache !== nomDeLaTache);
}
supprimerTaches("courses");
console.log(listeDeTaches);


function modifierTache(id, nouveauTitre, nouvelleDescription, nouveauStatut) {

    const tache = listeDeTaches.find(tache)

    if (tache) {
        tache.nuouveauTitre
        tache.nouvelleDescription
        tache.nouveauStatut
    }

}

console.log


taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(taskForm);
    const newPin = {
        id: crypto.randomUUID(),
        titre: (formData.get('titre') || '').trim(),
        description: (formData.get('description') || '').trim(),
        statut: formData.get('statut'),
        couleur: formData.get('couleur'),
        createdAt: new Date().toISOString()
    };

    console.log(newPin);

    pins.push(newPin);
    saveToStorage(pins);
    afficherTaches();
    taskForm.reset();
});

afficherTaches();