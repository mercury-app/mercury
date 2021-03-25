<script lang="ts" context="module">
  import { Box, G, Line, SVG, Svg, Rect, Runner } from "@svgdotjs/svg.js";
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
      event: MouseEvent;
    };
  }

  interface SvgMouseMoveEvent extends MouseEvent {
    layerX: number;
    layerY: number;
  }

  const cellSize = 24;
  const padSize = cellSize / 2;
  const initialWidth = cellSize * 6;
  const initialHeight = cellSize * 6;
  const strokeWidth = 2;

  const clamp = (num: number, min: number, max: number): number => {
    return Math.max(min, Math.min(num, max));
  };

  class WorkflowNode extends G {
    private _innerRect: Rect;
    private _outlineRect: Rect;
    private _titleSeparator: Line;
    private _titleElement: HTMLParagraphElement;
    private _isSelected: boolean;

    constructor(svg: Svg, position: Point) {
      super();

      this._innerRect = svg
        .rect(initialWidth, initialHeight)
        .radius(strokeWidth)
        .fill("lightgray")
        .opacity(0.2);
      this._outlineRect = svg
        .rect(this._innerRect.width(), this._innerRect.height())
        .radius(strokeWidth)
        .fill("none")
        .stroke({ width: strokeWidth, color: this._innerRect.fill() });

      const createInputRect = (): G => {
        const mainRect = svg
          .rect(padSize, cellSize)
          .radius(strokeWidth)
          .fill(this._innerRect.fill())
          .stroke({ width: strokeWidth, color: this._innerRect.fill() });
        const fillerRect = svg
          .rect(padSize / 2, cellSize)
          .fill(this._innerRect.fill())
          .stroke({ width: strokeWidth, color: this._innerRect.fill() })
          .move(padSize / 2, 0);

        const inputRect = svg.group();
        inputRect.add(mainRect);
        inputRect.add(fillerRect);
        return inputRect;
      };

      const inputReceiverRect = createInputRect().move(-padSize, 0);
      const inputTransmitterRect = createInputRect()
        .flip()
        .move(-padSize - this._innerRect.width(), -cellSize);

      this._titleSeparator = svg
        .line(0, cellSize, this._innerRect.width(), cellSize)
        .stroke({ color: this._innerRect.fill(), width: strokeWidth });

      const titleOffset = 6;
      const titleObject = svg
        // @ts-ignore
        .foreignObject(this._innerRect.width(), cellSize)
        .move(titleOffset, 0);
      this._titleElement = document.createElement("p");
      this._titleElement.textContent = "Untitled";
      this._titleElement.style.display = "table-cell"; // For some reason this works
      this._titleElement.style.maxWidth = `${
        this._innerRect.width() - titleOffset * 2
      }px`;
      this._titleElement.style.fontSize = "14px";
      this._titleElement.style.lineHeight = `${cellSize}px`;
      this._titleElement.style.overflow = "hidden";
      this._titleElement.style.textOverflow = "ellipsis";
      this._titleElement.style.whiteSpace = "nowrap";
      titleObject.add(this._titleElement);

      svg.add(this);
      this.add(this._innerRect);
      this.add(inputReceiverRect);
      this.add(inputTransmitterRect);
      this.add(titleObject);
      this.add(this._titleSeparator);
      this.add(this._outlineRect);
      this.move(position.x - padSize, position.y);

      this._isSelected = false;
    }

    public select() {
      this._outlineRect.stroke({ color: "black" });
      this._titleSeparator.stroke({ color: "black" });
      this._isSelected = true;
    }

    public unselect() {
      this._outlineRect.stroke({ color: "lightgray" });
      this._titleSeparator.stroke({ color: "lightgray" });
      this._isSelected = false;
    }

    get isSelected() {
      return this._isSelected;
    }
  }

  class WorkflowCanvas {
    private _svg: Svg;
    private _width: number;
    private _height: number;
    private _inPlacementMode: boolean;
    private _nodes: Set<WorkflowNode>;
    private _selectedNode: WorkflowNode;
    private _nodeSelectionMenu: any;
    private _moveAnimationDuration: number;

    constructor(elementId: string, width: number, height: number) {
      this._width = width;
      this._height = height;
      this._svg = SVG().addTo(elementId).size(this._width, this._height);

      // Draw dot-grid for position intuition
      const pattern = this._svg.pattern(cellSize * 2, cellSize * 2, (add) => {
        add.circle(4).center(cellSize, cellSize).fill("#eaeaea");
      });
      const background = this._svg
        .rect(this._width, this._height)
        .fill(pattern);
      background.click((event: MouseEvent) => {
        event.preventDefault();
        this._selectNode(null);
        this._hideNodeSelectionMenu();
      });

      this._inPlacementMode = false;
      this._setupPlacementMode();

      this._nodes = new Set();
      this._selectedNode = null;
      this._nodeSelectionMenu = this._setupNodeSelectionMenu();

      this._moveAnimationDuration = 100;
    }

    private _setupPlacementMode() {
      const placementMarker = this._svg
        .rect(initialWidth, initialHeight)
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
          this._setMoveCursor();
        } else {
          placementMarker.hide();
          this._setNormalCursor();
        }

        const { x, y } = this._adjustMoveCoordinates(
          event.layerX - placementMarker.width() / 2.0,
          event.layerY - placementMarker.height() / 2.0,
          placementMarker.width(),
          placementMarker.height(),
          false
        );

        // The svg.js library's `animate` method incomplete type information.
        // @ts-ignore
        placementMarker
          .animate({ duration: this._moveAnimationDuration, when: "absolute" })
          .move(x, y);
      };

      this._svg.node.onclick = (_event) => {
        if (this._inPlacementMode) {
          const node = this._addNode({
            x: placementMarker.x(),
            y: placementMarker.y(),
          });
          this._nodes.add(node);

          this._inPlacementMode = false;
          placementMarker.hide();
          placementMarker.front();
          this._setNormalCursor();
        }
      };
    }

    private _setupNodeSelectionMenu() {
      // @ts-ignore
      const nodeSelectionMenu = this._svg.foreignObject(48, 20);

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.style.fontSize = "12px";
      deleteButton.style.width = "100%";
      deleteButton.style.height = "100%";
      deleteButton.style.padding = "0";
      deleteButton.style.margin = "0";
      deleteButton.style.display = "flex";
      deleteButton.style.justifyContent = "center";
      deleteButton.style.alignItems = "center";
      deleteButton.onclick = (event: MouseEvent) => {
        event.preventDefault();
        this._deleteNode(this._selectedNode);
        this._hideNodeSelectionMenu();
      };
      nodeSelectionMenu.add(deleteButton);

      this._svg.add(nodeSelectionMenu);
      nodeSelectionMenu.hide();

      return nodeSelectionMenu;
    }

    private _setMoveCursor() {
      this._svg.css("cursor", "move");
    }

    private _setNormalCursor() {
      this._svg.css("cursor", "auto");
    }

    private _adjustMoveCoordinates(
      x: number,
      y: number,
      elemWidth: number,
      elemHeight: number,
      adjustForPads: boolean = true
    ): { x: number; y: number } {
      // Use the `container` to clamp the object's coords in the view.
      if (adjustForPads) {
        // Adjust for the input receiver/transmitter pads.
        x = clamp(
          x,
          cellSize,
          this._width - elemWidth - cellSize + padSize * 2
        );
      } else {
        x = clamp(x, cellSize, this._width - elemWidth - cellSize);
      }
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

      // Adjust for the input receiver/transmitter pads
      if (adjustForPads) {
        x = x - padSize;
      }

      return { x, y };
    }

    private _performDrag(event: SvgDragEvent): void {
      const { handler, box } = event.detail;
      event.preventDefault();
      if (
        event.detail.event.movementX == 0 &&
        event.detail.event.movementY == 0
      ) {
        return;
      }

      const { x, y } = this._adjustMoveCoordinates(
        box.x,
        box.y,
        box.width,
        box.height
      );
      handler.el
        .animate({ duration: this._moveAnimationDuration, when: "absolute" })
        .move(x, y);
      this._setMoveCursor();

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

    private _addNode(position: Point): WorkflowNode {
      const node = new WorkflowNode(this._svg, position);

      node.click((event: MouseEvent) => {
        event.preventDefault();
        this._selectNode(node);
        this._showNodeSelectionMenu(node);
      });

      node.draggable();
      node.on("dragmove.namespace", (event: SvgDragEvent) => {
        this._hideNodeSelectionMenu();
        this._selectNode(node);
        this._performDrag(event);
      });
      node.on("dragend.namespace", () => {
        this._setNormalCursor();
        this._showNodeSelectionMenu(node);
      });

      return node;
    }

    private _deleteNode(node: WorkflowNode): void {
      this._nodes.delete(node);
      node.remove();
    }

    private _selectNode(node: WorkflowNode): void {
      this._nodes.forEach((element) => {
        element.unselect();
      });
      if (node != null) {
        node.select();
      }
      this._selectedNode = node;
    }

    private _showNodeSelectionMenu(node: WorkflowNode): void {
      setTimeout(() => {
        this._nodeSelectionMenu.move(
          node.x() + node.width() - this._nodeSelectionMenu.width() - padSize,
          node.y() + node.height() + 3
        );
        this._nodeSelectionMenu.show();
      }, this._moveAnimationDuration + 20);
    }

    private _hideNodeSelectionMenu(): void {
      this._nodeSelectionMenu.hide();
    }

    get container(): HTMLElement {
      return this._svg.node.parentElement.parentElement;
    }

    get svgNode(): SVGElement {
      return this._svg.node;
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
    canvas.svgNode.style.display = "block";
  });
</script>

<div id="workflow-canvas"></div>
