export const questionStyles = `
  .uml-question-container {
    font-family: 'Georgia', serif;
    line-height: 1.6;
    color: #333;
    background-color: #fbf8f2;
    padding: 1.5rem 2rem;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100px;
  }
  
  .uml-question-container::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 10px;
    height: 100%;
    background-image: linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0));
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  
  .view-question-button-container {
    text-align: center;
  }
  
  .action-button {
    padding: 0.7rem 1.5rem;
    background-color: #4b6584;
    color: white;
    font-family: 'Georgia', serif;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
  }
  
  .action-button:hover {
    background-color: #3c5270;
    box-shadow: 0 3px 6px rgba(0,0,0,0.15);
    transform: translateY(-1px);
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: #fbf8f2;
    border-radius: 6px;
    width: 90%;
    max-width: 900px;
    max-height: 90vh;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }
  
  .modal-content::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 10px;
    height: 100%;
    background-image: linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0));
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: linear-gradient(to right, #54361a, #785e46);
    color: white;
  }
  
  .modal-header h2 {
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
    transition: background-color 0.2s;
  }
  
  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    max-height: calc(90vh - 60px);
    font-family: 'Georgia', serif;
    font-size: 16px;
    line-height: 1.6;
  }
  
  .question-section {
    margin-bottom: 2rem;
    width: 100%;
    text-align: left;
  }
  
  .requirements-section {
    border-top: 1px solid #ddd;
    padding-top: 1.5rem;
    width: 100%;
    text-align: left;
  }
  
  /* Unified font styling for both sections */
  .question-section p,
  .requirements-section p {
    margin-bottom: 1rem;
    width: 100%;
    text-align: left;
    max-width: none;
    font-size: 16px;
    line-height: 1.6;
    font-family: 'Georgia', serif;
  }
  
  /* Make sure all content spans the full width */
  .modal-body h3,
  .modal-body ul,
  .modal-body ol,
  .modal-body .code-block {
    width: 100%;
    max-width: none;
    text-align: left;
    font-family: 'Georgia', serif;
  }
  
  /* Unified styling for highlighted class names */
  .class-highlight {
    background-color: #e6f7ff;
    border-radius: 3px;
    padding: 2px 6px;
    font-weight: bold;
    color: #0066cc;
    border: 1px solid #d6ebff;
    font-family: inherit;
  }
  
  /* Unified styling for highlighted method names */
  .method-highlight {
    background-color: #f0f5ff;
    border-radius: 3px;
    padding: 2px 6px;
    font-family: 'Consolas', 'Monaco', monospace;
    color: #333399;
    border: 1px solid #dfebff;
    font-size: 0.95em;
  }
  
  .code-block {
    background-color: #f5f7fa;
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid #e1e4e8;
    font-family: 'Consolas', 'Monaco', monospace;
    margin: 1rem 0 1.5rem 0;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    width: 100%;
    box-sizing: border-box;
    font-size: 0.95em;
  }
  
  .modal-body h3 {
    font-family: 'Garamond', 'Georgia', serif;
    font-weight: 600;
    margin: 0.5rem 0 1rem;
    color: #463222;
    padding-bottom: 0.5rem;
    text-align: left;
    font-size: 1.3rem;
  }
  
  /* Styled lists - same styling for both sections */
  .assignment-list {
    counter-reset: item;
    list-style-type: none;
    padding-left: 0;
    margin-left: 2rem;
    width: 100%;
    box-sizing: border-box;
    font-family: 'Georgia', serif;
    font-size: 16px;
  }
  
  .assignment-list > li {
    counter-increment: item;
    margin-bottom: 1.5rem;
    position: relative;
    text-align: left;
    font-family: 'Georgia', serif;
  }
  
  .assignment-list > li::before {
    content: counter(item) ".";
    position: absolute;
    left: -2rem;
    font-weight: bold;
  }
  
  .assignment-list > li.section-item {
    font-weight: 500;
  }
  
  .nested-list {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    width: 100%;
    box-sizing: border-box;
    font-family: 'Georgia', serif;
    font-size: 16px;
  }
  
  .nested-list > li {
    margin-bottom: 0.7rem;
    font-weight: normal;
    text-align: left;
    font-family: 'Georgia', serif;
  }
  
  /* Additional styles for code elements */
  code {
    background-color: #f5f7fa;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
    border: 1px solid #e1e4e8;
  }
  
  p {
    margin-bottom: 1rem;
    text-align: left;
  }
  
  strong {
    font-weight: 600;
  }
`;