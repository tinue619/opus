/**
 * Основной файлъ приложения Cabinet Designer
 */

// Сохраняем текущее состояние в историю
function saveHistory() {
  if (app.cabinet) {
    historyManager.push(app.cabinet.getState());
    updateHistoryButtons();
  }
}

// Обновляем состояние кнопок undo/redo
function updateHistoryButtons() {
  const info = historyManager.getInfo();
  
  const undoBtn = document.getElementById('undo');
  const redoBtn = document.getElementById('redo');
  
  if (undoBtn) {
    undoBtn.disabled = !info.canUndo;
    if (info.canUndo) {
      undoBtn.classList.remove('disabled');
    } else {
      undoBtn.classList.add('disabled');
    }
  }
  
  if (redoBtn) {
    redoBtn.disabled = !info.canRedo;
    if (info.canRedo) {
      redoBtn.classList.remove('disabled');
    } else {
      redoBtn.classList.add('disabled');
    }
  }
}

function applyDimensions() {
  const width = parseInt(document.getElementById('width').value);
  const height = parseInt(document.getElementById('height').value);
  const depth = parseInt(document.getElementById('depth').value);
  const base = parseInt(document.getElementById('base').value);

  if (width < 132 || width > 2000 ||
      height < 132 || height > 3000 ||
      depth < 100 || depth > 1000 ||
      base < 60 || base > 200) {
    showNotification('Проверьте размеры', 'error');
    return;
  }

  // Сохраняем текущее состояние перед изменением
  if (app.cabinet) {
    saveHistory();
  }

  app.cabinet = new Cabinet(width, height, depth, base);
  app.targetScale = 1;
  app.scale = 1;
  
  // Сохраняем новое состояние
  saveHistory();
  
  render();
  updatePartsList();
  showNotification('Размеры применены', 'success');
}

function setMode(mode) {
  app.mode = mode;
  app.hoveredSection = null;
  app.hoveredDivider = null;
  
  // Отключаем режим изменения размеров при смене режима
  if (mode !== 'none') {
    setResizeMode(null);
  }
  
  if (mode !== 'edit') {
    app.selectedDivider = null;
  }

  // Сбрасываем режим деления
  if (mode !== 'divide') {
    app.divideType = null;
    app.divideCount = null;
    hideAllDropdowns();
  }

  const keyboardHint = document.getElementById('keyboardHint');
  if (mode !== 'edit') {
    keyboardHint.classList.remove('show');
  }

  document.querySelectorAll('.btn-secondary, .btn-dropdown-main').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.querySelectorAll('.btn-dropdown').forEach(cont => {
    cont.classList.remove('active');
  });

  if (mode === 'edit') {
    document.getElementById('editMode').classList.add('active');
    showNotification('Кликните на разделитель для редактирования', 'info');
    setTimeout(() => keyboardHint.classList.add('show'), 300);
  } else if (mode === 'shelf') {
    document.getElementById('addShelf').classList.add('active');
    showNotification('Выберите место для полки', 'info');
  } else if (mode === 'stand') {
    document.getElementById('addStand').classList.add('active');
    showNotification('Выберите место для стойки', 'info');
  } else if (mode === 'rod') {
    document.getElementById('addRod').classList.add('active');
    showNotification('Выберите место для штанги', 'info');
  } else if (mode === 'delete') {
    document.getElementById('deleteMode').classList.add('active');
    showNotification('Кликните на разделитель или штангу для удаления', 'info');
    app.canvas.style.cursor = 'crosshair';
  } else if (mode === 'divide') {
    let typeName;
    if (app.divideType === 'rod') {
      typeName = 'штанг';
    } else {
      typeName = app.divideType === 'shelf' ? 'полок' : 'стоек';
    }
    showNotification(`Кликните на секцию для добавления ${app.divideCount} ${typeName}`, 'info');
    app.canvas.style.cursor = 'crosshair';
  } else {
    app.canvas.style.cursor = 'default';
  }

  render();
}

function setDivideMode(type, count) {
  app.mode = 'divide';
  app.divideType = type;
  app.divideCount = count;
  
  // Очищаем все обычные кнопки
  document.querySelectorAll('.btn-secondary').forEach(btn => btn.classList.remove('active'));
  
  let typeName;
  if (type === 'rod') {
    typeName = 'штанг';
  } else {
    typeName = type === 'shelf' ? 'полок' : 'стоек';
  }
  
  showNotification(`Кликните на секцию для добавления ${count} ${typeName}`, 'info');
  
  app.canvas.style.cursor = 'crosshair';
}

function toggleDimensions() {
  app.showDimensions = !app.showDimensions;
  document.getElementById('toggleDimensions').classList.toggle('active', app.showDimensions);
  render();
}

function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

function reset() {
  // Сохраняем текущее состояние
  saveHistory();
  
  app.cabinet = new Cabinet(800, 1800, 500, 100);
  document.getElementById('width').value = 800;
  document.getElementById('height').value = 1800;
  document.getElementById('depth').value = 500;
  document.getElementById('base').value = 100;
  app.targetScale = 1;
  app.scale = 1;
  setMode('none');
  
  // Очищаем историю и сохраняем новое начальное состояние
  historyManager.clear();
  saveHistory();
  
  render();
  updatePartsList();
  showNotification('Конфигурация сброшена', 'success');
}

// Функция отмены последнего действия
function undo() {
  const state = historyManager.undo();
  if (state) {
    app.cabinet.setState(state);
    updateUIFromCabinet();
    render();
    updatePartsList();
    updateHistoryButtons();
    showNotification('Действие отменено', 'info');
  }
}

// Функция повтора отменённого действия
function redo() {
  const state = historyManager.redo();
  if (state) {
    app.cabinet.setState(state);
    updateUIFromCabinet();
    render();
    updatePartsList();
    updateHistoryButtons();
    showNotification('Действие повторено', 'info');
  }
}

// Обновляем UI элементы из состояния шкафа
function updateUIFromCabinet() {
  if (app.cabinet) {
    document.getElementById('width').value = app.cabinet.width;
    document.getElementById('height').value = app.cabinet.height;
    document.getElementById('depth').value = app.cabinet.depth;
    document.getElementById('base').value = app.cabinet.base;
  }
}

function updatePartsList() {
  const container = document.getElementById('partsList');
  container.innerHTML = '';

  if (!app.cabinet) return;

  const parts = app.cabinet.getAllParts();
  document.getElementById('partsCount').textContent = parts.length;

  parts.forEach((part, index) => {
    const item = document.createElement('div');
    item.className = 'part-item';
    item.innerHTML = `
      <div class="part-name">${part.name}</div>
      <div class="part-dimension">${Math.round(part.w)}</div>
      <div class="part-dimension">${Math.round(part.h)}</div>
      <div class="part-dimension">${Math.round(part.d)}</div>
    `;
    container.appendChild(item);
  });
}

function showNotification(text, type = 'info') {
  const notification = document.getElementById('notification');
  const textElement = notification.querySelector('.notification-text');
  const iconElement = notification.querySelector('.notification-icon');
  
  notification.className = 'notification';
  notification.classList.add(type);
  
  textElement.textContent = text;
  
  const icons = {
    success: 'm4.5 12.75 6 6 9-13.5',
    error: 'M6 18 18 6M6 6l12 12',
    warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
    info: 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z'
  };
  
  iconElement.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="${icons[type] || icons.info}" />`;
  
  if (notification.hideTimeout) {
    clearTimeout(notification.hideTimeout);
  }
  
  setTimeout(() => notification.classList.add('show'), 10);
  
  notification.hideTimeout = setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

function init() {
  app.cabinet = new Cabinet(800, 1800, 500, 100);
  
  // Инициализируем историю
  historyManager.clear();
  saveHistory();
  
  // Инициализируем обработчик изменения размеров
  app.resizeHandler = new ResizeHandler();
  
  initCanvas();
  init3D();
  setupEvents();
  setupInteractiveResize();
  render();
  updatePartsList();
  showNotification('Добро пожаловать в Cabinet Designer!', 'success');
}

// Инициализация 3D
function init3D() {
  // Проверяем доступность Three.js
  if (typeof THREE === 'undefined') {
    console.warn('Three.js не загружен, 3D режим недоступен');
    document.getElementById('view3d').disabled = true;
    return;
  }
  
  app.canvas3d = document.getElementById('canvas3d');
  
  try {
    app.renderer3d = new Renderer3D(app.canvas3d);
    console.log('3D рендерер инициализирован');
  } catch (error) {
    console.error('Ошибка инициализации 3D рендерера:', error);
    document.getElementById('view3d').disabled = true;
  }
}

// Переключение видов
function switchView(view) {
  const canvas2d = document.getElementById('canvas');
  const canvas3d = document.getElementById('canvas3d');
  const controls3d = document.getElementById('canvas3dControls');
  const info3d = document.getElementById('canvas3dInfo');
  const view2dBtn = document.getElementById('view2d');
  const view3dBtn = document.getElementById('view3d');
  
  app.currentView = view;
  
  if (view === '3d') {
    if (!app.renderer3d) {
      showNotification('3D режим недоступен', 'error');
      return;
    }
    
    canvas2d.style.display = 'none';
    canvas3d.style.display = 'block';
    controls3d.style.display = 'flex';
    info3d.style.display = 'block';
    
    view2dBtn.classList.remove('active');
    view3dBtn.classList.add('active');
    
    // Отключаем редактирование в 3D
    if (app.mode !== 'none') {
      setMode('none');
      showNotification('Редактирование доступно только в 2D режиме', 'info');
    }
    
    // Отменяем режим изменения размеров
    setResizeMode(null);
    
    // Принудительно обновляем размеры canvas
    setTimeout(() => {
      if (app.renderer3d) {
        app.renderer3d.setCanvasSize();
        app.renderer3d.render(app.cabinet);
      }
    }, 50);
    
    app.renderer3d.render(app.cabinet);
    
    setTimeout(() => {
      showNotification('🎆 3D просмотр активирован!', 'success');
    }, 100);
    
  } else {
    canvas3d.style.display = 'none';
    canvas2d.style.display = 'block';
    controls3d.style.display = 'none';
    info3d.style.display = 'none';
    
    view3dBtn.classList.remove('active');
    view2dBtn.classList.add('active');
    
    render();
    showNotification('⚙️ 2D редактор активирован', 'info');
  }
}

// Настройка интерактивного изменения размеров
function setupInteractiveResize() {
  // Обработчики для полей ввода
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const depthInput = document.getElementById('depth');
  const baseInput = document.getElementById('base');
  
  widthInput.addEventListener('focus', () => setResizeMode('width'));
  heightInput.addEventListener('focus', () => setResizeMode('height'));
  baseInput.addEventListener('focus', () => setResizeMode('base'));
  
  // Глубина не поддерживает интерактивное изменение
  depthInput.addEventListener('focus', () => setResizeMode(null));
  
  // НЕ очищаем режим при потере фокуса - это будет мешать перетаскиванию
  // Режим будет очищаться только при клике вне области canvas или смене режима
}

// Установка режима интерактивного изменения размеров
function setResizeMode(mode) {
  app.resizeMode = mode;
  app.hoveredWall = null;
  app.draggedWall = null;
  
  if (mode) {
    showNotification(`Перетаскивайте ${getResizeModeText(mode)} для изменения размера`, 'info');
  }
  
  render();
}

// Получить текст для режима изменения размеров
function getResizeModeText(mode) {
  switch(mode) {
    case 'width': return 'боковины';
    case 'height': return 'верх и низ';
    case 'depth': return 'переднюю стенку';
    case 'base': return 'цоколь';
    default: return '';
  }
}

// Инициализация приложения
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}