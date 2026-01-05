// IndexedDB Database Manager
class NotebookDB {
    constructor() {
        this.dbName = 'InfographLM';
        this.version = 1;
        this.db = null;
    }

    // Initialize the database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create notebooks object store
                if (!db.objectStoreNames.contains('notebooks')) {
                    const notebookStore = db.createObjectStore('notebooks', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    notebookStore.createIndex('created', 'created', { unique: false });
                    notebookStore.createIndex('updated', 'updated', { unique: false });
                }
            };
        });
    }

    // Create a new notebook
    async createNotebook(name) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notebooks'], 'readwrite');
            const store = transaction.objectStore('notebooks');
            
            const notebook = {
                name: name || `Notebook ${new Date().toLocaleDateString()}`,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                sources: [],
                infographic: null
            };

            const request = store.add(notebook);

            request.onsuccess = () => {
                notebook.id = request.result;
                resolve(notebook);
            };

            request.onerror = () => {
                reject(new Error('Failed to create notebook'));
            };
        });
    }

    // Get all notebooks
    async getAllNotebooks() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notebooks'], 'readonly');
            const store = transaction.objectStore('notebooks');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('Failed to get notebooks'));
            };
        });
    }

    // Get a single notebook by ID
    async getNotebook(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notebooks'], 'readonly');
            const store = transaction.objectStore('notebooks');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('Failed to get notebook'));
            };
        });
    }

    // Update a notebook
    async updateNotebook(notebook) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notebooks'], 'readwrite');
            const store = transaction.objectStore('notebooks');
            
            notebook.updated = new Date().toISOString();
            const request = store.put(notebook);

            request.onsuccess = () => {
                resolve(notebook);
            };

            request.onerror = () => {
                reject(new Error('Failed to update notebook'));
            };
        });
    }

    // Delete a notebook
    async deleteNotebook(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notebooks'], 'readwrite');
            const store = transaction.objectStore('notebooks');
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error('Failed to delete notebook'));
            };
        });
    }

    // Add a source to a notebook
    async addSource(notebookId, source) {
        const notebook = await this.getNotebook(notebookId);
        if (!notebook) {
            throw new Error('Notebook not found');
        }

        notebook.sources.push({
            id: Date.now(),
            type: source.type,
            content: source.content,
            metadata: source.metadata || {},
            added: new Date().toISOString()
        });

        return await this.updateNotebook(notebook);
    }

    // Remove a source from a notebook
    async removeSource(notebookId, sourceId) {
        const notebook = await this.getNotebook(notebookId);
        if (!notebook) {
            throw new Error('Notebook not found');
        }

        notebook.sources = notebook.sources.filter(s => s.id !== sourceId);
        return await this.updateNotebook(notebook);
    }

    // Save infographic to notebook
    async saveInfographic(notebookId, infographicData) {
        const notebook = await this.getNotebook(notebookId);
        if (!notebook) {
            throw new Error('Notebook not found');
        }

        notebook.infographic = {
            data: infographicData,
            generated: new Date().toISOString()
        };

        return await this.updateNotebook(notebook);
    }
}

// Create global instance
const notebookDB = new NotebookDB();
