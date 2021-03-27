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
    private _mainBody: G;
    private _transmitterGroup: G;
    private _receiverGroup: G;
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
      this._mainBody = svg.group();
      this._mainBody.add(this._innerRect);
      this._mainBody.add(this._outlineRect);

      const createEnvIORect = (): G => {
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

      this._receiverGroup = createEnvIORect().move(-padSize, 0);
      this._transmitterGroup = createEnvIORect()
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
      this.add(this._receiverGroup);
      this.add(this._transmitterGroup);
      this.add(this._mainBody);
      this.add(titleObject);
      this.add(this._titleSeparator);
      this.move(position.x - padSize, position.y);

      this._isSelected = false;
    }

    public select(): void {
      this._outlineRect.stroke({ color: "black" });
      this._titleSeparator.stroke({ color: "black" });
      this._isSelected = true;
    }

    public unselect(): void {
      this._outlineRect.stroke({ color: "lightgray" });
      this._titleSeparator.stroke({ color: "lightgray" });
      this._isSelected = false;
    }

    public highlightReceiver(): void {
      this._receiverGroup.children().forEach((element) => {
        element.fill("black");
        element.stroke({ color: "black" });
      });
    }

    public unhighlightReceiver(): void {
      this._receiverGroup.children().forEach((element) => {
        element.fill("lightgray");
        element.stroke({ color: "lightgray" });
      });
    }

    public highlightTransmitter(): void {
      this._transmitterGroup.children().forEach((element) => {
        element.fill("black");
        element.stroke({ color: "black" });
      });
    }

    public unhighlightTransmitter(): void {
      this._transmitterGroup.children().forEach((element) => {
        element.fill("lightgray");
        element.stroke({ color: "lightgray" });
      });
    }

    get isSelected(): boolean {
      return this._isSelected;
    }

    get mainBody(): G {
      return this._mainBody;
    }

    get receiverGroup(): G {
      return this._receiverGroup;
    }

    get receiverCoordinate(): Point {
      const x = this.x();
      const y = this.y() + this._receiverGroup.height() / 2;
      return { x, y };
    }

    get transmitterGroup(): G {
      return this._transmitterGroup;
    }

    get transmitterCoordinate(): Point {
      const x = this.x() + this.width();
      const y = this.y() + this._transmitterGroup.height() / 2;
      return { x, y };
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
    private _connectionInProgress: boolean;
    private _currentConnector: Line;
    private _currentConnectionSource: WorkflowNode;
    private _currentConnectionDestination: WorkflowNode;
    private _connectionsSrcToDest: Map<WorkflowNode, Map<WorkflowNode, Line>>;
    private _connectionsDestToSrc: Map<WorkflowNode, Map<WorkflowNode, Line>>;

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
      background.mousemove((event: SvgMouseMoveEvent) => {
        if (this._connectionInProgress && this._currentConnector != null) {
          const { x, y } = this._currentConnectionSource.transmitterCoordinate;
          // @ts-ignore
          this._currentConnector
            .animate({ duration: 100, when: "absolute" })
            .plot(x, y, event.layerX, event.layerY);
        }
      });

      this._moveAnimationDuration = 100;
      this._inPlacementMode = false;
      this._setupPlacementMode();

      this._nodes = new Set();
      this._selectedNode = null;
      this._nodeSelectionMenu = this._setupNodeSelectionMenu();

      this._connectionInProgress = false;
      this._currentConnector = null;
      this._currentConnectionSource = null;
      this._currentConnectionDestination = null;
      this._connectionsSrcToDest = new Map();
      this._connectionsDestToSrc = new Map();
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
      const containerDiv = document.createElement("div");
      containerDiv.style.display = "flex";
      containerDiv.style.flexDirection = "row";

      const createButton = (buttonText: string): HTMLButtonElement => {
        const button = document.createElement("button");
        button.textContent = buttonText;
        button.style.fontSize = "12px";
        button.style.width = "100%";
        button.style.height = "100%";
        button.style.padding = "0";
        button.style.margin = "0";
        button.style.display = "flex";
        button.style.justifyContent = "center";
        button.style.alignItems = "center";
        return button;
      };

      const editButton = createButton("Edit");
      containerDiv.appendChild(editButton);

      const deleteButton = createButton("Delete");
      deleteButton.onclick = (event: MouseEvent) => {
        event.preventDefault();
        this._deleteNode(this._selectedNode);
        this._hideNodeSelectionMenu();
      };
      containerDiv.appendChild(deleteButton);

      const menuItemWidth = 48;
      const menuItemHeight = 20;
      // @ts-ignore
      const nodeSelectionMenu = this._svg.foreignObject(
        menuItemWidth * containerDiv.childElementCount,
        menuItemHeight
      );

      nodeSelectionMenu.add(containerDiv);
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
      handler.move(x, y);
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

      node.mainBody.click((event: MouseEvent) => {
        event.preventDefault();
        this._selectNode(node);
        this._showNodeSelectionMenu(node);
      });

      node.receiverGroup.mouseover((event: MouseEvent) => {
        event.preventDefault();
        if (this._connectionInProgress) {
          node.highlightReceiver();
        }
      });
      node.receiverGroup.mouseout((event: MouseEvent) => {
        event.preventDefault();
        if (this._connectionInProgress) {
          node.unhighlightReceiver();
        }
      });
      node.receiverGroup.click(() => {
        if (this._connectionInProgress) {
          this._connectionInProgress = false;

          this._currentConnectionDestination = node;
          this._addConnection(
            this._currentConnectionSource,
            this._currentConnectionDestination,
            this._currentConnector
          );
          node.highlightReceiver();

          this._currentConnector = null;
        }
      });

      node.transmitterGroup.mouseover((event: MouseEvent) => {
        event.preventDefault();
        if (!this._connectionInProgress) {
          node.highlightTransmitter();
        }
      });
      node.transmitterGroup.mouseout((event: MouseEvent) => {
        event.preventDefault();
        if (!this._connectionInProgress) {
          node.unhighlightTransmitter();
        }
      });
      node.transmitterGroup.click(() => {
        this._connectionInProgress = true;
        this._currentConnectionSource = node;
        const { x, y } = node.transmitterCoordinate;
        this._currentConnector = this._svg.line(x, y, x, y);
        this._currentConnector.stroke({
          color: "black",
          width: 4,
          linecap: "round",
        });
        node.highlightTransmitter();
      });

      node.draggable();
      node.on("dragmove.namespace", (event: SvgDragEvent) => {
        if (
          event.detail.event.movementX != 0 &&
          event.detail.event.movementY != 0
        ) {
          this._hideNodeSelectionMenu();
          this._selectNode(node);
        }
        this._performDrag(event);
        this._updateAllConnectionsForNode(node);
      });
      node.on("dragend.namespace", () => {
        this._setNormalCursor();
        if (node.isSelected) {
          this._showNodeSelectionMenu(node);
        }
      });

      return node;
    }

    private _deleteNode(node: WorkflowNode): void {
      this._removeAllConnectionsForNode(node);
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
          node.cx() - this._nodeSelectionMenu.width() / 2,
          node.y() + node.height() + 3
        );
        this._nodeSelectionMenu.show();
      }, this._moveAnimationDuration + 20);
    }

    private _hideNodeSelectionMenu(): void {
      this._nodeSelectionMenu.hide();
    }

    private _addConnection(
      src: WorkflowNode,
      dest: WorkflowNode,
      connector: Line
    ): void {
      this._updateConnection(
        this._currentConnectionSource,
        this._currentConnectionDestination,
        this._currentConnector
      );

      if (this._connectionsSrcToDest.has(src)) {
        this._connectionsSrcToDest.get(src).set(dest, connector);
      } else {
        this._connectionsSrcToDest.set(src, new Map([[dest, connector]]));
      }
      if (this._connectionsDestToSrc.has(dest)) {
        this._connectionsDestToSrc.get(dest).set(src, connector);
      } else {
        this._connectionsDestToSrc.set(dest, new Map([[src, connector]]));
      }
    }

    private _updateConnection(
      src: WorkflowNode,
      dest: WorkflowNode,
      connector: Line
    ): void {
      const p1 = src.transmitterCoordinate;
      const p2 = dest.receiverCoordinate;
      // @ts-ignore
      connector.plot(p1.x, p1.y, p2.x, p2.y);
    }

    private _updateAllConnectionsForNode(node: WorkflowNode): void {
      if (this._connectionsSrcToDest.has(node)) {
        for (const entry of this._connectionsSrcToDest.get(node).entries()) {
          this._updateConnection(node, entry[0], entry[1]);
        }
      }
      if (this._connectionsDestToSrc.has(node)) {
        for (const entry of this._connectionsDestToSrc.get(node).entries()) {
          this._updateConnection(entry[0], node, entry[1]);
        }
      }
    }

    private _removeAllConnectionsForNode(node: WorkflowNode): void {
      if (this._connectionsSrcToDest.has(node)) {
        const connections = this._connectionsSrcToDest.get(node);
        for (const entry of connections.entries()) {
          // Remove the dest->src binding
          const dest = entry[0];
          this._connectionsDestToSrc.get(dest).delete(node);

          // Delete the connector from the svg itself
          const connector = entry[1];
          connector.remove();
        }
        this._connectionsSrcToDest.delete(node);
      }
      if (this._connectionsDestToSrc.has(node)) {
        const connections = this._connectionsDestToSrc.get(node);
        for (const entry of connections.entries()) {
          // Remove the src->dest binding
          const src = entry[0];
          this._connectionsSrcToDest.get(src).delete(node);

          // Delete the connector from the svg itself
          const connector = entry[1];
          connector.remove();
        }
        this._connectionsDestToSrc.delete(node);
      }
    }

    public placeNewNode() {
      this._inPlacementMode = true;
    }

    get container(): HTMLElement {
      return this._svg.node.parentElement.parentElement;
    }

    get svgNode(): SVGElement {
      return this._svg.node;
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
