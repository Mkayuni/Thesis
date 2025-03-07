import React, { useEffect, useState } from 'react';
import { questionStyles } from './QuestionStyles';

const QuestionSetup = ({ questionMarkdown, setSchema }) => {
  const [hasQuestion, setHasQuestion] = useState(false);
  const [questionHTML, setQuestionHTML] = useState('');
  const [requirementsHTML, setRequirementsHTML] = useState('');
  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    if (questionMarkdown) {
      setHasQuestion(true);
      const parsedContent = parseQuestionMarkdown(questionMarkdown);
      setQuestionHTML(parsedContent.questionHTML);
      setRequirementsHTML(parsedContent.requirementsHTML);
      
      // Reset details visibility when question changes
      setDetailsVisible(false);
    }
  }, [questionMarkdown, setSchema]);

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
    
    // Replace class brackets with spans
    let html = questionText.replace(/\[(.*?)\]/g, '<span class="class-highlight">$1</span>');
    
    // Process code blocks with method tags
    const codeBlockPattern = /`([^`]+)`/g;
    html = html.replace(codeBlockPattern, (match, codeContent) => {
      // Highlight methods within the code block
      const highlightedCode = codeContent.replace(
        /<method>(.*?)<\/method>/g, 
        '<span class="method-highlight">$1</span>'
      );
      return `<div class="code-block">${highlightedCode}</div>`;
    });
    
    // Highlight any remaining method tags outside code blocks
    html = html.replace(
      /<method>(.*?)<\/method>/g, 
      '<span class="method-highlight">$1</span>'
    );
    
    // Handle basic formatting
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
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
    
    // Replace class brackets with spans
    html = html.replace(/\[(.*?)\]/g, '<span class="class-highlight">$1</span>');
    
    // Replace inline code blocks
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Handle basic formatting
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
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
        <div className="fixed-panel">
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
          overflow: hidden;
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
        }
      `}</style>
    </>
  );
};

export default QuestionSetup;