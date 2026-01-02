# InfographLM - Infographic Creation Tool

A web application for creating beautiful infographics from various content sources including YouTube videos, web pages, and plain text.

## Features

- 📝 **Multiple Input Sources**
  - Plain text input
  - YouTube video transcripts (with automatic extraction)
  - Web page content (with automatic extraction)

- 🎨 **Infographic Generation**
  - Automatically generates visually appealing infographics
  - Extracts key insights from content
  - Professional gradient backgrounds and card-based layouts
  - Numbered insight cards for easy reading

- 💾 **Notebook System**
  - Create and manage multiple notebooks using IndexedDB
  - Persistent storage in browser (no backend required)
  - Add multiple content sources to each notebook
  - Save generated infographics with notebooks

- ⬇️ **Download Support**
  - Download infographics as PNG images
  - High-quality output suitable for presentations and sharing

## Getting Started

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/paulbryan/inforgraphLM-copilot.git
   cd inforgraphLM-copilot
   ```

2. Serve the files using any HTTP server. For example:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   ```

3. Open your browser and navigate to `http://localhost:8000`

### Usage

1. **Create a Notebook**: Click "New Notebook" on the landing page
2. **Add Content Sources**: 
   - Switch between Text, YouTube, and URL tabs
   - Enter your content or links
   - Click the corresponding "Add" button
3. **Generate Infographic**: Once you have at least one source, click "Generate Infographic"
4. **Download**: Click "Download Infographic" to save as PNG
5. **Manage Notebooks**: Return to the landing page to see all your notebooks

## Technology Stack

- **HTML5**: Structure and markup
- **CSS3**: Styling with modern design principles
- **Vanilla JavaScript**: Application logic (no frameworks required)
- **IndexedDB**: Browser-based persistent storage
- **Canvas API**: Infographic rendering

## Browser Compatibility

Works on all modern browsers that support:
- IndexedDB
- Canvas API
- ES6+ JavaScript

## Notes

- The YouTube transcript and URL content fetching currently use mock data. In a production environment, these would require backend services or API integrations.
- All data is stored locally in your browser using IndexedDB
- No data is sent to external servers

## Future Enhancements

- Real YouTube transcript fetching via API
- Real web scraping for URL content
- More infographic templates and styles
- Export to multiple formats (PDF, SVG)
- Sharing capabilities
- AI-powered content summarization

## License

MIT