// UMLComponent.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Box } from '@mui/material';
import ControlsComponent from './ControlsComponent';
import MermaidDiagram from './mermaidDiagram/MermaidDiagram';
import QuestionSetup from './questionSetup/QuestionSetup';
import './mermaid.css';
import { usePopup } from './utils/usePopup';
import { useEntityManagement } from './entityManager/EntityManager';
import { parseCodeToSchema } from './utils/mermaidUtils'; 
import { SYNTAX_TYPES } from './ui/ui';
import UMLContainer from './containers/UMLContainer';

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

  return (
    <UMLContainer
      schema={schema}
      setSchema={setSchema}
      showPopup={showPopup}
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
      popup={popup}
      entityPopupRef={entityPopupRef}
      subPopup={subPopup}
      subPopupRef={subPopupRef}
      handleAddAttributeClick={handleAddAttributeClick}
      attributeType={attributeType}
      setAttributeType={setAttributeType}
      questionContainerRef={questionContainerRef}
      showSubPopup={showSubPopup}
    />
  );
};

export default UMLComponent;