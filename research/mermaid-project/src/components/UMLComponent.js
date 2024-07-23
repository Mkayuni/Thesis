import React, { useEffect, useState, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Box, Paper, Typography, IconButton, Accordion, AccordionSummary, AccordionDetails, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import ControlsComponent from './ControlsComponent';
import MermaidDiagram from './mermaidDiagram/MermaidDiagram';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QuestionSetup from './questionSetup/QuestionSetup';
import './mermaid.css'; // Ensure this path points to your CSS file

const UMLComponent = () => {
  const [questionMarkdown, setQuestionMarkdown] = useState('');
  const [questions, setQuestions] = useState([]);
  const [schema, setSchema] = useState(new Map());
  const [relationships, setRelationships] = useState(new Map());
  const [expandedPanel, setExpandedPanel] = useState(false);

  const controlsRef = useRef(null);
  const entityPopupRef = useRef(null);
  const relationshipPopupRef = useRef(null);
  const [popup, setPopup] = useState({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
  const [subPopup, setSubPopup] = useState({ visible: false, x: 0, y: 0, entityOrAttribute: '', entities: [] });

  const handleClickOutside = useCallback((event) => {
    if (entityPopupRef.current && !entityPopupRef.current.contains(event.target)) {
      setExpandedPanel(false);
    }
    if (relationshipPopupRef.current && !relationshipPopupRef.current.contains(event.target)) {
      setExpandedPanel(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const showPopup = useCallback((e, entityOrAttribute, type) => {
    if (e.preventDefault) e.preventDefault(); // Check if preventDefault exists
    const rect = e.target ? e.target.getBoundingClientRect() : { left: 0, bottom: 0, right: 0, top: 0 };

    const popupWidth = 200; // Approximate width of the popup, adjust as necessary
    const popupHeight = 100; // Approximate height of the popup, adjust as necessary

    const controlsRect = controlsRef.current.getBoundingClientRect();

    let x = rect.left; // Start right below the selected word
    let y = rect.bottom; // Align the top of the popup with the bottom of the button

    if (x + popupWidth > controlsRect.right) {
      x = controlsRect.right - popupWidth - 10; // Move to the left if it overflows
    }
    if (y + popupHeight > controlsRect.bottom) {
      y = controlsRect.bottom - popupHeight - 10; // Adjust if it overflows vertically
    }

    setPopup({
      visible: true,
      x,
      y,
      entityOrAttribute,
      type,
      entities: Array.from(schema.keys()),
    });
  }, [schema]);

  const hidePopup = () => {
    setPopup({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
    setSubPopup({ visible: false, x: 0, y: 0, entityOrAttribute: '', entities: [] });
  };

  const adjustPopupPosition = (x, y, popupWidth, popupHeight) => {
    const controlsRect = controlsRef.current.getBoundingClientRect();
    if (x + popupWidth > controlsRect.right) {
      x = controlsRect.right - popupWidth - 10; // 10px padding
    }
    if (y + popupHeight > controlsRect.bottom) {
      y = controlsRect.bottom - popupHeight - 10; // 10px padding
    }
    return { x, y };
  };

  const showSubPopup = (entityOrAttribute, position = 'right', spacing = 5) => {
    const popupElement = document.querySelector('.popup');
    const popupWidth = popupElement ? popupElement.offsetWidth : 0;
    const popupHeight = popupElement ? popupElement.offsetHeight : 0;

    let x = popup.x;
    let y = popup.y;

    if (position === 'right') {
      x += popupWidth + spacing; // Adding adjustable spacing
    } else if (position === 'left') {
      x -= (popupWidth + spacing); // Adjust to move left
    } else if (position === 'above') {
      y -= (popupHeight + spacing); // Adjust to move above
    } else if (position === 'below') {
      y += (popupHeight + spacing); // Adding adjustable spacing
    }

    const adjustedPosition = adjustPopupPosition(x, y, popupWidth, popupHeight);

    setSubPopup({
      visible: true,
      x: adjustedPosition.x,
      y: adjustedPosition.y,
      entityOrAttribute,
      entities: popup.entities,
    });
  };

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true });
  }, []);

  useEffect(() => {
    fetch('/api/diagram')
      .then((response) => response.json())
      .then((data) => {
        const questionList = data.content.split('\n').filter(line => line.trim() !== '');
        setQuestions(questionList);
      })
      .catch((error) => console.error('Error fetching the questions:', error));
  }, []);

  const addEntity = useCallback((entity) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.set(entity, { entity, attribute: new Map() });
      return newSchema;
    });
    hidePopup();
  }, []);

  const removeEntity = useCallback((entity) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.delete(entity);
      return newSchema;
    });
  }, []);

  const addAttribute = useCallback((entity, attribute, key = '') => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (entityData) {
        entityData.attribute.set(attribute, { attribute, key });
        newSchema.set(entity, entityData);
      }
      return newSchema;
    });
    hidePopup();
  }, []);

  const addRelationship = useCallback((relationA, relationB, cardinalityA, cardinalityB, cardinalityText) => {
    setRelationships((prevRelationships) => {
      const newRelationships = new Map(prevRelationships);
      const relCount = newRelationships.size;
      const relationship = {
        id: relCount,
        relationA,
        cardinalityA,
        cardinalityB,
        relationB,
        cardinalityText,
      };
      newRelationships.set(relCount, relationship);
      return newRelationships;
    });
  }, []);

  const editRelationship = useCallback((id, relationA, relationB, cardinalityA, cardinalityB, cardinalityText) => {
    setRelationships((prevRelationships) => {
      const newRelationships = new Map(prevRelationships);
      const relationship = {
        id,
        relationA,
        cardinalityA,
        cardinalityB,
        relationB,
        cardinalityText,
      };
      newRelationships.set(id, relationship);
      return newRelationships;
    });
  }, []);

  const removeRelationship = useCallback((id) => {
    setRelationships((prevRelationships) => {
      const newRelationships = new Map(prevRelationships);
      newRelationships.delete(id);
      return newRelationships;
    });
  }, []);

  const removeAttribute = useCallback((entity, attribute) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (entityData) {
        entityData.attribute.delete(attribute);
        newSchema.set(entity, entityData);
      }
      return newSchema;
    });
  }, []);

  const cleanUMLQuestion = (markdown) => {
    const cleanedText = markdown.replace(/\[([^\]]+)]\([^)]+\)/g, '$1');
    return cleanedText;
  };

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
    overflow: 'hidden', // Prevent vertical overflow
    whiteSpace: 'nowrap', // Prevent text wrapping
  }));

  const PopupContainer = styled(Paper)(({ theme }) => ({
    position: 'absolute',
    padding: theme.spacing(2),
    backgroundColor: 'white',
    border: '1px solid #ccc',
    boxShadow: theme.shadows[5],
    zIndex: 1000,
    maxHeight: '80vh',
    overflowY: 'auto',
    width: 'fit-content', // Ensure the width is based on content
  }));

  return (
    <MainContainer>
      <Header>AutoER-Kayuni</Header>
      <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', width: '100%' }}>
        <ControlsComponent
          questionMarkdown={questionMarkdown}
          setQuestionMarkdown={setQuestionMarkdown}
          schema={schema}
          setSchema={setSchema}
          showPopup={showPopup}
          questions={questions}
          setQuestions={setQuestions}
          expandedPanel={expandedPanel}
          setExpandedPanel={setExpandedPanel}
          removeEntity={removeEntity}
          removeAttribute={removeAttribute}
          relationships={relationships}
          removeRelationship={removeRelationship}
          controlsRef={controlsRef}
        />
        <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 2 }}>
          <QuestionSetup
            questionMarkdown={questionMarkdown}
            setQuestionMarkdown={setQuestionMarkdown}
            schema={schema}
            setSchema={setSchema}
            showPopup={showPopup}
          />
          <MermaidDiagram schema={schema} relationships={relationships} />
        </Box>
      </Box>
      {popup.visible && (
        <PopupContainer
          style={{
            top: popup.y,
            left: popup.x,
          }}
        >
          {popup.type === 'attribute' ? (
            popup.entities.map((entity) => (
              <div key={entity}>
                <button onClick={() => addAttribute(entity, popup.entityOrAttribute)}>{entity}</button>
              </div>
            ))
          ) : (
            <>
              <div>
                <button onClick={() => addEntity(popup.entityOrAttribute)}>Add Entity</button>
              </div>
              <div>
                <button onClick={() => showSubPopup(popup.entityOrAttribute, 'right', 5)}>Add Attribute</button>
                {/* You can call showSubPopup with different positions and spacings */}
              </div>
            </>
          )}
        </PopupContainer>
      )}
      {subPopup.visible && (
        <PopupContainer
          style={{
            top: subPopup.y,
            left: subPopup.x,
          }}
        >
          {subPopup.entities.map((entity) => (
            <div key={entity}>
              <button onClick={() => addAttribute(entity, subPopup.entityOrAttribute)}>{entity}</button>
            </div>
          ))}
        </PopupContainer>
      )}
    </MainContainer>
  );
};

export default UMLComponent;