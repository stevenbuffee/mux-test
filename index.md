---
perma_id: yEUm
---
# Mux Video Library

<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player"></script>

<style>
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.video-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.video-info {
  padding: 1rem;
}

.video-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.video-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.category-section {
  margin: 2rem 0;
}

.category-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.filter-buttons {
  margin: 1rem 0;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-button {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  background: #fff;
  cursor: pointer;
}

.filter-button.active {
  background: #4a5568;
  color: white;
}
</style>

<div class="filter-buttons">
  <button class="filter-button active" onclick="filterVideos('all')">All</button>
  <button class="filter-button" onclick="filterVideos('Tutorial')">Tutorials</button>
  <button class="filter-button" onclick="filterVideos('Interview')">Interviews</button>
  <button class="filter-button" onclick="filterVideos('Product')">Product</button>
</div>

<div id="video-container">
  <!-- Tutorials -->
  <div class="category-section" data-category="Tutorial">
    <h2 class="category-title">Tutorials</h2>
    <div class="video-grid">
      <div class="video-card">
        <mux-player
          stream-type="vod"
          playback-id="bURbI4DPxTCVRozNaIJnfcMhIU4JD5pmbRsP7XAVmr00"
          metadata-video-title="How to Get Started"
          metadata-viewer-user-id="user-id-123">
        </mux-player>
        <div class="video-info">
          <div class="video-title">Getting Started with Mux</div>
          <div class="video-description">Learn the basics of video streaming with Mux</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Interviews -->
  <div class="category-section" data-category="Interview">
    <h2 class="category-title">Interviews</h2>
    <div class="video-grid">
      <!-- Interview videos here -->
    </div>
  </div>
</div>

<script>
function filterVideos(category) {
  // Update active button
  document.querySelectorAll('.filter-button').forEach(button => {
    button.classList.remove('active');
    if (button.textContent.toLowerCase().includes(category.toLowerCase())) {
      button.classList.add('active');
    }
  });

  // Show/hide categories
  document.querySelectorAll('.category-section').forEach(section => {
    if (category === 'all' || section.dataset.category === category) {
      section.style.display = 'block';
    } else {
      section.style.display = 'none';
    }
  });
}
</script>
