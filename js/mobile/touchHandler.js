/**
 * Touch Handler для мобильных устройств
 */

class TouchHandler {
  constructor(app) {
    this.app = app;
    this.touchData = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      touchTarget: null,
      touchTime: 0
    };
    
    this.initTouchEvents();
    this.setupMobileUI();
  }

  initTouchEvents() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    // Предотвращаем стандартные touch-жесты
    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });

    // Предотвращаем zoom и другие стандартные жесты
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    // Предотвращаем контекстное меню на длительное нажатие
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleTouchStart(e) {
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    
    this.touchData = {
      startX: touch.clientX - rect.left,
      startY: touch.clientY - rect.top,
      currentX: touch.clientX - rect.left,
      currentY: touch.clientY - rect.top,
      isDragging: false,
      touchTarget: null,
      touchTime: Date.now()
    };

    // Проверяем, есть ли элемент под касанием
    if (this.app.renderer2d) {
      this.touchData.touchTarget = this.app.renderer2d.getElementAt(
        this.touchData.startX, 
        this.touchData.startY
      );
    }

    // Если это разделитель, начинаем перетаскивание
    if (this.touchData.touchTarget && this.touchData.touchTarget.type === 'divider') {
      this.touchData.isDragging = true;
      this.showHapticFeedback();
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    
    this.touchData.currentX = touch.clientX - rect.left;
    this.touchData.currentY = touch.clientY - rect.top;

    // Если перетаскиваем разделитель
    if (this.touchData.isDragging && this.touchData.touchTarget) {
      this.handleDividerDrag();
    } else {
      // Обычное наведение для добавления элементов
      this.handleHover();
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    
    const touchDuration = Date.now() - this.touchData.touchTime;
    const distance = Math.sqrt(
      Math.pow(this.touchData.currentX - this.touchData.startX, 2) +
      Math.pow(this.touchData.currentY - this.touchData.startY, 2)
    );

    // Если это был короткий тап (не перетаскивание)
    if (touchDuration < 500 && distance < 10) {
      this.handleTap();
    }

    // Завершаем перетаскивание
    if (this.touchData.isDragging) {
      this.finalizeDividerDrag();
    }

    // Сбрасываем состояние touch
    this.resetTouchData();
  }

  handleDividerDrag() {
    if (!this.app.renderer2d || !this.touchData.touchTarget) return;

    const divider = this.touchData.touchTarget.divider;
    if (!divider) return;

    // Преобразуем touch-координаты в координаты интерьера
    const interiorCoords = this.app.renderer2d.screenToInterior(
      this.touchData.currentX,
      this.touchData.currentY
    );

    // Применяем ограничения движения для разделителя
    if (divider.type === 'shelf') {
      const limits = this.app.cabinet.getShelfLimits(divider);
      const constrainedY = Math.max(limits.min, Math.min(limits.max, interiorCoords.y));
      divider.y = constrainedY;
    } else if (divider.type === 'rod') {
      const limits = this.app.cabinet.getRodLimits(divider);
      const constrainedX = Math.max(limits.min, Math.min(limits.max, interiorCoords.x));
      divider.x = constrainedX;
    }

    // Обновляем отображение
    this.app.updateDisplay();
  }

  handleHover() {
    if (!this.app.renderer2d) return;

    // Эмулируем mouse move для системы hover
    const mockEvent = {
      offsetX: this.touchData.currentX,
      offsetY: this.touchData.currentY
    };

    // Используем существующую логику наведения
    if (this.app.handleCanvasMouseMove) {
      this.app.handleCanvasMouseMove(mockEvent);
    }
  }

  handleTap() {
    // Проверяем состояние приложения
    const addMode = this.app.getAddMode ? this.app.getAddMode() : 'none';
    
    if (addMode === 'none') {
      // Обычный тап - проверяем выбор элементов
      this.handleSelection();
    } else {
      // Режим добавления - добавляем элемент
      this.handleAddElement();
    }
  }

  handleSelection() {
    if (!this.app.renderer2d) return;

    const element = this.app.renderer2d.getElementAt(
      this.touchData.startX, 
      this.touchData.startY
    );

    if (element) {
      // Показываем информацию об элементе
      this.showElementInfo(element);
      this.showHapticFeedback();
    }
  }

  handleAddElement() {
    // Эмулируем клик для добавления элемента
    const mockEvent = {
      offsetX: this.touchData.startX,
      offsetY: this.touchData.startY
    };

    if (this.app.handleCanvasClick) {
      this.app.handleCanvasClick(mockEvent);
      this.showHapticFeedback();
    }
  }

  finalizeDividerDrag() {
    if (this.touchData.touchTarget && this.touchData.touchTarget.divider) {
      // Сохраняем в историю
      if (this.app.saveHistory) {
        this.app.saveHistory();
      }
      
      // Обновляем список деталей
      if (this.app.updatePartsList) {
        this.app.updatePartsList();
      }
    }
  }

  showElementInfo(element) {
    // Показываем временную информацию об элементе
    const info = this.getElementInfo(element);
    if (info) {
      this.showTooltip(info, this.touchData.startX, this.touchData.startY);
    }
  }

  getElementInfo(element) {
    if (!element) return null;

    switch (element.type) {
      case 'shelf':
        return `Полка: ${Math.round(element.width)}×${Math.round(element.depth)} мм`;
      case 'rod':
        return `Штанга: ${Math.round(element.height)} мм`;
      case 'divider':
        return `Разделитель: ${element.divider.type}`;
      case 'section':
        return `Секция: ${Math.round(element.width)}×${Math.round(element.height)} мм`;
      default:
        return null;
    }
  }

  showTooltip(text, x, y) {
    // Удаляем существующий tooltip
    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'touch-tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y - 40}px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000;
      white-space: nowrap;
      transform: translateX(-50%);
    `;

    document.body.appendChild(tooltip);

    // Автоматически скрываем через 2 секунды
    setTimeout(() => this.hideTooltip(), 2000);
  }

  hideTooltip() {
    const existing = document.querySelector('.touch-tooltip');
    if (existing) {
      existing.remove();
    }
  }

  showHapticFeedback() {
    // Тактильная обратная связь на поддерживающих устройствах
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  setupMobileUI() {
    // Добавляем мобильные элементы интерфейса
    this.addMobileControls();
    this.setupSwipeGestures();
    this.optimizeForTouch();
  }

  addMobileControls() {
    const controls = document.querySelector('.canvas-controls');
    if (!controls) return;

    // Добавляем кнопку "Готово" для завершения режима добавления
    const doneButton = document.createElement('button');
    doneButton.className = 'canvas-btn mobile-done-btn';
    doneButton.innerHTML = '✓ Готово';
    doneButton.style.display = 'none';
    
    doneButton.addEventListener('click', () => {
      if (this.app.cancelAddMode) {
        this.app.cancelAddMode();
      }
      doneButton.style.display = 'none';
    });

    controls.appendChild(doneButton);

    // Показываем кнопку "Готово" в режиме добавления
    const observer = new MutationObserver(() => {
      const addMode = this.app.getAddMode ? this.app.getAddMode() : 'none';
      doneButton.style.display = addMode !== 'none' ? 'block' : 'none';
    });

    observer.observe(document.body, { 
      attributes: true, 
      subtree: true, 
      attributeFilter: ['class', 'data-add-mode'] 
    });
  }

  setupSwipeGestures() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    let startY = 0;
    let currentY = 0;

    sidebar.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    sidebar.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY;
    }, { passive: true });

    sidebar.addEventListener('touchend', () => {
      const deltaY = currentY - startY;
      
      // Свайп вверх - скрыть панель
      if (deltaY < -50 && window.innerWidth <= 768) {
        this.collapseSidebar();
      }
      // Свайп вниз - показать панель
      else if (deltaY > 50 && window.innerWidth <= 768) {
        this.expandSidebar();
      }
    }, { passive: true });
  }

  collapseSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar && mainContent) {
      sidebar.style.maxHeight = '30vh';
      mainContent.style.height = '70vh';
    }
  }

  expandSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar && mainContent) {
      sidebar.style.maxHeight = '50vh';
      mainContent.style.height = '50vh';
    }
  }

  optimizeForTouch() {
    // Увеличиваем зоны нажатия для мобильных
    const style = document.createElement('style');
    style.textContent = `
      @media (hover: none) and (pointer: coarse) {
        .canvas-btn {
          min-height: 44px;
          min-width: 44px;
        }
        
        .input-field {
          min-height: 44px;
        }
        
        .view-btn {
          min-height: 44px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  resetTouchData() {
    this.touchData = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      touchTarget: null,
      touchTime: 0
    };
  }

  // Публичные методы для интеграции с основным приложением
  isTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  isMobile() {
    return window.innerWidth <= 768;
  }

  destroy() {
    // Очистка обработчиков событий
    this.hideTooltip();
    this.resetTouchData();
  }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TouchHandler;
} else {
  window.TouchHandler = TouchHandler;
}
