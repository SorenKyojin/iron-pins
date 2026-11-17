const taskForm = document.getElementById('new-pin');
const form = document.getElementById('formulaire');
const liste = document.querySelector("liste-taches");
const taches = document..querySelector("tache")

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nom = document.querySelector("#nom").value;
    console.log(nom);
});


const formData = new FormData(taskForm);
const tache = {
    titre: formData.get('titre').trim(),
    description: formData.get('description').trim(),
    propositions: formData.get('propositions')
};

function afficherTaches() {
    liste.innerHTML = "";

    taches.forEach((tache) => {
        const tache = document.createElement("new-pin");
        tache.classList.add("new-pin");

        const titre = document.createElement("titre");
        titre.textContent = tache.titre;

        const description = document.createElement("description");
        description.textContent = tache.description;

        carte.append(titre, description);
        liste.append(tache);
    });




    loadFromStorage() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }


    const newPin = {
        id: crypto.randomUUID(),
        titre: titre.trim(),
        description: decription.trim(),
        statut: statut,
        createdAt: new Date().toISOString(),
        couleur: color,
    };