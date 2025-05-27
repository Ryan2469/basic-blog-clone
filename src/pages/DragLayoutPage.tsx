import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';

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
const MIN_PANEL_WIDTH = 200;
const MIN_PANEL_HEIGHT = 150;

const DragLayoutPage: React.FC = () => {
  const [panels, setPanels] = useState<Panel[]>([
    { id: '1', x: 0, y: 0, width: 400, height: 300, content: '패널 1' },
    { id: '2', x: 420, y: 0, width: 400, height: 300, content: '패널 2' },
    { id: '3', x: 840, y: 0, width: 400, height: 300, content: '패널 3' },
    { id: '4', x: 0, y: 320, width: 400, height: 300, content: '패널 4' },
    { id: '5', x: 420, y: 320, width: 400, height: 300, content: '패널 5' },
    { id: '6', x: 840, y: 320, width: 400, height: 300, content: '패널 6' },
  ]);

  console.log('panels :', panels);

  const [draggedPanel, setDraggedPanel] = useState<string | null>(null);
  const [overlappedPanel, setOverlappedPanel] = useState<string | null>(null);
  const [resizingPanel, setResizingPanel] = useState<string | null>(null);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'e' | 's' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

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

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();

    console.log('draggedPanel : ', draggedPanel);
    console.log('overlappedPanel : ', overlappedPanel);
    console.log('resizingPanel : ', resizingPanel);
    console.log('resizeDirection : ', resizeDirection);
    console.log('containerRef : ', containerRef);
    console.log('dragOffsetRef : ', dragOffsetRef);

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

        updatedPanels[panelIndex] = {
          ...panel,
          width: newWidth,
          height: newHeight
        };

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
        
        const draggedPanelData = { ...newPanels[draggedPanelIndex] };
        const overlappedPanelData = { ...newPanels[overlappedPanelIndex] };
        
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