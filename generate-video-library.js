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
        '.video-grid {',
        '    display: grid;',
        '    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));',
        '    gap: 2rem;',
        '    padding: 1rem;',
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
        '.video-meta {',
        '    font-size: 0.9rem;',
        '    color: var(--text-secondary);',
        '}',
        '.category-tag {',
        '    display: inline-block;',
        '    padding: 0.25rem 0.5rem;',
        '    border-radius: 1rem;',
        '    font-size: 0.8rem;',
        '    margin-top: 0.5rem;',
        '}',
        '@media (max-width: 768px) {',
        '    .controls {',
        '        flex-direction: column;',
        '    }',
        '    .search-box {',
        '        width: 100%;',
        '    }',
        '}',
        '</style>',
        '',
        '<div class="controls">',
        '    <input type="text" class="search-box" placeholder="Search videos..." onkeyup="searchVideos(this.value)">',
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
    
    // Remove all cards (but don't destroy them)
    cards.forEach(card => card.remove());
    
    // Re-add the sorted cards
    cards.forEach(card => {
        if (card.style.display !== 'none') {
            grid.appendChild(card);
        }
    });
}
</script>`);

    return lines.join('\n');
}

generateVideoLibrary().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
