// ui.js - Advanced Workbench for Mermaid Diagram Generation

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

    // Add these event listeners right here, after initializing the editor
    codeEditorContainer.addEventListener('mousedown', (e) => e.stopPropagation());
    codeEditorContainer.addEventListener('mousemove', (e) => e.stopPropagation());
    codeEditorContainer.addEventListener('mouseup', (e) => e.stopPropagation());
    codeEditorContainer.addEventListener('wheel', (e) => {
        e.stopPropagation();
        // Don't prevent default here so scrolling still works in the editor
    });

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

    // Output Log
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
    workbench.appendChild(generateButton);
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
    const outputLog = document.querySelector('#workbench div');
    if (!outputLog) return;

    const mermaidSource = codeEditor.getValue().trim();
    if (!mermaidSource) {
        outputLog.textContent = 'Please enter a Mermaid diagram.';
        return;
    }

    const generatedCode = parseMermaidToCode(mermaidSource, currentSyntax);

    if (generatedCode) {
        codeEditor.setValue(generatedCode);
        outputLog.textContent = 'Classes generated successfully!';
    } else {
        outputLog.textContent = 'Failed to generate classes.';
    }
};

// Parse Mermaid diagram and generate code
export const parseMermaidToCode = (mermaidSource, syntax) => {
    const classRegex = /class\s+(\w+)\s*\{([^}]*)\}/g;
    const relationshipRegex = /(\w+)"([^"]+)"--"([^"]+)"(\w+)/g;

    let code = '';
    let match;

    while ((match = classRegex.exec(mermaidSource)) !== null) {
        const [, className, classContent] = match;
        code += generateClassCode(className, classContent, syntax) + '\n\n';
    }

    while ((match = relationshipRegex.exec(mermaidSource)) !== null) {
        const [, classA, cardinalityA, cardinalityB, classB] = match;
        code += `// Relationship: ${classA} "${cardinalityA}" -- "${cardinalityB}" ${classB}\n`;
    }

    return code.trim();
};

// Generate class code based on syntax
const generateClassCode = (className, classContent, syntax) => {
    const attributeRegex = /(?:\s*[-+#]?\s*)(\w+)\s*:\s*([\w<>]*)?/g;
    let attributes = [];
    let match;

    while ((match = attributeRegex.exec(classContent)) !== null) {
        let [, attributeName, attributeType] = match;

        if (!attributeType || attributeType.trim() === '') {
            attributeType = syntax === SYNTAX_TYPES.JAVA ? 'Object' : 'Any';
        }

        attributes.push({ name: attributeName, type: attributeType });
    }

    return syntax === SYNTAX_TYPES.JAVA ? generateJavaClass(className, attributes) : generatePythonClass(className, attributes);
};

// Generate Java class
const generateJavaClass = (className, attributes) => {
    let code = `public class ${className} {\n`;

    attributes.forEach(({ name, type }) => {
        code += `    private ${type} ${name};\n`;
    });

    code += '}';
    return code;
};

// Generate Python class
const generatePythonClass = (className, attributes) => {
    let code = `class ${className}:\n    def __init__(self):\n`;

    attributes.forEach(({ name }) => {
        code += `        self._${name} = None\n`;
    });

    return code;
};

// Export the initWorkbench function for use in the Mermaid diagram code
export default { initWorkbench, parseMermaidToCode };