/**
 * Класс для представления шкафа и его компонентов
 */
class Cabinet {
  constructor(width, height, depth, base) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.base = base;
    this.dividers = [];
    this.rods = []; // штанги для вешалок
    this.updateSections();
  }

  get interiorWidth() {
    return this.width - 2 * CONFIG.PANEL_THICKNESS;
  }

  get interiorHeight() {
    return this.height - this.base - 2 * CONFIG.PANEL_THICKNESS;
  }

  updateSections() {
    this.sections = this.calculateSections();
    // Обновляем sectionId для всех штанг
    this.updateRodSectionIds();
  }

  // Обновляем внутренние размеры после изменения габаритов
  updateInteriorDimensions() {
    // Стратегия: сохраняем все разделители, но корректируем их позиции и размеры
    // Изменение размера происходит за счет крайних секций
    
    this.dividers.forEach(divider => {
      if (divider.type === 'v') {
        // Для вертикальных разделителей
        const maxPos = this.interiorWidth - CONFIG.PANEL_THICKNESS;
        
        // Если разделитель выходит за границы, сдвигаем его внутрь
        if (divider.pos > maxPos) {
          divider.pos = maxPos;
        }
        
        // Корректируем границы по высоте
        if (divider.end > this.interiorHeight) {
          divider.end = this.interiorHeight;
        }
        
        // Проверяем минимальные размеры секций слева и справа
        const leftSpace = divider.pos;
        const rightSpace = this.interiorWidth - divider.pos - CONFIG.PANEL_THICKNESS;
        
        if (leftSpace < CONFIG.MIN_SECTION) {
          divider.pos = CONFIG.MIN_SECTION;
        }
        if (rightSpace < CONFIG.MIN_SECTION) {
          divider.pos = this.interiorWidth - CONFIG.MIN_SECTION - CONFIG.PANEL_THICKNESS;
        }
      } else {
        // Для горизонтальных разделителей
        const maxPos = this.interiorHeight - CONFIG.PANEL_THICKNESS;
        
        // Если разделитель выходит за границы, сдвигаем его внутрь
        if (divider.pos > maxPos) {
          divider.pos = maxPos;
        }
        
        // Корректируем границы по ширине
        if (divider.end > this.interiorWidth) {
          divider.end = this.interiorWidth;
        }
        
        // Проверяем минимальные размеры секций сверху и снизу
        const topSpace = divider.pos;
        const bottomSpace = this.interiorHeight - divider.pos - CONFIG.PANEL_THICKNESS;
        
        if (topSpace < CONFIG.MIN_SECTION) {
          divider.pos = CONFIG.MIN_SECTION;
        }
        if (bottomSpace < CONFIG.MIN_SECTION) {
          divider.pos = this.interiorHeight - CONFIG.MIN_SECTION - CONFIG.PANEL_THICKNESS;
        }
      }
    });
    
    // Теперь проверяем случаи, когда разделители могут пересекаться после корректировки
    this.resolveDividerConflicts();
    
    // Пересчитываем секции
    this.updateSections();
  }

  // Разрешение конфликтов между разделителями после изменения размера
  resolveDividerConflicts() {
    // Сортируем вертикальные разделители по позиции
    const verticalDividers = this.dividers
      .filter(d => d.type === 'v')
      .sort((a, b) => a.pos - b.pos);
    
    // Проверяем и корректируем пересечения вертикальных разделителей
    for (let i = 0; i < verticalDividers.length - 1; i++) {
      const current = verticalDividers[i];
      const next = verticalDividers[i + 1];
      
      const minDistance = CONFIG.PANEL_THICKNESS + CONFIG.MIN_SECTION;
      if (next.pos - current.pos < minDistance) {
        // Пробуем сдвинуть следующий разделитель вправо
        const newNextPos = current.pos + minDistance;
        if (newNextPos + CONFIG.PANEL_THICKNESS + CONFIG.MIN_SECTION <= this.interiorWidth) {
          next.pos = newNextPos;
        } else {
          // Если не помещается, удаляем один из разделителей
          const currentIndex = this.dividers.indexOf(current);
          this.dividers.splice(currentIndex, 1);
        }
      }
    }
    
    // Аналогично для горизонтальных разделителей
    const horizontalDividers = this.dividers
      .filter(d => d.type === 'h')
      .sort((a, b) => a.pos - b.pos);
    
    for (let i = 0; i < horizontalDividers.length - 1; i++) {
      const current = horizontalDividers[i];
      const next = horizontalDividers[i + 1];
      
      const minDistance = CONFIG.PANEL_THICKNESS + CONFIG.MIN_SECTION;
      if (next.pos - current.pos < minDistance) {
        // Пробуем сдвинуть следующий разделитель вниз
        const newNextPos = current.pos + minDistance;
        if (newNextPos + CONFIG.PANEL_THICKNESS + CONFIG.MIN_SECTION <= this.interiorHeight) {
          next.pos = newNextPos;
        } else {
          // Если не помещается, удаляем один из разделителей
          const currentIndex = this.dividers.indexOf(current);
          this.dividers.splice(currentIndex, 1);
        }
      }
    }
  }

  calculateSections() {
    let sections = [{ x: 0, y: 0, w: this.interiorWidth, h: this.interiorHeight }];

    this.dividers.forEach(divider => {
      const newSections = [];
      
      sections.forEach(section => {
        if (divider.type === 'v') {
          if (divider.pos > section.x && divider.pos < section.x + section.w &&
              this.rangesOverlap(divider.start, divider.end, section.y, section.y + section.h)) {
            newSections.push({
              x: section.x, 
              y: section.y,
              w: divider.pos - section.x, 
              h: section.h
            });
            newSections.push({
              x: divider.pos + CONFIG.PANEL_THICKNESS, 
              y: section.y,
              w: section.x + section.w - divider.pos - CONFIG.PANEL_THICKNESS, 
              h: section.h
            });
          } else {
            newSections.push(section);
          }
        } else {
          if (divider.pos > section.y && divider.pos < section.y + section.h &&
              this.rangesOverlap(divider.start, divider.end, section.x, section.x + section.w)) {
            newSections.push({
              x: section.x, 
              y: section.y,
              w: section.w, 
              h: divider.pos - section.y
            });
            newSections.push({
              x: section.x, 
              y: divider.pos + CONFIG.PANEL_THICKNESS,
              w: section.w, 
              h: section.y + section.h - divider.pos - CONFIG.PANEL_THICKNESS
            });
          } else {
            newSections.push(section);
          }
        }
      });
      
      sections = newSections;
    });

    return sections;
  }

  rangesOverlap(a1, a2, b1, b2) {
    return Math.max(a1, b1) < Math.min(a2, b2);
  }

  addDivider(type, pos, start, end) {
    if (!this.canAddDivider(type, pos, start, end)) {
      return false;
    }

    this.dividers.push({ 
      type, 
      pos, 
      start: start, 
      end: end, 
      id: Date.now() 
    });
    
    this.updateSections();
    return true;
  }

  canAddDivider(type, pos, start, end) {
    const section = this.findSectionAt(
      type === 'v' ? pos - 1 : (start + end) / 2,
      type === 'h' ? pos - 1 : (start + end) / 2
    );

    if (!section) return false;

    // Проверяем, есть ли штанги в секции
    if (type === 'v') {
      const sectionIndex = this.sections.indexOf(section);
      const hasRods = this.rods.some(rod => rod.sectionId === sectionIndex);
      
      if (hasRods) {
        return false; // Нельзя добавлять вертикальные стойки в секции со штангами
      }
      
      const leftWidth = pos - section.x;
      const rightWidth = section.x + section.w - pos - CONFIG.PANEL_THICKNESS;
      return leftWidth >= CONFIG.MIN_SECTION && rightWidth >= CONFIG.MIN_SECTION;
    } else {
      const topHeight = pos - section.y;
      const bottomHeight = section.y + section.h - pos - CONFIG.PANEL_THICKNESS;
      return topHeight >= CONFIG.MIN_SECTION && bottomHeight >= CONFIG.MIN_SECTION;
    }
  }

  findSectionAt(x, y) {
    return this.sections.find(s => 
      x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h
    );
  }

  findDividerAt(x, y) {
    const tolerance = 8;
    return this.dividers.find(d => {
      if (d.type === 'v') {
        return Math.abs(x - d.pos) <= tolerance && y >= d.start && y <= d.end;
      } else {
        return Math.abs(y - d.pos) <= tolerance && x >= d.start && x <= d.end;
      }
    });
  }

  moveDivider(dividerId, newPos) {
    const divider = this.dividers.find(d => d.id === dividerId);
    if (!divider) return false;

    const limits = this.getDividerLimits(divider);
    const oldPos = divider.pos;
    divider.pos = Math.max(limits.min, Math.min(limits.max, newPos));
    
    this.updateConnectedDividers(divider, oldPos);
    this.updateSections();
    return true;
  }

  updateConnectedDividers(movedDivider, oldPos) {
    this.dividers.forEach(divider => {
      if (divider.id === movedDivider.id) return;
      
      const tolerance = CONFIG.PANEL_THICKNESS / 2;
      
      if (movedDivider.type === 'v') {
        if (divider.type === 'h') {
          const yRangesOverlap = this.rangesOverlap(movedDivider.start, movedDivider.end, divider.pos - tolerance, divider.pos + tolerance);
          
          if (yRangesOverlap) {
            if (Math.abs(divider.start - oldPos) < tolerance) {
              divider.start = movedDivider.pos;
            } else if (Math.abs(divider.end - oldPos) < tolerance) {
              divider.end = movedDivider.pos;
            } else if (Math.abs(divider.start - (oldPos + CONFIG.PANEL_THICKNESS)) < tolerance) {
              divider.start = movedDivider.pos + CONFIG.PANEL_THICKNESS;
            } else if (Math.abs(divider.end - (oldPos + CONFIG.PANEL_THICKNESS)) < tolerance) {
              divider.end = movedDivider.pos + CONFIG.PANEL_THICKNESS;
            }
          }
        }
      } else {
        if (divider.type === 'v') {
          const xRangesOverlap = this.rangesOverlap(movedDivider.start, movedDivider.end, divider.pos - tolerance, divider.pos + tolerance);
          
          if (xRangesOverlap) {
            if (Math.abs(divider.start - oldPos) < tolerance) {
              divider.start = movedDivider.pos;
            } else if (Math.abs(divider.end - oldPos) < tolerance) {
              divider.end = movedDivider.pos;
            } else if (Math.abs(divider.start - (oldPos + CONFIG.PANEL_THICKNESS)) < tolerance) {
              divider.start = movedDivider.pos + CONFIG.PANEL_THICKNESS;
            } else if (Math.abs(divider.end - (oldPos + CONFIG.PANEL_THICKNESS)) < tolerance) {
              divider.end = movedDivider.pos + CONFIG.PANEL_THICKNESS;
            }
          }
        }
      }
    });
  }

  getDividerLimits(divider) {
    let min, max;
    
    if (divider.type === 'v') {
      min = CONFIG.MIN_SECTION;
      max = this.interiorWidth - CONFIG.MIN_SECTION - CONFIG.PANEL_THICKNESS;
      
      this.dividers.forEach(other => {
        if (other.id !== divider.id && other.type === 'v' &&
            this.rangesOverlap(other.start, other.end, divider.start, divider.end)) {
          if (other.pos < divider.pos) {
            min = Math.max(min, other.pos + CONFIG.PANEL_THICKNESS + CONFIG.MIN_SECTION);
          } else {
            max = Math.min(max, other.pos - CONFIG.MIN_SECTION - CONFIG.PANEL_THICKNESS);
          }
        }
      });
    } else {
      min = CONFIG.MIN_SECTION;
      max = this.interiorHeight - CONFIG.MIN_SECTION - CONFIG.PANEL_THICKNESS;
      
      this.dividers.forEach(other => {
        if (other.id !== divider.id && other.type === 'h' &&
            this.rangesOverlap(other.start, other.end, divider.start, divider.end)) {
          if (other.pos < divider.pos) {
            min = Math.max(min, other.pos + CONFIG.PANEL_THICKNESS + CONFIG.MIN_SECTION);
          } else {
            max = Math.min(max, other.pos - CONFIG.MIN_SECTION - CONFIG.PANEL_THICKNESS);
          }
        }
      });
    }

    return { min, max };
  }

  removeDivider(dividerId) {
    const divider = this.dividers.find(d => d.id === dividerId);
    if (!divider) return false;

    const dependentDividers = this.findDependentDividers(divider);
    
    this.dividers = this.dividers.filter(d => 
      d.id !== dividerId && !dependentDividers.some(dep => dep.id === d.id)
    );
    
    this.updateSections();
    return true;
  }

  findDependentDividers(parentDivider) {
    const dependents = [];
    const processed = new Set();
    
    const findDependentsRecursive = (divider) => {
      if (processed.has(divider.id)) return;
      processed.add(divider.id);
      
      this.dividers.forEach(currentDivider => {
        if (currentDivider.id === divider.id || dependents.some(d => d.id === currentDivider.id)) return;
        
        const tolerance = CONFIG.PANEL_THICKNESS;
        
        if (divider.type === 'v') {
          if (currentDivider.type === 'h') {
            const startsAtDivider = Math.abs(currentDivider.start - divider.pos) < tolerance || 
                                   Math.abs(currentDivider.start - (divider.pos + CONFIG.PANEL_THICKNESS)) < tolerance;
            const endsAtDivider = Math.abs(currentDivider.end - divider.pos) < tolerance || 
                                 Math.abs(currentDivider.end - (divider.pos + CONFIG.PANEL_THICKNESS)) < tolerance;
            
            const intersectsVertically = this.rangesOverlap(
              divider.start, divider.end,
              currentDivider.pos - tolerance, currentDivider.pos + tolerance
            );
            
            if (intersectsVertically && (startsAtDivider || endsAtDivider)) {
              dependents.push(currentDivider);
              findDependentsRecursive(currentDivider);
            }
          }
        } else {
          if (currentDivider.type === 'v') {
            const startsAtDivider = Math.abs(currentDivider.start - divider.pos) < tolerance || 
                                   Math.abs(currentDivider.start - (divider.pos + CONFIG.PANEL_THICKNESS)) < tolerance;
            const endsAtDivider = Math.abs(currentDivider.end - divider.pos) < tolerance || 
                                 Math.abs(currentDivider.end - (divider.pos + CONFIG.PANEL_THICKNESS)) < tolerance;
            
            const intersectsHorizontally = this.rangesOverlap(
              divider.start, divider.end,
              currentDivider.pos - tolerance, currentDivider.pos + tolerance
            );
            
            if (intersectsHorizontally && (startsAtDivider || endsAtDivider)) {
              dependents.push(currentDivider);
              findDependentsRecursive(currentDivider);
            }
          }
        }
      });
    };
    
    findDependentsRecursive(parentDivider);
    
    return dependents;
  }

  getAllParts() {
    const parts = [
      { name: 'Бок левый', w: CONFIG.PANEL_THICKNESS, h: this.height, d: this.depth },
      { name: 'Бок правый', w: CONFIG.PANEL_THICKNESS, h: this.height, d: this.depth },
      { name: 'Дно', w: this.interiorWidth, h: CONFIG.PANEL_THICKNESS, d: this.depth },
      { name: 'Крыша', w: this.interiorWidth, h: CONFIG.PANEL_THICKNESS, d: this.depth },
      { name: 'Цоколь', w: this.interiorWidth, h: this.base, d: CONFIG.PANEL_THICKNESS }
    ];

    let shelfCount = 0;
    let standCount = 0;
    let rodCount = 0;

    this.dividers.forEach(divider => {
      if (divider.type === 'v') {
        standCount++;
        parts.push({
          name: `Стойка ${standCount}`,
          w: CONFIG.PANEL_THICKNESS,
          h: divider.end - divider.start,
          d: this.depth
        });
      } else {
        shelfCount++;
        parts.push({
          name: `Полка ${shelfCount}`,
          w: divider.end - divider.start,
          h: CONFIG.PANEL_THICKNESS,
          d: this.depth
        });
      }
    });

    // Добавляем штанги
    this.rods.forEach(rod => {
      rodCount++;
      parts.push({
        name: `Штанга ${rodCount}`,
        w: rod.length,
        h: CONFIG.ROD_DIAMETER,
        d: CONFIG.ROD_DIAMETER
      });
    });

    return parts;
  }

  // Равномерное деление секции
  divideSection(section, type, count) {
    if (!section || count < 2 || count > 5) return false;

    // Проверяем наличие штанг для вертикальных стоек
    if (type === 'stand') {
      const sectionIndex = this.sections.indexOf(section);
      const hasRods = this.rods.some(rod => rod.sectionId === sectionIndex);
      
      if (hasRods) {
        return false; // Нельзя делить секцию со штангами вертикальными стойками
      }
    }

    if (type === 'shelf') {
      // Деление по высоте (count полок = count+1 секция)
      const sectionsCount = count + 1; // Количество секций = полки + 1
      const totalHeight = section.h;
      const partHeight = (totalHeight - count * CONFIG.PANEL_THICKNESS) / sectionsCount;
      
      if (partHeight < CONFIG.MIN_SECTION) return false;

      // Добавляем count полок (разделителей)
      const baseTime = Date.now();
      for (let i = 1; i <= count; i++) {
        const pos = section.y + i * partHeight + (i - 1) * CONFIG.PANEL_THICKNESS;
        const uniqueId = baseTime + i * 1000;
        this.dividers.push({
          type: 'h',
          pos: pos,
          start: section.x,
          end: section.x + section.w,
          id: uniqueId
        });
      }
    } else {
      // Деление по ширине (count стоек = count+1 секция)
      const sectionsCount = count + 1; // Количество секций = стойки + 1
      const totalWidth = section.w;
      const partWidth = (totalWidth - count * CONFIG.PANEL_THICKNESS) / sectionsCount;
      
      if (partWidth < CONFIG.MIN_SECTION) return false;

      // Добавляем count стоек (разделителей)
      const baseTime = Date.now();
      for (let i = 1; i <= count; i++) {
        const pos = section.x + i * partWidth + (i - 1) * CONFIG.PANEL_THICKNESS;
        const uniqueId = baseTime + i * 1000;
        this.dividers.push({
          type: 'v',
          pos: pos,
          start: section.y,
          end: section.y + section.h,
          id: uniqueId
        });
      }
    }

    this.updateSections();
    return true;
  }

  // Методы для работы со штангами
  addRod(sectionIndex, y = null) {
    if (sectionIndex < 0 || sectionIndex >= this.sections.length) return false;
    
    const section = this.sections[sectionIndex];
    
    // Проверяем минимальную ширину секции
    if (section.w < CONFIG.MIN_ROD_LENGTH) return false;
    
    // Если высота не указана, ставим на стандартной высоте
    if (y === null) {
      const standardHeight = Math.min(CONFIG.ROD_HEIGHT_FROM_BOTTOM, this.height - this.base - 200);
      y = this.interiorHeight - standardHeight + this.base;
    }
    
    // Проверяем, что штанга помещается в секцию
    if (y < section.y + 50 || y > section.y + section.h - 50) {
      y = section.y + section.h * 0.8; // ставим на 80% высоты секции
    }
    
    const rod = {
      id: Date.now(),
      x: section.x + 20, // отступ от края
      y: y,
      length: section.w - 40, // с отступами по 20мм с каждой стороны
      sectionId: sectionIndex
    };
    
    this.rods.push(rod);
    return true;
  }
  
  findRodAt(x, y) {
    const tolerance = 10;
    return this.rods.find(rod => {
      return x >= rod.x - tolerance && 
             x <= rod.x + rod.length + tolerance && 
             Math.abs(y - rod.y) <= tolerance;
    });
  }
  
  removeRod(rodId) {
    const index = this.rods.findIndex(rod => rod.id === rodId);
    if (index === -1) return false;
    
    this.rods.splice(index, 1);
    return true;
  }
  
  moveRod(rodId, newX, newY) {
    const rod = this.rods.find(r => r.id === rodId);
    if (!rod) return false;
    
    // Находим секцию, в которой находится штанга
    const section = this.findSectionAt(newX + rod.length / 2, newY);
    if (!section) return false;
    
    // Проверяем границы
    const minX = section.x + 20;
    const maxX = section.x + section.w - rod.length - 20;
    const minY = section.y + 50;
    const maxY = section.y + section.h - 50;
    
    rod.x = Math.max(minX, Math.min(maxX, newX));
    rod.y = Math.max(minY, Math.min(maxY, newY));
    
    // Обновляем длину штанги под новую секцию
    rod.length = section.w - 40;
    rod.sectionId = this.sections.indexOf(section);
    
    return true;
  }
  
  // Добавление нескольких штанг в секцию (для дропдаунов)
  addMultipleRods(sectionIndex, count) {
    if (count < 1 || count > 3) return false;
    
    const section = this.sections[sectionIndex];
    if (!section || section.h < count * 100) return false; // нужно минимум 100мм на штангу
    
    const spacing = section.h / (count + 1);
    
    for (let i = 1; i <= count; i++) {
      const y = section.y + spacing * i;
      this.addRod(sectionIndex, y);
    }
    
    return true;
  }

  // Найти ближайшие полки к штанге
  findNearestShelvesToRod(rod) {
    const rodCenterX = rod.x + rod.length / 2;
    const rodY = rod.y;
    
    let upperShelf = null;
    let lowerShelf = null;
    let minUpperDistance = Infinity;
    let minLowerDistance = Infinity;
    
    // Проходим по всем горизонтальным разделителям (полкам)
    this.dividers.forEach(divider => {
      if (divider.type === 'h') {
        // Проверяем, пересекается ли полка со штангой по горизонтали
        if (rodCenterX >= divider.start && rodCenterX <= divider.end) {
          const distance = Math.abs(divider.pos - rodY);
          
          if (divider.pos < rodY && distance < minUpperDistance) {
            // Полка сверху
            upperShelf = divider;
            minUpperDistance = distance;
          } else if (divider.pos > rodY && distance < minLowerDistance) {
            // Полка снизу
            lowerShelf = divider;
            minLowerDistance = distance;
          }
        }
      }
    });
    
    return { upperShelf, lowerShelf, upperDistance: minUpperDistance, lowerDistance: minLowerDistance };
  }
  
  // Обновляем sectionId для всех штанг после изменения секций
  updateRodSectionIds() {
    this.rods.forEach(rod => {
      // Находим новую секцию для этой штанги
      const rodCenterX = rod.x + rod.length / 2;
      const section = this.findSectionAt(rodCenterX, rod.y);
      
      if (section) {
        const newSectionId = this.sections.indexOf(section);
        rod.sectionId = newSectionId;
        // Обновляем длину штанги под новую секцию
        rod.x = section.x + 20;
        rod.length = section.w - 40;
      }
    });
  }
  
  // Получить состояние шкафа для сохранения в истории
  getState() {
    return {
      width: this.width,
      height: this.height,
      depth: this.depth,
      base: this.base,
      dividers: this.dividers.map(d => ({ ...d })),
      rods: this.rods.map(r => ({ ...r }))
    };
  }

  // Восстановить состояние шкафа из сохранённого
  setState(state) {
    this.width = state.width;
    this.height = state.height;
    this.depth = state.depth;
    this.base = state.base;
    this.dividers = state.dividers.map(d => ({ ...d }));
    this.rods = (state.rods || []).map(r => ({ ...r }));
    this.updateSections();
  }
}