<script lang="ts" context="module">
  import { Box, G, Line, Path, SVG, Svg, Rect, Runner } from "@svgdotjs/svg.js";
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
  const padWidth = cellSize / 2;
  const padHeight = cellSize;
  const mainBodyWidth = cellSize * 6;
  const mainBodyHeight = cellSize * 6;
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
    private _isReceiverSelected: boolean;
    private _isTransmitterSelected: boolean;

    constructor(svg: Svg, position: Point) {
      super();

      this._innerRect = svg
        .rect(mainBodyWidth, mainBodyHeight)
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
          .rect(padWidth, padHeight)
          .radius(strokeWidth)
          .fill(this._innerRect.fill())
          .stroke({ width: strokeWidth, color: this._innerRect.fill() });
        const fillerRect = svg
          .rect(padWidth / 2, padHeight)
          .fill(this._innerRect.fill())
          .stroke({ width: strokeWidth, color: this._innerRect.fill() })
          .move(padWidth / 2, 0);
        const overlayRect = svg
          .rect(padWidth * 2, padHeight * 2)
          .opacity(0)
          .move(-padWidth / 2, -padHeight / 2);

        const inputRect = svg.group();
        inputRect.add(mainRect);
        inputRect.add(fillerRect);
        inputRect.add(overlayRect);
        return inputRect;
      };

      this._receiverGroup = createEnvIORect().move(
        -padWidth * 1.5,
        -padHeight / 2
      );
      this._transmitterGroup = createEnvIORect()
        .flip()
        .move(-padWidth * 1.5 - this._innerRect.width(), -padHeight * 1.5);

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
      this.add(titleObject);
      this.add(this._receiverGroup);
      this.add(this._transmitterGroup);
      this.add(this._mainBody);
      this.add(this._titleSeparator);
      this.move(position.x - padWidth * 1.5, position.y - padHeight / 2);

      this._isSelected = false;
      this._isReceiverSelected = false;
      this._isTransmitterSelected = false;
    }

    public select(): void {
      this._outlineRect.stroke({ color: "black" });
      this._titleSeparator.stroke({ color: "black" });
      this._isSelected = true;
      this.front();
    }

    public unselect(): void {
      this._outlineRect.stroke({ color: "lightgray" });
      this._titleSeparator.stroke({ color: "lightgray" });
      this._isSelected = false;
    }

    public highlight(): void {
      if (this._isSelected) {
        return;
      }
      this._outlineRect.stroke({ color: "darkgray" });
      this._titleSeparator.stroke({ color: "darkgray" });
      this.front();
    }

    public unhighlight(): void {
      if (this._isSelected) {
        return;
      }
      this._outlineRect.stroke({ color: "lightgray" });
      this._titleSeparator.stroke({ color: "lightgray" });
    }

    public selectReceiver(): void {
      this._receiverGroup.children().forEach((element) => {
        element.fill("black");
        element.stroke({ color: "black" });
      });
      this._isReceiverSelected = true;
    }

    public unselectReceiver(): void {
      this._receiverGroup.children().forEach((element) => {
        element.fill("lightgray");
        element.stroke({ color: "lightgray" });
      });
      this._isReceiverSelected = false;
    }

    public highlightReceiver(): void {
      if (this._isReceiverSelected) {
        return;
      }
      this._receiverGroup.children().forEach((element) => {
        element.fill("darkgray");
        element.stroke({ color: "darkgray" });
      });
    }

    public unhighlightReceiver(): void {
      if (this._isReceiverSelected) {
        return;
      }
      this._receiverGroup.children().forEach((element) => {
        element.fill("lightgray");
        element.stroke({ color: "lightgray" });
      });
    }

    public selectTransmitter(): void {
      this._transmitterGroup.children().forEach((element) => {
        element.fill("black");
        element.stroke({ color: "black" });
      });
      this._isTransmitterSelected = true;
    }

    public unselectTransmitter(): void {
      this._transmitterGroup.children().forEach((element) => {
        element.fill("lightgray");
        element.stroke({ color: "lightgray" });
      });
      this._isTransmitterSelected = false;
    }

    public highlightTransmitter(): void {
      if (this._isTransmitterSelected) {
        return;
      }
      this._transmitterGroup.children().forEach((element) => {
        element.fill("darkgray");
        element.stroke({ color: "darkgray" });
      });
    }

    public unhighlightTransmitter(): void {
      if (this._isTransmitterSelected) {
        return;
      }
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
      const x = this.x() + padWidth / 2;
      const y = this.y() + this._receiverGroup.height() / 2;
      return { x, y };
    }

    get isReceiverSelected(): boolean {
      return this._isReceiverSelected;
    }

    get transmitterGroup(): G {
      return this._transmitterGroup;
    }

    get transmitterCoordinate(): Point {
      const x = this.x() + this.width() - padWidth / 2;
      const y = this.y() + this._transmitterGroup.height() / 2;
      return { x, y };
    }

    get isTransmitterSelected(): boolean {
      return this._isTransmitterSelected;
    }
  }

  class WorkflowConnector extends G {
    private _mainPath: Path;
    private _overlayPath: Path;
    private _isSelected: boolean;

    constructor(svg: Svg, start: Point) {
      super();

      this._mainPath = svg.path(`M${start.x} ${start.y}`).fill("none");
      this._mainPath.stroke({
        color: "black",
        width: strokeWidth,
        linecap: "round",
      });
      this.add(this._mainPath);

      this._overlayPath = svg
        .path(`M${start.x} ${start.y}`)
        .fill("none")
        .opacity(0);
      this._overlayPath.stroke({ color: "black", width: strokeWidth * 9 });
      this.add(this._overlayPath);

      this._isSelected = false;

      svg.add(this);
    }

    private _drawPath(
      path: Path,
      startX: number,
      startY: number,
      endX: number,
      endY: number
    ) {
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (endX >= startX) {
        let curveDelta = cellSize / 2;
        curveDelta = clamp(curveDelta, 0, Math.abs(deltaX) / 2);
        curveDelta = clamp(curveDelta, 0, Math.abs(deltaY) / 2);

        // Category I => regular two-bend connector from start to end
        // 1. move a bit right
        // 2. curve up/down
        // 3. move a bit up/down
        // 4. curve right
        // 5. move right to the endX
        path.plot(
          `M ${startX} ${startY} ` +
            `H ${startX + deltaX * 0.5 - curveDelta} ` +
            `Q ${startX + deltaX * 0.5} ${startY} ${startX + deltaX * 0.5} ${
              startY + curveDelta * Math.sign(deltaY)
            } ` +
            `V ${endY - curveDelta * Math.sign(deltaY)} ` +
            `Q ${startX + deltaX * 0.5} ${endY} ${
              startX + deltaX * 0.5 + curveDelta
            } ${endY} ` +
            `H ${endX}`
        );
      } else if (
        endX < startX &&
        (startY + mainBodyHeight + padHeight <= endY ||
          startY - mainBodyHeight - padHeight >= endY)
      ) {
        const curveDelta = cellSize / 2;
        let midPoint = (startY + endY) / 2;
        if (startY + mainBodyHeight + padHeight <= endY) {
          // Category IIa  => four-bend connector going below
          const top = endY - padHeight / 2;
          const bottom = startY + (mainBodyHeight - padHeight / 2);
          midPoint = (top + bottom) / 2;
        } else {
          // Category IIb  => four-bend connector going above
          const top = startY - padHeight / 2;
          const bottom = endY + (mainBodyHeight - padHeight / 2);
          midPoint = (top + bottom) / 2;
        }

        // 1. move right by curveDelta
        // 2. curve up/down
        // 3. move up/down about half the distance between the nodes' bodies
        // 4. curve left
        // 5. move left to endX - curveDelta
        // 6. curve up/down
        // 7. move up/down towards endY
        // 8. curve right
        // 9. move right to the endX
        path.plot(
          `M ${startX} ${startY} ` +
            `H ${startX + curveDelta} ` +
            `Q ${startX + 2 * curveDelta} ${startY} ${
              startX + 2 * curveDelta
            } ${startY + curveDelta * Math.sign(deltaY)} ` +
            `V ${midPoint - curveDelta * Math.sign(deltaY)} ` +
            `Q ${startX + 2 * curveDelta} ${midPoint} ${
              startX + curveDelta
            } ${midPoint} ` +
            `H ${endX - curveDelta} ` +
            `Q ${endX - 2 * curveDelta} ${midPoint} ${endX - 2 * curveDelta} ${
              midPoint + curveDelta * Math.sign(deltaY)
            } ` +
            `V ${endY - curveDelta * Math.sign(deltaY)} ` +
            `Q ${endX - 2 * curveDelta} ${endY} ${endX - curveDelta} ${endY} ` +
            `H ${endX}`
        );
      } else {
        const curveDelta = cellSize / 2;
        const startTop = startY - padHeight / 2;
        const endTop = endY - padHeight / 2;
        const top = Math.min(startTop, endTop);

        // Category III => four-bend loop-over connector
        // 1. move right by curveDelta
        // 2. curve up
        // 3. move up to higher among top of nodes' bodies + curveDelta
        // 4. curve left
        // 5. move left to endX - curveDelta
        // 6. curve down
        // 7. move down towards endY
        // 8. curve right
        // 9. move right to the endX
        path.plot(
          `M ${startX} ${startY} ` +
            `H ${startX + curveDelta} ` +
            `Q ${startX + 2 * curveDelta} ${startY} ${
              startX + 2 * curveDelta
            } ${startY - curveDelta} ` +
            `V ${top - curveDelta} ` +
            `Q ${startX + 2 * curveDelta} ${top - 2 * curveDelta} ${
              startX + curveDelta
            } ${top - 2 * curveDelta} ` +
            `H ${endX - curveDelta} ` +
            `Q ${endX - 2 * curveDelta} ${top - 2 * curveDelta} ${
              endX - 2 * curveDelta
            } ${top - curveDelta} ` +
            `V ${endY - curveDelta} ` +
            `Q ${endX - 2 * curveDelta} ${endY} ${endX - curveDelta} ${endY} ` +
            `H ${endX}`
        );
      }
    }

    public redraw(start: Point, end: Point) {
      this._drawPath(this._mainPath, start.x, start.y, end.x, end.y);
      this._drawPath(this._overlayPath, start.x, start.y, end.x, end.y);
    }

    public select() {
      this._mainPath.stroke({ color: "black" });
      this._isSelected = true;
      this.front();
    }

    public unselect() {
      this._mainPath.stroke({ color: "lightgray" });
      this._isSelected = false;
    }

    public highlight() {
      if (this._isSelected) {
        return;
      }
      this._mainPath.stroke({ color: "darkgray" });
      this.front();
    }

    public unhighlight() {
      if (this._isSelected) {
        return;
      }
      this._mainPath.stroke({ color: "lightgray" });
    }

    get isSelected(): boolean {
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
    private _connectionInProgress: boolean;
    private _unfinishedConnector: WorkflowConnector;
    private _unconnectedSource: WorkflowNode;
    private _selectedConnectors: Set<WorkflowConnector>;
    private _connectionsSrcToDest: Map<
      WorkflowNode,
      Map<WorkflowNode, WorkflowConnector>
    >;
    private _connectionsDestToSrc: Map<
      WorkflowNode,
      Map<WorkflowNode, WorkflowConnector>
    >;

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
        if (!this._connectionInProgress) {
          this._selectConnector(null);
        }
      });
      this._svg.mousemove((event: SvgMouseMoveEvent) => {
        if (this._connectionInProgress && this._unfinishedConnector !== null) {
          const start = this._unconnectedSource.transmitterCoordinate;
          const end = { x: event.layerX - 2, y: event.layerY };
          this._unfinishedConnector.redraw(start, end);
        }
      });

      this._moveAnimationDuration = 100;
      this._inPlacementMode = false;
      this._setupPlacementMode();

      this._nodes = new Set();
      this._selectedNode = null;
      this._nodeSelectionMenu = this._setupNodeSelectionMenu();

      this._connectionInProgress = false;
      this._unfinishedConnector = null;
      this._unconnectedSource = null;
      this._selectedConnectors = new Set();
      this._connectionsSrcToDest = new Map();
      this._connectionsDestToSrc = new Map();
    }

    private _setupPlacementMode() {
      const placementMarker = this._svg
        .rect(mainBodyWidth, mainBodyHeight)
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
        this._selectedNode = null;
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
          this._width - elemWidth - cellSize + padWidth * 3
        );
        y = clamp(
          y,
          cellSize,
          this._height - elemHeight - cellSize + padHeight / 2
        );
      } else {
        x = clamp(x, cellSize, this._width - elemWidth - cellSize);
        y = clamp(y, cellSize, this._height - elemHeight - cellSize);
      }

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
        x = x - padWidth * 1.5;
        y = y - padHeight / 2;
      }

      return { x, y };
    }

    private _performDrag(event: SvgDragEvent): void {
      const { handler, box } = event.detail;
      event.preventDefault();
      if (
        event.detail.event.movementX === 0 &&
        event.detail.event.movementY === 0
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
        if (this._connectionInProgress) {
          return;
        }
        event.preventDefault();
        this._selectConnector(null);
        this._selectNode(node);
        this._showNodeSelectionMenu(node);
      });
      node.mainBody.mouseover((event: MouseEvent) => {
        if (node.isSelected || this._connectionInProgress) {
          return;
        }
        event.preventDefault();
        node.highlight();
        this._highlightAllConnectionsForNode(node);
        if (this._nodeSelectionMenu.visible()) {
          this._nodeSelectionMenu.front();
        }
      });
      node.mainBody.mouseout((event: MouseEvent) => {
        if (node.isSelected || this._connectionInProgress) {
          return;
        }
        event.preventDefault();
        node.unhighlight();
        this._unhighlightAllConnectionsForNode(node);
        if (this._selectedNode !== null) {
          this._selectedNode.front();
        }
      });

      node.receiverGroup.mouseover((event: MouseEvent) => {
        event.preventDefault();
        if (
          this._connectionInProgress &&
          !this._connectionExists(this._unconnectedSource, node)
        ) {
          node.highlightReceiver();
        }
      });
      node.receiverGroup.mouseout((event: MouseEvent) => {
        if (!this._connectionInProgress) {
          return;
        }
        event.preventDefault();
        node.unhighlightReceiver();
      });
      node.receiverGroup.click((event: MouseEvent) => {
        if (
          !this._connectionInProgress ||
          this._connectionExists(this._unconnectedSource, node)
        ) {
          return;
        }
        event.preventDefault();
        this._endConnection(node);
      });

      node.transmitterGroup.mouseover((event: MouseEvent) => {
        if (this._connectionInProgress) {
          return;
        }
        event.preventDefault();
        node.highlightTransmitter();
      });
      node.transmitterGroup.mouseout((event: MouseEvent) => {
        if (this._connectionInProgress) {
          return;
        }
        event.preventDefault();
        node.unhighlightTransmitter();
      });
      node.transmitterGroup.click(() => {
        if (this._connectionInProgress) {
          return;
        }
        this._beginConnection(node);
      });

      node.draggable();
      node.on("dragmove.namespace", (event: SvgDragEvent) => {
        if (this._connectionInProgress) {
          event.preventDefault();
          return;
        }
        if (
          event.detail.event.movementX !== 0 ||
          event.detail.event.movementY !== 0
        ) {
          this._selectConnector(null);
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
      this._selectConnector(null);
    }

    private _selectNode(node: WorkflowNode): void {
      this._nodes.forEach((workflowNode) => {
        workflowNode.unselect();
        this._unselectAllConnectionsForNode(workflowNode);
      });
      if (node !== null) {
        node.select();
        this._selectAllConnectionsForNode(node);
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
        this._nodeSelectionMenu.front();
      }, this._moveAnimationDuration + 20);
    }

    private _hideNodeSelectionMenu(): void {
      this._nodeSelectionMenu.hide();
    }

    private _beginConnection(node: WorkflowNode) {
      this._selectNode(null);
      this._selectConnector(null);
      this._hideNodeSelectionMenu();

      this._connectionInProgress = true;
      this._unconnectedSource = node;
      const start = node.transmitterCoordinate;
      this._unfinishedConnector = new WorkflowConnector(this._svg, start);
      this._unconnectedSource.selectTransmitter();
    }

    private _endConnection(node: WorkflowNode) {
      this._connectionInProgress = false;
      this._addConnection(
        this._unconnectedSource,
        node,
        this._unfinishedConnector
      );
    }

    private _addConnection(
      src: WorkflowNode,
      dest: WorkflowNode,
      connector: WorkflowConnector
    ): void {
      this._updateConnection(src, dest, connector);
      connector.click((event: MouseEvent) => {
        if (this._connectionInProgress) {
          return;
        }
        event.preventDefault();
        this._selectNode(null);
        this._hideNodeSelectionMenu();
        this._selectedConnectors.clear();
        this._selectConnector(connector);
      });
      connector.mouseover((event: MouseEvent) => {
        if (connector.isSelected || this._connectionInProgress) {
          return;
        }
        event.preventDefault();
        src.highlightTransmitter();
        dest.highlightReceiver();
        connector.highlight();
        if (this._nodeSelectionMenu.visible()) {
          this._nodeSelectionMenu.front();
        }
      });
      connector.mouseout((event: MouseEvent) => {
        if (connector.isSelected || this._connectionInProgress) {
          return;
        }
        event.preventDefault();
        src.unhighlightTransmitter();
        dest.unhighlightReceiver();
        connector.unhighlight();
        this._selectedConnectors.forEach((connector) => {
          this._selectConnector(connector);
        });
      });

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
      this._selectConnector(connector);
    }

    private _updateConnection(
      src: WorkflowNode,
      dest: WorkflowNode,
      connector: WorkflowConnector
    ): void {
      const p1 = src.transmitterCoordinate;
      const p2 = dest.receiverCoordinate;
      connector.redraw(p1, p2);
    }

    private _updateAllConnectionsForNode(node: WorkflowNode): void {
      this._forAllNodeConnections(node, this._updateConnection.bind(this));
    }

    private _removeAllConnectionsForNode(node: WorkflowNode): void {
      if (this._connectionsSrcToDest.has(node)) {
        const connections = this._connectionsSrcToDest.get(node);
        for (const [dest, connector] of connections.entries()) {
          // Remove the dest->src binding
          this._connectionsDestToSrc.get(dest).delete(node);

          // Delete the connector itself
          if (this._selectedConnectors.has(connector)) {
            this._selectedConnectors.delete(connector);
          }
          connector.remove();
        }
        this._connectionsSrcToDest.delete(node);
      }
      if (this._connectionsDestToSrc.has(node)) {
        const connections = this._connectionsDestToSrc.get(node);
        for (const [src, connector] of connections.entries()) {
          // Remove the src->dest binding
          this._connectionsSrcToDest.get(src).delete(node);

          // Delete the connector itself
          connector.remove();
          if (this._selectedConnectors.has(connector)) {
            this._selectedConnectors.delete(connector);
          }
        }
        this._connectionsDestToSrc.delete(node);
      }
    }

    private _selectAllConnectionsForNode(node: WorkflowNode) {
      this._selectedConnectors.clear();
      this._forAllNodeConnections(
        node,
        (
          src: WorkflowNode,
          dest: WorkflowNode,
          connector: WorkflowConnector
        ) => {
          src.selectTransmitter();
          dest.selectReceiver();
          connector.select();
          this._selectedConnectors.add(connector);
        }
      );
    }

    private _unselectAllConnectionsForNode(node: WorkflowNode) {
      this._forAllNodeConnections(
        node,
        (
          src: WorkflowNode,
          dest: WorkflowNode,
          connector: WorkflowConnector
        ) => {
          src.unselectTransmitter();
          dest.unselectReceiver();
          connector.unselect();
        }
      );
    }

    private _highlightAllConnectionsForNode(node: WorkflowNode) {
      this._forAllNodeConnections(
        node,
        (
          src: WorkflowNode,
          dest: WorkflowNode,
          connector: WorkflowConnector
        ) => {
          src.highlightTransmitter();
          dest.highlightReceiver();
          connector.highlight();
        }
      );
    }

    private _unhighlightAllConnectionsForNode(node: WorkflowNode) {
      this._forAllNodeConnections(
        node,
        (
          src: WorkflowNode,
          dest: WorkflowNode,
          connector: WorkflowConnector
        ) => {
          src.unhighlightTransmitter();
          dest.unhighlightReceiver();
          connector.unhighlight();
        }
      );
      this._selectedConnectors.forEach((connector) => {
        this._selectConnector(connector);
      });
    }

    private _forAllNodeConnections(node: WorkflowNode, fn: Function): void {
      if (this._connectionsSrcToDest.has(node)) {
        for (const [dest, connector] of this._connectionsSrcToDest
          .get(node)
          .entries()) {
          fn(node, dest, connector);
        }
      }
      if (this._connectionsDestToSrc.has(node)) {
        for (const [src, connector] of this._connectionsDestToSrc
          .get(node)
          .entries()) {
          fn(src, node, connector);
        }
      }
    }

    private _selectConnector(connector: WorkflowConnector): void {
      const unselectedTransmitters = new Set(this._connectionsSrcToDest.keys());
      const unselectedReceivers = new Set(this._connectionsDestToSrc.keys());
      let connectorSrc = null;
      let connectorDest = null;
      for (const [src, connections] of this._connectionsSrcToDest.entries()) {
        for (const [dest, conn] of connections) {
          if (conn === connector) {
            connectorSrc = src;
            connectorDest = dest;
          }

          if (this._selectedConnectors.has(conn)) {
            unselectedTransmitters.delete(src);
            unselectedReceivers.delete(dest);
          } else {
            conn.unselect();
          }
        }
      }
      unselectedTransmitters.forEach((src) => src.unselectTransmitter());
      unselectedReceivers.forEach((dest) => dest.unselectReceiver());

      if (
        connector !== null &&
        connectorSrc !== null &&
        connectorDest !== null
      ) {
        connector.select();
        connectorSrc.selectTransmitter();
        connectorDest.selectReceiver();
        this._selectedConnectors.add(connector);
      } else {
        this._selectedConnectors.clear();
      }
    }

    private _connectionExists(src: WorkflowNode, dest: WorkflowNode): boolean {
      if (this._connectionsSrcToDest.has(src)) {
        const existingConnections = this._connectionsSrcToDest.get(src);
        if (existingConnections.has(dest)) {
          return true;
        }
      }
      return false;
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
    if (canvas !== null) {
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
