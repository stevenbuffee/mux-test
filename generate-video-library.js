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
        
        // Group videos by category from existing passthrough data
        const videosByCategory = {};
        
        assets.data.forEach(asset => {
            let metadata = {};
            try {
                // Log the raw passthrough data for debugging
                console.log('Raw passthrough:', asset.passthrough);
                metadata = JSON.parse(asset.passthrough || '{}');
                console.log('Parsed metadata:', metadata);
            } catch (e) {
                console.log('Error parsing passthrough for asset', asset.id, e);
                metadata = {};
            }

            // Use category from metadata or 'Uncategorized'
            const category = metadata.category || 'Uncategorized';
            const title = metadata.title || `Video ${asset.id}`;
            const description = metadata.description || '';

            // Initialize category array if it doesn't exist
            if (!videosByCategory[category]) {
                videosByCategory[category] = [];
            }
            
            // Only add videos that are ready and have a playback ID
            if (asset.status === 'ready' && asset.playback_ids?.[0]?.id) {
                videosByCategory[category].push({
                    id: asset.id,
                    playbackId: asset.playback_ids[0].id,
                    title: title,
                    description: description,
                    category: category
                });
            }
        });

        // Remove empty categories
        Object.keys(videosByCategory).forEach(category => {
            if (videosByCategory[category].length === 0) {
                delete videosByCategory[category];
            }
        });

        console.log('Categories found:', Object.keys(videosByCategory));
        console.log('Videos by category:', videosByCategory);

        const markdownContent = generateMarkdown(videosByCategory);
        fs.writeFileSync('index.md', markdownContent);
        console.log('Video library generated successfully!');
    } catch (error) {
        console.error('Error generating video library:', error);
        throw error;
    }
}

function generateMarkdown(videosByCategory) {
    const lines = [
        '---',
        'perma_id: yEUm',
        '---',
        '# Mux Video Library',
        '',
        '<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player"></script>',
        '',
        '<style>',
        '.video-grid {',
        '  display: grid;',
        '  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));',
        '  gap: 1rem;',
        '  padding: 1rem;',
        '}',
        '',
        '.video-card {',
        '  border: 1px solid #e5e7eb;',
        '  border-radius: 0.5rem;',
        '  overflow: hidden;',
        '}',
        '',
        '.video-info {',
        '  padding: 1rem;',
        '}',
        '',
        '.video-title {',
        '  font-size: 1.1rem;',
        '  font-weight: 600;',
        '  margin-bottom: 0.5rem;',
        '}',
        '',
        '.video-description {',
        '  font-size: 0.9rem;',
        '  color: #666;',
        '  margin-bottom: 0.5rem;',
        '}',
        '',
        '.category-section {',
        '  margin: 2rem 0;',
        '}',
        '',
        '.category-title {',
        '  font-size: 1.5rem;',
        '  margin-bottom: 1rem;',
        '  padding-bottom: 0.5rem;',
        '  border-bottom: 2px solid #e5e7eb;',
        '}',
        '',
        '.filter-buttons {',
        '  margin: 1rem 0;',
        '  display: flex;',
        '  gap: 0.5rem;',
        '  flex-wrap: wrap;',
        '}',
        '',
        '.filter-button {',
        '  padding: 0.5rem 1rem;',
        '  border: 1px solid #e5e7eb;',
        '  border-radius: 0.25rem;',
        '  background: #fff;',
        '  cursor: pointer;',
        '}',
        '',
        '.filter-button.active {',
        '  background: #4a5568;',
        '  color: white;',
        '}',
        '</style>',
        '',
        '<div class="filter-buttons">',
        '<button class="filter-button active" onclick="filterVideos(\'all\')">All</button>'
    ];

    // Add filter buttons for each category
    Object.keys(videosByCategory).forEach(category => {
        lines.push(`<button class="filter-button" onclick="filterVideos('${category}')">${category}</button>`);
    });

    lines.push('</div>', '<div id="video-container">');

    // Add videos grouped by category
    Object.entries(videosByCategory).forEach(([category, videos]) => {
        lines.push(
            `<div class="category-section" data-category="${category}">`,
            `  <h2 class="category-title">${category}</h2>`,
            '  <div class="video-grid">'
        );

        videos.forEach(video => {
            lines.push(
                '    <div class="video-card">',
                '      <mux-player',
                '        stream-type="vod"',
                `        playback-id="${video.playbackId}"`,
                `        metadata-video-title="${video.title}"`,
                '        metadata-viewer-user-id="user-id-123">',
                '      </mux-player>',
                '      <div class="video-info">',
                `        <div class="video-title">${video.title}</div>`,
                `        <div class="video-description">${video.description}</div>`,
                '      </div>',
                '    </div>'
            );
        });

        lines.push('  </div>', '</div>');
    });

    lines.push(
        '</div>',
        '',
        '<script>',
        'function filterVideos(category) {',
        '  // Update active button',
        '  document.querySelectorAll(\'.filter-button\').forEach(button => {',
        '    button.classList.remove(\'active\');',
        '    if (button.textContent.toLowerCase() === category.toLowerCase()) {',
        '      button.classList.add(\'active\');',
        '    }',
        '  });',
        '',
        '  // Show/hide categories',
        '  document.querySelectorAll(\'.category-section\').forEach(section => {',
        '    if (category === \'all\' || section.dataset.category === category) {',
        '      section.style.display = \'block\';',
        '    } else {',
        '      section.style.display = \'none\';',
        '    }',
        '  });',
        '}',
        '</script>'
    );

    return lines.join('\n');
}

generateVideoLibrary().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
