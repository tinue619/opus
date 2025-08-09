/**
 * Система управления историей действий (undo/redo)
 */

class HistoryManager {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistorySize = 50;
  }

  // Добавить новое состояние в историю
  push(state) {
    // Удаляем все состояния после текущего индекса (если были undo)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Добавляем новое состояние
    this.history.push(this.cloneState(state));
    
    // Ограничиваем размер истории
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  // Отменить последнее действие
  undo() {
    if (this.canUndo()) {
      this.currentIndex--;
      return this.cloneState(this.history[this.currentIndex]);
    }
    return null;
  }

  // Повторить отменённое действие
  redo() {
    if (this.canRedo()) {
      this.currentIndex++;
      return this.cloneState(this.history[this.currentIndex]);
    }
    return null;
  }

  // Можно ли отменить
  canUndo() {
    return this.currentIndex > 0;
  }

  // Можно ли повторить
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  // Очистить историю
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  // Глубокое клонирование состояния
  cloneState(state) {
    return {
      width: state.width,
      height: state.height,
      depth: state.depth,
      base: state.base,
      dividers: state.dividers.map(d => ({
        type: d.type,
        pos: d.pos,
        start: d.start,
        end: d.end,
        id: d.id
      }))
    };
  }

  // Получить информацию о состоянии истории
  getInfo() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historyLength: this.history.length,
      currentIndex: this.currentIndex
    };
  }
}

// Создаём глобальный экземпляр менеджера истории
const historyManager = new HistoryManager();