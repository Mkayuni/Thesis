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
    removeMethod,
    isPanning,
    addAttribute,  
    addMethod,     
    scale,
    setActiveElement,
    setActionBarPosition,
    setNeedsRender,
    setVisibleToolbarEntity
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
      primaryColor: '#dae8fc',
      primaryBorderColor: '#6c8ebf',
      lineColor: '#333333',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      nodeBorder: '#6c8ebf',
      mainBkg: '#ffffff',
      titleColor: '#333333',
      edgeLabelBackground: '#ffffff',
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

  
            // 1. Add custom icons to nodes but initially hide them
              const nodes = svgElement.querySelectorAll('g[class^="node"], .classGroup');
              nodes.forEach((node) => {
                const nodeId = node.getAttribute('id');
                if (nodeId) {
                  const entityName = extractEntityName(nodeId);
                  const normalizedEntityName = normalizeEntityName(entityName);
                  
                  // Only proceed if the entity exists in schema
                  if (schema.has(normalizedEntityName)) {
                    const bbox = node.getBBox();
                    
                    // Make the node clickable to show the toolbar
                    node.style.cursor = 'pointer';
                    
                    // Create a vertical toolbar at the right edge of the node
                    const toolbarGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    toolbarGroup.classList.add('toolbar-group');
                    
                    // Initially hide the toolbar
                    toolbarGroup.style.opacity = '0';
                    toolbarGroup.style.pointerEvents = 'none';
                    toolbarGroup.setAttribute('data-entity', normalizedEntityName);

                    // Toolbar background - adjust height since we're removing icons
                    const toolbarBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    toolbarBg.setAttribute('x', bbox.x + bbox.width + 5);
                    toolbarBg.setAttribute('y', bbox.y - 5);
                    toolbarBg.setAttribute('width', '25');
                    toolbarBg.setAttribute('height', '165'); // Height for 6 icons
                    toolbarBg.setAttribute('rx', '4');
                    toolbarBg.setAttribute('ry', '4');
                    toolbarBg.setAttribute('fill', '#f8f9fa');
                    toolbarBg.setAttribute('stroke', '#dee2e6');
                    toolbarBg.setAttribute('stroke-width', '1');

                    // Add the background first (so it's behind the icons)
                    toolbarGroup.appendChild(toolbarBg);

                    // Define toolbar icons with their positions, actions, and tooltips
                    const toolbarIcons = [
                      { 
                        emoji: '🗑️', 
                        y: bbox.y + 15, 
                        color: '#dc3545', 
                        tooltip: 'Delete Entity',
                        action: () => {
                          if (schema.has(normalizedEntityName)) {
                            console.log(`Removing entity via toolbar: ${normalizedEntityName}`);
                            removeEntity(normalizedEntityName);
                            setTimeout(() => {
                              clearDiagram();
                              setNeedsRender(true);
                            }, 10);
                          }
                        }
                      },
                      { 
                        emoji: '🔍', 
                        y: bbox.y + 40, 
                        color: '#007bff', 
                        tooltip: 'Inspect Entity',
                        action: () => {
                          console.log(`Inspecting entity: ${normalizedEntityName}`);
                          // Implementation for inspection
                        }
                      },
                      { 
                        emoji: '➕', 
                        y: bbox.y + 65, 
                        color: '#28a745', 
                        tooltip: 'Add Attribute',
                        action: () => {
                          const attrName = prompt('Enter attribute name:');
                          const attrType = prompt('Enter attribute type (optional):');
                          
                          if (attrName && typeof addAttribute === 'function') {
                            addAttribute(normalizedEntityName, attrName, '', attrType || '');
                            setTimeout(() => {
                              clearDiagram();
                              setNeedsRender(true);
                            }, 10);
                          }
                        }
                      },
                      { 
                        emoji: '➖', 
                        y: bbox.y + 90, 
                        color: '#ff9800', 
                        tooltip: 'Remove Attribute',
                        action: () => {
                          const entity = schema.get(normalizedEntityName);
                          if (entity && entity.attribute && entity.attribute.size > 0) {
                            const lastAttribute = Array.from(entity.attribute.keys()).pop();
                            if (lastAttribute) {
                              removeAttribute(normalizedEntityName, lastAttribute);
                              setTimeout(() => {
                                clearDiagram();
                                setNeedsRender(true);
                              }, 10);
                            }
                          }
                        }
                      },
                      { 
                        emoji: '📝', 
                        y: bbox.y + 115, 
                        color: '#6610f2', 
                        tooltip: 'Add Method',
                        action: () => {
                          const methodName = prompt('Enter method name:');
                          if (!methodName) return;
                          
                          const returnType = prompt('Enter return type (optional):');
                          const params = prompt('Enter parameters (optional, comma separated):');
                          
                          const method = {
                            name: methodName,
                            returnType: returnType || 'void',
                            parameters: params ? params.split(',').map(p => p.trim()) : [],
                            visibility: 'public'
                          };
                          
                          if (typeof addMethod === 'function') {
                            addMethod(normalizedEntityName, method);
                            setTimeout(() => {
                              clearDiagram();
                              setNeedsRender(true);
                            }, 10);
                          }
                        }
                      },
                      { 
                        emoji: '🧹', 
                        y: bbox.y + 140, 
                        color: '#e83e8c', 
                        tooltip: 'Remove Method',
                        action: () => {
                          const entity = schema.get(normalizedEntityName);
                          if (entity && entity.methods && entity.methods.length > 0) {
                            const lastMethod = entity.methods[entity.methods.length - 1];
                            if (lastMethod && lastMethod.name) {
                              console.log(`Removing method '${lastMethod.name}' from entity '${normalizedEntityName}'`);
                              removeMethod(normalizedEntityName, lastMethod.name);
                              setTimeout(() => {
                                clearDiagram();
                                setNeedsRender(true);
                              }, 10);
                            } else {
                              console.log(`No methods available to remove from entity '${normalizedEntityName}'`);
                            }
                          } else {
                            console.log(`No methods available to remove from entity '${normalizedEntityName}'`);
                          }
                        }
                      },
                    ];

                   // Add each icon to the toolbar
                  toolbarIcons.forEach(({ emoji, y, color, action }) => {
                    const iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    iconGroup.classList.add('toolbar-icon');
                    
                    // Create the icon
                    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    icon.setAttribute('x', bbox.x + bbox.width + 17);
                    icon.setAttribute('y', y);
                    icon.setAttribute('fill', color);
                    icon.setAttribute('text-anchor', 'middle');
                    icon.style.fontSize = '14px';
                    icon.style.cursor = 'pointer';
                    icon.textContent = emoji;
                    
                    // Create tooltip (hidden by default)
                    const tooltipGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    tooltipGroup.style.opacity = '0';
                    tooltipGroup.style.pointerEvents = 'none';
                    
                    const tooltipBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    tooltipBg.setAttribute('x', bbox.x + bbox.width + 30);
                    tooltipBg.setAttribute('y', y - 12);
                    tooltipBg.setAttribute('width', (emoji === '🗑️' ? 'Delete Entity' : 
                                          emoji === '➖' ? 'Remove Attribute' : 
                                          emoji === '🧹' ? 'Remove Method' : 'Action').length * 6 + 10);
                    tooltipBg.setAttribute('height', '20');
                    tooltipBg.setAttribute('rx', '3');
                    tooltipBg.setAttribute('fill', '#333');
                    
                    const tooltipText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    tooltipText.setAttribute('x', bbox.x + bbox.width + 35);
                    tooltipText.setAttribute('y', y + 2);
                    tooltipText.setAttribute('fill', '#fff');
                    tooltipText.style.fontSize = '11px';
                    tooltipText.textContent = emoji === '🗑️' ? 'Delete Entity' : 
                                            emoji === '➖' ? 'Remove Attribute' : 
                                            emoji === '🧹' ? 'Remove Method' : 'Action';
                    
                    tooltipGroup.appendChild(tooltipBg);
                    tooltipGroup.appendChild(tooltipText);
                    
                    // Show tooltip on hover
                    icon.addEventListener('mouseover', () => {
                      tooltipGroup.style.opacity = '1';
                      tooltipGroup.style.transition = 'opacity 0.2s';
                    });
                    
                    icon.addEventListener('mouseout', () => {
                      tooltipGroup.style.opacity = '0';
                    });
                    
                    // Add click handler
                    icon.addEventListener('click', (e) => {
                      e.stopPropagation();
                      if (action) {
                        action();
                      }
                    });
                    
                    // Add all elements to the group
                    iconGroup.appendChild(tooltipGroup);
                    iconGroup.appendChild(icon);
                    toolbarGroup.appendChild(iconGroup);
                  });

                  // Add the toolbar to the node
                  node.appendChild(toolbarGroup);


                  // Hide all other toolbars when clicking anywhere in the document
                  document.addEventListener('click', (e) => {
                    // Check if the click is outside any class node
                    const isClassNode = e.target.closest('.classGroup');
                    if (!isClassNode || isPanning) {
                      // Hide all toolbars
                      const allToolbars = svgElement.querySelectorAll('.toolbar-group');
                      allToolbars.forEach(toolbar => {
                        toolbar.style.opacity = '0';
                        toolbar.style.pointerEvents = 'none';
                      });
                    }
                  });
                  
                  // Add click event to the node to show its toolbar
                  node.addEventListener('click', (e) => {
                    if (isPanning) return; // Don't activate when panning
                    
                    e.stopPropagation(); // Prevent document click from immediately hiding
                    
                    // Get node ID and entity name first
                    const nodeId = node.id || '';
                    const entityName = extractEntityName(nodeId);
                    const normalizedEntityName = normalizeEntityName(entityName);
                    
                    // First hide all toolbars
                    const allToolbars = svgElement.querySelectorAll('.toolbar-group');
                    allToolbars.forEach(toolbar => {
                      toolbar.style.opacity = '0';
                      toolbar.style.pointerEvents = 'none';
                    });
                    
                    // Then show only this node's toolbar with a transition effect
                    const toolbar = node.querySelector('.toolbar-group');
                    if (toolbar) {
                      // Toggle visibility
                      const isCurrentlyVisible = toolbar.style.opacity === '1';
                      
                      if (!isCurrentlyVisible) {
                        // Show this toolbar
                        toolbar.style.opacity = '1';
                        toolbar.style.pointerEvents = 'auto';
                        toolbar.style.transition = 'opacity 0.2s ease-in-out';
                        if (typeof setVisibleToolbarEntity === 'function') {
                          setVisibleToolbarEntity(normalizedEntityName);
                        }
                      } else {
                        // Hide this toolbar too
                        toolbar.style.opacity = '0';
                        toolbar.style.pointerEvents = 'none';
                        if (typeof setVisibleToolbarEntity === 'function') {
                          setVisibleToolbarEntity(null);
                        }
                      }
                    }
                    
                    // Get diagram dimensions for centered positioning
                    const diagramRect = diagramRef.current.getBoundingClientRect();
                    const containerRect = containerRef.current.getBoundingClientRect();
                    
                    setActiveElement(normalizedEntityName);
                    
                    // Position action bar at the top of the diagram, centered
                    setActionBarPosition({
                      x: (diagramRect.width / 2 - 120) / scale, // Center it, adjusting for approx. toolbar width
                      y: 10 / scale // Position at top with a small margin
                    });
                  });
                }
              }
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
                const normalizedEntityName = normalizeEntityName(entityName);
                
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
                      
                      // Get diagram dimensions for centered positioning
                      const diagramRect = diagramRef.current.getBoundingClientRect();
                      const containerRect = containerRef.current.getBoundingClientRect();
                      
                      // Set active element as an object with entity and method info
                      setActiveElement({
                        entity: normalizedEntityName,
                        method: methodName,
                        type: 'method'
                      });
                      
                      // Position action bar at the top of the diagram, centered
                      setActionBarPosition({
                        x: (diagramRect.width / 2 - 120) / scale, // Center it, adjusting for approx. toolbar width
                        y: 10 / scale // Position at top with a small margin
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
          
          // Safely call setVisibleToolbarEntity if it exists
          if (typeof setVisibleToolbarEntity === 'function') {
            setVisibleToolbarEntity(null);
          }
          if (typeof setActiveElement === 'function') {
            setActiveElement(null);
          }
        }
      }
    }, 50); // Slightly longer delay for more reliable initialization
  } catch (error) {
    console.error('Error rendering Mermaid diagram:', error);
    clearDiagram(); // Ensure diagram is cleared on error
    
    // Safely call setVisibleToolbarEntity if it exists
    if (typeof setVisibleToolbarEntity === 'function') {
      setVisibleToolbarEntity(null);
    }
    if (typeof setActiveElement === 'function') {
      setActiveElement(null);
    }
  }
};