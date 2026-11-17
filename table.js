const tache = {
    id: 12547,
    titre: "Gestionnaire de tâches",
    description: "Pour visualiser ce que vous devez faire",
    statut: "à faire",
    createdAt: 2026,
    couleur: "bleu",
};


const form = document.getElementById('formulaire');

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nom = document.querySelector("#nom").value;
    console.log(nom);
});

