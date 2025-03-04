import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CssBaseline,
  styled,
  ThemeProvider,
} from '@mui/material';
import ControlsComponent from '../ControlsComponent';
import MermaidDiagram from '../mermaidDiagram/MermaidDiagram';
import QuestionSetup from '../questionSetup/QuestionSetup';
import theme from '../../theme';


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

const PopupContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  padding: theme.spacing(2),
  backgroundColor: '#ffffff',
  boxShadow: theme.shadows[5],
  zIndex: 1000,
  maxHeight: '80vh',
  overflowY: 'auto',
  width: 'fit-content',
  border: '1px solid #ddd',
  borderRadius: theme.shape.borderRadius,
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
// In UMLContainer.jsx
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

          {/* Popups for Adding Entities & Attributes */}
          {popup.visible && (
            <PopupContainer
              ref={entityPopupRef}
              sx={{
                top: popup.y + 40,
                left: popup.x,
              }}
            >
              {popup.type === 'attribute' ? (
                popup.entities.map((entity) => (
                  <Box key={entity} sx={{ marginBottom: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px', color: '#444' }}>
                      Add Attribute to {entity}
                    </Typography>
                    <input
                      type="text"
                      placeholder="Enter type (e.g., String)"
                      onChange={(e) => setAttributeType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        fontSize: '12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        marginBottom: '5px',
                      }}
                    />
                    <button
                      onClick={() => handleAddAttributeClick(entity, popup.entityOrAttribute, attributeType)}
                      style={{
                        backgroundColor: '#1976d2',
                        color: '#fff',
                        fontSize: '12px',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Add Attribute
                    </button>
                  </Box>
                ))
              ) : (
                <>
                  <button
                    onClick={() => addEntity(popup.entityOrAttribute)}
                    style={{
                      backgroundColor: '#1976d2',
                      color: '#fff',
                      fontSize: '12px',
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Add Entity
                  </button>
                  <button
                    onClick={() => showSubPopup(popup.entityOrAttribute, 'attribute', 'right', 5)}
                    style={{
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      fontSize: '12px',
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginLeft: '8px',
                    }}
                  >
                    Add Attribute
                  </button>
                </>
              )}
            </PopupContainer>
          )}

          {/* Sub-popup for Adding a Specific Attribute to an Entity */}
          {subPopup.visible && subPopup.type === 'attribute' && (
            <PopupContainer
              ref={subPopupRef}
              sx={{
                top: subPopup.y + 40,
                left: subPopup.x,
              }}
            >
              {subPopup.entities.map((entity) => (
                <div key={entity}>
                  <button
                    onClick={() => handleAddAttributeClick(entity, subPopup.entityOrAttribute)}
                    style={{
                      backgroundColor: '#FF9800',
                      color: '#fff',
                      fontSize: '12px',
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginBottom: '5px',
                    }}
                  >
                    Add Attribute to {entity}
                  </button>
                </div>
              ))}
            </PopupContainer>
          )}
        </RightPanel>
      </MainContainer>
    </ThemeProvider>
  );
};

export default UMLContainer;