import React, { useEffect, useRef, useCallback, useState } from 'react';
import mermaid from 'mermaid';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const DiagramBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#ffffff',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  flex: 3,
  overflow: 'visible',
  width: '100%',
  height: '100%',
  position: 'relative',
  zIndex: 0,
}));

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const normalizeEntityName = (name) => {
  return name.replace(/\s+/g, '').toLowerCase();
};

const extractEntityName = (nodeId) => {
  const parts = nodeId.split('-');
  return parts.length >= 2 ? normalizeEntityName(parts[1]) : normalizeEntityName(nodeId);
};

const MermaidDiagram = ({ schema, relationships, removeEntity, removeAttribute, addRelationship }) => {
  const diagramRef = useRef(null);
  const [sourceEntity, setSourceEntity] = useState(null); // Track the source entity for relationships
  const [showCircles, setShowCircles] = useState(false); // Track whether to show the circles

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

  // Function to handle entity selection (only for circles)
  const handleEntityClick = (entityName) => {
    if (!sourceEntity) {
      // If no source entity is selected, set this as the source
      setSourceEntity(entityName);
      console.log('Source entity selected:', entityName); // Debugging log
    } else {
      // If a source entity is already selected, set this as the target and create a relationship
      const targetEntity = entityName;
      console.log('Target entity selected:', targetEntity); // Debugging log
      const cardinalityA = '1'; // Default cardinality
      const cardinalityB = '*'; // Default cardinality
      addRelationship(sourceEntity, targetEntity, cardinalityA, cardinalityB);
      setSourceEntity(null); // Reset source entity
      setShowCircles(false); // Hide circles after relationship is created
    }
  };

  // Add circle indicators for target entities
  const addCircleIndicators = (svg) => {
    const nodes = svg.querySelectorAll('g[class^="node"]');
    nodes.forEach((node) => {
      const nodeId = node.getAttribute('id');
      if (nodeId) {
        const entityName = extractEntityName(nodeId);

        // Remove existing circle if any
        const existingCircle = node.querySelector('.target-circle');
        if (existingCircle) {
          existingCircle.remove();
        }

        // Add a circle indicator if a source entity is selected and this is not the source entity
        if (showCircles && sourceEntity && entityName !== sourceEntity) {
          const bbox = node.getBBox();

          // Calculate the position of the relationship symbol
          const relationshipButtonX = bbox.x + bbox.width + 10; // X position of the relationship symbol
          const relationshipButtonY = bbox.y + 70; // Y position of the relationship symbol

          // Add a circle below the relationship symbol
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', relationshipButtonX + 5); // Adjust X position (center of the relationship symbol)
          circle.setAttribute('cy', relationshipButtonY + 20); // Adjust Y position (below the relationship symbol)
          circle.setAttribute('r', 10); // Circle radius
          circle.setAttribute('fill', '#00ff00'); // Green color
          circle.setAttribute('class', 'target-circle');
          circle.style.cursor = 'pointer';
          circle.addEventListener('click', () => {
            handleEntityClick(entityName);
          });
          node.appendChild(circle);
        }
      }
    });
  };

  const schemaToMermaidSource = useCallback(() => {
    let schemaText = [];
    schema.forEach((schemaItem) => {
      const entityName = capitalizeFirstLetter(schemaItem.entity);
      let item = `class ${entityName} {\n`;

      const attributes = Array.from(schemaItem.attribute.values()).sort((a, b) => {
        if ((a.key === 'PK' || a.key === 'PPK') && (b.key !== 'PK' && b.key !== 'PPK')) return -1;
        if ((b.key === 'PK' || b.key === 'PPK') && (a.key !== 'PK' && a.key !== 'PPK')) return 1;
        return 0;
      });

      const attributeLines = attributes.map((attItem) => {
        const visibility = attItem.visibility === 'private' ? '-' : attItem.visibility === 'protected' ? '#' : '+';
        return `  ${visibility}${attItem.attribute}: ${attItem.type} ${attItem.key ? `(${attItem.key})` : ''}`;
      });

      const methodLines = schemaItem.methods?.map((method) => {
        const visibilitySymbol = method.visibility === 'private' ? '-' : method.visibility === 'protected' ? '#' : '+';
        const staticKeyword = method.static ? 'static ' : '';
        const parameters = method.parameters ? method.parameters.join(', ') : '';
        return `  ${visibilitySymbol}${staticKeyword}${method.name}(${parameters})`;
      }) || [];

      if (attributeLines.length > 0) {
        item += attributeLines.join('\n');
      } else {
        item += '  No attributes\n';
      }

      if (methodLines.length > 0) {
        item += '\n' + methodLines.join('\n');
      }

      item += '\n}\n';
      schemaText.push(item);
    });

    relationships.forEach((rel) => {
      schemaText.push(`${capitalizeFirstLetter(rel.relationA)}"${rel.cardinalityA}"--"${rel.cardinalityB}"${capitalizeFirstLetter(rel.relationB)}`);
    });

    return schemaText.join('\n');
  }, [schema, relationships]);

  const renderDiagram = useCallback(() => {
    const source = `classDiagram\n${schemaToMermaidSource()}`;
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

          // Add circle indicators for target entities
          addCircleIndicators(svg);

          const nodes = svg.querySelectorAll('g[class^="node"]');
          nodes.forEach((node) => {
            const nodeId = node.getAttribute('id');
            if (nodeId) {
              const entityName = extractEntityName(nodeId);

              const bbox = node.getBBox();

              const iconsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              iconsGroup.classList.add('icons-group');

              const editButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              editButton.setAttribute('x', bbox.x + bbox.width + 10);
              editButton.setAttribute('y', bbox.y + 10);
              editButton.setAttribute('fill', '#007bff');
              editButton.style.cursor = 'pointer';
              editButton.style.display = 'block';
              editButton.textContent = '✏️';

              const deleteButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              deleteButton.setAttribute('x', bbox.x + bbox.width + 10);
              deleteButton.setAttribute('y', bbox.y + 30);
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

              const minusButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              minusButton.setAttribute('x', bbox.x + bbox.width + 10);
              minusButton.setAttribute('y', bbox.y + 50);
              minusButton.setAttribute('fill', '#4caf50');
              minusButton.style.cursor = 'pointer';
              minusButton.style.display = 'none';
              minusButton.textContent = '➖';
              minusButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const entityName = extractEntityName(nodeId);
                removeLastAttribute(entityName);
              });

              const relationshipButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              relationshipButton.setAttribute('x', bbox.x + bbox.width + 10);
              relationshipButton.setAttribute('y', bbox.y + 70);
              relationshipButton.setAttribute('fill', '#ff9800');
              relationshipButton.style.cursor = 'pointer';
              relationshipButton.style.display = 'none'; // Initially hidden
              relationshipButton.textContent = '🔗';
              relationshipButton.addEventListener('click', (e) => {
                e.stopPropagation();
                setShowCircles(true); // Show circles when relationship symbol is clicked
                setSourceEntity(entityName); // Set the source entity
                addCircleIndicators(svg); // Update circle indicators after click
              });

              // Toggle visibility of delete, minus, and relationship buttons
              editButton.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteButton.style.display = deleteButton.style.display === 'none' ? 'block' : 'none';
                minusButton.style.display = minusButton.style.display === 'none' ? 'block' : 'none';
                relationshipButton.style.display = relationshipButton.style.display === 'none' ? 'block' : 'none';
              });

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
  }, [schemaToMermaidSource, removeEntity, schema, removeLastAttribute, showCircles]);

  useEffect(() => {
    if (schema.size !== 0) {
      renderDiagram();
    }
  }, [schema, relationships, renderDiagram]);

  // Hide circles when clicking outside the diagram
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (diagramRef.current && !diagramRef.current.contains(event.target)) {
        setShowCircles(false);
        setSourceEntity(null); // Reset source entity
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return <DiagramBox ref={diagramRef} id="diagram" />;
};

export default MermaidDiagram;