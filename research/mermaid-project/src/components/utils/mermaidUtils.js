import { SYNTAX_TYPES } from '../ui/ui';

// Helper Functions
export const capitalizeFirstLetter = (string) => {
  if (typeof string !== 'string' || !string) {
    console.error('Invalid input to capitalizeFirstLetter:', string);
    return '';
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const normalizeEntityName = (name) => {
  return name.replace(/\s+/g, '').toLowerCase();
};

export const extractEntityName = (nodeId) => {
  const parts = nodeId.split('-');
  return parts.length >= 2 ? normalizeEntityName(parts[1]) : normalizeEntityName(nodeId);
};

export const formatType = (type) => {
  if (!type) return '';
  
  // Remove array brackets and parentheses for cleaner display
  let formattedType = type.replace(/\[.*\]/g, '[]');
  formattedType = formattedType.replace(/[()]+/g, '');
  
  // Standardize type capitalization for UML conventions
  // This follows Java conventions where primitives are lowercase
  // and reference types are capitalized
  const typeMapping = {
    // Primitives (lowercase in Java)
    'int': 'int',
    'integer': 'int',
    'double': 'double',
    'float': 'float',
    'boolean': 'boolean',
    'char': 'char',
    'byte': 'byte',
    'short': 'short',
    'long': 'long',
    'void': 'void',
    
    // Reference types (capitalized in Java)
    'string': 'String',
    'object': 'Object',
    'list': 'List',
    'map': 'Map',
    'set': 'Set',
    'collection': 'Collection',
    'arraylist': 'ArrayList',
    'hashmap': 'HashMap',
    'hashset': 'HashSet',
    'engine': 'Engine',
    'car': 'Car',
    'electriccar': 'ElectricCar',
    'chargingstation': 'ChargingStation'
  };
  
  // Convert to lowercase for case-insensitive matching
  const lowerType = formattedType.toLowerCase();
  
  // If it's a recognized type in our mapping, use the standardized version
  if (typeMapping[lowerType]) {
    return typeMapping[lowerType];
  }
  
  // Special case for arrays
  if (lowerType.includes('[]')) {
    const baseType = lowerType.replace('[]', '');
    if (typeMapping[baseType]) {
      return typeMapping[baseType] + '[]';
    }
  }
  
  // Special handling for generic types like List<String>
  if (lowerType.includes('<') && lowerType.includes('>')) {
    const mainType = lowerType.substring(0, lowerType.indexOf('<'));
    const genericTypes = lowerType.substring(
      lowerType.indexOf('<') + 1, 
      lowerType.lastIndexOf('>')
    );
    
    // Format the main type (container type)
    let formattedMainType = typeMapping[mainType] || 
      (mainType.charAt(0).toUpperCase() + mainType.slice(1).toLowerCase());
    
    // Split and format multiple generic types (for Map<K,V> etc.)
    const typeParts = genericTypes.split(',').map(part => formatType(part.trim()));
    
    return `${formattedMainType}<${typeParts.join(', ')}>`;
  }
  
  // For all other types, follow Java convention where class types are capitalized
  if (formattedType.length > 0) {
    return formattedType.charAt(0).toUpperCase() + formattedType.slice(1).toLowerCase();
  }
  
  return formattedType;
};

// Schema to Mermaid Source
export const schemaToMermaidSource = (schema, relationships) => {
  const schemaText = [];
  console.log("Processing schema for Mermaid diagram...");

  schema.forEach((schemaItem, entityName) => {
    if (!schemaItem) {
      console.warn(`Schema item for ${entityName} is null or undefined`);
      return;
    }

    const className = capitalizeFirstLetter(entityName);
    
    // Check if this is an interface and use proper notation
    const isInterface = schemaItem.isInterface === true;
    
    if (isInterface) {
      // For interfaces, use the <<interface>> stereotype
      let interfaceDefinition = `class ${className} {\n`;
      interfaceDefinition += `  <<interface>>\n`;
      
      // Methods (all interface methods are public and abstract)
      const methodLines = [];
      
      if (schemaItem.methods && Array.isArray(schemaItem.methods)) {
        schemaItem.methods.forEach(method => {
          const parameters = method.parameters || [];
          const paramList = Array.isArray(parameters) 
              ? parameters.join(", ")
              : '';
          
          const returnType = method.returnType ? `: ${formatType(method.returnType)}` : ": void";
          
          const methodSignature = `  +${method.name}(${paramList})${returnType}`;
          methodLines.push(methodSignature);
        });
      }
      
      if (methodLines.length > 0) {
        interfaceDefinition += methodLines.join("\n") + "\n";
      }
      
      interfaceDefinition += `}\n`;
      schemaText.push(interfaceDefinition);
      
    } else {
      // Regular class definition
      let classDefinition = `class ${className} {\n`;

    // Attributes
    const attributes = new Set();
    const attributeLines = [];
    if (schemaItem.attribute && schemaItem.attribute.size > 0) {
      schemaItem.attribute.forEach((attr) => {
                  // Apply consistent type formatting for attributes
          const attrLine = `  -${attr.attribute}: ${formatType(attr.type)}`;
        if (!attributes.has(attrLine)) {
          attributes.add(attrLine);
          attributeLines.push(attrLine);
        }
      });
    } else {
      attributeLines.push("  // No attributes");
    }

    // Methods
    const methods = new Set();
    const methodLines = [];
    const getterSetterProps = new Map(); // Track getter/setter pairs
    
    if (schemaItem.constructor && Array.isArray(schemaItem.constructor.parameters)) {
        const paramList = schemaItem.constructor.parameters.join(", ");
        const constructorSignature = `  +${className}(${paramList})`;
        if (!methods.has(constructorSignature)) {
            methods.add(constructorSignature);
            methodLines.push(constructorSignature);
        }
    }

    // First pass to identify getter/setter pairs
    if (schemaItem.methods && Array.isArray(schemaItem.methods)) {
        schemaItem.methods.forEach((method) => {
            if (method.methodType === "getter" || method.methodType === "setter") {
                if (!method.propertyName) {
                    console.warn(`Method ${method.name} has type ${method.methodType} but no propertyName`);
                    return;
                }
                
                if (!getterSetterProps.has(method.propertyName)) {
                    getterSetterProps.set(method.propertyName, { getter: null, setter: null });
                }
                
                const propInfo = getterSetterProps.get(method.propertyName);
                if (method.methodType === "getter") {
                    propInfo.getter = method;
                } else {
                    propInfo.setter = method;
                }
            }
        });
    } else {
        console.warn(`No methods array found for ${className}`);
    }

    // We're removing the special property notation for getter/setter pairs
    // as requested, we'll only keep the actual methods in the methods section

    // Process regular methods first
    if (schemaItem.methods && Array.isArray(schemaItem.methods)) {
      schemaItem.methods.forEach((method) => {
          // For ALL methods, including getters and setters, create a method line
          // Set default visibility if not specified
          const visibility = method.visibility || "public";
          const visibilitySymbol = visibility === "private" ? "-" : visibility === "protected" ? "#" : "+";
          
          // Format parameters properly
          const parameters = method.parameters || [];
          const paramList = Array.isArray(parameters) 
              ? parameters.map((param) => {
                  // For better display, try to format parameters with name: type if possible
                  if (param.includes(":")) return param;
                  // For setters, use propertyName: returnType for the parameter
                  if (method.methodType === "setter" && method.propertyName) {
                      return `${method.propertyName}: ${method.returnType}`;
                  }
                  return param;
              }).join(", ")
              : '';
          
          // Add return type
          // Apply consistent formatting to return types
          const returnType = method.returnType ? `: ${formatType(method.returnType)}` : ": void";
          
          const methodSignature = `  ${visibilitySymbol}${method.name}(${paramList})${returnType}`;

          if (!methods.has(methodSignature)) {
              methods.add(methodSignature);
              methodLines.push(methodSignature);
          }
      });
    }

    // Combine attributes and methods
    classDefinition += attributeLines.join("\n") + "\n";
    if (methodLines.length > 0) {
      classDefinition += "\n" + methodLines.join("\n") + "\n";
    }
    classDefinition += `}\n`;
    schemaText.push(classDefinition);

    // Handle Inheritance
    if (schemaItem.parent) {
      const parentName = capitalizeFirstLetter(schemaItem.parent);
      schemaText.push(`${parentName} <|-- ${className}`);
      console.log(`Adding Inheritance: ${parentName} <|-- ${className}`);
    }
  }
  });

  // Handle Regular Relationships Separately
  relationships.forEach((rel) => {
    if (!rel.relationA || !rel.relationB) {
      console.warn("Skipping relationship with missing relationA or relationB:", rel);
      return;
    }

    const relationA = capitalizeFirstLetter(rel.relationA);
    const relationB = capitalizeFirstLetter(rel.relationB);

    if (rel.type === "inheritance") {
      schemaText.push(`${relationB} <|-- ${relationA}`);
    } else if (rel.type === "implementation") {
      // Implementation uses a dashed line with a triangle arrowhead
      schemaText.push(`${relationB} <|.. ${relationA}`);
    } else if (rel.type === "composition") {
      schemaText.push(`${relationA} *-- "${rel.cardinalityA}" ${relationB} : "${rel.label || 'Composition'}"`);
    } else if (rel.type === "aggregation") {
      schemaText.push(`${relationA} o-- "${rel.cardinalityA}" ${relationB} : "${rel.label || 'Aggregation'}"`);
    } else {
      schemaText.push(`${relationA} "${rel.cardinalityA}" -- "${rel.cardinalityB}" ${relationB} : ${rel.label || ""}`);
    }
  });

  const finalOutput = schemaText.join("\n");
  console.log("Mermaid generation complete");
  return finalOutput;
};

// Parse Source Code into Schema Format
export const parseCodeToSchema = (sourceCode, syntaxType, addMethod, addMethodsFromParsedCode) => {
  console.log("Starting parseCodeToSchema with syntax type:", syntaxType);
  
  if (typeof addMethod !== 'function') {
    throw new Error("addMethod must be a function");
  }

  const schemaMap = new Map();
  const relationships = new Map();
  const detectedClasses = new Set();
  const PRIMITIVE_TYPES = new Set(["String", "int", "double", "float", "boolean", "char", "long", "short", "byte", "void"]);

  const processJavaCode = () => {
    console.log("Processing Java code...");
    
    // Find and process interfaces first
    const interfaces = [];
    const interfaceRegex = /(?:public|protected|private)?\s*interface\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{([^}]*)\}/g;
    
    let interfaceMatch;
    while ((interfaceMatch = interfaceRegex.exec(sourceCode)) !== null) {
      const interfaceName = interfaceMatch[1];
      const parentInterface = interfaceMatch[2] || null;
      const interfaceBody = interfaceMatch[3];
      
      interfaces.push({
        interfaceName,
        parentInterface,
        interfaceBody
      });
      
      console.log(`Found Java interface: ${interfaceName}`);
    }
    
    console.log(`Found ${interfaces.length} Java interfaces`);
    
    // Process each interface
    interfaces.forEach(interfaceInfo => {
      const { interfaceName, parentInterface, interfaceBody } = interfaceInfo;
      
      const methods = [];
      
      // Parse method declarations in the interface
      const methodRegex = /(\w+(?:<.*?>)?)\s+(\w+)\s*\(([^)]*)\);/g;
      let methodMatch;
      
      while ((methodMatch = methodRegex.exec(interfaceBody)) !== null) {
        const returnType = methodMatch[1];
        const methodName = methodMatch[2];
        const parameters = methodMatch[3];
        
        const paramList = parameters ? 
          parameters.split(",").map(param => {
            const parts = param.trim().split(/\s+/);
            if (parts.length >= 2) {
              return `${parts[1]}: ${parts[0]}`;
            }
            return param.trim();
          }) : [];
        
        methods.push({
          visibility: "public", // All interface methods are public
          returnType,
          name: methodName,
          parameters: paramList,
          methodType: "abstract" // Interface methods are abstract
        });
      }
      
      // Add Interface to Schema
      schemaMap.set(interfaceName, {
        entity: interfaceName,
        attribute: new Map(),
        methods: methods,
        parent: parentInterface,
        isInterface: true // Mark as interface
      });
      
      // Add methods using provided function
      if (typeof addMethodsFromParsedCode === 'function' && methods.length > 0) {
        addMethodsFromParsedCode(interfaceName, methods);
      } else if (methods.length > 0) {
        methods.forEach(method => {
          addMethod(interfaceName, method);
        });
      }
    });
    
    // Find and process classes
    const classes = [];
    let remainingCode = sourceCode;
    // Match class declarations, capturing both extends and implements
    const classStartRegex = /(?:public|protected|private)?\s*class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w\s,]+))?\s*\{/g;
    
    let classMatch;
    while ((classMatch = classStartRegex.exec(remainingCode)) !== null) {
      const startIndex = classMatch.index;
      const className = classMatch[1];
      const parentClass = classMatch[2] || null;
      const implementsList = classMatch[3] ? classMatch[3].split(',').map(name => name.trim()) : [];
      const openBraceIndex = startIndex + classMatch[0].length - 1; // Position of the opening brace
      
      // Now find the matching closing brace
      let braceCount = 1;
      let closeIndex = openBraceIndex + 1;
      
      while (braceCount > 0 && closeIndex < remainingCode.length) {
        if (remainingCode[closeIndex] === '{') braceCount++;
        if (remainingCode[closeIndex] === '}') braceCount--;
        closeIndex++;
      }
      
      if (braceCount === 0) {
        // We found the matching closing brace
        const fullClassText = remainingCode.substring(startIndex, closeIndex);
        const classBodyText = remainingCode.substring(openBraceIndex + 1, closeIndex - 1);
        
        classes.push({
          className,
          parentClass,
          implementsList,
          fullClassText,
          classBodyText
        });
        
        // For next iteration, start after this class
        classStartRegex.lastIndex = closeIndex;
      }
    }
    
    console.log(`Found ${classes.length} Java classes`);
    

    
    // Process each class found
    classes.forEach(classInfo => {
      const { className, parentClass, implementsList, fullClassText, classBodyText } = classInfo;
      
      console.log(`Processing Java class: ${className}`);
      detectedClasses.add(className);
      
      // Track implementation relationships
      if (implementsList && implementsList.length > 0) {
        implementsList.forEach(interfaceName => {
          console.log(`Class ${className} implements interface ${interfaceName}`);
          
          // Store implementation relationship
          relationships.set(`${className}-implements-${interfaceName}`, {
            type: 'implementation',
            relationA: className,
            relationB: interfaceName,
            label: 'implements'
          });
        });
      }
  
      const attributes = new Map();
      const methods = [];
  
      // Parse Fields (Attributes) - handling various field initializations
      // Capture field declarations with or without initialization
      const fieldRegex = /(?:private|protected|public)?\s+(\w+(?:<.*?>|\[\])?)(?:\s+|\s*\[\s*\]\s+)(\w+)(?:\s*=\s*(?:new\s+\w+(?:\(.*?\))?|[^;]*))?;/g;
      let fieldMatch;
      const attributesSet = new Set(); // To track unique attribute names
            
      while ((fieldMatch = fieldRegex.exec(classBodyText)) !== null) {
          // Always use the declared type from the field declaration
          const declaredType = fieldMatch[1];
          const name = fieldMatch[2];
          
          console.log(`Field detected: ${name}, type: ${declaredType}`);
          
          // Only add if not already processed
          if (!attributesSet.has(name)) {
              attributesSet.add(name);
              attributes.set(name, { type: declaredType, attribute: name });
          }
          
          // Add relationship if it's not a primitive type
          if (!PRIMITIVE_TYPES.has(declaredType)) {
              // Extract base type from generics if present (e.g. List<String> -> List)
              const baseType = declaredType.split('<')[0];
              relationships.set(`${className}-${baseType}`, {
                  type: 'composition',
                  relationA: className,
                  relationB: baseType,
                  cardinalityA: '1',
                  cardinalityB: '1',
                  label: 'Composition',
              });
          }
      }
  
      // Detect aggregation (e.g., private List<Car> cars;)
      const aggregationRegex = /(?:private|protected|public)?\s+(List|Set|Map)\s*<(\w+)>\s+(\w+);/g;
      let aggregationMatch;
  
      while ((aggregationMatch = aggregationRegex.exec(classBodyText)) !== null) {
        const collectionType = aggregationMatch[1]; // e.g., "List"
        const itemType = aggregationMatch[2];      // e.g., "Car"
        const fieldName = aggregationMatch[3];     // e.g., "cars"
  
        // Store the aggregation relationship
        relationships.set(`${className}-${itemType}`, {
          type: 'aggregation',
          relationA: className,
          relationB: itemType,
          cardinalityA: '1',       // Garage has 1 collection
          cardinalityB: 'many',    // Collection contains many items
          label: 'Aggregation',
        });
  
        // Add the field to attributes
        attributes.set(fieldName, { type: `${collectionType}<${itemType}>`, attribute: fieldName });
      }
  
      // Detect composition (e.g., this.car = new Car();)
      const instantiationRegex = /this\.(\w+)\s*=\s*new\s+(\w+)\(/g;
      let instantiationMatch;
  
      while ((instantiationMatch = instantiationRegex.exec(classBodyText)) !== null) {
        const fieldName = instantiationMatch[1];
        const instantiatedType = instantiationMatch[2];
  
        attributes.set(fieldName, { type: instantiatedType, attribute: fieldName });
  
        // Store composition relationship dynamically
        relationships.set(`${className}-${instantiatedType}`, {
          type: 'composition',
          relationA: className,
          relationB: instantiatedType,
          cardinalityA: '1',
          cardinalityB: '1',
          label: 'Composition',
        });
      }
      
      // Parse Methods - Complete pattern that should match most Java method declarations
      const methodRegex = /(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?(?:<[^>]*>\s+)?(\w+(?:<.*?>)?)\s+(\w+)\s*\(([^)]*)\)[^{]*\{/g;
      let methodMatch;
      let methodCount = 0;
      
      while ((methodMatch = methodRegex.exec(classBodyText)) !== null) {
        methodCount++;
        
        // Extract method parts (visibility, return type, name, parameters)
        const fullMatch = methodMatch[0];
        const visibility = fullMatch.trim().split(/\s+/)[0]; // first word is visibility
        const returnType = methodMatch[1];
        const methodName = methodMatch[2];
        const parameters = methodMatch[3];
        
        // Process parameters with type information if available
        const paramList = [];
        if (parameters) {
          const splitParams = parameters.split(",").map(param => param.trim());
          for (const param of splitParams) {
            if (!param) continue;
            
            // Try to parse parameter in "Type name" format
            const paramParts = param.split(/\s+/);
            if (paramParts.length >= 2) {
              // If we have "Type name" format, convert to "name: Type" format for Mermaid
              // Also standardize the type using formatType
              const paramType = formatType(paramParts[0]);
              const paramName = paramParts[1];
              paramList.push(`${paramName}: ${paramType}`);
            } else {
              paramList.push(param);
            }
          }
        }
        
        // Detect if method is a getter or setter
        let methodType = "regular";
        let propertyName = "";
        
        // Getter pattern: starts with "get", no parameters, returns non-void
        if (methodName.startsWith("get") && paramList.length === 0 && returnType !== "void") {
          methodType = "getter";
          propertyName = methodName.substring(3, 4).toLowerCase() + methodName.substring(4);
        }
        // Setter pattern: starts with "set", has exactly one parameter, usually returns void
        else if (methodName.startsWith("set") && paramList.length === 1) {
          methodType = "setter";
          propertyName = methodName.substring(3, 4).toLowerCase() + methodName.substring(4);
        }
  
        // Add method to the methods array
        const methodObj = {
          visibility,
          returnType,
          name: methodName,
          parameters: paramList,
          methodType,
          propertyName: propertyName || undefined
        };
        
        methods.push(methodObj);
      }
  
      // Debug method detection and handle issues
      if (methodCount === 0) {
        console.warn(`No methods found for ${className} with primary regex. Attempting simpler approach...`);
        
        // Look for methods with a simpler pattern
        const simpleMethodRegex = /\b(public|private|protected)\s+(\w+)\s+(\w+)\s*\(/g;
        let simpleMatch;
        
        while ((simpleMatch = simpleMethodRegex.exec(classBodyText)) !== null) {
          const visibility = simpleMatch[1];
          const returnType = simpleMatch[2];
          const methodName = simpleMatch[3];
          
          // Extract parameters (simple approach)
          const afterMatch = classBodyText.substring(simpleMatch.index + simpleMatch[0].length);
          const paramEndIndex = afterMatch.indexOf(')');
          const parameters = paramEndIndex > 0 ? afterMatch.substring(0, paramEndIndex) : '';
          
          // Process parameters with type information
          const paramList = [];
          if (parameters) {
            const splitParams = parameters.split(",").map(p => p.trim());
            for (const param of splitParams) {
              if (!param) continue;
              
              // Try to parse parameter in "Type name" format
              const paramParts = param.split(/\s+/);
              if (paramParts.length >= 2) {
                // If we have "Type name" format, convert to "name: Type" format for Mermaid
                const paramType = paramParts[0];
                const paramName = paramParts[1];
                paramList.push(`${paramName}: ${paramType}`);
              } else {
                paramList.push(param);
              }
            }
          }
          
          // Add method using simple detection
          const methodObj = {
            visibility,
            returnType,
            name: methodName,
            parameters: paramList,
            methodType: "regular"
          };
          
          // Check for getter/setter
          if (methodName.startsWith("get") && paramList.length === 0) {
            methodObj.methodType = "getter";
            methodObj.propertyName = methodName.substring(3, 4).toLowerCase() + methodName.substring(4);
          } else if (methodName.startsWith("set") && paramList.length === 1) {
            methodObj.methodType = "setter";
            methodObj.propertyName = methodName.substring(3, 4).toLowerCase() + methodName.substring(4);
            
            // Try to extract parameter type from the parameter if it exists
            if (parameters) {
              const paramParts = parameters.split(' ');
              if (paramParts.length > 1) {
                // If parameter contains type info, extract it
                methodObj.parameterType = paramParts[0];
              }
            }
          }
          
          methods.push(methodObj);
          methodCount++;
        }
      }
  
      // Add Entity to Schema
      schemaMap.set(className, {
        entity: className,
        attribute: attributes,
        methods: methods,
        parent: parentClass,
      });
  
      // IMPORTANT: Add all methods to the entity using the provided addMethod function
      if (typeof addMethodsFromParsedCode === 'function' && methods.length > 0) {
        // Use the bulk add function if available
        console.log(`Adding ${methods.length} methods to ${className} using addMethodsFromParsedCode`);
        addMethodsFromParsedCode(className, methods);
      } else if (methods.length > 0) {
        // Fall back to adding methods one by one
        methods.forEach(method => {
          addMethod(className, method);
        });
      } else {
        console.warn(`No methods to add for ${className}`);
      }
    });
    
    // If no classes were found, print a warning
    if (classes.length === 0) {
      console.warn("No classes found in source code. Check source format and regex patterns.");
    }
  };

  const processPythonCode = () => {
    console.log("Processing Python code...");
    const classRegex = /class (\w+)(?:\(([^)]+)\))?:\s*((?:.|\n)*?)(?=(?:\n\s*class|\n\s*$))/g;
    let classMatch;
    let classCount = 0;
  
    while ((classMatch = classRegex.exec(sourceCode)) !== null) {
      classCount++;
      const [_, className, parentClass, classContent] = classMatch;
      console.log(`Found Python class: ${className}`);
      
      const attributes = new Map();
      const methods = [];
  
      // Parse Attributes
      const attrRegex = /self\.(\w+)\s*(?:=|\:)/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(classContent)) !== null) {
        const name = attrMatch[1];
        // Try to infer type from code context
        const type = classContent.includes(`self.${name} = ${name}`) ? "parameter" : "Any";
        attributes.set(name, { type, attribute: name });
      }
  
      // Parse Methods
      const methodRegex = /def\s+(\w+)\s*\((self(?:,\s*[^)]*)?)\):/g;
      let methodMatch;
      while ((methodMatch = methodRegex.exec(classContent)) !== null) {
        const [_, methodName, parameters] = methodMatch;
        const paramsList = parameters.split(",")
          .map(param => param.trim())
          .filter(param => param !== 'self' && param !== '');
        
        const methodObj = {
          visibility: "public",
          returnType: "Any",
          name: methodName,
          parameters: paramsList,
          methodType: "regular"
        };
        
        // Detect Python property methods
        if (methodName === "__init__") {
          methodObj.methodType = "constructor";
        } else if (methodName.startsWith("get_")) {
          methodObj.methodType = "getter";
          methodObj.propertyName = methodName.substring(4);
        } else if (methodName.startsWith("set_")) {
          methodObj.methodType = "setter";
          methodObj.propertyName = methodName.substring(4);
        }
        
        methods.push(methodObj);
      }
  
      // Add Entity to Schema
      schemaMap.set(className, {
        entity: className,
        attribute: attributes,
        methods: methods,
        parent: parentClass
      });
      
      // IMPORTANT: Add all methods to the entity using the provided addMethod function
      if (typeof addMethodsFromParsedCode === 'function' && methods.length > 0) {
        // Use the bulk add function if available
        console.log(`Adding ${methods.length} methods to ${className} using addMethodsFromParsedCode`);
        addMethodsFromParsedCode(className, methods);
      } else if (methods.length > 0) {
        // Fall back to adding methods one by one
        methods.forEach(method => {
          addMethod(className, method);
        });
      } else {
        console.warn(`No methods to add for ${className}`);
      }
    }
    
    console.log(`Total Python classes parsed: ${classCount}`);
  };

  if (syntaxType === SYNTAX_TYPES.JAVA) {
    processJavaCode();
  } else if (syntaxType === SYNTAX_TYPES.PYTHON) {
    processPythonCode();
  } else {
    console.warn(`Unknown syntax type: ${syntaxType}`);
  }

  return schemaMap;
};

// Apply Schema Updates
export const applySchemaUpdates = (
  updatedSchema,
  schema,
  removeEntity,
  removeAttribute,
  addAttribute,
  addEntity
) => {
  console.log("Applying schema updates...");
  
  // Remove entities that no longer exist
  schema.forEach((_, entityName) => {
    if (!updatedSchema.has(entityName)) {
      removeEntity(entityName);
      console.log(`Removed Entity: ${entityName}`);
    }
  });

  // Update or add new entities
  updatedSchema.forEach((newEntity, entityName) => {
    const currentEntity = schema.get(entityName);

    if (currentEntity) {
      console.log(`Updating existing entity: ${entityName}`);
      // Update Attributes - remove ones that no longer exist
      currentEntity.attribute.forEach((_, attrName) => {
        if (!newEntity.attribute.has(attrName)) {
          removeAttribute(entityName, attrName);
          console.log(`Removed Attribute: ${attrName} from Entity: ${entityName}`);
        }
      });

      // Update or add attributes
      newEntity.attribute.forEach((newAttr, attrName) => {
        const currentAttr = currentEntity.attribute.get(attrName);
        if (newAttr.type && (!currentAttr || currentAttr.type !== newAttr.type)) {
          if (currentAttr) {
            removeAttribute(entityName, attrName);
          }
          addAttribute(entityName, attrName, '', newAttr.type);
          console.log(`Updated Attribute: ${attrName} in Entity: ${entityName}, Type: ${newAttr.type}`);
        }
      });
    } else {
      // Add New Entity
      console.log(`Adding new entity: ${entityName}`);
      addEntity(entityName);
      newEntity.attribute.forEach((newAttr, attrName) => {
        addAttribute(entityName, attrName, '', newAttr.type);
        console.log(`Added Attribute: ${attrName} to Entity: ${entityName}, Type: ${newAttr.type}`);
      });
    }
  });
  
  console.log("Schema update complete");
};