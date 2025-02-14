import { SYNTAX_TYPES } from '../ui/ui'; // Import SYNTAX_TYPES

// Helper function to capitalize the first letter of a string
export const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

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

// Convert schema and relationships into a Mermaid diagram source string
export const schemaToMermaidSource = (schema, relationships) => {
  let schemaText = [];
  schema.forEach((schemaItem) => {
    const entityName = capitalizeFirstLetter(schemaItem.entity);
    let item = `class ${entityName} {\n`;

    // Sort attributes (primary keys first)
    const attributes = Array.from(schemaItem.attribute.values()).sort((a, b) => {
      if ((a.key === 'PK' || a.key === 'PPK') && (b.key !== 'PK' && b.key !== 'PPK')) return -1;
      if ((b.key === 'PK' || b.key === 'PPK') && (a.key !== 'PK' && a.key !== 'PPK')) return 1;
      return 0;
    });

    // Generate attribute lines
    const attributeLines = attributes.map((attItem) => {
      const visibility = attItem.visibility === 'private' ? '-' : attItem.visibility === 'protected' ? '#' : '+';
      const formattedType = formatType(attItem.type); // Apply the formatType function here
      return `  ${visibility}${attItem.attribute}: ${formattedType}`; // Always display the type
    });

    // Generate method lines
    const methodLines = schemaItem.methods?.map((method) => {
      const visibilitySymbol = method.visibility === 'private' ? '-' : method.visibility === 'protected' ? '#' : '+';
      const staticKeyword = method.static ? 'static ' : '';
      const parameters = method.parameters ? method.parameters.join(', ') : '';
      return `  ${visibilitySymbol}${staticKeyword}${method.name}(${parameters})`;
    }) || [];

    // Add attributes to the class
    if (attributeLines.length > 0) {
      item += attributeLines.join('\n');
    } else {
      item += '  No attributes\n';
    }

    // Add methods to the class
    if (methodLines.length > 0) {
      item += '\n' + methodLines.join('\n');
    }

    item += '\n}\n';
    schemaText.push(item);
  });

  // Add relationships to the diagram
  relationships.forEach((rel) => {
    schemaText.push(`${capitalizeFirstLetter(rel.relationA)}"${rel.cardinalityA}"--"${rel.cardinalityB}"${capitalizeFirstLetter(rel.relationB)}`);
  });

  return schemaText.join('\n');
};

// Normalize type by removing unwanted characters like brackets or parentheses
const normalizeType = (type) => {
  if (!type) return ''; // Return an empty string if type is undefined
  return type.replace(/[\[\]]/g, '').trim(); // Only remove brackets, not parentheses
};

// Parse source code into a schema format
export const parseCodeToSchema = (sourceCode, syntaxType) => {
  const schemaMap = new Map();

  if (syntaxType === SYNTAX_TYPES.JAVA) {
    const classRegex = /public class (\w+) \{([^}]+)\}/g;
    const fieldRegex = /private (\w+)\s+(\w+);/g;

    let classMatch;
    while ((classMatch = classRegex.exec(sourceCode)) !== null) {
      const className = classMatch[1].toLowerCase();
      const classContent = classMatch[2];
      const attributes = new Map();

      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(classContent)) !== null) {
        const type = fieldMatch[1]; // Extract type (e.g., String, int)
        const name = fieldMatch[2]; // Extract attribute name (e.g., preferredfood, event)
        attributes.set(name, { type });
      }

      schemaMap.set(className, {
        entity: className,
        attribute: attributes,
        methods: [],
      });
    }
  } else if (syntaxType === SYNTAX_TYPES.PYTHON) {
    const classRegex = /class (\w+):\s*def __init__\(self\):\s*((?:.|\n)*?)(?=\n\S|$)/g;
    const attrRegex = /self\._(\w+)\s*:\s*(\w+)\s*=\s*None/g;

    let classMatch;
    while ((classMatch = classRegex.exec(sourceCode)) !== null) {
      const className = classMatch[1].toLowerCase();
      const initContent = classMatch[2];
      const attributes = new Map();

      let attrMatch;
      while ((attrMatch = attrRegex.exec(initContent)) !== null) {
        const name = attrMatch[1];
        const type = normalizeType(attrMatch[2]); // Normalize the type
        attributes.set(name, { type: type }); // No default type
      }

      schemaMap.set(className, {
        entity: className,
        attribute: attributes,
        methods: [],
      });
    }
  }

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