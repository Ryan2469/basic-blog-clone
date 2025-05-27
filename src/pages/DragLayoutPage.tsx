import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';

type LayoutNode = PanelNode | SplitNode;

interface PanelNode {
  type: 'panel';
  id: string;
  content: string;
}

interface SplitNode {
  type: 'split';
  orientation: 'horizontal' | 'vertical';
  ratio: number;
  left: LayoutNode;
  right: LayoutNode;
}

interface PanelPosition {
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
const MIN_PANEL_WIDTH = 200;
const MIN_PANEL_HEIGHT = 150;

const initialLayout: LayoutNode = {
  type: 'split',
  orientation: 'vertical',
  ratio: 0.5,
  left: {
    type: 'split',
    orientation: 'horizontal',
    ratio: 0.5,
    left: { type: 'panel', id: '1', content: '패널 1' },
    right: { type: 'panel', id: '2', content: '패널 2' }
  },
  right: {
    type: 'split',
    orientation: 'horizontal',
    ratio: 0.5,
    left: {
      type: 'split',
      orientation: 'vertical',
      ratio: 0.5,
      left: { type: 'panel', id: '3', content: '패널 3' },
      right: { type: 'panel', id: '4', content: '패널 4' }
    },
    right: {
      type: 'split',
      orientation: 'vertical',
      ratio: 0.5,
      left: { type: 'panel', id: '5', content: '패널 5' },
      right: { type: 'panel', id: '6', content: '패널 6' }
    }
  }
};

const calculatePanelPositions = (
  node: LayoutNode,
  x: number,
  y: number,
  width: number,
  height: number
): PanelPosition[] => {
  if (node.type === 'panel') {
    return [{
      id: node.id,
      x,
      y,
      width,
      height,
      content: node.content
    }];
  }

  const { orientation, ratio, left, right } = node;

  if (orientation === 'vertical') {
    const splitX = x + width * ratio;
    return [
      ...calculatePanelPositions(left, x, y, width * ratio, height),
      ...calculatePanelPositions(right, splitX, y, width * (1 - ratio), height)
    ];
  } else {
    const splitY = y + height * ratio;
    return [
      ...calculatePanelPositions(left, x, y, width, height * ratio),
      ...calculatePanelPositions(right, x, splitY, width, height * (1 - ratio))
    ];
  }
};

const findNodeById = (node: LayoutNode, id: string): LayoutNode | null => {
  if (node.type === 'panel') {
    return node.id === id ? node : null;
  }

  const leftResult = findNodeById(node.left, id);
  if (leftResult) return leftResult;

  return findNodeById(node.right, id);
};

const findParentNode = (node: LayoutNode, id: string): SplitNode | null => {
  if (node.type === 'panel') {
    return null;
  }

  if ((node.left.type === 'panel' && node.left.id === id) ||
      (node.right.type === 'panel' && node.right.id === id)) {
    return node;
  }

  const leftResult = findParentNode(node.left, id);
  if (leftResult) return leftResult;

  return findParentNode(node.right, id);
};

const DragLayoutPage: React.FC = () => {
  const [layout, setLayout] = useState<LayoutNode>(initialLayout);
  const [panels, setPanels] = useState<PanelPosition[]>([]);
  const [draggedPanel, setDraggedPanel] = useState<string | null>(null);
  const [overlappedPanel, setOverlappedPanel] = useState<string | null>(null);
  const [resizingPanel, setResizingPanel] = useState<string | null>(null);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'e' | 's' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // useEffect(() => {
  //   const positions = calculatePanelPositions(layout, 0, 0, CONTAINER_WIDTH, CONTAINER_HEIGHT);
  //   setPanels(positions);
  // }, [layout]);
  useEffect(() => {
    const positions = calculatePanelPositions(layout, 0, 0, CONTAINER_WIDTH, CONTAINER_HEIGHT);
    setPanels(positions);
  }, [layout]);

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
    }
  };

  // const updateNodeRatio = (node: LayoutNode, panelId: string, newRatio: number): LayoutNode => {
  //   if (node.type === 'panel') {
  //     return node;
  //   }

  //   if ((node.left.type === 'panel' && node.left.id === panelId) ||
  //       (node.right.type === 'panel' && node.right.id === panelId)) {
  //     return {
  //       ...node,
  //       ratio: Math.max(0.1, Math.min(0.9, newRatio))
  //     };
  //   }

  //   return {
  //     ...node,
  //     left: updateNodeRatio(node.left, panelId, newRatio),
  //     right: updateNodeRatio(node.right, panelId, newRatio)
  //   };
  // };

  const updateNodeRatio = (
    node: LayoutNode,
    panelId: string,
    newRatio: number
  ): LayoutNode => {
    if (node.type === 'panel') return node;
  
    const { left, right } = node;
  
    if (left.type === 'panel' && left.id === panelId) {
      return {
        ...node,
        ratio: Math.max(0.1, Math.min(0.9, newRatio))
      };
    }
  
    if (right.type === 'panel' && right.id === panelId) {
      return {
        ...node,
        ratio: Math.max(0.1, Math.min(0.9, 1 - newRatio))
      };
    }
  
    return {
      ...node,
      left: updateNodeRatio(left, panelId, newRatio),
      right: updateNodeRatio(right, panelId, newRatio)
    };
  };

  // const handleMouseMove = (e: MouseEvent) => {
  //   if (!containerRef.current) return;
    
  //   const containerRect = containerRef.current.getBoundingClientRect();

  //   if (draggedPanel) {
  //     const panel = panels.find(p => p.id === draggedPanel);
  //     if (!panel) return;

  //     const newX = Math.max(0, Math.min(
  //       e.clientX - dragOffsetRef.current.x - containerRect.left,
  //       CONTAINER_WIDTH - panel.width
  //     ));
  //     const newY = Math.max(0, Math.min(
  //       e.clientY - dragOffsetRef.current.y - containerRect.top,
  //       CONTAINER_HEIGHT - panel.height
  //     ));

  //     // 드래그 중인 패널의 중심점
  //     const centerX = newX + panel.width / 2;
  //     const centerY = newY + panel.height / 2;

  //     // 다른 패널과의 오버랩 확인
  //     let foundOverlap = false;
  //     for (const otherPanel of panels) {
  //       if (otherPanel.id === draggedPanel) continue;

  //       const otherCenterX = otherPanel.x + otherPanel.width / 2;
  //       const otherCenterY = otherPanel.y + otherPanel.height / 2;

  //       if (Math.abs(centerX - otherCenterX) < panel.width / 2 &&
  //           Math.abs(centerY - otherCenterY) < panel.height / 2) {
  //         setOverlappedPanel(otherPanel.id);
  //         foundOverlap = true;
  //         break;
  //       }
  //     }

  //     if (!foundOverlap) {
  //       setOverlappedPanel(null);
  //     }

  //     setPanels(prev => prev.map(p => 
  //       p.id === draggedPanel ? { ...p, x: newX, y: newY } : p
  //     ));
  //   } else if (resizingPanel) {
  //     const panel = panels.find(p => p.id === resizingPanel);
  //     if (!panel) return;

  //     const parentNode = findParentNode(layout, resizingPanel);
  //     if (!parentNode) return;

  //     if (resizeDirection === 'e' || resizeDirection === 'se') {
  //       const newWidth = Math.max(
  //         MIN_PANEL_WIDTH,
  //         Math.min(
  //           e.clientX - containerRect.left - panel.x,
  //           CONTAINER_WIDTH - panel.x
  //         )
  //       );
  //       const newRatio = newWidth / CONTAINER_WIDTH;
  //       setLayout(prev => updateNodeRatio(prev, resizingPanel, newRatio));
  //     }

  //     if (resizeDirection === 's' || resizeDirection === 'se') {
  //       const newHeight = Math.max(
  //         MIN_PANEL_HEIGHT,
  //         Math.min(
  //           e.clientY - containerRect.top - panel.y,
  //           CONTAINER_HEIGHT - panel.y
  //         )
  //       );
  //       const newRatio = newHeight / CONTAINER_HEIGHT;
  //       setLayout(prev => updateNodeRatio(prev, resizingPanel, newRatio));
  //     }
  //   }
  // };

  const findSiblingPanel = (panelId: string): PanelPosition | null => {
    const parentNode = findParentNode(layout, panelId);
    if (!parentNode) return null;
  
    const siblingId = parentNode.left.type === 'panel' && parentNode.left.id === panelId
      ? (parentNode.right.type === 'panel' ? parentNode.right.id : '')
      : (parentNode.left.type === 'panel' ? parentNode.left.id : '');
  
    const siblingPanel = panels.find(p => p.id === siblingId);
    return siblingPanel || null;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
  
    const containerRect = containerRef.current.getBoundingClientRect();
  
    if (draggedPanel) {
      const panel = panels.find(p => p.id === draggedPanel);
      if (!panel) return;
  
      const newX = e.clientX - dragOffsetRef.current.x - containerRect.left;
      const newY = e.clientY - dragOffsetRef.current.y - containerRect.top;
  
      // 스냅 효과: 가장 가까운 패널의 위치 찾기
      let closestPanel = null;
      let closestDistance = Infinity;
  
      panels.forEach((otherPanel) => {
        if (otherPanel.id === draggedPanel) return;
  
        const otherCenterX = otherPanel.x + otherPanel.width / 2;
        const otherCenterY = otherPanel.y + otherPanel.height / 2;
        const distance = Math.hypot(
          otherCenterX - (newX + panel.width / 2),
          otherCenterY - (newY + panel.height / 2)
        );
  
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPanel = otherPanel.id;
        }
      });
  
      setOverlappedPanel(closestPanel);
  
      setPanels(prev => prev.map(p =>
        p.id === draggedPanel ? { ...p, x: newX, y: newY } : p
      ));
    } else if (resizingPanel) {
      // 기존 리사이징 로직 유지
      const panel = panels.find(p => p.id === resizingPanel);
      if (!panel) return;
  
      const parentNode = findParentNode(layout, resizingPanel);
      if (!parentNode) return;
  
      const siblingPanel = findSiblingPanel(panel.id);
      if (!siblingPanel) return;
  
      let newRatio: number;
  
      if (parentNode.orientation === 'vertical' && (resizeDirection === 'e' || resizeDirection === 'se')) {
        const totalWidth = panel.width + siblingPanel.width;
        const newWidth = Math.min(
          Math.max(MIN_PANEL_WIDTH, e.clientX - containerRect.left - panel.x),
          totalWidth - MIN_PANEL_WIDTH
        );
        newRatio = newWidth / totalWidth;
        setLayout(prev => updateNodeRatio(prev, resizingPanel, newRatio));
      }
  
      if (parentNode.orientation === 'horizontal' && (resizeDirection === 's' || resizeDirection === 'se')) {
        const totalHeight = panel.height + siblingPanel.height;
        const newHeight = Math.min(
          Math.max(MIN_PANEL_HEIGHT, e.clientY - containerRect.top - panel.y),
          totalHeight - MIN_PANEL_HEIGHT
        );
        newRatio = newHeight / totalHeight;
        setLayout(prev => updateNodeRatio(prev, resizingPanel, newRatio));
      }
    }
  };
  


  // const swapNodes = (node: LayoutNode, id1: string, id2: string): LayoutNode => {
  //   if (node.type === 'panel') {
  //     if (node.id === id1) return { ...node, id: id2 };
  //     if (node.id === id2) return { ...node, id: id1 };
  //     return node;
  //   }

  //   return {
  //     ...node,
  //     left: swapNodes(node.left, id1, id2),
  //     right: swapNodes(node.right, id1, id2)
  //   };
  // };

  const swapNodes = (node: LayoutNode, id1: string, id2: string): LayoutNode => {
    if (node.type === 'panel') {
      if (node.id === id1) return { ...node, id: id2 };
      if (node.id === id2) return { ...node, id: id1 };
      return node;
    }
  
    const swappedLeft = swapNodes(node.left, id1, id2);
    const swappedRight = swapNodes(node.right, id1, id2);
  
    return { ...node, left: swappedLeft, right: swappedRight };
  };

  const removeNode = (node: LayoutNode, id: string): LayoutNode | null => {
    if (node.type === 'panel') {
      return node.id === id ? null : node;
    }
  
    const left = removeNode(node.left, id);
    const right = removeNode(node.right, id);
  
    if (!left && !right) return null;
    if (!left) return right;
    if (!right) return left;
  
    return { ...node, left, right };
  };

  const insertNode = (
    node: LayoutNode,
    targetId: string,
    newNode: PanelNode,
    orientation: 'horizontal' | 'vertical',
    position: 'before' | 'after',
  ): LayoutNode => {
    if (node.type === 'panel' && node.id === targetId) {
      const newSplit: SplitNode = {
        type: 'split',
        orientation,
        ratio: 0.5,
        left: position === 'before' ? newNode : node,
        right: position === 'before' ? node : newNode,
      };
      return newSplit;
    }
  
    if (node.type === 'split') {
      return {
        ...node,
        left: insertNode(node.left, targetId, newNode, orientation, position),
        right: insertNode(node.right, targetId, newNode, orientation, position),
      };
    }
  
    return node;
  };

  // const handleMouseUp = () => {
  //   if (draggedPanel && overlappedPanel) {
  //     setLayout(prev => swapNodes(prev, draggedPanel, overlappedPanel));
  //   }
    
  //   setDraggedPanel(null);
  //   setOverlappedPanel(null);
  //   setResizingPanel(null);
  //   setResizeDirection(null);
  // };

  // const handleMouseUp = () => {
  //   if (draggedPanel && overlappedPanel && draggedPanel !== overlappedPanel) {
  //     setLayout(prev => swapNodes(prev, draggedPanel, overlappedPanel));
  //   }
  
  //   setDraggedPanel(null);
  //   setOverlappedPanel(null);
  //   setResizingPanel(null);
  //   setResizeDirection(null);
  
  //   const updatedPositions = calculatePanelPositions(layout, 0, 0, CONTAINER_WIDTH, CONTAINER_HEIGHT);
  //   setPanels(updatedPositions);
  // };

  const handleMouseUp = () => {
    if (draggedPanel && overlappedPanel && draggedPanel !== overlappedPanel) {
      const draggedPanelNode = findNodeById(layout, draggedPanel) as PanelNode;
      if (!draggedPanelNode) return;
  
      let updatedLayout = removeNode(layout, draggedPanel);
      if (!updatedLayout) updatedLayout = draggedPanelNode;
  
      // 위치 및 크기를 고려한 새 스플릿 방향 결정
      const targetPanel = panels.find(p => p.id === overlappedPanel)!;
      const draggedPanelPos = panels.find(p => p.id === draggedPanel)!;
  
      const dx = Math.abs((targetPanel.x + targetPanel.width / 2) - (draggedPanelPos.x + draggedPanelPos.width / 2));
      const dy = Math.abs((targetPanel.y + targetPanel.height / 2) - (draggedPanelPos.y + draggedPanelPos.height / 2));
  
      const orientation = dx > dy ? 'vertical' : 'horizontal';
      const position = (orientation === 'vertical'
        ? (draggedPanelPos.x < targetPanel.x ? 'before' : 'after')
        : (draggedPanelPos.y < targetPanel.y ? 'before' : 'after')
      );
  
      updatedLayout = insertNode(updatedLayout, overlappedPanel, draggedPanelNode, orientation, position);
  
      setLayout(updatedLayout);
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