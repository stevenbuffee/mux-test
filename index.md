---
perma_id: yEUm
---
# Mux Testing Page

Welcome to the Mux Testing Page! This is a collection of videos from our library.

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
</style>

<div class="video-grid">
  <!-- Video 1 -->
  <div class="video-card">
    <script src="https://cdn.jsdelivr.net/npm/@mux/mux-player"></script>
    <mux-player
      stream-type="vod"
      playback-id="bURbI4DPxTCVRozNaIJnfcMhIU4JD5pmbRsP7XAVmr00"
      metadata-video-title="First Video"
      metadata-viewer-user-id="user-id-123">
    </mux-player>
    <div class="video-info">
      <div class="video-title">First Video</div>
    </div>
  </div>

  <!-- Video 2 -->
  <div class="video-card">
    <mux-player
      stream-type="vod"
      playback-id="ANOTHER_PLAYBACK_ID"
      metadata-video-title="Second Video"
      metadata-viewer-user-id="user-id-123">
    </mux-player>
    <div class="video-info">
      <div class="video-title">Second Video</div>
    </div>
  </div>

  <!-- Video 3 -->
  <div class="video-card">
    <mux-player
      stream-type="vod"
      playback-id="YET_ANOTHER_PLAYBACK_ID"
      metadata-video-title="Third Video"
      metadata-viewer-user-id="user-id-123">
    </mux-player>
    <div class="video-info">
      <div class="video-title">Third Video</div>
    </div>
  </div>
</div>
