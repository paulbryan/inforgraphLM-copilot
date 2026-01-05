// Main Application
class InfographApp {
    constructor() {
        this.currentNotebookId = null;
        this.currentNotebook = null;
    }

    async init() {
        try {
            // Initialize database
            await notebookDB.init();
            console.log('Database initialized');

            // Set up event listeners
            this.setupEventListeners();

            // Load landing page
            this.showLandingPage();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            alert('Failed to initialize application. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Landing page
        document.getElementById('new-notebook-btn').addEventListener('click', () => {
            this.createNotebook();
        });

        // Notebook page
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showLandingPage();
        });

        document.getElementById('delete-notebook-btn').addEventListener('click', () => {
            this.deleteCurrentNotebook();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add source buttons
        document.getElementById('add-text-btn').addEventListener('click', () => {
            this.addTextSource();
        });

        document.getElementById('add-youtube-btn').addEventListener('click', () => {
            this.addYoutubeSource();
        });

        document.getElementById('add-url-btn').addEventListener('click', () => {
            this.addUrlSource();
        });

        // Generate and download
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateInfographic();
        });

        document.getElementById('download-btn').addEventListener('click', () => {
            this.downloadInfographic();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    async showLandingPage() {
        // Hide notebook page, show landing page
        document.getElementById('landing-page').classList.add('active');
        document.getElementById('notebook-page').classList.remove('active');

        this.currentNotebookId = null;
        this.currentNotebook = null;

        // Load and display notebooks
        await this.loadNotebooks();
    }

    async loadNotebooks() {
        try {
            const notebooks = await notebookDB.getAllNotebooks();
            const grid = document.getElementById('notebooks-grid');
            const emptyState = document.getElementById('empty-state');

            grid.innerHTML = '';

            if (notebooks.length === 0) {
                emptyState.classList.add('active');
                grid.style.display = 'none';
            } else {
                emptyState.classList.remove('active');
                grid.style.display = 'grid';

                notebooks.sort((a, b) => new Date(b.updated) - new Date(a.updated));

                notebooks.forEach(notebook => {
                    const card = this.createNotebookCard(notebook);
                    grid.appendChild(card);
                });
            }
        } catch (error) {
            console.error('Failed to load notebooks:', error);
            alert('Failed to load notebooks');
        }
    }

    createNotebookCard(notebook) {
        const card = document.createElement('div');
        card.className = 'notebook-card';
        card.onclick = () => this.openNotebook(notebook.id);

        const sourcesCount = notebook.sources?.length || 0;
        const hasInfographic = notebook.infographic ? 'Yes' : 'No';

        card.innerHTML = `
            <h3>${this.escapeHtml(notebook.name)}</h3>
            <div class="notebook-meta">
                <span>📝 ${sourcesCount} source${sourcesCount !== 1 ? 's' : ''}</span>
                <span>✨ Infographic: ${hasInfographic}</span>
                <span>🕒 ${new Date(notebook.updated).toLocaleString()}</span>
            </div>
        `;

        return card;
    }

    async createNotebook() {
        const name = prompt('Enter notebook name:', `Notebook ${new Date().toLocaleDateString()}`);
        if (!name) return;

        try {
            const notebook = await notebookDB.createNotebook(name);
            await this.openNotebook(notebook.id);
        } catch (error) {
            console.error('Failed to create notebook:', error);
            alert('Failed to create notebook');
        }
    }

    async openNotebook(id) {
        try {
            const notebook = await notebookDB.getNotebook(id);
            if (!notebook) {
                alert('Notebook not found');
                return;
            }

            this.currentNotebookId = id;
            this.currentNotebook = notebook;

            // Update UI
            document.getElementById('notebook-title').textContent = notebook.name;
            document.getElementById('landing-page').classList.remove('active');
            document.getElementById('notebook-page').classList.add('active');

            // Render sources
            this.renderSources();

            // Check if infographic exists
            if (notebook.infographic) {
                this.displayInfographic(notebook.infographic.data);
            } else {
                document.getElementById('infographic-section').style.display = 'none';
            }

            // Enable/disable generate button
            this.updateGenerateButton();
        } catch (error) {
            console.error('Failed to open notebook:', error);
            alert('Failed to open notebook');
        }
    }

    async deleteCurrentNotebook() {
        if (!this.currentNotebookId) return;

        if (!confirm('Are you sure you want to delete this notebook? This cannot be undone.')) {
            return;
        }

        try {
            await notebookDB.deleteNotebook(this.currentNotebookId);
            this.showLandingPage();
        } catch (error) {
            console.error('Failed to delete notebook:', error);
            alert('Failed to delete notebook');
        }
    }

    renderSources() {
        const sourcesList = document.getElementById('sources-list');
        const sourcesEmpty = document.getElementById('sources-empty');

        sourcesList.innerHTML = '';

        const sources = this.currentNotebook.sources || [];

        if (sources.length === 0) {
            sourcesEmpty.style.display = 'block';
            sourcesList.style.display = 'none';
        } else {
            sourcesEmpty.style.display = 'none';
            sourcesList.style.display = 'flex';

            sources.forEach(source => {
                const item = this.createSourceItem(source);
                sourcesList.appendChild(item);
            });
        }
    }

    createSourceItem(source) {
        const item = document.createElement('div');
        item.className = 'source-item';

        const typeLabels = {
            text: 'Text',
            youtube: 'YouTube',
            url: 'URL'
        };

        const displayContent = source.content.length > 150 
            ? source.content.substring(0, 150) + '...' 
            : source.content;

        item.innerHTML = `
            <div class="source-content">
                <span class="source-type">${typeLabels[source.type]}</span>
                <div class="source-text">${this.escapeHtml(displayContent)}</div>
            </div>
            <div class="source-actions">
                <button class="btn btn-danger btn-small" onclick="app.removeSource(${source.id})">
                    Remove
                </button>
            </div>
        `;

        return item;
    }

    updateGenerateButton() {
        const generateBtn = document.getElementById('generate-btn');
        const hasContent = this.currentNotebook.sources && this.currentNotebook.sources.length > 0;
        generateBtn.disabled = !hasContent;
    }

    async addTextSource() {
        const input = document.getElementById('text-input');
        const text = input.value.trim();

        if (!text) {
            alert('Please enter some text');
            return;
        }

        try {
            await notebookDB.addSource(this.currentNotebookId, {
                type: 'text',
                content: text
            });

            // Reload notebook
            await this.reloadCurrentNotebook();
            input.value = '';
        } catch (error) {
            console.error('Failed to add text source:', error);
            alert('Failed to add text source');
        }
    }

    async addYoutubeSource() {
        const input = document.getElementById('youtube-input');
        const url = input.value.trim();

        if (!url) {
            alert('Please enter a YouTube URL');
            return;
        }

        // Extract video ID
        const videoId = this.extractYoutubeId(url);
        if (!videoId) {
            alert('Invalid YouTube URL');
            return;
        }

        try {
            // Show loading
            const btn = document.getElementById('add-youtube-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Loading transcript...';
            btn.disabled = true;

            // Fetch transcript (mock for now)
            const transcript = await this.fetchYoutubeTranscript(videoId);

            await notebookDB.addSource(this.currentNotebookId, {
                type: 'youtube',
                content: transcript,
                metadata: { videoId, url }
            });

            // Reload notebook
            await this.reloadCurrentNotebook();
            input.value = '';

            btn.textContent = originalText;
            btn.disabled = false;
        } catch (error) {
            console.error('Failed to add YouTube source:', error);
            alert('Failed to fetch YouTube transcript: ' + error.message);
            document.getElementById('add-youtube-btn').disabled = false;
        }
    }

    async addUrlSource() {
        const input = document.getElementById('url-input');
        const url = input.value.trim();

        if (!url) {
            alert('Please enter a URL');
            return;
        }

        if (!this.isValidUrl(url)) {
            alert('Invalid URL');
            return;
        }

        try {
            // Show loading
            const btn = document.getElementById('add-url-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Fetching content...';
            btn.disabled = true;

            // Fetch content (mock for now)
            const content = await this.fetchUrlContent(url);

            await notebookDB.addSource(this.currentNotebookId, {
                type: 'url',
                content: content,
                metadata: { url }
            });

            // Reload notebook
            await this.reloadCurrentNotebook();
            input.value = '';

            btn.textContent = originalText;
            btn.disabled = false;
        } catch (error) {
            console.error('Failed to add URL source:', error);
            alert('Failed to fetch URL content: ' + error.message);
            document.getElementById('add-url-btn').disabled = false;
        }
    }

    async removeSource(sourceId) {
        if (!confirm('Remove this source?')) {
            return;
        }

        try {
            await notebookDB.removeSource(this.currentNotebookId, sourceId);
            await this.reloadCurrentNotebook();
        } catch (error) {
            console.error('Failed to remove source:', error);
            alert('Failed to remove source');
        }
    }

    async reloadCurrentNotebook() {
        const notebook = await notebookDB.getNotebook(this.currentNotebookId);
        this.currentNotebook = notebook;
        this.renderSources();
        this.updateGenerateButton();
    }

    extractYoutubeId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
            /^([a-zA-Z0-9_-]{11})$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    async fetchYoutubeTranscript(videoId) {
        // Mock transcript fetching
        // In a real implementation, this would use YouTube API or a proxy service
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`[Mock Transcript for video ${videoId}]\n\n` +
                    `This is a simulated transcript from the YouTube video. ` +
                    `In a production environment, this would use the YouTube Data API ` +
                    `or a third-party service to fetch the actual video transcript. ` +
                    `The transcript would contain the spoken content from the video, ` +
                    `which can then be used to generate an infographic with key points.`);
            }, 1500);
        });
    }

    async fetchUrlContent(url) {
        // Mock URL content fetching
        // In a real implementation, this would use a CORS proxy or backend service
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`[Mock Content from ${url}]\n\n` +
                    `This is simulated content extracted from the webpage. ` +
                    `In a production environment, this would use a backend service ` +
                    `to fetch and parse the HTML content, extracting the main text ` +
                    `while removing scripts, styles, and navigation elements. ` +
                    `The extracted content can then be used for infographic generation.`);
            }, 1500);
        });
    }

    async generateInfographic() {
        if (!this.currentNotebook.sources || this.currentNotebook.sources.length === 0) {
            alert('Add at least one source to generate an infographic');
            return;
        }

        try {
            // Show loading
            const btn = document.getElementById('generate-btn');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<span class="spinner"></span> Generating...';
            btn.disabled = true;

            // Combine all sources
            const allContent = this.currentNotebook.sources
                .map(s => s.content)
                .join('\n\n');

            // Generate infographic
            const infographicData = await this.createInfographic(allContent);

            // Save to database
            await notebookDB.saveInfographic(this.currentNotebookId, infographicData);

            // Display infographic
            this.displayInfographic(infographicData);

            btn.innerHTML = originalHtml;
            btn.disabled = false;
        } catch (error) {
            console.error('Failed to generate infographic:', error);
            alert('Failed to generate infographic: ' + error.message);
            document.getElementById('generate-btn').disabled = false;
        }
    }

    async createInfographic(content) {
        // Create a fancy infographic on canvas
        return new Promise((resolve) => {
            setTimeout(() => {
                const canvas = document.createElement('canvas');
                canvas.width = 800;
                canvas.height = 1000;
                const ctx = canvas.getContext('2d');

                // Background gradient
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#6366f1');
                gradient.addColorStop(1, '#8b5cf6');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Title section
                ctx.fillStyle = 'white';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Key Insights', canvas.width / 2, 80);

                // Extract key points (simple implementation)
                const sentences = content
                    .split(/[.!?]+/)
                    .map(s => s.trim())
                    .filter(s => s.length > 20 && s.length < 150)
                    .slice(0, 5);

                // Draw key points as cards
                let y = 150;
                sentences.forEach((sentence, index) => {
                    // Card background
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetY = 5;
                    const cardHeight = 140;
                    ctx.fillRect(50, y, canvas.width - 100, cardHeight);
                    ctx.shadowBlur = 0;

                    // Number badge
                    ctx.fillStyle = '#6366f1';
                    ctx.beginPath();
                    ctx.arc(90, y + 40, 25, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText((index + 1).toString(), 90, y + 48);

                    // Text
                    ctx.fillStyle = '#1e293b';
                    ctx.font = '18px Arial';
                    ctx.textAlign = 'left';
                    const words = sentence.split(' ');
                    let line = '';
                    let lineY = y + 40;
                    const maxWidth = canvas.width - 180;

                    for (let word of words) {
                        const testLine = line + word + ' ';
                        const metrics = ctx.measureText(testLine);
                        if (metrics.width > maxWidth && line !== '') {
                            ctx.fillText(line, 130, lineY);
                            line = word + ' ';
                            lineY += 25;
                            if (lineY > y + 110) break; // Limit lines
                        } else {
                            line = testLine;
                        }
                    }
                    ctx.fillText(line, 130, lineY);

                    y += cardHeight + 20;
                });

                // Footer
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Generated by InfographLM', canvas.width / 2, canvas.height - 30);
                ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, canvas.height - 10);

                resolve(canvas.toDataURL('image/png'));
            }, 2000);
        });
    }

    displayInfographic(imageData) {
        const section = document.getElementById('infographic-section');
        const display = document.getElementById('infographic-display');

        section.style.display = 'block';
        display.innerHTML = `<img id="infographic-canvas" src="${imageData}" alt="Generated Infographic">`;

        // Scroll to infographic
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    downloadInfographic() {
        if (!this.currentNotebook.infographic) {
            alert('No infographic to download');
            return;
        }

        const link = document.createElement('a');
        link.download = `infographic-${this.currentNotebook.name}-${Date.now()}.png`;
        link.href = this.currentNotebook.infographic.data;
        link.click();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
const app = new InfographApp();
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});
