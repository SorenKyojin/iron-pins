class PinManager {
  constructor(storageKey = 'mes_pins') {
    this.storageKey = storageKey;
    // Charge les pins existants au démarrage, ou initialise un pin vide
    this.Pins = this.loadFromStorage();
  }

  // Récupère et parse les données du localStorage
  loadFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  // Sauvegarde l'état actuel dans le localStorage
  saveToStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.Pins));
  }

  // Crée un nouveau pin
  createPin({ title, description = '', status = 'actif', color = '#3b82f6' }) {
    if (!title || title.trim() === '') {
      throw new Error('Le titre est obligatoire pour créer un pin.');
    }

    const newPin = {
      id: crypto.randomUUID(), // Génère un identifiant unique natif
      title: title.trim(),
      description: description.trim(),
      status: status, // ex: 'actif', 'archivé', 'en pause'
      color: color,   // ex: code hexadécimal '#ff5733'
      createdAt: new Date().toISOString() // Format standard facile à formater plus tard
    };

    this.Pins.push(newPin);
    this.saveToStorage();
    return newPin;
  }

  // Récupère tous les pins (avec option de filtre par statut)
  getPins(statusFilter = null) {
    if (statusFilter) {
      return this.Pins.filter(Pin => Pin.status === statusFilter);
    }
    return this.Pins;
  }

  // Récupère un pin précis par son ID
  getPinById(id) {
    return this.Pins.find(Pin => Pin.id === id);
  }

  // Met à jour un pin existant
  updatePin(id, updates) {
    const index = this.Pins.findIndex(Pin => Pin.id === id);
    if (index === -1) return null;

    // On empêche la modification de l'ID et de la date de création
    const { id: _, createdAt: __, ...allowedUpdates } = updates;

    this.Pins[index] = { ...this.Pins[index], ...allowedUpdates };
    this.saveToStorage();
    return this.Pins[index];
  }

  // Supprime un pin
  deletePin(id) {
    const initialLength = this.Pins.length;
    this.Pins = this.Pins.filter(Pin => Pin.id !== id);
    
    if (this.Pins.length !== initialLength) {
      this.saveToStorage();
      return true;
    }
    return false;
  }
}