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

  const cellSize = 20;
  const strokeWidth = 4;

  const clamp = (num: number, min: number, max: number): number => {
    return Math.max(min, Math.min(num, max));
  };

  class WorkflowCanvas {
    private _svg: Svg;
    private _width: number;
    private _height: number;

    constructor(elementId: string, width: number, height: number) {
      this._width = width;
      this._height = height;
      this._svg = SVG().addTo(elementId).size(this._width, this._height);

      // Draw dot-grid for position intuition
      const pattern = this._svg.pattern(cellSize * 2, cellSize * 2, (add) => {
        add.circle(strokeWidth).center(cellSize, cellSize).fill("#eaeaea");
      });
      this._svg.rect(this._width, this._height).fill(pattern);
    }

    private _performDrag(event: SvgDragEvent): void {
      const { handler, box } = event.detail;
      event.preventDefault();

      // Use the `container` to clamp the object's coords in the view.
      let x = clamp(box.x, cellSize, this._width - box.width - cellSize);
      let y = clamp(box.y, cellSize, this._height - box.height - cellSize);

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

      handler.el.animate({ duration: 80, when: "absolute" }).move(x, y);

      const container = this._svg.node.parentElement.parentElement;
      let scrollDelta: Delta = { x: 0, y: 0 };
      if (
        x + box.width + cellSize >
        container.scrollLeft + container.clientWidth
      ) {
        scrollDelta.x = 1;
      }
      if (x - cellSize < container.scrollLeft) {
        scrollDelta.x = -1;
      }
      if (
        y + box.height + cellSize >
        container.scrollTop + container.clientHeight
      ) {
        scrollDelta.y = 1;
      }
      if (y - cellSize < container.scrollTop) {
        scrollDelta.y = -1;
      }
      container.scrollTo({
        left: container.scrollLeft + scrollDelta.x * cellSize,
        top: container.scrollTop + scrollDelta.y * cellSize,
        behavior: "smooth",
      });
    }

    public addNode(): G {
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
      node.move(cellSize, cellSize);

      node.draggable();
      node.on("dragmove.namespace", this._performDrag.bind(this));

      return node;
    }
  }

  // All node events are handled by the global canvas instance.
  let canvas: WorkflowCanvas = null;

  export const placeNewNode = () => {
    canvas.addNode();
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
    canvas = new WorkflowCanvas(
      "#workflow-canvas",
      canvasWidth,
      canvasHeight
    );
  });
</script>

<div id="workflow-canvas" width="{canvasWidth}" height="{canvasHeight}"></div>
