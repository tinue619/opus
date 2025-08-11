  showAbout() {
    this.showToast('Cabinet Designer v3.0 - Мобильная версия');
  }

  showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'mobile-toast';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  destroy() {
    const mobileElements = document.querySelectorAll(
      '.mobile-header, .mobile-bottom-nav, .tools-panel, .view-indicator, .mobile-toast'
    );
    mobileElements.forEach(el => el.remove());
    
    const mobileStyles = document.getElementById('mobile-styles-v3');
    if (mobileStyles) {
      mobileStyles.remove();
    }
    
    this.isInitialized = false;
  }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileUIManager;
} else {
  window.MobileUIManager = MobileUIManager;
}
