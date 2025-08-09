/**
 * Модуль для улучшенной обработки изменения размеров шкафа
 * Реализует более интуитивное поведение при перетаскивании стенок
 */

class ResizeHandler {
  constructor() {
    this.isResizing = false;
    this.resizeData = null;
  }

  /**
   * Начало изменения размера
   * @param {string} wall - тип стенки ('left', 'right', 'top', 'bottom', 'base')
   * @param {number} mouseX - начальная позиция мыши X
   * @param {number} mouseY - начальная позиция мыши Y
   * @param {Cabinet} cabinet - объект шкафа
   * @param {Object} transform - трансформация отображения
   */
  startResize(wall, mouseX, mouseY, cabinet, transform) {
    this.isResizing = true;
    
    // Сохраняем начальные данные
    this.resizeData = {
      wall: wall,
      startMouseX: mouseX,
      startMouseY: mouseY,
      startWidth: cabinet.width,
      startHeight: cabinet.height,
      startBase: cabinet.base,
      transform: transform,
      
      // Вычисляем позиции стенок в экранных координатах
      leftX: transform.offsetX,
      rightX: transform.offsetX + cabinet.width * transform.scale,
      topY: transform.offsetY,
      bottomY: transform.offsetY + cabinet.height * transform.scale,
      baseY: transform.offsetY + (cabinet.height - cabinet.base) * transform.scale
    };
  }

  /**
   * Обработка перемещения мыши при изменении размера
   * @param {number} mouseX - текущая позиция мыши X
   * @param {number} mouseY - текущая позиция мыши Y
   * @returns {Object} - новые размеры {width, height, base} или null
   */
  handleMouseMove(mouseX, mouseY) {
    if (!this.isResizing || !this.resizeData) return null;
    
    const data = this.resizeData;
    const scale = data.transform.scale;
    
    switch(data.wall) {
      case 'left':
        // При перетаскивании левой стенки, правая остается на месте
        const newLeftX = mouseX;
        const newWidth = (data.rightX - newLeftX) / scale;
        return {
          width: Math.max(132, Math.min(2000, newWidth)),
          height: data.startHeight,
          base: data.startBase
        };
        
      case 'right':
        // При перетаскивании правой стенки, левая остается на месте
        const newRightX = mouseX;
        const newWidthRight = (newRightX - data.leftX) / scale;
        return {
          width: Math.max(132, Math.min(2000, newWidthRight)),
          height: data.startHeight,
          base: data.startBase
        };
        
      case 'top':
        // При перетаскивании верхней стенки, нижняя остается на месте
        const newTopY = mouseY;
        const newHeight = (data.bottomY - newTopY) / scale;
        return {
          width: data.startWidth,
          height: Math.max(132, Math.min(3000, newHeight)),
          base: data.startBase
        };
        
      case 'bottom':
        // При перетаскивании нижней стенки, верхняя остается на месте
        const newBottomY = mouseY;
        const newHeightBottom = (newBottomY - data.topY) / scale;
        return {
          width: data.startWidth,
          height: Math.max(132, Math.min(3000, newHeightBottom)),
          base: data.startBase
        };
        
      case 'base':
        // При перетаскивании цоколя
        const newBaseY = mouseY;
        const distanceFromBottom = (data.bottomY - newBaseY) / scale;
        const newBase = Math.max(60, Math.min(200, distanceFromBottom));
        return {
          width: data.startWidth,
          height: data.startHeight,
          base: newBase
        };
        
      default:
        return null;
    }
  }

  /**
   * Завершение изменения размера
   */
  endResize() {
    this.isResizing = false;
    this.resizeData = null;
  }

  /**
   * Определение типа стенки по координатам мыши
   * @param {number} mouseX - позиция мыши X
   * @param {number} mouseY - позиция мыши Y
   * @param {Cabinet} cabinet - объект шкафа
   * @param {Object} transform - трансформация отображения
   * @param {string} resizeMode - текущий режим изменения размера
   * @returns {string|null} - тип стенки или null
   */
  static getWallAtPoint(mouseX, mouseY, cabinet, transform, resizeMode) {
    const tolerance = 15; // пиксели
    
    const leftX = transform.offsetX;
    const rightX = transform.offsetX + cabinet.width * transform.scale;
    const topY = transform.offsetY;
    const bottomY = transform.offsetY + cabinet.height * transform.scale;
    const baseY = transform.offsetY + (cabinet.height - cabinet.base) * transform.scale;
    
    switch(resizeMode) {
      case 'width':
        if (Math.abs(mouseX - leftX) < tolerance && 
            mouseY >= topY && mouseY <= bottomY) {
          return 'left';
        }
        if (Math.abs(mouseX - rightX) < tolerance && 
            mouseY >= topY && mouseY <= bottomY) {
          return 'right';
        }
        break;
        
      case 'height':
        if (Math.abs(mouseY - topY) < tolerance && 
            mouseX >= leftX && mouseX <= rightX) {
          return 'top';
        }
        if (Math.abs(mouseY - bottomY) < tolerance && 
            mouseX >= leftX && mouseX <= rightX) {
          return 'bottom';
        }
        break;
        
      case 'base':
        if (Math.abs(mouseY - baseY) < tolerance && 
            mouseX >= leftX && mouseX <= rightX) {
          return 'base';
        }
        break;
    }
    
    return null;
  }

  /**
   * Получить курсор для типа стенки
   * @param {string} wall - тип стенки
   * @returns {string} - CSS курсор
   */
  static getCursorForWall(wall) {
    switch(wall) {
      case 'left':
      case 'right':
        return 'ew-resize';
      case 'top':
      case 'bottom':
      case 'base':
        return 'ns-resize';
      default:
        return 'default';
    }
  }

  /**
   * Получить цвет подсветки для стенки
   * @param {string} wall - тип стенки
   * @param {boolean} isHovered - наведен ли курсор
   * @param {boolean} isDragging - перетаскивается ли
   * @returns {Object} - объект с fillStyle и shadowColor
   */
  static getWallHighlight(wall, isHovered, isDragging) {
    if (isDragging) {
      return {
        fillStyle: 'rgba(0, 122, 255, 0.8)',
        shadowColor: 'rgba(0, 122, 255, 0.4)',
        shadowBlur: 15
      };
    } else if (isHovered) {
      return {
        fillStyle: 'rgba(0, 122, 255, 0.6)',
        shadowColor: 'rgba(0, 122, 255, 0.3)',
        shadowBlur: 10
      };
    } else {
      return {
        fillStyle: 'rgba(0, 122, 255, 0.3)',
        shadowColor: 'transparent',
        shadowBlur: 0
      };
    }
  }
}

// Экспортируем для использования
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResizeHandler;
}
