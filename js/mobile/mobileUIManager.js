/**
 * Mobile UI Manager v2.0 - Простая работающая версия
 */

class MobileUIManager {
  constructor() {
    this.isInitialized = false;
    this.activePanel = null;
    this.fabOpen = false;
    
    if (this.isMobile()) {
      this.init();
    }
  }

  isMobile() {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
  }

  init() {
    if (this.isInitialized) return;
    console.log('Initializing Mobile UI Manager v2.0...');
    
    this.setupViewportMeta();
    this.addMobileStyles();
    this.createMobileInterface();
    this.setupEventHandlers();
    
    this.isInitialized = true;
    console.log('Mobile UI Manager v2.0 initialized successfully!');
  }

  setupViewportMeta() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover';
  }

  addMobileStyles() {
    if (document.getElementById('mobile-styles-v2')) return;
    
    const style = document.createElement('style');
    style.id = 'mobile-styles-v2';
    style.textContent = `
      .mobile-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 56px;
        background: white;
        border-bottom: 1px solid #e5e5e7;
        z-index: 900;
        display: none;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
      }

      .mobile-logo {
        font-weight: 600;
        font-size: 16px;
        color: #1d1d1f;
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
        color: #6e6e73;
      }

      .mobile-bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: white;
        border-top: 1px solid #e5e5e7;
        display: none;
        grid-template-columns: repeat(4, 1fr);
        z-index: 900;
      }

      .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border: none;
        background: transparent;
        color: #86868b;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        padding: 8px 4px;
      }

      .nav-item.active {
        color: #007aff;
      }

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
        background: #007aff;
        border: none;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
      }

      .fab-main:active {
        transform: scale(0.95);
      }

      .fab-menu {
        position: absolute;
        bottom: 70px;
        right: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        animation: slideUp 0.3s ease;
      }

      .fab-item {
        padding: 12px 16px;
        background: white;
        border: 1px solid #e5e5e7;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        color: #1d1d1f;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .fab-item:hover {
        background: #007aff;
        color: white;
        transform: translateX(-4px);
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .mobile-toast {
        position: fixed;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        z-index: 2000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .mobile-toast.show {
        opacity: 1;
      }

      @media (max-width: 768px) {
        .mobile-header,
        .mobile-bottom-nav,
        .mobile-fab {
          display: flex;
        }

        .toolbar {
          display: none !important;
        }

        .sidebar {
          display: none !important;
        }

        body {
          padding-top: 56px !important;
          padding-bottom: 64px !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  createMobileInterface() {
    this.createMobileHeader();
    this.createBottomNavigation();
    this.createFloatingActionButton();
    this.hideDesktopElements();
  }

  hideDesktopElements() {
    const sidebar = document.querySelector('.sidebar');
    const toolbar = document.querySelector('.toolbar');
    
    if (sidebar) sidebar.style.display = 'none';
    if (toolbar) toolbar.style.display = 'none';
  }

  createMobileHeader() {
    const header = document.createElement('div');
    header.className = 'mobile-header';
    header.innerHTML = `
      <div class="mobile-logo">Cabinet Designer</div>
      <div class="mobile-header-actions">
        <button class="header-btn" id="mobileView3D">3D</button>
        <button class="header-btn" id="mobileUndo">↶</button>
        <button class="header-btn" id="mobileRedo">↷</button>
      </div>
    `;
    
    document.body.appendChild(header);
  }

  createBottomNavigation() {
    const nav = document.createElement('div');
    nav.className = 'mobile-bottom-nav';
    nav.innerHTML = `
      <button class="nav-item active" data-panel="home">Главная</button>
      <button class="nav-item" data-panel="dimensions">Размеры</button>
      <button class="nav-item" data-panel="tools">Инструменты</button>
      <button class="nav-item" data-panel="parts">Детали</button>
    `;
    
    document.body.appendChild(nav);
  }

  createFloatingActionButton() {
    const fab = document.createElement('div');
    fab.className = 'mobile-fab';
    fab.innerHTML = `
      <button class="fab-main" id="mobileFab">+</button>
    `;
    
    document.body.appendChild(fab);
  }

  setupEventHandlers() {
    // Header buttons
    document.getElementById('mobileView3D')?.addEventListener('click', () => this.toggleView());
    document.getElementById('mobileUndo')?.addEventListener('click', () => this.undo());
    document.getElementById('mobileRedo')?.addEventListener('click', () => this.redo());
    
    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleNavClick(e));
    });
    
    // FAB
    document.getElementById('mobileFab')?.addEventListener('click', () => this.toggleFab());
  }

  handleNavClick(e) {
    const panel = e.currentTarget.dataset.panel;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Обрабатываем клики по навигации
    switch (panel) {
      case 'home':
        this.showToast('Главная страница');
        break;
      case 'dimensions':
        this.openDimensionsDialog();
        break;
      case 'tools':
        this.showToolsMenu();
        break;
      case 'parts':
        this.showPartsInfo();
        break;
      default:
        this.showToast(`Открыта панель: ${panel}`);
    }
  }

  openDimensionsDialog() {
    // Простое окно для изменения размеров
    const width = prompt('Введите ширину (мм):', '800');
    const height = prompt('Введите высоту (мм):', '1800');
    const depth = prompt('Введите глубину (мм):', '500');
    
    if (width && height && depth) {
      this.applyDimensions(width, height, depth);
    }
  }

  applyDimensions(width, height, depth) {
    // Пробуем применить размеры
    const inputs = {
      width: document.getElementById('width'),
      height: document.getElementById('height'),
      depth: document.getElementById('depth')
    };
    
    if (inputs.width) inputs.width.value = width;
    if (inputs.height) inputs.height.value = height;
    if (inputs.depth) inputs.depth.value = depth;
    
    // Пробуем нажать кнопку применить
    const applyBtn = document.getElementById('apply') || document.querySelector('[onclick*="apply"]');
    if (applyBtn) {
      applyBtn.click();
      this.showToast('Размеры применены');
    } else {
      this.showToast(`Размеры установлены: ${width}x${height}x${depth}`);
    }
  }

  showToolsMenu() {
    const tools = [
      'Редактировать',
      'Удалить',
      'Показать размеры',
      'Сбросить'
    ];
    
    const selectedTool = prompt('Выберите инструмент:\n' + tools.map((tool, i) => `${i+1}. ${tool}`).join('\n'));
    
    if (selectedTool >= 1 && selectedTool <= tools.length) {
      this.showToast(`Выбран: ${tools[selectedTool-1]}`);
    }
  }

  showPartsInfo() {
    // Пробуем получить информацию о деталях
    if (window.app && window.app.cabinet && window.app.cabinet.getAllParts) {
      const parts = window.app.cabinet.getAllParts();
      this.showToast(`Деталей: ${parts.length}`);
    } else {
      this.showToast('Список деталей');
    }
  }

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
    // Пробуем разные способы отмены
    if (window.app && window.app.undo) {
      window.app.undo();
      this.showToast('Действие отменено');
      return;
    }
    
    if (window.undo) {
      window.undo();
      this.showToast('Действие отменено');
      return;
    }
    
    // Пробуем найти кнопку отмены
    const undoBtn = document.getElementById('undo') || document.querySelector('[title*="Отменить"]');
    if (undoBtn) {
      undoBtn.click();
      this.showToast('Действие отменено');
      return;
    }
    
    this.showToast('Отмена недоступна');
  }

  redo() {
    // Пробуем разные способы повтора
    if (window.app && window.app.redo) {
      window.app.redo();
      this.showToast('Действие повторено');
      return;
    }
    
    if (window.redo) {
      window.redo();
      this.showToast('Действие повторено');
      return;
    }
    
    // Пробуем найти кнопку повтора
    const redoBtn = document.getElementById('redo') || document.querySelector('[title*="Повторить"]');
    if (redoBtn) {
      redoBtn.click();
      this.showToast('Действие повторено');
      return;
    }
    
    this.showToast('Повтор недоступен');
  }

  toggleFab() {
    this.fabOpen = !this.fabOpen;
    const fab = document.querySelector('.mobile-fab');
    
    if (this.fabOpen) {
      this.showFabMenu();
    } else {
      this.hideFabMenu();
    }
  }

  showFabMenu() {
    // Создаем меню с опциями
    const menu = document.createElement('div');
    menu.className = 'fab-menu';
    menu.innerHTML = `
      <button class="fab-item" data-action="addShelf">+ Полка</button>
      <button class="fab-item" data-action="addStand">+ Стойка</button>
      <button class="fab-item" data-action="addRod">+ Штанга</button>
    `;
    
    const fab = document.querySelector('.mobile-fab');
    fab.appendChild(menu);
    
    // Добавляем обработчики
    menu.querySelectorAll('.fab-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleFabAction(e));
    });
  }

  hideFabMenu() {
    const menu = document.querySelector('.fab-menu');
    if (menu) {
      menu.remove();
    }
  }

  handleFabAction(e) {
    const action = e.currentTarget.dataset.action;
    
    switch (action) {
      case 'addShelf':
        this.addElement('shelf');
        break;
      case 'addStand':
        this.addElement('stand');
        break;
      case 'addRod':
        this.addElement('rod');
        break;
    }
    
    this.hideFabMenu();
    this.fabOpen = false;
  }

  addElement(type) {
    // Пробуем разные способы добавления элементов
    
    // Способ 1: через window.app
    if (window.app && window.app.setAddMode) {
      window.app.setAddMode(type);
      this.showToast(`Режим добавления ${this.getTypeName(type)} активирован`);
      return;
    }
    
    // Способ 2: через прямые методы
    if (type === 'shelf' && window.addShelf) {
      window.addShelf();
      this.showToast('Полка добавлена');
      return;
    }
    
    if (type === 'stand' && window.addStand) {
      window.addStand();
      this.showToast('Стойка добавлена');
      return;
    }
    
    if (type === 'rod' && window.addRod) {
      window.addRod();
      this.showToast('Штанга добавлена');
      return;
    }
    
    // Способ 3: через кнопки интерфейса
    const addButtons = {
      'shelf': document.getElementById('addShelf'),
      'stand': document.getElementById('addStand'), 
      'rod': document.getElementById('addRod')
    };
    
    if (addButtons[type]) {
      addButtons[type].click();
      this.showToast(`${this.getTypeName(type)} добавлена`);
      return;
    }
    
    // Если ничего не сработало
    this.showToast(`Не удалось добавить ${this.getTypeName(type)}`);
  }

  getTypeName(type) {
    const names = {
      'shelf': 'полка',
      'stand': 'стойка', 
      'rod': 'штанга'
    };
    return names[type] || type;
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
      '.mobile-header, .mobile-bottom-nav, .mobile-fab, .mobile-toast'
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
