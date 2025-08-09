/**
 * Конфигурация приложения Cabinet Designer
 */
const CONFIG = {
  PANEL_THICKNESS: 16,
  MIN_SECTION: 100,
  PADDING: 60,
  // Настройки для штанг
  ROD_DIAMETER: 12,
  ROD_HEIGHT_FROM_BOTTOM: 1800, // стандартная высота для штанг
  MIN_ROD_LENGTH: 300 // минимальная длина штанги
};

/**
 * Глобальное состояние приложения
 */
let app = {
  cabinet: null,
  mode: 'none',
  showDimensions: false,
  draggedDivider: null,
  draggedRod: null,
  hoveredDivider: null,
  selectedDivider: null,
  selectedRod: null,
  hoveredSection: null,
  hoveredRod: null,
  mousePos: { x: 0, y: 0 },
  canvas: null,
  ctx: null,
  scale: 1,
  targetScale: 1,
  // Переменные для равномерного деления
  divideType: null, // 'shelf', 'stand' или 'rod'
  divideCount: null, // 2, 3, 4, 5
  // Переменные для интерактивного редактирования размеров
  resizeMode: null, // 'width', 'height', 'depth', 'base'
  draggedWall: null, // 'left', 'right', 'top', 'bottom', 'base'
  hoveredWall: null,
  initialMousePos: { x: 0, y: 0 },
  initialDimension: 0,
  originalState: null, // Сохраняем оригинальное состояние для preview
  // Обработчик изменения размеров
  resizeHandler: null,
  // 3D переменные
  currentView: '2d', // '2d' или '3d'
  canvas3d: null,
  renderer3d: null
};