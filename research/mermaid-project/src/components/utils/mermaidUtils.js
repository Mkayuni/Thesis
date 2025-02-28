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
  let formattedType = type.replace(/\[.*\]/g, '[]');
  formattedType = formattedType.replace(/[()]+/g, '');
  return formattedType;
};


// Schema to Mermaid Source
export const schemaToMermaidSource = (schema, relationships) => {
  const schemaText = [];
  console.log("✨ Processing schema for Mermaid diagram...");
  console.log("📊 FULL SCHEMA DATA:", JSON.stringify(Array.from(schema.entries()), null, 2));

  schema.forEach((schemaItem, entityName) => {
    if (!schemaItem) {
      console.warn(`⚠️ Schema item for ${entityName} is null or undefined`);
      return;
    }

    // Debug entity structure
    console.log(`🔍 ENTITY ${entityName} STRUCTURE:`, {
      hasAttributes: schemaItem.attribute && schemaItem.attribute.size > 0,
      hasMethods: schemaItem.methods && Array.isArray(schemaItem.methods) && schemaItem.methods.length > 0,
      methodsCount: schemaItem.methods ? schemaItem.methods.length : 0,
      methodNames: schemaItem.methods ? schemaItem.methods.map(m => m.name).join(', ') : 'none'
    });

    const className = capitalizeFirstLetter(entityName);
    let classDefinition = `class ${className} {\n`;

    // Attributes
    const attributes = new Set();
    const attributeLines = [];
    if (schemaItem.attribute && schemaItem.attribute.size > 0) {
      schemaItem.attribute.forEach((attr) => {
        const attrLine = `  -${attr.attribute}: ${formatType(attr.type)}`;
        if (!attributes.has(attrLine)) {
          attributes.add(attrLine);
          attributeLines.push(attrLine);
        }
      });
    } else {
      console.log(`📝 No attributes found for ${className}`);
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
        console.log(`🏗️ Including Constructor: ${className}(${paramList})`);
    }

    // First pass to identify getter/setter pairs
    if (schemaItem.methods && Array.isArray(schemaItem.methods)) {
        // Debug log to see what methods we have
        console.log(`🔄 Processing methods for ${className}:`, schemaItem.methods);
        
        // Count method types for debugging
        const methodTypes = {
          getter: 0,
          setter: 0,
          regular: 0
        };
        
        schemaItem.methods.forEach((method) => {
            // Track method types
            if (method.methodType) {
              methodTypes[method.methodType] = (methodTypes[method.methodType] || 0) + 1;
            } else {
              methodTypes.regular = (methodTypes.regular || 0) + 1;
            }
            
            if (method.methodType === "getter" || method.methodType === "setter") {
                if (!method.propertyName) {
                    console.warn(`⚠️ Method ${method.name} has type ${method.methodType} but no propertyName`);
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
        
        // Debug log method types
        console.log(`📊 Method types in ${className}: Regular=${methodTypes.regular}, Getter=${methodTypes.getter}, Setter=${methodTypes.setter}`);
        
        // Debug log to see getter/setter properties
        console.log(`🔄 Getter/Setter properties for ${className}:`, Array.from(getterSetterProps.entries()));
    } else {
        console.warn(`⚠️ No methods array found for ${className}`);
    }

    // Add special property notation for getter/setter pairs
    getterSetterProps.forEach((propInfo, propName) => {
      let visibilitySymbol = "+"; // Default to public
      
      // Determine the most restrictive visibility
      if (propInfo.getter && propInfo.getter.visibility === "private" || 
          propInfo.setter && propInfo.setter.visibility === "private") {
          visibilitySymbol = "-";
      } else if (propInfo.getter && propInfo.getter.visibility === "protected" || 
                propInfo.setter && propInfo.setter.visibility === "protected") {
          visibilitySymbol = "#";
      }
      
      // Get the type from the getter or parameter of setter
      let propType = "";
      if (propInfo.getter) {
          propType = propInfo.getter.returnType;
      } else if (propInfo.setter && propInfo.setter.parameters.length > 0) {
          // Try to extract type from parameter
          const paramWithType = propInfo.setter.parameters[0];
          if (typeof paramWithType === 'string') {
              const paramParts = paramWithType.split(" ");
              if (paramParts.length > 1) {
                  propType = paramParts[0];
              }
          }
      }
      
      const accessors = [];
      if (propInfo.getter) accessors.push("get");
      if (propInfo.setter) accessors.push("set");
      
      // Format as a property with accessors notation
      const propertyLine = `  ${visibilitySymbol}${propName}: ${propType} [${accessors.join("/")}]`;
      console.log(`➕ Adding property line for ${propName}:`, propertyLine);
      
      if (!methods.has(propertyLine)) {
          methods.add(propertyLine);
          methodLines.push(propertyLine);
      }
    });

   
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
      const returnType = method.returnType ? `: ${method.returnType}` : ": void";
      
      const methodSignature = `  ${visibilitySymbol}${method.name}(${paramList})${returnType}`;
      console.log(`➕ Adding method signature: ${methodSignature}`);

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

    console.log(`📝 Final output for ${className}:`);
    console.log(`Attributes (${attributeLines.length}):`, schemaItem.attribute);
    console.log(`Methods (${methodLines.length}):`, schemaItem.methods);

    // Handle Inheritance
    if (schemaItem.parent) {
      const parentName = capitalizeFirstLetter(schemaItem.parent);
      schemaText.push(`${parentName} <|-- ${className}`);
      console.log(`➕ Adding Inheritance: ${parentName} <|-- ${className}`);
    }
  });

  // Handle Regular Relationships Separately
  relationships.forEach((rel) => {
    if (!rel.relationA || !rel.relationB) {
      console.warn("⚠️ Skipping relationship with missing relationA or relationB:", rel);
      return;
    }

    const relationA = capitalizeFirstLetter(rel.relationA);
    const relationB = capitalizeFirstLetter(rel.relationB);

    console.log(`➕ Adding Relationship: ${relationA} -- ${relationB} (${rel.type})`);

    if (rel.type === "inheritance") {
      schemaText.push(`${relationB} <|-- ${relationA}`);
    } else if (rel.type === "composition") {
      schemaText.push(`${relationA} *-- "${rel.cardinalityA}" ${relationB} : "${rel.label || 'Composition'}"`);
    } else if (rel.type === "aggregation") {
      schemaText.push(`${relationA} o-- "${rel.cardinalityA}" ${relationB} : "${rel.label || 'Aggregation'}"`);
    } else {
      schemaText.push(`${relationA} "${rel.cardinalityA}" -- "${rel.cardinalityB}" ${relationB} : ${rel.label || ""}`);
    }
  });

  const finalOutput = schemaText.join("\n");
  console.log("🏁 FINAL MERMAID OUTPUT:", finalOutput);
  return finalOutput;
};


// Parse Source Code into Schema Format
export const parseCodeToSchema = (sourceCode, syntaxType, addMethod, addMethodsFromParsedCode) => {
  console.log("🚀 Starting parseCodeToSchema with:");
  console.log(`- syntaxType: ${syntaxType}`);
  console.log(`- addMethod function available: ${typeof addMethod === 'function'}`);
  console.log(`- addMethodsFromParsedCode function available: ${typeof addMethodsFromParsedCode === 'function'}`);
  
  if (typeof addMethod !== 'function') {
    throw new Error("addMethod must be a function");
  }

  const schemaMap = new Map();
  const relationships = new Map();
  const detectedClasses = new Set();
  const PRIMITIVE_TYPES = new Set(["String", "int", "double", "float", "boolean", "char", "long", "short", "byte", "void"]);

  const processJavaCode = () => {
    console.log("⚙️ Processing Java code with balanced braces strategy...");
    
    // Log the first 500 characters of the source code to verify what we're working with
    console.log("📄 Source code preview:", sourceCode.substring(0, 500));
    
    // Find class declarations and extract full content with balanced braces
    const findJavaClasses = () => {
      const classes = [];
      let remainingCode = sourceCode;
      // Match class declarations
      const classStartRegex = /(?:public|protected|private)?\s*class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/g;
      
      let match;
      while ((match = classStartRegex.exec(remainingCode)) !== null) {
        const startIndex = match.index;
        const className = match[1];
        const parentClass = match[2] || null;
        const openBraceIndex = startIndex + match[0].length - 1; // Position of the opening brace
        
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
            fullClassText,
            classBodyText
          });
          
          // For next iteration, start after this class
          classStartRegex.lastIndex = closeIndex;
        }
      }
      
      return classes;
    };
    
    const javaClasses = findJavaClasses();
    console.log(`📊 Found ${javaClasses.length} Java classes using balanced braces`);
    
    // Process each class found
    javaClasses.forEach(classInfo => {
      const { className, parentClass, fullClassText, classBodyText } = classInfo;
      
      console.log(`🔍 Processing Java class: ${className}, extends: ${parentClass || 'none'}`);
      console.log(`📄 Full class length: ${fullClassText.length}, Class body length: ${classBodyText.length}`);
      detectedClasses.add(className);
  
      // Debug the class content
      console.log(`📄 First 200 chars of class body for ${className}:`);
      console.log(classBodyText.substring(0, 200) + "...");
      
      // Check if method names are present in the text
      if (classBodyText.includes("getModel") || 
          classBodyText.includes("setModel") || 
          classBodyText.includes("getEngine") || 
          classBodyText.includes("charge")) {
        console.log("✅ Method names found in content - should be detected");
      }
  
      const attributes = new Map();
      const methods = [];
      let methodCount = 0;
      let attributeCount = 0;
  
      // Parse Fields (Attributes)
      const fieldRegex = /(?:private|protected|public)?\s+(\w+(?:<.*?>)?)\s+(\w+)\s*;/g;
      let fieldMatch;
      const attributesSet = new Set(); // To track unique attribute names
            
      while ((fieldMatch = fieldRegex.exec(classBodyText)) !== null) {
          const [_, type, name] = fieldMatch;
          
          // Only add if not already processed
          if (!attributesSet.has(name)) {
              attributesSet.add(name);
              attributeCount++;
              attributes.set(name, { type, attribute: name });
              console.log(`➕ Found attribute: ${name} (type: ${type})`);
          }
        if (!PRIMITIVE_TYPES.has(type)) {
          relationships.set(`${className}-${type}`, {
            type: 'composition',
            relationA: className,
            relationB: type,
            cardinalityA: '1',
            cardinalityB: '1',
            label: 'Composition',
          });
        }
      }
      
      console.log(`📊 Total attributes found for ${className}: ${attributeCount}`);
  
      // Detect aggregation (e.g., private List<Car> cars;)
      const aggregationRegex = /(?:private|protected|public)?\s+(List|Set|Map)\s*<(\w+)>\s+(\w+);/g;
      let aggregationMatch;
  
      while ((aggregationMatch = aggregationRegex.exec(classBodyText)) !== null) {
        const collectionType = aggregationMatch[1]; // e.g., "List"
        const itemType = aggregationMatch[2];      // e.g., "Car"
        const fieldName = aggregationMatch[3];     // e.g., "cars"
  
        console.log(`🔗 Detected Aggregation in ${className}:`);
        console.log(` - Collection Type: ${collectionType}`);
        console.log(` - Item Type: ${itemType}`);
        console.log(` - Field Name: ${fieldName}`);
  
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
  
        console.log(`🔗 Detected Instantiation: ${className} → ${instantiatedType}`);
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
      
      while ((methodMatch = methodRegex.exec(classBodyText)) !== null) {
        methodCount++;
        
        // Extract method parts (visibility, return type, name, parameters)
        const fullMatch = methodMatch[0];
        const visibility = fullMatch.trim().split(/\s+/)[0]; // first word is visibility
        const returnType = methodMatch[1];
        const methodName = methodMatch[2];
        const parameters = methodMatch[3];
        
        const paramList = parameters ? parameters.split(",").map(param => param.trim()) : [];
  
        console.log(`🔎 Method match for ${methodName}:`, fullMatch);
        console.log(`📝 Parsing method: visibility=${visibility}, returnType=${returnType}, name=${methodName}, params=${parameters}`);
        
        // Detect if method is a getter or setter
        let methodType = "regular";
        let propertyName = "";
        
        // Getter pattern: starts with "get", no parameters, returns non-void
        if (methodName.startsWith("get") && paramList.length === 0 && returnType !== "void") {
          methodType = "getter";
          propertyName = methodName.substring(3, 4).toLowerCase() + methodName.substring(4);
          console.log(`🔍 Detected Getter: ${methodName} -> ${returnType} for property ${propertyName}`);
        }
        // Setter pattern: starts with "set", has exactly one parameter, usually returns void
        else if (methodName.startsWith("set") && paramList.length === 1) {
          methodType = "setter";
          propertyName = methodName.substring(3, 4).toLowerCase() + methodName.substring(4);
          console.log(`🔍 Detected Setter: ${methodName}(${paramList[0]}) for property ${propertyName}`);
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
        
        // Log each method detected for debugging
        console.log(`➕ Detected Method: ${visibility} ${returnType} ${methodName}(${paramList.join(', ')})`);
      }
  
      // Debug method detection and handle issues
      console.log(`📊 Total methods found for ${className}: ${methodCount}`);
      if (methodCount === 0) {
        console.warn(`⚠️ No methods found for ${className} with primary regex. Attempting simpler approach...`);
        
        // Look for methods with a simpler pattern
        const simpleMethodRegex = /\b(public|private|protected)\s+(\w+)\s+(\w+)\s*\(/g;
        let simpleCount = 0;
        let simpleMatch;
        
        while ((simpleMatch = simpleMethodRegex.exec(classBodyText)) !== null) {
          simpleCount++;
          console.log(`🔍 Simple method match found: ${simpleMatch[0]}`);
          
          // Try to get method details
          const visibility = simpleMatch[1];
          const returnType = simpleMatch[2];
          const methodName = simpleMatch[3];
          
          // Extract parameters (simple approach)
          const afterMatch = classBodyText.substring(simpleMatch.index + simpleMatch[0].length);
          const paramEndIndex = afterMatch.indexOf(')');
          const parameters = paramEndIndex > 0 ? afterMatch.substring(0, paramEndIndex) : '';
          const paramList = parameters ? parameters.split(',').map(p => p.trim()) : [];
          
          console.log(`📝 Simple parsing: ${visibility} ${returnType} ${methodName}(${parameters})`);
          
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
          }
          
          methods.push(methodObj);
          methodCount++;
          console.log(`➕ Added method using simple approach: ${methodName}`);
        }
        
        console.log(`📊 Simple method detection found ${simpleCount} methods`);
      }
  
      // Add Entity to Schema
      schemaMap.set(className, {
        entity: className,
        attribute: attributes,
        methods: methods,
        parent: parentClass,
      });
  
      console.log(`📋 Parsed Class: ${className}, Parent: ${parentClass || 'none'}, Methods:`, methods);
      
      // IMPORTANT: Add all methods to the entity using the provided addMethod function
      if (typeof addMethodsFromParsedCode === 'function' && methods.length > 0) {
        // Use the bulk add function if available
        console.log(`🔄 Adding ${methods.length} methods to ${className} using addMethodsFromParsedCode`);
        addMethodsFromParsedCode(className, methods);
        
        // Verify methods were added
        setTimeout(() => {
          const entity = schemaMap.get(className);
          if (entity && entity.methods) {
            console.log(`✅ After addMethodsFromParsedCode: Entity ${className} has ${entity.methods.length} methods`);
          } else {
            console.warn(`⚠️ After addMethodsFromParsedCode: Entity ${className} methods not found`);
          }
        }, 0);
      } else if (methods.length > 0) {
        // Fall back to adding methods one by one
        console.log(`🔄 Adding ${methods.length} methods to ${className} one by one using addMethod`);
        methods.forEach(method => {
          console.log(`  - Adding method ${method.name} to ${className}`);
          addMethod(className, method);
        });
      } else {
        console.warn(`⚠️ No methods to add for ${className}`);
      }
    });
    
    console.log(`📊 Total classes processed: ${javaClasses.length}`);
    
    // If no classes were found, print a warning
    if (javaClasses.length === 0) {
      console.warn("⚠️ No classes found in source code. Check source format and regex patterns.");
      // Log the source code for debugging
      console.log("📄 Full source code:");
      console.log(sourceCode);
    }
  };

  const processPythonCode = () => {
    console.log("⚙️ Processing Python code...");
    const classRegex = /class (\w+)(?:\(([^)]+)\))?:\s*((?:.|\n)*?)(?=(?:\n\s*class|\n\s*$))/g;
    let classMatch;
    let classCount = 0;
  
    while ((classMatch = classRegex.exec(sourceCode)) !== null) {
      classCount++;
      const [_, className, parentClass, classContent] = classMatch;
      console.log(`🔍 Found Python class: ${className}${parentClass ? `, inherits from: ${parentClass}` : ''}`);
      console.log(`📄 Class content length: ${classContent.length}`);
      
      const attributes = new Map();
      const methods = [];
      let methodCount = 0;
      let attributeCount = 0;
  
      // Parse Attributes
      const attrRegex = /self\.(\w+)\s*(?:=|\:)/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(classContent)) !== null) {
        attributeCount++;
        const name = attrMatch[1];
        // Try to infer type from code context
        const type = classContent.includes(`self.${name} = ${name}`) ? "parameter" : "Any";
        attributes.set(name, { type, attribute: name });
        console.log(`➕ Found attribute: ${name} (type: ${type})`);
      }
      
      console.log(`📊 Total attributes found for ${className}: ${attributeCount}`);
  
      // Parse Methods
      const methodRegex = /def\s+(\w+)\s*\((self(?:,\s*[^)]*)?)\):/g;
      let methodMatch;
      while ((methodMatch = methodRegex.exec(classContent)) !== null) {
        methodCount++;
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
        console.log(`➕ Detected Python Method: ${methodName}(${paramsList.join(', ')})`);
      }
      
      console.log(`📊 Total methods found for ${className}: ${methodCount}`);
  
      // Add Entity to Schema
      schemaMap.set(className, {
        entity: className,
        attribute: attributes,
        methods: methods,
        parent: parentClass
      });
  
      console.log(`📋 Parsed Python Class: ${className}, Methods:`, methods);
      
      // IMPORTANT: Add all methods to the entity using the provided addMethod function
      if (typeof addMethodsFromParsedCode === 'function' && methods.length > 0) {
        // Use the bulk add function if available
        console.log(`🔄 Adding ${methods.length} methods to ${className} using addMethodsFromParsedCode`);
        addMethodsFromParsedCode(className, methods);
        
        // Verify methods were added
        setTimeout(() => {
          const entity = schemaMap.get(className);
          if (entity && entity.methods) {
            console.log(`✅ After addMethodsFromParsedCode: Entity ${className} has ${entity.methods.length} methods`);
          } else {
            console.warn(`⚠️ After addMethodsFromParsedCode: Entity ${className} methods not found`);
          }
        }, 0);
      } else if (methods.length > 0) {
        // Fall back to adding methods one by one
        console.log(`🔄 Adding ${methods.length} methods to ${className} one by one using addMethod`);
        methods.forEach(method => {
          console.log(`  - Adding method ${method.name} to ${className}`);
          addMethod(className, method);
        });
      } else {
        console.warn(`⚠️ No methods to add for ${className}`);
      }
    }
    
    console.log(`📊 Total Python classes parsed: ${classCount}`);
  };

  if (syntaxType === SYNTAX_TYPES.JAVA) {
    processJavaCode();
  } else if (syntaxType === SYNTAX_TYPES.PYTHON) {
    processPythonCode();
  } else {
    console.warn(`⚠️ Unknown syntax type: ${syntaxType}`);
  }

  console.log("📋 Final Schema Map:", schemaMap);
  console.log("🔗 Detected Relationships:", relationships);
  
  // Verify data in the schema map
  schemaMap.forEach((entity, entityName) => {
    console.log(`📊 VERIFICATION - Entity: ${entityName}`);
    console.log(`  - Attributes: ${entity.attribute ? entity.attribute.size : 0}`);
    console.log(`  - Methods: ${entity.methods ? entity.methods.length : 0}`);
    if (entity.methods && entity.methods.length > 0) {
      console.log(`  - Method names: ${entity.methods.map(m => m.name).join(', ')}`);
    }
  });
  
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
  console.log("🔄 Applying schema updates...");
  
  // Remove entities that no longer exist
  schema.forEach((_, entityName) => {
    if (!updatedSchema.has(entityName)) {
      removeEntity(entityName);
      console.log(`❌ Removed Entity: ${entityName}`);
    }
  });

  // Update or add new entities
  updatedSchema.forEach((newEntity, entityName) => {
    const currentEntity = schema.get(entityName);

    if (currentEntity) {
      console.log(`🔄 Updating existing entity: ${entityName}`);
      // Update Attributes - remove ones that no longer exist
      currentEntity.attribute.forEach((_, attrName) => {
        if (!newEntity.attribute.has(attrName)) {
          removeAttribute(entityName, attrName);
          console.log(`❌ Removed Attribute: ${attrName} from Entity: ${entityName}`);
        }
      });

      // Update or add attributes
      newEntity.attribute.forEach((newAttr, attrName) => {
        const currentAttr = currentEntity.attribute.get(attrName);
        if (newAttr.type && (!currentAttr || currentAttr.type !== newAttr.type)) {
          if (currentAttr) {
            removeAttribute(entityName, attrName);
            console.log(`🔄 Replacing Attribute: ${attrName} in Entity: ${entityName}`);
          }
          addAttribute(entityName, attrName, '', newAttr.type);
          console.log(`➕ Updated Attribute: ${attrName} in Entity: ${entityName}, Type: ${newAttr.type}`);
        }
      });
    } else {
      // Add New Entity
      console.log(`➕ Adding new entity: ${entityName}`);
      addEntity(entityName);
      newEntity.attribute.forEach((newAttr, attrName) => {
        addAttribute(entityName, attrName, '', newAttr.type);
        console.log(`➕ Added Attribute: ${attrName} to Entity: ${entityName}, Type: ${newAttr.type}`);
      });
    }
  });
  
  console.log("✅ Schema update complete");
};