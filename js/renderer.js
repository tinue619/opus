/**
 * Модуль отрисовки для Cabinet Designer
 */

function initCanvas() {
  app.canvas = document.getElementById('canvas');
  app.ctx = app.canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const rect = app.canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  app.canvas.width = rect.width * dpr;
  app.canvas.height = rect.height * dpr;
  app.canvas.style.width = rect.width + 'px';
  app.canvas.style.height = rect.height + 'px';
  app.ctx.scale(dpr, dpr);
  render();
}

function calculateTransform() {
  if (!app.cabinet) return { scale: 1, offsetX: 0, offsetY: 0 };
  
  const canvasRect = app.canvas.getBoundingClientRect();
  const availableW = canvasRect.width - 2 * CONFIG.PADDING;
  const availableH = canvasRect.height - 2 * CONFIG.PADDING;
  const scale = Math.min(availableW / app.cabinet.width, availableH / app.cabinet.height) * app.scale;
  
  const cabinetW = app.cabinet.width * scale;
  const cabinetH = app.cabinet.height * scale;
  const offsetX = (canvasRect.width - cabinetW) / 2;
  const offsetY = (canvasRect.height - cabinetH) / 2;

  return { scale, offsetX, offsetY };
}

function screenToInterior(x, y) {
  const transform = calculateTransform();
  const worldX = (x - transform.offsetX) / transform.scale;
  const worldY = (y - transform.offsetY) / transform.scale;
  return {
    x: worldX - CONFIG.PANEL_THICKNESS,
    y: worldY - CONFIG.PANEL_THICKNESS
  };
}

// Поиск стенки под курсором
function findWallAt(x, y) {
  if (!app.cabinet || !app.resizeMode) return null;
  
  const transform = calculateTransform();
  const tolerance = 10; // Пиксели
  
  const cabinetX = transform.offsetX;
  const cabinetY = transform.offsetY;
  const cabinetW = app.cabinet.width * transform.scale;
  const cabinetH = app.cabinet.height * transform.scale;
  
  switch(app.resizeMode) {
    case 'width':
      // Левая боковина
      if (Math.abs(x - cabinetX) < tolerance && y >= cabinetY && y <= cabinetY + cabinetH) {
        return 'левая';
      }
      // Правая боковина
      if (Math.abs(x - (cabinetX + cabinetW)) < tolerance && y >= cabinetY && y <= cabinetY + cabinetH) {
        return 'правая';
      }
      break;
      
    case 'height':
      // Верхняя стенка
      if (Math.abs(y - cabinetY) < tolerance && x >= cabinetX && x <= cabinetX + cabinetW) {
        return 'верхняя';
      }
      // Нижняя стенка
      if (Math.abs(y - (cabinetY + cabinetH)) < tolerance && x >= cabinetX && x <= cabinetX + cabinetW) {
        return 'нижняя';
      }
      break;
      
    case 'base':
      // Цоколь (нижняя часть)
      const baseY = cabinetY + (app.cabinet.height - app.cabinet.base) * transform.scale;
      if (Math.abs(y - baseY) < tolerance && x >= cabinetX && x <= cabinetX + cabinetW) {
        return 'цоколь';
      }
      break;
  }
  
  return null;
}

function render() {
  if (!app.cabinet || !app.ctx) return;

  const canvasRect = app.canvas.getBoundingClientRect();
  app.ctx.clearRect(0, 0, canvasRect.width, canvasRect.height);
  
  const transform = calculateTransform();

  drawCabinet(transform);
  drawDividers(transform);
  drawRods(transform); // Добавляем отрисовку штанг
  drawSections(transform);
  
  if (app.mode !== 'none') {
    drawPhantom(transform);
  }
  
  if (app.showDimensions) {
    drawDimensions(transform);
  }
  
  // Обновляем 3D вид, если он активен
  if (app.currentView === '3d' && app.renderer3d) {
    app.renderer3d.render(app.cabinet);
  }
}

function drawCabinet(transform) {
  const ctx = app.ctx;
  const cabinet = app.cabinet;
  const colors = getComputedStyle(document.querySelector('.cabinet-colors'));

  ctx.save();
  
  ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 10;

  ctx.strokeStyle = colors.getPropertyValue('--cabinet-stroke');
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.getPropertyValue('--cabinet-body');
  
  const x = transform.offsetX;
  const y = transform.offsetY;
  const w = cabinet.width * transform.scale;
  const h = cabinet.height * transform.scale;
  
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  ctx.shadowColor = 'transparent';

  ctx.fillStyle = colors.getPropertyValue('--cabinet-panel');
  
  // Левая боковина
  drawWallSection(ctx, x, y, CONFIG.PANEL_THICKNESS * transform.scale, h, 'left', colors);
  
  // Правая боковина
  drawWallSection(ctx, x + (cabinet.width - CONFIG.PANEL_THICKNESS) * transform.scale, y, CONFIG.PANEL_THICKNESS * transform.scale, h, 'right', colors);
  
  const interiorX = x + CONFIG.PANEL_THICKNESS * transform.scale;
  const interiorW = cabinet.interiorWidth * transform.scale;
  
  // Верхняя панель
  drawWallSection(ctx, interiorX, y, interiorW, CONFIG.PANEL_THICKNESS * transform.scale, 'top', colors);
  
  // Нижняя панель
  drawWallSection(ctx, interiorX, y + (cabinet.height - CONFIG.PANEL_THICKNESS) * transform.scale, interiorW, CONFIG.PANEL_THICKNESS * transform.scale, 'bottom', colors);
  
  // Цоколь
  const baseY = y + (cabinet.height - cabinet.base) * transform.scale;
  drawWallSection(ctx, interiorX, baseY, interiorW, cabinet.base * transform.scale, 'base', colors);

  ctx.fillStyle = colors.getPropertyValue('--cabinet-interior');
  const intY = y + CONFIG.PANEL_THICKNESS * transform.scale;
  const intH = cabinet.interiorHeight * transform.scale;
  ctx.fillRect(interiorX, intY, interiorW, intH);

  ctx.restore();
}

// Отрисовка секции стенки с возможной подсветкой
function drawWallSection(ctx, x, y, w, h, wallType, colors) {
  const isActive = app.resizeMode && (
    (app.resizeMode === 'width' && (wallType === 'left' || wallType === 'right')) ||
    (app.resizeMode === 'height' && (wallType === 'top' || wallType === 'bottom')) ||
    (app.resizeMode === 'base' && wallType === 'base')
  );
  
  const isHovered = app.hoveredWall === wallType;
  const isDragged = app.draggedWall === wallType;
  
  if (isDragged) {
    ctx.fillStyle = 'rgba(0, 122, 255, 0.8)';
    ctx.shadowColor = 'rgba(0, 122, 255, 0.4)';
    ctx.shadowBlur = 15;
  } else if (isHovered && isActive) {
    ctx.fillStyle = 'rgba(0, 122, 255, 0.6)';
    ctx.shadowColor = 'rgba(0, 122, 255, 0.3)';
    ctx.shadowBlur = 10;
  } else if (isActive) {
    ctx.fillStyle = 'rgba(0, 122, 255, 0.3)';
  } else {
    ctx.fillStyle = colors.getPropertyValue('--cabinet-panel');
  }
  
  ctx.fillRect(x, y, w, h);
  
  // Сбрасываем тень
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function drawDividers(transform) {
  const ctx = app.ctx;
  const cabinet = app.cabinet;
  const colors = getComputedStyle(document.querySelector('.cabinet-colors'));

  cabinet.dividers.forEach(divider => {
    ctx.save();
    
    const baseX = transform.offsetX + CONFIG.PANEL_THICKNESS * transform.scale;
    const baseY = transform.offsetY + CONFIG.PANEL_THICKNESS * transform.scale;

    let color = colors.getPropertyValue('--cabinet-divider');
    let strokeWidth = 1;
    
    if (app.selectedDivider && app.selectedDivider.id === divider.id) {
      color = colors.getPropertyValue('--cabinet-divider');
      strokeWidth = 2;
      ctx.shadowColor = 'rgba(0, 122, 255, 0.4)';
      ctx.shadowBlur = 12;
    } else if (app.draggedDivider && app.draggedDivider.id === divider.id) {
      color = colors.getPropertyValue('--cabinet-divider-drag');
      ctx.shadowColor = 'rgba(255, 59, 48, 0.3)';
      ctx.shadowBlur = 10;
    } else if (app.hoveredDivider && app.hoveredDivider.id === divider.id) {
      if (app.mode === 'delete') {
        color = colors.getPropertyValue('--cabinet-divider-drag');
        ctx.shadowColor = 'rgba(255, 59, 48, 0.5)';
        ctx.shadowBlur = 15;
        
        const dependents = app.cabinet.findDependentDividers(divider);
        dependents.forEach(dep => {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 59, 48, 0.3)';
          ctx.strokeStyle = 'rgba(255, 59, 48, 0.5)';
          
          if (dep.type === 'v') {
            const x = baseX + dep.pos * transform.scale;
            const y = baseY + dep.start * transform.scale;
            const w = CONFIG.PANEL_THICKNESS * transform.scale;
            const h = (dep.end - dep.start) * transform.scale;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
          } else {
            const x = baseX + dep.start * transform.scale;
            const y = baseY + dep.pos * transform.scale;
            const w = (dep.end - dep.start) * transform.scale;
            const h = CONFIG.PANEL_THICKNESS * transform.scale;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
          }
          
          ctx.restore();
        });
      } else {
        color = colors.getPropertyValue('--cabinet-divider-hover');
        ctx.shadowColor = 'rgba(0, 122, 255, 0.2)';
        ctx.shadowBlur = 8;
      }
    }

    ctx.fillStyle = color;
    ctx.strokeStyle = app.selectedDivider && app.selectedDivider.id === divider.id ? '#007AFF' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = strokeWidth;

    if (divider.type === 'v') {
      const x = baseX + divider.pos * transform.scale;
      const y = baseY + divider.start * transform.scale;
      const w = CONFIG.PANEL_THICKNESS * transform.scale;
      const h = (divider.end - divider.start) * transform.scale;
      
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      
      if (app.selectedDivider && app.selectedDivider.id === divider.id) {
        ctx.fillStyle = '#007AFF';
        ctx.beginPath();
        ctx.arc(x + w/2, y - 10, 4, 0, Math.PI * 2);
        ctx.arc(x + w/2, y + h + 10, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const x = baseX + divider.start * transform.scale;
      const y = baseY + divider.pos * transform.scale;
      const w = (divider.end - divider.start) * transform.scale;
      const h = CONFIG.PANEL_THICKNESS * transform.scale;
      
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      
      if (app.selectedDivider && app.selectedDivider.id === divider.id) {
        ctx.fillStyle = '#007AFF';
        ctx.beginPath();
        ctx.arc(x - 10, y + h/2, 4, 0, Math.PI * 2);
        ctx.arc(x + w + 10, y + h/2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  });
}

// Отрисовка штанг для вешалок
function drawRods(transform) {
  const ctx = app.ctx;
  const cabinet = app.cabinet;
  const colors = getComputedStyle(document.querySelector('.cabinet-colors'));

  if (!cabinet.rods || cabinet.rods.length === 0) return;

  cabinet.rods.forEach(rod => {
    ctx.save();
    
    const baseX = transform.offsetX + CONFIG.PANEL_THICKNESS * transform.scale;
    const baseY = transform.offsetY + CONFIG.PANEL_THICKNESS * transform.scale;
    
    const x = baseX + rod.x * transform.scale;
    const y = baseY + rod.y * transform.scale;
    const length = rod.length * transform.scale;
    const diameter = Math.max(3, CONFIG.ROD_DIAMETER * transform.scale);
    
    // Основная штанга (металлический градиент)
    const gradient = ctx.createLinearGradient(x, y - diameter/2, x, y + diameter/2);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(0.5, '#c0c0c0');
    gradient.addColorStop(1, '#808080');
    
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#606060';
    ctx.lineWidth = 1;
    
    // Основная трубка
    ctx.fillRect(x, y - diameter/2, length, diameter);
    ctx.strokeRect(x, y - diameter/2, length, diameter);
    
    // Крепления на концах
    const mountSize = diameter * 1.2;
    
    // Левое крепление
    ctx.fillStyle = '#606060';
    ctx.beginPath();
    ctx.arc(x, y, mountSize/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Правое крепление
    ctx.beginPath();
    ctx.arc(x + length, y, mountSize/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Подсветка при наведении/выделении
    if (app.hoveredRod && app.hoveredRod.id === rod.id) {
      ctx.strokeStyle = app.mode === 'delete' ? '#ff3b30' : '#007AFF';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 5, y - diameter/2 - 5, length + 10, diameter + 10);
    }
    
    ctx.restore();
  });
}

function drawSections(transform) {
  const ctx = app.ctx;
  const cabinet = app.cabinet;
  const colors = getComputedStyle(document.querySelector('.cabinet-colors'));

  cabinet.sections.forEach(section => {
    const baseX = transform.offsetX + CONFIG.PANEL_THICKNESS * transform.scale;
    const baseY = transform.offsetY + CONFIG.PANEL_THICKNESS * transform.scale;
    
    const x = baseX + section.x * transform.scale;
    const y = baseY + section.y * transform.scale;
    const w = section.w * transform.scale;
    const h = section.h * transform.scale;

    if (app.hoveredSection === section && app.mode !== 'none') {
      ctx.fillStyle = colors.getPropertyValue('--cabinet-section-hover');
      ctx.fillRect(x, y, w, h);
    }
  });
}

function drawPhantom(transform) {
  if (!app.hoveredSection) return;

  const ctx = app.ctx;
  const section = app.hoveredSection;
  const interior = screenToInterior(app.mousePos.x, app.mousePos.y);
  const colors = getComputedStyle(document.querySelector('.cabinet-colors'));

  if (interior.x < section.x || interior.x > section.x + section.w ||
      interior.y < section.y || interior.y > section.y + section.h) {
    return;
  }

  const baseX = transform.offsetX + CONFIG.PANEL_THICKNESS * transform.scale;
  const baseY = transform.offsetY + CONFIG.PANEL_THICKNESS * transform.scale;
  const SNAP_THRESHOLD = 15; // Порог примагничивания

  ctx.save();
  
  // Добавляем пульсирующий эффект
  const time = Date.now() * 0.005;
  const pulse = 0.3 + 0.2 * Math.sin(time);
  
  const phantomColor = colors.getPropertyValue('--cabinet-phantom');
  const dividerColor = colors.getPropertyValue('--cabinet-divider');
  
  // Применяем пульсацию к прозрачности
  ctx.fillStyle = phantomColor.replace(/[\d\.]+\)$/, pulse + ')');
  ctx.strokeStyle = dividerColor;
  ctx.lineWidth = 2;
  
  // Анимированный штриховой контур
  const dashOffset = (Date.now() * 0.02) % 12;
  ctx.setLineDash([6, 6]);
  ctx.lineDashOffset = -dashOffset;

  if (app.mode === 'shelf') {
    let relativeY = interior.y - section.y;
    const sectionCenter = section.h / 2;
    let isSnapped = false;
    
    // Проверяем примагничивание к центру (с учётом толщины панели)
    const dividerCenter = relativeY + CONFIG.PANEL_THICKNESS / 2;
    if (Math.abs(dividerCenter - sectionCenter) < SNAP_THRESHOLD) {
      relativeY = sectionCenter - CONFIG.PANEL_THICKNESS / 2;
      isSnapped = true;
    }
    
    const topHeight = relativeY;
    const bottomHeight = section.h - relativeY - CONFIG.PANEL_THICKNESS;
    
    if (topHeight >= CONFIG.MIN_SECTION && bottomHeight >= CONFIG.MIN_SECTION) {
      const x = baseX + section.x * transform.scale;
      const y = baseY + (section.y + relativeY) * transform.scale;
      const w = section.w * transform.scale;
      const h = CONFIG.PANEL_THICKNESS * transform.scale;
      
      // Изменяем цвет и стиль при примагничивании
      if (isSnapped) {
        ctx.strokeStyle = colors.getPropertyValue('--primary');
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 4]);
        ctx.fillStyle = 'rgba(0, 122, 255, 0.2)';
      }
      
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      
      // Индикатор центра при примагничивании
      if (isSnapped) {
        ctx.fillStyle = colors.getPropertyValue('--primary');
        ctx.beginPath();
        ctx.arc(x - 10, y + h/2, 4, 0, Math.PI * 2);
        ctx.arc(x + w + 10, y + h/2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (app.mode === 'stand') {
    let relativeX = interior.x - section.x;
    const sectionCenter = section.w / 2;
    let isSnapped = false;
    
    // Проверяем примагничивание к центру (с учётом толщины панели)
    const dividerCenter = relativeX + CONFIG.PANEL_THICKNESS / 2;
    if (Math.abs(dividerCenter - sectionCenter) < SNAP_THRESHOLD) {
      relativeX = sectionCenter - CONFIG.PANEL_THICKNESS / 2;
      isSnapped = true;
    }
    
    const leftWidth = relativeX;
    const rightWidth = section.w - relativeX - CONFIG.PANEL_THICKNESS;
    
    if (leftWidth >= CONFIG.MIN_SECTION && rightWidth >= CONFIG.MIN_SECTION) {
      const x = baseX + (section.x + relativeX) * transform.scale;
      const y = baseY + section.y * transform.scale;
      const w = CONFIG.PANEL_THICKNESS * transform.scale;
      const h = section.h * transform.scale;
      
      // Изменяем цвет и стиль при примагничивании
      if (isSnapped) {
        ctx.strokeStyle = colors.getPropertyValue('--primary');
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 4]);
        ctx.fillStyle = 'rgba(0, 122, 255, 0.2)';
      }
      
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      
      // Индикатор центра при примагничивании
      if (isSnapped) {
        ctx.fillStyle = colors.getPropertyValue('--primary');
        ctx.beginPath();
        ctx.arc(x + w/2, y - 10, 4, 0, Math.PI * 2);
        ctx.arc(x + w/2, y + h + 10, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (app.mode === 'divide') {
    // Фантомные линии для равномерного деления
    if (app.divideType && app.divideCount) {
      drawDividePhantoms(ctx, section, baseX, baseY, transform.scale);
    }
  } else if (app.mode === 'rod') {
    // Фантом штанги
    drawRodPhantom(ctx, section, baseX, baseY, transform.scale, interior);
  }

  ctx.restore();
}

function drawDividePhantoms(ctx, section, baseX, baseY, scale) {
  const count = app.divideCount;
  
  if (app.divideType === 'shelf') {
    // Горизонтальные полки - показываем count разделителей для count+1 секций
    const totalHeight = section.h;
    const partHeight = (totalHeight - count * CONFIG.PANEL_THICKNESS) / (count + 1);
    
    if (partHeight >= CONFIG.MIN_SECTION) {
      for (let i = 1; i <= count; i++) {
        const pos = section.y + i * partHeight + (i - 1) * CONFIG.PANEL_THICKNESS;
        const x = baseX + section.x * scale;
        const y = baseY + pos * scale;
        const w = section.w * scale;
        const h = CONFIG.PANEL_THICKNESS * scale;
        
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      }
    }
  } else if (app.divideType === 'stand') {
    // Вертикальные стойки - показываем count разделителей для count+1 секций
    const totalWidth = section.w;
    const partWidth = (totalWidth - count * CONFIG.PANEL_THICKNESS) / (count + 1);
    
    if (partWidth >= CONFIG.MIN_SECTION) {
      for (let i = 1; i <= count; i++) {
        const pos = section.x + i * partWidth + (i - 1) * CONFIG.PANEL_THICKNESS;
        const x = baseX + pos * scale;
        const y = baseY + section.y * scale;
        const w = CONFIG.PANEL_THICKNESS * scale;
        const h = section.h * scale;
        
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      }
    }
  } else if (app.divideType === 'rod') {
    // Штанги - показываем несколько штанг в секции
    if (section.w >= CONFIG.MIN_ROD_LENGTH && section.h >= count * 100) {
      const spacing = section.h / (count + 1);
      
      for (let i = 1; i <= count; i++) {
        const y = section.y + spacing * i;
        const x = baseX + (section.x + 20) * scale;
        const rodY = baseY + y * scale;
        const length = (section.w - 40) * scale;
        const diameter = Math.max(3, CONFIG.ROD_DIAMETER * scale);
        
        // Основная штанга
        ctx.fillRect(x, rodY - diameter/2, length, diameter);
        ctx.strokeRect(x, rodY - diameter/2, length, diameter);
        
        // Крепления
        const mountSize = diameter * 1.2;
        ctx.beginPath();
        ctx.arc(x, rodY, mountSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x + length, rodY, mountSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }
}

// Фантом одиночной штанги
function drawRodPhantom(ctx, section, baseX, baseY, scale, interior) {
  if (section.w < CONFIG.MIN_ROD_LENGTH) return;
  
  // Позиция штанги по высоте (следует за мышью)
  let rodY = interior.y;
  
  // Ограничиваем позицию в пределах секции
  rodY = Math.max(section.y + 50, Math.min(section.y + section.h - 50, rodY));
  
  const x = baseX + (section.x + 20) * scale;
  const y = baseY + rodY * scale;
  const length = (section.w - 40) * scale;
  const diameter = Math.max(3, CONFIG.ROD_DIAMETER * scale);
  
  // Основная штанга с градиентом
  const gradient = ctx.createLinearGradient(x, y - diameter/2, x, y + diameter/2);
  gradient.addColorStop(0, 'rgba(240, 240, 240, 0.8)');
  gradient.addColorStop(0.5, 'rgba(192, 192, 192, 0.8)');
  gradient.addColorStop(1, 'rgba(128, 128, 128, 0.8)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y - diameter/2, length, diameter);
  ctx.strokeRect(x, y - diameter/2, length, diameter);
  
  // Крепления
  ctx.fillStyle = 'rgba(96, 96, 96, 0.8)';
  const mountSize = diameter * 1.2;
  
  ctx.beginPath();
  ctx.arc(x, y, mountSize/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(x + length, y, mountSize/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawDimensions(transform) {
  const ctx = app.ctx;
  const cabinet = app.cabinet;

  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.font = '500 12px "SF Mono", "Monaco", "Consolas", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 1;

  // Размеры секций
  cabinet.sections.forEach(section => {
    const baseX = transform.offsetX + CONFIG.PANEL_THICKNESS * transform.scale;
    const baseY = transform.offsetY + CONFIG.PANEL_THICKNESS * transform.scale;
    
    const x = baseX + section.x * transform.scale;
    const y = baseY + section.y * transform.scale;
    const w = section.w * transform.scale;
    const h = section.h * transform.scale;

    // Размер ширины (горизонтально, доходит до панелей)
    const lineY = y + 20;
    const startX = x;
    const endX = x + w;
    
    drawInnerDimensionLine(startX, lineY, endX, lineY, Math.round(section.w), 'horizontal');

    // Размер высоты (вертикально, доходит до панелей)
    const lineX = x + 20;
    const startY = y;
    const endY = y + h;
    
    drawInnerDimensionLine(lineX, startY, lineX, endY, Math.round(section.h), 'vertical');
  });
  
  // Размеры от штанг до ближайших полок
  drawRodDimensions(transform);

  ctx.restore();
}

// Отрисовка размеров от штанг до полок
function drawRodDimensions(transform) {
  const ctx = app.ctx;
  const cabinet = app.cabinet;
  
  if (!cabinet.rods || cabinet.rods.length === 0) return;
  
  const baseX = transform.offsetX + CONFIG.PANEL_THICKNESS * transform.scale;
  const baseY = transform.offsetY + CONFIG.PANEL_THICKNESS * transform.scale;
  
  // Отрисовываем размеры для каждой штанги
  cabinet.rods.forEach(rod => {
    const rodCenterX = baseX + (rod.x + rod.length / 2) * transform.scale;
    const rodY = baseY + rod.y * transform.scale;
    
    // Находим ближайшие полки
    const nearestShelves = cabinet.findNearestShelvesToRod(rod);
    
    // Рисуем размер до верхней полки
    if (nearestShelves.upperShelf && nearestShelves.upperDistance !== Infinity) {
      const shelfY = baseY + (nearestShelves.upperShelf.pos + CONFIG.PANEL_THICKNESS) * transform.scale; // Низ полки
      const distance = Math.round(nearestShelves.upperDistance - CONFIG.PANEL_THICKNESS);
      
      if (distance > 0) {
        // Линия размера слева от штанги
        const lineX = rodCenterX - 30;
        drawRodDimensionLine(lineX, shelfY, lineX, rodY, distance, 'rod-to-shelf');
      }
    }
    
    // Рисуем размер до нижней полки
    if (nearestShelves.lowerShelf && nearestShelves.lowerDistance !== Infinity) {
      const shelfY = baseY + nearestShelves.lowerShelf.pos * transform.scale; // Верх полки
      const distance = Math.round(nearestShelves.lowerDistance - CONFIG.PANEL_THICKNESS);
      
      if (distance > 0) {
        // Линия размера справа от штанги
        const lineX = rodCenterX + 30;
        drawRodDimensionLine(lineX, rodY, lineX, shelfY, distance, 'rod-to-shelf');
      }
    }
  });
}

// Отрисовка специальной размерной линии для штанг
function drawRodDimensionLine(x1, y1, x2, y2, value, type) {
  const ctx = app.ctx;
  
  ctx.save();
  
  // Особый стиль для размеров штанг
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#ff6b35'; // Оранжевый цвет для выделения
  ctx.fillStyle = '#ff6b35';
  ctx.setLineDash([2, 3]); // Пунктирная линия
  
  // Основная линия размера
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Сбрасываем пунктир для стрелок
  ctx.setLineDash([]);
  
  // Стрелки на концах
  const arrowSize = 4;
  
  // Верхняя стрелка
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - arrowSize, y1 + arrowSize);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + arrowSize, y1 + arrowSize);
  ctx.stroke();
  
  // Нижняя стрелка
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - arrowSize, y2 - arrowSize);
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 + arrowSize, y2 - arrowSize);
  ctx.stroke();
  
  // Текст размера
  const textX = x1 + 15; // Смещение текста вправо от линии
  const textY = (y1 + y2) / 2;
  
  // Белый фон под текстом
  ctx.save();
  ctx.font = '500 11px "SF Mono", "Monaco", "Consolas", monospace';
  const metrics = ctx.measureText(value.toString());
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(
    textX - metrics.width/2 - 2,
    textY - 6,
    metrics.width + 4,
    12
  );
  ctx.restore();
  
  // Основной текст размера
  ctx.fillStyle = '#ff6b35';
  ctx.font = '500 11px "SF Mono", "Monaco", "Consolas", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value.toString(), textX, textY);
  
  ctx.restore();
}

function drawInnerDimensionLine(x1, y1, x2, y2, value, orientation) {
  const ctx = app.ctx;
  
  ctx.save();
  
  // Пунктирная линия (черная)
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.setLineDash([3, 2]); // Пунктир
  
  // Основная линия
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Сбрасываем пунктир для стрелок
  ctx.setLineDash([]);
  
  // Инженерные стрелки (короткие черточки)
  const tickLength = 6;
  
  if (orientation === 'horizontal') {
    // Левая вертикальная черточка
    ctx.beginPath();
    ctx.moveTo(x1, y1 - tickLength/2);
    ctx.lineTo(x1, y1 + tickLength/2);
    ctx.stroke();
    
    // Правая вертикальная черточка
    ctx.beginPath();
    ctx.moveTo(x2, y2 - tickLength/2);
    ctx.lineTo(x2, y2 + tickLength/2);
    ctx.stroke();
    
    // Текст (черный, моноширинный)
    const textX = (x1 + x2) / 2;
    const textY = y1 - 12;
    
    // Белый фон под текстом
    ctx.save();
    ctx.font = '500 12px "SF Mono", "Monaco", "Consolas", monospace';
    const metrics = ctx.measureText(value.toString());
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      textX - metrics.width/2 - 2,
      textY - 6,
      metrics.width + 4,
      12
    );
    ctx.restore();
    
    // Основной текст
    ctx.fillStyle = '#000000';
    ctx.font = '500 12px "SF Mono", "Monaco", "Consolas", monospace';
    ctx.fillText(value.toString(), textX, textY);
    
  } else { // vertical
    // Верхняя горизонтальная черточка
    ctx.beginPath();
    ctx.moveTo(x1 - tickLength/2, y1);
    ctx.lineTo(x1 + tickLength/2, y1);
    ctx.stroke();
    
    // Нижняя горизонтальная черточка
    ctx.beginPath();
    ctx.moveTo(x2 - tickLength/2, y2);
    ctx.lineTo(x2 + tickLength/2, y2);
    ctx.stroke();
    
    // Текст (повернутый)
    const textX = x1 - 12;
    const textY = (y1 + y2) / 2;
    
    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(-Math.PI / 2);
    
    // Белый фон под текстом
    ctx.font = '500 12px "SF Mono", "Monaco", "Consolas", monospace';
    const metrics = ctx.measureText(value.toString());
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      -metrics.width/2 - 2,
      -6,
      metrics.width + 4,
      12
    );
    
    // Основной текст
    ctx.fillStyle = '#000000';
    ctx.font = '500 12px "SF Mono", "Monaco", "Consolas", monospace';
    ctx.fillText(value.toString(), 0, 0);
    
    ctx.restore();
  }
  
  ctx.restore();
}

function animate() {
  if (Math.abs(app.scale - app.targetScale) > 0.01) {
    app.scale += (app.targetScale - app.scale) * 0.2;
    render();
    requestAnimationFrame(animate);
  } else {
    app.scale = app.targetScale;
  }
}

// Анимационный цикл для фантомной линии
function phantomAnimationLoop() {
  if (app.hoveredSection && (app.mode === 'shelf' || app.mode === 'stand' || app.mode === 'rod')) {
    render();
    requestAnimationFrame(phantomAnimationLoop);
  }
}