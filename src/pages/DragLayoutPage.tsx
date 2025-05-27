import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';

type LayoutNode = PanelNode | SplitNode;

interface PanelNode {
  type: "panel";
  id: string;
  panelType: string;
}

interface SplitNode {
  type: "split";
  id: string;
  left: LayoutNode;
  right: LayoutNode;
  orientation: "horizontal" | "vertical";
  ratio: number;
}

interface Panel {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
}

interface PanelProps {
  isDragging: boolean;
  isResizing: boolean;
  isOverlapped?: boolean;
}

const CONTAINER_WIDTH = 1400;
const CONTAINER_HEIGHT = 1200;
const PANEL_GAP = 20;
const MIN_PANEL_WIDTH = 200;
const MIN_PANEL_HEIGHT = 150;

class LayoutManager {
  private root: LayoutNode;
  private containerWidth: number;
  private containerHeight: number;

  constructor(initialLayout: LayoutNode, width: number, height: number) {
    this.root = initialLayout;
    this.containerWidth = width;
    this.containerHeight = height;
  }

  calculateLayout(): Panel[] {
    const coordinates: Panel[] = [];
    this.traverseTree(this.root, 0, 0, this.containerWidth, this.containerHeight, coordinates);
    return coordinates;
  }

  private traverseTree(
    node: LayoutNode,
    x: number,
    y: number,
    width: number,
    height: number,
    coordinates: Panel[]
  ) {
    if (node.type === "panel") {
      coordinates.push({
        id: node.id,
        x,
        y,
        width,
        height,
        content: `패널 ${node.id}`
      });
    } else {
      const isHorizontal = node.orientation === "horizontal";
      const splitSize = isHorizontal
        ? width * node.ratio
        : height * node.ratio;

      if (isHorizontal) {
        this.traverseTree(node.left, x, y, splitSize, height, coordinates);
        this.traverseTree(node.right, x + splitSize, y, width - splitSize, height, coordinates);
      } else {
        this.traverseTree(node.left, x, y, width, splitSize, coordinates);
        this.traverseTree(node.right, x, y + splitSize, width, height - splitSize, coordinates);
      }
    }
  }

  updateSplitRatio(splitNodeId: string, newRatio: number): void {
    this.updateSplitRatioRecursive(this.root, splitNodeId, newRatio);
  }

  private updateSplitRatioRecursive(node: LayoutNode, targetId: string, newRatio: number): boolean {
    if (node.type === "split") {
      if (node.id === targetId) {
        node.ratio = Math.max(0.1, Math.min(0.9, newRatio));
        return true;
      }
      return (
        this.updateSplitRatioRecursive(node.left, targetId, newRatio) ||
        this.updateSplitRatioRecursive(node.right, targetId, newRatio)
      );
    }
    return false;
  }

  movePanel(fromId: string, toId: string, direction: "top" | "right" | "bottom" | "left"): void {
    const movedPanel = this.findAndRemovePanel(fromId);
    if (!movedPanel) return;

    this.insertPanel(toId, movedPanel, direction);
  }

  private findAndRemovePanel(panelId: string): PanelNode | null {
    const result = this.findAndRemovePanelRecursive(this.root, panelId);
    if (result.panel) {
      this.root = result.newTree || this.root;
    }
    return result.panel;
  }

  private findAndRemovePanelRecursive(
    node: LayoutNode,
    panelId: string
  ): { panel: PanelNode | null; newTree: LayoutNode | null } {
    if (node.type === "panel") {
      if (node.id === panelId) {
        return { panel: node, newTree: null };
      }
      return { panel: null, newTree: node };
    }

    const leftResult = this.findAndRemovePanelRecursive(node.left, panelId);
    if (leftResult.panel) {
      if (leftResult.newTree) {
        node.left = leftResult.newTree;
        return { panel: leftResult.panel, newTree: node };
      }
      return { panel: leftResult.panel, newTree: node.right };
    }

    const rightResult = this.findAndRemovePanelRecursive(node.right, panelId);
    if (rightResult.panel) {
      if (rightResult.newTree) {
        node.right = rightResult.newTree;
        return { panel: rightResult.panel, newTree: node };
      }
      return { panel: rightResult.panel, newTree: node.left };
    }

    return { panel: null, newTree: node };
  }

  private insertPanel(targetId: string, panel: PanelNode, direction: "top" | "right" | "bottom" | "left"): void {
    const isHorizontal = direction === "left" || direction === "right";
    const ratio = 0.5;

    this.insertPanelRecursive(this.root, targetId, panel, direction, isHorizontal, ratio);
  }

  private insertPanelRecursive(
    node: LayoutNode,
    targetId: string,
    panel: PanelNode,
    direction: "top" | "right" | "bottom" | "left",
    isHorizontal: boolean,
    ratio: number
  ): boolean {
    if (node.type === "panel") {
      if (node.id === targetId) {
        const newSplit: SplitNode = {
          type: "split",
          id: `split-${Date.now()}`,
          orientation: isHorizontal ? "horizontal" : "vertical",
          ratio,
          left: direction === "left" || direction === "top" ? panel : node,
          right: direction === "left" || direction === "top" ? node : panel
        };
        Object.assign(node, newSplit);
        return true;
      }
      return false;
    }

    return (
      this.insertPanelRecursive(node.left, targetId, panel, direction, isHorizontal, ratio) ||
      this.insertPanelRecursive(node.right, targetId, panel, direction, isHorizontal, ratio)
    );
  }
}

const initialLayout: LayoutNode = {
  type: "split",
  id: "split-1",
  orientation: "vertical",
  ratio: 0.5,
  left: {
    type: "split",
    id: "split-2",
    orientation: "horizontal",
    ratio: 0.5,
    left: { type: "panel", id: "1", panelType: "차트" },
    right: { type: "panel", id: "2", panelType: "호가" }
  },
  right: {
    type: "split",
    id: "split-3",
    orientation: "horizontal",
    ratio: 0.5,
    left: {
      type: "split",
      id: "split-4",
      orientation: "vertical",
      ratio: 0.5,
      left: { type: "panel", id: "3", panelType: "실시간시세" },
      right: { type: "panel", id: "4", panelType: "주문하기" }
    },
    right: {
      type: "split",
      id: "split-5",
      orientation: "vertical",
      ratio: 0.5,
      left: { type: "panel", id: "5", panelType: "차트" },
      right: { type: "panel", id: "6", panelType: "호가" }
    }
  }
};

const DragLayoutPage: React.FC = () => {
  const [panels, setPanels] = useState<Panel[]>([
    { id: '1', x: 0, y: 0, width: 400, height: 300, content: '패널 1' },
    { id: '2', x: 420, y: 0, width: 400, height: 300, content: '패널 2' },
    { id: '3', x: 840, y: 0, width: 400, height: 300, content: '패널 3' },
    { id: '4', x: 0, y: 320, width: 400, height: 300, content: '패널 4' },
    { id: '5', x: 420, y: 320, width: 400, height: 300, content: '패널 5' },
    { id: '6', x: 840, y: 320, width: 400, height: 300, content: '패널 6' },
  ]);

  const [draggedPanel, setDraggedPanel] = useState<string | null>(null);
  const [overlappedPanel, setOverlappedPanel] = useState<string | null>(null);
  const [resizingPanel, setResizingPanel] = useState<string | null>(null);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'e' | 's' | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startDims, setStartDims] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const checkCollision = (panel1: Panel, panel2: Panel, gap: number = PANEL_GAP): boolean => {
    return !(
      panel1.x + panel1.width + gap <= panel2.x ||
      panel1.x >= panel2.x + panel2.width + gap ||
      panel1.y + panel1.height + gap <= panel2.y ||
      panel1.y >= panel2.y + panel2.height + gap
    );
  };

  const checkOverlap = (panel1: Panel, panel2: Panel): boolean => {
    const center1 = {
      x: panel1.x + panel1.width / 2,
      y: panel1.y + panel1.height / 2
    };
    const center2 = {
      x: panel2.x + panel2.width / 2,
      y: panel2.y + panel2.height / 2
    };
    
    return Math.abs(center1.x - center2.x) < panel2.width / 2 &&
           Math.abs(center1.y - center2.y) < panel2.height / 2;
  };

  const swapPanels = (panel1Id: string, panel2Id: string) => {
    setPanels(prev => {
      const newPanels = [...prev];
      const panel1Index = newPanels.findIndex(p => p.id === panel1Id);
      const panel2Index = newPanels.findIndex(p => p.id === panel2Id);
      
      if (panel1Index === -1 || panel2Index === -1) return prev;
      
      const panel1 = { ...newPanels[panel1Index] };
      const panel2 = { ...newPanels[panel2Index] };
      
      // 위치와 크기 교환
      const tempX = panel1.x;
      const tempY = panel1.y;
      const tempWidth = panel1.width;
      const tempHeight = panel1.height;
      
      panel1.x = panel2.x;
      panel1.y = panel2.y;
      panel1.width = panel2.width;
      panel1.height = panel2.height;
      
      panel2.x = tempX;
      panel2.y = tempY;
      panel2.width = tempWidth;
      panel2.height = tempHeight;
      
      newPanels[panel1Index] = panel1;
      newPanels[panel2Index] = panel2;
      
      return newPanels;
    });
  };

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    panelId: string,
    action: 'drag' | 'resize-se' | 'resize-e' | 'resize-s' = 'drag'
  ) => {
    e.stopPropagation();
    
    const panel = panels.find(p => p.id === panelId);
    if (!panel) return;

    if (action === 'drag') {
      setDraggedPanel(panelId);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    } else {
      setResizingPanel(panelId);
      setResizeDirection(action.replace('resize-', '') as 'se' | 'e' | 's');
      setStartDims({ width: panel.width, height: panel.height });
    }
    
    setStartPos({ x: e.clientX - panel.x, y: e.clientY - panel.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();

    if (draggedPanel) {
      setPanels(prev => {
        const updatedPanels = [...prev];
        const panelIndex = updatedPanels.findIndex(p => p.id === draggedPanel);
        if (panelIndex === -1) return prev;

        const newX = Math.max(0, Math.min(
          e.clientX - dragOffsetRef.current.x - containerRect.left,
          CONTAINER_WIDTH - updatedPanels[panelIndex].width
        ));
        const newY = Math.max(0, Math.min(
          e.clientY - dragOffsetRef.current.y - containerRect.top,
          CONTAINER_HEIGHT - updatedPanels[panelIndex].height
        ));

        updatedPanels[panelIndex] = {
          ...updatedPanels[panelIndex],
          x: newX,
          y: newY
        };

        // 다른 패널과의 오버랩 확인
        let foundOverlap = false;
        for (let i = 0; i < updatedPanels.length; i++) {
          if (i !== panelIndex && checkOverlap(updatedPanels[panelIndex], updatedPanels[i])) {
            setOverlappedPanel(updatedPanels[i].id);
            foundOverlap = true;
            break;
          }
        }

        if (!foundOverlap) {
          setOverlappedPanel(null);
        }

        return updatedPanels;
      });
    } else if (resizingPanel) {
      setPanels(prev => {
        const updatedPanels = [...prev];
        const panelIndex = updatedPanels.findIndex(p => p.id === resizingPanel);
        if (panelIndex === -1) return prev;

        const panel = updatedPanels[panelIndex];
        let newWidth = panel.width;
        let newHeight = panel.height;

        if (resizeDirection === 'se' || resizeDirection === 'e') {
          newWidth = Math.max(
            MIN_PANEL_WIDTH,
            Math.min(
              e.clientX - containerRect.left - panel.x,
              CONTAINER_WIDTH - panel.x
            )
          );
        }

        if (resizeDirection === 'se' || resizeDirection === 's') {
          newHeight = Math.max(
            MIN_PANEL_HEIGHT,
            Math.min(
              e.clientY - containerRect.top - panel.y,
              CONTAINER_HEIGHT - panel.y
            )
          );
        }

        const tempPanel = {
          ...panel,
          width: newWidth,
          height: newHeight
        };

        updatedPanels[panelIndex] = tempPanel;
        return updatedPanels;
      });
    }
  };

  const handleMouseUp = () => {
    if (draggedPanel && overlappedPanel) {
      setPanels(prev => {
        const newPanels = [...prev];
        const draggedPanelIndex = newPanels.findIndex(p => p.id === draggedPanel);
        const overlappedPanelIndex = newPanels.findIndex(p => p.id === overlappedPanel);
        
        if (draggedPanelIndex === -1 || overlappedPanelIndex === -1) return prev;
        
        // 두 패널의 위치와 크기를 교환
        const draggedPanelData = { ...newPanels[draggedPanelIndex] };
        const overlappedPanelData = { ...newPanels[overlappedPanelIndex] };
        
        // 위치와 크기 교환
        newPanels[draggedPanelIndex] = {
          ...draggedPanelData,
          x: overlappedPanelData.x,
          y: overlappedPanelData.y,
          width: overlappedPanelData.width,
          height: overlappedPanelData.height
        };
        
        newPanels[overlappedPanelIndex] = {
          ...overlappedPanelData,
          x: draggedPanelData.x,
          y: draggedPanelData.y,
          width: draggedPanelData.width,
          height: draggedPanelData.height
        };
        
        return newPanels;
      });
    }
    
    setDraggedPanel(null);
    setOverlappedPanel(null);
    setResizingPanel(null);
    setResizeDirection(null);
  };

  useEffect(() => {
    if (draggedPanel || resizingPanel) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedPanel, resizingPanel]);

  return (
    <Container ref={containerRef}>
      {panels.map(panel => (
        <Panel
          key={panel.id}
          style={{
            left: panel.x,
            top: panel.y,
            width: panel.width,
            height: panel.height,
            transform: panel.id === draggedPanel ? 'scale(1.02)' : 'none',
            opacity: panel.id === draggedPanel ? 0.8 : 1,
            zIndex: panel.id === draggedPanel ? 1000 : 1
          }}
          isDragging={panel.id === draggedPanel}
          isResizing={panel.id === resizingPanel}
          isOverlapped={panel.id === overlappedPanel}
        >
          <PanelHeader onMouseDown={(e) => handleMouseDown(e, panel.id, 'drag')}>
            {panel.content}
          </PanelHeader>
          <PanelContent>
            컨텐츠 영역 {panel.id}
          </PanelContent>
          <ResizeHandleSE 
            onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize-se')}
          />
          <ResizeHandleE 
            onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize-e')}
          />
          <ResizeHandleS 
            onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize-s')}
          />
        </Panel>
      ))}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: ${CONTAINER_WIDTH}px;
  height: ${CONTAINER_HEIGHT}px;
  background-color: #f5f5f5;
  overflow: hidden;
  margin: 0 auto;
`;

const Panel = styled.div<PanelProps>`
  position: absolute;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  user-select: none;
  transition: all 0.3s ease-in-out;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  ${({ isDragging }) => isDragging && `
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    transition: none;
  `}

  ${({ isResizing }) => isResizing && `
    z-index: 1000;
  `}

  ${({ isOverlapped }) => isOverlapped && `
    border: 2px solid #2196f3;
    box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.3);
  `}
`;

const PanelHeader = styled.div`
  padding: 12px;
  background-color: #f8f9fa;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  cursor: move;
  border-bottom: 1px solid #eee;
`;

const PanelContent = styled.div`
  padding: 16px;
  height: calc(100% - 45px);
`;

const ResizeHandle = styled.div`
  position: absolute;
  background-color: transparent;
  z-index: 1;

  &:hover {
    background-color: rgba(0, 120, 255, 0.1);
  }
`;

const ResizeHandleSE = styled(ResizeHandle)`
  right: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  cursor: se-resize;
  
  &::after {
    content: '';
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 8px;
    height: 8px;
    border-right: 2px solid #ccc;
    border-bottom: 2px solid #ccc;
  }
`;

const ResizeHandleE = styled(ResizeHandle)`
  right: 0;
  top: 20px;
  width: 8px;
  height: calc(100% - 40px);
  cursor: e-resize;
`;

const ResizeHandleS = styled(ResizeHandle)`
  bottom: 0;
  left: 20px;
  width: calc(100% - 40px);
  height: 8px;
  cursor: s-resize;
`;

export default DragLayoutPage; 