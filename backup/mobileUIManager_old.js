/**
 * Mobile UI Manager - полностью переработанный мобильный интерфейс
 * Версия 2.0 - современный, удобный и функциональный
 */

class MobileUIManager {
  constructor() {
    this.isInitialized = false;
    this.currentView = '2d';
    this.activePanel = null;
    this.activeTool = null;
    
    // Состояния панелей
    this.panels = {
      dimensions: false,
      tools: false,
      parts: false
    };
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;

    this.setupViewportMeta();
    this.createMobileElements();
    this.setupOrientationHandler();
    this.setupResponsiveLayout();
    
    this.isInitialized = true;
  }

  setupViewportMeta() {
    // Обновляем viewport meta для правильного отображения на мобильных
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover';
  }

  createMobileElements() {
    this.createToggleButton();
    this.createMobileToolbar();
    this.createNotificationArea();
  }

  createToggleButton() {
    // Метод оставляем пустым - кнопка не нужна
  }

  createMobileToolbar() {
    if (document.querySelector('.mobile-toolbar')) return;
    
    const toolbar = document.createElement('div');
    toolbar.className = 'mobile-toolbar';
    toolbar.innerHTML = `
      <button class="mobile-tool-btn" data-tool="shelf">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h18"/>
        </svg>
        <span>Полка</span>
      </button>
      <button class="mobile-tool-btn" data-tool="rod">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v18"/>
        </svg>
        <span>Штанга</span>
      </button>
      <button class="mobile-tool-btn" data-tool="undo">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v6h6"/>
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v6l6-6"/>
        </svg>
        <span>Отмена</span>
      </button>
      <button class="mobile-tool-btn" data-tool="view">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/>
        </svg>
        <span>Вид</span>
      </button>
      <button class="mobile-tool-btn" data-tool="settings">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z"/>
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
        </svg>
        <span>Габариты</span>
      </button>
      <button class="mobile-tool-btn" data-tool="redo">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 7v6h-6"/>
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 1v6l-6-6"/>
        </svg>
        <span>Повтор</span>
      </button>
      <button class="mobile-tool-btn" data-tool="dimensions">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
        </svg>
        <span>Размеры</span>
      </button>
      <button class="mobile-expand-btn" data-tool="expand">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 13l3 3 7-7"/>
        </svg>
      </button>
    `;

    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.mobile-tool-btn, .mobile-expand-btn');
      if (!btn) return;

      const tool = btn.dataset.tool;
      this.handleToolClick(tool, btn);
    });

    // Добавляем в body, а не в main-content
    document.body.appendChild(toolbar);
  }

  createNotificationArea() {
    if (document.querySelector('.mobile-notifications')) return;
    
    const notificationArea = document.createElement('div');
    notificationArea.className = 'mobile-notifications';
    document.body.appendChild(notificationArea);
  }

  handleToolClick(tool, button) {
    console.log('handleToolClick called with tool:', tool);
    
    document.querySelectorAll('.mobile-tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    switch (tool) {
      case 'shelf':
        if (window.app && window.app.setAddMode) {
          window.app.setAddMode('shelf');
          button.classList.add('active');
          this.showMobileNotification('Режим добавления полки активирован');
          this.hideMobilePanel(); // Автоматически сворачиваем панель
        }
        break;
        
      case 'rod':
        if (window.app && window.app.setAddMode) {
          window.app.setAddMode('rod');
          button.classList.add('active');
          this.showMobileNotification('Режим добавления штанги активирован');
          this.hideMobilePanel(); // Автоматически сворачиваем панель
        }
        break;
        
      case 'undo':
        if (window.app && window.app.undo) {
          window.app.undo();
          this.showMobileNotification('Действие отменено');
        }
        break;
        
      case 'view':
        this.toggleView();
        break;
        
      case 'redo':
        if (window.app && window.app.redo) {
          window.app.redo();
          this.showMobileNotification('Действие повторено');
        }
        break;
        
      case 'dimensions':
        this.toggleDimensions();
        break;
        
      case 'expand':
        this.toggleExpandToolbar();
        break;
        
      case 'settings':
        console.log('Settings button clicked');
        this.toggleSettingsPanel();
        break;
    }
  }

  toggleView() {
    const view2d = document.getElementById('view2d');
    const view3d = document.getElementById('view3d');
    
    if (view2d && view3d) {
      if (view2d.classList.contains('active')) {
        view3d.click();
        this.showMobileNotification('Переключено на 3D вид');
      } else {
        view2d.click();
        this.showMobileNotification('Переключено на 2D вид');
      }
    }
  }

  toggleSettingsPanel() {
    const settingsBtn = document.querySelector('[data-tool="settings"]');
    const isOpen = document.body.classList.contains('mobile-settings-open');
    
    console.log('toggleSettingsPanel called, isOpen:', isOpen);
    
    if (isOpen) {
      this.hideMobilePanel();
    } else {
      this.showMobilePanel();
      if (settingsBtn) {
        settingsBtn.classList.add('active');
      }
    }
  }

  showMobilePanel() {
    console.log('showMobilePanel called');
    document.body.classList.add('mobile-settings-open');
    
    // Создаем панель если ее нет
    if (!document.querySelector('.mobile-settings-panel')) {
      console.log('Creating mobile settings panel');
      this.createMobileSettingsPanel();
    }
  }

  hideMobilePanel() {
    console.log('hideMobilePanel called');
    document.body.classList.remove('mobile-settings-open');
    
    // Убираем активное состояние с кнопки настроек
    const settingsBtn = document.querySelector('[data-tool="settings"]');
    if (settingsBtn) {
      settingsBtn.classList.remove('active');
    }
  }

  createMobileSettingsPanel() {
    if (document.querySelector('.mobile-settings-panel')) {
      console.log('Mobile settings panel already exists');
      return;
    }
    
    console.log('Creating new mobile settings panel');
    const panel = document.createElement('div');
    panel.className = 'mobile-settings-panel';
    
    // Копируем только габариты шкафа
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      console.log('Sidebar found, copying content');
      
      // Ищем только размеры шкафа
      const dimensionInputs = sidebar.querySelectorAll('.control-group');
      let dimensionsHTML = '';
      
      dimensionInputs.forEach(group => {
        const label = group.querySelector('label');
        if (label && (label.textContent.includes('Ширина') || 
                     label.textContent.includes('Высота') ||
                     label.textContent.includes('Глубина') ||
                     label.textContent.includes('Цоколь'))) {
          dimensionsHTML += group.outerHTML;
        }
      });
      
      // Добавляем кнопку применить
      const applyBtn = sidebar.querySelector('#apply');
      const applyHTML = applyBtn ? applyBtn.outerHTML : '<button id="apply" class="canvas-btn">Применить</button>';
      
      panel.innerHTML = `
        <div class="mobile-settings-header">
          <h3>Габариты шкафа</h3>
          <button class="mobile-close-btn">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="mobile-settings-content">
          ${dimensionsHTML}
          <div class="control-group">
            ${applyHTML}
          </div>
        </div>
      `;
    } else {
      console.error('Sidebar not found!');
      return;
    }
    
    // Обработчик закрытия
    panel.addEventListener('click', (e) => {
      if (e.target.closest('.mobile-close-btn')) {
        this.hideMobilePanel();
      }
    });
    
    // Обработка кликов по кнопкам в панели
    panel.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn && !btn.classList.contains('mobile-close-btn')) {
        // Автоматически закрываем панель после нажатия кнопки
        setTimeout(() => this.hideMobilePanel(), 500);
      }
    });
    
    document.body.appendChild(panel);
    console.log('Mobile settings panel added to body');
    
    // Обработка клика по оверлею
    panel.addEventListener('click', (e) => {
      if (e.target === panel) {
        this.hideMobilePanel();
      }
    });
  }

  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.querySelector('.mobile-toggle-btn');
    
    if (!sidebar || !mainContent) return;

    this.sidebarCollapsed = !this.sidebarCollapsed;

    if (this.sidebarCollapsed) {
      sidebar.style.maxHeight = '80px';
      sidebar.style.overflow = 'hidden';
      mainContent.style.height = 'calc(100vh - 80px)';
      
      if (toggleBtn) {
        toggleBtn.innerHTML = `
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
          </svg>
        `;
      }
    } else {
      sidebar.style.maxHeight = '50vh';
      sidebar.style.overflow = 'auto';
      mainContent.style.height = '50vh';
      
      if (toggleBtn) {
        toggleBtn.innerHTML = `
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        `;
      }
    }
  }

  setupOrientationHandler() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });

    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  handleOrientationChange() {
    const newOrientation = window.orientation || 0;
    this.currentOrientation = newOrientation;
    
    // Принудительно обновляем layout
    if (window.app && window.app.renderer2d) {
      window.app.renderer2d.updateCanvas();
    }
    
    this.adjustLayoutForOrientation();
  }

  handleResize() {
    // Обновляем canvas при изменении размера
    setTimeout(() => {
      if (window.app && window.app.renderer2d) {
        window.app.renderer2d.updateCanvas();
      }
    }, 100);
  }

  adjustLayoutForOrientation() {
    const isPortrait = Math.abs(this.currentOrientation) !== 90;
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar && mainContent) {
      if (isPortrait) {
        // Портретная ориентация
        sidebar.style.maxHeight = this.sidebarCollapsed ? '80px' : '45vh';
        mainContent.style.height = this.sidebarCollapsed ? 'calc(100vh - 80px)' : '55vh';
      } else {
        // Альбомная ориентация
        sidebar.style.maxHeight = this.sidebarCollapsed ? '60px' : '40vh';
        mainContent.style.height = this.sidebarCollapsed ? 'calc(100vh - 60px)' : '60vh';
      }
    }
  }

  setupResponsiveLayout() {
    // Автоматически подстраиваем layout при загрузке
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleMediaChange = (e) => {
      if (e.matches) {
        this.enableMobileLayout();
      } else {
        this.enableDesktopLayout();
      }
    };

    mediaQuery.addListener(handleMediaChange);
    handleMediaChange(mediaQuery);
  }

  enableMobileLayout() {
    document.body.classList.add('mobile-layout');
    
    // Создаем мобильные элементы если их еще нет
    if (!this.isInitialized) {
      this.createMobileElements();
    }
  }

  enableDesktopLayout() {
    document.body.classList.remove('mobile-layout');
    
    // Скрываем мобильные элементы
    const mobileElements = document.querySelectorAll('.mobile-toolbar, .mobile-settings-panel');
    mobileElements.forEach(el => {
      el.style.display = 'none';
    });
  }

  addMobileStyles() {
    if (document.getElementById('mobile-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'mobile-styles';
    style.textContent = `
      /* Мобильная панель инструментов */
      .mobile-toolbar {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        background: var(--background);
        padding: 8px;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--separator);
        z-index: 1000;
      }

      .mobile-tool-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: var(--text-secondary);
        font-size: 10px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 50px;
      }

      .mobile-tool-btn:hover,
      .mobile-tool-btn.active {
        background: var(--primary-light);
        color: var(--primary);
      }

      .mobile-tool-btn svg {
        flex-shrink: 0;
      }

      /* Кнопка сворачивания панели */
      .mobile-toggle-btn {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        background: var(--surface-secondary);
        border: 1px solid var(--separator);
        border-radius: 6px;
        padding: 6px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
        display: none;
      }

      .mobile-toggle-btn:hover {
        background: var(--primary-light);
        color: var(--primary);
      }

      /* Мобильные уведомления */
      .mobile-notifications {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2000;
        pointer-events: none;
      }

      .mobile-notification {
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        margin-bottom: 8px;
        animation: slideInOut 3s ease-in-out;
      }

      @keyframes slideInOut {
        0%, 100% { opacity: 0; transform: translateY(-20px); }
        15%, 85% { opacity: 1; transform: translateY(0); }
      }

      /* Показываем мобильные элементы только на мобильных */
      @media (max-width: 768px) {
        .mobile-toggle-btn {
          display: block;
        }

        .mobile-toolbar {
          display: flex;
        }

        /* Скрываем некоторые desktop элементы */
        .canvas-controls {
          display: none;
        }
      }

      @media (min-width: 769px) {
        .mobile-toolbar,
        .mobile-toggle-btn {
          display: none;
        }
      }

      /* Touch tooltip */
      .touch-tooltip {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 500;
        letter-spacing: -0.01em;
      }
    `;
    
    document.head.appendChild(style);
  }

  toggleView() {
    const view2d = document.getElementById('view2d');
    const view3d = document.getElementById('view3d');
    
    if (view2d && view3d) {
      if (view2d.classList.contains('active')) {
        view3d.click();
        this.showMobileNotification('Переключено на 3D вид');
      } else {
        view2d.click();
        this.showMobileNotification('Переключено на 2D вид');
      }
    }
  }

  toggleDimensions() {
    const dimensionsBtn = document.querySelector('[data-tool="dimensions"]');
    
    // Переключаем отображение размеров
    if (window.app && window.app.toggleDimensions) {
      window.app.toggleDimensions();
      
      const isActive = dimensionsBtn.classList.contains('active');
      if (isActive) {
        dimensionsBtn.classList.remove('active');
        this.showMobileNotification('Размеры скрыты');
      } else {
        dimensionsBtn.classList.add('active');
        this.showMobileNotification('Размеры показаны');
      }
    }
  }

  toggleExpandToolbar() {
    const toolbar = document.querySelector('.mobile-toolbar');
    const expandBtn = document.querySelector('.mobile-expand-btn');
    
    if (!toolbar || !expandBtn) return;
    
    const isExpanded = toolbar.classList.contains('expanded');
    
    if (isExpanded) {
      // Сворачиваем
      toolbar.classList.remove('expanded');
      expandBtn.innerHTML = `
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 9l7 7 7-7"/>
        </svg>
      `;
    } else {
      // Разворачиваем
      toolbar.classList.add('expanded');
      expandBtn.innerHTML = `
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 15l-7-7-7 7"/>
        </svg>
      `;
    }
  }

  showMobileNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'mobile-notification';
    notification.textContent = message;
    
    const container = document.querySelector('.mobile-notifications');
    if (container) {
      container.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, duration);
    }
  }

  // Определение мобильного устройства
  isMobile() {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
  }

  // Очистка при уничтожении
  destroy() {
    const mobileElements = document.querySelectorAll('.mobile-toolbar, .mobile-settings-panel, .mobile-notifications');
    mobileElements.forEach(el => el.remove());
    
    const mobileStyles = document.getElementById('mobile-styles');
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
