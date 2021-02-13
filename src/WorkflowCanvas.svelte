<script lang="ts">
  import { onMount } from "svelte";
  import { fabric } from "fabric";

  // Properties that can be modified by the caller
  export let canvasWidth: number;
  export let canvasHeight: number;
  export let numColumns: number;
  export let numRows: number;
  export let colWidth: number;
  export let rowHeight: number;

  const sceneWidth = numColumns * colWidth;
  const sceneHeight = numRows * rowHeight;
  const colPadding = colWidth / 5;
  const rowPadding = rowHeight / 5;
  const strokeWidth = 4;
  const colAdjustment = colPadding - strokeWidth / 2;
  const rowAdjustment = rowPadding - strokeWidth / 2;

  type Canvas = fabric.Canvas;
  type CanvasObject = fabric.Object;

  interface Point {
    x: number;
    y: number;
  }

  interface Coordinate {
    left: number;
    top: number;
  }

  interface Cell {
    row: number;
    col: number;
  }

  interface EventOptions extends fabric.IEvent {
    e: Event & WheelEvent;
  }

  const clamp = (num: number, min: number, max: number): number => {
    return Math.max(min, Math.min(num, max));
  };

  class WorkflowCanvas {
    private _canvas: Canvas;
    private _locationsWithObjects: Map<string, CanvasObject>;
    private _isObjectMoving: boolean;
    private _isViewMoving: boolean;
    private _mouseIsOnCanvas: boolean;
    private _zoomEnabled: boolean;
    private _viewMoveEnabled: boolean;
    private _scrollEnabled: boolean;
    private _stopViewScrolling: boolean;
    private _maxZoom: number;
    private _minZoom: number;
    private _lastPosX: number;
    private _lastPosY: number;
    private _moveOffsetX: number;
    private _moveOffsetY: number;
    private _scrollX: number;
    private _scrollY: number;
    private _movingObject: CanvasObject;
    private _dragOutline: CanvasObject;

    constructor() {
      this._canvas = new fabric.Canvas("canvas");
      this._canvas.selection = false;
      this._locationsWithObjects = new Map<string, CanvasObject>();
      this._isObjectMoving = false;
      this._isViewMoving = false;
      this._mouseIsOnCanvas = false;
      this._zoomEnabled = true;
      this._viewMoveEnabled = true;
      this._scrollEnabled = true;

      this._stopViewScrolling = true;
      this._scrollX = 0;
      this._scrollY = 0;

      this._movingObject = null;
      this._moveOffsetX = 0;
      this._moveOffsetY = 0;

      this._maxZoom = 2.0;
      this._minZoom = 0.5;

      this._lastPosX = 0;
      this._lastPosY = 0;

      const canvasElem = this._canvas.getElement().parentElement;
      canvasElem.addEventListener("mouseenter", () => {
        this._mouseIsOnCanvas = true;
      });
      canvasElem.addEventListener("mouseout", () => {
        this._mouseIsOnCanvas = false;
      });

      this._canvas.on("mouse:wheel", (options: EventOptions) => {
        if (options.e.ctrlKey === false) {
          this._performScroll(options);
        } else {
          this._performZoom(options);
        }
      });

      this._canvas.on("mouse:down", this._beginMove.bind(this));
      this._canvas.on("mouse:move", this._performMove.bind(this));
      this._canvas.on("mouse:up", this._endMove.bind(this));

      document.body.addEventListener("mousemove", () => {
        if (this._mouseIsOnCanvas || this._isObjectMoving) {
          return;
        }
        for (const object of this._locationsWithObjects.values()) {
          this._unhighlightObject(object);
        }
      });
      document.body.addEventListener("mouseout", () => {
        for (const object of this._locationsWithObjects.values()) {
          this._unhighlightObject(object);
        }
      });

      this._dragOutline = new fabric.Rect({
        left: 0,
        top: 0,
        width: colWidth,
        height: rowHeight,
        strokeWidth: strokeWidth,
        stroke: "gray",
        fill: "white",
        strokeDashArray: [strokeWidth / 2, 2 * strokeWidth],
        strokeLineCap: "round",
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      this._dragOutline.visible = false;
      this._canvas.add(this._dragOutline);

      this._drawCellMarkers();

      const shapeWidth = colWidth - 2 * colPadding;
      const shapeHeight = rowHeight - 2 * rowPadding;
      this._addCircle({
        left: colAdjustment,
        top: rowAdjustment,
        radius: shapeWidth / 2,
      });
      this._addRect({
        left: colWidth + colAdjustment,
        top: rowAdjustment,
        width: shapeWidth,
        height: shapeHeight,
      });
    }

    // Code to limit the movements within the scene's boundaries.
    private _restrictViewportToScene(): void {
      const vpt = this._canvas.viewportTransform;
      const zoom = this._canvas.getZoom();
      if (zoom < this._canvas.getWidth() / sceneWidth) {
        vpt[4] = (this._canvas.getWidth() - sceneWidth * zoom) / 2;
      } else {
        if (vpt[4] >= 0) {
          vpt[4] = 0;
        } else if (vpt[4] < this._canvas.getWidth() - sceneWidth * zoom) {
          vpt[4] = this._canvas.getWidth() - sceneWidth * zoom;
        }
      }
      if (zoom < this._canvas.getHeight() / sceneHeight) {
        vpt[5] = (this._canvas.getHeight() - sceneHeight * zoom) / 2;
      } else {
        if (vpt[5] >= 0) {
          vpt[5] = 0;
        } else if (vpt[5] < this._canvas.getHeight() - sceneHeight * zoom) {
          vpt[5] = this._canvas.getHeight() - sceneHeight * zoom;
        }
      }
    }

    // Call `fabric.Object.setCoords` for each movable object in cells.
    private _updateCoordsOfObjects(): void {
      this._locationsWithObjects.forEach((object) => {
        object.setCoords();
      });
    }

    private _isTargetUnderPointer(
      target: CanvasObject,
      pointer: Point,
    ): boolean {
      const { left, top, width, height } = target.getBoundingRect(true);
      const xInsideTarget = pointer.x >= left && pointer.x <= left + width;
      const yInsideTarget = pointer.y >= top && pointer.y <= top + height;
      return xInsideTarget && yInsideTarget;
    }

    private _highlightObjectUnderPointer(
      options: EventOptions,
      pointer: Point = null,
    ): void {
      if (pointer === null) {
        pointer = this._canvas.getPointer(options.e, false);
      }
      const mouseInBounds =
        options.e.target === this._canvas.getSelectionElement();

      let oneTargetUnderPointer = false;
      for (const object of this._locationsWithObjects.values()) {
        if (!mouseInBounds) {
          // Unhighlight the object if pointer is out of bounds.
          this._unhighlightObject(object);
        } else if (!this._isTargetUnderPointer(object, pointer)) {
          this._unhighlightObject(object);
        } else {
          this._highlightObject(object);
          oneTargetUnderPointer = true;
        }
      }

      if (oneTargetUnderPointer) {
        this._canvas.setCursor(this._canvas.hoverCursor);
      } else {
        this._canvas.setCursor(this._canvas.defaultCursor);
      }
    }

    private _performZoom(options: EventOptions): void {
      if (!this._zoomEnabled) {
        return;
      }

      const wheelEvent: WheelEvent = options.e;
      const delta = wheelEvent.deltaY;

      let zoom = this._canvas.getZoom();
      zoom *= 1.005 ** delta;
      if (zoom > this._maxZoom) {
        zoom = this._maxZoom;
      }
      if (zoom < this._minZoom) {
        zoom = this._minZoom;
      }
      const point = new fabric.Point(wheelEvent.offsetX, wheelEvent.offsetY);
      this._canvas.zoomToPoint(point, zoom);

      wheelEvent.preventDefault();
      wheelEvent.stopPropagation();
      this._restrictViewportToScene();
      this._updateCoordsOfObjects();
      this._highlightObjectUnderPointer(options);
    }

    private _performScroll(options: EventOptions): void {
      if (!this._scrollEnabled) {
        return;
      }

      const wheelEvent: WheelEvent = options.e;
      const deltaX = wheelEvent.deltaX;
      const deltaY = wheelEvent.deltaY;

      const vpt = this._canvas.viewportTransform;
      if (wheelEvent.shiftKey === true) {
        // Vertical scroll is made horizontal if Shift key is pressed
        vpt[4] = vpt[4] + sceneWidth * (deltaY / 100);
      } else {
        vpt[4] = vpt[4] - sceneWidth * (deltaX / 100);
        vpt[5] = vpt[5] - sceneHeight * (deltaY / 100);
      }

      this._restrictViewportToScene();
      this._updateCoordsOfObjects();
      this._highlightObjectUnderPointer(options);
      this._canvas.requestRenderAll();
    }

    private _beginMove(options: EventOptions): void {
      if (this._canvas.findTarget(options.e, false)) {
        this._beginObjectMove(options);
      } else {
        this._beginViewMove(options);
      }
    }

    private _beginObjectMove(options: EventOptions): void {
      this._isObjectMoving = true;
      this._movingObject = this._canvas.findTarget(options.e, false);

      const pointer = this._canvas.getPointer(options.e, false);
      this._moveOffsetX = pointer.x - this._movingObject.left;
      this._moveOffsetY = pointer.y - this._movingObject.top;
    }

    private _beginViewMove(options: EventOptions): void {
      if (!this._viewMoveEnabled) {
        return;
      }

      this._isViewMoving = true;
      this._lastPosX = options.e.clientX;
      this._lastPosY = options.e.clientY;
    }

    private _performMove(options: EventOptions): void {
      if (this._isObjectMoving) {
        this._performObjectMove(options);
      } else {
        this._highlightObjectUnderPointer(options);
        this._performViewMove(options);
      }
    }

    private _performObjectMove(options: EventOptions): void {
      const pointer = this._canvas.getPointer(options.e, false);
      const left = pointer.x - this._moveOffsetX;
      const top = pointer.y - this._moveOffsetY;
      const width = this._movingObject.width;
      const height = this._movingObject.height;

      // Prevent shapes from going outside the visible region.
      const setTargetPosition = (
        container: HTMLElement,
        target: CanvasObject,
        left: number,
        top: number,
        width: number,
        height: number,
      ): void => {
        // Use the `container` to clamp the object's coords in the view.
        const viewLeft = container.scrollLeft;
        const viewRight = viewLeft + container.clientWidth;
        const viewTop = container.scrollTop;
        const viewBottom = viewTop + container.clientHeight;
        left = clamp(
          left,
          viewLeft + colAdjustment,
          viewRight - width - colAdjustment,
        );
        top = clamp(
          top,
          viewTop + rowAdjustment,
          viewBottom - height - rowAdjustment,
        );
        target.set({ left, top });
        target.setCoords();

        const cell = this._findClosestCell(target);
        const location = this._locationForCell(cell);
        if (
          this._locationsWithObjects.has(location) &&
          this._locationsWithObjects.get(location) !== target
        ) {
          this._dragOutline.set("visible", false);
        } else {
          this._moveDragOutline(cell.col, cell.row);
          this._dragOutline.set("visible", true);
        }
      };

      const scrollView = (
        scrollableView: HTMLElement,
        target: CanvasObject,
      ): void => {
        if (this._stopViewScrolling) {
          this._dragOutline.set("visible", false);
        } else {
          const { left, top, width, height } = target.getBoundingRect(true);
          setTargetPosition(
            scrollableView,
            target,
            left + this._scrollX,
            top + this._scrollY,
            width,
            height,
          );
          this._canvas.requestRenderAll();
          scrollableView.scrollBy(this._scrollX, this._scrollY);

          // Continue scrolling if allowed...
          setTimeout(() => scrollView(scrollableView, target), 20);
        }
      };

      // Note: this element is wrapped inside a SimpleBar scroller. To get the
      // actual scrollable container, the following needs to be done.
      const container = this.parentElement.parentElement.parentElement;
      setTargetPosition(
        container,
        this._movingObject,
        left,
        top,
        width,
        height,
      );

      this._stopViewScrolling = true;
      this._scrollX = 0;
      this._scrollY = 0;
      if (
        left + width + colAdjustment >
        container.scrollLeft + container.clientWidth
      ) {
        this._stopViewScrolling = false;
        this._scrollX = 1;
      }
      if (left - colAdjustment < container.scrollLeft) {
        this._stopViewScrolling = false;
        this._scrollX = -1;
      }
      if (
        top + height + rowAdjustment >
        container.scrollTop + container.clientHeight
      ) {
        this._stopViewScrolling = false;
        this._scrollY = 1;
      }
      if (top - rowAdjustment < container.scrollTop) {
        this._stopViewScrolling = false;
        this._scrollY = -1;
      }

      if (!this._stopViewScrolling) {
        scrollView(container, this._movingObject);
      }
      this._highlightObject(this._movingObject);
    }

    private _performViewMove(options: EventOptions): void {
      if (!this._viewMoveEnabled) {
        return;
      }

      if (this._isViewMoving) {
        this._canvas.setCursor(this._canvas.moveCursor);

        const wheelEvent: WheelEvent = options.e;
        const vpt = this._canvas.viewportTransform;
        vpt[4] += wheelEvent.clientX - this._lastPosX;
        vpt[5] += wheelEvent.clientY - this._lastPosY;

        this._restrictViewportToScene();
        this._updateCoordsOfObjects();
        this._canvas.requestRenderAll();
        this._lastPosX = wheelEvent.clientX;
        this._lastPosY = wheelEvent.clientY;
      }
    }

    private _endMove(options: EventOptions): void {
      if (this._isObjectMoving) {
        this._endObjectMove(options);
      } else {
        this._endViewMove(options);
      }
    }

    private _endObjectMove(options: EventOptions): void {
      this._stopViewScrolling = true;
      this._scrollX = 0;
      this._scrollY = 0;

      let currentCell = null;
      for (const location of this._locationsWithObjects.keys()) {
        if (this._locationsWithObjects.get(location) === this._movingObject) {
          currentCell = this._cellForLocation(location);
          break;
        }
      }

      const cell = this._findClosestCell(this._movingObject);
      if (this._locationsWithObjects.has(this._locationForCell(cell))) {
        cell.col = currentCell.col;
        cell.row = currentCell.row;
        const { left, top } = this._coordinatesForCell(
          this._movingObject,
          cell.col,
          cell.row,
        );
        cell.left = left;
        cell.top = top;
      } else {
        this._locationsWithObjects.delete(this._locationForCell(currentCell));
        this._locationsWithObjects.set(
          this._locationForCell(cell),
          this._movingObject,
        );
      }

      // Common animation arguments for both 'left' and 'top' coordinates.
      const pointer = this._canvas.getPointer(options.e, false);
      const animationArgs = {
        duration: 250,
        onChange: this._canvas.renderAll.bind(this._canvas),
        onComplete: () => this._highlightObjectUnderPointer(options, pointer),
        easing: fabric.util.ease.easeInOutCubic,
      };

      this._movingObject.animate("left", cell.left, animationArgs);
      this._movingObject.animate("top", cell.top, animationArgs);
      this._dragOutline.set("visible", false);

      this._movingObject = null;
      this._isObjectMoving = false;
    }

    private _endViewMove(_options: EventOptions): void {
      if (!this._viewMoveEnabled) {
        return;
      }

      // On mouse up we want to recalculate new interaction
      // for all objects, so we call `setViewportTransform`.
      this._canvas.setViewportTransform(this._canvas.viewportTransform);
      this._canvas.setCursor(this._canvas.defaultCursor);
      this._isViewMoving = false;
    }

    private _highlightObject(object: CanvasObject): void {
      if (!object) {
        return;
      }

      const color = new fabric.Color(object.stroke);
      color.setAlpha(0.3);
      object.set("fill", color.toRgba());
      this._canvas.requestRenderAll();
    }

    private _unhighlightObject(object: CanvasObject): void {
      if (!object) {
        return;
      }

      object.set("fill", "#FFFFFF33");
      this._canvas.requestRenderAll();
    }

    private _moveDragOutline(col: number, row: number): void {
      const left = col * colWidth - strokeWidth / 2;
      const top = row * rowHeight - strokeWidth / 2;
      this._dragOutline.set({ left, top });
    }

    // From the current position of the target, find the `left` and `top`
    // coordinates that correspond to the closest cell.
    private _coordinatesForCell(
      target: CanvasObject,
      col: number,
      row: number,
    ): Coordinate {
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

    private _findClosestCell(target: CanvasObject): Coordinate & Cell {
      const targetCenter = target.getCenterPoint();
      const closestColumn = Math.floor(targetCenter.x / colWidth);
      const closestRow = Math.floor(targetCenter.y / rowHeight);
      const { left, top } = this._coordinatesForCell(
        target,
        closestColumn,
        closestRow,
      );

      const col = Math.floor(left / colWidth);
      const row = Math.floor(top / rowHeight);

      return { left, top, col, row };
    }

    private _locationForCell(cell: Cell): string {
      return `${cell.col}-${cell.row}`;
    }

    private _cellForLocation(location: string): Cell {
      const vals = location.split("-");
      const col = parseInt(vals[0], 10);
      const row = parseInt(vals[1], 10);
      return { col, row };
    }

    private _drawCellMarkers(): void {
      function makeLine(
        coords: Array<number>,
        dashLength: number,
        gapLength: number,
      ): CanvasObject {
        return new fabric.Line(coords, {
          fill: "lightgray",
          stroke: "lightgray",
          strokeWidth: strokeWidth,
          strokeDashArray: [dashLength, gapLength],
          opacity: 0.5,
          selectable: false,
          evented: false,
          objectCaching: false,
        });
      }

      const rowMarkerLength = (colWidth / 12) * 2;
      const colMarkerLength = (rowHeight / 12) * 2;
      for (let i = 0; i <= numRows; ++i) {
        const row = i * rowHeight;
        const rowMarker = makeLine(
          [
            0 - rowMarkerLength / 2,
            row - strokeWidth / 2,
            sceneWidth + rowMarkerLength / 2,
            row - strokeWidth / 2,
          ],
          rowMarkerLength,
          colWidth - rowMarkerLength,
        );
        this._canvas.add(rowMarker);
      }
      for (let i = 0; i <= numColumns; ++i) {
        const col = i * colWidth;
        const colMarker = makeLine(
          [
            col - strokeWidth / 2,
            0 - colMarkerLength / 2,
            col - strokeWidth / 2,
            sceneHeight + colMarkerLength / 2,
          ],
          colMarkerLength,
          rowHeight - colMarkerLength,
        );
        this._canvas.add(colMarker);
      }
    }

    private _setCommonProps(object: CanvasObject) {
      object.fill = "#FFFFFF33";
      object.strokeWidth = strokeWidth;
      object.hasControls = false;
      object.hasBorders = false;
      object.lockMovementX = true;
      object.lockMovementY = true;
    }

    private _addCircle(args: object) {
      const circle = new fabric.Circle(args);
      circle.stroke = "orangered";
      this._setCommonProps(circle);

      this._canvas.add(circle);
      const cell = this._findClosestCell(circle);
      this._locationsWithObjects.set(this._locationForCell(cell), circle);

      return circle;
    }

    private _addRect(args: object) {
      const rect = new fabric.Rect(args);
      rect.stroke = "#1C75BC";
      this._setCommonProps(rect);

      this._canvas.add(rect);
      const cell = this._findClosestCell(rect);
      this._locationsWithObjects.set(this._locationForCell(cell), rect);

      return rect;
    }

    get parentElement() {
      return this._canvas.getElement().parentElement;
    }

    get minZoom(): number {
      return this._minZoom;
    }

    set minZoom(zoom: number) {
      this._minZoom = zoom;
    }

    get maxZoom(): number {
      return this._maxZoom;
    }

    set maxZoom(zoom: number) {
      this._maxZoom = zoom;
    }

    get zoomEnabled(): boolean {
      return this._zoomEnabled;
    }

    set zoomEnabled(enabled: boolean) {
      this._zoomEnabled = enabled;
    }

    get viewMoveEnabled(): boolean {
      return this._viewMoveEnabled;
    }

    set viewMoveEnabled(enabled: boolean) {
      this._viewMoveEnabled = enabled;
    }

    get scrollEnabled(): boolean {
      return this._scrollEnabled;
    }

    set scrollEnabled(enabled: boolean) {
      this._scrollEnabled = enabled;
    }
  }

  onMount(() => {
    const canvas = new WorkflowCanvas();
    canvas.zoomEnabled = false;
    canvas.viewMoveEnabled = false;
    canvas.scrollEnabled = false;
  });
</script>

<canvas id="canvas" width="{canvasWidth}" height="{canvasHeight}"></canvas>

<style>
</style>
