import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Box, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import ControlsComponent from './ControlsComponent';
import MermaidDiagram from './mermaidDiagram/MermaidDiagram';
import QuestionSetup from './questionSetup/QuestionSetup';
import './mermaid.css';
import { usePopup } from './utils/popupUtils';
import { useEntityManagement } from './entityManager/EntityManager';

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
    editRelationship
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
  const [questions, setQuestions] = useState([]);
  const [questionMarkdown, setQuestionMarkdown] = useState('');
  const [expandedPanel, setExpandedPanel] = useState(false);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true });
  }, []);

  useEffect(() => {
    fetch('/api/diagram')
      .then((response) => response.json())
      .then((data) => {
        const questionList = data.content.split('\n').filter((line) => line.trim() !== '');
        setQuestions(questionList);
      })
      .catch((error) => console.error('Error fetching the questions:', error));
  }, []);

  const handleAddAttributeClick = (entity, attribute, key = '') => {
    addAttribute(entity, attribute, key);
    hidePopup();
  };

  const showSubPopup = (entityOrAttribute, position = 'right', spacing = 5) => {
    const popupElement = document.querySelector('.popup');
    const popupWidth = popupElement ? popupElement.offsetWidth : 0;
    const popupHeight = popupElement ? popupElement.offsetHeight : 0;

    let x = popup.x;
    let y = popup.y;

    if (position === 'right') {
      x += popupWidth + spacing;
    } else if (position === 'left') {
      x -= popupWidth + spacing;
    } else if (position === 'above') {
      y -= popupHeight + spacing;
    } else if (position === 'below') {
      y += popupHeight + spacing;
    }

    const adjustedPosition = adjustPopupPosition(x, y, popupWidth, popupHeight, umlRef);

    setSubPopup({
      visible: true,
      x: adjustedPosition.x,
      y: adjustedPosition.y,
      entityOrAttribute,
      entities: popup.entities,
    });
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
    overflow: 'hidden',
    whiteSpace: 'nowrap',
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
    width: 'fit-content',
  }));

  return (
    <MainContainer>
      <Header>AutoER-Kayuni</Header>
      <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', width: '100%' }}>
        <ControlsComponent
          schema={schema}
          setSchema={setSchema}
          showPopup={(e, entityOrAttribute, type) => showPopup(e, entityOrAttribute, type, schema, umlRef)}
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
        />
        <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 2 }} ref={umlRef}>
          <QuestionSetup
            schema={schema}
            setSchema={setSchema}
            showPopup={(e, entityOrAttribute, type) => showPopup(e, entityOrAttribute, type, schema, umlRef)}
            questionMarkdown={questionMarkdown}
            setQuestionMarkdown={setQuestionMarkdown}
            relationships={relationships}
            setRelationships={setRelationships}
          />
          <MermaidDiagram schema={schema} relationships={relationships} />
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
                    <button onClick={() => handleAddAttributeClick(entity, popup.entityOrAttribute)}>{entity}</button>
                  </div>
                ))
              ) : (
                <>
                  <div>
                    <button onClick={() => addEntity(popup.entityOrAttribute)}>Add Entity</button>
                  </div>
                  <div>
                    <button onClick={() => showSubPopup(popup.entityOrAttribute, 'right', 5)}>Add Attribute</button>
                  </div>
                </>
              )}
            </PopupContainer>
          )}
          {subPopup.visible && (
            <PopupContainer
              ref={subPopupRef}
              style={{
                top: subPopup.y,
                left: subPopup.x,
              }}
            >
              {subPopup.entities.map((entity) => (
                <div key={entity}>
                  <button onClick={() => handleAddAttributeClick(entity, subPopup.entityOrAttribute)}>{entity}</button>
                </div>
              ))}
            </PopupContainer>
          )}
        </Box>
      </Box>
    </MainContainer>
  );
};

export default UMLComponent;
