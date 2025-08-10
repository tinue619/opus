  toggleView() {
    const view2d = document.getElementById('view2d');
    const view3d = document.getElementById('view3d');
    
    if (view2d && view3d) {
      if (view2d.classList.contains('active')) {
        view3d.click();
        this.showToast('Переключено на 3D вид');
      } else {
        view2d.click();
        this.showToast('Переключено на 2D вид');
      }
    }
  }

  undo() {
    if (window.undo) {
      window.undo();
      this.showToast('Действие отменено');
    }
  }

  redo() {
    if (window.redo) {
      window.redo();
      this.showToast('Действие повторено');
    }
  }

  updatePartsList() {
    const container = document.getElementById('mobilePartsList');
    const totalParts = document.getElementById('mobileTotalParts');
    const totalArea = document.getElementById('mobileTotalArea');
    
    if (!container || !window.app || !window.app.cabinet) return;
    
    const parts = window.app.cabinet.getAllParts();
    totalParts.textContent = parts.length;
    
    // Расчет общей площади
    let area = 0;
    parts.forEach(part => {
      area += (part.w * part.h) / 1000000; // мм² в м²
    });
    totalArea.textContent = area.toFixed(2) + ' м²';
    
    // Заполнение списка деталей
    container.innerHTML = '';
    parts.forEach((part, index) => {
      const item = document.createElement('div');
      item.className = 'part-item-mobile';
      item.innerHTML = `
        <div class="part-number">${index + 1}</div>
        <div class="part-info">
          <div class="part-name">${part.name}</div>
          <div class="part-dimensions">${Math.round(part.w)} × ${Math.round(part.h)} × ${Math.round(part.d)} мм</div>
        </div>
      `;
      container.appendChild(item);
    });
  }

  showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'mobile-toast';
    toast.textContent = message;
    
    const container = document.querySelector('.mobile-toast-container');
    if (container) {
      container.appendChild(toast);
      
      // Анимация появления
      setTimeout(() => toast.classList.add('show'), 10);
      
      // Удаление
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, duration);
    }
  }

  addMobileStyles() {
    if (document.getElementById('mobile-styles-v2')) return;
    
    const style = document.createElement('style');
    style.id = 'mobile-styles-v2';
    style.textContent = `
      /* Мобильный заголовок */
      .mobile-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 56px;
        background: var(--surface-elevated);
        border-bottom: 1px solid var(--separator);
        z-index: 900;
        display: none;
      }

      .mobile-header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 100%;
        padding: 0 16px;
      }

      .mobile-logo {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 16px;
        color: var(--text-primary);
      }

      .mobile-logo svg {
        stroke: var(--primary);
      }

      .mobile-header-actions {
        display: flex;
        gap: 8px;
      }

      .header-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: transparent;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        color: var(--text-secondary);
      }

      .header-btn:hover {
        background: var(--primary-light);
        color: var(--primary);
      }

      .header-btn:active {
        transform: scale(0.95);
      }

      /* Нижняя навигация */
      .mobile-bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: var(--surface-elevated);
        border-top: 1px solid var(--separator);
        display: none;
        grid-template-columns: repeat(4, 1fr);
        z-index: 900;
        padding-bottom: env(safe-area-inset-bottom);
      }

      .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border: none;
        background: transparent;
        color: var(--text-tertiary);
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 8px 4px;
      }

      .nav-item svg {
        width: 24px;
        height: 24px;
        stroke-width: 1.5;
        transition: all 0.2s ease;
      }

      .nav-item.active {
        color: var(--primary);
      }

      .nav-item.active svg {
        stroke: var(--primary);
      }

      /* Floating Action Button */
      .mobile-fab {
        position: fixed;
        bottom: 80px;
        right: 16px;
        z-index: 950;
        display: none;
      }

      .fab-main {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: var(--primary);
        border: none;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: var(--shadow-lg);
        transition: all 0.3s ease;
      }

      .fab-main:hover {
        transform: scale(1.05);
        box-shadow: var(--shadow-xl);
      }

      .fab-main:active {
        transform: scale(0.95);
      }

      .fab-main svg {
        width: 24px;
        height: 24px;
        stroke: white;
        transition: transform 0.3s ease;
      }

      .mobile-fab.active .fab-main svg {
        transform: rotate(45deg);
      }

      .fab-menu {
        position: absolute;
        bottom: 70px;
        right: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        opacity: 0;
        visibility: hidden;
        transform: scale(0.8) translateY(20px);
        transition: all 0.3s ease;
      }

      .mobile-fab.active .fab-menu {
        opacity: 1;
        visibility: visible;
        transform: scale(1) translateY(0);
      }

      .fab-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--surface-elevated);
        border: 1px solid var(--separator);
        border-radius: 12px;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: var(--shadow);
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
      }

      .fab-item:hover {
        background: var(--primary-light);
        border-color: var(--primary);
        transform: translateX(-4px);
      }

      .fab-item svg {
        width: 20px;
        height: 20px;
        stroke: var(--text-secondary);
      }

      /* Мобильные панели */
      .mobile-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        max-height: 85vh;
        background: var(--surface-elevated);
        border-radius: 24px 24px 0 0;
        box-shadow: var(--shadow-xl);
        z-index: 1000;
        transform: translateY(100%);
        transition: transform 0.3s ease;
        display: none;
        flex-direction: column;
      }

      .mobile-panel.active {
        transform: translateY(0);
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
        border-bottom: 1px solid var(--separator);
      }

      .panel-header h2 {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .panel-close {
        width: 32px;
        height: 32px;
        border: none;
        background: var(--surface);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        color: var(--text-secondary);
      }

      .panel-close:hover {
        background: var(--danger);
        color: white;
      }

      .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        padding-bottom: calc(20px + env(safe-area-inset-bottom));
      }

      /* Панель размеров */
      .dimension-group {
        margin-bottom: 24px;
      }

      .dimension-group label {
        display: block;
      }

      .dimension-group span {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .input-group {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--surface);
        border-radius: 12px;
        padding: 4px;
      }

      .input-btn {
        width: 44px;
        height: 44px;
        border: none;
        background: transparent;
        border-radius: 8px;
        font-size: 24px;
        font-weight: 300;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .input-btn:hover {
        background: var(--primary-light);
        color: var(--primary);
      }

      .input-btn:active {
        transform: scale(0.9);
      }

      .input-group input {
        flex: 1;
        border: none;
        background: transparent;
        text-align: center;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        outline: none;
      }

      .input-unit {
        padding-right: 12px;
        color: var(--text-tertiary);
        font-size: 14px;
      }

      /* Панель инструментов */
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 32px;
      }

      .tool-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 20px;
        background: var(--surface);
        border: 1px solid var(--separator);
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary);
      }

      .tool-btn:hover {
        background: var(--primary-light);
        border-color: var(--primary);
        transform: translateY(-2px);
        box-shadow: var(--shadow);
      }

      .tool-btn svg {
        stroke: var(--text-secondary);
      }

      .tools-section {
        margin-top: 24px;
      }

      .tools-section h3 {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-tertiary);
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .quick-add-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .quick-add-btn {
        padding: 12px 8px;
        background: var(--surface);
        border: 1px solid var(--separator);
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .quick-add-btn:hover {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }

      /* Панель деталей */
      .parts-summary {
        display: flex;
        gap: 20px;
        padding: 16px;
        background: var(--surface);
        border-radius: 12px;
        margin-bottom: 20px;
      }

      .summary-item {
        flex: 1;
        text-align: center;
      }

      .summary-item span {
        display: block;
        font-size: 12px;
        color: var(--text-tertiary);
        margin-bottom: 4px;
      }

      .summary-item strong {
        font-size: 20px;
        color: var(--primary);
      }

      .parts-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .part-item-mobile {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--surface);
        border-radius: 10px;
        border: 1px solid var(--separator);
      }

      .part-number {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-light);
        color: var(--primary);
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
      }

      .part-info {
        flex: 1;
      }

      .part-name {
        font-weight: 500;
        color: var(--text-primary);
        font-size: 14px;
      }

      .part-dimensions {
        font-size: 12px;
        color: var(--text-tertiary);
        margin-top: 2px;
      }

      /* Кнопка действия в панели */
      .panel-action-btn {
        width: 100%;
        padding: 16px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-top: 24px;
        transition: all 0.2s ease;
        box-shadow: var(--shadow);
      }

      .panel-action-btn:hover {
        background: var(--primary-hover);
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .panel-action-btn:active {
        transform: translateY(0);
      }

      .panel-action-btn svg {
        width: 20px;
        height: 20px;
        stroke: white;
      }

      /* Toast уведомления */
      .mobile-toast-container {
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        z-index: 2000;
        pointer-events: none;
      }

      .mobile-toast {
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        opacity: 0;
        transform: translateY(-20px) scale(0.9);
        transition: all 0.3s ease;
        max-width: 90%;
        text-align: center;
        backdrop-filter: blur(10px);
        box-shadow: var(--shadow-lg);
      }

      .mobile-toast.show {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      /* Адаптация для мобильных устройств */
      @media (max-width: 768px) {
        .mobile-header,
        .mobile-bottom-nav,
        .mobile-fab,
        .mobile-panel {
          display: flex;
        }

        /* Скрываем десктопную панель инструментов */
        .toolbar {
          display: none;
        }

        /* Адаптируем canvas под мобильные */
        .canvas-container {
          padding-top: 56px;
          padding-bottom: 64px;
        }
      }

      /* Поддержка безопасных зон для iPhone */
      @supports (padding: max(0px)) {
        .mobile-header {
          padding-top: env(safe-area-inset-top);
          height: calc(56px + env(safe-area-inset-top));
        }

        .mobile-bottom-nav {
          padding-bottom: env(safe-area-inset-bottom);
          height: calc(64px + env(safe-area-inset-bottom));
        }
      }

      /* Анимации */
      @keyframes slideUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  // Определение мобильного устройства
  isMobile() {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
  }

  // Очистка при уничтожении
  destroy() {
    const mobileElements = document.querySelectorAll(
      '.mobile-header, .mobile-bottom-nav, .mobile-fab, .mobile-panel, .mobile-toast-container'
    );
    mobileElements.forEach(el => el.remove());
    
    const mobileStyles = document.getElementById('mobile-styles-v2');
    if (mobileStyles) {
      mobileStyles.remove();
    }
  }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileUIManager;
} else {
  window.MobileUIManager = MobileUIManager;
}