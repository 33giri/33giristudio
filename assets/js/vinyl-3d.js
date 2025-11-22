// Vinyl Rotation Controller
class Vinyl3D {
  constructor() {
    this.wrapper = document.querySelector('.vinyl-3d-wrapper');
    this.image = document.querySelector('.vinyl-image');
    this.autoRotateBtn = document.getElementById('autoRotate');
    this.manualRotateBtn = document.getElementById('manualRotate');
    
    if (!this.wrapper || !this.image) return;
    
    // State
    this.currentRotation = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.isAutoRotating = true;
    
    // Initialize
    this.init();
  }
  
  init() {
    // Start with auto-rotate
    this.wrapper.classList.add('rotating');
    
    // Event listeners for manual rotation
    this.wrapper.addEventListener('mousedown', this.onDragStart.bind(this));
    this.wrapper.addEventListener('mousemove', this.onDrag.bind(this));
    this.wrapper.addEventListener('mouseup', this.onDragEnd.bind(this));
    this.wrapper.addEventListener('mouseleave', this.onDragEnd.bind(this));
    
    // Touch events
    this.wrapper.addEventListener('touchstart', this.onDragStart.bind(this));
    this.wrapper.addEventListener('touchmove', this.onDrag.bind(this));
    this.wrapper.addEventListener('touchend', this.onDragEnd.bind(this));
    
    // Button controls
    if (this.autoRotateBtn) {
      this.autoRotateBtn.addEventListener('click', this.enableAutoRotate.bind(this));
    }
    if (this.manualRotateBtn) {
      this.manualRotateBtn.addEventListener('click', this.enableManualRotate.bind(this));
    }
  }
  
  onDragStart(e) {
    if (this.isAutoRotating) {
      this.enableManualRotate();
    }
    
    this.isDragging = true;
    this.startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    this.startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    // Get current rotation from image transform
    const transform = window.getComputedStyle(this.image).transform;
    if (transform !== 'none') {
      const matrix = new DOMMatrix(transform);
      this.currentRotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
    }
  }
  
  onDrag(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    
    const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    
    const deltaX = currentX - this.startX;
    
    // Calculate rotation based on horizontal drag
    const newRotation = this.currentRotation + (deltaX * 0.5);
    
    this.image.style.transform = `rotate(${newRotation}deg)`;
  }
  
  onDragEnd() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    // Save current rotation
    const transform = window.getComputedStyle(this.image).transform;
    if (transform !== 'none') {
      const matrix = new DOMMatrix(transform);
      this.currentRotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
    }
  }
  
  enableAutoRotate() {
    this.isAutoRotating = true;
    this.wrapper.classList.add('rotating');
    this.image.style.transform = '';
    this.currentRotation = 0;
    this.autoRotateBtn?.classList.add('active');
    this.manualRotateBtn?.classList.remove('active');
  }
  
  enableManualRotate() {
    this.isAutoRotating = false;
    this.wrapper.classList.remove('rotating');
    this.autoRotateBtn?.classList.remove('active');
    this.manualRotateBtn?.classList.add('active');
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new Vinyl3D();
  });
} else {
  new Vinyl3D();
}
