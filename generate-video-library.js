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
        
        const videos = assets.data.map(asset => ({
            id: asset.id,
            playbackId: asset.playback_ids?.[0]?.id,
            status: asset.status,
            duration: asset.duration,
            aspectRatio: asset.aspect_ratio,
            createdAt: asset.created_at
        }));

        const markdownContent = generateMarkdown(videos);
        fs.writeFileSync('index.md', markdownContent);
        console.log('Video library generated successfully!');
    } catch (error) {
        console.error('Error generating video library:', error);
        throw error;
    }
}

function generateMarkdown(videos) {
    const lines = [
        '# Video Library',
        '',
        '<!-- Include Mux Player CSS and JS -->',
        '<script src="https://unpkg.com/@mux/mux-player"></script>',
        '',
        '<!-- Add custom CSS for grid layout -->',
        '<style>',
        '.video-grid {',
        '  display: grid;',
        '  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));',
        '  gap: 2rem;',
        '  padding: 2rem;',
        '}',
        '.video-card {',
        '  background: #f5f5f5;',
        '  border-radius: 8px;',
        '  overflow: hidden;',
        '  box-shadow: 0 2px 4px rgba(0,0,0,0.1);',
        '}',
        '.video-info {',
        '  padding: 1rem;',
        '}',
        '.video-title {',
        '  margin: 0;',
        '  font-size: 1.1rem;',
        '  color: #333;',
        '}',
        '.video-meta {',
        '  font-size: 0.9rem;',
        '  color: #666;',
        '  margin-top: 0.5rem;',
        '}',
        '</style>',
        '',
        '<div class="video-grid">'
    ];

    videos.forEach(video => {
        if (video.playbackId && video.status === 'ready') {
            const duration = video.duration ? `${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}` : 'N/A';
            const date = new Date(video.createdAt).toLocaleDateString();
            
            lines.push(`
  <div class="video-card">
    <mux-player
      stream-type="on-demand"
      playback-id="${video.playbackId}"
      metadata-video-title="${video.id}"
      metadata-viewer-user-id="user-id-123"
      style="aspect-ratio: 16/9;"
    ></mux-player>
    <div class="video-info">
      <h3 class="video-title">Video ${video.id}</h3>
      <div class="video-meta">
        Duration: ${duration} | Added: ${date}
      </div>
    </div>
  </div>`);
        }
    });

    lines.push('</div>');
    return lines.join('\n');
}

generateVideoLibrary().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
