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
    addMethod,
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
  const [generatedJavaCode, ] = useState(''); 

  
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

  const syncJavaCodeWithSchema = (javaCode) => {
    const parsedSchema = parseCodeToSchema(javaCode, SYNTAX_TYPES.JAVA);
  
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
        newEntity.methods.forEach((newMethod) => {
          const existingMethods = currentEntity.methods || [];
          const methodExists = existingMethods.some((m) => m.name === newMethod.name);
  
          if (!methodExists) {
            addMethod(entityName, newMethod);
          }
        });
      } else {
        // Add new entity
        addEntity(entityName);
  
        // Add attributes
        newEntity.attribute.forEach((newAttr, attrName) => {
          addAttribute(entityName, attrName, newAttr.type);
        });
  
        // Add methods
        newEntity.methods.forEach((newMethod) => {
          addMethod(entityName, newMethod);
        });
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
        <Header>AutoER-Kayuni</Header>
        <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', width: '100%' }}>
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
            methods={methods}  // Pass methods to ControlsComponent
          />
          <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 2, position: 'relative' }} ref={umlRef}>
            <QuestionContainer id="question-container" ref={questionContainerRef}>
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
              {popup.visible && (
                <PopupContainer
                  ref={entityPopupRef}
                  style={{
                    top: popup.y,
                    left: popup.x,
                  }}
                >
                  {popup.type === 'attribute' ? (
                    popup.entities.map((entity) => (
                      <div key={entity}>
                        <input
                          type="text"
                          placeholder="Enter type (e.g., String)"
                          onChange={(e) => setAttributeType(e.target.value)}
                        />
                        <button onClick={() => handleAddAttributeClick(entity, popup.entityOrAttribute, attributeType)}>
                          {entity}
                        </button>
                      </div>
                    ))
                  ) : (
                    <>
                      <div>
                        <button onClick={() => addEntity(popup.entityOrAttribute)}>Add Entity</button>
                      </div>
                      <div>
                        <button onClick={() => showSubPopup(popup.entityOrAttribute, 'attribute', 'right', 5)}>
                          Add Attribute
                        </button>
                      </div>
                    </>
                  )}
                </PopupContainer>
              )}
              {subPopup.visible && subPopup.type === 'attribute' && (
                <PopupContainer
                  ref={subPopupRef}
                  style={{
                    top: subPopup.y,
                    left: subPopup.x,
                  }}
                >
                  {subPopup.entities.map((entity) => (
                    <div key={entity}>
                      <button onClick={() => handleAddAttributeClick(entity, subPopup.entityOrAttribute)}>
                        {entity}
                      </button>
                    </div>
                  ))}
                </PopupContainer>
              )}
              {subPopup.visible && subPopup.type === 'method' && (
                <PopupContainer
                  ref={subPopupRef}
                  style={{
                    top: subPopup.y,
                    left: subPopup.x,
                  }}
                  onClick={handleClickInsidePopup}
                >
                  <div>
                  </div>
                </PopupContainer>
              )}
            </QuestionContainer>
            <Box sx={{ flex: 1, overflow: 'auto', height: '500px', width: '100%' }} ref={umlRef}>
              <MermaidDiagram schema={schema} relationships={relationships} 
              removeEntity={removeEntity} removeAttribute={removeAttribute} addRelationship={addRelationship} removeRelationship={removeRelationship} addEntity={addEntity} addAttribute={addAttribute}  updateAttributeKey={updateAttributeKey} editRelationship={editRelationship} methods={methods} addMethod={addMethod}
              removeMethod={removeMethod}/>
            </Box>
            <FloatingButtonsContainer>
              {isFeedbackOpen && (
                <ExpandedContent ref={feedbackContentRef} sx={{ width: '200px' }}>
                  <Typography>Feedback Content</Typography>
                  {/* Add feedback form or content here */}
                </ExpandedContent>
              )}
              {isSubmitOpen && (
                <ExpandedContent ref={submitContentRef} sx={{ width: '100px' }}>
                  <Typography>Submit Content</Typography>
                  {/* Add submit form or content here */}
                </ExpandedContent>
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  ref={feedbackButtonRef}
                  variant="contained"
                  color="primary"
                  onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}
                  sx={{ width: '200px' }}
                >
                  Feedback
                </Button>
                <Button
                  ref={submitButtonRef}
                  variant="contained"
                  color="secondary"
                  onClick={() => setIsSubmitOpen(!isSubmitOpen)}
                  sx={{ width: '100px' }}
                >
                  Submit
                </Button>
              </Box>
            </FloatingButtonsContainer>
          </Box>
        </Box>
      </MainContainer>
    </ThemeProvider>
  );
};

export default UMLComponent;
