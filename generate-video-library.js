require('dotenv').config();
const Mux = require('@mux/mux-node');
const fs = require('fs');

const muxClient = new Mux.default({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET
});

async function generateVideoLibrary() {
    try {
        console.log('Fetching videos from Mux...');
        const assets = await muxClient.get('/video/v1/assets');
        
        // Group videos by category
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
                    category: category
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
        '}',
        '.search-box {',
        '    padding: 0.5rem;',
        '    border: 1px solid var(--video-card-border);',
        '    border-radius: 0.5rem;',
        '    min-width: 250px;',
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
        '.filter-button {',
        '    padding: 0.5rem 1rem;',
        '    border: 1px solid var(--video-card-border);',
        '    border-radius: 0.5rem;',
        '    background: var(--video-card-background);',
        '    cursor: pointer;',
        '}',
        '.filter-button.active {',
        '    background: var(--accent-color);',
        '    color: white;',
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
        '    <div class="filter-buttons">',
        '        <button class="filter-button active" onclick="filterVideos(\'all\')">All</button>'
    ];

    // Add category filter buttons
    Object.keys(videosByCategory).forEach(category => {
        lines.push(`        <button class="filter-button" onclick="filterVideos('${category}')">${category}</button>`);
    });

    lines.push('    </div>', '</div>', '', '<div class="video-grid">');

    // Add videos
    Object.entries(videosByCategory).forEach(([category, videos]) => {
        videos.forEach(video => {
            lines.push(`
    <div class="video-card" data-category="${category}">
        <mux-player
            stream-type="vod"
            playback-id="${video.playbackId}"
            metadata-video-title="${video.title}"
            controls>
        </mux-player>
        <div class="video-info">
            <div class="video-title">${video.title}</div>
            <div class="video-meta">Category: ${category}</div>
        </div>
    </div>`);
        });
    });

    lines.push('</div>');

    // Add JavaScript functions
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
    // Update active button
    document.querySelectorAll('.filter-button').forEach(button => {
        button.classList.toggle('active', 
            button.textContent.toLowerCase() === category.toLowerCase());
    });

    // Filter videos
    document.querySelectorAll('.video-card').forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
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
