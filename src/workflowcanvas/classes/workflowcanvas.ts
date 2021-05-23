import { Svg, Rect, SVG } from "@svgdotjs/svg.js";

import {
  mainBodyHeight,
  mainBodyWidth,
  strokeWidth,
  cellSize,
  portWidth,
  clamp,
} from "../constants.js";
import { Point, SvgDragEvent, SvgMouseMoveEvent } from "../interfaces.js";
import { Delta } from "../types.js";

import { IOPort } from "./ioport.js";
import { WorkflowNode } from "./workflownode.js";
import { WorkflowConnector } from "./workflowconnector.js";

export class WorkflowCanvas {
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
  private _nodeEditRequestedHandler: () => void;
  private _nodeSelectedHandler: (node: WorkflowNode) => void;
  private _nodePlacedHandler: (node: WorkflowNode) => Promise<void>;

  constructor(elementId: string, width: number, height: number) {
    this._divId = elementId;
    this._width = width;
    this._height = height;

    this._svg = SVG().addTo(`#${this._divId}`).size(this._width, this._height);

    // Draw dot-grid for position intuition
    const pattern = this._svg.pattern(cellSize * 2, cellSize * 2, (add) => {
      add.circle(4).center(cellSize, cellSize).fill("#eaeaea");
    });
    const background = this._svg.rect(this._width, this._height).fill(pattern);
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

    this._nodeEditRequestedHandler = null;
    this._nodeSelectedHandler = null;
    this._nodePlacedHandler = null;
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
        false,
        false
      );

      // The svg.js library's `animate` method incomplete type information.
      // @ts-ignore
      this._placementMarker
        .animate({ duration: this._moveAnimationDuration, when: "absolute" })
        .move(x, y);
    };

    this._svg.node.onclick = async (event) => {
      event.preventDefault();
      document.getElementById(this._divId).focus();
      if (this._inPlacementMode) {
        const node = this._addNode({
          x: this._placementMarker.x(),
          y: this._placementMarker.y(),
        });
        this._nodes.add(node);

        node.title = "Creating…";
        await this._nodePlacedHandler(node);
        node.title = "Untitled";

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
      if (this._nodeEditRequestedHandler !== null)
        this._nodeEditRequestedHandler();
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

    // The '- 2' below is to adjust for the 1px borders on the container.
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
    adjustForInputPorts = true,
    adjustForOutputPorts = true
  ): { x: number; y: number } {
    // Use the `container` to clamp the object's coords in the view.
    if (adjustForOutputPorts || adjustForInputPorts) {
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

    if (adjustForInputPorts) {
      x = x - portWidth;
    }

    return { x, y };
  }

  private _performDrag(
    event: SvgDragEvent,
    adjustForInputPorts: boolean,
    adjustForOutputPorts: boolean
  ): void {
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
      box.height,
      adjustForInputPorts,
      adjustForOutputPorts
    );
    handler.move(x, y);
    this._setMoveCursor();

    const scrollDelta: Delta = { x: 0, y: 0 };
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
      if (this._nodeEditRequestedHandler !== null)
        this._nodeEditRequestedHandler();
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

      const adjustForInputPorts = node.inputPorts.length > 0;
      const adjustForOutputPorts = node.outputPorts.length > 0;
      this._performDrag(event, adjustForInputPorts, adjustForOutputPorts);

      this._redrawAllConnectionsForNode(node);
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
        this._unconnectedSource.workflowNode == inputPort.workflowNode ||
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
        this._unconnectedSource.workflowNode == inputPort.workflowNode ||
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

  private _removeInput(node: WorkflowNode, name: string): void {
    const inputPort = node.inputPorts.find(
      (port: IOPort) => port.name === name
    );
    if (inputPort !== undefined) {
      if (this._connectionsDestForSrc.has(inputPort)) {
        const connector = this._connectionsDestForSrc.get(inputPort)[1];
        this._removeConnector(connector);
      }
      node.removeInput(inputPort);
      this._redrawAllConnectionsForNode(node);
    }
  }

  private _removeOutput(node: WorkflowNode, name: string): void {
    const outputPort = node.outputPorts.find(
      (port: IOPort) => port.name === name
    );
    if (outputPort !== undefined) {
      if (this._connectionsSrcToDest.has(outputPort)) {
        const connections = this._connectionsSrcToDest.get(outputPort);
        Array.from(connections.values()).forEach((connector) => {
          this._removeConnector(connector);
        });
      }
      node.removeOutput(outputPort);
      this._redrawAllConnectionsForNode(node);
    }
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

    if (this._selectedNode !== null && this._nodeSelectedHandler !== null) {
      this._nodeSelectedHandler(this._selectedNode);
    }
  }

  private _showNodeSelectionMenu(node: WorkflowNode): void {
    this._nodeSelectionMenu.move(
      node.mainBody.cx() - this._nodeSelectionMenu.width() / 2,
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
    this._redrawConnection(src, dest, connector);
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

  private _redrawConnection(
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

  private _redrawAllConnectionsForNode(node: WorkflowNode): void {
    this._forAllNodeConnections(node, this._redrawConnection.bind(this));
  }

  private _removeAllConnectionsForNode(node: WorkflowNode): void {
    node.inputPorts.forEach((inputPort) => {
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
    });

    node.outputPorts.forEach((outputPort) => {
      if (this._connectionsSrcToDest.has(outputPort)) {
        const connections = this._connectionsSrcToDest.get(outputPort);
        Array.from(connections.entries()).forEach(([dest, connector]) => {
          // Remove the input<-output binding
          this._connectionsDestForSrc.delete(dest);

          // Delete the connector itself
          if (this._selectedConnectors.has(connector)) {
            this._selectedConnectors.delete(connector);
          }
          connector.remove();
        });

        // Delete all output->input bindings
        this._connectionsSrcToDest.delete(outputPort);
      }
    });
  }

  private _removeConnector(connector: WorkflowConnector): void {
    Array.from(this._connectionsSrcToDest.entries()).forEach(
      ([src, connections]) => {
        Array.from(connections.entries()).every(([dest, conn]) => {
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

            return false;
          }

          return true;
        });
      }
    );
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

  private _forAllNodeConnections(
    node: WorkflowNode,
    fn: (src: IOPort, dest: IOPort, connector: WorkflowConnector) => void
  ): void {
    node.inputPorts.forEach((inputPort) => {
      if (this._connectionsDestForSrc.has(inputPort)) {
        const [src, connector] = this._connectionsDestForSrc.get(inputPort);
        fn(src, inputPort, connector);
      }
    });
    node.outputPorts.forEach((outputPort) => {
      if (this._connectionsSrcToDest.has(outputPort)) {
        const connections = this._connectionsSrcToDest.get(outputPort);
        Array.from(connections.entries()).forEach(([dest, connector]) => {
          fn(outputPort, dest, connector);
        });
      }
    });
  }

  private _selectConnector(connector: WorkflowConnector): void {
    const unselectedInputPorts = new Set<IOPort>();
    const unselectedOutputPorts = new Set<IOPort>();
    this._nodes.forEach((node) => {
      node.inputPorts.forEach((port) => unselectedInputPorts.add(port));
      node.outputPorts.forEach((port) => unselectedOutputPorts.add(port));
    });

    let connectorSrc = null;
    let connectorDest = null;
    Array.from(this._connectionsSrcToDest.entries()).forEach(
      ([src, connections]) => {
        Array.from(connections.entries()).forEach(([dest, conn]) => {
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
        });
      }
    );
    unselectedOutputPorts.forEach((port) => port.unselect());
    unselectedInputPorts.forEach((port) => port.unselect());

    if (connector !== null && connectorSrc !== null && connectorDest !== null) {
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

  public placeNewNode(): void {
    document.getElementById(this._divId).focus();
    this._enterPlacementMode();
  }

  public addInputOnSelectedNode(name: string): void {
    if (this._selectedNode !== null) {
      this._addInput(this._selectedNode, name);
      this._showNodeSelectionMenu(this._selectedNode);
    }
  }

  public addOutputOnSelectedNode(name: string): void {
    if (this._selectedNode !== null) {
      this._addOutput(this._selectedNode, name);
      this._showNodeSelectionMenu(this._selectedNode);
    }
  }

  public removeInputOnSelectedNode(name: string): void {
    if (this._selectedNode !== null) {
      this._removeInput(this._selectedNode, name);
      this._showNodeSelectionMenu(this._selectedNode);
    }
  }

  public removeOutputOnSelectedNode(name: string): void {
    if (this._selectedNode !== null) {
      this._removeOutput(this._selectedNode, name);
      this._showNodeSelectionMenu(this._selectedNode);
    }
  }

  get container(): HTMLElement {
    return this._svg.node.parentElement.parentElement;
  }

  get svgNode(): SVGElement {
    return this._svg.node;
  }

  set nodePlacedHandler(fn: (node: WorkflowNode) => Promise<void>) {
    this._nodePlacedHandler = fn;
  }

  set nodeEditRequestedHandler(fn: () => void) {
    this._nodeEditRequestedHandler = fn;
  }

  set nodeSelectedHandler(fn: (node: WorkflowNode) => void) {
    this._nodeSelectedHandler = fn;
  }
}
