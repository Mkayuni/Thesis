import React, { useEffect, useRef, useCallback, useState } from 'react';
import mermaid from 'mermaid';
import { Box, Tooltip, IconButton, Typography, Button, Select, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import RelationshipManager from '../relationshipManager/RelationshipManager';
import { SYNTAX_TYPES } from '../ui/ui';
import Editor from '@monaco-editor/react';

// Styled components for modern UI
const DiagramBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: '#f5f5f5',
  borderRadius: '12px',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
  overflow: 'auto',
  width: '100%',
  minHeight: '400px',
  height: 'auto',
  position: 'relative',
  zIndex: 0,
  border: '1px solid #e0e0e0',
}));

const Toolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
  marginBottom: theme.spacing(2),
}));

const WorkbenchBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '60px',
  right: '20px',
  zIndex: 1000,
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
  padding: theme.spacing(2),
  width: '600px',
}));

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const normalizeEntityName = (name) => {
  return name.replace(/\s+/g, '').toLowerCase();
};

const extractEntityName = (nodeId) => {
  const parts = nodeId.split('-');
  return parts.length >= 2 ? normalizeEntityName(parts[1]) : normalizeEntityName(nodeId);
};

const MermaidDiagram = ({ schema, relationships, removeEntity, removeAttribute, addAttribute, addEntity, addRelationship, removeRelationship }) => {
  const diagramRef = useRef(null);
  const [showRelationshipManager, setShowRelationshipManager] = useState(false);
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [code, setCode] = useState('');
  const [syntax, setSyntax] = useState(SYNTAX_TYPES.JAVA);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeModified, setIsCodeModified] = useState(false);

  const removeLastAttribute = (entityName) => {
    const normalizedEntityName = normalizeEntityName(entityName);
    const entity = schema.get(normalizedEntityName);
    if (entity && entity.attribute.size > 0) {
      const lastAttribute = Array.from(entity.attribute.keys()).pop();
      if (lastAttribute) {
        removeAttribute(normalizedEntityName, lastAttribute);
      }
    } else {
      console.error(`Entity "${normalizedEntityName}" does not exist or has no attributes.`);
    }
  };

  const schemaToMermaidSource = useCallback(() => {
    let schemaText = [];
    schema.forEach((schemaItem) => {
      const entityName = capitalizeFirstLetter(schemaItem.entity);
      let item = `class ${entityName} {\n`;

      const attributes = Array.from(schemaItem.attribute.values()).sort((a, b) => {
        if ((a.key === 'PK' || a.key === 'PPK') && (b.key !== 'PK' && b.key !== 'PPK')) return -1;
        if ((b.key === 'PK' || b.key === 'PPK') && (a.key !== 'PK' && a.key !== 'PPK')) return 1;
        return 0;
      });

      const attributeLines = attributes.map((attItem) => {
        const visibility = attItem.visibility === 'private' ? '-' : attItem.visibility === 'protected' ? '#' : '+';
        return `  ${visibility}${attItem.attribute}: ${attItem.type} ${attItem.key ? `(${attItem.key})` : ''}`;
      });

      const methodLines = schemaItem.methods?.map((method) => {
        const visibilitySymbol = method.visibility === 'private' ? '-' : method.visibility === 'protected' ? '#' : '+';
        const staticKeyword = method.static ? 'static ' : '';
        const parameters = method.parameters ? method.parameters.join(', ') : '';
        return `  ${visibilitySymbol}${staticKeyword}${method.name}(${parameters})`;
      }) || [];

      if (attributeLines.length > 0) {
        item += attributeLines.join('\n');
      } else {
        item += '  No attributes\n';
      }

      if (methodLines.length > 0) {
        item += '\n' + methodLines.join('\n');
      }

      item += '\n}\n';
      schemaText.push(item);
    });

    relationships.forEach((rel) => {
      schemaText.push(`${capitalizeFirstLetter(rel.relationA)}"${rel.cardinalityA}"--"${rel.cardinalityB}"${capitalizeFirstLetter(rel.relationB)}`);
    });

    return schemaText.join('\n');
  }, [schema, relationships]);

  const renderDiagram = useCallback(() => {
    const source = `classDiagram\n${schemaToMermaidSource()}`;
    console.log('Mermaid source:', source);

    mermaid.mermaidAPI.initialize({ startOnLoad: false });
    mermaid.mermaidAPI.render('umlDiagram', source, (svgGraph) => {
      const diagramElement = diagramRef.current;
      if (diagramElement) {
        diagramElement.innerHTML = svgGraph;
        const svg = diagramElement.querySelector('svg');

        if (svg) {
          svg.style.overflow = 'visible';
          svg.setAttribute('viewBox', `-20 -20 ${svg.getBBox().width + 40} ${svg.getBBox().height + 40}`);
          svg.style.padding = '20px';

          const nodes = svg.querySelectorAll('g[class^="node"]');
          nodes.forEach((node) => {
            const nodeId = node.getAttribute('id');
            if (nodeId) {
              const entityName = extractEntityName(nodeId);
              const bbox = node.getBBox();

              const iconsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              iconsGroup.classList.add('icons-group');

              const editButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              editButton.setAttribute('x', bbox.x + bbox.width + 15);
              editButton.setAttribute('y', bbox.y + 15);
              editButton.setAttribute('fill', '#007bff');
              editButton.style.cursor = 'pointer';
              editButton.style.display = 'block';
              editButton.textContent = '✏️';

              const deleteButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              deleteButton.setAttribute('x', bbox.x + bbox.width + 15);
              deleteButton.setAttribute('y', bbox.y + 35);
              deleteButton.setAttribute('fill', '#ff4d4d');
              deleteButton.style.cursor = 'pointer';
              deleteButton.style.display = 'none';
              deleteButton.textContent = '🗑️';
              deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const entityName = extractEntityName(nodeId);
                if (schema.has(entityName)) {
                  removeEntity(entityName);
                }
              });

              const minusButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              minusButton.setAttribute('x', bbox.x + bbox.width + 15);
              minusButton.setAttribute('y', bbox.y + 55);
              minusButton.setAttribute('fill', '#4caf50');
              minusButton.style.cursor = 'pointer';
              minusButton.style.display = 'none';
              minusButton.textContent = '➖';
              minusButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const entityName = extractEntityName(nodeId);
                removeLastAttribute(entityName);
              });

              const relationshipButton = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              relationshipButton.setAttribute('x', bbox.x + bbox.width + 15);
              relationshipButton.setAttribute('y', bbox.y + 75);
              relationshipButton.setAttribute('fill', '#ff9800');
              relationshipButton.style.cursor = 'pointer';
              relationshipButton.style.display = 'none';
              relationshipButton.textContent = '🔗';
              relationshipButton.addEventListener('click', (e) => {
                e.stopPropagation();
                setShowRelationshipManager(true);
              });

              editButton.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteButton.style.display = deleteButton.style.display === 'none' ? 'block' : 'none';
                minusButton.style.display = minusButton.style.display === 'none' ? 'block' : 'none';
                relationshipButton.style.display = relationshipButton.style.display === 'none' ? 'block' : 'none';
              });

              iconsGroup.appendChild(editButton);
              iconsGroup.appendChild(deleteButton);
              iconsGroup.appendChild(minusButton);
              iconsGroup.appendChild(relationshipButton);
              node.appendChild(iconsGroup);
            }
          });
        }
      }
    });
  }, [schemaToMermaidSource, removeEntity, schema, removeLastAttribute]);

  useEffect(() => {
    if (schema.size !== 0) {
      renderDiagram();
    }
  }, [schema, relationships, renderDiagram]);

  const handleGenerate = () => {
    const mermaidSource = schemaToMermaidSource();
    const generated = parseMermaidToCode(mermaidSource, syntax);
    setGeneratedCode(generated);
    setCode(generated); // Update Monaco Editor with generated code
  };

  const handleUpdate = () => {
    const updatedSchema = parseCodeToSchema(code, syntax);
    applySchemaUpdates(updatedSchema);
    setIsCodeModified(false); // Reset modification flag
    renderDiagram(); // Re-render the diagram
  };

  const parseCodeToSchema = (sourceCode, syntaxType) => {
    const schemaMap = new Map();

    if (syntaxType === SYNTAX_TYPES.JAVA) {
      const classRegex = /public class (\w+) \{([^}]+)\}/g;
      const fieldRegex = /private (\w+) (\w+);/g;

      let classMatch;
      while ((classMatch = classRegex.exec(sourceCode)) !== null) {
        const className = classMatch[1].toLowerCase();
        const classContent = classMatch[2];
        const attributes = new Map();

        let fieldMatch;
        while ((fieldMatch = fieldRegex.exec(classContent)) !== null) {
          const type = fieldMatch[1];
          const name = fieldMatch[2];
          attributes.set(name, { type });
        }

        schemaMap.set(className, {
          entity: className,
          attribute: attributes,
          methods: [],
        });
      }
    } else {
      const classRegex = /class (\w+):\s*def __init__\(self\):\s*((?:.|\n)*?)(?=\n\S|$)/g;
      const attrRegex = /self\._(\w+): (\w+) = None/g;

      let classMatch;
      while ((classMatch = classRegex.exec(sourceCode)) !== null) {
        const className = classMatch[1].toLowerCase();
        const initContent = classMatch[2];
        const attributes = new Map();

        let attrMatch;
        while ((attrMatch = attrRegex.exec(initContent)) !== null) {
          const name = attrMatch[1];
          const type = attrMatch[2];
          attributes.set(name, { type });
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

  const applySchemaUpdates = (updatedSchema) => {
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
          if (!currentAttr || currentAttr.type !== newAttr.type) {
            if (currentAttr) removeAttribute(entityName, attrName);
            addAttribute(entityName, attrName, currentAttr?.key || '', newAttr.type);
          }
        });
      } else {
        // Add new entity
        addEntity(entityName);
        newEntity.attribute.forEach((newAttr, attrName) => {
          addAttribute(entityName, attrName, '', newAttr.type);
        });
      }
    });
  };

  const parseMermaidToCode = (mermaidSource, syntax) => {
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
      const commentSymbol = syntax === SYNTAX_TYPES.PYTHON ? "#" : "//";
      code += `${commentSymbol} Relationship: ${classA} "${cardinalityA}" -- "${cardinalityB}" ${classB}\n`;
    }

    return code.trim();
  };

  const generateClassCode = (className, classContent, syntax) => {
    const attributeRegex = /(?:\s*[-+#]?\s*)(\w+)\s*:\s*([\w<>]*)?/g;
    let attributes = [];
    let match;

    while ((match = attributeRegex.exec(classContent)) !== null) {
      let [, attributeName, attributeType] = match;

      // Assign default types if missing
      if (!attributeType || attributeType.trim() === '') {
        attributeType = syntax === SYNTAX_TYPES.JAVA ? 'Object' : 'Any';
      }

      attributes.push({ name: attributeName, type: attributeType });
    }

    return syntax === SYNTAX_TYPES.JAVA
      ? generateJavaClass(className, attributes)
      : generatePythonClass(className, attributes);
  };

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

  return (
    <Box>
      <Toolbar>
        <Typography variant="h6" color="primary">
          WorkBench
        </Typography>
        <Box>
          <Tooltip title="Add Relationship">
            <IconButton color="primary" onClick={() => setShowRelationshipManager(true)}>
              🔗
            </IconButton>
          </Tooltip>
          <Tooltip title="Open WorkBench">
            <IconButton color="primary" onClick={() => setShowWorkbench(true)}>
              🛠️
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      <DiagramBox ref={diagramRef} id="diagram" />
      {showRelationshipManager && (
        <Box
          sx={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            zIndex: 1000,
          }}
        >
          <RelationshipManager
            schema={schema}
            relationships={relationships}
            addRelationship={addRelationship}
            removeRelationship={removeRelationship}
            onClose={() => setShowRelationshipManager(false)}
          />
        </Box>
      )}
      {showWorkbench && (
        <WorkbenchBox>
        <Typography variant="h6" gutterBottom>
          WorkBench
        </Typography>
        <Select
          value={syntax}
          onChange={(e) => setSyntax(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        >
          <MenuItem value={SYNTAX_TYPES.JAVA}>Java</MenuItem>
          <MenuItem value={SYNTAX_TYPES.PYTHON}>Python</MenuItem>
        </Select>
        <Editor
          height="300px"
          language={syntax === SYNTAX_TYPES.JAVA ? 'java' : 'python'}
          theme="vs-light"
          value={code}
          onChange={(value) => {
            setCode(value);
            setIsCodeModified(true); // Enable the Update button when code is modified
          }}
          options={{
            automaticLayout: true,
            padding: { top: 10, bottom: 10 },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerate}
          sx={{ mr: 2, mt: 2 }}
        >
          Generate
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleUpdate}
          disabled={!isCodeModified}
          sx={{ mt: 2, mr: 2 }}
        >
          Update
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => setShowWorkbench(false)}
          sx={{ mt: 2 }}
        >
          Close
        </Button>
        {generatedCode && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {generatedCode}
            </Typography>
          </Box>
        )}
      </WorkbenchBox>
      )}
    </Box>
  );
};

export default MermaidDiagram;