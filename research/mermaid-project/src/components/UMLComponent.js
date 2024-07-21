import React, { useEffect, useState, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Box, Typography, TextField, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import QuestionSetup from './questionSetup/QuestionSetup';
import EntityManager from './entityManager/EntityManager';
import RelationshipManager from './relationshipManager/RelationshipManager';
import MermaidDiagram from './mermaidDiagram/MermaidDiagram';
import './mermaid.css'; // Ensure this path points to your CSS file

const UMLComponent = () => {
  const [questionMarkdown, setQuestionMarkdown] = useState('');
  const [schema, setSchema] = useState(new Map());
  const [attributes, setAttributes] = useState(new Map());
  const [relationships, setRelationships] = useState(new Map());

  const diagramRef = useRef(null);
  const controlsRef = useRef(null);
  const [popup, setPopup] = useState({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
  const [subPopup, setSubPopup] = useState({ visible: false, x: 0, y: 0, entityOrAttribute: '', entities: [] });

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
      y += popupHeight + spacing; // Adding adjustable spacing
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
    const diagramElement = diagramRef.current;
    if (diagramElement) {
      diagramElement.style.backgroundColor = '#f5f5f5';
    }
  }, [schema, relationships]);

  const addEntity = useCallback((entity) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.set(entity, { entity, attribute: new Map() });
      return newSchema;
    });
    hidePopup();
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

    setAttributes((prevAttributes) => {
      const newAttributes = new Map(prevAttributes);
      if (!newAttributes.has(attribute)) {
        const enMap = new Map();
        enMap.set(entity, true);
        newAttributes.set(attribute, { attribute, entities: enMap });
      } else {
        const attObj = newAttributes.get(attribute);
        attObj.entities.set(entity, true);
      }
      return newAttributes;
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

  const DiagramBox = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: '#ffffff',
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    flex: 3,
    overflow: 'auto',
  }));

  const DrawerContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: '#ffffff',
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    flex: 1,
    overflow: 'auto',
    borderRight: '2px solid #ddd',
  }));

  const Footer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: '#1976d2',
    color: '#ffffff',
    textAlign: 'center',
    position: 'fixed',
    bottom: 0,
    width: '100%',
    boxShadow: theme.shadows[3],
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
  }));

  const UMLHeader = styled(Typography)(({ theme }) => ({
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: '16px',
    textAlign: 'center',
    textDecoration: 'underline',
    textDecorationColor: 'orange',
  }));

  return (
    <MainContainer>
      <Header>AutoER-Kayuni</Header>
      <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', width: '100%' }}>
        <DrawerContainer ref={controlsRef}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '16px' }}>
            Controls
          </Typography>
          <TextField
            placeholder="Enter UML question here"
            value={questionMarkdown}
            onChange={(e) => setQuestionMarkdown(e.target.value)}
            multiline
            rows={4}
            fullWidth
            sx={{ marginBottom: '24px' }}
          />
          <QuestionSetup
            questionMarkdown={questionMarkdown}
            setQuestionMarkdown={setQuestionMarkdown}
            schema={schema}
            setSchema={setSchema}
            attributes={attributes}
            setAttributes={setAttributes}
            showPopup={showPopup}
          />
          <Divider />
          <Typography variant="h6" sx={{ marginBottom: '16px' }}>
            Entity Manager
          </Typography>
          <EntityManager
            schema={schema}
            setSchema={setSchema}
            attributes={attributes}
            setAttributes={setAttributes}
            addEntity={addEntity}
            addAttribute={addAttribute}
            showPopup={showPopup}
          />
          <Divider />
          <Typography variant="h6" sx={{ marginBottom: '16px' }}>
            Relationship Manager
          </Typography>
          <RelationshipManager
            relationships={relationships}
            setRelationships={setRelationships}
            addRelationship={addRelationship}
            editRelationship={editRelationship}
            removeRelationship={removeRelationship}
          />
        </DrawerContainer>

        <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <UMLHeader variant="h4">UML Diagram</UMLHeader>
          <DiagramBox ref={diagramRef} id="diagram">
            <MermaidDiagram schema={schema} relationships={relationships} />
          </DiagramBox>
        </Box>
      </Box>
      <Footer>
        <Typography variant="body1">
          © 2024 Your Company. All rights reserved.
        </Typography>
      </Footer>
      {popup.visible && (
        <div
          className="popup" // Added a class for the popup
          style={{
            position: 'absolute',
            top: popup.y,
            left: popup.x,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            padding: '10px',
            zIndex: 1000,
            maxWidth: '100%', // Ensure it doesn't overflow
            maxHeight: '100%', // Ensure it doesn't overflow
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
        </div>
      )}
      {subPopup.visible && (
        <div
          style={{
            position: 'absolute',
            top: subPopup.y,
            left: subPopup.x,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            padding: '10px',
            zIndex: 1000,
            maxWidth: '100%', // Ensure it doesn't overflow
            maxHeight: '100%', // Ensure it doesn't overflow
          }}
        >
          {subPopup.entities.map((entity) => (
            <div key={entity}>
              <button onClick={() => addAttribute(entity, subPopup.entityOrAttribute)}>{entity}</button>
            </div>
          ))}
        </div>
      )}
    </MainContainer>
  );
};

export default UMLComponent;
