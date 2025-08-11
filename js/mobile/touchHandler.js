/**
 * Touch Handler для Cabinet Designer
 * Обрабатывает жесты и сенсорные взаимодействия на мобильных устройствах
 */

class TouchHandler {
  constructor(app) {
    this.app = app;
    this.canvas = document.getElementById('canvas');
    this.isTouch = 'ontouchstart' in window;
    
    this.touchState = {
      touching: false,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      startTime: 0,
      moved: false
    };

    this.pinchState = {
      active: false,
      startDistance: 0,
      startScale: 1
    };

    if (this.isTouch && this.canvas) {
      this.init();
    }
  }

  init() {
    console.log('Initializing Touch Handler...');
    
    // Отключаем стандартные жесты браузера
    this.canvas.style.touchAction = 'none';
    
    // Добавляем обработчики событий
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
    
    console.log('Touch Handler initialized successfully');
  }

  handleTouchStart(e) {
    e.preventDefault();
    
    const touches = e.touches;
    
    if (touches.length === 1) {
      // Одиночное касание
      this.touchState.touching = true;
      this.touchState.startX = touches[0].clientX;
      this.touchState.startY = touches[0].clientY;
      this.touchState.lastX = touches[0].clientX;
      this.touchState.lastY = touches[0].clientY;
      this.touchState.startTime = Date.now();
      this.touchState.moved = false;
      
    } else if (touches.length === 2) {
      // Пинч для масштабирования
      this.pinchState.active = true;
      this.pinchState.startDistance = this.getDistance(touches[0], touches[1]);
      this.pinchState.startScale = this.app.scale || 1;
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    
    const touches = e.touches;
    
    if (touches.length === 1 && this.touchState.touching && !this.pinchState.active) {
      // Одиночное перемещение
      const currentX = touches[0].clientX;
      const currentY = touches[0].clientY;
      
      const deltaX = currentX - this.touchState.lastX;
      const deltaY = currentY - this.touchState.lastY;
      
      // Проверяем, началось ли движение
      if (!this.touchState.moved) {
        const totalDelta = Math.abs(currentX - this.touchState.startX) + Math.abs(currentY - this.touchState.startY);
        if (totalDelta > 10) {
          this.touchState.moved = true;
        }
      }
      
      if (this.touchState.moved) {
        this.handlePan(deltaX, deltaY);
      }
      
      this.touchState.lastX = currentX;
      this.touchState.lastY = currentY;
      
    } else if (touches.length === 2 && this.pinchState.active) {
      // Пинч для масштабирования
      const currentDistance = this.getDistance(touches[0], touches[1]);
      const scale = (currentDistance / this.pinchState.startDistance) * this.pinchState.startScale;
      
      this.handleZoom(scale);
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    
    const touches = e.touches;
    
    if (touches.length === 0) {
      // Все касания закончились
      if (this.touchState.touching && !this.touchState.moved) {
        // Это был тап
        this.handleTap(this.touchState.startX, this.touchState.startY);
      }
      
      this.touchState.touching = false;
      this.touchState.moved = false;
      this.pinchState.active = false;
      
    } else if (touches.length === 1) {
      // Остался один палец, сбрасываем пинч
      this.pinchState.active = false;
    }
  }

  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  handlePan(deltaX, deltaY) {
    // Перемещение камеры/канваса
    if (this.app.offsetX !== undefined && this.app.offsetY !== undefined) {
      this.app.offsetX += deltaX;
      this.app.offsetY += deltaY;
      
      if (window.render) {
        window.render();
      }
    }
  }

  handleZoom(scale) {
    // Масштабирование
    const minScale = 0.5;
    const maxScale = 3;
    
    scale = Math.max(minScale, Math.min(maxScale, scale));
    
    if (this.app.scale !== undefined) {
      this.app.scale = scale;
      this.app.targetScale = scale;
      
      if (window.render) {
        window.render();
      }
    }
  }

  handleTap(x, y) {
    // Преобразуем координаты экрана в координаты канваса
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;
    
    // Эмулируем клик мыши для совместимости с существующим кодом
    const mouseEvent = new MouseEvent('click', {
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true
    });
    
    // Добавляем свойства для канваса
    mouseEvent.offsetX = canvasX;
    mouseEvent.offsetY = canvasY;
    
    this.canvas.dispatchEvent(mouseEvent);
    
    console.log(`Touch tap at: ${canvasX}, ${canvasY}`);
  }

  // Дополнительные методы для жестов
  handleLongPress(x, y) {
    // Длинное нажатие - можно использовать для контекстного меню
    console.log('Long press detected');
    
    if (window.mobileUI && window.mobileUI.showContextMenu) {
      window.mobileUI.showContextMenu(x, y);
    }
  }

  handleDoubleTap(x, y) {
    // Двойной тап - можно использовать для сброса масштаба
    console.log('Double tap detected');
    
    if (this.app.scale !== undefined) {
      this.app.scale = 1;
      this.app.targetScale = 1;
      this.app.offsetX = 0;
      this.app.offsetY = 0;
      
      if (window.render) {
        window.render();
      }
      
      if (window.mobileUI && window.mobileUI.showToast) {
        window.mobileUI.showToast('Масштаб сброшен');
      }
    }
  }

  // Метод для обновления состояния при изменении режима приложения
  updateMode(mode) {
    console.log(`Touch handler mode updated: ${mode}`);
    // Здесь можно изменить поведение жестов в зависимости от режима
  }

  destroy() {
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.handleTouchStart);
      this.canvas.removeEventListener('touchmove', this.handleTouchMove);
      this.canvas.removeEventListener('touchend', this.handleTouchEnd);
      this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);
    }
  }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TouchHandler;
} else {
  window.TouchHandler = TouchHandler;
}
