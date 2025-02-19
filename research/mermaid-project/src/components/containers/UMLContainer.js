import React from 'react';
import {
  Box,
  Paper,
  Typography,
  CssBaseline,
} from '@mui/material';
import { styled, ThemeProvider } from '@mui/material/styles';
import ControlsComponent from '../ControlsComponent';
import MermaidDiagram from '../mermaidDiagram/MermaidDiagram';
import QuestionSetup from '../questionSetup/QuestionSetup';
import theme from '../../theme';

const MainContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#f9f9f9',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  overflow: 'hidden',
  width: '100vw',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    flexDirection: 'column',
  },
}));

const PopupContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  padding: theme.spacing(2),
  backgroundColor: '#bbbbbb',
  color: '#000000',
  border: '1px solid #ccc',
  boxShadow: theme.shadows[5],
  zIndex: 1000,
  maxHeight: '80vh',
  overflowY: 'auto',
  width: 'fit-content',
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
}) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainContainer>
        {/* Main Content Area */}
        <Box sx={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden', gap: 2, padding: 2 }}>
          
          {/* Left Panel: Controls */}
          <Box
            sx={{
              flex: 1,
              minWidth: 300,
              maxWidth: 350,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'background.paper',
              boxShadow: 2,
              borderRadius: 2,
              padding: 2,
            }}
          >
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
              methods={methods}
            />
          </Box>
  
          {/* Center Panel: Questions & UML Diagram */}
          <Box
            sx={{
              flex: 3,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: 'background.paper',
              boxShadow: 2,
              borderRadius: 2,
              padding: 2,
              position: 'relative',
            }}
          >
            {/* Section: Question Setup */}
            <Box
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                paddingBottom: 2,
                marginBottom: 2,
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '16px', color: '#333' }}>
                Question Setup
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
            </Box>
  
            {/* Section: Mermaid UML Diagram */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
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
              />
            </Box>
  
            {/* Popups for Adding Entities & Attributes (Restored Clickable Buttons) */}
            {popup.visible && (
              <PopupContainer
                ref={entityPopupRef}
                sx={{
                  position: 'absolute',
                  top: popup.y + 40,
                  left: popup.x,
                  padding: 2,
                  backgroundColor: '#ffffff',
                  boxShadow: 3,
                  borderRadius: 2,
                  zIndex: 1000,
                  border: '1px solid #ddd',
                  fontSize: '14px',
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
                  position: 'absolute',
                  top: subPopup.y + 40,
                  left: subPopup.x,
                  padding: 2,
                  backgroundColor: '#ffffff',
                  boxShadow: 3,
                  borderRadius: 2,
                  zIndex: 1000,
                  border: '1px solid #ddd',
                  fontSize: '14px',
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
          </Box>
        </Box>
      </MainContainer>
    </ThemeProvider>
  );
};

export default UMLContainer;