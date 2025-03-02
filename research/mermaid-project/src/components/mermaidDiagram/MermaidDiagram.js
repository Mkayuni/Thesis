import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Box, Tooltip, IconButton, Typography, Button, Select, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import RelationshipManager from '../relationshipManager/RelationshipManager';
import { SYNTAX_TYPES } from '../ui/ui';
import Editor from '@monaco-editor/react';

import { 
  renderMermaidDiagram, 
  clearMermaidDiagram, 
  handleDiagramInteractions,
  syncJavaCodeWithSchema 
} from '../utils/MermaidDiagramUtils';

// Styled components
const DiagramBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#ffffff',
  borderRadius: '0',        // Remove border radius
  overflow: 'hidden',
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 0,
  border: 'none',           // Remove border
  boxShadow: 'none',        // Remove box shadow
  display: 'flex',
  flexDirection: 'column',
}));

const Toolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1),
  backgroundColor: '#ffffff',
  borderRadius: '4px',
  marginBottom: theme.spacing(1),
  border: '1px solid #e0e0e0',
}));

// Compact floating action buttons
const ActionBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  display: 'flex',
  gap: '4px',
  backgroundColor: 'white',
  padding: theme.spacing(0.5),
  borderRadius: '4px',
  border: '1px solid #e0e0e0',
  zIndex: 1100,
}));

// Compact zoom control panel
const ZoomControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: '10px',
  right: '10px',
  zIndex: 1050,
  display: 'flex',
  gap: '4px',
  backgroundColor: 'white',
  padding: theme.spacing(0.5),
  borderRadius: '4px',
  border: '1px solid #e0e0e0',
}));

const MermaidDiagram = ({
  schema,
  relationships,
  removeEntity,
  removeAttribute,
  addAttribute,
  addEntity,
  addRelationship,
  removeRelationship,
  addMethod,
  addMethodsFromParsedCode,
  removeMethod,
}) => {
  const diagramRef = useRef(null);
  const containerRef = useRef(null);
  const [showRelationshipManager, setShowRelationshipManager] = useState(false);
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [code, setCode] = useState('');
  const [syntax, setSyntax] = useState(SYNTAX_TYPES.JAVA);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeModified, setIsCodeModified] = useState(false);
  const [needsRender, setNeedsRender] = useState(false);
  
  // States for zoom and pan functionality
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });
  const [selectedEntity, setSelectedEntity] = useState(null);
  
  // State for tracking the active element and action bar
  const [activeElement, setActiveElement] = useState(null);
  const [actionBarPosition, setActionBarPosition] = useState({ x: 0, y: 0 });

  // Clear diagram function - imported from utils but with local state ref
  const clearDiagram = useCallback(() => {
    clearMermaidDiagram(diagramRef, schema.size);
  }, [schema.size]);

  // Render diagram function - imported but with local refs and state
  const renderDiagram = useCallback(async () => {
    await renderMermaidDiagram({
      diagramRef,
      containerRef,
      schema,
      relationships,
      clearDiagram,
      removeEntity,
      removeAttribute,
      isPanning,
      scale,
      setSelectedEntity,
      setShowRelationshipManager,
      setActiveElement,
      setActionBarPosition,
      setNeedsRender
    });
  }, [schema, relationships, clearDiagram, removeEntity, removeAttribute, isPanning, scale]);

  // Update the effect to thoroughly clean up and re-render on schema changes
  useEffect(() => {
    // Clear diagram immediately on schema change
    clearDiagram();
    
    // Only render if we have entities
    if (schema.size > 0) {
      const timerId = setTimeout(() => {
        renderDiagram();
      }, 50); // Slightly longer delay for reliability
      
      return () => {
        clearTimeout(timerId);
        clearDiagram(); // Clean up on unmount or before re-render
      };
    }
  }, [schema, relationships, renderDiagram, clearDiagram]);

  // Additional effect to handle rendering when needed (triggered by button clicks)
  useEffect(() => {
    if (needsRender) {
      // Reset the flag
      setNeedsRender(false);
      
      // Render the diagram if there are entities left
      if (schema.size > 0) {
        renderDiagram();
      }
    }
  }, [needsRender, schema.size, renderDiagram]);

  // Add an effect to hide action bar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        activeElement && 
        containerRef.current && 
        !event.target.closest('.action-button') &&
        !event.target.closest('.classGroup')
      ) {
        setActiveElement(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeElement]);

  // Get touch and mouse handlers from utils
  const { 
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd, 
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  } = handleDiagramInteractions({
    schema,
    scale,
    setScale,
    isPanning,
    setIsPanning,
    startPanPos,
    setStartPanPos,
    panOffset,
    setPanOffset,
    containerRef
  });

  // Update the schema and re-render diagram
  const handleUpdate = () => {
    syncJavaCodeWithSchema(code, SYNTAX_TYPES.JAVA, addEntity, addAttribute, addMethod, addMethodsFromParsedCode);
    setIsCodeModified(false);
    renderDiagram();
  };
  
  // Handler functions for action buttons
  const handleDeleteEntity = () => {
    if (activeElement) {
      removeEntity(activeElement);
      setActiveElement(null);
      setNeedsRender(true);
    }
  };
  
  const handleAddAttribute = () => {
    if (activeElement) {
      const attrName = prompt('Enter attribute name:');
      const attrType = prompt('Enter attribute type (optional):');
      
      if (attrName) {
        addAttribute(activeElement, attrName, '', attrType || '');
        setNeedsRender(true);
      }
    }
  };
  
  const handleAddMethod = () => {
    if (activeElement) {
      const methodName = prompt('Enter method name:');
      const returnType = prompt('Enter return type (optional):');
      const params = prompt('Enter parameters (optional, comma separated):');
      
      if (methodName) {
        const method = {
          name: methodName,
          returnType: returnType || 'void',
          parameters: params ? params.split(',').map(p => p.trim()) : [],
          visibility: 'public'
        };
        
        addMethod(activeElement, method);
        setNeedsRender(true);
      }
    }
  };
  
  // Function to handle removing an attribute more safely
  const handleRemoveAttribute = () => {
    if (activeElement) {
      const entity = schema.get(activeElement);
      if (entity && entity.attribute && entity.attribute.size > 0) {
        // Get all attributes and let user select which one to remove
        const attributes = Array.from(entity.attribute.keys());
        if (attributes.length === 1) {
          // If only one attribute, remove it directly
          removeAttribute(activeElement, attributes[0]);
        } else {
          // Otherwise, let user choose
          const attrToRemove = prompt(
            `Enter the name of the attribute to remove:\n${attributes.join(', ')}`,
            attributes[attributes.length - 1]
          );
          if (attrToRemove && attributes.includes(attrToRemove)) {
            removeAttribute(activeElement, attrToRemove);
          }
        }
        setNeedsRender(true);
      } else {
        alert('This entity has no attributes to remove.');
      }
    }
  };

  // Function to handle zooming to fit the diagram content
  const handleZoomToFit = () => {
    if (schema.size === 0) return; // Don't zoom if no entities
    
    const svgElement = diagramRef.current?.querySelector('svg');
    if (svgElement) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const svgWidth = svgElement.getBBox().width;
      const svgHeight = svgElement.getBBox().height;
      
      // Calculate the scale that would perfectly fit the SVG in the container
      const scaleX = containerWidth / (svgWidth + 40);
      const scaleY = containerHeight / (svgHeight + 40);
      const newScale = Math.min(scaleX, scaleY, 1); // Don't scale beyond 100%
      
      setScale(newScale);
      setPanOffset({ x: 0, y: 0 }); // Reset panning when fitting to view
    }
  };

  // Reset zoom and pan
  const handleResetView = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      flex: 1,
      minHeight: 0
    }}>
      <Toolbar>
        <Typography variant="h6" color="primary" sx={{ fontSize: '1rem' }}>
          UML Diagram
        </Typography>
        <Box>
          <Tooltip title="Add Relationship">
            <IconButton color="primary" size="small" onClick={() => setShowRelationshipManager(true)}>
              🔗
            </IconButton>
          </Tooltip>
          <Tooltip title="Open WorkBench">
            <IconButton color="primary" size="small" onClick={() => setShowWorkbench(true)}>
              🛠️
            </IconButton>
          </Tooltip>
          {schema.size > 0 && (
            <>
              <Tooltip title="Fit to View">
                <IconButton color="primary" size="small" onClick={handleZoomToFit}>
                🔍
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset View">
                <IconButton color="primary" size="small" onClick={handleResetView}>
                🔄
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Toolbar>
      
      <DiagramBox
        ref={containerRef}
        sx={{
          cursor: isPanning ? 'grabbing' : (schema.size > 0 ? 'grab' : 'default'),
          flex: 1,
          position: 'relative',
          minHeight: 0,
          height: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
        onWheel={schema.size > 0 ? handleWheel : null}
        onMouseDown={schema.size > 0 ? handleMouseDown : null}
        onMouseMove={schema.size > 0 ? handleMouseMove : null}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right-click
      >
        {/* Action bar for the selected element */}
        {activeElement && (
          <ActionBar
            sx={{
              top: `${actionBarPosition.y}px`,
              left: `${actionBarPosition.x}px`,
            }}
          >
            <Button 
              variant="contained" 
              size="small" 
              color="error"
              className="action-button"
              onClick={handleDeleteEntity}
              sx={{ fontSize: '0.7rem', py: 0.5, minWidth: '60px' }}
            >
              Delete
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              color="primary"
              className="action-button"
              onClick={handleAddAttribute}
              sx={{ fontSize: '0.7rem', py: 0.5, minWidth: '60px' }}
            >
              Add Attr
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              color="secondary"
              className="action-button"
              onClick={handleRemoveAttribute}
              sx={{ fontSize: '0.7rem', py: 0.5, minWidth: '60px' }}
            >
              Del Attr
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              color="info"
              className="action-button"
              onClick={handleAddMethod}
              sx={{ fontSize: '0.7rem', py: 0.5, minWidth: '60px' }}
            >
              Add Mthd
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              color="warning"
              className="action-button"
              onClick={() => {
                setSelectedEntity(activeElement);
                setShowRelationshipManager(true);
              }}
              sx={{ fontSize: '0.7rem', py: 0.5, minWidth: '60px' }}
            >
              Add Rel
            </Button>
          </ActionBar>
        )}
        
        {/* Zoom controls - only show if we have entities */}
        {schema.size > 0 && (
          <ZoomControls>
            <Button 
              variant="contained" 
              size="small" 
              onClick={() => setScale(Math.min(scale * 1.2, 3))}
              sx={{ minWidth: '30px', py: 0 }}
            >
              +
            </Button>
            <Button 
              variant="contained" 
              size="small"
              onClick={() => setScale(Math.max(scale * 0.8, 0.3))}
              sx={{ minWidth: '30px', py: 0 }}
            >
              -
            </Button>
            <Typography variant="body2" sx={{ mx: 1, alignSelf: 'center', fontSize: '0.75rem' }}>
              {Math.round(scale * 100)}%
            </Typography>
          </ZoomControls>
        )}
        
        {/* Diagram container with zoom and pan */}
        <div 
          style={{
            transform: schema.size > 0 ? `scale(${scale}) translate(${panOffset.x}px, ${panOffset.y}px)` : 'none',
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s',
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0, 
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div 
          ref={diagramRef} 
          id="diagram" 
          style={{ 
            height: '100%', 
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'white', // Add this
            boxShadow: 'none'         // Add this
          }} 
        />
        </div>
        
        {/* Relationship Manager - UPDATED POSITION */}
        {showRelationshipManager && (
          <Box
            sx={{
              position: 'fixed',
              top: '80px',
              right: '30px',
              zIndex: 1200,
              maxHeight: '80vh',
              overflow: 'auto',
              backgroundColor: 'white',
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px'
            }}
          >
            <RelationshipManager
              schema={schema}
              relationships={relationships}
              addRelationship={addRelationship}
              removeRelationship={removeRelationship}
              onClose={() => {
                setShowRelationshipManager(false);
                setSelectedEntity(null);
              }}
              selectedEntity={selectedEntity}
            />
          </Box>
        )}
  
        {/* Workbench - UPDATED POSITION */}
        {showWorkbench && (
          <Box
            sx={{
              position: 'fixed',
              top: '80px',
              right: '30px',
              zIndex: 1200,
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              border: '1px solid #e0e0e0',
              padding: '16px',
              width: '500px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
              Code WorkBench
            </Typography>
            <Select
              value={syntax}
              onChange={(e) => setSyntax(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              size="small"
            >
              <MenuItem value={SYNTAX_TYPES.JAVA}>Java</MenuItem>
              <MenuItem value={SYNTAX_TYPES.PYTHON}>Python</MenuItem>
            </Select>
            <Editor
              height="300px"
              language={syntax === SYNTAX_TYPES.JAVA ? 'java' : 'python'}
              theme="vs-light"
              value={code}
              onChange={(value) => {
                setCode(value);
                setIsCodeModified(true);
              }}
              options={{
                automaticLayout: true,
                padding: { top: 10, bottom: 10 },
              }}
            />
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                sx={{ fontSize: '0.8rem' }}
              >
                Generate
              </Button>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                onClick={handleUpdate}
                disabled={!isCodeModified}
                sx={{ fontSize: '0.8rem' }}
              >
                Update
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => setShowWorkbench(false)}
                sx={{ fontSize: '0.8rem' }}
              >
                Close
              </Button>
            </Box>
            {generatedCode && (
              <Box sx={{ mt: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                  {generatedCode}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DiagramBox>
    </Box>
  );
};

export default MermaidDiagram;