import React, { useEffect, useState, useRef } from 'react';
import {
  Typography,
  TextField,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Box,
  Menu,
  MenuItem,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyIcon from '@mui/icons-material/VpnKey';
import CategoryIcon from '@mui/icons-material/Category';
import RelationshipManager from './relationshipManager/RelationshipManager';
import { usePopup } from './utils/usePopup';
import Popup from './utils/Popup';

const DrawerContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#ffffff',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  flex: 1,
  overflow: 'hidden',
  borderLeft: '2px solid #ddd',
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  overflow: 'auto',
  flex: 1,
}));

const AccordionSummaryStyled = styled(AccordionSummary)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  '&.Mui-expanded': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));

const PopupContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  padding: theme.spacing(2),
  backgroundColor: '#bbbbbb',
  color: '#000000',
  border: '1px solid #ccc',
  boxShadow: theme.shadows[5],
  zIndex: 1000,
  maxHeight: '80vh',
  overflowY: 'auto',
  width: 'fit-content',
}));

const ControlsComponent = ({
  setQuestionMarkdown,
  schema,
  setSchema,
  questions,
  expandedPanel,
  setExpandedPanel,
  removeEntity,
  removeAttribute,
  relationships,
  removeRelationship,
  updateAttributeKey,
  controlsRef,
  addEntity,
  addAttribute,
  addRelationship,
  editRelationship,
  onQuestionClick,
  hidePopup,
  setRelationships,
  addMethod,
  removeMethod,
}) => {
  const [showTextBox, setShowTextBox] = useState(false);
  const [tempQuestion, setTempQuestion] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(false);

  const [typeAnchorEl, setTypeAnchorEl] = useState(null);
  const [selectedTypeEntity, setSelectedTypeEntity] = useState(null);
  const [selectedTypeAttribute, setSelectedTypeAttribute] = useState(null);

  const [methodToAssign, setMethodToAssign] = useState(null);
  const [entitySelectPopupOpen, setEntitySelectPopupOpen] = useState(false);

  const [visibility, setVisibility] = useState('public');
  const [returnType, setReturnType] = useState('void');
  const [isStatic, setIsStatic] = useState(false); // Add state for Static

  const [availableMethods, setAvailableMethods] = useState([]); // New state to hold fetched methods

  const {
    popup,
    subPopup,
    entityPopupRef,
    subPopupRef,
    handleClickOutside,
    showPopup: showPopupMethod,
    hidePopup: hidePopupMethod,
    showSubPopup,
  } = usePopup();

  const questionContainerRef = useRef(null);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    // Fetch available methods from the backend
    fetch('http://127.0.0.1:5000/api/question/Fish%20Store/methods')
      .then((response) => response.json())
      .then((data) => setAvailableMethods(data.methods || []))
      .catch((error) => console.error('Error fetching methods:', error));
  }, []);

  // Function to parse method strings into method name and parameters
  const parseMethodSignature = (signature) => {
    const methodNameMatch = signature.match(/^([a-zA-Z0-9_]+)\(/);
    const paramsMatch = signature.match(/\(([^)]*)\)/);

    const methodName = methodNameMatch ? methodNameMatch[1] : signature; // Extract method name
    const parameters = paramsMatch ? paramsMatch[1].split(',').map(param => param.trim()) : []; // Extract parameters

    return { methodName, parameters };
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const handleQuestionSubmit = () => {
    setQuestionMarkdown(tempQuestion);
    setShowTextBox(false);
  };

  const handleKeyMenuClick = (event, entity, attribute) => {
    setAnchorEl(event.currentTarget);
    setSelectedEntity(entity);
    setSelectedAttribute(attribute);
  };

  const handleKeyMenuClose = (key) => {
    setAnchorEl(null);
    if (selectedEntity && selectedAttribute) {
      updateAttributeKey(selectedEntity, selectedAttribute, key);
    }
    setSelectedEntity(null);
    setSelectedAttribute(null);
  };

  const handleTypeMenuClick = (event, entity, attribute) => {
    setTypeAnchorEl(event.currentTarget);
    setSelectedTypeEntity(entity);
    setSelectedTypeAttribute(attribute);
  };

  const handleTypeMenuClose = (type) => {
    setTypeAnchorEl(null);
    if (selectedTypeEntity && selectedTypeAttribute) {
      setSchema((prevSchema) => {
        const newSchema = new Map(prevSchema);
        const entityData = newSchema.get(selectedTypeEntity);
        if (entityData) {
          const updatedAttributes = new Map(entityData.attribute);
          if (updatedAttributes.has(selectedTypeAttribute)) {
            const attributeData = updatedAttributes.get(selectedTypeAttribute);
            attributeData.type = type;
            updatedAttributes.set(selectedTypeAttribute, attributeData);
          }
          entityData.attribute = updatedAttributes;
          newSchema.set(selectedTypeEntity, entityData);
        }
        return newSchema;
      });
    }
    setSelectedTypeEntity(null);
    setSelectedTypeAttribute(null);
  };

  const handleQuestionsAccordionChange = () => {
    setExpandedQuestions(!expandedQuestions);
  };

  const handleAddEntity = (entityName) => {
    addEntity(entityName);
    hidePopup();
  };

  const handleAddAttribute = (entityName, attribute, key = '') => {
    addAttribute(entityName, attribute, key);
    hidePopup();
  };

  const handleRemoveMethod = (entity, methodName) => {
    removeMethod(entity, methodName);
  };

  const handleQuestionClick = (question) => {
    onQuestionClick(question);
    setSchema(new Map());
    setRelationships(new Map());
  };

  const handleMethodLinkClick = () => {
    setEntitySelectPopupOpen(true);
  };

  const handleAddMethodToEntity = (entity) => {
    if (methodToAssign) {
      const methodDetails = {
        name: methodToAssign,
        returnType,
        parameters: '',
        visibility,
        static: isStatic, // Include static value from checkbox
      };
      addMethod(entity, methodDetails);
      setMethodToAssign(null);
      setEntitySelectPopupOpen(false);
    }
  };

  return (
    <DrawerContainer ref={controlsRef}>
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Controls
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ marginLeft: 'auto' }}
          onClick={() => setShowTextBox(!showTextBox)}
        >
          {showTextBox ? 'Hide' : 'Add UML Question'}
        </Button>
      </Box>
      {showTextBox && (
        <Box sx={{ marginBottom: '24px' }}>
          <TextField
            placeholder="Enter UML question here"
            value={tempQuestion}
            onChange={(e) => setTempQuestion(e.target.value)}
            multiline
            rows={4}
            fullWidth
          />
          <Button
            variant="contained"
            color="primary"
            sx={{ marginTop: '8px' }}
            onClick={handleQuestionSubmit}
          >
            Submit
          </Button>
        </Box>
      )}
      <ContentContainer>
        <Accordion expanded={expandedQuestions} onChange={handleQuestionsAccordionChange}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ marginBottom: '8px' }}>
              Questions
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                padding: '16px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                marginTop: '16px',
              }}
            >
              {questions.map((question, index) => (
                <Button
                  key={index}
                  onClick={() => handleQuestionClick(question)}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', marginBottom: '8px' }}
                >
                  {question}
                </Button>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
        <Divider />
        <Accordion
          expanded={expandedPanel === 'entities-panel'}
          onChange={handleAccordionChange('entities-panel')}
          disableGutters
          TransitionProps={{ unmountOnExit: true }}
        >
          <AccordionSummaryStyled
            expandIcon={<ExpandMoreIcon />}
            aria-controls="entities-content"
            id="entities-header"
          >
            <Typography>Manage Entities and Methods</Typography>
          </AccordionSummaryStyled>
          <AccordionDetails sx={{ backgroundColor: '#e0f7fa' }}>
            {Array.from(schema.entries()).map(([entity, { attribute, methods }]) => (
              <Box key={entity} sx={{ marginBottom: '16px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {entity}
                  </Typography>
                  <IconButton onClick={() => removeEntity(entity)} size="small" sx={{ color: 'red' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                {Array.from(attribute.entries()).map(([attr, { key, type }]) => (
                  <Box
                    key={attr}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <Typography variant="body1" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {attr} {key && <span>({key})</span>} {type && <span>[{type}]</span>}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={(event) => handleKeyMenuClick(event, entity, attr)}
                        size="small"
                        sx={{ color: 'green' }}
                      >
                        <KeyIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={(event) => handleTypeMenuClick(event, entity, attr)}
                        size="small"
                        sx={{ color: 'purple' }}
                      >
                        <CategoryIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => removeAttribute(entity, attr)} size="small" sx={{ color: 'blue' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
                {methods && methods.length > 0 && (
                  <Box sx={{ marginTop: '16px' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Methods:
                    </Typography>
                    {methods.map((method) => (
                      <Box
                        key={method.name}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {method.name}({(Array.isArray(method.parameters) ? method.parameters.join(', ') : 'No parameters')}) :{' '}
                          {method.returnType}
                        </Typography>
                        <IconButton onClick={() => handleRemoveMethod(entity, method.name)} size="small" sx={{ color: 'blue' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expandedPanel === 'relationships-panel'}
          onChange={handleAccordionChange('relationships-panel')}
          disableGutters
          TransitionProps={{ unmountOnExit: true }}
        >
          <AccordionSummaryStyled
            expandIcon={<ExpandMoreIcon />}
            aria-controls="relationships-content"
            id="relationships-header"
          >
            <Typography>Manage Relationships</Typography>
          </AccordionSummaryStyled>
          <AccordionDetails sx={{ backgroundColor: '#f1f8e9' }}>
            <RelationshipManager
              schema={schema}
              relationships={relationships}
              addRelationship={addRelationship}
              editRelationship={editRelationship}
              removeRelationship={removeRelationship}
            />
          </AccordionDetails>
        </Accordion>
      </ContentContainer>

      {/* Entity selection popup to assign a method */}
      {entitySelectPopupOpen && (
        <PopupContainer>
          <Typography>Select an entity to assign the method</Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Available Methods</InputLabel>
            <Select
              value={methodToAssign}
              onChange={(e) => setMethodToAssign(e.target.value)}
            >
              {availableMethods.map((method, index) => {
                const { methodName, parameters } = parseMethodSignature(method); // Parse method signature here
                return (
                  <MenuItem key={index} value={methodName}>
                    {methodName}({
                      parameters.length > 0 ? parameters.join(', ') : 'No parameters'
                    })
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          {Array.from(schema.keys()).map((entity) => (
            <Button key={entity} onClick={() => handleAddMethodToEntity(entity)} sx={{ marginTop: 1 }}>
              {entity}
            </Button>
          ))}
          <FormControl fullWidth margin="normal">
            <InputLabel>Return Type</InputLabel>
            <Select value={returnType} onChange={(e) => setReturnType(e.target.value)}>
              <MenuItem value="void">void</MenuItem>
              <MenuItem value="int">int</MenuItem>
              <MenuItem value="float">float</MenuItem>
              <MenuItem value="String">String</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Visibility</InputLabel>
            <Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <MenuItem value="public">public</MenuItem>
              <MenuItem value="protected">protected</MenuItem>
              <MenuItem value="private">private</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Checkbox checked={isStatic} onChange={(e) => setIsStatic(e.target.checked)} />}
            label="Static"
          />
        </PopupContainer>
      )}

      {/* Example clickable method link */}
      <Typography>
        Click a method to assign:{' '}
        <span
          onClick={handleMethodLinkClick}
          style={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }}
        >
          Assign Method
        </span>
      </Typography>

      {/* Key Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => handleKeyMenuClose('')}>
        <MenuItem onClick={() => handleKeyMenuClose('')}>Not a key</MenuItem>
        <MenuItem onClick={() => handleKeyMenuClose('PK')}>Primary Key</MenuItem>
        <MenuItem onClick={() => handleKeyMenuClose('PPK')}>Partial Primary Key</MenuItem>
      </Menu>
      {/* Data Type Menu */}
      <Menu anchorEl={typeAnchorEl} open={Boolean(typeAnchorEl)} onClose={() => handleTypeMenuClose('')}>
        <MenuItem onClick={() => handleTypeMenuClose('String')}>String</MenuItem>
        <MenuItem onClick={() => handleTypeMenuClose('int')}>Integer</MenuItem>
        <MenuItem onClick={() => handleTypeMenuClose('boolean')}>Boolean</MenuItem>
        <MenuItem onClick={() => handleTypeMenuClose('float')}>Float</MenuItem>
      </Menu>
      <Popup
        popup={popup}
        hidePopup={hidePopupMethod}
        addEntity={handleAddEntity}
        addAttribute={handleAddAttribute}
        showSubPopup={showSubPopup}
        entityPopupRef={entityPopupRef}
      />
    </DrawerContainer>
  );
};

export default ControlsComponent;














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
  console.log("Processing schema for Mermaid diagram...");

  // Process each entity in the schema
  schema.forEach((schemaItem, entityName) => {
    if (!schemaItem) return; // Ensure schemaItem is defined

    const className = capitalizeFirstLetter(entityName);
    let classDefinition = `class ${className} {\n`;

    // Track processed attributes to avoid duplicates
    const attributeSet = new Set();
    const attributeLines = [];

    if (schemaItem.attribute && schemaItem.attribute.size > 0) {
      schemaItem.attribute.forEach((attr) => {
        const attrLine = `  -${attr.attribute}: ${attr.type}`;
        if (!attributeSet.has(attrLine)) {
          attributeSet.add(attrLine);
          attributeLines.push(attrLine);
        }
      });
    } else {
      attributeLines.push("  // No attributes");
    }

    // Track processed methods to avoid duplicates
    const methodSet = new Set();
    const methodLines = [];

    // Include Constructor If Defined
    if (schemaItem.constructor && Array.isArray(schemaItem.constructor.parameters)) {
      const paramList = schemaItem.constructor.parameters.map((param) => `${param}`).join(", ");
      const constructorSignature = `  +${className}(${paramList})`;

      if (!methodSet.has(constructorSignature)) {
        methodSet.add(constructorSignature);
        methodLines.push(constructorSignature);
      }

      console.log(`Including Constructor: ${className}(${paramList})`);
    }

    // Include Getters and Setters
    if (schemaItem.methods && Array.isArray(schemaItem.methods)) {
      console.log(`📌 Methods included for Mermaid (${className}):`, schemaItem.methods); // Debug log
      schemaItem.methods.forEach((method) => {
        const visibilitySymbol =
          method.visibility === "private" ? "-" : method.visibility === "protected" ? "#" : "+";
        const paramList = method.parameters.map((param) => `${param}`).join(", ");
        const returnType = method.returnType ? `: ${method.returnType}` : ": void";
        const methodSignature = `  ${visibilitySymbol}${method.name}(${paramList})${returnType}`;
    
        if (!methodSet.has(methodSignature)) {
          methodSet.add(methodSignature);
          methodLines.push(methodSignature);
        }
      });
    }
    
  
    // Combine attributes and methods into the class definition
    classDefinition += attributeLines.join("\n") + "\n";

    if (methodLines.length > 0) {
      if (attributeLines.length > 0) {
        classDefinition += "\n"; // Add a newline between attributes and methods if both exist
      }
      classDefinition += methodLines.join("\n") + "\n";
    }

    classDefinition += `}\n`;
    schemaText.push(classDefinition);

    // Debug: Log attributes and methods
    console.log(`Attributes for ${className}:`, schemaItem.attribute);
    console.log(`Methods for ${className}:`, schemaItem.methods);

    // Handle Inheritance Relationships Properly
    if (schemaItem.parent) {
      const parentName = capitalizeFirstLetter(schemaItem.parent);
      console.log(`Adding inheritance: ${parentName} <|-- ${className}`);
      schemaText.push(`${parentName} <|-- ${className}`);

      // Merge methods properly without overwriting child methods
      const parentSchema = schema.get(schemaItem.parent);
      if (parentSchema && parentSchema.methods) {
        console.log(`Merging methods from parent ${parentName} to child ${className}`);

        const existingChildMethods = schemaItem.methods || [];
        const uniqueParentMethods = parentSchema.methods.filter(
          (parentMethod) => !existingChildMethods.some((childMethod) => childMethod.name === parentMethod.name)
        );

        schemaItem.methods = [...existingChildMethods, ...uniqueParentMethods];
      }
    }
  });

  // Handle Regular Relationships Separately
  relationships.forEach((rel) => {
    if (!rel.relationA || !rel.relationB) return; // Prevent undefined errors

    const relationA = capitalizeFirstLetter(rel.relationA);
    const relationB = capitalizeFirstLetter(rel.relationB);
    console.log(`Adding Relationship: ${relationA} -- ${relationB} (${rel.type})`);

    if (rel.type === "inheritance") {
      schemaText.push(`${relationB} <|-- ${relationA}`);
    } else if (rel.type === "composition") {
      schemaText.push(`${relationA} *-- "${rel.cardinalityA}" ${relationB} : "◆ ${rel.label || "Composition"}"`);
    } else if (rel.type === "aggregation") {
      schemaText.push(`${relationA} o-- "${rel.cardinalityA}" ${relationB} : "◇ ${rel.label || "Aggregation"}"`);
    } else {
      schemaText.push(`${relationA} "${rel.cardinalityA}" -- "${rel.cardinalityB}" ${relationB} : ${rel.label || ""}`);
    }
  });

  console.log("Final Mermaid Source:\n", schemaText.join("\n"));
  return schemaText.join("\n");
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
  const detectedClasses = new Set(); // Track classes that are defined in the source code

  // List of primitive and built-in types to exclude
  const PRIMITIVE_TYPES = new Set([
    "String", "int", "double", "float", "boolean", "char", "long", "short", "byte", "void"
  ]);

  if (syntaxType === SYNTAX_TYPES.JAVA) {
    const classRegex = /(?:public|protected|private)?\s*class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{([\s\S]*?)\}/g;
    let classMatch;

    while ((classMatch = classRegex.exec(sourceCode)) !== null) {
      const className = classMatch[1];
      detectedClasses.add(className); // Track defined classes
      const parentClass = classMatch[2] || null;
      const classContent = classMatch[3];
      const attributes = new Map();
      const methods = [];
      const methodNames = new Set();

      // Parse fields (attributes)
      const fieldRegex = /(?:private|protected|public)?\s+(\w+)\s+(\w+);/g;
      let fieldMatch;

      while ((fieldMatch = fieldRegex.exec(classContent)) !== null) {
        const type = fieldMatch[1];
        const name = fieldMatch[2];
        attributes.set(name, { type });

        // Detect composition and aggregation
        if (!PRIMITIVE_TYPES.has(type)) {
          if (type.match(/^(List|Set|Map)<(\w+)>$/)) {
            const match = type.match(/^(List|Set|Map)<(\w+)>$/);
            const collectionType = match[1];
            const itemType = match[2];
            relationships.set(`${className}-${itemType}`, {
              type: 'aggregation',
              relationA: className,
              relationB: itemType,
              cardinalityA: '1',
              cardinalityB: 'many',
              label: 'Aggregation',
            });
          } else if (/^[A-Z]/.test(type)) {
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
      }

      // Detect aggregation (e.g., private List<Car> cars;)
      const aggregationRegex = /(?:private|protected|public)?\s+(List|Set|Map)\s*<\s*(\w+)\s*>\s+(\w+)(?:\s*=.*)?;/g;
      let aggregationMatch;

      console.log(`\nProcessing Class: ${className}`); // Log the class being processed
      console.log("Class Content:\n", classContent);  // Log the raw class content

      while ((aggregationMatch = aggregationRegex.exec(classContent)) !== null) {
        const collectionType = aggregationMatch[1]; // e.g., "List"
        const itemType = aggregationMatch[2];      // e.g., "Car"
        const fieldName = aggregationMatch[3];     // e.g., "cars"

        console.log(`\nDetected Aggregation in ${className}:`);
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
        attributes.set(fieldName, { type: `${collectionType}<${itemType}>` });
      }

      console.log("Final Relationships Map:", relationships); // Log the relationships detected

      // Detect instantiations inside constructors
      const instantiationRegex = /this\.(\w+)\s*=\s*new\s+(\w+)\(/g;
      let instantiationMatch;

      while ((instantiationMatch = instantiationRegex.exec(classContent)) !== null) {
        const fieldName = instantiationMatch[1];
        const instantiatedType = instantiationMatch[2];

        console.log(`Detected instantiation: ${className} → ${instantiatedType}`);
        attributes.set(fieldName, { type: instantiatedType });

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


     // Parse all methods (including inferred methods)
      const methodRegex = /(public|private|protected)?\s+(\w+)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
      const getterSetterRegex = /(public|protected|private)?\s+(\w+)\s+(get|set)([A-Z]\w*)\s*\(([^)]*)\)\s*\{/g;

      let methodMatch;

      while ((methodMatch = methodRegex.exec(classContent)) !== null) {
          const visibility = methodMatch[1] || "public";
          let returnType = methodMatch[2] || "void";
          const methodName = methodMatch[3];
          const parameters = methodMatch[4] ? methodMatch[4].trim().split(",").map(param => param.trim()) : [];

          // Add all methods to the schema
          methods.push({
              visibility,
              returnType,
              name: methodName,
              parameters
          });
      }

      // Detect explicit getters and setters using separate regex
      let getterSetterMatch;
      while ((getterSetterMatch = getterSetterRegex.exec(classContent)) !== null) {
          const visibility = getterSetterMatch[1] || "public";
          const returnType = getterSetterMatch[2] || "void";
          const methodType = getterSetterMatch[3]; // "get" or "set"
          const methodNameSuffix = getterSetterMatch[4]; // Capitalized part of the method name
          const parameters = getterSetterMatch[5] ? getterSetterMatch[5].trim().split(",").map(param => param.trim()) : [];

          // Add getters and setters directly to the schema without checking for attributes
          if (methodType === "get") {
              methods.push({
                  visibility,
                  returnType,
                  name: `get${methodNameSuffix}`, // Preserve capitalization
                  parameters: []
              });
          } else if (methodType === "set") {
              methods.push({
                  visibility,
                  returnType: "void", // Setters always return void
                  name: `set${methodNameSuffix}`, // Preserve capitalization
                  parameters
              });
          }
      }
      
      // Handle inheritance
      if (parentClass) {
        const parentSchema = schemaMap.get(parentClass);
        if (parentSchema) {
          const inheritedMethods = parentSchema.methods.filter(
            (parentMethod) => !methods.some((childMethod) => childMethod.name === parentMethod.name)
          );

          console.log(`Inheriting ${inheritedMethods.length} methods from ${parentClass} to ${className}`);

          // Preserve existing child methods and only add missing parent methods
          methods.push(...inheritedMethods);
        }
      }

      // Infer methods for aggregation fields
      attributes.forEach((attr, attrName) => {
        const match = attr.type.match(/^(List|Set|Map)<(\w+)>$/);
        if (!match) return; // Skip non-collection fields
        const collectionType = match[1]; // e.g., "List"
        const itemType = match[2];       // e.g., "Car"

        // Infer "add" method (e.g., addCar(Car car))
        const addMethodName = `add${capitalizeFirstLetter(itemType)}`;
        if (!methodNames.has(addMethodName)) {
          console.log(`Inferred add method: ${addMethodName}`);
          methods.push({
            visibility: 'public',
            returnType: 'void',
            name: addMethodName,
            parameters: [`${itemType.toLowerCase()}: ${itemType}`], // Format parameter as "car: Car"
          });
          methodNames.add(addMethodName);
        }

        // Infer "get" method (e.g., getCars(): List<Car>)
        const getMethodName = `get${capitalizeFirstLetter(attrName)}`;
        if (!methodNames.has(getMethodName)) {
          console.log(`Inferred get method: ${getMethodName}`);
          methods.push({
            visibility: 'public',
            returnType: `${collectionType}<${itemType}>`,
            name: getMethodName,
            parameters: [],
          });
          methodNames.add(getMethodName);
        }
      });

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

    // **Ensure all instantiated classes exist in schema**
    relationships.forEach((rel) => {
      if (rel.type === "composition" && !schemaMap.has(rel.relationB) && !detectedClasses.has(rel.relationB)) {
        // Exclude primitive and built-in types
        if (!PRIMITIVE_TYPES.has(rel.relationB)) {
          console.log(` Adding missing class definition for: ${rel.relationB}`);
          schemaMap.set(rel.relationB, {
            entity: rel.relationB,
            attribute: new Map(), // No attributes detected for undefined class
            methods: [],
          });
        }
      }
    });
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
  console.log("Detected Relationships:", relationships);
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