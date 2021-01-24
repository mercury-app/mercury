import { fabric } from 'fabric';

window.onload = function () {
  'use strict';

  const gridSize = { nColumns: 20, nRows: 10 };
  const colWidth = 200;
  const rowHeight = 200;
  const sceneWidth = gridSize.nColumns * colWidth;
  const sceneHeight = gridSize.nRows * rowHeight;
  const colPadding = colWidth / 5;
  const rowPadding = rowHeight / 5;
  const strokeWidth = 4;
  const colAdjustment = colPadding - (strokeWidth / 2);
  const rowAdjustment = rowPadding - (strokeWidth / 2);

  // We will use this to store positions of all movable objects on the canvas.
  const locationsWithObjects = new Map();

  const canvas = new fabric.Canvas('canvas');
  canvas.selection = false;

  const maxZoom = 2.0;
  const minZoom = Math.min(
    canvas.getWidth() / sceneWidth,
    canvas.getHeight() / sceneHeight);

  function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
  }

  // Code to limit the movements within the scene's boundaries.
  function restrictViewportToScene() {
    const vpt = canvas.viewportTransform;
    const zoom = canvas.getZoom();
    if (zoom < canvas.getWidth() / sceneWidth) {
      vpt[4] = (canvas.getWidth() - sceneWidth * zoom) / 2;
    } else {
      if (vpt[4] >= 0) {
        vpt[4] = 0;
      } else if (vpt[4] < canvas.getWidth() - sceneWidth * zoom) {
        vpt[4] = canvas.getWidth() - sceneWidth * zoom;
      }
    }
    if (zoom < canvas.getHeight() / sceneHeight) {
      vpt[5] = (canvas.getHeight() - sceneHeight * zoom) / 2;
    } else {
      if (vpt[5] >= 0) {
        vpt[5] = 0;
      } else if (vpt[5] < canvas.getHeight() - sceneHeight * zoom) {
        vpt[5] = canvas.getHeight() - sceneHeight * zoom;
      }
    }
  }

  function updateCoordsOfObjects() {
    for (const object of locationsWithObjects.values()) {
      object.setCoords();
    }
  }

  function performZoom(wheelEvent) {
    const delta = wheelEvent.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 1.005 ** delta;
    if (zoom > maxZoom) {
      zoom = maxZoom;
    }
    if (zoom < minZoom) {
      zoom = minZoom;
    }
    canvas.zoomToPoint({ x: wheelEvent.offsetX, y: wheelEvent.offsetY }, zoom);

    wheelEvent.preventDefault();
    wheelEvent.stopPropagation();
    restrictViewportToScene();
  }

  function performScroll(wheelEvent) {
    const deltaX = wheelEvent.deltaX;
    const deltaY = wheelEvent.deltaY;
    const vpt = canvas.viewportTransform;
    if (wheelEvent.shiftKey === true) {
      // Vertical scroll is made horizontal if Shift key is pressed
      vpt[4] = vpt[4] + sceneWidth * (deltaY / 100);
    } else {
      vpt[4] = vpt[4] - sceneWidth * (deltaX / 100);
      vpt[5] = vpt[5] - sceneHeight * (deltaY / 100);
    }

    restrictViewportToScene();
    updateCoordsOfObjects();
    canvas.requestRenderAll();
  }

  canvas.on('mouse:wheel', (options) => {
    if (options.e.ctrlKey === false) {
      performScroll(options.e);
    } else {
      performZoom(options.e);
    }
  });

  canvas.on('mouse:down', (options) => {
    if (!canvas.findTarget(options.e)) {
      canvas.isDragging = true;
      canvas.lastPosX = options.e.clientX;
      canvas.lastPosY = options.e.clientY;
    }
  });

  canvas.on('mouse:move', (options) => {
    if (!canvas.isDragging) {
      return;
    }

    const e = options.e;
    const vpt = canvas.viewportTransform;
    vpt[4] += e.clientX - canvas.lastPosX;
    vpt[5] += e.clientY - canvas.lastPosY;

    restrictViewportToScene();
    updateCoordsOfObjects();
    canvas.requestRenderAll();
    canvas.lastPosX = e.clientX;
    canvas.lastPosY = e.clientY;
  });

  canvas.on('mouse:up', (_options) => {
    // On mouse up we want to recalculate new interaction
    // for all objects, so we call `setViewportTransform`.
    canvas.setViewportTransform(canvas.viewportTransform);
    canvas.isDragging = false;
  });

  function highlight(options) {
    const target = options.target;
    if (!target) {
      return;
    }

    const color = new fabric.Color(target.stroke);
    color.setAlpha(0.3);
    target.set('fill', color.toRgba());
    canvas.renderAll();
  }

  function unhighlight(options) {
    const target = options.target;
    if (!target) {
      return;
    }

    target.set('fill', '#FFFFFF33');
    canvas.renderAll();
  }

  // Set hovering status.
  canvas.on('mouse:over', highlight);
  canvas.on('mouse:out', unhighlight);

  const dragOutline = new fabric.Rect({
    left: 0,
    top: 0,
    width: colWidth,
    height: rowHeight,
    strokeWidth: strokeWidth,
    stroke: 'gray',
    fill: 'white',
    strokeDashArray: [2 * strokeWidth, 2 * strokeWidth],
    selectable: false,
    evented: false,
    objectCaching: false
  });
  dragOutline.visible = false;
  canvas.add(dragOutline);

  function moveDragOutline(col, row) {
    const left = col * colWidth - (strokeWidth / 2);
    const top = row * rowHeight - (strokeWidth / 2);
    dragOutline.set({ left, top });
  }

  // From the current position of the target, find the `left` and `top`
  // coordinates that correspond to the closest cell.
  function coordinatesForCell(target, col, row) {
    const currentBounds = target.getBoundingRect(true);

    const colLeft = col * colWidth + colAdjustment;
    const minLeft = colAdjustment;
    const maxLeft = sceneWidth - currentBounds.width - colAdjustment;
    const left = clamp(colLeft, minLeft, maxLeft);

    const rowTop = row * rowHeight + rowAdjustment;
    const minTop = rowAdjustment;
    const maxTop = sceneHeight - currentBounds.height - rowAdjustment;
    const top = clamp(rowTop, minTop, maxTop);

    return { left, top };
  }

  function findClosestCell(target) {
    const targetCenter = target.getCenterPoint();
    const closestColumn = Math.floor(targetCenter.x / colWidth);
    const closestRow = Math.floor(targetCenter.y / rowHeight);
    const { left, top } = coordinatesForCell(target, closestColumn, closestRow);

    const col = Math.floor(left / colWidth);
    const row = Math.floor(top / rowHeight);

    return { left, top, col, row };
  }

  function locationForCell(cell) {
    return `${cell.col}-${cell.row}`;
  }

  function cellForLocation(location) {
    const vals = location.split('-');
    const col = parseInt(vals[0], 10);
    const row = parseInt(vals[1], 10);
    return { col, row };
  }

  // Prevent shapes from going outside the scene.
  function keepWithinScene(options) {
    const target = options.target;
    if (!target) {
      return;
    }

    target.setCoords();
    let { left, top, width, height } = target.getBoundingRect(true);
    left = clamp(left, colAdjustment, sceneWidth - width - colAdjustment);
    top = clamp(top, rowAdjustment, sceneHeight - height - rowAdjustment);
    target.set({ left, top });
    target.setCoords();

    const cell = findClosestCell(target);
    const location = locationForCell(cell);
    if (
      locationsWithObjects.has(location) &&
      locationsWithObjects.get(location) !== target
    ) {
      dragOutline.set('visible', false);
    } else {
      moveDragOutline(cell.col, cell.row);
      dragOutline.set('visible', true);
    }

    highlight(options);
  }

  canvas.on({
    'object:moving': keepWithinScene,
    'object:scaling': keepWithinScene,
    'object:rotating': keepWithinScene
  });

  // Unhighlight the object if pointer is out of bounds.
  function unhighlightIfOutOfBounds(options, pointer) {
    const target = options.target;
    if (!target) {
      return;
    }

    const mouseInBounds = options.e.target === canvas.getSelectionElement();
    if (mouseInBounds) {
      const { left, top, width, height } = target.getBoundingRect(true);
      const xOutsideTarget = pointer.x < left || pointer.x > left + width;
      const yOutsideTarget = pointer.y < top || pointer.y > top + height;
      if (xOutsideTarget || yOutsideTarget) {
        unhighlight(options);
      }
    } else {
      unhighlight(options);
    }
  }

  function alignToCell(options) {
    const target = options.target;
    if (!target) {
      return;
    }

    let currentCell = null;
    for (const location of locationsWithObjects.keys()) {
      if (locationsWithObjects.get(location) === target) {
        currentCell = cellForLocation(location);
        break;
      }
    }

    const cell = findClosestCell(target);
    if (locationsWithObjects.has(locationForCell(cell))) {
      cell.col = currentCell.col;
      cell.row = currentCell.row;
      const { left, top } = coordinatesForCell(target, cell.col, cell.row);
      cell.left = left;
      cell.top = top;
    } else {
      locationsWithObjects.delete(locationForCell(currentCell));
      locationsWithObjects.set(locationForCell(cell), target);
    }

    // Common animation arguments for both 'left' and 'top' coordinates.
    const pointer = canvas.getPointer(options, false);
    const animationArgs = {
      duration: 250,
      onChange: canvas.renderAll.bind(canvas),
      onComplete: () => unhighlightIfOutOfBounds(options, pointer),
      easing: fabric.util.ease.easeInOutCubic
    };

    target.animate('left', cell.left, animationArgs);
    target.animate('top', cell.top, animationArgs);
    dragOutline.set('visible', false);
  }

  canvas.on({
    'object:moved': alignToCell,
    'object:scaled': alignToCell,
    'object:rotated': alignToCell
  });

  function drawCellMarkers() {
    function makeLine(coords) {
      return new fabric.Line(coords, {
        fill: 'lightgray',
        stroke: 'lightgray',
        strokeWidth: strokeWidth,
        opacity: 0.5,
        selectable: false,
        evented: false,
        objectCaching: false
      });
    }

    const rowMarkerLength = colWidth / 12;
    const colMarkerLength = rowHeight / 12;
    for (let i = 0; i <= gridSize.nColumns; ++i) {
      const colLeft = i * colWidth;
      for (let i = 0; i <= gridSize.nRows; ++i) {
        const rowTop = i * rowHeight;
        const rowMarker = makeLine([
          colLeft - rowMarkerLength,
          rowTop - strokeWidth / 2,
          colLeft + rowMarkerLength,
          rowTop - strokeWidth / 2
        ]);
        canvas.add(rowMarker);
        const colMarker = makeLine([
          colLeft - strokeWidth / 2,
          rowTop - colMarkerLength,
          colLeft - strokeWidth / 2,
          rowTop + colMarkerLength
        ]);
        canvas.add(colMarker);
      }
    }
  }
  drawCellMarkers();

  function setCommonProps(object) {
    object.fill = '#FFFFFF33';
    object.strokeWidth = strokeWidth;
    object.hasControls = false;
    object.hasBorders = false;
  }

  function addCircle(args) {
    const circle = new fabric.Circle(args);
    circle.stroke = 'orangered';
    setCommonProps(circle);

    canvas.add(circle);
    const cell = findClosestCell(circle);
    locationsWithObjects.set(locationForCell(cell), circle);

    return circle;
  }

  function addRect(args) {
    const rect = new fabric.Rect(args);
    rect.stroke = '#1C75BC';
    setCommonProps(rect);

    canvas.add(rect);
    const cell = findClosestCell(rect);
    locationsWithObjects.set(locationForCell(cell), rect);

    return rect;
  }

  const shapeWidth = colWidth - (2 * colPadding);
  const shapeHeight = rowHeight - (2 * rowPadding);
  addCircle({
    left: colAdjustment,
    top: rowAdjustment,
    radius: shapeWidth / 2
  });
  addRect({
    left: colWidth + colAdjustment,
    top: rowAdjustment,
    width: shapeWidth,
    height: shapeHeight
  });
};
