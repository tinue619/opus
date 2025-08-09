/**
 * Обработка событий для Cabinet Designer
 */

function setupEvents() {
  app.canvas.addEventListener('mousemove', onMouseMove);
  app.canvas.addEventListener('mousedown', onMouseDown);
  app.canvas.addEventListener('mouseup', onMouseUp);
  app.canvas.addEventListener('mouseleave', onMouseLeave);
  app.canvas.addEventListener('wheel', onWheel);
  app.canvas.addEventListener('click', onCanvasClick);

  document.addEventListener('keydown', onKeyDown);
  
  // Отключаем режим изменения размеров при клике вне canvas
  document.addEventListener('click', (e) => {
    if (!app.canvas.contains(e.target) && app.resizeMode && !app.draggedWall) {
      setResizeMode(null);
    }
  });

  document.getElementById('apply').addEventListener('click', applyDimensions);
  document.getElementById('editMode').addEventListener('click', () => setMode('edit'));
  document.getElementById('addShelf').addEventListener('click', () => setMode('shelf'));
  document.getElementById('addStand').addEventListener('click', () => setMode('stand'));
  document.getElementById('addRod').addEventListener('click', () => setMode('rod'));
  document.getElementById('deleteMode').addEventListener('click', () => setMode('delete'));
  document.getElementById('cancel').addEventListener('click', () => {
    setMode('none');
    setResizeMode(null);
  });
  document.getElementById('toggleDimensions').addEventListener('click', toggleDimensions);
  document.getElementById('reset').addEventListener('click', reset);
  document.getElementById('mobile-menu').addEventListener('click', toggleMobileMenu);
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('redo').addEventListener('click', redo);
  
  // Обработчики переключения видов
  document.getElementById('view2d').addEventListener('click', () => switchView('2d'));
  document.getElementById('view3d').addEventListener('click', () => switchView('3d'));
  
  // Обработчики 3D контролов
  document.getElementById('resetView3d').addEventListener('click', () => {
    if (app.renderer3d) {
      app.renderer3d.resetView();
    }
  });
  
  document.getElementById('toggleWireframe').addEventListener('click', () => {
    if (app.renderer3d) {
      app.renderer3d.toggleWireframe();
    }
  });
  
  // Обработчик для селектора материалов
  document.getElementById('materialSelect').addEventListener('change', (e) => {
    if (app.renderer3d) {
      app.renderer3d.changeMaterial(e.target.value);
    }
  });
  
  // Обработчик для кнопки перезагрузки текстур
  const reloadTexturesBtn = document.getElementById('reloadTextures');
  if (reloadTexturesBtn) {
    reloadTexturesBtn.addEventListener('click', () => {
      if (app.renderer3d) {
        console.log('🔄 Перезагружаем текстуры...');
        app.renderer3d.loadTextures();
        showNotification('Текстуры перезагружены', 'info');
      }
    });
  }

  // Обработчики для выпадающих меню
  document.querySelectorAll('.btn-dropdown-arrow').forEach(btn => {
    btn.addEventListener('click', toggleDropdown);
  });
  
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const type = e.target.dataset.type;
      const count = parseInt(e.target.dataset.count);
      setDivideMode(type, count);
      hideAllDropdowns();
    });
  });

  // Закрываем выпадающие меню при клике вне их
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.btn-dropdown')) {
      hideAllDropdowns();
    }
  });

  document.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('wheel', (e) => {
      if (document.activeElement === input) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const delta = e.deltaY < 0 ? step : -step;
        input.value = Math.max(input.min, Math.min(input.max, parseInt(input.value) + delta));
      }
    });
  });
}

function getMousePos(e) {
  const rect = app.canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function onCanvasClick(e) {
  const interior = screenToInterior(app.mousePos.x, app.mousePos.y);
  
  if (app.mode === 'edit') {
    // Проверяем сначала штанги, потом разделители
    const rod = app.cabinet.findRodAt(interior.x, interior.y);
    const divider = app.cabinet.findDividerAt(interior.x, interior.y);
    
    if (rod) {
      app.selectedRod = rod;
      app.selectedDivider = null;
    } else if (divider) {
      app.selectedDivider = divider;
      app.selectedRod = null;
    } else {
      app.selectedDivider = null;
      app.selectedRod = null;
    }
    render();
  } else if (app.mode === 'divide') {
    // Обработка равномерного деления
    const section = app.cabinet.findSectionAt(interior.x, interior.y);
    if (section && app.divideType && app.divideCount) {
      // Сохраняем состояние перед изменением
      saveHistory();
      
      let success = false;
      if (app.divideType === 'rod') {
        // Добавляем штанги
        const sectionIndex = app.cabinet.sections.indexOf(section);
        success = app.cabinet.addMultipleRods(sectionIndex, app.divideCount);
      } else if (app.divideType === 'stand') {
        // Проверяем наличие штанг перед добавлением стоек
        const sectionIndex = app.cabinet.sections.indexOf(section);
        const hasRods = app.cabinet.rods.some(rod => rod.sectionId === sectionIndex);
        
        if (hasRods) {
          showNotification('Нельзя добавлять стойки в секцию со штангами', 'error');
          return;
        }
        
        success = app.cabinet.divideSection(section, app.divideType, app.divideCount);
      } else {
        // Добавляем полки
        success = app.cabinet.divideSection(section, app.divideType, app.divideCount);
      }
      
      if (success) {
        // Сохраняем новое состояние
        saveHistory();
        
        render();
        updatePartsList();
        
        if (app.divideType === 'rod') {
          showNotification(`Добавлено ${app.divideCount} штанг`, 'success');
        } else {
          const itemName = app.divideType === 'shelf' ? 'полок' : 'стоек';
          const sectionsCount = app.divideCount + 1;
          showNotification(`Добавлено ${app.divideCount} ${itemName}, секция разделена на ${sectionsCount} части`, 'success');
        }
      } else {
        if (app.divideType === 'rod') {
          showNotification('Недостаточно места для штанг', 'error');
        } else if (app.divideType === 'stand') {
          showNotification('Нельзя добавить стойки в секцию со штангами или недостаточно места', 'error');
        } else {
          showNotification('Недостаточно места для деления', 'error');
        }
      }
    }
  } else if (app.mode === 'rod' && app.hoveredSection) {
    // Добавление одиночной штанги
    addRod(interior);
  }
}

// Функция для добавления штанги
function addRod(interior) {
  const section = app.hoveredSection;
  if (!section) return;
  
  const sectionIndex = app.cabinet.sections.indexOf(section);
  if (sectionIndex === -1) return;
  
  // Проверяем минимальную ширину секции
  if (section.w < CONFIG.MIN_ROD_LENGTH) {
    showNotification('Секция слишком узкая для штанги', 'error');
    return;
  }
  
  // Добавляем штангу на высоте курсора или по умолчанию
  let rodY = interior.y;
  if (rodY < section.y + 50 || rodY > section.y + section.h - 50) {
    rodY = null; // Использовать стандартную высоту
  }
  
  saveHistory();
  const success = app.cabinet.addRod(sectionIndex, rodY);
  
  if (success) {
    saveHistory();
    render();
    updatePartsList();
    showNotification('Штанга добавлена', 'success');
  } else {
    showNotification('Не удалось добавить штангу', 'error');
  }
}

function onKeyDown(e) {
  // Обработка Ctrl+Z и Ctrl+Y
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    } else if (e.key === 'y' || e.key === 'Y') {
      e.preventDefault();
      redo();
      return;
    }
  }
  
  if (app.mode !== 'edit' || (!app.selectedDivider && !app.selectedRod) || !app.cabinet) return;
  
  const step = e.shiftKey ? 10 : 1;
  let moved = false;
  
  // Обработка для штанг
  if (app.selectedRod) {
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        moved = app.cabinet.moveRod(app.selectedRod.id, app.selectedRod.x - step, app.selectedRod.y);
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        moved = app.cabinet.moveRod(app.selectedRod.id, app.selectedRod.x + step, app.selectedRod.y);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        moved = app.cabinet.moveRod(app.selectedRod.id, app.selectedRod.x, app.selectedRod.y - step);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        moved = app.cabinet.moveRod(app.selectedRod.id, app.selectedRod.x, app.selectedRod.y + step);
        break;
        
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (confirm('Удалить штангу?')) {
          saveHistory();
          app.cabinet.removeRod(app.selectedRod.id);
          app.selectedRod = null;
          saveHistory();
          updatePartsList();
          showNotification('Штанга удалена', 'success');
          render();
        }
        break;
    }
  }
  
  // Обработка для разделителей
  if (app.selectedDivider) {
    switch(e.key) {
      case 'ArrowLeft':
        if (app.selectedDivider.type === 'v') {
          e.preventDefault();
          const newPos = app.selectedDivider.pos - step;
          moved = app.cabinet.moveDivider(app.selectedDivider.id, newPos);
        }
        break;
        
      case 'ArrowRight':
        if (app.selectedDivider.type === 'v') {
          e.preventDefault();
          const newPos = app.selectedDivider.pos + step;
          moved = app.cabinet.moveDivider(app.selectedDivider.id, newPos);
        }
        break;
        
      case 'ArrowUp':
        if (app.selectedDivider.type === 'h') {
          e.preventDefault();
          const newPos = app.selectedDivider.pos - step;
          moved = app.cabinet.moveDivider(app.selectedDivider.id, newPos);
        }
        break;
        
      case 'ArrowDown':
        if (app.selectedDivider.type === 'h') {
          e.preventDefault();
          const newPos = app.selectedDivider.pos + step;
          moved = app.cabinet.moveDivider(app.selectedDivider.id, newPos);
        }
        break;
        
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (app.selectedDivider) {
          const dependents = app.cabinet.findDependentDividers(app.selectedDivider);
          let confirmMessage = 'Удалить выбранный разделитель?';
          
          if (dependents.length > 0) {
            const shelfCount = dependents.filter(d => d.type === 'h').length;
            const standCount = dependents.filter(d => d.type === 'v').length;
            confirmMessage = `Внимание! Вместе с этим разделителем будут удалены:\n`;
            if (shelfCount > 0) confirmMessage += `- Полок: ${shelfCount}\n`;
            if (standCount > 0) confirmMessage += `- Стоек: ${standCount}\n`;
            confirmMessage += '\nПродолжить?';
          }
          
          if (confirm(confirmMessage)) {
            saveHistory();
            app.cabinet.removeDivider(app.selectedDivider.id);
            app.selectedDivider = null;
            saveHistory();
            updatePartsList();
            showNotification('Разделитель удален', 'success');
            render();
          }
        }
        break;
    }
  }
  
  // Общие клавиши
  switch(e.key) {
    case 'Escape':
      e.preventDefault();
      app.selectedDivider = null;
      app.selectedRod = null;
      setMode('none');
      break;
      
    case 'Tab':
      e.preventDefault();
      // Переключение между разделителями и штангами
      const allElements = [...app.cabinet.dividers, ...app.cabinet.rods];
      if (allElements.length > 0) {
        let currentIndex = -1;
        if (app.selectedDivider) {
          currentIndex = app.cabinet.dividers.findIndex(d => d.id === app.selectedDivider.id);
        } else if (app.selectedRod) {
          currentIndex = app.cabinet.dividers.length + app.cabinet.rods.findIndex(r => r.id === app.selectedRod.id);
        }
        
        const nextIndex = (currentIndex + 1) % allElements.length;
        if (nextIndex < app.cabinet.dividers.length) {
          app.selectedDivider = app.cabinet.dividers[nextIndex];
          app.selectedRod = null;
        } else {
          app.selectedRod = app.cabinet.rods[nextIndex - app.cabinet.dividers.length];
          app.selectedDivider = null;
        }
      }
      break;
  }
  
  if (moved) {
    // Сохраняем состояние после перемещения с клавиатуры
    saveHistory();
    render();
    updatePartsList();
  }
}

function onMouseMove(e) {
  app.mousePos = getMousePos(e);
  const interior = screenToInterior(app.mousePos.x, app.mousePos.y);

  // Обработка перетаскивания стенок
  if (app.draggedWall) {
    handleWallDrag(app.mousePos.x, app.mousePos.y);
    return;
  }

  if (app.draggedDivider) {
    const newPos = app.draggedDivider.type === 'v' ? interior.x : interior.y;
    app.cabinet.moveDivider(app.draggedDivider.id, newPos);
    render();
    updatePartsList();
    return;
  }
  
  if (app.draggedRod) {
    app.cabinet.moveRod(app.draggedRod.id, interior.x, interior.y);
    render();
    updatePartsList();
    return;
  }

  // Проверяем стенки в режиме изменения размеров
  if (app.resizeMode) {
    const wall = findWallAt(app.mousePos.x, app.mousePos.y);
    if (wall !== app.hoveredWall) {
      app.hoveredWall = wall;
      if (wall) {
        if (app.resizeMode === 'width') {
          app.canvas.style.cursor = 'ew-resize';
        } else if (app.resizeMode === 'height' || app.resizeMode === 'base') {
          app.canvas.style.cursor = 'ns-resize';
        }
      } else {
        app.canvas.style.cursor = 'default';
      }
      render();
    }
    return;
  }

  if (app.mode === 'edit' || app.mode === 'delete') {
    // Проверяем сначала штанги, потом разделители
    const rod = app.cabinet.findRodAt(interior.x, interior.y);
    const divider = app.cabinet.findDividerAt(interior.x, interior.y);
    
    const hoveredElement = rod || divider;
    const prevHovered = app.hoveredRod || app.hoveredDivider;
    
    if (hoveredElement !== prevHovered) {
      app.hoveredRod = rod;
      app.hoveredDivider = divider;
      
      if (app.mode === 'delete') {
        app.canvas.style.cursor = hoveredElement ? 'pointer' : 'crosshair';
      } else if (app.mode === 'edit') {
        app.canvas.style.cursor = hoveredElement ? 'pointer' : 'default';
      }
      render();
    }
  } else if (app.mode === 'none') {
    app.canvas.style.cursor = 'default';
  }

  if (app.mode === 'shelf' || app.mode === 'stand' || app.mode === 'rod') {
    const section = app.cabinet.findSectionAt(interior.x, interior.y);
    if (section !== app.hoveredSection) {
      const wasHovered = !!app.hoveredSection;
      app.hoveredSection = section;
      app.canvas.style.cursor = section ? 'crosshair' : 'default';
      
      if (section && !wasHovered) {
        phantomAnimationLoop();
      }
    }
    if (app.hoveredSection) {
      render();
    }
  } else if (app.mode === 'divide') {
    const section = app.cabinet.findSectionAt(interior.x, interior.y);
    if (section !== app.hoveredSection) {
      const wasHovered = !!app.hoveredSection;
      app.hoveredSection = section;
      app.canvas.style.cursor = section ? 'pointer' : 'crosshair';
      
      if (section && !wasHovered) {
        phantomAnimationLoop();
      }
    }
    if (app.hoveredSection) {
      render();
    }
  }
}

function onMouseDown(e) {
  const interior = screenToInterior(app.mousePos.x, app.mousePos.y);

  // Обработка начала перетаскивания стенок
  if (app.resizeMode && app.hoveredWall) {
    saveHistory();
    app.draggedWall = app.hoveredWall;
    app.initialMousePos = { x: app.mousePos.x, y: app.mousePos.y };
    app.initialDimension = getDimensionForWall(app.hoveredWall);
    
    // Сохраняем все исходные размеры и разделители
    app.originalState = {
      width: app.cabinet.width,
      height: app.cabinet.height,
      base: app.cabinet.base,
      dividers: JSON.parse(JSON.stringify(app.cabinet.dividers))
    };
    
    // Инициализируем обработчик изменения размеров
    if (!app.resizeHandler) {
      app.resizeHandler = new ResizeHandler();
    }
    const transform = calculateTransform();
    app.resizeHandler.startResize(app.hoveredWall, app.mousePos.x, app.mousePos.y, app.cabinet, transform);
    
    app.canvas.style.cursor = app.resizeMode === 'width' ? 'ew-resize' : 'ns-resize';
    return;
  }

  if (app.mode === 'edit' && (app.hoveredDivider || app.hoveredRod)) {
    // Сохраняем состояние перед началом перетаскивания
    saveHistory();
    
    if (app.hoveredRod) {
      app.draggedRod = app.hoveredRod;
      app.selectedRod = app.hoveredRod;
      app.selectedDivider = null;
    } else {
      app.draggedDivider = app.hoveredDivider;
      app.selectedDivider = app.hoveredDivider;
      app.selectedRod = null;
    }
    
    app.canvas.style.cursor = 'grabbing';
  } else if (app.mode === 'delete' && (app.hoveredDivider || app.hoveredRod)) {
    if (app.hoveredRod) {
      // Удаление штанги
      if (confirm('Удалить эту штангу?')) {
        saveHistory();
        app.cabinet.removeRod(app.hoveredRod.id);
        app.hoveredRod = null;
        app.selectedRod = null;
        saveHistory();
        updatePartsList();
        showNotification('Штанга удалена', 'success');
        render();
      }
    } else if (app.hoveredDivider) {
      // Удаление разделителя
      const divider = app.hoveredDivider;
      const dependents = app.cabinet.findDependentDividers(divider);
      
      let confirmMessage = 'Удалить этот разделитель?';
      if (dependents.length > 0) {
        const shelfCount = dependents.filter(d => d.type === 'h').length;
        const standCount = dependents.filter(d => d.type === 'v').length;
        confirmMessage = `Внимание! Вместе с этим разделителем будут удалены:\n`;
        if (shelfCount > 0) confirmMessage += `- Полок: ${shelfCount}\n`;
        if (standCount > 0) confirmMessage += `- Стоек: ${standCount}\n`;
        confirmMessage += '\nПродолжить?';
      }
      
      if (confirm(confirmMessage)) {
        saveHistory();
        app.cabinet.removeDivider(divider.id);
        app.hoveredDivider = null;
        app.selectedDivider = null;
        saveHistory();
        updatePartsList();
        showNotification('Разделитель и зависимые элементы удалены', 'success');
        render();
      }
    }
  } else if ((app.mode === 'shelf' || app.mode === 'stand') && app.hoveredSection) {
    addDivider(interior);
  }
}

function onMouseUp(e) {
  if (app.draggedWall) {
    // Применяем изменение размера
    applyWallResize();
    app.draggedWall = null;
    app.originalState = null; // Очищаем сохраненное состояние
    
    // Завершаем работу обработчика
    if (app.resizeHandler) {
      app.resizeHandler.endResize();
    }
    
    app.canvas.style.cursor = app.hoveredWall ? (app.resizeMode === 'width' ? 'ew-resize' : 'ns-resize') : 'default';
    saveHistory();
    render();
    updatePartsList();
    showNotification('Размер изменен', 'success');
  } else if (app.draggedDivider) {
    // Сохраняем состояние после перетаскивания
    saveHistory();
    app.draggedDivider = null;
    app.canvas.style.cursor = app.hoveredDivider ? 'grab' : 'default';
    showNotification('Элемент перемещен', 'success');
  } else if (app.draggedRod) {
    // Сохраняем состояние после перетаскивания штанги
    saveHistory();
    app.draggedRod = null;
    app.canvas.style.cursor = app.hoveredRod ? 'grab' : 'default';
    showNotification('Штанга перемещена', 'success');
  }
}

function onMouseLeave() {
  app.hoveredDivider = null;
  app.hoveredSection = null;
  app.hoveredWall = null;
  app.hoveredRod = null;
  
  // Если перетаскивали стенку, восстанавливаем размеры
  if (app.draggedWall && app.originalState) {
    // Восстанавливаем исходные размеры
    app.cabinet.width = app.originalState.width;
    app.cabinet.height = app.originalState.height;
    app.cabinet.base = app.originalState.base;
    app.cabinet.dividers = JSON.parse(JSON.stringify(app.originalState.dividers));
    
    // Обновляем поля ввода
    updateDimensionField('width', app.originalState.width);
    updateDimensionField('height', app.originalState.height);
    updateDimensionField('base', app.originalState.base);
    
    app.originalState = null;
  }
  
  app.draggedDivider = null;
  app.draggedWall = null;
  app.draggedRod = null;
  app.canvas.style.cursor = 'default';
  
  if (app.mode !== 'edit') {
    const keyboardHint = document.getElementById('keyboardHint');
    keyboardHint.classList.remove('show');
  }
  
  render();
}

function onWheel(e) {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  app.targetScale = Math.max(0.5, Math.min(2, app.targetScale * delta));
  animate();
}

function addDivider(interior) {
  const section = app.hoveredSection;
  if (!section) return;

  let success = false;
  const SNAP_THRESHOLD = 15; // Порог примагничивания в мм

  if (app.mode === 'shelf') {
    let relativeY = interior.y - section.y;
    const sectionCenter = section.h / 2;
    
    // Примагничивание к центру секции (с учётом толщины панели)
    const dividerCenter = relativeY + CONFIG.PANEL_THICKNESS / 2;
    if (Math.abs(dividerCenter - sectionCenter) < SNAP_THRESHOLD) {
      relativeY = sectionCenter - CONFIG.PANEL_THICKNESS / 2;
    }
    
    const topHeight = relativeY;
    const bottomHeight = section.h - relativeY - CONFIG.PANEL_THICKNESS;
    
    if (topHeight >= CONFIG.MIN_SECTION && bottomHeight >= CONFIG.MIN_SECTION) {
      success = app.cabinet.addDivider('h', section.y + relativeY, section.x, section.x + section.w);
    }
  } else if (app.mode === 'stand') {
    // Проверяем, есть ли штанги в секции
    const sectionIndex = app.cabinet.sections.indexOf(section);
    const hasRods = app.cabinet.rods.some(rod => rod.sectionId === sectionIndex);
    
    if (hasRods) {
      showNotification('Нельзя добавлять стойки в секцию со штангами', 'error');
      return;
    }
    
    let relativeX = interior.x - section.x;
    const sectionCenter = section.w / 2;
    
    // Примагничивание к центру секции (с учётом толщины панели)
    const dividerCenter = relativeX + CONFIG.PANEL_THICKNESS / 2;
    if (Math.abs(dividerCenter - sectionCenter) < SNAP_THRESHOLD) {
      relativeX = sectionCenter - CONFIG.PANEL_THICKNESS / 2;
    }
    
    const leftWidth = relativeX;
    const rightWidth = section.w - relativeX - CONFIG.PANEL_THICKNESS;
    
    if (leftWidth >= CONFIG.MIN_SECTION && rightWidth >= CONFIG.MIN_SECTION) {
      success = app.cabinet.addDivider('v', section.x + relativeX, section.y, section.y + section.h);
    }
  }

  if (success) {
    saveHistory();
    render();
    updatePartsList();
    showNotification(app.mode === 'shelf' ? 'Полка добавлена' : 'Стойка добавлена', 'success');
  } else {
    showNotification('Недостаточно места', 'error');
  }
}

// Функции для выпадающих меню
function toggleDropdown(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const targetId = e.target.closest('.btn-dropdown-arrow').dataset.target;
  const dropdown = document.getElementById(targetId);
  const arrow = e.target.closest('.btn-dropdown-arrow');
  const container = e.target.closest('.btn-dropdown');
  
  // Закрываем все остальные меню
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    if (menu !== dropdown) {
      menu.classList.remove('show');
    }
  });
  
  document.querySelectorAll('.btn-dropdown-arrow').forEach(btn => {
    if (btn !== arrow) {
      btn.classList.remove('active');
    }
  });
  
  document.querySelectorAll('.btn-dropdown').forEach(cont => {
    if (cont !== container) {
      cont.classList.remove('active');
    }
  });
  
  // Переключаем текущее меню
  dropdown.classList.toggle('show');
  arrow.classList.toggle('active');
  container.classList.toggle('active');
}

function hideAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.remove('show');
  });
  
  document.querySelectorAll('.btn-dropdown-arrow').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.querySelectorAll('.btn-dropdown').forEach(cont => {
    cont.classList.remove('active');
  });
}

// Функция для обработки перетаскивания стенок
function handleWallDrag(mouseX, mouseY) {
  if (!app.draggedWall || !app.resizeMode || !app.resizeHandler) return;
  
  // Используем новый обработчик для более интуитивного поведения
  const newDimensions = app.resizeHandler.handleMouseMove(mouseX, mouseY);
  
  if (newDimensions) {
    // Обновляем поля ввода
    if (newDimensions.width !== app.cabinet.width) {
      updateDimensionField('width', Math.round(newDimensions.width));
    }
    if (newDimensions.height !== app.cabinet.height) {
      updateDimensionField('height', Math.round(newDimensions.height));
    }
    if (newDimensions.base !== app.cabinet.base) {
      updateDimensionField('base', Math.round(newDimensions.base));
    }
    
    // Применяем размеры временно для preview
    app.cabinet.width = newDimensions.width;
    app.cabinet.height = newDimensions.height;
    app.cabinet.base = newDimensions.base;
    
    // Восстанавливаем оригинальные разделители и адаптируем их
    app.cabinet.dividers = JSON.parse(JSON.stringify(app.originalState.dividers));
    app.cabinet.updateInteriorDimensions();
    
    // Отрисовываем изменения
    render();
  }
}

// Получить текущий размер для указанной стенки
function getDimensionForWall(wall) {
  if (!app.cabinet) return 0;
  
  switch(wall) {
    case 'left':
    case 'right':
      return app.cabinet.width;
    case 'top':
    case 'bottom':
      return app.cabinet.height;
    case 'base':
      return app.cabinet.base;
    default:
      return 0;
  }
}

// Обновить поле ввода размера
function updateDimensionField(resizeMode, value) {
  const fieldId = resizeMode === 'base' ? 'base' : resizeMode;
  const field = document.getElementById(fieldId);
  if (field) {
    field.value = value;
  }
}

// Применить изменение размера стенки
function applyWallResize() {
  if (!app.draggedWall || !app.resizeMode) return;
  
  const fieldId = app.resizeMode === 'base' ? 'base' : app.resizeMode;
  const newValue = parseInt(document.getElementById(fieldId).value);
  
  // Валидация
  const limits = {
    width: { min: 132, max: 2000 },
    height: { min: 132, max: 3000 },
    depth: { min: 100, max: 1000 },
    base: { min: 60, max: 200 }
  };
  
  const limit = limits[app.resizeMode];
  if (!limit || newValue < limit.min || newValue > limit.max) {
    showNotification(`Размер должен быть от ${limit.min} до ${limit.max} мм`, 'error');
    // Возвращаем исходное значение
    updateDimensionField(app.resizeMode, app.initialDimension);
    return;
  }
  
  // Применяем новый размер
  switch(app.resizeMode) {
    case 'width':
      app.cabinet.width = newValue;
      app.cabinet.updateInteriorDimensions();
      break;
    case 'height':
      app.cabinet.height = newValue;
      app.cabinet.updateInteriorDimensions();
      break;
    case 'depth':
      app.cabinet.depth = newValue;
      break;
    case 'base':
      app.cabinet.base = newValue;
      app.cabinet.updateInteriorDimensions();
      break;
  }
}