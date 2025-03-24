import mermaid from 'mermaid';
import _ from 'lodash';
import {
  normalizeEntityName,
  extractEntityName,
  schemaToMermaidSource,
  parseCodeToSchema,
} from '../utils/mermaidUtils';

/**
 * Clears the diagram container
 * @param {RefObject} diagramRef - The ref to the diagram container
 * @param {number} schemaSize - The size of the schema map
 */
export const clearMermaidDiagram = (diagramRef, schemaSize) => {
    if (diagramRef.current) {
      // Instead of completely clearing, check if we already have SVG content
      const svgElement = diagramRef.current.querySelector('svg');
      
      // Only clear if:
      // 1. Schema is empty, or
      // 2. No SVG exists yet
      if (schemaSize === 0 || !svgElement) {
        // Completely remove all content from the diagram container
        diagramRef.current.innerHTML = '';
        
        // Add a placeholder message when the diagram is empty
        if (schemaSize === 0) {
          diagramRef.current.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No diagram to display</div>';
        }
      }
    }
  };

/**
 * Provides touch and mouse interaction handlers for the diagram
 * @param {Object} params - Parameters with state and setters
 * @returns {Object} - Object containing event handlers
 */
export const handleDiagramInteractions = ({
    schema,
    scale,
    setScale,
    isPanning,
    setIsPanning,
    startPanPos,
    setStartPanPos,
    panOffset,
    setPanOffset,
    containerRef
}) => {
    // Handle touch gestures for both panning and zooming
    const handleTouchStart = (e) => {
    if (schema.size === 0) return;
    
    if (e.touches.length === 1) {
        // Single touch for panning
        setIsPanning(true);
        setStartPanPos({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
        });
    } else if (e.touches.length === 2) {
        // Track the initial distance between touches for zooming
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const initialDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
        );
        
        // Store the initial distance for later comparison
        containerRef.current.dataset.initialTouchDistance = initialDistance;
        containerRef.current.dataset.initialScale = scale;
    }
    };

    const handleTouchMove = (e) => {
    if (schema.size === 0) return;
    
    if (e.touches.length === 1 && isPanning) {
        // Handle single-touch panning
        e.preventDefault();
        setPanOffset({
        x: e.touches[0].clientX - startPanPos.x,
        y: e.touches[0].clientY - startPanPos.y
        });
    } else if (e.touches.length === 2) {
        e.preventDefault(); // Prevent default to avoid browser zooming
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
        );
        
        const initialDistance = parseFloat(containerRef.current.dataset.initialTouchDistance || 0);
        const initialScale = parseFloat(containerRef.current.dataset.initialScale || 1);
        
        if (initialDistance > 0) {
        // Calculate the scale factor (reversed as requested)
        // When fingers move apart (increasing distance) -> zoom out
        // When fingers move together (decreasing distance) -> zoom in
        const distanceRatio = initialDistance / currentDistance;
        const newScale = initialScale * distanceRatio;
        
        // Limit scale to reasonable bounds
        if (newScale > 0.3 && newScale < 3) {
            setScale(newScale);
        }
        
        // For horizontal panning based on touch movement
        const touchCenter = {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
        };
        
        // If we have previous touch center, calculate the movement for panning
        if (containerRef.current.dataset.lastTouchCenterX) {
            const lastX = parseFloat(containerRef.current.dataset.lastTouchCenterX);
            const lastY = parseFloat(containerRef.current.dataset.lastTouchCenterY);
            const deltaX = touchCenter.x - lastX;
            const deltaY = touchCenter.y - lastY;
            
            // Apply panning when fingers move
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            setPanOffset(prev => ({
                x: prev.x + deltaX / scale,
                y: prev.y + deltaY / scale
            }));
            }
        }
        
        // Store the current touch center for the next move event
        containerRef.current.dataset.lastTouchCenterX = touchCenter.x;
        containerRef.current.dataset.lastTouchCenterY = touchCenter.y;
        }
    }
    };

    const handleTouchEnd = () => {
    setIsPanning(false);
    // Clear touch-related data attributes
    if (containerRef.current) {
        delete containerRef.current.dataset.initialTouchDistance;
        delete containerRef.current.dataset.initialScale;
        delete containerRef.current.dataset.lastTouchCenterX;
        delete containerRef.current.dataset.lastTouchCenterY;
    }
    };

    // Handle zooming with mouse wheel - reversed
    const handleWheel = (e) => {
    if (schema.size === 0) return; // No zooming if no entities
    
    // Only if we're not panning
    if (!isPanning) {
        const delta = e.deltaY;
        // Reversed logic: deltaY > 0 (scroll down) means zoom in
        const newScale = delta > 0 ? scale * 1.1 : scale * 0.9;
        
        // Limit scale to reasonable bounds
        if (newScale > 0.3 && newScale < 3) {
        setScale(newScale);
        }
    }
    };
    
    // Handle panning start - check if clicking on diagram element vs background
    const handleMouseDown = (e) => {
    if (schema.size === 0) return; // No panning if no entities
    
    // Check if clicking on a diagram element (class node)
    const isClassElement = e.target.closest('.classGroup') || 
                            e.target.closest('.node') || 
                            e.target.closest('.label') ||
                            e.target.closest('.action-button');
    
    // Only start panning if not clicking directly on a class element
    // or if using middle/right mouse button
    if (!isClassElement || e.button === 1 || e.button === 2) {
        e.preventDefault();
        setIsPanning(true);
        setStartPanPos({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
        });
    }
    };
    
    // Handle panning movement - with conditional check
    const handleMouseMove = (e) => {
    if (schema.size === 0) return; // No panning if no entities
    
    if (isPanning) {
        setPanOffset({
        x: e.clientX - startPanPos.x,
        y: e.clientY - startPanPos.y
        });
    }
    };
    
    // Handle panning end
    const handleMouseUp = () => {
    setIsPanning(false);
    };

    return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
    };
};

/**
 * Sync Java code with the schema
 * @param {string} javaCode - The Java code to parse
 * @param {string} syntaxType - The syntax type (JAVA, PYTHON)
 * @param {Function} addEntity - Function to add entity
 * @param {Function} addAttribute - Function to add attribute
 * @param {Function} addMethod - Function to add method
 * @param {Function} addMethodsFromParsedCode - Function to add methods from parsed code
 */
export const syncJavaCodeWithSchema = (
  javaCode, 
  syntaxType, 
  addEntity, 
  addAttribute, 
  addMethod, 
  addMethodsFromParsedCode,
  questionId = null
) => {
     // Log the association for tracking purposes
  if (questionId) {
    console.log(`Parsing code for question: ${questionId}`);
  }

  // First, parse the schema
  const parsedSchema = parseCodeToSchema(javaCode, syntaxType, addMethod, addMethodsFromParsedCode);
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
  // If you'd like to store this association, you could do something like:
  if (questionId) {
    // Store in localStorage for persistence
    localStorage.setItem(`question_${questionId}_lastCode`, javaCode);
    
    // Or maintain an in-memory mapping if that's more suitable
    window.questionCodeMap = window.questionCodeMap || {};
    window.questionCodeMap[questionId] = javaCode;
  }
};

   /**
 * Updates diagram styles without re-rendering
 */
   const updateDiagramStyles = (diagramRef, containerRef, scale) => {
    if (!diagramRef.current) return;
    
    const svgElement = diagramRef.current.querySelector('svg');
    if (svgElement) {
      // Make the SVG background transparent
      svgElement.style.background = 'transparent'; 
      svgElement.style.overflow = 'visible';
      
      // Remove any padding or borders
      svgElement.style.padding = '0';
      svgElement.style.maxWidth = '100%';
      svgElement.style.maxHeight = '100%';
      svgElement.style.boxShadow = 'none';
      svgElement.style.border = 'none';
      
      // Ensure consistent sizing
      svgElement.style.width = 'auto';
      svgElement.style.height = 'auto';
    }
  };


/**
 * Renders a Mermaid diagram based on the provided schema and relationships
 * @param {Object} params - The parameters object
 */

export const renderMermaidDiagram = async ({
    diagramRef,
    containerRef,
    schema,
    relationships,
    clearDiagram,
    removeEntity,
    removeAttribute,
    isPanning,
    scale,
    setSelectedEntity,
    setShowRelationshipManager,
    setActiveElement,
    setActionBarPosition,
    setNeedsRender
  }) => {
    // If schema is empty, just clear and don't try to render
    if (schema.size === 0) {
      clearDiagram();
      return;
    }
  
    // Check if we already have a rendered diagram
    const existingSvg = diagramRef.current?.querySelector('svg');
    
    // Generate the mermaid source
    const source = `classDiagram\n${schemaToMermaidSource(schema, relationships)}`;
    
    // Only clear and re-render if the source has changed
    // Add a data attribute to track the last rendered source
    if (existingSvg && diagramRef.current.dataset.lastRenderedSource === source) {
      // If source hasn't changed, just update styling but don't completely re-render
      updateDiagramStyles(diagramRef, containerRef, scale);
      return;
    }
    
    // Source has changed, clear and render
    clearDiagram();
    
    console.log("Rendering diagram with schema keys:", Array.from(schema.keys()));
    console.log('Mermaid source:', source);
    
    // Store the current source for future comparison
    if (diagramRef.current) {
      diagramRef.current.dataset.lastRenderedSource = source;
    }

  // Initialize Mermaid with transparent styling
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      primaryColor: 'transparent',
      primaryBorderColor: '#000000',
      lineColor: '#000000',
      fontFamily: 'Arial, sans-serif',
      textColor: '#000000',
      fontSize: '14px',
      nodeBorder: '#000000',
      mainBkg: 'transparent',
      clusterBkg: 'transparent',
      clusterBorder: 'none',
      titleColor: '#000000',
    },
    securityLevel: 'loose',
    flowchart: {
      useMaxWidth: false,
      htmlLabels: true,
      curve: 'linear',
    },
    classDigram: {
      defaultRenderer: 'dagre-wrapper',
    }
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
            // Make the SVG background transparent
            svgElement.style.background = 'transparent'; 
            svgElement.style.overflow = 'visible';
            
            // Remove any padding or borders
            svgElement.style.padding = '0';
            svgElement.style.maxWidth = '100%';
            svgElement.style.maxHeight = '100%';
            svgElement.style.boxShadow = 'none';
            svgElement.style.border = 'none';
            
            // Ensure consistent sizing
            svgElement.style.width = 'auto';
            svgElement.style.height = 'auto';
            
            // Center the diagram
            const diagramContainer = diagramRef.current;
            diagramContainer.style.display = 'flex';
            diagramContainer.style.justifyContent = 'center';
            diagramContainer.style.alignItems = 'center';
            diagramContainer.style.background = 'transparent';
            diagramContainer.style.boxShadow = 'none';
            diagramContainer.style.border = 'none';

            // Remove container styles from class nodes
            const rects = svgElement.querySelectorAll('rect');
            rects.forEach(rect => {
              // Remove shadow effects but keep the border line
              rect.setAttribute('filter', 'none');
              rect.setAttribute('stroke-width', '1px');
            });

            // Add both button systems
            
            // 1. Add custom icons to nodes (original style)
            const nodes = svgElement.querySelectorAll('g[class^="node"], .classGroup');
            nodes.forEach((node) => {
              const nodeId = node.getAttribute('id');
              if (nodeId) {
                const entityName = extractEntityName(nodeId);
                const normalizedEntityName = normalizeEntityName(entityName);
                
                // Only proceed if the entity exists in schema
                if (schema.has(normalizedEntityName)) {
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
  // Use normalizeEntityName to ensure consistent format
  const normalizedEntityName = normalizeEntityName(entityName);
  if (schema.has(normalizedEntityName)) {
    console.log(`Removing entity via button: ${normalizedEntityName}`);
    removeEntity(normalizedEntityName);
    
    // Force immediate diagram cleanup
    setTimeout(() => {
      clearDiagram();
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
  // Ensure consistent normalization
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
  setSelectedEntity(entityName);
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
}
});

// 2. Add event listeners for action bar (on click)
const classGroups = svgElement.querySelectorAll('.classGroup');
classGroups.forEach((node) => {
  node.style.cursor = 'pointer';
  
  node.addEventListener('click', (e) => {
    if (isPanning) return; // Don't activate when panning
    
    const nodeId = node.id || '';
    const entityName = extractEntityName(nodeId);
    
    // Get position for the action bar (above the node)
    const rect = node.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    setActiveElement(entityName);
    setActionBarPosition({
      x: (rect.left - containerRect.left) / scale,
      y: (rect.top - containerRect.top - 45) / scale, // Position above the element
    });
  });
});

// 3. Add event listeners for methods - find and make methods clickable
const methodElements = [];
const classTables = svgElement.querySelectorAll('.classGroup table');
classTables.forEach(table => {
  // Methods are typically in the third row of table or after attributes section
  const rows = table.querySelectorAll('tr');
  
  // Skip first row (class name) - start from 1, not 0
  if (rows.length > 1) {
    // Find the parent class group element to get entity name
    const classGroup = table.closest('.classGroup');
    if (!classGroup) return;
    
    const nodeId = classGroup.id || '';
    const entityName = extractEntityName(nodeId);
    
    // Process each row after the first
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const cellText = row.textContent || '';
      
      // Check if this row contains a method (has parentheses)
      if (cellText.includes('(') && cellText.includes(')')) {
        // Add pointer cursor to make it clear it's clickable
        row.style.cursor = 'pointer';
        
        // Add click event to the method row
        row.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent triggering parent class click
          
          // Get method name (everything before the parentheses)
          const methodName = cellText.split('(')[0].trim().replace(/^[+\-#~]/, '');
          
          // Calculate position for popup
          const rect = row.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          
          // Set active element as an object with entity and method info
          setActiveElement({
            entity: entityName,
            method: methodName,
            type: 'method'
          });
          
          // Position action bar near the method
          setActionBarPosition({
            x: (rect.right - containerRect.left + 10) / scale,  // Position to the right of the method
            y: (rect.top - containerRect.top) / scale,  // Align with the method
          });
        });
        
        methodElements.push(row);
      }
    }
  }
});

console.log(`Found ${methodElements.length} method elements in diagram`);
}
} catch (err) {
  console.error('Mermaid render error:', err);
  clearDiagram(); // Ensure diagram is cleared on error
}
}
}, 50); // Slightly longer delay for more reliable initialization
} catch (error) {
console.error('Error rendering Mermaid diagram:', error);
clearDiagram(); // Ensure diagram is cleared on error
}
};