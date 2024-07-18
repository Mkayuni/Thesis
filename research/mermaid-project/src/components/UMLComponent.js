import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import { Box, Container, Typography, TextField, Drawer, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import QuestionSetup from './questionSetup/QuestionSetup';
import EntityManager from './entityManager/EntityManager';
import RelationshipManager from './relationshipManager/RelationshipManager';
import MermaidDiagram from './mermaidDiagram/MermaidDiagram';

const UMLComponent = () => {
  const [questionMarkdown, setQuestionMarkdown] = useState('');
  const [schema, setSchema] = useState(new Map());
  const [attributes, setAttributes] = useState(new Map());
  const [relationships, setRelationships] = useState(new Map());

  const diagramRef = useRef(null);
  const questionRef = useRef(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true });
  }, []);

  useEffect(() => {
    const diagramElement = diagramRef.current;
    if (diagramElement) {
      diagramElement.style.backgroundColor = '#f5f5f5';
    }
  }, [schema, relationships]);

  useEffect(() => {
    const questionElement = questionRef.current;
    if (questionElement) {
      questionElement.innerHTML = questionMarkdown;
    }
  }, [questionMarkdown]);

  const addEntity = (entity) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.set(entity, { entity, attribute: new Map() });
      return newSchema;
    });
  };

  const removeEntity = (entity) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.delete(entity);
      return newSchema;
    });
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
  };

  const removeAttribute = (entity, attribute) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (entityData) {
        entityData.attribute.delete(attribute);
        newSchema.set(entity, entityData);
      }
      return newSchema;
    });

    setAttributes((prevAttributes) => {
      const newAttributes = new Map(prevAttributes);
      const attObj = newAttributes.get(attribute);
      if (attObj) {
        attObj.entities.delete(entity);
        if (attObj.entities.size === 0) {
          newAttributes.delete(attribute);
        }
      }
      return newAttributes;
    });
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

  const MainContainer = styled(Container)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: '#ffffff',
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    height: '100vh',
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
      flexDirection: 'column',
    },
  }));

  const DiagramBox = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: '#f5f5f5',
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
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    flex: 1,
    overflow: 'auto',
  }));

  return (
    <MainContainer>
      <DrawerContainer>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0066ff', marginBottom: '16px' }}>
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
          removeEntity={removeEntity}
          addAttribute={addAttribute}
          removeAttribute={removeAttribute}
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

      <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0066ff', marginBottom: '16px' }}>
          UML Diagram
        </Typography>
        <Box ref={questionRef} id="question" sx={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' }} />
        <DiagramBox ref={diagramRef} id="diagram" />
        <MermaidDiagram schema={schema} relationships={relationships} />
      </Box>
    </MainContainer>
  );
};

export default UMLComponent;
