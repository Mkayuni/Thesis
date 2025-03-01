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
 // parseMermaidToCode,
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
  addMethod,
  addMethodsFromParsedCode,
  removeMethod,
}) => {
  const diagramRef = useRef(null);
  const [showRelationshipManager, setShowRelationshipManager] = useState(false);
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [code, setCode] = useState('');
  const [syntax, setSyntax] = useState(SYNTAX_TYPES.JAVA);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeModified, setIsCodeModified] = useState(false);
  const [needsRender, setNeedsRender] = useState(false);

  // Add this helper function to fully clear the diagram
  const clearDiagram = useCallback(() => {
    if (diagramRef.current) {
      // Completely remove all content from the diagram container
      diagramRef.current.innerHTML = '';
      
      // Add a placeholder message when the diagram is empty
      if (schema.size === 0) {
        diagramRef.current.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No diagram to display</div>';
      }
    }
  }, [schema.size]);

  // Define renderDiagram function FIRST to avoid circular dependencies
  const renderDiagram = useCallback(async () => {
    // Clear the diagram container completely before rendering
    clearDiagram();

    // If schema is empty, don't try to render anything
    if (schema.size === 0) {
      return;
    }

    // Ensure createElementNS compatibility
    if (typeof document.createElementNS !== 'function') {
      document.createElementNS = (ns, tagName) => document.createElement(tagName);
    }

    // Log the schema keys being rendered
    console.log("Rendering diagram with schema keys:", Array.from(schema.keys()));

    const source = `classDiagram\n${schemaToMermaidSource(schema, relationships)}`;
    console.log('Mermaid source:', source);

    // Initialize Mermaid with more conservative settings
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#FFFFFF',
        primaryBorderColor: '#800080',
        lineColor: '#800080',
        fontFamily: 'Arial, sans-serif',
        textColor: '#000000',
      },
      securityLevel: 'loose' // Allow more flexibility
    });

    try {
      // Ensure Mermaid has enough time to initialize
      setTimeout(async () => {
        // Check if the diagram container still exists and schema is not empty
        if (diagramRef.current && schema.size > 0) {
          try {
            const { svg } = await mermaid.render('umlDiagram', source);
            
            // Clear old content before inserting new SVG
            diagramRef.current.innerHTML = '';
            diagramRef.current.innerHTML = svg;

            // Access and customize the SVG
            const svgElement = diagramRef.current.querySelector('svg');
            if (svgElement) {
              console.log('SVG element found:', svgElement);
              svgElement.style.overflow = 'visible';
              svgElement.setAttribute('viewBox', `-20 -20 ${svgElement.getBBox().width + 40} ${svgElement.getBBox().height + 40}`);
              svgElement.style.padding = '20px';

              // Add custom icons to nodes
              const nodes = svgElement.querySelectorAll('g[class^="node"]');
              nodes.forEach((node) => {
                const nodeId = node.getAttribute('id');
                if (nodeId) {
                  console.log('Node found:', node);
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
                    // Instead of directly calling handleEntityRemoval, set entity to remove
                    if (schema.has(entityName)) {
                      // Directly remove without callbacks to avoid circular dependencies
                      console.log(`Removing entity via button: ${entityName}`);
                      removeEntity(entityName);
                      
                      // Force immediate diagram cleanup
                      setTimeout(() => {
                        clearDiagram();
                        
                        // Set flag to trigger render in useEffect
                        setNeedsRender(true);
                      }, 10);
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
                    // Handle attribute removal directly
                    const normalizedEntityName = normalizeEntityName(entityName);
                    const entity = schema.get(normalizedEntityName);
                    if (entity && entity.attribute.size > 0) {
                      const lastAttribute = Array.from(entity.attribute.keys()).pop();
                      if (lastAttribute) {
                        removeAttribute(normalizedEntityName, lastAttribute);
                        
                        // Force immediate diagram cleanup after attribute removal
                        setTimeout(() => {
                          clearDiagram();
                          setNeedsRender(true);
                        }, 10);
                      }
                    }
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
          } catch (err) {
            console.error('Mermaid render error:', err);
            clearDiagram(); // Ensure diagram is cleared on error
          }
        }
      }, 10); // Slightly longer delay for more reliable initialization
    } catch (error) {
      console.error('Error rendering Mermaid diagram:', error);
      clearDiagram(); // Ensure diagram is cleared on error
    }
  }, [schema, relationships, clearDiagram, removeEntity, removeAttribute]);

  // Add a schema version state to force re-renders
  const [schemaVersion, setSchemaVersion] = useState(0);

  // Update the effect to thoroughly clean up and re-render on schema changes
  useEffect(() => {
    // Increment schema version when schema changes
    setSchemaVersion(prev => prev + 1);
    
    // Clear diagram immediately on schema change
    clearDiagram();
    
    // Only render if we have entities
    if (schema.size > 0) {
      const timerId = setTimeout(() => {
        renderDiagram();
      }, 20); // Slightly longer delay for reliability
      
      return () => {
        clearTimeout(timerId);
        clearDiagram(); // Clean up on unmount or before re-render
      };
    }
  }, [schema, relationships, renderDiagram, clearDiagram]);

  // Additional effect to handle rendering when needed (triggered by button clicks)
  useEffect(() => {
    if (needsRender) {
      // Reset the flag
      setNeedsRender(false);
      
      // Render the diagram if there are entities left
      if (schema.size > 0) {
        renderDiagram();
      }
    }
  }, [needsRender, schema.size, renderDiagram]);

  // In MermaidDiagram.js, syncJavaCodeWithSchema function
  const syncJavaCodeWithSchema = (javaCode) => {
    // First, parse the schema
    const parsedSchema = parseCodeToSchema(javaCode, SYNTAX_TYPES.JAVA, addMethod, addMethodsFromParsedCode);
    console.log("Parsed Schema:", parsedSchema);

    // First pass: Create all entities and add attributes
    parsedSchema.forEach((newEntity, entityName) => {
      addEntity(entityName);
      console.log(`First pass - Created entity: ${entityName}`);
      
      // Add attributes
      newEntity.attribute.forEach((attr, attrName) => {
        addAttribute(entityName, attrName, attr.type);
        console.log(`Added attribute: ${attrName} to ${entityName}`);
      });
    });
    
    // Second pass: Now that all entities exist, add methods
    parsedSchema.forEach((newEntity, entityName) => {
      if (newEntity.methods && newEntity.methods.length > 0) {
        console.log(`Second pass - Adding ${newEntity.methods.length} methods to ${entityName}`);
        addMethodsFromParsedCode(entityName, newEntity.methods);
      }
    });
  };

  // Update the schema and re-render diagram
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
            // onClick={handleGenerate}
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