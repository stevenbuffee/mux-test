async function generateVideoLibrary() {
    try {
        const assets = await muxClient.get('/video/v1/assets');
        
        // Group videos by category
        const videosByCategory = {};
        
        assets.data.forEach(asset => {
            let metadata = {};
            try {
                metadata = JSON.parse(asset.passthrough);
            } catch (e) {
                metadata = {
                    title: `Video ${asset.id}`,
                    category: 'Uncategorized',
                    description: ''
                };
            }
            
            if (!videosByCategory[metadata.category]) {
                videosByCategory[metadata.category] = [];
            }
            
            videosByCategory[metadata.category].push({
                id: asset.id,
                playbackId: asset.playback_ids?.[0]?.id,
                status: asset.status,
                title: metadata.title,
                description: metadata.description,
                category: metadata.category
            });
        });

        const markdownContent = generateMarkdown(videosByCategory);
        fs.writeFileSync('index.md', markdownContent);
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

function generateMarkdown(videosByCategory) {
    // ... (front matter and style sections remain the same)

    const categories = Object.keys(videosByCategory);
    const filterButtons = categories.map(category => 
        `<button class="filter-button" onclick="filterVideos('${category}')">${category}</button>`
    );

    let content = [
        // ... (previous HTML and style sections)
        '<div class="filter-buttons">',
        '<button class="filter-button active" onclick="filterVideos(\'all\')">All</button>',
        filterButtons.join('\n'),
        '</div>',
        '<div id="video-container">'
    ];

    categories.forEach(category => {
        content.push(`
  <div class="category-section" data-category="${category}">
    <h2 class="category-title">${category}</h2>
    <div class="video-grid">
    ${videosByCategory[category].map(video => `
      <div class="video-card">
        <mux-player
          stream-type="vod"
          playback-id="${video.playbackId}"
          metadata-video-title="${video.title}"
          metadata-viewer-user-id="user-id-123">
        </mux-player>
        <div class="video-info">
          <div class="video-title">${video.title}</div>
          <div class="video-description">${video.description}</div>
        </div>
      </div>
    `).join('\n')}
    </div>
  </div>`);
    });

    content.push('</div>');
    content.push(filterScript);
    return content.join('\n');
}
