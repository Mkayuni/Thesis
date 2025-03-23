import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CssBaseline,
  styled,
  ThemeProvider,
  TextField,
  Button,
  Select,     
  MenuItem,   
  Divider,    
  ListSubheader, 
  FormControl,
} from '@mui/material';
import ControlsComponent from '../ControlsComponent';
import MermaidDiagram from '../mermaidDiagram/MermaidDiagram';
import QuestionSetup from '../questionSetup/QuestionSetup';
import theme from '../../theme';
import { formatUMLType } from '../utils/mermaidUtils';

// Styled Components
const MainContainer = styled(Box)(({ theme }) => ({
  height: '100vh', 
  width: '100vw', 
  backgroundColor: '#f9f9f9', 
  display: 'flex',
  overflow: 'hidden',
  position: 'relative',
  overscrollBehavior: 'none', // Prevent scroll chaining
  touchAction: 'none', // Disable default touch actions
  scrollBehavior: 'auto', // Use default scroll behavior when allowed
  WebkitOverflowScrolling: 'touch', // Improve scroll behavior on iOS
}));

const LeftPanel = styled(Box)(({ theme }) => ({
  width: 220, 
  minWidth: 220,
  backgroundColor: '#f5f7fa', 
  borderRight: '1px solid #2c3e50', 
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
  overflow: 'hidden',
}));

const RightPanel = styled(Box)(({ theme }) => ({
  flex: 1, 
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden', 
  padding: theme.spacing(2),
  height: '100%', 
  maxHeight: '100vh', 
  boxSizing: 'border-box', 
  position: 'relative', 
  overscrollBehavior: 'none', 
  touchAction: 'none' 
}));

// New floating popup component
const FloatingPopup = styled(Paper)(({ theme }) => ({
  position: 'fixed', // Use fixed instead of absolute positioning
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#ffffff',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  zIndex: 2000, // Higher z-index to ensure it's above everything
  minWidth: '300px',
  maxWidth: '80vw',
  maxHeight: '80vh',
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}));

// Question container with fixed height
const QuestionContainer = styled(Box)(({ theme }) => ({
  borderBottom: '1px solid #ddd',
  paddingBottom: theme.spacing(2),
  marginBottom: theme.spacing(2),
  flexShrink: 0, // Prevent this container from shrinking
  maxHeight: '220px', // Set a maximum height
}));

// Diagram container that will expand to fill available space
const DiagramContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden', // This is important
  minHeight: 0,
  height: '100%',
  position: 'relative',
  boxSizing: 'border-box',
  marginBottom: 0,
  paddingBottom: 0,
  backgroundColor: 'white', 
  boxShadow: 'none',        
  border: 'none', 
  touchAction: 'none', // Prevents browser handling of touch events like scrolling
  userSelect: 'none',  // Prevents text selection during dragging
  overscrollBehavior: 'none', // Prevents scroll chaining
  scrollbarWidth: 'none', // Firefox
  msOverflowStyle: 'none', // IE and Edge
  '&::-webkit-scrollbar': {
    display: 'none' // Chrome, Safari and Opera
  }
}));

const UMLContainer = ({
  schema,
  setSchema,
  showPopup,
  expandedPanel,
  setExpandedPanel,
  removeEntity,
  removeAttribute,
  relationships,
  removeRelationship,
  updateAttributeKey,
  addRelationship,
  editRelationship,
  questions,
  setQuestions,
  questionMarkdown,
  setQuestionMarkdown,
  controlsRef,
  onQuestionClick,
  hidePopup,
  addEntity,
  addAttribute,
  setRelationships,
  addMethod,
  removeMethod,
  addMethodsFromParsedCode,
  syncCodeWithSchema,
  methods,
  popup,
  entityPopupRef,
  subPopup,
  subPopupRef,
  handleAddAttributeClick,
  attributeType,
  setAttributeType,
  questionContainerRef,
  showSubPopup,
  currentQuestion,
}) => {
    const [methodName, setMethodName] = useState('');
    const [methodReturnType, setMethodReturnType] = useState('');
    const [methodParams, setMethodParams] = useState('');
    const [entityNameInput, setEntityNameInput] = useState('');
    const [attributeNameInput, setAttributeNameInput] = useState('');
    const [attributeTypeInput, setAttributeTypeInput] = useState('String');
    const [customTypeInput, setCustomTypeInput] = useState('');
    

    const preventScroll = useCallback((e) => {
      // Check if event is inside the diagram area
      if (e.target.closest('.diagram-area')) {
        e.preventDefault();
        return false;
      }
    }, []);
    
    // Add useEffect to handle this
    useEffect(() => {
      const diagramArea = document.querySelector('.diagram-area');
      if (diagramArea) {
        diagramArea.addEventListener('wheel', preventScroll, { passive: false });
        diagramArea.addEventListener('touchmove', preventScroll, { passive: false });
      }
      
      return () => {
        if (diagramArea) {
          diagramArea.removeEventListener('wheel', preventScroll);
          diagramArea.removeEventListener('touchmove', preventScroll);
        }
      };
    }, [preventScroll]);

    // Set initial value for popup inputs
    useEffect(() => {
      if (popup.visible) {
        setEntityNameInput(popup.entityOrAttribute || '');
        setAttributeNameInput(popup.entityOrAttribute || '');
        
        // If it's a method popup and we have an entity object
        if (popup.type === 'method' && typeof popup.entityOrAttribute === 'object') {
          // Pre-fill method fields if we're editing an existing method
          if (popup.entityOrAttribute.method) {
            setMethodName(popup.entityOrAttribute.method);
            
            // You would need to get the full method details from your schema
            // This is just a placeholder - implement based on your data structure
            const entity = schema.get(popup.entityOrAttribute.entity);
            if (entity && entity.methods) {
              const methodData = entity.methods.find(m => m.name === popup.entityOrAttribute.method);
              if (methodData) {
                setMethodReturnType(methodData.returnType || '');
                setMethodParams(methodData.parameters?.join(', ') || '');
              }
            }
          }
        }
      }
    }, [popup.visible, popup.entityOrAttribute, popup.type, schema]);

    // Handle method submission
    const handleMethodSubmit = () => {
      if (!methodName.trim()) return;
      
      const entityName = typeof popup.entityOrAttribute === 'object' && popup.entityOrAttribute.entity
        ? popup.entityOrAttribute.entity
        : popup.entityOrAttribute;
      
      const method = {
        name: methodName,
        returnType: methodReturnType || 'void',
        parameters: methodParams ? methodParams.split(',').map(p => p.trim()) : [],
        visibility: 'public'
      };
      
      addMethod(entityName, method);
      
      // Reset form fields
      setMethodName('');
      setMethodReturnType('');
      setMethodParams('');
      
      hidePopup();
    };


    // Handle entity submission
    const handleEntitySubmit = () => {
      if (!entityNameInput.trim()) return;
      
      addEntity(entityNameInput);
      
      // Reset form fields
      setEntityNameInput('');
      
      hidePopup();
    };

    // Add this in your handleAttributeSubmitNew function:
    const handleAttributeSubmitNew = (entity, finalType) => {
      console.log('DEBUG - handleAttributeSubmitNew called with:', { entity, finalType });
      console.log('DEBUG - attributeTypeInput:', attributeTypeInput);
      console.log('DEBUG - customTypeInput:', customTypeInput);
      
      // Get the attribute name, ensuring it's a string
      const attrName = typeof attributeNameInput === 'object' 
        ? attributeNameInput.attributeName 
        : String(attributeNameInput || '');
        
      console.log('DEBUG - attrName:', attrName);
      
      if (!attrName || attrName.trim() === '') {
        console.log('DEBUG - Empty attribute name, returning');
        return;
      }
      
      // Determine the type based on selection
      let typeToUse = finalType;
      
      if (attributeTypeInput === 'custom') {
        typeToUse = customTypeInput;
        console.log('DEBUG - Using custom type:', typeToUse);
      }
      
      // Pass the type in the correct parameter position (4th parameter)
      // The order should be: entity, attribute, key, type
      console.log('DEBUG - Final type being passed:', typeToUse);
      handleAddAttributeClick(entity, attrName, '', typeToUse);
      
      // Reset form fields
      setAttributeNameInput('');
      setAttributeTypeInput('String');
      setCustomTypeInput('');
      
      hidePopup();
    };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainContainer>
        {/* Left Panel: Controls */}
        <LeftPanel>
          <ControlsComponent
            schema={schema}
            setSchema={setSchema}
            showPopup={(e, entityOrAttribute, type) =>
              showPopup(e, entityOrAttribute, type, schema, questionContainerRef)
            }
            expandedPanel={expandedPanel}
            setExpandedPanel={setExpandedPanel}
            removeEntity={removeEntity}
            removeAttribute={removeAttribute}
            relationships={relationships}
            removeRelationship={removeRelationship}
            updateAttributeKey={updateAttributeKey}
            addRelationship={addRelationship}
            editRelationship={editRelationship}
            questions={questions}
            setQuestions={setQuestions}
            questionMarkdown={questionMarkdown}
            setQuestionMarkdown={setQuestionMarkdown}
            controlsRef={controlsRef}
            onQuestionClick={onQuestionClick}
            hidePopup={hidePopup}
            addEntity={addEntity}
            addAttribute={addAttribute}
            setRelationships={setRelationships}
            addMethod={addMethod}
            removeMethod={removeMethod}
            addMethodsFromParsedCode={addMethodsFromParsedCode}
            methods={methods}
          />
        </LeftPanel>

        {/* Right Panel: Combined Mermaid Diagram + Question Setup */}
        <RightPanel>
          {/* Section: Question Setup - Now using the styled component */}
          <QuestionContainer>
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '16px', color: '#333' }}>
            </Typography>
            <Box
              id="question-container"
              ref={questionContainerRef}
              sx={{
                maxHeight: 200,
                overflowY: 'auto',
                padding: 1,
                backgroundColor: 'grey.100',
                borderRadius: 1,
              }}
            >
              <QuestionSetup
                schema={schema}
                setSchema={setSchema}
                showPopup={(e, entityOrAttribute, type) =>
                  showPopup(e, entityOrAttribute, type, schema, questionContainerRef)
                }
                questionMarkdown={questionMarkdown}
                setQuestionMarkdown={setQuestionMarkdown}
                relationships={relationships}
                setRelationships={setRelationships}
              />
            </Box>
          </QuestionContainer>

          {/* Section: Mermaid UML Diagram - Now using the styled component */}
          <DiagramContainer
            onKeyDown={(e) => {
              // Prevent arrow keys from scrolling the viewport
              if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
              }
            }}
            tabIndex="0" // Allows the div to receive key events
          >
            <Box sx={{ 
              height: '100%',
              display: 'flex', 
              flexDirection: 'column',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%'
            }}>
              <MermaidDiagram
                schema={schema}
                relationships={relationships}
                removeEntity={removeEntity}
                removeAttribute={removeAttribute}
                addRelationship={addRelationship}
                removeRelationship={removeRelationship}
                addEntity={addEntity}
                addAttribute={addAttribute}
                updateAttributeKey={updateAttributeKey}
                editRelationship={editRelationship}
                methods={methods}
                addMethod={addMethod}
                removeMethod={removeMethod}
                addMethodsFromParsedCode={addMethodsFromParsedCode}
                syncCodeWithSchema={syncCodeWithSchema}
                currentQuestion={currentQuestion}
              />
            </Box>
          </DiagramContainer>          
          {popup.visible && (
            <FloatingPopup>
              {popup.type === 'method' && popup.entityOrAttribute && popup.entityOrAttribute.needsEntitySelection ? (
                // Entity selection popup for methods
                <>
                  <Typography variant="h6">
                    Select Class for Method
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Choose an entity to add the method "{popup.entityOrAttribute.methodName}" to:
                  </Typography>
                  
                  {Array.from(schema.keys()).map((entity) => (
                    <Button
                      key={entity}
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 1 }}
                      onClick={() => {
                        // When entity is selected, show the method form with the selected entity
                        setMethodName(popup.entityOrAttribute.methodName || '');
                        
                        // Create a new popup with the method name and selected entity
                        const methodWithEntity = {
                          entity: entity,
                          method: popup.entityOrAttribute.methodName,
                          needsEntitySelection: false
                        };
                        
                        // Show the method form with the selected entity
                        showPopup(
                          { target: document.activeElement },
                          methodWithEntity,
                          'method',
                          schema,
                          questionContainerRef
                        );
                      }}
                    >
                      {entity}
                    </Button>
                  ))}
                  
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    fullWidth 
                    onClick={hidePopup}
                    sx={{ mt: 2 }}
                  >
                    Cancel
                  </Button>
                </>
              ) : popup.type === 'method' ? (
                // Regular method form - this runs after entity is selected
                <>
                  <Typography variant="h6">
                    Add Method
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {typeof popup.entityOrAttribute === 'object' 
                      ? `To Entity: ${popup.entityOrAttribute.entity}` 
                      : `To Entity: ${popup.entityOrAttribute || 'Select Class'}`}
                  </Typography>
                  
                  <TextField
                    label="Method Name"
                    fullWidth
                    variant="outlined"
                    value={methodName}
                    onChange={(e) => setMethodName(e.target.value)}
                    margin="dense"
                  />
                  
                  <TextField
                    label="Return Type"
                    fullWidth
                    variant="outlined"
                    value={methodReturnType}
                    onChange={(e) => setMethodReturnType(e.target.value)}
                    margin="dense"
                    placeholder="void"
                  />
                  
                  <TextField
                    label="Parameters (comma separated)"
                    fullWidth
                    variant="outlined"
                    value={methodParams}
                    onChange={(e) => setMethodParams(e.target.value)}
                    margin="dense"
                    placeholder="param1: type, param2: type"
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button variant="outlined" onClick={hidePopup}>
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => {
                        // Get the entity from the popup data
                        const entityName = typeof popup.entityOrAttribute === 'object' 
                          ? popup.entityOrAttribute.entity 
                          : popup.entityOrAttribute;
                          
                        // Create the method object
                        const method = {
                          name: methodName || (popup.entityOrAttribute?.method || ''),
                          returnType: methodReturnType || 'void',
                          parameters: methodParams,
                          visibility: 'public'
                        };
                        
                        // Add the method to the entity
                        handleMethodSubmit();
                      }}
                    >
                      Add Method
                    </Button>
                  </Box>
                      </>
                ) : popup.type === 'attribute' ? (
  // Compact attribute form with chip selection
  <>
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        padding: 0,
        margin: 0
      }}
    >
      {/* Header with colored background */}
      <Box 
        sx={{ 
          backgroundColor: '#3f51b5', 
          color: 'white',
          padding: 2,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          marginBottom: 2
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Add Attribute
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          {typeof popup.entityOrAttribute === 'object' 
            ? `To: ${popup.entityOrAttribute.entity}` 
            : `To: ${popup.entities[0]}`}
        </Typography>
      </Box>

      {/* Form content */}
      <Box sx={{ px: 2, pb: 2 }} id="attribute-form-container">
        {/* Name field */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: '#555' }}>
            Name
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Enter attribute name"
            value={typeof popup.entityOrAttribute === 'object' 
              ? popup.entityOrAttribute.attributeName || '' 
              : attributeNameInput}
            onChange={(e) => {
              setAttributeNameInput(e.target.value);
            }}
            InputProps={{
              sx: { 
                borderRadius: 1,
                backgroundColor: '#f5f8fa'
              }
            }}
            autoFocus
          />
        </Box>

        {/* Type selector as compact chips */}
        <Box sx={{ mb: attributeTypeInput === 'custom' ? 1 : 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: '#555' }}>
            Type
          </Typography>
          
          <Box sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: 1, 
            padding: 1, 
            backgroundColor: '#f5f8fa',
            maxHeight: '100px',
            overflowY: 'auto'
          }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {/* Common types as small chips */}
              {['String', 'Int', 'Float', 'Boolean', 'Date', 'List'].map((type) => (
                <Box
                  key={type}
                  onClick={() => setAttributeTypeInput(type)}
                  sx={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    backgroundColor: attributeTypeInput === type ? '#3f51b5' : '#e0e0e0',
                    color: attributeTypeInput === type ? 'white' : 'rgba(0,0,0,0.7)',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: attributeTypeInput === type ? '#303f9f' : '#d5d5d5',
                    }
                  }}
                >
                  {type}
                </Box>
              ))}
              <Box
                onClick={() => setAttributeTypeInput('custom')}
                sx={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  backgroundColor: attributeTypeInput === 'custom' ? '#3f51b5' : '#e0e0e0',
                  color: attributeTypeInput === 'custom' ? 'white' : 'rgba(0,0,0,0.7)',
                  cursor: 'pointer',
                  fontStyle: 'italic',
                  '&:hover': {
                    backgroundColor: attributeTypeInput === 'custom' ? '#303f9f' : '#d5d5d5',
                  }
                }}
              >
                Custom...
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* Custom type input - shown conditionally */}
        {attributeTypeInput === 'custom' && (
          <Box sx={{ mb: 2, ml: 2 }}>
            <TextField
              label="Custom Type Name"
              fullWidth
              size="small"
              variant="outlined"
              value={customTypeInput || ''}
              onChange={(e) => {
                setCustomTypeInput(e.target.value);
              }}
              InputProps={{
                sx: { 
                  borderRadius: 1,
                  backgroundColor: '#f5f8fa'
                }
              }}
              autoFocus
            />
          </Box>
        )}

        {/* Action buttons */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: 1,
            mt: 2,
            borderTop: '1px solid #eee',
            pt: 2
          }}
        >
          <Button 
            variant="outlined" 
            onClick={hidePopup}
            sx={{ 
              borderRadius: 1.5,
              textTransform: 'none',
              px: 2
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            disableElevation
            color="primary"
            onClick={() => {
              const finalType = attributeTypeInput === 'custom' ? customTypeInput : attributeTypeInput;
              
              handleAttributeSubmitNew(
                typeof popup.entityOrAttribute === 'object' 
                  ? popup.entityOrAttribute.entity 
                  : popup.entities[0],
                finalType
              );
            }}
            sx={{ 
              borderRadius: 1.5,
              textTransform: 'none',
              px: 3,
              backgroundColor: '#3f51b5',
              '&:hover': {
                backgroundColor: '#303f9f'
              }
            }}
          >
            Add Attribute
          </Button>
        </Box>
      </Box>
    </Box>
  </>
                    
                ) : (
                  // Entity popup form - keeping this for reference
                  <>
                    <Typography variant="h6">
                      Add Class
                    </Typography>
                    
                    <TextField
                      label="Class Name"
                      fullWidth
                      variant="outlined"
                      value={entityNameInput}
                      onChange={(e) => setEntityNameInput(e.target.value)}
                      margin="dense"
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Button variant="outlined" onClick={hidePopup}>
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleEntitySubmit}
                      >
                        Add Class
                      </Button>
                      {schema.size > 0 && (
                        <Button 
                          variant="contained" 
                          color="secondary"
                          onClick={() => {
                            if (entityNameInput.trim()) {
                              showSubPopup(entityNameInput, 'attribute');
                            }
                          }}
                        >
                          Add Attribute
                        </Button>
                      )}
                    </Box>
                  </>
                )}
            </FloatingPopup>
            )}
          {/* Sub-popup for selecting entities to add attribute to */}
          {subPopup.visible && subPopup.type === 'attribute' && (
            <FloatingPopup style={{ zIndex: 2100 }}> {/* Higher z-index than the main popup */}
              <Typography variant="h6">
                Select Class for Attribute
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Choose a Class to add the attribute "{subPopup.entityOrAttribute}" to:
              </Typography>
              
              {subPopup.entities.map((entity) => (
                <Button
                  key={entity}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 1 }}
                  onClick={() => {
                    // First, close the current subpopup by hiding all popups
                    hidePopup();
                    
                    // Then use setTimeout to ensure the first popup is fully closed
                    // before showing the new one
                    setTimeout(() => {
                      // Now set the attribute name and show the new popup
                      setAttributeNameInput(subPopup.entityOrAttribute);
                      showPopup(
                        { target: document.activeElement },
                        {
                          entity: entity,
                          attributeName: subPopup.entityOrAttribute
                        },
                        'attribute',
                        schema,
                        questionContainerRef
                      );
                    }, 50); // Small delay to ensure proper cleanup
                  }}
                >
                  {entity}
                </Button>
              ))}
              
              <Button 
                variant="outlined" 
                color="secondary" 
                fullWidth 
                onClick={hidePopup}
                sx={{ mt: 2 }}
              >
                Cancel
              </Button>
            </FloatingPopup>
          )}
        </RightPanel>
      </MainContainer>
    </ThemeProvider>
  );
};

export default UMLContainer;