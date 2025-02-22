import { SYNTAX_TYPES } from '../ui/ui'; // Import SYNTAX_TYPES


// Helper function to capitalize the first letter of a string
export const capitalizeFirstLetter = (string) => {
  if (typeof string !== 'string' || !string) {
    console.error('Invalid input to capitalizeFirstLetter:', string);
    return ''; // Return an empty string or handle the error as needed
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Helper function to normalize entity names (remove spaces and convert to lowercase)
export const normalizeEntityName = (name) => {
  return name.replace(/\s+/g, '').toLowerCase();
};

// Helper function to extract entity names from node IDs
export const extractEntityName = (nodeId) => {
  const parts = nodeId.split('-');
  return parts.length >= 2 ? normalizeEntityName(parts[1]) : normalizeEntityName(nodeId);
};

// Helper function to clean up type formatting
const formatType = (type) => {
  if (!type) return ''; // Return an empty string if type is undefined
  let formattedType = type.replace(/\[.*\]/g, '[]'); // Replace any array notation (e.g. [string]) with []
  formattedType = formattedType.replace(/[()]+/g, ''); // Remove unnecessary parentheses
  return formattedType;
};

//Schema to MermaidSource
  export const schemaToMermaidSource = (schema, relationships) => {
    let schemaText = [];

    schema.forEach((schemaItem, entityName) => {
      const className = capitalizeFirstLetter(entityName);

      // Skip empty classes (no attributes and no methods)
      if (
        (!schemaItem.attribute || schemaItem.attribute.size === 0) &&
        (!schemaItem.methods || schemaItem.methods.length === 0)
      ) {
        return; // Skip this class
      }

      let classDefinition = `class ${className} {\n`;

      // Attributes
      const attributeLines = [];
      if (schemaItem.attribute && schemaItem.attribute.size > 0) {
        schemaItem.attribute.forEach((attr) => {
          const visibility = attr.visibility === 'private' ? '-' : attr.visibility === 'protected' ? '#' : '+';
          attributeLines.push(`  ${visibility}${attr.attribute}: ${attr.type}`);
        });
      }

      // Methods
      const methodLines = [];
      if (schemaItem.methods && schemaItem.methods.length > 0) {
        schemaItem.methods.forEach((method) => {
          const visibilitySymbol = method.visibility === 'private' ? '-' : method.visibility === 'protected' ? '#' : '+';
          const paramList = method.parameters.map((param) => `${param}`).join(', ');
          const returnType = method.returnType ? `: ${method.returnType}` : ': void';
          methodLines.push(`  ${visibilitySymbol}${method.name}(${paramList})${returnType}`);
        });
      }

      // Combine attributes and methods into the class definition
      if (attributeLines.length > 0) {
        classDefinition += attributeLines.join('\n') + '\n';
      }
      if (methodLines.length > 0) {
        if (attributeLines.length > 0) {
          classDefinition += '\n'; // Add a newline between attributes and methods if both exist
        }
        classDefinition += methodLines.join('\n') + '\n';
      }

      classDefinition += `}\n`;
      schemaText.push(classDefinition);

      // Handle Inheritance Relationships Properly
      if (schemaItem.parent) {
        const parentName = capitalizeFirstLetter(schemaItem.parent);
        schemaText.push(`${parentName} <|-- ${className}`); // Correct Mermaid Inheritance Syntax
      }
    });

    // Handle Regular Relationships Separately
    relationships.forEach((rel) => {
      const relationA = capitalizeFirstLetter(rel.relationA);
      const relationB = capitalizeFirstLetter(rel.relationB);

      if (rel.type === 'inheritance') {
        schemaText.push(`${relationB} <|-- ${relationA}`);
      } else if (rel.type === 'composition') {
        schemaText.push(
          `${relationA} *-- "${rel.cardinalityA}" ${relationB} : "◆ ${rel.label || 'Composition'}"`
        );
      } else if (rel.type === 'aggregation') {
        schemaText.push(
          `${relationA} o-- "${rel.cardinalityA}" ${relationB} : "◇ ${rel.label || 'Aggregation'}"`
        );
      } else {
        schemaText.push(
          `${relationA} "${rel.cardinalityA}" -- "${rel.cardinalityB}" ${relationB} : ${rel.label || ''}`
        );
      }
    });

    console.log("Final Mermaid Source:\n", schemaText.join('\n'));
    return schemaText.join('\n');
  };

  // Normalize type by removing unwanted characters like brackets or parentheses
  const normalizeType = (type) => {
    if (!type) return ''; // Return an empty string if type is undefined
    return type.replace(/[\[\]]/g, '').trim(); // Only remove brackets, not parentheses
  };


// Parse source code into a schema format
export const parseCodeToSchema = (sourceCode, syntaxType, addMethod) => {
  if (typeof addMethod !== 'function') {
    throw new Error("addMethod must be a function");
  }

  const schemaMap = new Map();
  const relationships = new Map(); // Stores relationships

  if (syntaxType === SYNTAX_TYPES.JAVA) {
    // Regex to capture class definitions with inheritance
    const classRegex = /(?:public|protected|private)?\s*class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{([\s\S]*?)\}/g;

    let classMatch;
    while ((classMatch = classRegex.exec(sourceCode)) !== null) {
      const className = classMatch[1];
      const parentClass = classMatch[2] || null; // Capture the parent class if exists
      const classContent = classMatch[3];
      console.log(`Processing class: ${className}, Parent: ${parentClass || 'None'}`); // Log class name and parent

      const attributes = new Map();
      const methods = [];
      const methodNames = new Set();

      // Parse fields (attributes)
      const fieldRegex = /(?:private|protected|public)?\s+(\w+)\s+(\w+);/g;
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(classContent)) !== null) {
        const type = fieldMatch[1];
        const name = fieldMatch[2];
        console.log(`Found attribute: ${name} (${type})`);
        attributes.set(name, { type });


        // Detect composition (e.g., private Engine engine;)
        if (type !== 'List' && type !== 'Set' && type !== 'Map') {
          relationships.set(`${className}-${type}`, {
            type: 'composition',
            relationA: className,
            relationB: type,
            cardinalityA: '1', // Set cardinality for composition
            cardinalityB: '1', // Set cardinality for composition
            label: 'Composition',
          });
          console.log(`Detected Composition: ${className} *-- ${type}`);
        }

        // Detect aggregation (e.g., private List courses;)
        const aggregationRegex = /(?:private|protected|public)?\s+(List|Set|Map)\s+(\w+);/g;
        let aggregationMatch;
        while ((aggregationMatch = aggregationRegex.exec(classContent)) !== null) {
          const itemType = aggregationMatch[2];
          relationships.set(`${className}-${itemType}`, {
            type: 'aggregation',
            relationA: className,
            relationB: itemType,
            cardinalityA: '1', // Set cardinality for aggregation
            cardinalityB: 'many', // Set cardinality for aggregation
            label: 'Aggregation',
          });
          console.log(`Detected Aggregation: ${className} o-- ${itemType}`);
        }

        // Generate getters and setters automatically
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        const getterName = `get${capitalizedName}`;
        const setterName = `set${capitalizedName}`;

        // Add getter only if it doesn't already exist
        if (!methodNames.has(getterName)) {
          console.log(`Adding getter: ${getterName}`); // Log getter
          methods.push({
            visibility: 'public',
            returnType: type,
            name: getterName,
            parameters: [],
          });
          methodNames.add(getterName);
        }

        // Add setter only if it doesn't already exist
        if (!methodNames.has(setterName)) {
          console.log(`Adding setter: ${setterName}`); // Log setter
          methods.push({
            visibility: 'public',
            returnType: 'void',
            name: setterName,
            parameters: [`${name}: ${type}`], // Format parameter as "name: type"
          });
          methodNames.add(setterName);
        }
      }

      // Parse all methods (including inferred methods)
      const methodRegex = /(public|private|protected)?\s+(\w+)\s+(\w+)\(([^)]*)\)\s*\{/g;
      let methodMatch;
      while ((methodMatch = methodRegex.exec(classContent)) !== null) {
        const visibility = methodMatch[1] || 'public'; // Default to public if no visibility
        const returnType = methodMatch[2];
        const methodName = methodMatch[3];
        const parameters = methodMatch[4]
          ? methodMatch[4]
              .replace(/\)/g, '')
              .split(',')
              .map((param) => {
                // Split parameter into name and type
                const [type, name] = param.trim().split(/\s+/);
                return `${name}: ${type}`; // Format parameter as "name: type"
              })
          : [];

        // Skip constructors (methods with the same name as the class)
        if (methodName.toLowerCase() === className.toLowerCase()) {
          console.log(`Skipping constructor: ${methodName}`); // Log skipped constructor
          continue;
        }

        console.log(`Found method: ${methodName} (${visibility}, ${returnType})`); // Log method
        console.log(`Method parameters: ${parameters}`); // Log parameters

        // Add method only if it doesn't already exist
        if (!methodNames.has(methodName)) {
          methods.push({
            visibility,
            returnType,
            name: methodName,
            parameters,
          });
          methodNames.add(methodName);
        }
      }

      // Add the entity to the schema
      schemaMap.set(className, {
        entity: className,
        attribute: attributes,
        methods: methods,
        parent: parentClass, // Add parent class to the schema
      });

      // Call addMethod for each method
      methods.forEach((method) => {
        addMethod(className, method);
      });

      console.log("Parsed Class:", className, "Methods:", methods, "Parent:", parentClass); // Log parsed class
    }
  } else if (syntaxType === SYNTAX_TYPES.PYTHON) {
    // Python parsing logic remains unchanged for now
    const classRegex = /class (\w+):\s*((?:.|\n)*?)(?=\n\S|$)/g;
    const attrRegex = /self\.(\w+)\s*:\s*(\w+)/g;
    const methodRegex = /def (\w+)\((self,?[^)]*)\):/g;

    let classMatch;
    while ((classMatch = classRegex.exec(sourceCode)) !== null) {
      const className = classMatch[1].toLowerCase();
      const classContent = classMatch[2];
      const attributes = new Map();
      const methods = []; // Initialize methods array

      // Parse attributes
      let attrMatch;
      while ((attrMatch = attrRegex.exec(classContent)) !== null) {
        const name = attrMatch[1];
        const type = attrMatch[2];
        attributes.set(name, { type });
      }

      // Parse methods
      let methodMatch;
      while ((methodMatch = methodRegex.exec(classContent)) !== null) {
        const methodName = methodMatch[1];
        const parameters = methodMatch[2].split(',').map(param => param.trim()).slice(1); // Remove 'self'
        methods.push({ visibility: "public", returnType: "", name: methodName, parameters });
      }

      // Add the entity to the schema
      schemaMap.set(className, {
        entity: className,
        attribute: attributes,
        methods: methods, // Ensure methods is always defined
      });

      // Call addMethod for each method
      methods.forEach((method) => {
        addMethod(className, method);
      });
    }
  }

  // Log the final schema map for debugging
  console.log("Final schema map:", schemaMap);
  return schemaMap;
};

// Apply updates to the schema based on changes
export const applySchemaUpdates = (
  updatedSchema,
  schema,
  removeEntity,
  removeAttribute,
  addAttribute,
  addEntity
) => {
  // Remove entities not present in updated schema
  schema.forEach((_, entityName) => {
    if (!updatedSchema.has(entityName)) {
      removeEntity(entityName);
    }
  });

  // Update existing or add new entities
  updatedSchema.forEach((newEntity, entityName) => {
    const currentEntity = schema.get(entityName);
    if (currentEntity) {
      // Update attributes
      currentEntity.attribute.forEach((_, attrName) => {
        if (!newEntity.attribute.has(attrName)) {
          removeAttribute(entityName, attrName);
        }
      });

      newEntity.attribute.forEach((newAttr, attrName) => {
        const currentAttr = currentEntity.attribute.get(attrName);

        // Only update the attribute if the type has changed and is not empty
        if (newAttr.type && (!currentAttr || currentAttr.type !== newAttr.type)) {
          if (currentAttr) {
            removeAttribute(entityName, attrName);
          }
          console.log(`Updating Attribute: ${attrName} in Entity: ${entityName}, New Type: ${newAttr.type}`);
          addAttribute(entityName, attrName, currentAttr?.key || '', newAttr.type);
        } else if (!newAttr.type && currentAttr) {
          console.warn(`Type is empty for Attribute: ${attrName} in Entity: ${entityName}`);
        }
      });
    } else {
      // Add new entity
      addEntity(entityName);
      newEntity.attribute.forEach((newAttr, attrName) => {
        console.log(`Adding Attribute: ${attrName} to Entity: ${entityName}, Type: ${newAttr.type}`);
        addAttribute(entityName, attrName, '', newAttr.type);
      });
    }
  });
};

// Parse Mermaid diagram source into code
export const parseMermaidToCode = (mermaidSource, syntax) => {
  const classRegex = /class\s+(\w+)\s*\{([^}]*)\}/g;
  const relationshipRegex = /(\w+)"([^"]+)"--"([^"]+)"(\w+)/g;
  let code = '';
  let match;

  // Generate code for each class
  while ((match = classRegex.exec(mermaidSource)) !== null) {
    const [, className, classContent] = match;
    code += generateClassCode(className, classContent, syntax) + '\n\n';
  }

  // Add relationship comments
  while ((match = relationshipRegex.exec(mermaidSource)) !== null) {
    const [, classA, cardinalityA, cardinalityB, classB] = match;
    const commentSymbol = syntax === SYNTAX_TYPES.PYTHON ? "#" : "//";
    code += `${commentSymbol} Relationship: ${classA} "${cardinalityA}" -- "${cardinalityB}" ${classB}\n`;
  }

  return code.trim();
};

// Generate class code based on syntax (Java or Python)
export const generateClassCode = (className, classContent, syntax) => {
  const attributeRegex = /(?:\s*[-+#]?\s*)(\w+)\s*:\s*([\w<>()]*)?/g; // Allow parentheses and brackets in type
  let attributes = [];
  let match;

  // Extract attributes from class content
  while ((match = attributeRegex.exec(classContent)) !== null) {
    let [, attributeName, attributeType] = match;
    // Normalize the type (no default type)
    attributeType = normalizeType(attributeType);
    attributes.push({ name: attributeName, type: attributeType });
  }

  // Generate Java or Python class code
  return syntax === SYNTAX_TYPES.JAVA
    ? generateJavaClass(className, attributes)
    : generatePythonClass(className, attributes);
};

// Generate Java class code
const generateJavaClass = (className, attributes) => {
  let code = `public class ${className} {\n`;
  if (attributes.length === 0) {
    code += "    // No attributes\n";
  }
  // Generate fields
  attributes.forEach(({ name, type }) => {
    code += `    private ${type} ${name};\n`;
  });
  // Generate getters and setters
  attributes.forEach(({ name, type }) => {
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    code += `
    public ${type} get${capitalizedName}() {
        return this.${name};
    }
    public void set${capitalizedName}(${type} ${name}) {
        this.${name} = ${name};
    }\n`;
  });
  code += '}';
  return code;
};

// Generate Python class code
const generatePythonClass = (className, attributes) => {
  let code = `class ${className}:\n`;
  if (attributes.length === 0) {
    code += "    # No attributes\n";
    return code;
  }
  // Generate __init__ method
  code += "    def __init__(self):\n";
  attributes.forEach(({ name }) => {
    code += `        self._${name} = None\n`;
  });
  // Generate properties (getters and setters)
  attributes.forEach(({ name }) => {
    code += `
    @property
    def ${name}(self):
        return self._${name}
    @${name}.setter
    def ${name}(self, value):
        self._${name} = value\n`;
  });
  return code;
};