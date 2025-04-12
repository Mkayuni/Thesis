// ui.js - Advanced Workbench for Mermaid Diagram Generation
import { convertMermaidToJava, convertMermaidToPython } from './mermaidCodeGenerator';

// Import Monaco Editor
import * as monaco from 'monaco-editor';

// Constants for syntax types
export const SYNTAX_TYPES = {
    PYTHON: 'python',
    JAVA: 'java',
};

// Default syntax type
let currentSyntax = SYNTAX_TYPES.JAVA;

// Initialize the Workbench UI
export const initWorkbench = () => {
    const workbench = document.getElementById('workbench');
    if (!workbench) {
        console.error('Workbench element not found!');
        return;
    }

     // Add this to prevent event propagation to the parent diagram
     workbench.addEventListener('mousedown', (e) => e.stopPropagation());
     workbench.addEventListener('mousemove', (e) => e.stopPropagation());
     workbench.addEventListener('mouseup', (e) => e.stopPropagation());
     workbench.addEventListener('click', (e) => e.stopPropagation());
     workbench.addEventListener('wheel', (e) => e.stopPropagation());

    // Clear existing content
    workbench.innerHTML = '';

    // Syntax Selector
    const syntaxSelector = document.createElement('select');
    syntaxSelector.innerHTML = `
      <option value="${SYNTAX_TYPES.JAVA}">Java</option>
      <option value="${SYNTAX_TYPES.PYTHON}">Python</option>
    `;
    syntaxSelector.style.marginBottom = '10px';
    syntaxSelector.addEventListener('change', (e) => {
        currentSyntax = e.target.value;
        updateCodeEditorLanguage();
    });

    // Code Editor Container
    const codeEditorContainer = document.createElement('div');
    codeEditorContainer.id = 'code-editor';
    codeEditorContainer.style.width = '100%';
    codeEditorContainer.style.height = '200px';
    codeEditorContainer.style.marginBottom = '10px';

    // Initialize Monaco Editor
    let codeEditor = monaco.editor.create(codeEditorContainer, {
        value: '',
        language: currentSyntax === SYNTAX_TYPES.JAVA ? 'java' : 'python',
        theme: 'vs-light',
        automaticLayout: true,
    });

    // Enable built-in linting for Monaco
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false
    });

    // Add code completion for Java
    monaco.languages.registerCompletionItemProvider('java', {
        provideCompletionItems: function(model, position) {
            const suggestions = [
                {
                    label: 'class',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'class ${1:ClassName} {\n\t$0\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                },
                {
                    label: 'private',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'private ',
                },
                {
                    label: 'public',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'public ',
                },
                {
                    label: 'getter',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'public ${1:Type} get${2:PropertyName}() {\n\treturn ${3:fieldName};\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                },
                {
                    label: 'setter',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'public void set${1:PropertyName}(${2:Type} ${3:paramName}) {\n\tthis.${4:fieldName} = ${3:paramName};\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                }
            ];
            return { suggestions: suggestions };
        }
    });

    // Add these event listeners right here, after initializing the editor
    codeEditorContainer.addEventListener('mousedown', (e) => e.stopPropagation());
    codeEditorContainer.addEventListener('mousemove', (e) => e.stopPropagation());
    codeEditorContainer.addEventListener('mouseup', (e) => e.stopPropagation());
    codeEditorContainer.addEventListener('wheel', (e) => {
        e.stopPropagation();
        // Don't prevent default here so scrolling still works in the editor
    });

    // Button Container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';

    // Generate Button
    const generateButton = document.createElement('button');
    generateButton.textContent = 'Generate Classes';
    generateButton.style.padding = '10px 20px';
    generateButton.style.backgroundColor = '#007bff';
    generateButton.style.color = '#fff';
    generateButton.style.border = 'none';
    generateButton.style.borderRadius = '4px';
    generateButton.style.cursor = 'pointer';
    generateButton.addEventListener('click', () => handleGenerate(codeEditor));

    // Test Run Button
    const testRunButton = document.createElement('button');
    testRunButton.textContent = 'Test Run';
    testRunButton.style.padding = '10px 20px';
    testRunButton.style.backgroundColor = '#28a745';
    testRunButton.style.color = '#fff';
    testRunButton.style.border = 'none';
    testRunButton.style.borderRadius = '4px';
    testRunButton.style.cursor = 'pointer';
    testRunButton.addEventListener('click', () => validateCode(codeEditor));

    // Add buttons to container
    buttonContainer.appendChild(generateButton);
    buttonContainer.appendChild(testRunButton);

    // Console output container
    const consoleOutput = document.createElement('div');
    consoleOutput.id = 'code-console';
    consoleOutput.style.marginTop = '10px';
    consoleOutput.style.padding = '10px';
    consoleOutput.style.backgroundColor = '#1e1e1e';
    consoleOutput.style.color = '#f0f0f0';
    consoleOutput.style.fontFamily = 'monospace';
    consoleOutput.style.border = '1px solid #333';
    consoleOutput.style.borderRadius = '4px';
    consoleOutput.style.maxHeight = '150px';
    consoleOutput.style.overflowY = 'auto';
    consoleOutput.innerHTML = '<div class="console-header" style="color: #54a0ff; margin-bottom: 5px; font-weight: bold;">Console Output</div>';

    // Output Log (keep for compatibility)
    const outputLog = document.createElement('div');
    outputLog.style.marginTop = '10px';
    outputLog.style.padding = '10px';
    outputLog.style.backgroundColor = '#f5f5f5';
    outputLog.style.border = '1px solid #e0e0e0';
    outputLog.style.borderRadius = '4px';
    outputLog.style.maxHeight = '150px';
    outputLog.style.overflowY = 'auto';

    // Append elements to the workbench
    workbench.appendChild(syntaxSelector);
    workbench.appendChild(codeEditorContainer);
    workbench.appendChild(buttonContainer);
    workbench.appendChild(consoleOutput);
    workbench.appendChild(outputLog);
};

// Update the code editor language based on the selected syntax
const updateCodeEditorLanguage = () => {
    const codeEditorContainer = document.getElementById('code-editor');
    if (!codeEditorContainer) return;

    const codeEditor = monaco.editor.getModels()[0];
    if (codeEditor) {
        const language = currentSyntax === SYNTAX_TYPES.JAVA ? 'java' : 'python';
        monaco.editor.setModelLanguage(codeEditor, language);
    }
};

// Handle the generation of classes
const handleGenerate = (codeEditor) => {
    const outputLog = document.querySelector('#workbench div:nth-last-child(1)');
    if (!outputLog) return;

    const mermaidSource = codeEditor.getValue().trim();
    if (!mermaidSource) {
        outputLog.textContent = 'Please enter a Mermaid diagram.';
        return;
    }

    try {
        // Use the imported converter functions based on selected syntax
        let generatedCode;
        if (currentSyntax === SYNTAX_TYPES.JAVA) {
            generatedCode = convertMermaidToJava(mermaidSource);
        } else {
            generatedCode = convertMermaidToPython(mermaidSource);
        }

        if (generatedCode) {
            codeEditor.setValue(generatedCode);
            outputLog.textContent = 'Classes generated successfully!';
            appendToConsole('success', 'Code generation complete!');
        } else {
            outputLog.textContent = 'Failed to generate classes.';
            appendToConsole('error', 'Failed to generate code from diagram.');
        }
    } catch (error) {
        outputLog.textContent = `Error: ${error.message}`;
        appendToConsole('error', `Error during code generation: ${error.message}`);
    }
};

// Validate code structure and syntax
const validateCode = (codeEditor) => {
    const consoleOutput = document.getElementById('code-console');
    if (!consoleOutput) return;
    
    const code = codeEditor.getValue().trim();
    const syntax = currentSyntax;
    
    // Clear previous console output except header
    consoleOutput.innerHTML = '<div class="console-header" style="color: #54a0ff; margin-bottom: 5px; font-weight: bold;">Console Output</div>';
    
    if (!code) {
        appendToConsole('error', 'Error: No code to validate.');
        return false;
    }
    
    let isValid = true;
    
    // Basic syntax validation based on language
    if (syntax === SYNTAX_TYPES.JAVA) {
        isValid = validateJavaCode(code, consoleOutput);
    } else {
        isValid = validatePythonCode(code, consoleOutput);
    }
    
    if (isValid) {
        appendToConsole('success', 'Code validation passed! Your code structure looks good.');
        return true;
    }
    
    return false;
};

// Validate Java code structure
const validateJavaCode = (code, consoleOutput) => {
    let isValid = true;
    let lineNumber = 0;
    
    // Check for class declarations
    if (!code.includes('class ')) {
        appendToConsole('error', 'Error: No class declarations found.');
        isValid = false;
    }
    
    // Check for missing semicolons
    const lines = code.split('\n');
    lines.forEach((line, index) => {
        lineNumber = index + 1;
        
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
            appendToConsole('warning', `Line ${lineNumber}: Missing semicolon at the end of statement.`);
            isValid = false;
        }
    });
    
    // Check for proper class and method structure
    const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*\{/g;
    const methodRegex = /(?:public|private|protected)?\s+(?:static\s+)?(?:final\s+)?(\w+(?:<.*?>)?)\s+(\w+)\s*\([^)]*\)\s*\{/g;
    
    let classMatch;
    let methodMatch;
    let foundClasses = [];
    
    while ((classMatch = classRegex.exec(code)) !== null) {
        foundClasses.push(classMatch[1]);
    }
    
    if (foundClasses.length === 0) {
        appendToConsole('error', 'Error: No properly declared classes found.');
        isValid = false;
    } else {
        appendToConsole('info', `Found ${foundClasses.length} classes: ${foundClasses.join(', ')}`);
        
        // Check for getters and setters in each class
        let hasGetterSetter = false;
        while ((methodMatch = methodRegex.exec(code)) !== null) {
            const methodName = methodMatch[2];
            if (methodName.startsWith('get') || methodName.startsWith('set')) {
                hasGetterSetter = true;
            }
        }
        
        if (!hasGetterSetter) {
            appendToConsole('warning', 'Warning: No getter or setter methods found. Most entities should have them.');
        }
    }
    
    // Check braces balance
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
        appendToConsole('error', `Error: Unbalanced braces. Opening: ${openBraces}, Closing: ${closeBraces}`);
        isValid = false;
    }
    
    return isValid;
};

// Validate Python code structure
const validatePythonCode = (code, consoleOutput) => {
    let isValid = true;
    
    // Check for class declarations
    if (!code.includes('class ')) {
        appendToConsole('error', 'Error: No class declarations found.');
        isValid = false;
    }
    
    // Check for indentation issues
    const lines = code.split('\n');
    let expectedIndentation = 0;
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trimEnd();
        
        // Skip empty lines and comments
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
            return;
        }
        
        // Count leading spaces
        const leadingSpaces = line.length - line.trimStart().length;
        
        // Check if line ends with a colon (increases indentation for next line)
        if (trimmedLine.endsWith(':')) {
            expectedIndentation = leadingSpaces + 4;
        } 
        // Check indentation level
        else if (leadingSpaces !== 0 && leadingSpaces !== expectedIndentation) {
            appendToConsole('warning', `Line ${lineNumber}: Inconsistent indentation. Expected ${expectedIndentation} spaces.`);
            isValid = false;
        }
    });
    
    // Check for proper class structure
    const classRegex = /class\s+(\w+)(?:\(([^)]+)\))?\s*:/g;
    const methodRegex = /def\s+(\w+)\s*\((?:self(?:,\s*[^)]*)?)??\)/g;
    
    let classMatch;
    let methodMatch;
    let foundClasses = [];
    
    while ((classMatch = classRegex.exec(code)) !== null) {
        foundClasses.push(classMatch[1]);
    }
    
    if (foundClasses.length === 0) {
        appendToConsole('error', 'Error: No properly declared classes found.');
        isValid = false;
    } else {
        appendToConsole('info', `Found ${foundClasses.length} classes: ${foundClasses.join(', ')}`);
        
        // Check for getters and setters or properties
        let hasGetterSetter = false;
        while ((methodMatch = methodRegex.exec(code)) !== null) {
            const methodName = methodMatch[1];
            if (methodName.startsWith('get_') || methodName.startsWith('set_') || methodName === 'property') {
                hasGetterSetter = true;
            }
        }
        
        if (!hasGetterSetter) {
            appendToConsole('warning', 'Warning: No getter or setter methods found. Consider adding them for better OOP design.');
        }
    }
    
    return isValid;
};

// Helper to append messages to the console with different styling
const appendToConsole = (type, message) => {
    const consoleOutput = document.getElementById('code-console');
    if (!consoleOutput) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `console-message console-${type}`;
    messageElement.textContent = message;
    
    // Add color based on message type
    switch (type) {
        case 'error':
            messageElement.style.color = '#ff6b6b';
            break;
        case 'warning':
            messageElement.style.color = '#feca57';
            break;
        case 'success':
            messageElement.style.color = '#1dd1a1';
            break;
        case 'info':
            messageElement.style.color = '#54a0ff';
            break;
        default:
            messageElement.style.color = '#f0f0f0';
    }
    
    consoleOutput.appendChild(messageElement);
    consoleOutput.scrollTop = consoleOutput.scrollHeight; // Auto-scroll to the bottom
};

// Export the initWorkbench function for use in the Mermaid diagram code
export default { initWorkbench };