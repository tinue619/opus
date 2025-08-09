/**
 * 3D рендерер для Cabinet Designer
 * Использует Three.js для создания 3D-просмотра шкафа
 */

class Renderer3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: canvas, 
      antialias: true,
      alpha: true 
    });
    
    this.wireframe = false;
    this.isInitialized = false;
    this.currentMaterial = 'default';
    this.textureLoader = new THREE.TextureLoader();
    this.textures = {};
    
    // Устанавливаем начальные размеры
    this.setCanvasSize();
    
    this.setupScene();
    this.setupControls();
    this.setupLighting();
    this.loadTextures();
    
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  setCanvasSize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Устанавливаем размеры рендерера
    this.renderer.setSize(width, height);
    
    // Обновляем аспект камеры
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setupScene() {
    // Простой светлый фон
    this.scene.background = new THREE.Color(0xffffff);
    
    // Пол без теней
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
    const floorMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xf8f8f8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -50;
    this.scene.add(floor);
  }

  setupControls() {
    // Простые орбитальные контролы
    this.mouse = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.rotation = { x: -0.4, y: 0.8 }; // Лучший начальный угол
    this.distance = 800; // Уменьшаем начальную дистанцию
    this.target = { x: 0, y: 0, z: 0 };
    
    // Привязываем события именно к canvas
    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isMouseDown = true;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    });
    
    // Обработчик движения мыши для всего документа
    document.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        e.preventDefault();
        const deltaX = e.clientX - this.mouse.x;
        const deltaY = e.clientY - this.mouse.y;
        
        // Меняем направление вращения на противоположное
        this.rotation.y -= deltaX * 0.008;
        this.rotation.x += deltaY * 0.008;
        
        // Ограничиваем вертикальный поворот
        this.rotation.x = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.rotation.x));
        
        this.updateCamera();
        this.renderer.render(this.scene, this.camera);
        
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      }
    });
    
    // Обработчик отпускания мыши для всего документа
    document.addEventListener('mouseup', (e) => {
      if (this.isMouseDown) {
        this.isMouseDown = false;
        this.canvas.style.cursor = 'default';
      }
    });
    
    // Обработчик колеса мыши
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.distance += e.deltaY * 0.5;
      this.distance = Math.max(200, Math.min(2000, this.distance));
      this.updateCamera();
      this.renderer.render(this.scene, this.camera);
    });
    
    // Предотвращаем контекстное меню
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  updateCamera() {
    const x = this.distance * Math.sin(this.rotation.y) * Math.cos(this.rotation.x);
    const y = this.distance * Math.sin(this.rotation.x);
    const z = this.distance * Math.cos(this.rotation.y) * Math.cos(this.rotation.x);
    
    this.camera.position.set(
      this.target.x + x, 
      this.target.y + y, 
      this.target.z + z
    );
    this.camera.lookAt(this.target.x, this.target.y, this.target.z);
  }

  setupLighting() {
    // Основное равномерное освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);
    
    // Очень мягкий направленный свет для легких собственных теней
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.15);
    directionalLight.position.set(1, 1, 0.5);
    this.scene.add(directionalLight);
  }

  // Метод для загрузки текстур
  loadTextures() {
    // Используем латинские имена файлов для совместимости
    const textureMapping = {
      'Белый': 'white',
      'Антрацит': 'anthracite', 
      'Венге': 'wenge',
      'Дуб Сонома': 'oak-sonoma'
    };
    
    const textureNames = Object.keys(textureMapping);
    
    console.log('📁 Начинаем загрузку текстур...');
    console.log('🌐 Текущий URL:', window.location.href);
    
    // Проверяем текущую страницу (для отладки)
    console.log(`📍 Текущая страница: ${window.location.href}`);
    console.log(`📁 Базовый URL: ${window.location.origin}${window.location.pathname}`);
    
    textureNames.forEach((displayName, index) => {
      const fileName = textureMapping[displayName];
      
      // Пробуем разные пути к текстурам
      const possiblePaths = [
        `docs/Текстуры/${fileName}.jpg`,
        `./docs/Текстуры/${fileName}.jpg`,
        `docs/${fileName}.jpg`,
        `./docs/${fileName}.jpg`,
        `./${fileName}.jpg`,
        `${fileName}.jpg`,
        `../docs/Текстуры/${fileName}.jpg`,
        `../docs/${fileName}.jpg`
      ];
      
      // Сразу создаем fallback текстуру, чтобы материалы работали сразу
      this.createFallbackTexture(displayName);
      
      let currentPathIndex = 0;
      let textureLoaded = false;
      
      const tryLoadTexture = () => {
        if (currentPathIndex >= possiblePaths.length) {
          if (!textureLoaded) {
            console.warn(`⚠️ Используем fallback текстуру для ${displayName} (не удалось загрузить изображение)`);
          }
          return;
        }
        
        const currentPath = possiblePaths[currentPathIndex];
        console.log(`🔍 [Попытка ${currentPathIndex + 1}/${possiblePaths.length}] Загружаем ${displayName}: ${currentPath}`);
        
        // Создаём новый экземпляр TextureLoader для каждой текстуры
        const loader = new THREE.TextureLoader();
        
        const texture = loader.load(
          currentPath,
          // onLoad - успешная загрузка
          (loadedTexture) => {
            textureLoaded = true;
            console.log(`✅ Успешно загружен ${displayName} с пути: ${currentPath}`);
            console.log(`🖼️ Размер: ${loadedTexture.image.width}x${loadedTexture.image.height}px`);
            
            // Основные настройки для чистой текстуры
            loadedTexture.wrapS = THREE.RepeatWrapping;
            loadedTexture.wrapT = THREE.RepeatWrapping;
            loadedTexture.repeat.set(1, 1);
            loadedTexture.flipY = false;
            
            // Заменяем fallback на реальную текстуру
            this.textures[displayName] = loadedTexture;
            
            // Обновляем сцену, если этот материал сейчас активен
            if (this.currentMaterial === displayName) {
              console.log(`🔄 Обновляем сцену с новой текстурой ${displayName}`);
              this.changeMaterial(displayName);
            }
          },
          // onProgress
          (progress) => {
            if (progress.total > 0) {
              const percent = Math.round(progress.loaded / progress.total * 100);
              console.log(`⏳ Прогресс ${name}: ${percent}%`);
            }
          },
          // onError - ошибка загрузки
          (error) => {
            console.error(`❌ Ошибка загрузки ${displayName} с пути ${currentPath}:`);
            console.error('ℹ️ Тип ошибки:', error.type || 'unknown');
            console.error('ℹ️ Полная ошибка:', error);
            
            // Проверяем, существует ли файл
            fetch(currentPath, { method: 'HEAD' })
              .then(response => {
                if (!response.ok) {
                  console.warn(`⚠️ Файл ${currentPath} не найден (${response.status})`);
                } else {
                  console.log(`ℹ️ Файл ${currentPath} существует, но не может быть загружен как текстура`);
                }
              })
              .catch(fetchError => {
                console.warn(`⚠️ Не удалось проверить существование файла ${currentPath}:`, fetchError.message);
              });
            
            currentPathIndex++;
            setTimeout(() => tryLoadTexture(), 100);
          }
        );
        
        // Не используем crossOrigin для локальных файлов
        // texture.crossOrigin = 'anonymous';
      };
      
      // Начинаем загрузку с задержкой, чтобы не перегружать браузер
      setTimeout(() => tryLoadTexture(), index * 200);
    });
  }
  
  // Создание fallback текстуры на основе цвета
  createFallbackTexture(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; // Увеличиваем разрешение для лучшего качества
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Цвета для разных материалов (более контрастные)
    const colors = {
      'Белый': { 
        base: '#f5f5f5', 
        accent: '#e0e0e0', 
        dark: '#cccccc',
        grain: '#d8d8d8'
      },
      'Антрацит': { 
        base: '#2a2a2a', 
        accent: '#1a1a1a', 
        dark: '#0a0a0a',
        grain: '#404040'
      },
      'Венге': { 
        base: '#4a2c1a', 
        accent: '#3a1c0a', 
        dark: '#2a0c00',
        grain: '#5a3c2a'
      },
      'Дуб Сонома': { 
        base: '#dcc49a', 
        accent: '#c4b48a', 
        dark: '#a49470',
        grain: '#e4cc9a'
      }
    };
    
    const colorSet = colors[name] || { 
      base: '#d4d4aa', 
      accent: '#c4c49a', 
      dark: '#b4b48a',
      grain: '#e4e4ba'
    };
    
    // Основной фон
    ctx.fillStyle = colorSet.base;
    ctx.fillRect(0, 0, 512, 512);
    
    // Создаем текстуру дерева (волокна)
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 60; i++) {
      const y = i * 8 + Math.random() * 6;
      const opacity = 0.2 + Math.random() * 0.6;
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = colorSet.accent;
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      
      // Создаем волнистые линии для имитации волокон дерева
      for (let x = 0; x <= 512; x += 8) {
        const waveY = y + Math.sin(x * 0.01 + i * 0.5) * 3;
        ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }
    
    // Добавляем сучки и направление волокон
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = colorSet.dark;
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = 4 + Math.random() * 12;
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * 0.7, Math.random() * Math.PI, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Добавляем зернистость
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = colorSet.grain;
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 2;
      ctx.fillRect(x, y, size, size);
    }
    
    // Добавляем надпись для идентификации fallback текстур (только в режиме отладки)
    // ctx.globalAlpha = 0.3;
    // ctx.fillStyle = colorSet.dark;
    // ctx.font = '20px Arial';
    // ctx.textAlign = 'center';
    // ctx.fillText(`FALLBACK: ${name}`, 256, 256);
    
    ctx.globalAlpha = 1;
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1); // Соответствуем основным текстурам
    texture.minFilter = THREE.LinearFilter; // Убираем mipmap для устранения ряби
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false; // Отключаем mipmap
    texture.flipY = false;
    
    this.textures[name] = texture;
    console.log(`🎨 Создана улучшенная fallback текстура для ${name}`);
  }
  
  // Вспомогательная функция для изменения яркости цвета
  adjustBrightness(hex, amount) {
    const color = hex.replace('#', '');
    const num = parseInt(color, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  // Метод для смены материала
  changeMaterial(materialName) {
    this.currentMaterial = materialName;
    
    // Обновляем все материалы на сцене
    this.scene.children.forEach(child => {
      if (child.userData.isCabinetPart) {
        // Для групп ищем mesh и обновляем линии
        if (child.type === 'Group') {
          const mesh = child.children.find(c => c.type === 'Mesh');
          const lines = child.children.find(c => c.type === 'LineSegments');
          
          if (mesh) {
            const newMaterial = this.createMaterialForPart(child.userData.partType);
            mesh.material = newMaterial;
          }
          
          if (lines) {
            // Обновляем прозрачность линий
            lines.material.opacity = this.wireframe ? 0.8 : 0.2;
          }
        } else if (child.material) {
          const newMaterial = this.createMaterialForPart(child.userData.partType);
          child.material = newMaterial;
        }
      }
    });
    
    // Принудительно перерисовываем сцену
    this.renderer.render(this.scene, this.camera);
    
    // Показываем уведомление
    const displayName = materialName === 'default' ? 'Обычный' : materialName;
    showNotification(`Материал: ${displayName}`, 'info');
  }

  render(cabinet) {
    if (!cabinet) return;

    // Очищаем сцену от предыдущих объектов шкафа
    const objectsToRemove = this.scene.children.filter(child => child.userData.isCabinetPart);
    objectsToRemove.forEach(obj => this.scene.remove(obj));

    // Создаем материалы
    const materials = this.createMaterials();

    // Конвертируем координаты (мм в три.js единицы, центрируем)
    const scale = 0.1; // 1мм = 0.1 unit
    const centerX = 0;
    const centerY = cabinet.height * scale / 2 - 5; // Поднимаем над полом
    const centerZ = 0;

    // Автоматически адаптируем дистанцию камеры
    const maxDimension = Math.max(cabinet.width, cabinet.height, cabinet.depth) * scale;
    if (!this.isInitialized) {
      this.distance = maxDimension * 2; // Автоматическое масштабирование
      this.distance = Math.max(400, Math.min(1500, this.distance)); // Ограничиваем
    }

    // Устанавливаем цель камеры на центр шкафа
    this.target = { x: centerX, y: centerY * 0.7, z: centerZ };

    this.createCarcass(cabinet, materials, scale, centerX, centerY, centerZ);
    this.createDividers(cabinet, materials, scale, centerX, centerY, centerZ);
    this.createRods(cabinet, materials, scale, centerX, centerY, centerZ);

    // Обновляем камеру и рендерим
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
    
    if (!this.isInitialized) {
      this.isInitialized = true;
      this.animate();
    }
  }

  createMaterials() {
    return {
      panel: this.createMaterialForPart('panel'),
      side: this.createMaterialForPart('side'),
      top: this.createMaterialForPart('top'),
      bottom: this.createMaterialForPart('bottom'),
      shelf: this.createMaterialForPart('shelf'),
      stand: this.createMaterialForPart('stand'),
      rod: this.createMaterialForPart('rod'),
      base: this.createMaterialForPart('base')
    };
  }

  // Метод для создания материала для конкретной части
  createMaterialForPart(partType) {
    const isTextured = this.currentMaterial !== 'default' && this.textures[this.currentMaterial];
    
    console.log(`🎨 Создаем материал для ${partType}, текущий материал: ${this.currentMaterial}, текстура доступна: ${isTextured}`);
    
    if (this.wireframe) {
      // Каркасный режим - используем простые линии вместо wireframe материала
      const colors = {
        panel: 0x888888,
        side: 0x888888,
        top: 0x888888,
        bottom: 0x888888,
        shelf: 0x666666,
        stand: 0x666666,
        rod: 0x444444,
        base: 0x333333
      };
      return new THREE.MeshBasicMaterial({ 
        color: colors[partType] || 0x888888,
        transparent: true,
        opacity: 0.1  // Полупрозрачные панели
      });
    }
    
    // Определяем, какие части могут иметь текстуры (все деревянные части)
    const woodenParts = ['panel', 'side', 'top', 'bottom', 'shelf', 'stand', 'base'];
    
    if (isTextured && woodenParts.includes(partType)) {
      // Используем текстуру для деревянных частей
      console.log(`✨ Применяем текстуру ${this.currentMaterial} к ${partType}`);
      
      // Клонируем текстуру для независимых настроек
      const texture = this.textures[this.currentMaterial].clone();
      
      // Минимальные настройки
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      
      // Поворот текстуры для вертикальных элементов
      if (partType === 'side' || partType === 'stand') {
        texture.rotation = Math.PI / 2; // Поворот на 90 градусов
        texture.center.set(0.5, 0.5); // Центр поворота
      }
      
      texture.needsUpdate = true;
      
      return new THREE.MeshLambertMaterial({ 
        map: texture
      });
    } else {
      // Обычные цвета для частей без текстуры или для металлических элементов
      const colors = {
        panel: 0xd4d4aa,
        side: 0xd4d4aa,
        top: 0xd4d4aa,
        bottom: 0xd4d4aa,
        shelf: 0xb8860b,
        stand: 0xa0522d,
        rod: 0xc0c0c0,   // Металлическая штанга остается серой
        base: 0x654321
      };
      console.log(`🎨 Используем обычный цвет для ${partType}: #${colors[partType].toString(16)}`);
      return new THREE.MeshLambertMaterial({ 
        color: colors[partType] || 0xd4d4aa
      });
    }
  }

  createCarcass(cabinet, materials, scale, centerX, centerY, centerZ) {
    const thickness = CONFIG.PANEL_THICKNESS * scale;
    
    // Левая боковина
    const leftSide = this.createBox(
      thickness, 
      cabinet.height * scale, 
      cabinet.depth * scale, 
      materials.side
    );
    leftSide.position.set(
      centerX - cabinet.width * scale / 2 + thickness / 2,
      centerY,
      centerZ
    );
    leftSide.userData.isCabinetPart = true;
    leftSide.userData.partType = 'side';
    leftSide.castShadow = true;
    this.scene.add(leftSide);

    // Правая боковина
    const rightSide = this.createBox(
      thickness, 
      cabinet.height * scale, 
      cabinet.depth * scale, 
      materials.side
    );
    rightSide.position.set(
      centerX + cabinet.width * scale / 2 - thickness / 2,
      centerY,
      centerZ
    );
    rightSide.userData.isCabinetPart = true;
    rightSide.userData.partType = 'side';
    rightSide.castShadow = true;
    this.scene.add(rightSide);

    // Верх
    const top = this.createBox(
      cabinet.interiorWidth * scale, 
      thickness, 
      cabinet.depth * scale, 
      materials.top
    );
    top.position.set(
      centerX,
      centerY + cabinet.height * scale / 2 - thickness / 2,
      centerZ
    );
    top.userData.isCabinetPart = true;
    top.userData.partType = 'top';
    top.castShadow = true;
    this.scene.add(top);

    // Дно (должно быть НА цоколе)
    const bottom = this.createBox(
      cabinet.interiorWidth * scale, 
      thickness, 
      cabinet.depth * scale, 
      materials.bottom
    );
    bottom.position.set(
      centerX,
      centerY - cabinet.height * scale / 2 + cabinet.base * scale + thickness / 2,
      centerZ
    );
    bottom.userData.isCabinetPart = true;
    bottom.userData.partType = 'bottom';
    bottom.castShadow = true;
    this.scene.add(bottom);

    // Цоколь (передняя и задняя части)
    const baseFront = this.createBox(
      cabinet.interiorWidth * scale, 
      cabinet.base * scale, 
      thickness, 
      materials.base
    );
    baseFront.position.set(
      centerX,
      centerY - cabinet.height * scale / 2 + cabinet.base * scale / 2,
      centerZ + cabinet.depth * scale / 2 - thickness / 2
    );
    baseFront.userData.isCabinetPart = true;
    baseFront.userData.partType = 'base';
    baseFront.castShadow = true;
    this.scene.add(baseFront);

    const baseBack = this.createBox(
      cabinet.interiorWidth * scale, 
      cabinet.base * scale, 
      thickness, 
      materials.base
    );
    baseBack.position.set(
      centerX,
      centerY - cabinet.height * scale / 2 + cabinet.base * scale / 2,
      centerZ - cabinet.depth * scale / 2 + thickness / 2
    );
    baseBack.userData.isCabinetPart = true;
    baseBack.userData.partType = 'base';
    baseBack.castShadow = true;
    this.scene.add(baseBack);
  }

  createDividers(cabinet, materials, scale, centerX, centerY, centerZ) {
    const thickness = CONFIG.PANEL_THICKNESS * scale;
    
    // Полки (горизонтальные разделители)
    cabinet.dividers.filter(d => d.type === 'h').forEach(divider => {
      const shelf = this.createBox(
        (divider.end - divider.start) * scale, 
        thickness, 
        cabinet.depth * scale, 
        materials.shelf
      );
      
      // ИСПРАВЛЕНИЕ: В логике шкафа Y=0 наверху интерьера, но в 3D Y=0 внизу
      // Нужно инвертировать Y координату: interiorHeight - divider.pos
      const correctedY = cabinet.interiorHeight - divider.pos;
      
      shelf.position.set(
        centerX - cabinet.interiorWidth * scale / 2 + (divider.start + divider.end) * scale / 2,
        centerY - cabinet.height * scale / 2 + cabinet.base * scale + CONFIG.PANEL_THICKNESS * scale + correctedY * scale - thickness / 2,
        centerZ
      );
      shelf.userData.isCabinetPart = true;
      shelf.userData.partType = 'shelf';
      shelf.castShadow = true;
      this.scene.add(shelf);
    });

    // Стойки (вертикальные разделители)
    cabinet.dividers.filter(d => d.type === 'v').forEach(divider => {
      const stand = this.createBox(
        thickness, 
        (divider.end - divider.start) * scale, 
        cabinet.depth * scale, 
        materials.stand
      );
      
      // Для вертикальных стоек тоже нужно инвертировать Y координаты
      const correctedStart = cabinet.interiorHeight - divider.end;
      const correctedEnd = cabinet.interiorHeight - divider.start;
      
      stand.position.set(
        centerX - cabinet.interiorWidth * scale / 2 + divider.pos * scale + thickness / 2,
        centerY - cabinet.height * scale / 2 + cabinet.base * scale + CONFIG.PANEL_THICKNESS * scale + (correctedStart + correctedEnd) * scale / 2,
        centerZ
      );
      stand.userData.isCabinetPart = true;
      stand.userData.partType = 'stand';
      stand.castShadow = true;
      this.scene.add(stand);
    });
  }

  createRods(cabinet, materials, scale, centerX, centerY, centerZ) {
    if (!cabinet.rods) return;
    
    cabinet.rods.forEach(rod => {
      // Основная штанга
      const rodGeometry = new THREE.CylinderGeometry(
        0.6 * scale, 0.6 * scale, rod.length * scale, 12
      );
      const rodMesh = new THREE.Mesh(rodGeometry, materials.rod);
      rodMesh.rotation.z = Math.PI / 2;
      
      // ИСПРАВЛЕНИЕ: Инвертируем Y координату для штанг
      const correctedRodY = cabinet.interiorHeight - rod.y;
      
      rodMesh.position.set(
        centerX - cabinet.interiorWidth * scale / 2 + (rod.x + rod.length / 2) * scale,
        centerY - cabinet.height * scale / 2 + cabinet.base * scale + CONFIG.PANEL_THICKNESS * scale + correctedRodY * scale,
        centerZ
      );
      rodMesh.userData.isCabinetPart = true;
      rodMesh.userData.partType = 'rod';
      rodMesh.castShadow = true;
      this.scene.add(rodMesh);

      // Крепления на концах
      const mountGeometry = new THREE.SphereGeometry(1 * scale, 8, 6);
      const mountMaterial = new THREE.MeshLambertMaterial({ 
        color: this.wireframe ? 0x222222 : 0x808080,
        wireframe: this.wireframe 
      });
      
      const leftMount = new THREE.Mesh(mountGeometry, mountMaterial);
      leftMount.position.set(
        centerX - cabinet.interiorWidth * scale / 2 + rod.x * scale,
        centerY - cabinet.height * scale / 2 + cabinet.base * scale + CONFIG.PANEL_THICKNESS * scale + correctedRodY * scale,
        centerZ
      );
      leftMount.userData.isCabinetPart = true;
      leftMount.userData.partType = 'rod-mount';
      leftMount.castShadow = true;
      this.scene.add(leftMount);

      const rightMount = new THREE.Mesh(mountGeometry, mountMaterial);
      rightMount.position.set(
        centerX - cabinet.interiorWidth * scale / 2 + (rod.x + rod.length) * scale,
        centerY - cabinet.height * scale / 2 + cabinet.base * scale + CONFIG.PANEL_THICKNESS * scale + correctedRodY * scale,
        centerZ
      );
      rightMount.userData.isCabinetPart = true;
      rightMount.userData.partType = 'rod-mount';
      rightMount.castShadow = true;
      this.scene.add(rightMount);
    });
  }

  createBox(width, height, depth, material) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, material);
    
    // Используем только контур без диагоналей - создаем линии вручную
    const halfW = width / 2;
    const halfH = height / 2;
    const halfD = depth / 2;
    
    // 8 углов куба
    const corners = [
      [-halfW, -halfH, -halfD], // 0: левый нижний задний
      [ halfW, -halfH, -halfD], // 1: правый нижний задний  
      [ halfW,  halfH, -halfD], // 2: правый верхний задний
      [-halfW,  halfH, -halfD], // 3: левый верхний задний
      [-halfW, -halfH,  halfD], // 4: левый нижний передний
      [ halfW, -halfH,  halfD], // 5: правый нижний передний
      [ halfW,  halfH,  halfD], // 6: правый верхний передний
      [-halfW,  halfH,  halfD]  // 7: левый верхний передний
    ];
    
    // 12 ребер куба (без диагоналей)
    const edges = [
      // Задняя грань
      [0, 1], [1, 2], [2, 3], [3, 0],
      // Передняя грань
      [4, 5], [5, 6], [6, 7], [7, 4],
      // Соединяющие ребра
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    
    const edgeGeometry = new THREE.BufferGeometry();
    const positions = [];
    
    edges.forEach(edge => {
      const [i, j] = edge;
      positions.push(...corners[i], ...corners[j]);
    });
    
    edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: 0x000000, 
      transparent: true,
      opacity: this.wireframe ? 0.8 : 0.2
    });
    const wireframe = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    
    const group = new THREE.Group();
    group.add(mesh);
    group.add(wireframe);
    
    return group;
  }

  resetView() {
    this.rotation = { x: -0.4, y: 0.8 }; // Оптимальный угол обзора
    this.distance = 800; // Оптимальная дистанция
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
    showNotification('Вид сброшен', 'info');
  }

  toggleWireframe() {
    this.wireframe = !this.wireframe;
    
    // Обновляем все материалы
    this.scene.children.forEach(child => {
      if (child.userData.isCabinetPart) {
        // Для групп ищем mesh и обновляем линии
        if (child.type === 'Group') {
          const mesh = child.children.find(c => c.type === 'Mesh');
          const lines = child.children.find(c => c.type === 'LineSegments');
          
          if (mesh) {
            const newMaterial = this.createMaterialForPart(child.userData.partType);
            mesh.material = newMaterial;
          }
          
          if (lines) {
            // Обновляем прозрачность линий
            lines.material.opacity = this.wireframe ? 0.8 : 0.2;
          }
        } else if (child.material) {
          const newMaterial = this.createMaterialForPart(child.userData.partType);
          child.material = newMaterial;
        }
      }
    });
    
    // Принудительно перерисовываем
    this.renderer.render(this.scene, this.camera);
    showNotification(this.wireframe ? 'Каркасный вид' : 'Обычный вид', 'info');
  }

  onWindowResize() {
    this.setCanvasSize();
    if (this.isInitialized) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Небольшой автоповорот, если не взаимодействуем
    if (!this.isMouseDown && app.currentView === '3d') {
      // this.rotation.y += 0.002; // Раскомментировать для автоповорота
      // this.updateCamera();
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    // Очистка ресурсов
    this.scene.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}

// Экспортируем для использования
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Renderer3D;
}
