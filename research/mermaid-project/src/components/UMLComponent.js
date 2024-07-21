import React, { useEffect, useState, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Box, Typography, TextField, Divider, Button, IconButton, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import QuestionSetup from './questionSetup/QuestionSetup';
import MermaidDiagram from './mermaidDiagram/MermaidDiagram'; // Ensure this import is correct
import './mermaid.css'; // Ensure this path points to your CSS file

const UMLComponent = () => {
  const [questionMarkdown, setQuestionMarkdown] = useState('');
  const [schema, setSchema] = useState(new Map());
  const [relationships, setRelationships] = useState(new Map());
  const [showEntities, setShowEntities] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);

  const diagramRef = useRef(null);
  const controlsRef = useRef(null);
  const entityPopupRef = useRef(null);
  const relationshipPopupRef = useRef(null);
  const manageEntitiesButtonRef = useRef(null);
  const manageRelationshipsButtonRef = useRef(null);
  const [popup, setPopup] = useState({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
  const [subPopup, setSubPopup] = useState({ visible: false, x: 0, y: 0, entityOrAttribute: '', entities: [] });

  const handleClickOutside = useCallback((event) => {
    if (entityPopupRef.current && !entityPopupRef.current.contains(event.target)) {
      setShowEntities(false);
    }
    if (relationshipPopupRef.current && !relationshipPopupRef.current.contains(event.target)) {
      setShowRelationships(false);
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
    overflow: 'hidden', // Disable vertical scrolling
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
    overflow: 'hidden', // Disable vertical scrolling
    borderRight: '2px solid #ddd',
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

  useEffect(() => {
    if (manageRelationshipsButtonRef.current && entityPopupRef.current && relationshipPopupRef.current) {
      const buttonWidth = manageRelationshipsButtonRef.current.offsetWidth;
      entityPopupRef.current.style.width = `${buttonWidth}px`;
      relationshipPopupRef.current.style.width = `${buttonWidth}px`;
      manageEntitiesButtonRef.current.style.width = `${buttonWidth}px`;
    }
  }, [showEntities, showRelationships]);

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
            showPopup={showPopup}
          />
          <Divider />
        </DrawerContainer>

        <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '16px', gap: '32px' }}>
            <Button
              ref={manageEntitiesButtonRef}
              variant="contained"
              color="primary"
              onClick={() => setShowEntities(!showEntities)}
            >
              Manage Entities
            </Button>

            <Button
              ref={manageRelationshipsButtonRef}
              variant="contained"
              color="primary"
              onClick={() => setShowRelationships(!showRelationships)}
            >
              Manage Relationships
            </Button>
          </Box>
          <DiagramBox ref={diagramRef} id="diagram">
            <MermaidDiagram schema={schema} relationships={relationships} />
          </DiagramBox>
        </Box>
      </Box>

      {showEntities && (
        <PopupContainer
          ref={entityPopupRef}
          style={{
            top: manageEntitiesButtonRef.current ? manageEntitiesButtonRef.current.getBoundingClientRect().bottom : '0',
            left: manageEntitiesButtonRef.current ? manageEntitiesButtonRef.current.getBoundingClientRect().left : '0',
            width: manageEntitiesButtonRef.current ? `${manageEntitiesButtonRef.current.offsetWidth}px` : 'auto', // Set width dynamically
          }}
        >
          {Array.from(schema.entries()).map(([entity, { attribute }]) => (
            <Box key={entity} sx={{ marginBottom: '16px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{entity}</Typography>
                <IconButton onClick={() => removeEntity(entity)} size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              {Array.from(attribute.entries()).map(([attr]) => (
                <Box key={attr} sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <Typography variant="body1" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{attr}</Typography>
                  <IconButton onClick={() => removeAttribute(entity, attr)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          ))}
        </PopupContainer>
      )}

      {showRelationships && (
        <PopupContainer
          ref={relationshipPopupRef}
          style={{
            top: manageRelationshipsButtonRef.current ? manageRelationshipsButtonRef.current.getBoundingClientRect().bottom : '0',
            left: manageRelationshipsButtonRef.current ? manageRelationshipsButtonRef.current.getBoundingClientRect().left : '0',
            width: manageRelationshipsButtonRef.current ? `${manageRelationshipsButtonRef.current.offsetWidth}px` : 'auto', // Set width dynamically
          }}
        >
          {Array.from(relationships.entries()).map(([id, relationship]) => (
            <Box key={id} sx={{ marginBottom: '16px' }}>
              <Typography variant="body1">{`${relationship.relationA} ${relationship.cardinalityA} - ${relationship.cardinalityB} ${relationship.relationB}`}</Typography>
              <Button onClick={() => removeRelationship(id)} size="small">Delete Relationship</Button>
            </Box>
          ))}
        </PopupContainer>
      )}

      {popup.visible && (
        <Box
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
        </Box>
      )}
      {subPopup.visible && (
        <Box
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
        </Box>
      )}
    </MainContainer>
  );
};

export default UMLComponent;
