import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import {
  Box,
  Paper,
  Button,
  Typography,
  CssBaseline,
} from '@mui/material';
import { styled, ThemeProvider } from '@mui/material/styles';
import ControlsComponent from './ControlsComponent';
import MermaidDiagram from './mermaidDiagram/MermaidDiagram';
import QuestionSetup from './questionSetup/QuestionSetup';
import './mermaid.css';
import { usePopup } from './utils/usePopup';
import { useEntityManagement } from './entityManager/EntityManager';
import theme from '../theme';
import { parseCodeToSchema } from './utils/mermaidUtils'; 
import { SYNTAX_TYPES } from './ui/ui';
const UMLComponent = () => {
  const {
    schema,
    relationships,
    addEntity,
    removeEntity,
    addAttribute,
    updateAttributeKey,
    removeAttribute,
    removeRelationship,
    setSchema,
    setRelationships,
    addRelationship,
    editRelationship,
    addMethod, // Destructured from useEntityManagement
    removeMethod,
  } = useEntityManagement();

  const {
    popup,
    subPopup,
    entityPopupRef,
    subPopupRef,
    handleClickOutside,
    showPopup,
    hidePopup,
    adjustPopupPosition,
    setSubPopup,
  } = usePopup();

  const umlRef = useRef(null);
  const controlsRef = useRef(null);
  const questionContainerRef = useRef(null);
  const feedbackButtonRef = useRef(null);
  const feedbackContentRef = useRef(null);
  const submitButtonRef = useRef(null);
  const submitContentRef = useRef(null);

  const [questions, setQuestions] = useState([]);
  const [questionMarkdown, setQuestionMarkdown] = useState('');
  const [expandedPanel, setExpandedPanel] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [methods, setMethods] = useState([]);
  const [attributeType, setAttributeType] = useState('');
  const [generatedJavaCode] = useState('');

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false });
  }, []);

  // Fetch question titles from the server
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/questions')
      .then((response) => response.json())
      .then((data) => {
        setQuestions(data.questions);
      })
      .catch((error) => console.error('Error fetching the questions:', error));
  }, []);

  // Fetch methods for the selected question
  const fetchMethodsForQuestion = (questionTitle) => {
    fetch(`http://127.0.0.1:5000/api/question/${questionTitle}/methods`)
      .then((response) => response.json())
      .then((data) => {
        setMethods(data.methods);
      })
      .catch((error) => console.error('Error fetching methods:', error));
  };

  const fetchQuestionHtml = (questionTitle) => {
    fetch(`http://127.0.0.1:5000/api/question/${questionTitle}`)
      .then((response) => response.text())
      .then((data) => {
        setQuestionMarkdown(data);
        setSchema(new Map());
        setRelationships(new Map());
        fetchMethodsForQuestion(questionTitle);
      })
      .catch((error) => console.error('Error fetching the question HTML:', error));
  };

  const handleAddAttributeClick = (entity, attribute, type = '', key = '') => {
    if (!type) {
      console.warn(`Type is empty for Attribute: ${attribute} in Entity: ${entity}`);
    }
    addAttribute(entity, attribute, type, key);
    hidePopup();
  };

  // Updated syncJavaCodeWithSchema function
  const syncJavaCodeWithSchema = (javaCode) => {
    const parsedSchema = parseCodeToSchema(javaCode, SYNTAX_TYPES.JAVA, addMethod); // Pass addMethod here
  
    // Update the schema with the parsed data
    parsedSchema.forEach((newEntity, entityName) => {
      const currentEntity = schema.get(entityName);
  
      if (currentEntity) {
        // Update attributes
        newEntity.attribute.forEach((newAttr, attrName) => {
          const currentAttr = currentEntity.attribute.get(attrName);
          if (!currentAttr || currentAttr.type !== newAttr.type) {
            addAttribute(entityName, attrName, newAttr.type);
          }
        });
  
        // Update methods
        if (newEntity.methods) {
          newEntity.methods.forEach((newMethod) => {
            const existingMethods = currentEntity.methods || [];
            if (!existingMethods.some((method) => method.name === newMethod.name)) {
              addMethod(entityName, newMethod);
            }
          });
        }
      } else {
        // Add new entity
        addEntity(entityName);
        // Add attributes for the new entity
        newEntity.attribute.forEach((newAttr, attrName) => {
          addAttribute(entityName, attrName, newAttr.type);
        });
        // Add methods for the new entity
        if (newEntity.methods) {
          newEntity.methods.forEach((method) => {
            addMethod(entityName, method);
          });
        }
      }
    });
  };
  
  const handleAddMethodClick = (entity, methodDetails) => {
    const parameters = methodDetails.parameters
      .split(',')
      .map((param) => param.trim())
      .map((param) => {
        const [name, type] = param.split(':').map((s) => s.trim());
        return `${name}: ${type}`;
      })
      .join(', ');

    const formattedMethodDetails = {
      ...methodDetails,
      parameters,
      returnType: methodDetails.returnType,
    };

    addMethod(entity, formattedMethodDetails);
    hidePopup();
  };

  const showSubPopup = (entityOrAttribute, type, position = 'right', spacing = 5) => {
    const popupElement = document.querySelector('.popup');
    const popupWidth = popupElement ? popupElement.offsetWidth : 0;
    const popupHeight = popupElement ? popupElement.offsetHeight : 0;

    let x = popup.x + popupWidth;
    let y = popup.y + popupHeight / 2 - spacing;

    const questionContainerRect = questionContainerRef.current.getBoundingClientRect();
    if (x + popupWidth > questionContainerRect.right - questionContainerRect.left) {
      x = popup.x - popupWidth;
    }

    const adjustedPosition = adjustPopupPosition(x, y, popupWidth, popupHeight, questionContainerRef);

    setSubPopup({
      visible: true,
      x: adjustedPosition.x,
      y: adjustedPosition.y,
      entityOrAttribute,
      type,
      entities: popup.entities,
    });
  };

  const handleQuestionClick = (questionTitle) => {
    fetchQuestionHtml(questionTitle);
  };

  const handleClickInsidePopup = (event) => {
    event.stopPropagation();
  };

  const handleOutsideClick = useCallback(
    (event) => {
      if (
        (feedbackButtonRef.current && !feedbackButtonRef.current.contains(event.target)) &&
        (feedbackContentRef.current && !feedbackContentRef.current.contains(event.target))
      ) {
        setIsFeedbackOpen(false);
      }
      if (
        (submitButtonRef.current && !submitButtonRef.current.contains(event.target)) &&
        (submitContentRef.current && !submitContentRef.current.contains(event.target))
      ) {
        setIsSubmitOpen(false);
      }

      if (
        (entityPopupRef.current && entityPopupRef.current.contains(event.target)) ||
        (subPopupRef.current && subPopupRef.current.contains(event.target))
      ) {
        return;
      }

      hidePopup();
    },
    [hidePopup]
  );

  useEffect(() => {
    if (isFeedbackOpen || isSubmitOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isFeedbackOpen, isSubmitOpen, handleOutsideClick]);

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

  const Header = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: '#1976d2',
    color: '#ffffff',
    textAlign: 'center',
    width: '100%',
    boxShadow: theme.shadows[3],
    fontSize: '1.5rem',
    fontWeight: 'bold',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
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

  const QuestionContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: '#ffffff',
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    marginBottom: theme.spacing(2),
    width: '100%',
    position: 'relative',
  }));

  const FloatingButtonsContainer = styled(Box)(({ theme }) => ({
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: theme.spacing(1),
  }));

  const ExpandedContent = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    boxShadow: theme.shadows[3],
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 9999,
  }));

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
              onQuestionClick={handleQuestionClick}
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
            ref={umlRef}
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
  
}

export default UMLComponent;