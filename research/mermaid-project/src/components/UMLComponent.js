import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { Box, Button, Container, Typography } from '@mui/material';
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

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true });
    const diagramElement = document.getElementById('diagram');
    if (diagramElement) {
      diagramElement.style.backgroundColor = '#e0f7fa';
    }
  }, []);

  const fetchAndRenderUMLContent = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/convert_file');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const questionElement = document.getElementById('question');
      const diagramElement = document.getElementById('diagram');

      if (questionElement) {
        questionElement.innerHTML = `<p>${data.question}</p>`;
      }
      if (diagramElement) {
        diagramElement.innerHTML = `<div class="mermaid">${data.mermaid_code}</div>`;
      }
      mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    } catch (error) {
      console.error('Error fetching and rendering UML content:', error);
    }
  };

  const fetchAndRenderYAMLContent = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/convert_yaml_file');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const diagramElement = document.getElementById('diagram');
      if (diagramElement) {
        diagramElement.innerHTML = `<div class="mermaid">${data.mermaid_code}</div>`;
      }
      mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    } catch (error) {
      console.error('Error fetching and rendering YAML content:', error);
    }
  };

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

  const ButtonContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(4),
    gap: theme.spacing(2),
  }));

  return (
    <Container sx={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)' }}>
      <Typography variant="h4" sx={{ marginBottom: '16px', fontWeight: 'bold', color: '#0066ff' }}>
        Welcome to the UML Project
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: '24px', color: '#333' }}>
        This is a test paragraph to ensure the HTML is being displayed correctly.
      </Typography>

      <ButtonContainer>
        <Button variant="contained" color="primary" onClick={fetchAndRenderUMLContent} sx={{ flex: 1 }}>
          Load UML Diagram
        </Button>
        <Button variant="contained" color="secondary" onClick={fetchAndRenderYAMLContent} sx={{ flex: 1 }}>
          Load YAML Diagram
        </Button>
      </ButtonContainer>

      <Box id="question" sx={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' }} />

      <Box id="diagram" sx={{ padding: '16px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' }} />

      <QuestionSetup
        questionMarkdown={questionMarkdown}
        setQuestionMarkdown={setQuestionMarkdown}
        schema={schema}
        setSchema={setSchema}
        attributes={attributes}
        setAttributes={setAttributes}
      />
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
      <RelationshipManager
        relationships={relationships}
        setRelationships={setRelationships}
        addRelationship={addRelationship}
        editRelationship={editRelationship}
        removeRelationship={removeRelationship}
      />
      <MermaidDiagram schema={schema} relationships={relationships} />
    </Container>
  );
};

export default UMLComponent;
