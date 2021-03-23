<script lang="ts" context="module">
  import { Box, G, SVG, Svg, Runner } from "@svgdotjs/svg.js";
  import "@svgdotjs/svg.draggable.js";

  type Delta = Point;

  interface Point {
    x: number;
    y: number;
  }

  interface AnimatedElement {
    animate: (args: {
      duration?: number;
      delay?: number;
      when?: string;
      swing?: boolean;
      ease?: string;
      times?: number;
      wait?: number;
    }) => Runner;
  }

  interface DragHandler {
    startDrag: () => void;
    drag: () => void;
    endDrag: () => void;
    move: (x: number, y: number) => void;
    el: AnimatedElement;
  }

  interface SvgDragEvent extends Event {
    detail: {
      handler: DragHandler;
      box: Box;
    };
  }

  interface SvgMouseMoveEvent extends MouseEvent {
    layerX: number;
    layerY: number;
  }

  const cellSize = 20;
  const strokeWidth = 4;

  const clamp = (num: number, min: number, max: number): number => {
    return Math.max(min, Math.min(num, max));
  };

  class WorkflowCanvas {
    private _svg: Svg;
    private _width: number;
    private _height: number;
    private _inPlacementMode: boolean;

    constructor(elementId: string, width: number, height: number) {
      this._width = width;
      this._height = height;
      this._svg = SVG().addTo(elementId).size(this._width, this._height);

      // Draw dot-grid for position intuition
      const pattern = this._svg.pattern(cellSize * 2, cellSize * 2, (add) => {
        add.circle(strokeWidth).center(cellSize, cellSize).fill("#eaeaea");
      });
      this._svg.rect(this._width, this._height).fill(pattern);

      this._inPlacementMode = false;
      this._setupPlacementMode();
    }

    private _setupPlacementMode() {
      const placementMarker = this._svg
        .rect(cellSize * 4, cellSize * 4)
        .radius(strokeWidth)
        .fill("none")
        .stroke({
          width: strokeWidth,
          color: "gray",
          linecap: "round",
          dasharray: "4, 8",
        });
      placementMarker.hide();

      this._svg.node.onmousemove = (event: SvgMouseMoveEvent) => {
        if (this._inPlacementMode) {
          placementMarker.show();
        } else {
          placementMarker.hide();
        }

        const { x, y } = this._adjustMoveCoordinates(
          event.layerX - placementMarker.width() / 2.0,
          event.layerY - placementMarker.height() / 2.0,
          placementMarker.width(),
          placementMarker.height()
        );

        // The svg.js library's `animate` method incomplete type information.
        // @ts-ignore
        placementMarker.animate({ duration: 80, when: "absolute" }).move(x, y);
      };

      this._svg.node.onclick = (_event) => {
        if (this._inPlacementMode) {
          this._addNode(placementMarker.x(), placementMarker.y());
          this._inPlacementMode = false;
          placementMarker.hide();
          placementMarker.front();
        }
      };
    }

    private _adjustMoveCoordinates(
      x: number,
      y: number,
      elemWidth: number,
      elemHeight: number
    ): { x: number; y: number } {
      // Use the `container` to clamp the object's coords in the view.
      x = clamp(x, cellSize, this._width - elemWidth - cellSize);
      y = clamp(y, cellSize, this._height - elemHeight - cellSize);

      const diffX = x % cellSize;
      if (diffX > cellSize / 2) {
        x = x + (cellSize - diffX);
      } else {
        x = x - diffX;
      }

      const diffY = y % cellSize;
      if (diffY > cellSize / 2) {
        y = y + (cellSize - diffY);
      } else {
        y = y - diffY;
      }

      return { x, y };
    }

    private _performDrag(event: SvgDragEvent): void {
      const { handler, box } = event.detail;
      event.preventDefault();

      const { x, y } = this._adjustMoveCoordinates(
        box.x,
        box.y,
        box.width,
        box.height
      );
      handler.el.animate({ duration: 80, when: "absolute" }).move(x, y);

      let scrollDelta: Delta = { x: 0, y: 0 };
      if (
        x + box.width + cellSize >
        this.container.scrollLeft + this.container.clientWidth
      ) {
        scrollDelta.x = 1;
      }
      if (x - cellSize < this.container.scrollLeft) {
        scrollDelta.x = -1;
      }
      if (
        y + box.height + cellSize >
        this.container.scrollTop + this.container.clientHeight
      ) {
        scrollDelta.y = 1;
      }
      if (y - cellSize < this.container.scrollTop) {
        scrollDelta.y = -1;
      }
      this.container.scrollTo({
        left: this.container.scrollLeft + scrollDelta.x * cellSize,
        top: this.container.scrollTop + scrollDelta.y * cellSize,
        behavior: "smooth",
      });
    }

    private _addNode(x: number, y: number): G {
      const innerRect = this._svg
        .rect(cellSize * 4, cellSize * 4)
        .radius(strokeWidth)
        .fill("lightgray")
        .opacity(0.2);
      const outerRect = this._svg
        .rect(innerRect.width(), innerRect.height())
        .radius(strokeWidth)
        .fill("none")
        .stroke({ width: strokeWidth, color: innerRect.fill() });

      const node = this._svg.group();
      node.add(innerRect);
      node.add(outerRect);
      node.move(x, y);

      node.draggable();
      node.on("dragmove.namespace", this._performDrag.bind(this));

      return node;
    }

    get container(): HTMLElement {
      return this._svg.node.parentElement.parentElement;
    }

    public placeNewNode() {
      this._inPlacementMode = true;
    }
  }

  // All node events are handled by the global canvas instance.
  let canvas: WorkflowCanvas = null;

  export const placeNewNode = () => {
    if (canvas != null) {
      canvas.placeNewNode();
    }
  };
</script>

<script lang="ts">
  import { onMount } from "svelte";

  export let numColumns: number = 20;
  export let numRows: number = 20;
  export let colWidth: number = 50;
  export let rowHeight: number = 50;

  const canvasWidth = numColumns * colWidth;
  const canvasHeight = numRows * rowHeight;

  onMount(() => {
    canvas = new WorkflowCanvas("#workflow-canvas", canvasWidth, canvasHeight);
  });
</script>

<div id="workflow-canvas" width="{canvasWidth}" height="{canvasHeight}"></div>
