import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Button, Select, MenuItem } from '@mui/material';
import MonacoEditorWrapper from '../monacoWrapper/MonacoEditorWrapper';
import { SYNTAX_TYPES } from '../ui/ui';
import { syncJavaCodeWithSchema } from '../utils/MermaidDiagramUtils';

const CodeWorkbench = ({
  schema,
  relationships,
  addEntity,
  addAttribute,
  addMethod,
  addMethodsFromParsedCode,
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

   
    // For local Storage
    useEffect(() => {
        // Save code to localStorage whenever it changes
        if (workbenchData.questionId && workbenchData.code) {
        localStorage.setItem(`workbench_code_${workbenchData.questionId}`, workbenchData.code);
        }
    }, [workbenchData.code, workbenchData.questionId]);

  // Update the schema and re-render diagram
  const handleUpdate = () => {
    syncJavaCodeWithSchema(
      workbenchData.code, 
      workbenchData.syntax, 
      addEntity, 
      addAttribute, 
      addMethod, 
      addMethodsFromParsedCode,
      workbenchData.questionId // Pass the question ID to link it with the code
    );
    
    setWorkbenchData({
      ...workbenchData,
      isCodeModified: false
    });
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
  
    // Run validation logic
    const results = validateCodeInComponent(workbenchData.code, workbenchData.syntax);
    
    // Update the console output with results
    setWorkbenchData({
      ...workbenchData,
      consoleOutput: results.messages.join('<br>')
    });
    
    if (results.isValid) {
      // If validation passed, add success message
      setWorkbenchData(prev => ({
        ...prev,
        consoleOutput: prev.consoleOutput + "<br><br><span style='color: #1dd1a1'>✅ Code structure looks good! Ready to submit.</span>"
      }));
    }
  };

  // Position adjustment handlers
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

  // Submission Logic
  const handleSubmitForGrading = () => {
    if (!workbenchData.questionId) {
      alert("Please select a question before submitting");
      return;
    }
    
    // Prepare the submission data
    const submissionData = {
      questionId: workbenchData.questionId,
      code: workbenchData.code,
      schema: Array.from(schema.entries()), // Convert map to array for JSON
      relationships: Array.from(relationships.entries())
    };
    
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
      // Handle the grading response, e.g., show feedback
      setWorkbenchData(prev => ({
        ...prev,
        consoleOutput: prev.consoleOutput + `<br><br><span style='color: #54a0ff'>🔄 Grading Response: ${JSON.stringify(data)}</span>`
      }));
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
        onMount={(editor, monaco) => {
          // Configure language support
          if (!monaco.languages.getLanguages().some(lang => lang.id === 'java')) {
            monaco.languages.register({ id: 'java' });
          }
          
          if (!monaco.languages.getLanguages().some(lang => lang.id === 'python')) {
            monaco.languages.register({ id: 'python' });
          }
          
          // Set up a listener for model changes to check for errors
          editor.onDidChangeModelContent(() => {
            setTimeout(() => {
              const model = editor.getModel();
              if (!model) return;
              
              // Run custom validation
              const { isValid, messages, errors } = validateCodeInComponent(editor.getValue(), workbenchData.syntax);
              
              // Add diagnostic markers based on our custom validation
              const markers = errors.map(err => ({
                severity: err.severity === 'error' ? monaco.MarkerSeverity.Error : 
                        err.severity === 'warning' ? monaco.MarkerSeverity.Warning : 
                        monaco.MarkerSeverity.Info,
                message: err.message,
                startLineNumber: err.line,
                startColumn: 1,
                endLineNumber: err.line,
                endColumn: model.getLineMaxColumn(err.line) || 1
              }));
              
              // Set markers on the model
              monaco.editor.setModelMarkers(model, 'custom-validation', markers);
              
              // Update the console output with error messages
              if (messages.length > 0) {
                setWorkbenchData(prev => ({
                  ...prev,
                  consoleOutput: messages.join('<br>')
                }));
              }
            }, 300); // Small delay to ensure Monaco has processed the changes
          });
        }}
      />
      
      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
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
    </Box>
  );
};

export default CodeWorkbench;