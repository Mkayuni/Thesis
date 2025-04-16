// mermaidCodeGenerator.js - Utility for converting Mermaid diagrams to code
// Place this file in your utils directory

/**
 * Convert Mermaid class diagram to Java code
 * @param {string} mermaidSource - Mermaid class diagram source
 * @returns {string} - Generated Java code
 */
export const convertMermaidToJava = (mermaidSource) => {
    const parsedClasses = parseMermaidClasses(mermaidSource);
    return generateJavaCode(parsedClasses);
  };
  
  /**
   * Convert Mermaid class diagram to Python code
   * @param {string} mermaidSource - Mermaid class diagram source
   * @returns {string} - Generated Python code
   */
  export const convertMermaidToPython = (mermaidSource) => {
    const parsedClasses = parseMermaidClasses(mermaidSource);
    return generatePythonCode(parsedClasses);
  };
  
  /**
   * Parse classes from Mermaid class diagram syntax
   * @param {string} mermaidSource - Mermaid class diagram source
   * @returns {Array} - Array of parsed class objects
   */
  const parseMermaidClasses = (mermaidSource) => {
    // Remove classDiagram keyword if present
    mermaidSource = mermaidSource.replace(/^\s*classDiagram\s*/, '');
    
    // Match class blocks with their content
    const classRegex = /class\s+(\w+)\s*\{([^}]*)\}/gs;
    const classes = [];
    let match;
    
    while ((match = classRegex.exec(mermaidSource)) !== null) {
      const className = match[1];
      const classContent = match[2].trim();
      
      // Parse class content into attributes and methods
      const { attributes, methods } = parseClassContent(classContent);
      
      // Add to classes array
      classes.push({
        name: className,
        attributes,
        methods
      });
    }
    
    // Find inheritance and implementation relationships
    const relationships = findRelationships(mermaidSource);
    
    // Add relationship info to classes
    relationships.forEach(rel => {
      const { type, from, to } = rel;
      const targetClass = classes.find(c => c.name === from);
      
      if (targetClass) {
        if (type === 'extends') {
          targetClass.extends = to;
        } else if (type === 'implements') {
          if (!targetClass.implements) {
            targetClass.implements = [];
          }
          targetClass.implements.push(to);
        }
      }
    });
    
    return classes;
  };
  
  /**
   * Parse class content into attributes and methods
   * @param {string} classContent - Content of a class block
   * @returns {Object} - Object containing arrays of attributes and methods
   */
  const parseClassContent = (classContent) => {
    const lines = classContent.split('\n').map(line => line.trim()).filter(line => line);
    const attributes = [];
    const methods = [];
    
    lines.forEach(line => {
      // Check if line is a method (contains parentheses)
      if (line.includes('(') && line.includes(')')) {
        // Parse method
        const methodMatch = /([+\-#]?)\s*(\w+)\s*\(([^)]*)\)\s*:?\s*(.*)/.exec(line);
        
        if (methodMatch) {
          const [, visibility, name, paramStr, returnInfo] = methodMatch;
          
          // Parse parameters
          const params = paramStr ? parseParameters(paramStr) : [];
          
          // Parse return type
          const returnType = returnInfo ? returnInfo.trim() : 'void';
          
          methods.push({
            visibility: getVisibilityFromSymbol(visibility),
            name,
            params,
            returnType
          });
        }
      } else {
        // Parse attribute
        const attrMatch = /([+\-#]?)\s*(\w+)\s*:\s*(.*)/.exec(line);
        
        if (attrMatch) {
          const [, visibility, name, type] = attrMatch;
          
          attributes.push({
            visibility: getVisibilityFromSymbol(visibility),
            name,
            type: type.trim()
          });
        }
      }
    });
    
    return { attributes, methods };
  };
  
  /**
   * Parse method parameters from parameter string
   * @param {string} paramStr - Parameter string from method declaration
   * @returns {Array} - Array of parameter objects
   */
  const parseParameters = (paramStr) => {
    if (!paramStr.trim()) return [];
    
    const params = [];
    const paramParts = paramStr.split(',').map(p => p.trim());
    
    paramParts.forEach(part => {
      const paramMatch = /(\w+)\s*:\s*(.*)/.exec(part);
      
      if (paramMatch) {
        const [, name, type] = paramMatch;
        params.push({ name, type: type.trim() });
      } else if (part) {
        // If no type specified, default to Object
        params.push({ name: part, type: 'Object' });
      }
    });
    
    return params;
  };
  
  /**
   * Convert UML visibility symbol to language keywords
   * @param {string} symbol - UML visibility symbol
   * @returns {string} - Language visibility keyword
   */
  const getVisibilityFromSymbol = (symbol) => {
    switch (symbol) {
      case '+': return 'public';
      case '-': return 'private';
      case '#': return 'protected';
      default: return 'public'; // Default to public
    }
  };
  
  /**
   * Find inheritance and implementation relationships in Mermaid source
   * @param {string} mermaidSource - Mermaid diagram source
   * @returns {Array} - Array of relationship objects
   */
  const findRelationships = (mermaidSource) => {
    const relationships = [];
    
    // Match inheritance relationships (--|>)
    const inheritanceRegex = /(\w+)\s+\-\-\|\>\s+(\w+)/g;
    let match;
    
    while ((match = inheritanceRegex.exec(mermaidSource)) !== null) {
      relationships.push({
        type: 'extends',
        from: match[1], // Child class
        to: match[2]    // Parent class
      });
    }
    
    // Match implementation relationships (..|>)
    const implementsRegex = /(\w+)\s+\.\.\|\>\s+(\w+)/g;
    
    while ((match = implementsRegex.exec(mermaidSource)) !== null) {
      relationships.push({
        type: 'implements',
        from: match[1], // Implementing class
        to: match[2]    // Interface
      });
    }
    
    return relationships;
  };
  
  /**
   * Generate Java code from parsed class information
   * @param {Array} classes - Array of parsed class objects
   * @returns {string} - Generated Java code
   */
  const generateJavaCode = (classes) => {
    return classes.map(cls => generateJavaClass(cls)).join('\n\n');
  };
  
  /**
   * Generate Java class code
   * @param {Object} cls - Parsed class object
   * @returns {string} - Java class code
   */
  const generateJavaClass = (cls) => {
    const { name, attributes = [], methods = [], extends: parentClass, implements: interfaces } = cls;
    
    let code = `public class ${name}`;
    
    // Add extends clause
    if (parentClass) {
      code += ` extends ${parentClass}`;
    }
    
    // Add implements clause
    if (interfaces && interfaces.length > 0) {
      code += ` implements ${interfaces.join(', ')}`;
    }
    
    code += ' {\n';
    
    // Add attributes
    if (attributes.length > 0) {
      attributes.forEach(attr => {
        const { visibility, name, type } = attr;
        code += `    ${visibility} ${type} ${name};\n`;
      });
      code += '\n';
    }
    
    // Add methods
    if (methods.length > 0) {
      methods.forEach(method => {
        const { visibility, name, params, returnType } = method;
        
        // Create parameter string
        const paramString = params.map(p => `${p.type} ${p.name}`).join(', ');
        
        code += `    ${visibility} ${returnType} ${name}(${paramString}) {\n`;
        
        // Add basic method implementation based on return type
        if (returnType && returnType !== 'void') {
          if (returnType === 'boolean' || returnType === 'Boolean') {
            code += '        return false;\n';
          } else if (returnType === 'int' || returnType === 'Integer' || 
                     returnType === 'float' || returnType === 'Float' ||
                     returnType === 'double' || returnType === 'Double' ||
                     returnType === 'long' || returnType === 'Long') {
            code += '        return 0;\n';
          } else if (returnType === 'String') {
            code += '        return "";\n';
          } else if (returnType.includes('List')) {
            code += '        return new ArrayList<>();\n';
          } else {
            code += '        return null;\n';
          }
        }
        
        code += '    }\n\n';
      });
    }
    
    code += '}';
    return code;
  };
  
  /**
   * Generate Python code from parsed class information
   * @param {Array} classes - Array of parsed class objects
   * @returns {string} - Generated Python code
   */
  const generatePythonCode = (classes) => {
    // Add imports
    let code = 'from typing import List, Optional, Any\n';
    code += 'from dataclasses import dataclass\n';
    code += 'from datetime import date, datetime\n\n';
    
    // Add class definitions
    return code + classes.map(cls => generatePythonClass(cls)).join('\n\n');
  };
  
  /**
   * Generate Python class code
   * @param {Object} cls - Parsed class object
   * @returns {string} - Python class code
   */
  const generatePythonClass = (cls) => {
    const { name, attributes = [], methods = [], extends: parentClass } = cls;
    
    let code = '@dataclass\n';
    code += `class ${name}`;
    
    // Add inheritance
    if (parentClass) {
      code += `(${parentClass})`;
    }
    
    code += ':\n';
    
    // Add attributes with type hints
    if (attributes.length > 0) {
      attributes.forEach(attr => {
        const { name, type } = attr;
        const pythonType = convertJavaToPythonType(type);
        code += `    ${name}: ${pythonType} = None\n`;
      });
      code += '\n';
    } else {
      code += '    pass\n\n';
    }
    
    // Add methods
    if (methods.length > 0) {
      methods.forEach(method => {
        const { name, params, returnType } = method;
        
        // Create parameter string
        const paramString = ['self'].concat(
          params.map(p => `${p.name}: ${convertJavaToPythonType(p.type)}`)
        ).join(', ');
        
        const pythonReturnType = returnType !== 'void' ? convertJavaToPythonType(returnType) : 'None';
        
        code += `    def ${name}(${paramString}) -> ${pythonReturnType}:\n`;
        
        // Add basic method implementation
        if (returnType === 'void') {
          code += '        pass\n';
        } else if (returnType === 'boolean' || returnType === 'Boolean') {
          code += '        return False\n';
        } else if (returnType === 'int' || returnType === 'Integer' || 
                   returnType === 'float' || returnType === 'Float' ||
                   returnType === 'double' || returnType === 'Double' ||
                   returnType === 'long' || returnType === 'Long') {
          code += '        return 0\n';
        } else if (returnType === 'String') {
          code += '        return ""\n';
        } else if (returnType.includes('List')) {
          code += '        return []\n';
        } else {
          code += '        return None\n';
        }
        
        code += '\n';
      });
    }
    
    return code;
  };
  
  /**
   * Convert Java types to Python type hints
   * @param {string} javaType - Java type
   * @returns {string} - Python type hint
   */
  const convertJavaToPythonType = (javaType) => {
    if (!javaType) return 'Any';
    
    // Handle generics
    if (javaType.includes('<') && javaType.includes('>')) {
      const baseType = javaType.split('<')[0].trim();
      const innerType = javaType.split('<')[1].split('>')[0].trim();
      
      if (baseType === 'List') {
        return `List[${convertJavaToPythonType(innerType)}]`;
      }
      
      return `Any`;  // Default for unknown generic types
    }
    
    // Map common types
    switch (javaType) {
      case 'String': return 'str';
      case 'Integer':
      case 'int': return 'int';
      case 'Float':
      case 'float': return 'float';
      case 'Double':
      case 'double': return 'float';
      case 'Boolean':
      case 'boolean': return 'bool';
      case 'Date': return 'date';
      case 'void': return 'None';
      default: return javaType;  // Keep class names the same
    }
  };
  
  export default {
    convertMermaidToJava,
    convertMermaidToPython
  };