import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Button, Select, MenuItem } from '@mui/material';
import MonacoEditorWrapper from '../monacoWrapper/MonacoEditorWrapper';
import { SYNTAX_TYPES } from '../ui/ui';
import { syncJavaCodeWithSchema } from '../utils/MermaidDiagramUtils';
import UMLAssessmentDisplay from '../utils/UMLAssessmentDisplay';
import { convertMermaidToJava, convertMermaidToPython } from '../utils/mermaidCodeGenerator';


const CodeWorkbench = ({
  schema,
  relationships,
  addEntity,
  addAttribute,
  addMethod,
  addMethodsFromParsedCode,
  removeAttribute, 
  removeEntity,    
  currentQuestion,
  onClose,
  isFullscreen,
  onToggleFullscreen
  
}) => {
    const [workbenchData, setWorkbenchData] = useState(() => {
        // Try to load saved code for this question
        const savedCode = currentQuestion ? 
          localStorage.getItem(`workbench_code_${currentQuestion}`) : null;
        
        return {
          code: savedCode || '',
          syntax: SYNTAX_TYPES.JAVA,
          questionId: currentQuestion || null,
          generatedCode: '',
          isCodeModified: false,
          consoleOutput: ''
        };
      });

  // Add position state for vertical adjustment
  const [position, setPosition] = useState({ x: 30, y: 80 }); // Default right:30px, top:80px
  const [editorInstance, setEditorInstance] = useState(null);
  const [monacoInstance, setMonacoInstance] = useState(null);
  const [editorValidationTimeout, setEditorValidationTimeout] = useState(null);

  // Add the movement functions here
  const moveUp = () => {
    setPosition(prev => ({ ...prev, y: prev.y - 50 }));
  };

  const moveDown = () => {
    setPosition(prev => ({ ...prev, y: prev.y + 50 }));
  };

  const moveLeft = () => {
    setPosition(prev => ({ ...prev, x: prev.x - 50 }));
  };

  const moveRight = () => {
    setPosition(prev => ({ ...prev, x: prev.x + 50 }));
  };

   
    // For local Storage
    useEffect(() => {
        // Save code to localStorage whenever it changes
        if (workbenchData.questionId && workbenchData.code) {
        localStorage.setItem(`workbench_code_${workbenchData.questionId}`, workbenchData.code);
        }
    }, [workbenchData.code, workbenchData.questionId]);

  // Update the schema and re-render diagram

  const removeAttributeFunc = removeAttribute;
  const removeEntityFunc = removeEntity;

  const handleUpdate = () => {
    syncJavaCodeWithSchema(
      workbenchData.code, 
      workbenchData.syntax, 
      addEntity, 
      addAttribute, 
      addMethod, 
      addMethodsFromParsedCode,
      workbenchData.questionId,
      schema,
      removeAttributeFunc, 
      removeEntityFunc 
    );
    
    setWorkbenchData({
      ...workbenchData,
      isCodeModified: false
    });
  };

  const [gradeResults, setGradeResults] = useState({
    visible: false,
    score: 0,
    feedback: '',
    details: {}
  });

  // Add this function to your React component
const handleGenerate = () => {
  try {
    // Get the current Mermaid source from the editor or generate it from schema
    const mermaidSource = workbenchData.code.trim() || prepareDiagramSubmission();
    
    if (!mermaidSource) {
      setWorkbenchData({
        ...workbenchData,
        consoleOutput: "<span style='color: #ff6b6b'> Error: No Mermaid diagram to convert.</span>"
      });
      return;
    }
    
    // Convert to code based on selected syntax
    let generatedCode;
    if (workbenchData.syntax === SYNTAX_TYPES.JAVA) {
      generatedCode = convertMermaidToJava(mermaidSource);
    } else {
      generatedCode = convertMermaidToPython(mermaidSource);
    }
    
    // Update the editor with the generated code
    if (generatedCode) {
      setWorkbenchData({
        ...workbenchData,
        code: generatedCode,
        consoleOutput: "<span style='color: #1dd1a1'>✅ Code generated successfully!</span>"
      });
    } else {
      setWorkbenchData({
        ...workbenchData,
        consoleOutput: "<span style='color: #ff6b6b'> Failed to generate code from diagram.</span>"
      });
    }
  } catch (error) {
    console.error('Error generating code:', error);
    setWorkbenchData({
      ...workbenchData,
      consoleOutput: `<span style='color: #ff6b6b'> Error: ${error.message}</span>`
    });
  }
};

  // Logic for test run
const handleTestRun = () => {
  if (!workbenchData.code) {
    setWorkbenchData({
      ...workbenchData,
      consoleOutput: "<span style='color: #ff6b6b'>❌ Error: No code to validate.</span>"
    });
    return;
  }

  // Show a loading message
  setWorkbenchData({
    ...workbenchData,
    consoleOutput: "<span style='color: #54a0ff'>🔄 Validating code...</span>"
  });
  
  // Determine the endpoint based on the syntax
  const endpoint = workbenchData.syntax === SYNTAX_TYPES.JAVA 
    ? 'http://127.0.0.1:5000/api/validate/java'
    : 'http://127.0.0.1:5000/api/validate/python';
  
  // Call the backend validation service
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: workbenchData.code,
    }),
  })
  .then(response => response.json())
  .then(data => {
    // Format errors for display
    const messages = data.errors.map(error => {
      let color;
      let icon;
      
      switch(error.severity) {
        case 'error':
          color = '#ff6b6b';
          icon = '❌';
          break;
        case 'warning':
          color = '#feca57';
          icon = '⚠️';
          break;
        case 'info':
          color = '#54a0ff';
          icon = 'ℹ️';
          break;
        default:
          color = '#f0f0f0';
          icon = '';
      }
      
      return `<span style="color: ${color}">${icon} Line ${error.line}: ${error.message}</span>`;
    });
    
    // Update the console output with results
    setWorkbenchData({
      ...workbenchData,
      consoleOutput: messages.join('<br>')
    });
    
    // If validation succeeded, add success message
    if (data.success) {
      setWorkbenchData(prev => ({
        ...prev,
        consoleOutput: prev.consoleOutput + 
          "<br><br><span style='color: #1dd1a1'>✅ Code structure looks good! Ready to submit.</span>"
      }));
    }
    
    // Add markers to the editor if we have a reference to it
    if (editorInstance && monacoInstance) {
      const model = editorInstance.getModel();
      if (!model) return;
      
      // Clear previous markers
      monacoInstance.editor.setModelMarkers(model, 'backend-validation', []);
      
      // Add new markers
      const markers = data.errors.map(err => ({
        severity: 
          err.severity === 'error' ? monacoInstance.MarkerSeverity.Error : 
          err.severity === 'warning' ? monacoInstance.MarkerSeverity.Warning : 
          monacoInstance.MarkerSeverity.Info,
        message: err.message,
        startLineNumber: err.line,
        startColumn: 1,
        endLineNumber: err.line,
        endColumn: model.getLineMaxColumn(err.line) || 1
      }));
      
      monacoInstance.editor.setModelMarkers(model, 'backend-validation', markers);
    }
  })
  .catch((error) => {
    console.error('Error validating code:', error);
    setWorkbenchData({
      ...workbenchData,
      consoleOutput: `<span style='color: #ff6b6b'>❌ Error connecting to validation service: ${error.message}</span>`
    });
  });
};

// Add a function to clear errors
const clearErrors = () => {
  // Clear console output
  setWorkbenchData(prev => ({
    ...prev,
    consoleOutput: ''
  }));
  
  // Clear markers from editor if available
  if (editorInstance && monacoInstance) {
    const model = editorInstance.getModel();
    if (model) {
      monacoInstance.editor.setModelMarkers(model, 'backend-validation', []);
    }
  }
};

  // Updated prepareDiagramSubmission function
const prepareDiagramSubmission = () => {
  // Generate a simple representation of the schema
  let mermaidRepresentation = "classDiagram\n";
  
  // Add classes
  schema.forEach((entity, entityName) => {
    mermaidRepresentation += `class ${entityName} {\n`;
    
    // Add attributes
    if (entity.attribute && entity.attribute.size > 0) {
      entity.attribute.forEach((attr, attrName) => {
        const type = attr.type || 'String';
        mermaidRepresentation += `  -${attrName}: ${type}\n`;
      });
    }
    
    // Add methods
    if (entity.methods && entity.methods.length > 0) {
      entity.methods.forEach(method => {
        const returnType = method.returnType || 'void';
        const params = method.parameters ? method.parameters.join(', ') : '';
        mermaidRepresentation += `  +${method.name}(${params}): ${returnType}\n`;
      });
    }
    
    mermaidRepresentation += "}\n";
  });
  
  // Add relationships
  relationships.forEach((rel, key) => {
    if (rel.type === 'aggregation') {
      mermaidRepresentation += `${rel.relationA} o-- "${rel.cardinalityA || '1'}" ${rel.relationB} : "${rel.label || 'Aggregation'}"\n`;
    } else if (rel.type === 'composition') {
      mermaidRepresentation += `${rel.relationA} *-- "${rel.cardinalityA || '1'}" ${rel.relationB} : "${rel.label || 'Composition'}"\n`;
    } else if (rel.type === 'inheritance') {
      mermaidRepresentation += `${rel.relationB} <|-- ${rel.relationA}\n`;
    } else if (rel.type === 'implementation') {
      mermaidRepresentation += `${rel.relationB} <|.. ${rel.relationA}\n`;
    } else {
      mermaidRepresentation += `${rel.relationA} -- ${rel.relationB} : ${rel.label || ''}\n`;
    }
  });
  
  // Set the Mermaid representation in the editor
  setWorkbenchData({
    ...workbenchData,
    code: mermaidRepresentation,
    schemaData: Array.from(schema.entries()),
    relationshipsData: Array.from(relationships.entries()),
    isFromDiagram: true
  });
  
  // Now generate the code from the Mermaid representation
  try {
    let generatedCode;
    
    // Convert to code based on selected syntax
    if (workbenchData.syntax === SYNTAX_TYPES.JAVA) {
      generatedCode = convertMermaidToJava(mermaidRepresentation);
    } else {
      generatedCode = convertMermaidToPython(mermaidRepresentation);
    }
    
    // If code generation was successful, display it
    if (generatedCode) {
      // Wait a moment to ensure the Mermaid diagram is displayed first
      setTimeout(() => {
        setWorkbenchData(prev => ({
          ...prev,
          code: generatedCode,
          consoleOutput: "<span style='color: #1dd1a1'>✅ Code generated successfully!</span>"
        }));
      }, 500);
    } else {
      setWorkbenchData(prev => ({
        ...prev,
        consoleOutput: "<span style='color: #ff6b6b'>❌ Failed to generate code from diagram.</span>"
      }));
    }
  } catch (error) {
    console.error('Error generating code:', error);
    setWorkbenchData(prev => ({
      ...prev,
      consoleOutput: `<span style='color: #ff6b6b'>❌ Error: ${error.message}</span>`
    }));
  }
  
  console.log("Schema prepared for submission:", Array.from(schema.entries()));
  console.log("Relationships prepared for submission:", Array.from(relationships.entries()));
};

   // Fixed handleSubmitForGrading function
const handleSubmitForGrading = () => {
  if (!workbenchData.questionId) {
    alert("Please select a question before submitting");
    return;
  }

  // In handleSubmitForGrading function, add these logs right before creating submissionData
  console.log("PRE-SUBMISSION SCHEMA DEBUG:");
  schema.forEach((entity, entityName) => {
    console.log(`Entity: ${entityName}`);
    console.log(`Attributes: ${entity.attribute ? entity.attribute.size : 0}`);
    if (entity.attribute && entity.attribute.size > 0) {
      console.log("Attribute entries:", Array.from(entity.attribute.entries()));
    }
  });

  // Pick the first entity to examine its structure
  if (schema.size > 0) {
    const firstEntityKey = Array.from(schema.keys())[0];
    const firstEntity = schema.get(firstEntityKey);
    console.log("FIRST ENTITY STRUCTURE:", firstEntity);
    console.log("ATTRIBUTES TYPE:", Object.prototype.toString.call(firstEntity.attribute));
    console.log("ATTRIBUTES KEYS:", firstEntity.attribute ? Array.from(firstEntity.attribute.keys()) : "No attributes");
  }

  // Try creating a clean copy of schema with properly serialized attributes
  const cleanSchema = Array.from(schema.entries()).map(([entityName, entity]) => {
    // Create a clean entity object
    const cleanEntity = {
      entity: entity.entity,
      attribute: {},  // Object instead of Map
      methods: entity.methods || []
    };
    
    // Convert attribute Map to a simple object
    if (entity.attribute && entity.attribute.size > 0) {
      entity.attribute.forEach((attr, attrName) => {
        cleanEntity.attribute[attrName] = attr;
      });
    }
    
    return [entityName, cleanEntity];
  });

  // Prepare the submission data with the clean schema
  const submissionData = {
    questionId: workbenchData.questionId,
    code: workbenchData.code,
    schema: cleanSchema, // Use the clean schema that properly includes attributes
    relationships: Array.from(relationships.entries())
  };
  
  // Debug serialization
  const serializedData = JSON.stringify(submissionData);
  console.log("SERIALIZED DATA (first 500 chars):", serializedData.substring(0, 500) + "...");
  const parsedBack = JSON.parse(serializedData);
  console.log("PARSED BACK SCHEMA (first entity):", parsedBack.schema[0]);
  
  // Send to your backend for grading
  fetch('http://127.0.0.1:5000/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submissionData),
  })
  .then(response => response.json())
  .then(data => {
    console.log('Grading result:', data);
    
    // Extract grade information if available
    if (data && data.grade) {
      // Parse the score and feedback
      const score = data.grade.score || 0;
      const feedback = data.grade.feedback || '';
      
      // Show the floating grade panel with our new component
      setGradeResults({
        visible: true,
        score: score,
        feedback: feedback,
        details: data.grade.details || {}
      });
      
      // Also update console output
      setWorkbenchData(prev => ({
        ...prev,
        consoleOutput: prev.consoleOutput + `<br><br><span style='color: #54a0ff'>Grading completed! See results panel.</span>`
      }));
    } else {
      // Fallback to displaying raw data
      setWorkbenchData(prev => ({
        ...prev,
        consoleOutput: prev.consoleOutput + `<br><br><span style='color: #54a0ff'>🔄 Grading Response: ${JSON.stringify(data)}</span>`
      }));
    }
  })
  .catch((error) => {
    console.error('Error submitting for grading:', error);
    setWorkbenchData(prev => ({
      ...prev,
      consoleOutput: prev.consoleOutput + "<br><br><span style='color: #ff6b6b'>❌ Error submitting for grading. Please try again.</span>"
    }));
  });
};

  // Validate code in component
  const validateCodeInComponent = (code, syntax) => {
    const errors = [];
    let isValid = true;
    
    // Check for class declarations
    if (!code.includes('class ')) {
      errors.push({
        line: 1, // Default to line 1 for general errors
        message: 'Error: No class declarations found.',
        severity: 'error'
      });
      isValid = false;
    }
    
    if (syntax === SYNTAX_TYPES.JAVA) {
      // Check for missing semicolons in Java
      const lines = code.split('\n');
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // Skip comments, empty lines, and lines that don't need semicolons
        const trimmedLine = line.trim();
        if (trimmedLine === '' || 
            trimmedLine.startsWith('//') || 
            trimmedLine.startsWith('/*') || 
            trimmedLine.startsWith('*') || 
            trimmedLine.startsWith('}') || 
            trimmedLine.startsWith('{') || 
            trimmedLine.endsWith('{') || 
            trimmedLine.endsWith('}')) {
          return;
        }
        
        // Check if line needs a semicolon but doesn't have one
        if (!trimmedLine.endsWith(';') && 
            !trimmedLine.includes('class ') && 
            !trimmedLine.includes('interface ') &&
            !trimmedLine.includes('@')) {
          errors.push({
            line: lineNumber,
            message: 'Syntax error: Missing semicolon at the end of statement.',
            severity: 'error'
          });
          isValid = false;
        }
      });
      
      // Check for assignment errors (missing value after equals sign)
      const assignmentErrorRegex = /=\s*;/g;
      let assignMatch;
      while ((assignMatch = assignmentErrorRegex.exec(code)) !== null) {
        const lineIndex = code.substring(0, assignMatch.index).split('\n').length - 1;
        errors.push({
          line: lineIndex + 1,
          message: "Syntax error: Assignment missing value after equals sign.",
          severity: 'error'
        });
        isValid = false;
      }
      
      // Check for missing opening braces in method declarations
      const methodDeclarationRegex = /(\w+\s+\w+\s*\([^)]*\))\s*(?![{])/g;
      let methodMatch;
      while ((methodMatch = methodDeclarationRegex.exec(code)) !== null) {
        // Make sure this isn't an interface method that ends with semicolon
        const nextChar = code.substring(methodMatch.index + methodMatch[0].length).trim()[0];
        if (nextChar !== '{' && nextChar !== ';') {
          const lineIndex = code.substring(0, methodMatch.index).split('\n').length - 1;
          errors.push({
            line: lineIndex + 1,
            message: "Syntax error: Missing opening brace '{' after method declaration.",
            severity: 'error'
          });
          isValid = false;
        }
      }
      
      // Check braces balance
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;
      
      if (openBraces !== closeBraces) {
        errors.push({
          line: 1,
          message: `Error: Unbalanced braces. Opening: ${openBraces}, Closing: ${closeBraces}`,
          severity: 'error'
        });
        isValid = false;
      }
      
      // Add the positive class found message
      const classRegex = /class\s+(\w+)/g;
      const foundClasses = [];
      let classMatch;
      while ((classMatch = classRegex.exec(code)) !== null) {
        foundClasses.push(classMatch[1]);
      }
      
      if (foundClasses.length > 0) {
        errors.push({
          line: 1,
          message: `Found ${foundClasses.length} classes: ${foundClasses.join(', ')}`,
          severity: 'info'
        });
      }
    }
    
    // Format the errors for display
    const messages = errors.map(error => {
      let color;
      let icon;
      
      switch(error.severity) {
        case 'error':
          color = '#ff6b6b';
          icon = '❌';
          break;
        case 'warning':
          color = '#feca57';
          icon = '⚠️';
          break;
        case 'info':
          color = '#54a0ff';
          icon = 'ℹ️';
          break;
        default:
          color = '#f0f0f0';
          icon = '';
      }
      
      return `<span style="color: ${color}">${icon} Line ${error.line}: ${error.message}</span>`;
    });
    
    return { isValid, messages, errors };
  };

  // Function for adding diagnostic markers in Monaco editor
  const addDiagnosticMarkers = (editor, monaco, errors) => {
    const model = editor.getModel();
    if (!model) return;
    
    // Clear previous markers
    monaco.editor.setModelMarkers(model, 'owner', []);
    
    // Add new markers
    const markers = errors.map(err => ({
      severity: monaco.MarkerSeverity.Error,
      message: err.message,
      startLineNumber: err.line,
      startColumn: 1,
      endLineNumber: err.line,
      endColumn: model.getLineMaxColumn(err.line)
    }));
    
    monaco.editor.setModelMarkers(model, 'owner', markers);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: isFullscreen ? '0' : `${position.y}px`, // Use dynamic position
        right: isFullscreen ? '0' : `${position.x}px`, // Use dynamic position
        left: isFullscreen ? '0' : 'auto', 
        bottom: isFullscreen ? '0' : 'auto',
        zIndex: 1200,
        backgroundColor: '#ffffff',
        borderRadius: isFullscreen ? '0' : '4px',
        border: '1px solid #e0e0e0',
        padding: '16px',
        width: isFullscreen ? '100%' : '500px',
        height: isFullscreen ? '100%' : 'auto',
        maxHeight: isFullscreen ? '100%' : '80vh',
        overflow: 'auto',
        transition: 'all 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Vertical position control */}
      <Box 
        sx={{
          position: 'absolute',
          top: '50%',
          left: '-40px',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 1300,
        }}
      >
        <IconButton
          size="small"
          onClick={moveUp}
          sx={{ 
            backgroundColor: 'white', 
            border: '1px solid #e0e0e0',
            boxShadow: '0px 0px 5px rgba(0,0,0,0.1)',
            '&:hover': { backgroundColor: '#f5f5f5' }
          }}
        >
          ↑
        </IconButton>
        <IconButton
          size="small"
          onClick={moveDown}
          sx={{ 
            backgroundColor: 'white', 
            border: '1px solid #e0e0e0',
            boxShadow: '0px 0px 5px rgba(0,0,0,0.1)',
            '&:hover': { backgroundColor: '#f5f5f5' }
          }}
        >
          ↓
        </IconButton>
      </Box>

      {/* Horizontal position control */}
      <Box 
        sx={{
          position: 'absolute',
          left: '50%',
          top: '-40px',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          zIndex: 1300,
        }}
      >
        <IconButton
          size="small"
          onClick={moveLeft}
          sx={{ 
            backgroundColor: 'white', 
            border: '1px solid #e0e0e0',
            boxShadow: '0px 0px 5px rgba(0,0,0,0.1)',
            '&:hover': { backgroundColor: '#f5f5f5' }
          }}
        >
          ←
        </IconButton>
        <IconButton
          size="small"
          onClick={moveRight}
          sx={{ 
            backgroundColor: 'white', 
            border: '1px solid #e0e0e0',
            boxShadow: '0px 0px 5px rgba(0,0,0,0.1)',
            '&:hover': { backgroundColor: '#f5f5f5' }
          }}
        >
          →
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', margin: 0 }}>
          Code WorkBench {workbenchData.questionId && `- ${workbenchData.questionId}`}
        </Typography>
        <Box>
          <IconButton 
            size="small" 
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? '⤓' : '⤢'}
          </IconButton>
          <IconButton 
            size="small" 
            onClick={onClose}
          >
            ✖️
          </IconButton>
        </Box>
      </Box>
      
      <Select
        value={workbenchData.syntax}
        onChange={(e) => setWorkbenchData({...workbenchData, syntax: e.target.value})}
        fullWidth
        sx={{ mb: 2 }}
        size="small"
      >
        <MenuItem value={SYNTAX_TYPES.JAVA}>Java</MenuItem>
        <MenuItem value={SYNTAX_TYPES.PYTHON}>Python</MenuItem>
      </Select>
            
      {/* Fixed height container for the editor */}
      <MonacoEditorWrapper
      height={isFullscreen ? "calc(100vh - 120px)" : "300px"}
      language={workbenchData.syntax === SYNTAX_TYPES.JAVA ? 'java' : 'python'}
      theme="vs-light"
      value={workbenchData.code}
      onChange={(value) => {
        setWorkbenchData(prev => ({...prev, code: value, isCodeModified: true}));
      }}
      options={{
        automaticLayout: true,
        padding: { top: 10, bottom: 10 },
      }}
      onKeyDown={(e) => {
        // Make sure the event doesn't bubble up
        e.stopPropagation();
      }}
      onMount={(editor, monaco) => {
        // Store references to editor and monaco
        setEditorInstance(editor);
        setMonacoInstance(monaco);

        // Add keyboard event handler to the editor DOM node
      const editorDomNode = editor.getDomNode();
      if (editorDomNode) {
        editorDomNode.addEventListener('keydown', (e) => {
          e.stopPropagation();
        });
      }
        
        // Configure language support
        if (!monaco.languages.getLanguages().some(lang => lang.id === 'java')) {
          monaco.languages.register({ id: 'java' });
        }
        
        if (!monaco.languages.getLanguages().some(lang => lang.id === 'python')) {
          monaco.languages.register({ id: 'python' });
        }

        // Add custom handler for backspace
    editor.onKeyDown((e) => {
      // If backspace is pressed
      if (e.keyCode === monaco.KeyCode.Backspace) {
        const selection = editor.getSelection();
        
        // If there's a selection, let Monaco handle it
        if (!selection.isEmpty()) {
          return;
        }
        
        const position = selection.getPosition();
        const model = editor.getModel();
        
        // If at beginning of file, nothing to do
        if (position.lineNumber === 1 && position.column === 1) {
          return;
        }
        
        // If at beginning of line, join with previous line
        if (position.column === 1) {
          const prevLineNumber = position.lineNumber - 1;
          const prevLineLength = model.getLineLength(prevLineNumber);
          
          // Create a selection from end of previous line to start of current line
          const range = new monaco.Range(
            prevLineNumber, prevLineLength + 1,
            position.lineNumber, position.column
          );
          
          // Replace the selection with empty string
          const operation = {
            range: range,
            text: ''
          };
          
          // Execute the edit
          editor.executeEdits('backspace-handler', [operation]);
          
          // Move cursor to end of previous line
          editor.setPosition({
            lineNumber: prevLineNumber,
            column: prevLineLength + 1
          });
          
          // Prevent default backspace
          e.preventDefault();
        }
      }
    });
        
        // Set up live validation with backend
        let validationTimeout = null;
        editor.onDidChangeModelContent(() => {
          // Use a debounce mechanism to avoid too many requests
          clearTimeout(validationTimeout);
          validationTimeout = setTimeout(() => {
            // Get current code
            const code = editor.getValue();
            if (!code.trim()) {
              // Clear markers if code is empty
              monaco.editor.setModelMarkers(editor.getModel(), 'backend-validation', []);
              return;
            }
            
            // Determine endpoint based on syntax
            const endpoint = workbenchData.syntax === SYNTAX_TYPES.JAVA 
              ? 'http://127.0.0.1:5000/api/validate/java'
              : 'http://127.0.0.1:5000/api/validate/python';
            
            // Call the backend validation API
            fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code }),
            })
            .then(response => response.json())
            .then(data => {
              // Add markers to the editor
              const model = editor.getModel();
              if (!model) return;
              
              // Clear previous markers
              monaco.editor.setModelMarkers(model, 'backend-validation', []);
              
              // Add new markers
              const markers = data.errors.map(err => ({
                severity: 
                  err.severity === 'error' ? monaco.MarkerSeverity.Error : 
                  err.severity === 'warning' ? monaco.MarkerSeverity.Warning : 
                  monaco.MarkerSeverity.Info,
                message: err.message,
                startLineNumber: err.line,
                startColumn: 1,
                endLineNumber: err.line,
                endColumn: model.getLineMaxColumn(err.line) || 1
              }));
              
              monaco.editor.setModelMarkers(model, 'backend-validation', markers);
            })
            .catch(error => {
              console.error('Error validating code:', error);
            });
          }, 1000); // 1 second delay after typing stops
        });
      }}
    />

    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    <Button
      variant="contained"
      color="primary"
      size="small"
      onClick={handleGenerate}
      sx={{ fontSize: '0.8rem' }}
    >
      Generate
    </Button>
    <Button
      variant="contained"
      color="secondary"
      size="small"
      onClick={handleUpdate}
      disabled={!workbenchData.isCodeModified}
      sx={{ fontSize: '0.8rem' }}
    >
      Update
    </Button>
    <Button
      variant="contained"
      color="success"
      size="small"
      onClick={handleTestRun}
      sx={{ fontSize: '0.8rem' }}
    >
      Test Run
    </Button>
    <Button
      variant="contained"
      color="primary"
      size="small"
      onClick={handleSubmitForGrading}
      disabled={!workbenchData.questionId || !workbenchData.code}
      sx={{ fontSize: '0.8rem' }}
    >
      Submit for Grading
    </Button>
    {/* Added Clear Errors button */}
    <Button
      variant="contained"
      color="error"
      size="small"
      onClick={clearErrors}
      disabled={!workbenchData.consoleOutput}
      sx={{ fontSize: '0.8rem' }}
    >
      Clear Errors
    </Button>
  </Box>  
    {/* Console output */}
    {workbenchData.consoleOutput && (
      <Box 
        sx={{ 
          mt: 1, 
          p: 1, 
          backgroundColor: '#1e1e1e', 
          color: '#f0f0f0',
          fontFamily: 'monospace',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap'
        }}
        dangerouslySetInnerHTML={{ __html: workbenchData.consoleOutput }}
      />
    )}

    {/* Generated code display */}
    {workbenchData.generatedCode && (
      <Box sx={{ mt: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
          {workbenchData.generatedCode}
        </Typography>
      </Box>
    )}

    {/* Floating Grade Results Panel with improved visibility */}
    {gradeResults.visible && (
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          maxHeight: '85vh',
          overflow: 'auto',
          backgroundColor: '#1a1a1a', // Slightly darker background
          color: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          padding: '0',
          zIndex: 2000,
        }}
      >
        {/* Close button - moved to upper right with better visibility */}
        <IconButton
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 2100,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
            }
          }}
          onClick={() => setGradeResults(prev => ({ ...prev, visible: false }))}
        >
          ✖️
        </IconButton>
        
        {/* Use our custom UML Assessment Component with improved visibility */}
        <UMLAssessmentDisplay assessmentData={{
          score: gradeResults.score,
          feedback: gradeResults.feedback
        }} />
      </Box>
    )}
    </Box>
    );
    };

export default CodeWorkbench;