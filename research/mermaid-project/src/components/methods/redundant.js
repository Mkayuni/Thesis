import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Box, Tooltip, IconButton, Typography, Button, Select, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import RelationshipManager from '../relationshipManager/RelationshipManager';
import { SYNTAX_TYPES } from '../ui/ui';
import _ from 'lodash';
import MonacoEditorWrapper from '../monacoWrapper/MonacoEditorWrapper';
import { parseCodeToSchema } from '../utils/mermaidUtils';

import { 
  renderMermaidDiagram, 
  clearMermaidDiagram, 
  handleDiagramInteractions,
  syncJavaCodeWithSchema
} from '../utils/MermaidDiagramUtils';

// Styled components - Remove all container styling
const DiagramBox = styled(Box)(({ theme }) => ({
  padding: 0, // Remove padding
  backgroundColor: 'transparent', // Make background transparent
  borderRadius: 0,
  overflow: 'hidden',
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 0,
  border: 'none',
  boxShadow: 'none',
  display: 'flex',
  flexDirection: 'column',
  touchAction: 'none',
  userSelect: 'none'
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
  currentQuestion,
  
}) => {
  const diagramRef = useRef(null);
  const containerRef = useRef(null);
  const [showRelationshipManager, setShowRelationshipManager] = useState(false);
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [code, setCode] = useState('');
  const [syntax, setSyntax] = useState(SYNTAX_TYPES.JAVA);
  const [workbenchData, setWorkbenchData] = useState({
    code: '',
    syntax: SYNTAX_TYPES.JAVA,
    questionId: null,
    generatedCode: '',
    isCodeModified: false,
    consoleOutput: ''
  });
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeModified, setIsCodeModified] = useState(false);
  const [needsRender, setNeedsRender] = useState(false);
  const [isWorkbenchFullscreen, setIsWorkbenchFullscreen] = useState(false);
  
  // States for zoom and pan functionality
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });
  const [selectedEntity, setSelectedEntity] = useState(null);
  
  // State for tracking the active element and action bar
  const [activeElement, setActiveElement] = useState(null);
  const [actionBarPosition, setActionBarPosition] = useState({ x: 0, y: 0 });
  
  // State for tracking click vs drag
  const [mouseDownTime, setMouseDownTime] = useState(0);
  const [isClick, setIsClick] = useState(true);

  // Clear diagram function - imported from utils but with local state ref
  const clearDiagram = useCallback(() => {
    clearMermaidDiagram(diagramRef, schema.size);
  }, [schema.size]);

  // Render diagram function - imported but with local refs and state
  const debouncedRenderDiagram = useCallback(
    _.debounce(async () => {
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
    }, 300), // 300ms debounce time
    [schema, relationships, clearDiagram, removeEntity, removeAttribute, isPanning, scale]
  );

  // When showing the workbench, set the associated question
  const handleOpenWorkbench = () => {
    setShowWorkbench(true);
    setWorkbenchData(prev => ({
      ...prev,
      questionId: currentQuestion
    }));
  };

  // Custom function to remove container styles from SVG after it's rendered
  useEffect(() => {
    const removeContainerStyling = () => {
      if (diagramRef.current) {
        const svgElement = diagramRef.current.querySelector('svg');
        if (svgElement) {
          // Remove any background, borders, or shadows from the SVG
          svgElement.style.background = 'transparent';
          svgElement.style.boxShadow = 'none';
          svgElement.style.border = 'none';
          svgElement.style.overflow = 'visible';
          
          // Remove container styling from all diagram elements
          const rectangles = svgElement.querySelectorAll('rect');
          rectangles.forEach(rect => {
            if (rect.classList && !rect.classList.contains('label')) {
              rect.setAttribute('filter', 'none');
              rect.setAttribute('stroke-width', '1px');
            }
          });
        }
      }
    };
    
    // Add a mutation observer to watch for changes in the diagram container
    if (diagramRef.current) {
      const observer = new MutationObserver(() => {
        removeContainerStyling();
      });
      
      observer.observe(diagramRef.current, { 
        childList: true,
        subtree: true 
      });
      
      return () => observer.disconnect();
    }
  }, []);

  // Update the effect to thoroughly clean up and re-render on schema changes
  useEffect(() => {
    // Only render if we have entities, without clearing first
    if (schema.size > 0) {
      debouncedRenderDiagram();
      
      return () => {
        debouncedRenderDiagram.cancel(); // Cancel any pending debounced renders
      };
    } else {
      clearDiagram(); // Only clear if no entities
    }
  }, [schema, relationships, debouncedRenderDiagram, clearDiagram]);

  // Additional effect to handle rendering when needed (triggered by button clicks)
  useEffect(() => {
    if (needsRender) {
      // Reset the flag
      setNeedsRender(false);
      
      // Render the diagram if there are entities left
      if (schema.size > 0) {
        debouncedRenderDiagram();
      }
    }
  }, [needsRender, schema.size, debouncedRenderDiagram]);

  // Add this to MermaidDiagram.js component
useEffect(() => {
  // Add class when component mounts
  document.body.classList.add('diagram-active');
  
  // Remove class when component unmounts
  return () => {
    document.body.classList.remove('diagram-active');
  };
}, []);

  // Add an effect to hide action bar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        activeElement && 
        containerRef.current && 
        !event.target.closest('.action-button') &&
        !event.target.closest('.classGroup') &&
        isClick // Only hide if it was a click, not a drag
      ) {
        setActiveElement(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeElement, isClick]);

  // Prevent default behaviour
  useEffect(() => {
    const preventArrowScroll = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', preventArrowScroll);
    return () => {
      window.removeEventListener('keydown', preventArrowScroll);
    };
  }, []);

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

  // Custom handlers to differentiate between clicks and drags
  const handleContainerMouseDown = (e) => {
    if (schema.size === 0) return;
    
    // Determine if this is a direct click on the container vs a diagram element
    const isClassElement = e.target.closest('.classGroup') || 
                           e.target.closest('.node') || 
                           e.target.closest('.label') ||
                           e.target.closest('.action-button');
    
    setMouseDownTime(Date.now());
    setIsClick(true);
    
    if (!isClassElement || e.button === 1 || e.button === 2) {
      // Only start panning if not clicking on a class element or using middle/right button
      handleMouseDown(e);
    }
  };
  
  const handleContainerMouseMove = (e) => {
    if (isPanning) {
      // If we've moved while mouse is down, it's a drag, not a click
      if (isClick && Date.now() - mouseDownTime > 100) {
        setIsClick(false);
      }
      handleMouseMove(e);
    }
  };
  
  const handleContainerMouseUp = (e) => {
    const wasDragging = !isClick;
    handleMouseUp(e);
    
    // If this was a quick click and not a drag operation, process normal click behavior
    if (isClick && Date.now() - mouseDownTime < 200) {
      // This was a quick click on background - can deselect any selected entity
      const isClassElement = e.target.closest('.classGroup') || 
                             e.target.closest('.node') || 
                             e.target.closest('.label') ||
                             e.target.closest('.action-button');
      
      if (!isClassElement) {
        setActiveElement(null);
      }
    }
  };

  // Update the schema and re-render diagram
    const handleUpdate = () => {
      syncJavaCodeWithSchema(
        workbenchData.code, 
        workbenchData.syntax, 
        addEntity, 
        addAttribute, 
        addMethod, 
        addMethodsFromParsedCode,
        workbenchData.questionId // Pass the question ID to link it with the code
      );
      
      setWorkbenchData({
        ...workbenchData,
        isCodeModified: false
      });
      
      debouncedRenderDiagram();
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


  //Logic for submit test run
  const handleTestRun = () => {
    if (!workbenchData.code) {
      setWorkbenchData({
        ...workbenchData,
        consoleOutput: "<span style='color: #ff6b6b'>❌ Error: No code to validate.</span>"
      });
      return;
    }
  
    // Run validation logic
    const results = validateCodeInComponent(workbenchData.code, workbenchData.syntax);
    
    // Update the console output with results
    setWorkbenchData({
      ...workbenchData,
      consoleOutput: results.messages.join('<br>')
    });
    
    if (results.isValid) {
      // If validation passed, add success message
      setWorkbenchData(prev => ({
        ...prev,
        consoleOutput: prev.consoleOutput + "<br><br><span style='color: #1dd1a1'>✅ Code structure looks good! Ready to submit.</span>"
      }));
    }
  };

  // Implement a component version of the validation logic
const validateCodeInComponent = (code, syntax) => {
  const errors = [];
  let isValid = true;
  
  // Check for class declarations
  if (!code.includes('class ')) {
    errors.push({
      line: 1, // Default to line 1 for general errors
      message: 'Error: No class declarations found.',
      severity: 'error'
    });
    isValid = false;
  }
  
  if (syntax === SYNTAX_TYPES.JAVA) {
    // Check for missing semicolons in Java
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Skip comments, empty lines, and lines that don't need semicolons
      const trimmedLine = line.trim();
      if (trimmedLine === '' || 
          trimmedLine.startsWith('//') || 
          trimmedLine.startsWith('/*') || 
          trimmedLine.startsWith('*') || 
          trimmedLine.startsWith('}') || 
          trimmedLine.startsWith('{') || 
          trimmedLine.endsWith('{') || 
          trimmedLine.endsWith('}')) {
        return;
      }
      
      // Check if line needs a semicolon but doesn't have one
      if (!trimmedLine.endsWith(';') && 
          !trimmedLine.includes('class ') && 
          !trimmedLine.includes('interface ') &&
          !trimmedLine.includes('@')) {
        errors.push({
          line: lineNumber,
          message: 'Syntax error: Missing semicolon at the end of statement.',
          severity: 'error'
        });
        isValid = false;
      }
    });
    
    // Check for assignment errors (missing value after equals sign)
    const assignmentErrorRegex = /=\s*;/g;
    let assignMatch;
    while ((assignMatch = assignmentErrorRegex.exec(code)) !== null) {
      const lineIndex = code.substring(0, assignMatch.index).split('\n').length - 1;
      errors.push({
        line: lineIndex + 1,
        message: "Syntax error: Assignment missing value after equals sign.",
        severity: 'error'
      });
      isValid = false;
    }
    
    // Check for missing opening braces in method declarations
    const methodDeclarationRegex = /(\w+\s+\w+\s*\([^)]*\))\s*(?![{])/g;
    let methodMatch;
    while ((methodMatch = methodDeclarationRegex.exec(code)) !== null) {
      // Make sure this isn't an interface method that ends with semicolon
      const nextChar = code.substring(methodMatch.index + methodMatch[0].length).trim()[0];
      if (nextChar !== '{' && nextChar !== ';') {
        const lineIndex = code.substring(0, methodMatch.index).split('\n').length - 1;
        errors.push({
          line: lineIndex + 1,
          message: "Syntax error: Missing opening brace '{' after method declaration.",
          severity: 'error'
        });
        isValid = false;
      }
    }
    
    // Check braces balance
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push({
        line: 1,
        message: `Error: Unbalanced braces. Opening: ${openBraces}, Closing: ${closeBraces}`,
        severity: 'error'
      });
      isValid = false;
    }
    
    // Add the positive class found message
    const classRegex = /class\s+(\w+)/g;
    const foundClasses = [];
    let classMatch;
    while ((classMatch = classRegex.exec(code)) !== null) {
      foundClasses.push(classMatch[1]);
    }
    
    if (foundClasses.length > 0) {
      errors.push({
        line: 1,
        message: `Found ${foundClasses.length} classes: ${foundClasses.join(', ')}`,
        severity: 'info'
      });
    }
  }
  
  // Format the errors for display
  const messages = errors.map(error => {
    let color;
    let icon;
    
    switch(error.severity) {
      case 'error':
        color = '#ff6b6b';
        icon = '❌';
        break;
      case 'warning':
        color = '#feca57';
        icon = '⚠️';
        break;
      case 'info':
        color = '#54a0ff';
        icon = 'ℹ️';
        break;
      default:
        color = '#f0f0f0';
        icon = '';
    }
    
    return `<span style="color: ${color}">${icon} Line ${error.line}: ${error.message}</span>`;
  });
  
  return { isValid, messages, errors };
};

  //Submission Logic
  const handleSubmitForGrading = () => {
    if (!workbenchData.questionId) {
      alert("Please select a question before submitting");
      return;
    }
    
    // Prepare the submission data
    const submissionData = {
      questionId: workbenchData.questionId,
      code: workbenchData.code,
      schema: Array.from(schema.entries()), // Convert map to array for JSON
      relationships: Array.from(relationships.entries())
    };
    
    // Send to your backend for grading
    fetch('http://127.0.0.1:5000/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Grading result:', data);
      // Handle the grading response, e.g., show feedback
    })
    .catch((error) => {
      console.error('Error submitting for grading:', error);
    });
  };

  // Add this function in your component
  const addDiagnosticMarkers = (editor, monaco, errors) => {
    const model = editor.getModel();
    if (!model) return;
    
    // Clear previous markers
    monaco.editor.setModelMarkers(model, 'owner', []);
    
    // Add new markers
    const markers = errors.map(err => ({
      severity: monaco.MarkerSeverity.Error,
      message: err.message,
      startLineNumber: err.line,
      startColumn: 1,
      endLineNumber: err.line,
      endColumn: model.getLineMaxColumn(err.line)
    }));
    
    monaco.editor.setModelMarkers(model, 'owner', markers);
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
          <IconButton color="primary" size="small" onClick={handleOpenWorkbench}>
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
        className="diagram-area"
        sx={{
          cursor: isPanning ? 'grabbing' : (schema.size > 0 ? 'grab' : 'default'),
          flex: 1,
          position: 'relative',
          minHeight: 0,
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          background: 'transparent', // Ensure transparent background
          overflow: 'hidden',
          overscrollBehavior: 'none', // Prevent scroll chaining
          touchAction: 'none', // Disable default touch actions
          userSelect: 'none', // Prevent text selection
          scrollbarWidth: 'none', // Hide scrollbars in Firefox
          msOverflowStyle: 'none', // Hide scrollbars in IE/Edge
          WebkitOverflowScrolling: 'touch',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          // Fix for iOS and macOS trackpads
          '&, & *': {
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none',
            scrollBehavior: 'auto'
          },
          '&::-webkit-scrollbar': {
            display: 'none' // Hide scrollbars in Chrome/Safari
          }
        }}
        onKeyDown={(e) => {
          // Prevent arrow keys from scrolling the viewport
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
          }
        }}
        tabIndex="0" // Allows the div to receive key events
        onWheel={(e) => {
          e.preventDefault(); // Explicitly prevent default
          e.stopPropagation(); // Prevent event propagation
          if (schema.size > 0) handleWheel(e);
        }}
        onMouseDown={schema.size > 0 ? handleContainerMouseDown : null}
        onMouseMove={schema.size > 0 ? handleContainerMouseMove : null}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={handleContainerMouseUp}
        onTouchStart={(e) => {
          e.stopPropagation();
          handleTouchStart(e);
        }}
        onTouchMove={(e) => {
          e.preventDefault(); // Explicitly prevent default
          e.stopPropagation();
          handleTouchMove(e);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          handleTouchEnd(e);
        }}
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
            alignItems: 'center',
            cursor: isPanning ? 'grabbing' : 'grab',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: 0,
            margin: 0,
            overscrollBehavior: 'none', 
            touchAction: 'none', 
            userSelect: 'none' 
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
              backgroundColor: 'transparent', // Changed to transparent
              boxShadow: 'none',
              border: 'none',
              padding: 0,
              margin: 0
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
              top: isWorkbenchFullscreen ? '0' : '80px',
              right: isWorkbenchFullscreen ? '0' : '30px',
              left: isWorkbenchFullscreen ? '0' : 'auto', 
              bottom: isWorkbenchFullscreen ? '0' : 'auto',
              zIndex: 1200,
              backgroundColor: '#ffffff',
              borderRadius: isWorkbenchFullscreen ? '0' : '4px',
              border: '1px solid #e0e0e0',
              padding: '16px',
              width: isWorkbenchFullscreen ? '100%' : '500px',
              height: isWorkbenchFullscreen ? '100%' : 'auto',
              maxHeight: isWorkbenchFullscreen ? '100%' : '80vh',
              overflow: 'auto',
              transition: 'all 0.3s ease-out',
              display: 'flex', // Add flex display
              flexDirection: 'column' // Stack children vertically
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontSize: '1rem', margin: 0 }}>
                Code WorkBench {workbenchData.questionId && `- ${workbenchData.questionId}`}
              </Typography>
              <Box>
                <IconButton 
                  size="small" 
                  onClick={() => setIsWorkbenchFullscreen(!isWorkbenchFullscreen)}
                >
                  {isWorkbenchFullscreen ? '⤓' : '⤢'}
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => setShowWorkbench(false)}
                >
                  ✖️
                </IconButton>
              </Box>
            </Box>
            <Select
              value={workbenchData.syntax}
              onChange={(e) => setWorkbenchData({...workbenchData, syntax: e.target.value})}
              fullWidth
              sx={{ mb: 2 }}
              size="small"
            >
              <MenuItem value={SYNTAX_TYPES.JAVA}>Java</MenuItem>
              <MenuItem value={SYNTAX_TYPES.PYTHON}>Python</MenuItem>
            </Select>
                  
            {/* Fixed height container for the editor */}
            <MonacoEditorWrapper
            height={isWorkbenchFullscreen ? "calc(100vh - 120px)" : "300px"}
            language={workbenchData.syntax === SYNTAX_TYPES.JAVA ? 'java' : 'python'}
            theme="vs-light"
            value={workbenchData.code}
            onChange={(value) => {
              setWorkbenchData(prev => ({...prev, code: value, isCodeModified: true}));
            }}
            options={{
              automaticLayout: true,
              padding: { top: 10, bottom: 10 },
            }}
            // Add this right after your MonacoEditorWrapper's onMount handler:
            onMount={(editor, monaco) => {
              // Configure language support
              if (!monaco.languages.getLanguages().some(lang => lang.id === 'java')) {
                // Register Java language if not already registered
                monaco.languages.register({ id: 'java' });
              }
              
              if (!monaco.languages.getLanguages().some(lang => lang.id === 'python')) {
                // Register Python language if not already registered
                monaco.languages.register({ id: 'python' });
              }
              
              // Set up a listener for model changes to check for errors
              editor.onDidChangeModelContent(() => {
                setTimeout(() => {
                  // Get the model for the current editor
                  const model = editor.getModel();
                  if (!model) return;
                  
                  // Run custom validation
                  const { isValid, messages, errors } = validateCodeInComponent(editor.getValue(), workbenchData.syntax);
                  
                  // Add diagnostic markers based on our custom validation
                  const markers = errors.map(err => ({
                    severity: err.severity === 'error' ? monaco.MarkerSeverity.Error : 
                              err.severity === 'warning' ? monaco.MarkerSeverity.Warning : 
                              monaco.MarkerSeverity.Info,
                    message: err.message,
                    startLineNumber: err.line,
                    startColumn: 1,
                    endLineNumber: err.line,
                    endColumn: model.getLineMaxColumn(err.line) || 1
                  }));
                  
                  // Set markers on the model
                  monaco.editor.setModelMarkers(model, 'custom-validation', markers);
                  
                  // Update the console output with error messages
                  if (messages.length > 0) {
                    setWorkbenchData(prev => ({
                      ...prev,
                      consoleOutput: messages.join('<br>')
                    }));
                  }
                }, 300); // Small delay to ensure Monaco has processed the changes
              });
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
                disabled={!workbenchData.isCodeModified}
                sx={{ fontSize: '0.8rem' }}
              >
               Update
              </Button>
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={handleTestRun}
                sx={{ fontSize: '0.8rem' }}
              >
                Test Run
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleSubmitForGrading}
                disabled={!workbenchData.questionId || !workbenchData.code}
                sx={{ fontSize: '0.8rem' }}
              >
                Submit for Grading
              </Button>
            </Box>
            
            {/* Console output */}
            {workbenchData.consoleOutput && (
              <Box 
              sx={{ 
                mt: 1, 
                p: 1, 
                backgroundColor: '#1e1e1e', 
                color: '#f0f0f0',
                fontFamily: 'monospace',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap'
              }}
              dangerouslySetInnerHTML={{ __html: workbenchData.consoleOutput }}
            />
          )}
            {/* Generated code display */}
            {workbenchData.generatedCode && (
              <Box sx={{ mt: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                  {workbenchData.generatedCode}
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