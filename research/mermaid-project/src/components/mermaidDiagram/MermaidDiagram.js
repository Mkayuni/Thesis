import React, { useEffect, useRef, useCallback, useState } from 'react';
import mermaid from 'mermaid';
import { Box, Tooltip, IconButton, Typography, Button, Select, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import RelationshipManager from '../relationshipManager/RelationshipManager';
import { SYNTAX_TYPES } from '../ui/ui';
import Editor from '@monaco-editor/react';
import {
  normalizeEntityName,
  extractEntityName,
  schemaToMermaidSource,
  parseCodeToSchema,
  parseMermaidToCode,
} from '../utils/mermaidUtils';

// Styled components for modern UI
const DiagramBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: '#f5f5f5',
  borderRadius: '12px',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
  overflow: 'auto',
  width: '100%',
  minHeight: '400px',
  height: 'auto',
  position: 'relative',
  zIndex: 0,
  border: '1px solid #e0e0e0',
}));

const Toolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
  marginBottom: theme.spacing(2),
}));

const WorkbenchBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '60px',
  right: '20px',
  zIndex: 1000,
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
  padding: theme.spacing(2),
  width: '600px',
}));

const MermaidDiagram = ({
  schema,
  relationships,
  removeEntity,
  removeAttribute,
  addAttribute,
  addEntity,
  addRelationship,
  removeRelationship,
}) => {
  const diagramRef = useRef(null);
  const [showRelationshipManager, setShowRelationshipManager] = useState(false);
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [code, setCode] = useState('');
  const [syntax, setSyntax] = useState(SYNTAX_TYPES.JAVA);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeModified, setIsCodeModified] = useState(false);

  // Helper function to remove the last attribute of an entity
  const removeLastAttribute = (entityName) => {
    const normalizedEntityName = normalizeEntityName(entityName);
    const entity = schema.get(normalizedEntityName);
    if (entity && entity.attribute.size > 0) {
      const lastAttribute = Array.from(entity.attribute.keys()).pop();
      if (lastAttribute) {
        removeAttribute(normalizedEntityName, lastAttribute);
      }
    } else {
      console.error(`Entity "${normalizedEntityName}" does not exist or has no attributes.`);
    }
  };

  // Render the Mermaid diagram
  const renderDiagram = useCallback(() => {
    const source = `classDiagram\n${schemaToMermaidSource(schema, relationships)}`;
    console.log('Mermaid source:', source);
    mermaid.mermaidAPI.initialize({ startOnLoad: false });
    mermaid.mermaidAPI.render('umlDiagram', source, (svgGraph) => {
      const diagramElement = diagramRef.current;
      if (diagramElement) {
        diagramElement.innerHTML = svgGraph;
        const svg = diagramElement.querySelector('svg');
        if (svg) {
          svg.style.overflow = 'visible';
          svg.setAttribute('viewBox', `-20 -20 ${svg.getBBox().width + 40} ${svg.getBBox().height + 40}`);
          svg.style.padding = '20px';
          const nodes = svg.querySelectorAll('g[class^="node"]');
          nodes.forEach((node) => {
            const nodeId = node.getAttribute('id');
            if (nodeId) {
              const entityName = extractEntityName(nodeId);
              const bbox = node.getBBox();
              const iconsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              iconsGroup.classList.add('icons-group');

              // Edit button
              const editButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              editButton.setAttribute('x', bbox.x + bbox.width + 15);
              editButton.setAttribute('y', bbox.y + 15);
              editButton.setAttribute('fill', '#007bff');
              editButton.style.cursor = 'pointer';
              editButton.style.display = 'block';
              editButton.textContent = '✏️';

              // Delete button
              const deleteButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              deleteButton.setAttribute('x', bbox.x + bbox.width + 15);
              deleteButton.setAttribute('y', bbox.y + 35);
              deleteButton.setAttribute('fill', '#ff4d4d');
              deleteButton.style.cursor = 'pointer';
              deleteButton.style.display = 'none';
              deleteButton.textContent = '🗑️';
              deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const entityName = extractEntityName(nodeId);
                if (schema.has(entityName)) {
                  removeEntity(entityName);
                }
              });

              // Minus button
              const minusButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              minusButton.setAttribute('x', bbox.x + bbox.width + 15);
              minusButton.setAttribute('y', bbox.y + 55);
              minusButton.setAttribute('fill', '#4caf50');
              minusButton.style.cursor = 'pointer';
              minusButton.style.display = 'none';
              minusButton.textContent = '➖';
              minusButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const entityName = extractEntityName(nodeId);
                removeLastAttribute(entityName);
              });

              // Relationship button
              const relationshipButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              relationshipButton.setAttribute('x', bbox.x + bbox.width + 15);
              relationshipButton.setAttribute('y', bbox.y + 75);
              relationshipButton.setAttribute('fill', '#ff9800');
              relationshipButton.style.cursor = 'pointer';
              relationshipButton.style.display = 'none';
              relationshipButton.textContent = '🔗';
              relationshipButton.addEventListener('click', (e) => {
                e.stopPropagation();
                setShowRelationshipManager(true);
              });

              // Toggle visibility of buttons on edit button click
              editButton.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteButton.style.display = deleteButton.style.display === 'none' ? 'block' : 'none';
                minusButton.style.display = minusButton.style.display === 'none' ? 'block' : 'none';
                relationshipButton.style.display = relationshipButton.style.display === 'none' ? 'block' : 'none';
              });

              // Append buttons to the group
              iconsGroup.appendChild(editButton);
              iconsGroup.appendChild(deleteButton);
              iconsGroup.appendChild(minusButton);
              iconsGroup.appendChild(relationshipButton);
              node.appendChild(iconsGroup);
            }
          });
        }
      }
    });
  }, [schema, relationships, removeEntity, removeLastAttribute]);

  // Re-render the diagram when schema or relationships change
  useEffect(() => {
    if (schema.size !== 0) {
      renderDiagram();
    }
  }, [schema, relationships, renderDiagram]);

  // Generate code from the current schema and relationships
  const handleGenerate = () => {
    const mermaidSource = schemaToMermaidSource(schema, relationships);
    const generated = parseMermaidToCode(mermaidSource, syntax);
    setGeneratedCode(generated);
    setCode(generated); // Update Monaco Editor with generated code
  };

  // Sync Java code with the schema
  const syncJavaCodeWithSchema = (javaCode) => {
    const parsedSchema = parseCodeToSchema(javaCode, SYNTAX_TYPES.JAVA);
  
    // Update the schema with the parsed data
    parsedSchema.forEach((newEntity, entityName) => {
      const currentEntity = schema.get(entityName);
      if (currentEntity) {
        // Update attributes
        newEntity.attribute.forEach((newAttr, attrName) => {
          const currentAttr = currentEntity.attribute.get(attrName);
          if (!currentAttr || currentAttr.type !== newAttr.type) {
            // Add or update the attribute with the correct type
            addAttribute(entityName, attrName, newAttr.type);
          }
        });
  
        // Update methods
        if (newEntity.methods) {
          newEntity.methods.forEach((newMethod) => {
            const existingMethod = currentEntity.methods?.find(
              (method) => method.name === newMethod.name
            );
            if (!existingMethod) {
              // Add new method to the schema
              currentEntity.methods.push(newMethod);
            }
          });
        }
      } else {
        // Add new entity
        addEntity(entityName);
        newEntity.attribute.forEach((newAttr, attrName) => {
          addAttribute(entityName, attrName, newAttr.type);
        });
  
        // Add methods for the new entity
        if (newEntity.methods) {
          newEntity.methods.forEach((method) => {
            // Add method to the schema
            currentEntity.methods.push(method);
          });
        }
      }
    });
  };

  // Update the schema based on the code in the editor
  const handleUpdate = () => {
    syncJavaCodeWithSchema(code); // Sync Java code with schema
    setIsCodeModified(false); // Reset modification flag
    renderDiagram(); // Re-render the diagram
  };

  return (
    <Box>
      <Toolbar>
        <Typography variant="h6" color="primary">
          WorkBench
        </Typography>
        <Box>
          <Tooltip title="Add Relationship">
            <IconButton color="primary" onClick={() => setShowRelationshipManager(true)}>
              🔗
            </IconButton>
          </Tooltip>
          <Tooltip title="Open WorkBench">
            <IconButton color="primary" onClick={() => setShowWorkbench(true)}>
              🛠️
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      <DiagramBox ref={diagramRef} id="diagram" />
      {showRelationshipManager && (
        <Box
          sx={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            zIndex: 1000,
          }}
        >
          <RelationshipManager
            schema={schema}
            relationships={relationships}
            addRelationship={addRelationship}
            removeRelationship={removeRelationship}
            onClose={() => setShowRelationshipManager(false)}
          />
        </Box>
      )}
      {showWorkbench && (
        <WorkbenchBox>
          <Typography variant="h6" gutterBottom>
            WorkBench
          </Typography>
          <Select
            value={syntax}
            onChange={(e) => setSyntax(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            <MenuItem value={SYNTAX_TYPES.JAVA}>Java</MenuItem>
            <MenuItem value={SYNTAX_TYPES.PYTHON}>Python</MenuItem>
          </Select>
          <Editor
            height="300px"
            language={syntax === SYNTAX_TYPES.JAVA ? 'java' : 'python'}
            theme="vs-light"
            value={code}
            onChange={(value) => {
              setCode(value);
              setIsCodeModified(true); // Enable the Update button when code is modified
            }}
            options={{
              automaticLayout: true,
              padding: { top: 10, bottom: 10 },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            sx={{ mr: 2, mt: 2 }}
          >
            Generate
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleUpdate}
            disabled={!isCodeModified}
            sx={{ mt: 2, mr: 2 }}
          >
            Update
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setShowWorkbench(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
          {generatedCode && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {generatedCode}
              </Typography>
            </Box>
          )}
        </WorkbenchBox>
      )}
    </Box>
  );
};

export default MermaidDiagram;