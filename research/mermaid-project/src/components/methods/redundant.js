import React, { useEffect, useRef, useCallback, useState } from 'react';
import mermaid from 'mermaid';
import { Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';


const DiagramBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#ffffff',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  flex: 3,
  overflow: 'visible', // Ensure overflow is visible
  width: '100%',
  height: '100%',
  position: 'relative',
  zIndex: 0,
}));

const FloatingButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  backgroundColor: '#ff5722',
  color: '#fff',
  display: 'none', // Initially hidden
  zIndex: 1000,
  '&:hover': {
    backgroundColor: '#e64a19',
  },
}));

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const getStyles = (options) => `
  .label {
    font-family: ${options.fontFamily};
    color: ${options.nodeTextColor || options.textColor};
  }
  .cluster-label text {
    fill: ${options.titleColor};
  }
  .node rect,
  .node circle,
  .node ellipse {
    fill: #f5f5f5 !important;
    stroke: #000 !important;
    stroke-width: 2px !important;
  }
  .node text.entity-name {
    font-weight: bold !important;
    font-size: 20px !important;
  }
  .node text.attribute {
    font-size: 16px !important;
    font-style: italic !important;
  }
  .node rect:first-of-type {
    stroke: #000 !important;
    stroke-width: 2px !important;
  }
  text[visibility="hidden"] {
    display: none !important;
  }
`;

const MermaidDiagram = ({ schema, relationships, removeEntity, addAttribute}) => {
  const diagramRef = useRef(null);
  const [nodePositions, setNodePositions] = useState([]);

   // Function to convert schema to Mermaid source
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

      const methodLines = schemaItem.methods.map((method) => {
        const visibilitySymbol = method.visibility === 'private' ? '-' : method.visibility === 'protected' ? '#' : '+';
        const staticKeyword = method.static ? 'static ' : '';
        const parameters = Array.isArray(method.parameters) ? method.parameters.join(', ') : '';
        const returnType = method.returnType ? `:: ${method.returnType}` : '';
        return `  ${visibilitySymbol} ${staticKeyword}${method.name}(${parameters})${returnType}`;
      });

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
      const item = `${capitalizeFirstLetter(rel.relationA)}"${rel.cardinalityA}"--"${rel.cardinalityB}"${capitalizeFirstLetter(rel.relationB)}`;
      schemaText.push(item);
    });

    return schemaText.join('\n');
  }, [schema, relationships]);

  // Function to render the Mermaid diagram
  const renderDiagram = useCallback(() => {
    const source = `classDiagram\n${schemaToMermaidSource()}`;
    mermaid.mermaidAPI.initialize({ startOnLoad: false });

    mermaid.mermaidAPI.render('umlDiagram', source, (svgGraph) => {
      const diagramElement = diagramRef.current;
      if (diagramElement) {
        diagramElement.innerHTML = svgGraph;
        const svg = diagramElement.querySelector('svg');
        if (svg) {
          // Set overflow to visible for the SVG container
          svg.style.overflow = 'visible';
          
          // Add padding to the SVG to ensure icons are not cut off
          svg.setAttribute('viewBox', `-20 -20 ${svg.getBBox().width + 40} ${svg.getBBox().height + 40}`);
          svg.style.padding = '20px';

          const nodes = svg.querySelectorAll('g[class^="node"]');

          nodes.forEach((node) => {
            const nodeId = node.getAttribute('id');
            if (nodeId) {
              const bbox = node.getBBox();

              // Create a group for the icons
              const iconsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              iconsGroup.classList.add('icons-group');

              let iconsVisible = false;

              // Create the edit button
              const editButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              editButton.setAttribute('x', bbox.x + bbox.width + 10);
              editButton.setAttribute('y', bbox.y + 10);
              editButton.setAttribute('fill', '#007bff');
              editButton.style.cursor = 'pointer';
              editButton.textContent = '✏️';

              // Create the delete button
              const deleteButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              deleteButton.setAttribute('x', bbox.x + bbox.width + 10);
              deleteButton.setAttribute('y', bbox.y + 30);
              deleteButton.setAttribute('fill', '#ff4d4d');
              deleteButton.style.cursor = 'pointer';
              deleteButton.style.display = 'none';
              deleteButton.textContent = '🗑️';
              deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                removeEntity(nodeId);
              });

              // Create the add button
              const addButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              addButton.setAttribute('x', bbox.x + bbox.width + 10);
              addButton.setAttribute('y', bbox.y + 50);
              addButton.setAttribute('fill', '#4caf50');
              addButton.style.cursor = 'pointer';
              addButton.style.display = 'none';
              addButton.textContent = '➕';
              addButton.addEventListener('click', (e) => {
                e.stopPropagation();
                addAttribute(nodeId);
              });

              iconsGroup.appendChild(editButton);
              iconsGroup.appendChild(deleteButton);
              iconsGroup.appendChild(addButton);
              node.appendChild(iconsGroup);

              const showIcons = () => {
                iconsVisible = true;
                editButton.style.display = 'block';
              };

              const hideIcons = () => {
                if (!iconsVisible) {
                  editButton.style.display = 'none';
                  deleteButton.style.display = 'none';
                  addButton.style.display = 'none';
                }
              };

              // Toggle icons visibility on edit button click
              editButton.addEventListener('click', (e) => {
                e.stopPropagation();
                iconsVisible = !iconsVisible;
                deleteButton.style.display = iconsVisible ? 'block' : 'none';
                addButton.style.display = iconsVisible ? 'block' : 'none';
              });

              node.addEventListener('mouseenter', showIcons);
              iconsGroup.addEventListener('mouseenter', showIcons);

              // Prevent icons from disappearing when hovering over them
              iconsGroup.addEventListener('mouseleave', hideIcons);
              node.addEventListener('mouseleave', hideIcons);
            }
          });
        }
      }
    });
  }, [schemaToMermaidSource, removeEntity, addAttribute]);


  const handleMouseEnter = (event) => {
    const button = event.currentTarget.querySelector('.delete-button');
    if (button) button.style.display = 'block';
  };

  const handleMouseLeave = (event) => {
    const button = event.currentTarget.querySelector('.delete-button');
    if (button) button.style.display = 'none';
  };

  useEffect(() => {
    // Temporary hardcoded test to check if the floating delete button shows up
    setNodePositions([{ id: 'test-entity', x: 100, y: 100, width: 50, height: 20 }]);
  }, []); // This will run once when the component mounts
  
  useEffect(() => {
    if (schema.size !== 0) {
      renderDiagram();
      console.log("Rendering diagram with schema:", schema);
    }
  }, [schema, relationships, renderDiagram]);
  
  return (
    <DiagramBox ref={diagramRef} id="diagram">
      {nodePositions.map((node) => (
        <Box
          key={node.id}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{ position: 'absolute', top: `${node.y}px`, left: `${node.x + node.width}px` }}
        >
          <FloatingButton
            className="delete-button"
            onClick={() => removeEntity(node.id)}
          >
            <DeleteIcon />
          </FloatingButton>
        </Box>
      ))}
    </DiagramBox>
  );
};

export default MermaidDiagram;
