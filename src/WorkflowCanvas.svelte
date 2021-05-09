<script lang="ts" context="module">
  import {
    Box,
    Circle,
    G,
    Line,
    Path,
    SVG,
    Svg,
    Rect,
    Runner,
  } from "@svgdotjs/svg.js";
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

  enum IOPortType {
    Input,
    Output,
  }

  const cellSize = 24;
  const portWidth = cellSize / 2;
  const portHeight = cellSize;
  const padRadius = cellSize;
  const mainBodyWidth = cellSize * 8;
  const mainBodyHeight = cellSize * 4;
  const strokeWidth = 1;

  const clamp = (num: number, min: number, max: number): number => {
    return Math.max(min, Math.min(num, max));
  };

  class IOPort extends G {
    private _workflowNode: WorkflowNode;
    private _portType: IOPortType;
    private _mainRect: Rect;
    private _isSelected: boolean;
    private _nameElement: HTMLParagraphElement;
    private _name: string;

    constructor(
      svg: Svg,
      workflowNode: WorkflowNode,
      portType: IOPortType,
      name: string,
      yPosition: number
    ) {
      super();

      this._workflowNode = workflowNode;
      this._portType = portType;

      const fill = "lightgray";
      this._mainRect = svg
        .rect(portWidth + mainBodyWidth * 0.4, portHeight)
        .radius(strokeWidth)
        .fill("white")
        .stroke({ width: strokeWidth, color: fill });

      this._name = name;
      const nameOffset = 6;
      const nameObjectSize = this._mainRect.width() - nameOffset * 2;
      const nameObject = svg
        // @ts-ignore
        .foreignObject(this._mainRect.width(), cellSize)
        .move(nameOffset, 0);
      nameObject.width(nameObjectSize);
      this._nameElement = document.createElement("p");
      this._nameElement.textContent = this._name;
      this._nameElement.style.display = "table-cell"; // For some reason this works
      this._nameElement.style.width = `${nameObjectSize}px`;
      this._nameElement.style.maxWidth = `${nameObjectSize}px`;
      this._nameElement.style.fontSize = "12px";
      this._nameElement.style.lineHeight = `${cellSize}px`;
      this._nameElement.style.overflow = "hidden";
      this._nameElement.style.textOverflow = "ellipsis";
      this._nameElement.style.whiteSpace = "nowrap";
      nameObject.add(this._nameElement);

      const layerRect = svg
        .rect(portWidth + mainBodyWidth * 0.4, portHeight)
        .opacity(0.0);

      svg.add(this);
      this.add(this._mainRect);
      this.add(nameObject);
      this.add(layerRect);

      if (this._portType === IOPortType.Input) {
        this.move(
          this._workflowNode.mainBody.x() - portWidth,
          this._workflowNode.mainBody.y() + yPosition
        );
      } else if (this._portType === IOPortType.Output) {
        this._nameElement.style.textAlign = "right";
        this.move(
          this._workflowNode.mainBody.x() +
            this._workflowNode.mainBody.width() -
            this._mainRect.width() +
            portWidth,
          this._workflowNode.mainBody.y() + yPosition
        );
      }

      this._isSelected = false;
    }

    public select(): void {
      this.children().forEach((element) => {
        element.stroke({ color: "black" });
      });
      this._isSelected = true;
    }

    public unselect(): void {
      this.children().forEach((element) => {
        element.stroke({ color: "lightgray" });
      });
      this._isSelected = false;
    }

    public highlight(): void {
      if (this._isSelected) {
        return;
      }
      this.children().forEach((element) => {
        element.stroke({ color: "darkgray" });
      });
    }

    public unhighlight(): void {
      if (this._isSelected) {
        return;
      }
      this.children().forEach((element) => {
        element.stroke({ color: "lightgray" });
      });
    }

    get workflowNode(): WorkflowNode {
      return this._workflowNode;
    }

    get portType(): IOPortType {
      return this._portType;
    }

    get isSelected(): boolean {
      return this._isSelected;
    }

    get coordinate(): Point {
      if (this._portType === IOPortType.Input) {
        return { x: this.x(), y: this.y() + this.height() / 2 };
      } else if (this._portType === IOPortType.Output) {
        return { x: this.x() + this.width(), y: this.y() + this.height() / 2 };
      }
    }

    get topOffset(): number {
      return this.coordinate.y - this._workflowNode.mainBody.y();
    }

    get bottomOffset(): number {
      return (
        this._workflowNode.mainBody.y() +
        this._workflowNode.mainBody.height() -
        this.coordinate.y
      );
    }
  }

  class WorkflowNode extends G {
    private _svg: Svg;
    private _innerRect: Rect;
    private _outlineRect: Rect;
    private _titleSeparator: Line;
    private _titleElement: HTMLParagraphElement;
    private _mainBody: G;
    private _isSelected: boolean;
    private _inputPorts: Array<IOPort>;
    private _outputPorts: Array<IOPort>;

    constructor(svg: Svg, position: Point) {
      super();

      this._svg = svg;

      this._innerRect = this._svg
        .rect(mainBodyWidth, mainBodyHeight)
        .radius(strokeWidth)
        .fill("lightgray")
        .opacity(0.2);
      this._outlineRect = this._svg
        .rect(this._innerRect.width(), this._innerRect.height())
        .radius(strokeWidth)
        .fill("none")
        .stroke({ width: strokeWidth, color: this._innerRect.fill() });
      this._mainBody = this._svg.group();
      this._mainBody.add(this._innerRect);
      this._mainBody.add(this._outlineRect);

      this._titleSeparator = this._svg
        .line(0, cellSize, this._innerRect.width(), cellSize)
        .stroke({ color: this._innerRect.fill(), width: strokeWidth });

      const titleOffset = 6;
      const titleObject = this._svg
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

      this._svg.add(this);
      this.add(titleObject);
      this.add(this._mainBody);
      this.add(this._titleSeparator);
      this.move(position.x, position.y);

      this._isSelected = false;

      this._inputPorts = new Array<IOPort>();
      this._outputPorts = new Array<IOPort>();
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

    public addInput(name: string): IOPort {
      const gapSize = 2 * cellSize;
      const inputPort = new IOPort(
        this._svg,
        this,
        IOPortType.Input,
        name,
        gapSize * (1 + this._inputPorts.length)
      );
      this.add(inputPort);
      this._inputPorts.push(inputPort);

      if (
        this._inputPorts.length > 1 &&
        this._inputPorts.length > this._outputPorts.length
      ) {
        this._innerRect.height(this._innerRect.height() + cellSize * 2);
        this._outlineRect.height(this._outlineRect.height() + cellSize * 2);
      }

      return inputPort;
    }

    public addOutput(name: string): IOPort {
      const gapSize = 2 * cellSize;
      const outputPort = new IOPort(
        this._svg,
        this,
        IOPortType.Output,
        name,
        gapSize * (1 + this._outputPorts.length)
      );
      this.add(outputPort);
      this._outputPorts.push(outputPort);

      if (
        this._outputPorts.length > 1 &&
        this._outputPorts.length > this._inputPorts.length
      ) {
        this._innerRect.height(this._innerRect.height() + cellSize * 2);
        this._outlineRect.height(this._outlineRect.height() + cellSize * 2);
      }

      return outputPort;
    }

    get isSelected(): boolean {
      return this._isSelected;
    }

    get mainBody(): G {
      return this._mainBody;
    }

    get inputPorts(): Array<IOPort> {
      return this._inputPorts;
    }

    get outputPorts(): Array<IOPort> {
      return this._outputPorts;
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
      });
      this.add(this._mainPath);

      this._overlayPath = svg
        .path(`M${start.x} ${start.y}`)
        .fill("none")
        .opacity(0);
      this._overlayPath.stroke({ color: "black", width: strokeWidth * 13 });
      this.add(this._overlayPath);

      this._isSelected = false;

      svg.add(this);
    }

    private _drawPath(
      path: Path,
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      startTopOffset: number = 0,
      startBottomOffset: number = 0,
      endTopOffset: number = 0,
      endBottomOffset: number = 0
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
        (startY + startBottomOffset + cellSize <=
          endY - endTopOffset - cellSize ||
          startY - startTopOffset - cellSize >=
            endY + endBottomOffset + cellSize)
      ) {
        const curveDelta = cellSize / 2;
        let midPoint = (startY + endY) / 2;
        if (startY + startBottomOffset + cellSize * 2 <= endY) {
          // Category IIa => four-bend connector going below
          const top = endY - endTopOffset;
          const bottom = startY + startBottomOffset;
          midPoint = (top + bottom) / 2;
        } else {
          // Category IIb => four-bend connector going above
          const top = startY - startTopOffset;
          const bottom = endY + endBottomOffset;
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
        const startTop = startY - startTopOffset;
        const endTop = endY - endTopOffset;
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

    public redraw(
      start: Point,
      end: Point,
      startTopOffset: number = 0,
      startBottomOffset: number = 0,
      endTopOffset: number = 0,
      endBottomOffset: number = 0
    ) {
      this._drawPath(
        this._mainPath,
        start.x,
        start.y,
        end.x,
        end.y,
        startTopOffset,
        startBottomOffset,
        endTopOffset,
        endBottomOffset
      );
      this._drawPath(
        this._overlayPath,
        start.x,
        start.y,
        end.x,
        end.y,
        startTopOffset,
        startBottomOffset,
        endTopOffset,
        endBottomOffset
      );
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
    private _divId: string;
    private _width: number;
    private _height: number;
    private _inPlacementMode: boolean;
    private _placementMarker: Rect;
    private _nodes: Set<WorkflowNode>;
    private _selectedNode: WorkflowNode;
    private _nodeSelectionMenu: any;
    private _moveAnimationDuration: number;
    private _connectionInProgress: boolean;
    private _unfinishedConnector: WorkflowConnector;
    private _unconnectedSource: IOPort;
    private _possibleDestination: IOPort;
    private _selectedConnectors: Set<WorkflowConnector>;
    private _connectionsSrcToDest: Map<IOPort, Map<IOPort, WorkflowConnector>>;
    private _connectionsDestForSrc: Map<IOPort, [IOPort, WorkflowConnector]>;
    private _nodeEditHandler: Function;

    constructor(
      elementId: string,
      width: number,
      height: number,
      nodeEditHandler: Function
    ) {
      this._divId = elementId;
      this._width = width;
      this._height = height;
      this._nodeEditHandler = nodeEditHandler;

      this._svg = SVG()
        .addTo(`#${this._divId}`)
        .size(this._width, this._height);

      // Draw dot-grid for position intuition
      const pattern = this._svg.pattern(cellSize * 2, cellSize * 2, (add) => {
        add.circle(4).center(cellSize, cellSize).fill("#eaeaea");
      });
      const background = this._svg
        .rect(this._width, this._height)
        .fill(pattern);
      background.click((event: MouseEvent) => {
        event.preventDefault();
        document.getElementById(this._divId).focus();
        this._selectNode(null);
        this._hideNodeSelectionMenu();
        if (!this._connectionInProgress) {
          this._selectConnector(null);
        } else {
          this._unconnectedSource.select();
        }
      });

      this._svg.mousemove((event: SvgMouseMoveEvent) => {
        if (this._connectionInProgress && this._unfinishedConnector !== null) {
          const start = this._unconnectedSource.coordinate;
          const startTopOffset = this._unconnectedSource.topOffset;
          const startBottomOffset = this._unconnectedSource.bottomOffset;
          let end = { x: event.layerX - 2, y: event.layerY };
          let endTopOffset = 0;
          let endBottomOffset = 0;
          if (this._possibleDestination !== null) {
            end = this._possibleDestination.coordinate;
            endTopOffset = this._possibleDestination.topOffset;
            endBottomOffset = this._possibleDestination.bottomOffset;
          }

          this._unfinishedConnector.redraw(
            start,
            end,
            startTopOffset,
            startBottomOffset,
            endTopOffset,
            endBottomOffset
          );
        }
      });

      window.onkeydown = (event: KeyboardEvent) => {
        if (document.activeElement.id === this._divId) {
          this._handleKeyboardEvent(event);
        }
      };

      this._moveAnimationDuration = 100;
      this._inPlacementMode = false;
      this._setupPlacementMode();

      this._nodes = new Set();
      this._selectedNode = null;
      this._nodeSelectionMenu = this._setupNodeSelectionMenu();

      this._connectionInProgress = false;
      this._unfinishedConnector = null;
      this._unconnectedSource = null;
      this._possibleDestination = null;
      this._selectedConnectors = new Set();
      this._connectionsSrcToDest = new Map();
      this._connectionsDestForSrc = new Map();
    }

    private _handleKeyboardEvent(event: KeyboardEvent) {
      switch (event.key) {
        case "Escape": {
          if (this._inPlacementMode) this._exitPlacementMode();
          if (this._connectionInProgress) this._cancelCurrentConnection();
          break;
        }
        case "Delete": {
          if (this._selectedNode !== null) {
            this._removeNode(this._selectedNode);
            this._selectedNode = null;
            this._hideNodeSelectionMenu();
          }
          this._selectedConnectors.forEach((connector) => {
            this._removeConnector(connector);
          });
          break;
        }
        default:
          return;
      }
    }

    private _setupPlacementMode() {
      this._placementMarker = this._svg
        .rect(mainBodyWidth, mainBodyHeight)
        .radius(strokeWidth)
        .fill("none")
        .stroke({
          width: strokeWidth,
          color: "gray",
          linecap: "round",
          dasharray: "4, 8",
        });
      this._placementMarker.hide();

      this._svg.node.onmousemove = (event: SvgMouseMoveEvent) => {
        const { x, y } = this._adjustMoveCoordinates(
          event.layerX - this._placementMarker.width() / 2.0,
          event.layerY - this._placementMarker.height() / 2.0,
          this._placementMarker.width(),
          this._placementMarker.height(),
          false
        );

        // The svg.js library's `animate` method incomplete type information.
        // @ts-ignore
        this._placementMarker
          .animate({ duration: this._moveAnimationDuration, when: "absolute" })
          .move(x, y);
      };

      this._svg.node.onclick = (event) => {
        event.preventDefault();
        document.getElementById(this._divId).focus();
        if (this._inPlacementMode) {
          const node = this._addNode({
            x: this._placementMarker.x(),
            y: this._placementMarker.y(),
          });
          this._nodes.add(node);

          this._exitPlacementMode();
          this._placementMarker.front();
        }
      };
    }

    private _enterPlacementMode() {
      this._inPlacementMode = true;
      this._placementMarker.show();
      this._setMoveCursor();
    }

    private _exitPlacementMode() {
      this._inPlacementMode = false;
      this._placementMarker.hide();
      this._setNormalCursor();
    }

    private _setupNodeSelectionMenu() {
      const containerDiv = document.createElement("div");
      containerDiv.style.display = "flex";
      containerDiv.style.flexDirection = "row";
      containerDiv.style.justifyContent = "space-evenly";
      containerDiv.style.alignItems = "center";
      containerDiv.style.border = "1px solid lightgray";
      containerDiv.style.borderRadius = "3px";
      containerDiv.style.background = "white";

      const createButton = (buttonIconName: string): HTMLButtonElement => {
        const button = document.createElement("button");
        button.style.width = "28px";
        button.style.height = "28px";
        button.style.padding = "4px";

        const buttonIcon = document.createElement("img");
        buttonIcon.src = `/icons/${buttonIconName}.svg`;
        buttonIcon.classList.add("icon");
        button.appendChild(buttonIcon);
        return button;
      };

      const editButton = createButton("pencil");
      containerDiv.appendChild(editButton);
      editButton.onclick = (event: MouseEvent) => {
        event.preventDefault();
        this._nodeEditHandler();
      };

      const deleteButton = createButton("trash");
      deleteButton.onclick = (event: MouseEvent) => {
        event.preventDefault();
        document.getElementById(this._divId).focus();
        this._removeNode(this._selectedNode);
        this._selectedNode = null;
        this._hideNodeSelectionMenu();
      };
      containerDiv.appendChild(deleteButton);

      const menuItemWidth = 28;
      const menuItemHeight = 28;
      const spacing = 6;

      // The '- 2' below is to adjus for the 1px borders on the container.
      containerDiv.style.height = `${menuItemHeight + 2 * spacing - 2}px`;

      // @ts-ignore
      const nodeSelectionMenu = this._svg.foreignObject(
        menuItemWidth * containerDiv.childElementCount +
          spacing * (containerDiv.childElementCount + 1) -
          1,
        menuItemHeight + spacing * 2
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
        // Adjust for the input/output ports.
        x = clamp(
          x,
          cellSize,
          this._width - elemWidth - cellSize + 2 * portWidth
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

      // Adjust for the input/ouptut ports.
      if (adjustForPads) {
        x = x - portWidth;
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
        document.getElementById(this._divId).focus();
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
        if (this._nodeSelectionMenu.visible()) {
          this._nodeSelectionMenu.front();
        }
      });
      node.mainBody.dblclick((event: MouseEvent) => {
        event.preventDefault();
        this._nodeEditHandler();
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

    private _addInput(node: WorkflowNode, name: string) {
      const inputPort = node.addInput(name);
      inputPort.mouseover((event: MouseEvent) => {
        if (
          !this._connectionInProgress ||
          this._connectionsDestForSrc.has(inputPort)
        ) {
          return;
        }
        event.preventDefault();
        inputPort.highlight();
        this._possibleDestination = inputPort;
      });
      inputPort.mouseout((event: MouseEvent) => {
        if (!this._connectionInProgress) {
          return;
        }
        event.preventDefault();
        inputPort.unhighlight();
        this._possibleDestination = null;
      });
      inputPort.click((event: MouseEvent) => {
        document.getElementById(this._divId).focus();
        if (
          !this._connectionInProgress ||
          this._connectionsDestForSrc.has(inputPort)
        ) {
          return;
        }
        event.preventDefault();
        this._endConnection(inputPort);
      });
    }

    private _addOutput(node: WorkflowNode, name: string) {
      const outputPort = node.addOutput(name);
      outputPort.mouseover((event: MouseEvent) => {
        if (this._connectionInProgress) {
          return;
        }
        event.preventDefault();
        outputPort.highlight();
      });
      outputPort.mouseout((event: MouseEvent) => {
        if (this._connectionInProgress) {
          return;
        }
        event.preventDefault();
        outputPort.unhighlight();
      });
      outputPort.click(() => {
        document.getElementById(this._divId).focus();
        if (this._connectionInProgress) {
          return;
        }
        this._beginConnection(outputPort);
      });
    }

    private _removeNode(node: WorkflowNode): void {
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
      this._nodeSelectionMenu.move(
        node.cx() - this._nodeSelectionMenu.width() / 2,
        node.y() + node.height() + 6
      );
      this._nodeSelectionMenu.show();
      this._nodeSelectionMenu.front();
    }

    private _hideNodeSelectionMenu(): void {
      this._nodeSelectionMenu.hide();
    }

    private _beginConnection(output: IOPort) {
      this._selectNode(null);
      this._selectConnector(null);
      this._hideNodeSelectionMenu();

      this._connectionInProgress = true;
      this._unconnectedSource = output;
      const start = output.coordinate;
      this._unfinishedConnector = new WorkflowConnector(this._svg, start);
      this._unconnectedSource.select();
      this._nodes.forEach((workflowNode) => {
        workflowNode.front();
      });
    }

    private _endConnection(input: IOPort) {
      this._connectionInProgress = false;
      this._addConnection(
        this._unconnectedSource,
        input,
        this._unfinishedConnector
      );
      this._unconnectedSource = null;
      this._unfinishedConnector = null;
      this._possibleDestination = null;
    }

    private _addConnection(
      src: IOPort,
      dest: IOPort,
      connector: WorkflowConnector
    ): void {
      this._updateConnection(src, dest, connector);
      connector.click((event: MouseEvent) => {
        document.getElementById(this._divId).focus();
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
        src.highlight();
        dest.highlight();
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
        src.unhighlight();
        dest.unhighlight();
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
      this._connectionsDestForSrc.set(dest, [src, connector]);
      this._selectConnector(connector);
    }

    private _updateConnection(
      src: IOPort,
      dest: IOPort,
      connector: WorkflowConnector
    ): void {
      const p1 = src.coordinate;
      const p2 = dest.coordinate;
      const startTopOffset = src.topOffset;
      const startBottomOffset = src.bottomOffset;
      const endTopOffset = dest.topOffset;
      const endBottomOffset = dest.bottomOffset;
      connector.redraw(
        p1,
        p2,
        startTopOffset,
        startBottomOffset,
        endTopOffset,
        endBottomOffset
      );
    }

    private _updateAllConnectionsForNode(node: WorkflowNode): void {
      this._forAllNodeConnections(node, this._updateConnection.bind(this));
    }

    private _removeAllConnectionsForNode(node: WorkflowNode): void {
      for (const inputPort of node.inputPorts) {
        if (this._connectionsDestForSrc.has(inputPort)) {
          const [src, connector] = this._connectionsDestForSrc.get(inputPort);

          // Remove the output->input binding
          this._connectionsSrcToDest.get(src).delete(inputPort);

          // Delete the connector itself
          if (this._selectedConnectors.has(connector)) {
            this._selectedConnectors.delete(connector);
          }
          connector.remove();

          // Delete the input<-output binding
          this._connectionsDestForSrc.delete(inputPort);
        }
      }

      for (const outputPort of node.outputPorts) {
        if (this._connectionsSrcToDest.has(outputPort)) {
          for (const [dest, connector] of this._connectionsSrcToDest
            .get(outputPort)
            .entries()) {
            // Remove the input<-output binding
            this._connectionsDestForSrc.delete(dest);

            // Delete the connector itself
            if (this._selectedConnectors.has(connector)) {
              this._selectedConnectors.delete(connector);
            }
            connector.remove();
          }

          // Delete all output->input bindings
          this._connectionsSrcToDest.delete(outputPort);
        }
      }
    }

    private _removeConnector(connector: WorkflowConnector): void {
      for (const [src, connections] of this._connectionsSrcToDest.entries()) {
        for (const [dest, conn] of connections.entries()) {
          if (conn === connector) {
            // Remove both output->input and input<-output binding
            this._connectionsSrcToDest.get(src).delete(dest);
            this._connectionsDestForSrc.delete(dest);

            if (this._selectedConnectors.has(connector)) {
              this._selectedConnectors.delete(connector);
            }

            src.unhighlight();
            src.unselect();
            dest.unhighlight();
            dest.unselect();
            break;
          }
        }
      }
      connector.remove();
    }

    private _selectAllConnectionsForNode(node: WorkflowNode) {
      this._selectedConnectors.clear();
      this._forAllNodeConnections(
        node,
        (src: IOPort, dest: IOPort, connector: WorkflowConnector) => {
          src.select();
          dest.select();
          connector.select();
          this._selectedConnectors.add(connector);
        }
      );
    }

    private _unselectAllConnectionsForNode(node: WorkflowNode) {
      this._forAllNodeConnections(
        node,
        (src: IOPort, dest: IOPort, connector: WorkflowConnector) => {
          src.unselect();
          dest.unselect();
          connector.unselect();
        }
      );
    }

    private _highlightAllConnectionsForNode(node: WorkflowNode) {
      this._forAllNodeConnections(
        node,
        (src: IOPort, dest: IOPort, connector: WorkflowConnector) => {
          src.highlight();
          dest.highlight();
          connector.highlight();
        }
      );
    }

    private _unhighlightAllConnectionsForNode(node: WorkflowNode) {
      this._forAllNodeConnections(
        node,
        (src: IOPort, dest: IOPort, connector: WorkflowConnector) => {
          src.unhighlight();
          dest.unhighlight();
          connector.unhighlight();
        }
      );
      this._selectedConnectors.forEach((connector) => {
        this._selectConnector(connector);
      });
    }

    private _forAllNodeConnections(node: WorkflowNode, fn: Function): void {
      for (const inputPort of node.inputPorts) {
        if (this._connectionsDestForSrc.has(inputPort)) {
          const [src, connector] = this._connectionsDestForSrc.get(inputPort);
          fn(src, inputPort, connector);
        }
      }
      for (const outputPort of node.outputPorts) {
        if (this._connectionsSrcToDest.has(outputPort)) {
          for (const [dest, connector] of this._connectionsSrcToDest
            .get(outputPort)
            .entries()) {
            fn(outputPort, dest, connector);
          }
        }
      }
    }

    private _selectConnector(connector: WorkflowConnector): void {
      const unselectedInputPorts = new Set<IOPort>();
      const unselectedOutputPorts = new Set<IOPort>();
      for (const node of this._nodes) {
        for (const inputPort of node.inputPorts) {
          unselectedInputPorts.add(inputPort);
        }
        for (const outputPort of node.outputPorts) {
          unselectedOutputPorts.add(outputPort);
        }
      }

      let connectorSrc = null;
      let connectorDest = null;
      for (const [src, connections] of this._connectionsSrcToDest.entries()) {
        for (const [dest, conn] of connections) {
          if (conn === connector) {
            connectorSrc = src;
            connectorDest = dest;
          }

          if (this._selectedConnectors.has(conn)) {
            unselectedOutputPorts.delete(src);
            unselectedInputPorts.delete(dest);
          } else {
            conn.unselect();
          }
        }
      }
      unselectedOutputPorts.forEach((port) => port.unselect());
      unselectedInputPorts.forEach((port) => port.unselect());

      if (
        connector !== null &&
        connectorSrc !== null &&
        connectorDest !== null
      ) {
        connector.select();
        connectorSrc.select();
        connectorDest.select();
        this._selectedConnectors.add(connector);
      } else {
        this._selectedConnectors.clear();
      }
    }

    private _connectionExists(src: IOPort, dest: IOPort): boolean {
      if (
        this._connectionsDestForSrc.has(dest) &&
        this._connectionsDestForSrc.get(dest)[0] === src
      ) {
        return true;
      }
      return false;
    }

    private _cancelCurrentConnection() {
      this._connectionInProgress = false;

      this._unconnectedSource.unselect();
      this._unfinishedConnector.remove();
      if (this._possibleDestination !== null) {
        this._possibleDestination.unhighlight();
      }

      this._unconnectedSource = null;
      this._unfinishedConnector = null;
      this._possibleDestination = null;
    }

    public placeNewNode() {
      document.getElementById(this._divId).focus();
      this._enterPlacementMode();
    }

    public addInputOnSelectedNode(name: string) {
      if (this._selectedNode !== null) {
        this._addInput(this._selectedNode, name);
        this._showNodeSelectionMenu(this._selectedNode);
      }
    }

    public addOutputOnSelectedNode(name: string) {
      if (this._selectedNode !== null) {
        this._addOutput(this._selectedNode, name);
        this._showNodeSelectionMenu(this._selectedNode);
      }
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

  export const addInputOnSelectedNode = (name: string) => {
    if (canvas !== null) {
      canvas.addInputOnSelectedNode(name);
    }
  };

  export const addOutputOnSelectedNode = (name: string) => {
    if (canvas !== null) {
      canvas.addOutputOnSelectedNode(name);
    }
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";

  const dispatch = createEventDispatcher();
  const openNodeEditor = () => dispatch("editNodeRequested");

  export let numColumns: number = 20;
  export let numRows: number = 20;
  export let colWidth: number = 50;
  export let rowHeight: number = 50;

  const canvasWidth = numColumns * colWidth;
  const canvasHeight = numRows * rowHeight;

  onMount(() => {
    canvas = new WorkflowCanvas(
      "workflow-canvas",
      canvasWidth,
      canvasHeight,
      openNodeEditor
    );
    canvas.svgNode.style.display = "block";
  });
</script>

<div id="workflow-canvas" tabindex="-1"></div>
