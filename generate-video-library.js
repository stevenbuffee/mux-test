require('dotenv').config();
const Mux = require('@mux/mux-node');
const fs = require('fs');

function formatDuration(seconds) {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getCategoryColor(category) {
    const colors = [
        '#e9d5ff', '#bfdbfe', '#bbf7d0', '#fed7aa', 
        '#fecaca', '#e9d5ff', '#ddd6fe', '#c7d2fe'
    ];
    const index = Math.abs(category.split('').reduce((acc, char) => 
        acc + char.charCodeAt(0), 0)) % colors.length;
    return colors[index];
}

const muxClient = new Mux.default({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET
});

async function generateVideoLibrary() {
    try {
        console.log('Fetching videos from Mux...');
        const assets = await muxClient.get('/video/v1/assets');
        
        const videosByCategory = {};
        
        assets.data.forEach(asset => {
            let metadata = {};
            try {
                console.log('Asset:', asset.id, 'Passthrough:', asset.passthrough);
                metadata = JSON.parse(asset.passthrough || '{}');
            } catch (e) {
                console.log('Error parsing passthrough for asset', asset.id, e);
                metadata = {};
            }

            const category = metadata.category || 'Uncategorized';
            const title = metadata.title || `Video ${asset.id}`;

            if (!videosByCategory[category]) {
                videosByCategory[category] = [];
            }

            if (asset.status === 'ready' && asset.playback_ids?.[0]?.id) {
                videosByCategory[category].push({
                    id: asset.id,
                    playbackId: asset.playback_ids[0].id,
                    title: title,
                    category: category,
                    duration: asset.duration,
                    createdAt: new Date(asset.created_at).getTime()
                });
            }
        });

        console.log('Categories found:', Object.keys(videosByCategory));
        const markdownContent = generateMarkdown(videosByCategory);
        fs.writeFileSync('index.md', markdownContent);
        console.log('Video library generated successfully!');
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

function generateMarkdown(videosByCategory) {
    const lines = [
        '---',
        'perma_id: yEUm',
        '---',
        '# Video Library',
        '',
        '<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player"></script>',
        '',
        // Add Queue Sidebar
        '<div class="queue-sidebar" id="queueSidebar">',
        '    <h3>Queue</h3>',
        '    <div class="queue-list" id="queueList"></div>',
        '    <button onclick="document.getElementById(\'queueSidebar\').classList.remove(\'open\')" class="close-queue">Close</button>',
        '</div>',
        '',
        '<style>',
        ':root {',
        '    --video-card-background: #ffffff;',
        '    --video-card-border: #e5e7eb;',
        '    --text-primary: #1a1a1a;',
        '    --text-secondary: #666666;',
        '    --accent-color: #4a5568;',
        '}',
        '.controls {',
        '    margin: 2rem 0;',
        '    display: flex;',
        '    gap: 1rem;',
        '    flex-wrap: wrap;',
        '    align-items: center;',
        '}',
        '.search-box {',
        '    padding: 0.5rem;',
        '    border: 1px solid var(--video-card-border);',
        '    border-radius: 0.5rem;',
        '    min-width: 250px;',
        '}',
        '.sort-select {',
        '    padding: 0.5rem;',
        '    border: 1px solid var(--video-card-border);',
        '    border-radius: 0.5rem;',
        '    background: var(--video-card-background);',
        '}',
        '.filter-button {',
        '    padding: 0.5rem 1rem;',
        '    border: 1px solid var(--video-card-border);',
        '    border-radius: 0.5rem;',
        '    cursor: pointer;',
        '    transition: opacity 0.2s;',
        '}',
        '.filter-button:not(.active) {',
        '    opacity: 0.7;',
        '}',
        '.filter-button.active {',
        '    opacity: 1;',
        '    border: 2px solid var(--accent-color);',
        '}',
        '.queue-sidebar {',
        '    position: fixed;',
        '    right: -300px;',
        '    top: 0;',
        '    width: 300px;',
        '    height: 100%;',
        '    background: var(--video-card-background);',
        '    border-left: 1px solid var(--video-card-border);',
        '    transition: right 0.3s ease;',
        '    padding: 1rem;',
        '    z-index: 1000;',
        '}',
        '.queue-sidebar.open {',
        '    right: 0;',
        '}',
        '.close-queue {',
        '    position: absolute;',
        '    top: 1rem;',
        '    right: 1rem;',
        '    padding: 0.5rem;',
        '    cursor: pointer;',
        '}',
        '.queue-item {',
        '    padding: 0.5rem;',
        '    border-bottom: 1px solid var(--video-card-border);',
        '    display: flex;',
        '    justify-content: space-between;',
        '    align-items: center;',
        '}',
        '.video-grid {',
        '    display: grid;',
        '    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));',
        '    gap: 2rem;',
        '    padding: 1rem;',
        '    transition: all 0.3s ease;',
        '}',
        '.video-grid.size-small {',
        '    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));',
        '}',
        '.video-grid.size-medium {',
        '    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));',
        '}',
        '.video-grid.size-large {',
        '    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));',
        '}',
        '.video-card {',
        '    border: 1px solid var(--video-card-border);',
        '    border-radius: 0.5rem;',
        '    overflow: hidden;',
        '    background: var(--video-card-background);',
        '}',
        '.video-info {',
        '    padding: 1rem;',
        '}',
        '.video-title {',
        '    font-size: 1.1rem;',
        '    font-weight: 600;',
        '    margin-bottom: 0.5rem;',
        '    color: var(--text-primary);',
        '}',
        '.video-actions {',
        '    display: flex;',
        '    gap: 0.5rem;',
        '    margin-top: 0.5rem;',
        '}',
        '.video-actions button {',
        '    padding: 0.25rem 0.5rem;',
        '    border: 1px solid var(--video-card-border);',
        '    border-radius: 0.25rem;',
        '    background: var(--video-card-background);',
        '    cursor: pointer;',
        '}',
        '.grid-controls {',
        '    display: flex;',
        '    gap: 0.5rem;',
        '}',
        '.grid-controls button {',
        '    padding: 0.5rem 1rem;',
        '    border: 1px solid var(--video-card-border);',
        '    border-radius: 0.5rem;',
        '    cursor: pointer;',
        '}',
        '</style>',
        '',
        '<div class="controls">',
        '    <input type="text" class="search-box" placeholder="Search videos..." onkeyup="searchVideos(this.value)">',
        '    <div class="grid-controls">',
        '        <button onclick="setGridSize(\'small\')">Small</button>',
        '        <button onclick="setGridSize(\'medium\')">Medium</button>',
        '        <button onclick="setGridSize(\'large\')">Large</button>',
        '    </div>',
        '    <select class="sort-select" onchange="sortVideos(this.value)">',
        '        <option value="newest">Newest First</option>',
        '        <option value="oldest">Oldest First</option>',
        '        <option value="title">Alphabetical</option>',
        '    </select>',
        '    <div class="filter-buttons">',
        '        <button class="filter-button active" onclick="filterVideos(\'all\')">All</button>'
    ];

    Object.keys(videosByCategory).forEach(category => {
        const categoryColor = getCategoryColor(category);
        lines.push(`        <button class="filter-button" onclick="filterVideos('${category}')" style="background-color: ${categoryColor}">${category}</button>`);
    });

    lines.push('    </div>', '</div>', '', '<div class="video-grid">');

    Object.entries(videosByCategory).forEach(([category, videos]) => {
        videos.forEach(video => {
            const categoryColor = getCategoryColor(category);
            lines.push(`
    <div class="video-card" 
         data-category="${category}" 
         data-created="${video.createdAt}" 
         data-title="${video.title}">
        <mux-player
            stream-type="on-demand"
            playback-id="${video.playbackId}"
            metadata-video-title="${video.title}"
            controls>
        </mux-player>
        <div class="video-info">
            <div class="video-title">${video.title}</div>
            <div class="video-actions">
                <button onclick="addToQueue('${video.playbackId}', '${video.title}')">Add to Queue</button>
                <button onclick="shareVideo('${video.playbackId}', '${video.title}')">Share</button>
            </div>
            <div class="video-meta">
                <span class="category-tag" style="background-color: ${categoryColor}">
                    ${category}
                </span>
                <div class="video-duration">${formatDuration(video.duration)}</div>
            </div>
        </div>
    </div>`);
        });
    });

    lines.push('</div>');

    lines.push(`
<script>
const videoQueue = [];

function addToQueue(playbackId, title) {
    videoQueue.push({ playbackId, title });
    updateQueueDisplay();
    document.getElementById('queueSidebar').classList.add('open');
}

function removeFromQueue(index) {
    videoQueue.splice(index, 1);
    updateQueueDisplay();
}

function updateQueueDisplay() {
    const queueList = document.getElementById('queueList');
    queueList.innerHTML = videoQueue.map((video, index) => \`
        <div class="queue-item">
            <span>\${video.title}</span>
            <button onclick="removeFromQueue(\${index})">Remove</button>
        </div>
    \`).join('');
}

function setGridSize(size) {
    const grid = document.querySelector('.video-grid');
    grid.classList.remove('size-small', 'size-medium', 'size-large');
    grid.classList.add(\`size-\${size}\`);
    localStorage.setItem('gridSize', size);
}

function shareVideo(playbackId, title) {
    const url = \`\${window.location.origin}\${window.location.pathname}?video=\${playbackId}\`;
    if (navigator.share) {
        navigator.share({
            title: title,
            text: \`Check out this video: \${title}\`,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url)
            .then(() => alert('Link copied to clipboard!'));
    }
}

function searchVideos(query) {
    query = query.toLowerCase();
    document.querySelectorAll('.video-card').forEach(card => {
        const title = card.querySelector('.video-title').textContent.toLowerCase();
        const category = card.dataset.category.toLowerCase();
        if (title.includes(query) || category.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterVideos(category) {
    document.querySelectorAll('.filter-button').forEach(button => {
        button.classList.toggle('active', 
            button.textContent.toLowerCase() === category.toLowerCase());
    });

    document.querySelectorAll('.video-card').forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function sortVideos(criteria) {
    const grid = document.querySelector('.video-grid');
    const cards = Array.from(document.querySelectorAll('.video-card'));
    
    cards.sort((a, b) => {
        switch(criteria) {
            case 'newest':
                return Number(b.dataset.created) - Number(a.dataset.created);
            case 'oldest':
                return Number(a.dataset.created) - Number(b.dataset.created);
            case 'title':
                return a.dataset.title.localeCompare(b.dataset.title);
            default:
                return 0;
        }
    });
    
    const temp = document.createDocumentFragment();
    cards.forEach(card => {
        if (card.style.display !== 'none') {
            temp.appendChild(card);
        }
    });
    grid.appendChild(temp);
}

// Initialize grid size from localStorage
const savedSize = localStorage.getItem('gridSize');
if (savedSize) {
    setGridSize(savedSize);
}
</script>`);

    return lines.join('\n');
}

generateVideoLibrary().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
