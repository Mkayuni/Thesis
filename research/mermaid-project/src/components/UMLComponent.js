import React, { useEffect, useState, useRef } from 'react';
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
  const [popup, setPopup] = useState({ visible: false, x: 0, y: 0, entity: '' });

  const showPopup = (e, entity) => {
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    setPopup({ visible: true, x: rect.left, y: rect.bottom, entity });
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

  const addEntity = (entity) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.set(entity, { entity, attribute: new Map() });
      return newSchema;
    });
    setPopup({ visible: false, x: 0, y: 0, entity: '' });
  };

  const addAttribute = (entity, attribute, key = '') => {
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
    setPopup({ visible: false, x: 0, y: 0, entity: '' });
  };

  const addRelationship = (relationA, relationB, cardinalityA, cardinalityB, cardinalityText) => {
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
  };

  const editRelationship = (id, relationA, relationB, cardinalityA, cardinalityB, cardinalityText) => {
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
  };

  const removeRelationship = (id) => {
    setRelationships((prevRelationships) => {
      const newRelationships = new Map(prevRelationships);
      newRelationships.delete(id);
      return newRelationships;
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
        <DrawerContainer>
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
          style={{
            position: 'absolute',
            top: popup.y,
            left: popup.x,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            padding: '10px',
            zIndex: 1000,
          }}
        >
          <div>
            <button onClick={() => addEntity(popup.entity)}>Add Entity</button>
          </div>
          <div>
            <button onClick={() => addAttribute(popup.entity)}>Add Attribute</button>
          </div>
        </div>
      )}
    </MainContainer>
  );
};

export default UMLComponent;
