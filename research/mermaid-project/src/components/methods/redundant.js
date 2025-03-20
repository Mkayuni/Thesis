import React, { useEffect, useState, useRef } from 'react';
import { questionStyles } from './QuestionStyles';

const QuestionSetup = ({ questionMarkdown, setSchema, showPopup: originalShowPopup }) => {
  const [hasQuestion, setHasQuestion] = useState(false);
  const [questionHTML, setQuestionHTML] = useState('');
  const [requirementsHTML, setRequirementsHTML] = useState('');
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [entities, setEntities] = useState(new Set());
  const [methods, setMethods] = useState(new Set());
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [popupContent, setPopupContent] = useState('');
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  
  // Use ref to track clicks within our component
  const panelRef = useRef(null);
  const wasInside = useRef(false);
  
  // Create our own internal showPopup that will display the popup in the panel
  const showInternalPopup = (event, content, type = 'entity') => {
    // Get the click coordinates relative to the target element
    const rect = event.target.getBoundingClientRect();
    const x = rect.left;
    const y = rect.bottom;
    
    // Set the popup content and position
    setPopupContent(`${type}: ${content}`);
    setPopupPosition({ x, y });
    setIsPopupVisible(true);
    
    // Mark that we clicked inside to prevent closing
    wasInside.current = true;
  };

  useEffect(() => {
    if (questionMarkdown) {
      setHasQuestion(true);
      
      // Extract entities and methods first
      const extractedEntities = extractEntitiesAndAttributes(questionMarkdown);
      setEntities(extractedEntities.entities);
      
      // Extract methods
      const extractedMethods = extractMethods(questionMarkdown);
      setMethods(extractedMethods);
      
      // Parse the markdown with clickable elements
      const parsedContent = parseQuestionMarkdown(questionMarkdown);
      setQuestionHTML(parsedContent.questionHTML);
      setRequirementsHTML(parsedContent.requirementsHTML);
      
      // Reset details visibility when question changes
      setDetailsVisible(true); // Default to showing the question
      
      // Set up window functions for click handling
      window.showPopup = (event, entityOrMethod, isEntity = false, type = 'entity') => {
        // Prevent the default behavior
        event.preventDefault();
        event.stopPropagation();
        
        // Log for debugging
        console.log("Method Click: ", entityOrMethod, "Type:", type);
        
        // First show our internal popup
        showInternalPopup(event, entityOrMethod, type);
        
        // Always respect the provided type when calling originalShowPopup
        originalShowPopup(event, entityOrMethod, isEntity, type);
        
        // Mark that we're handling the event to prevent panel close
        wasInside.current = true;
      };
      
      window.addEntityOrAttribute = (nameInER, event) => {
        if (!event) {
          // Create a synthetic event if one wasn't passed
          event = {
            preventDefault: () => {},
            stopPropagation: () => {},
            target: document.activeElement || document.body
          };
        }
        
        // Always prevent default behavior
        event.preventDefault();
        event.stopPropagation();
        
        // Show internal popup for all entity/attribute clicks
        const type = extractedEntities.entities.has(nameInER) ? 'entity' : 'attribute';
        showInternalPopup(event, nameInER, type);
        
        // Don't automatically add the entity, just show the popup
        originalShowPopup(event, nameInER, false, type);
        
        // Mark that we're handling the event to prevent panel close
        wasInside.current = true;
      };
      
      // Global click handler for managing panel visibility
      const handleGlobalClick = (e) => {
        // If we clicked inside our component earlier, reset the flag and don't close
        if (wasInside.current) {
          wasInside.current = false;
          return;
        }
        
        // Check if the click is outside our panel
        if (panelRef.current && !panelRef.current.contains(e.target)) {
          // Only close popup, not the panel
          if (isPopupVisible) {
            setIsPopupVisible(false);
          }
          // Don't close the panel - we'll let the user close it manually
        }
      };
      
      // Add click listener
      document.addEventListener('mousedown', handleGlobalClick);
      
      return () => {
        document.removeEventListener('mousedown', handleGlobalClick);
      };
    }
  }, [questionMarkdown, setSchema, originalShowPopup]);
  
  // Handle document click to close popup
  const handleDocumentClick = (event) => {
    // Close popup if clicking outside of it
    if (isPopupVisible && !event.target.closest('.popup') && 
        !event.target.classList.contains('class-highlight') && 
        !event.target.classList.contains('method-highlight') &&
        !event.target.classList.contains('entity-highlight')) {
      setIsPopupVisible(false);
    }
  };

  // Extract entities and attributes function
  function extractEntitiesAndAttributes(question) {
    const entityAttributePattern = /\[([^\]]+)\]/g;
    const entities = new Set();
    const attributes = new Set();
    let match;

    while ((match = entityAttributePattern.exec(question)) !== null) {
      const entityName = match[1].replace(/\s+/g, '').toLowerCase(); // Normalize entity name
      entities.add(entityName);
      attributes.add(match[1]);
    }

    return { entities, attributes };
  }

  // Extract methods function
  function extractMethods(question) {
    const methodPattern = /<method>(.*?)<\/method>/g;
    const methods = new Set();
    let match;

    while ((match = methodPattern.exec(question)) !== null) {
      methods.add(match[1].trim());
    }

    return methods;
  }

  // Add entity function
  const addEntity = (entityName) => {
    const normalizedEntityName = entityName.replace(/\s+/g, '').toLowerCase(); // Normalize entity name
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      if (!newSchema.has(normalizedEntityName)) {
        newSchema.set(normalizedEntityName, { entity: normalizedEntityName, attribute: new Map(), methods: [] });
      }
      return newSchema;
    });
  };

  // Parse the markdown content with special handling for UML questions
  function parseQuestionMarkdown(content) {
    if (!content) return { questionHTML: '', requirementsHTML: '' };
    
    // Extract content from uml-question tags if present
    let extractedContent = content;
    const umlQuestionMatch = content.match(/<uml-question>([\s\S]*?)<\/uml-question>/);
    if (umlQuestionMatch) {
      extractedContent = umlQuestionMatch[1];
    }
    
    // Split into question and requirements parts
    let questionPart = extractedContent;
    let requirementsPart = '';
    
    const requirementsIndex = extractedContent.indexOf('### **Design Requirements**');
    if (requirementsIndex !== -1) {
      questionPart = extractedContent.substring(0, requirementsIndex).trim();
      requirementsPart = extractedContent.substring(requirementsIndex).trim();
    }
    
    // Process the question part
    const questionHTML = processQuestionPart(questionPart);
    
    // Process the requirements part
    const requirementsHTML = processRequirementsPart(requirementsPart);
    
    return { questionHTML, requirementsHTML };
  }

  function processQuestionPart(questionText) {
    if (!questionText) return '';
    
    // First, handle the entity and attribute mentions in square brackets
    let html = questionText;
    
    // Replace entity references like [tanks] with clickable spans
    html = html.replace(/\[([^\]]+)\]/g, (match, content) => {
      const normalizedContent = content.toLowerCase().replace(/\s+/g, '');
      // Add a data attribute to store whether it's already labeled as an entity in the markup
      return `<span class="class-highlight" data-is-entity="${entities.has(normalizedContent)}" onclick="window.addEntityOrAttribute('${normalizedContent}', event)">${content}</span>`;
    });
    
    // Process code blocks with method tags
    const codeBlockPattern = /`([^`]+)`/g;
    html = html.replace(codeBlockPattern, (match, codeContent) => {
      // Highlight methods within the code block
      const highlightedCode = codeContent.replace(
        /<method>(.*?)<\/method>/g, 
        (match, methodName) => {
          // Explicitly pass 'method' as the type to ensure it's handled as a method
          return `<span class="method-highlight" onclick="window.showPopup(event, '${methodName}', false, 'method')">${methodName}</span>`;
        }
      );
      return `<div class="code-block">${highlightedCode}</div>`;
    });
    
    // Highlight any remaining method tags outside code blocks with clickability
    html = html.replace(
      /<method>(.*?)<\/method>/g, 
      (match, methodName) => {
        // Explicitly pass 'method' as the type to ensure it's handled as a method
        return `<span class="method-highlight" onclick="window.showPopup(event, '${methodName}', false, 'method')">${methodName}</span>`;
      }
    );
    
    // Handle basic formatting (but don't overwrite our spans)
    html = html.replace(/\*\*([^<>]*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^<>*]*?)\*/g, '<em>$1</em>');
    
    // Handle paragraphs
    const paragraphs = html.split('\n\n').filter(p => p.trim() !== '');
    html = paragraphs.map(p => `<p>${p}</p>`).join('\n');
    
    // Handle line breaks within paragraphs
    html = html.replace(/\n/g, '<br>');
    
    return html;
  }

  function processRequirementsPart(requirementsText) {
    if (!requirementsText) return '';
    
    // Remove the heading first
    let html = requirementsText.replace('### **Design Requirements**', '').trim();
    
    // Preprocess to identify and properly format numbered lists with nested items
    html = preprocessNestedLists(html);
    
    // Replace entities in square brackets with clickable spans
    html = html.replace(/\[([^\]]+)\]/g, (match, content) => {
      const normalizedContent = content.toLowerCase().replace(/\s+/g, '');
      // Add a data attribute to store whether it's already labeled as an entity in the markup
      return `<span class="class-highlight" data-is-entity="${entities.has(normalizedContent)}" onclick="window.addEntityOrAttribute('${normalizedContent}', event)">${content}</span>`;
    });
    
    // Replace inline code blocks
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Handle basic formatting (but not the ones we already processed)
    html = html.replace(/\*\*([^<>]*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^<>*]*?)\*/g, '<em>$1</em>');
    
    return `<h3>Design Requirements</h3>\n${html}`;
  }

  function preprocessNestedLists(text) {
    // Split the content into lines
    const lines = text.split('\n');
    let inNumberedList = false;
    let currentListIndex = 0; // Track the current nesting level
    let nestedLists = []; // Stack to track nested lists
    let result = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Check for numbered list item (e.g., "1. Something")
      if (/^\d+\.\s/.test(line)) {
        // Start a new numbered list if not already in one
        if (!inNumberedList) {
          result.push('<ol class="assignment-list">');
          inNumberedList = true;
        }
        
        // Close any nested lists if we're at the top level
        while (nestedLists.length > 0) {
          result.push('</ul>');
          nestedLists.pop();
        }
        
        // Extract the number and content
        const match = line.match(/^(\d+)\.\s*(.*?)$/);
        if (match) {
          const listNum = match[1];
          const listContent = match[2];
          
          // If this item has bold text, it's likely a section header
          if (listContent.includes('**')) {
            result.push(`<li class="section-item">${listContent}</li>`);
          } else {
            result.push(`<li>${listContent}</li>`);
          }
        }
      }
      // Check for bullet points (e.g., "- Something")
      else if (/^\s*-\s/.test(line)) {
        // Count indentation level
        const indentMatch = line.match(/^(\s*)-/);
        const indentCount = indentMatch ? indentMatch[1].length : 0;
        const indentLevel = Math.floor(indentCount / 2); // Each level is 2 spaces
        
        // Adjust nested lists based on indent level
        if (nestedLists.length <= indentLevel) {
          // Need to start a new nested list
          if (result[result.length - 1].endsWith('</li>')) {
            // If the last item was a list item, we need to replace the closing tag
            result[result.length - 1] = result[result.length - 1].replace('</li>', '');
          }
          result.push('<ul class="nested-list">');
          nestedLists.push(indentLevel);
        } else if (nestedLists.length > indentLevel + 1) {
          // Need to close some nested lists
          while (nestedLists.length > indentLevel + 1) {
            result.push('</ul></li>');
            nestedLists.pop();
          }
        }
        
        // Extract and add the content
        const contentMatch = line.match(/^\s*-\s*(.*?)$/);
        if (contentMatch) {
          const listContent = contentMatch[1];
          result.push(`<li>${listContent}</li>`);
        }
      }
      // Not a list item
      else if (line.trim() !== '') {
        // Close any open lists
        while (nestedLists.length > 0) {
          result.push('</ul></li>');
          nestedLists.pop();
        }
        
        if (inNumberedList) {
          result.push('</ol>');
          inNumberedList = false;
        }
        
        // Add the line as a paragraph
        result.push(`<p>${line}</p>`);
      }
    }
    
    // Close any remaining open lists
    while (nestedLists.length > 0) {
      result.push('</ul></li>');
      nestedLists.pop();
    }
    
    if (inNumberedList) {
      result.push('</ol>');
    }
    
    return result.join('\n');
  }

  // Function to toggle the question details panel
  const toggleQuestionDetails = () => {
    setDetailsVisible(!detailsVisible);
  };

  // Prevent panel from closing on link clicks
  const handlePanelClick = (e) => {
    e.stopPropagation();
    // Mark that we're handling the event inside the panel
    wasInside.current = true;
  };

  return (
    <>
      {/* Main Question Container - Shows button if question exists */}
      <div className="uml-question-container">
        {hasQuestion && (
          <div className="view-question-button-container">
            <button 
              className="action-button"
              onClick={toggleQuestionDetails}
            >
              {detailsVisible ? "Hide Question Details" : "View Question Details"}
            </button>
          </div>
        )}
      </div>
      
      {/* Fixed Question Details Panel */}
      {detailsVisible && (
        <div 
          className="fixed-panel" 
          ref={panelRef}
          onClick={handlePanelClick}
          onMouseDown={() => { wasInside.current = true; }}
        >
          <div className="panel-header">
            <h2>Assignment</h2>
            <button className="close-button" onClick={() => setDetailsVisible(false)}>×</button>
          </div>
          <div className="panel-body">
            {/* Question section */}
            <div className="question-section" 
              dangerouslySetInnerHTML={{ __html: questionHTML }}>
            </div>
            
            {/* Design Requirements section */}
            {requirementsHTML && (
              <div className="requirements-section" 
                dangerouslySetInnerHTML={{ __html: requirementsHTML }}>
              </div>
            )}
            
            {/* Inline popup */}
            {isPopupVisible && (
              <div 
                className="popup"
                style={{
                  position: 'absolute',
                  left: `${popupPosition.x}px`,
                  top: `${popupPosition.y}px`,
                  zIndex: 1001
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent popup from closing when clicked
                  wasInside.current = true; // Mark that we're handling the event inside
                }}
              >
                {popupContent}
                <button 
                  className="close-popup-button"
                  onClick={() => setIsPopupVisible(false)}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{questionStyles}</style>
      <style jsx>{`
        .fixed-panel {
          position: fixed;
          top: 20px;
          left: 20px;
          width: 600px;
          max-width: 40%;
          max-height: calc(100vh - 40px);
          background-color: #fbf8f2;
          border-radius: 6px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          overflow: visible; /* Changed from hidden to visible to allow popups to show */
          z-index: 1000;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: linear-gradient(to right, #54361a, #785e46);
          color: white;
        }
        
        .panel-header h2 {
          font-family: 'Garamond', 'Georgia', serif;
          font-weight: 500;
          margin: 0;
          font-size: 1.5rem;
        }
        
        .close-button {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
        }
        
        .close-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .panel-body {
          padding: 1.5rem;
          overflow-y: auto;
          max-height: calc(100vh - 120px);
          position: relative; /* For positioning the popup */
        }
        
        /* Style for the clickable elements */
        .class-highlight {
          background-color: #e6f2ff;
          border-radius: 4px;
          padding: 2px 5px;
          color: #0066cc;
          font-weight: bold;
          cursor: pointer;
          display: inline-block;
          margin: 0 2px;
        }
        
        .class-highlight:hover {
          background-color: #cce6ff;
          text-decoration: underline;
        }
        
        .method-highlight {
          background-color: #f0f5ff;
          color: #3333cc;
          font-family: monospace;
          padding: 2px 5px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .method-highlight:hover {
          background-color: #d6e4ff;
          text-decoration: underline;
        }
        
        /* Style for the popup */
        .popup {
          background-color: #fff;
          border: 1px solid #ddd;
          padding: 8px 12px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          font-size: 0.9rem;
          max-width: 200px;
          word-wrap: break-word;
          position: relative;
        }
        
        .close-popup-button {
          position: absolute;
          top: 2px;
          right: 2px;
          background: none;
          border: none;
          font-size: 14px;
          cursor: pointer;
          color: #666;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .close-popup-button:hover {
          background-color: #f0f0f0;
        }
        
        /* Style for entity highlights */
        .entity-highlight {
          cursor: pointer;
          color: #0066cc;
          font-weight: bold;
        }
        
        .entity-highlight:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  );
};

export default QuestionSetup;