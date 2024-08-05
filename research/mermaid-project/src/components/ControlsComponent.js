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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyIcon from '@mui/icons-material/VpnKey';
import CategoryIcon from '@mui/icons-material/Category'; // Import new icon for data type selection
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
  backgroundColor: '#bbbbbb', // Less dark gray background
  color: '#000000', // Black text color
  border: '1px solid #ccc',
  boxShadow: theme.shadows[5],
  zIndex: 1000,
  maxHeight: '80vh',
  overflowY: 'auto',
  width: 'fit-content',
}));

const ControlsComponent = ({
  questionMarkdown,
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
  setRelationships, // Ensure setRelationships is passed as a prop
  addMethod, // Ensure addMethod is passed as a prop
  removeMethod, // Ensure removeMethod is passed as a prop
}) => {
  const [showTextBox, setShowTextBox] = useState(false);
  const [tempQuestion, setTempQuestion] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(false);

  // State for the data type selection menu
  const [typeAnchorEl, setTypeAnchorEl] = useState(null);
  const [selectedTypeEntity, setSelectedTypeEntity] = useState(null);
  const [selectedTypeAttribute, setSelectedTypeAttribute] = useState(null);

  const {
    popup,
    subPopup,
    entityPopupRef,
    subPopupRef,
    handleClickOutside,
    showPopup: showPopupMethod,
    hidePopup: hidePopupMethod,
    adjustPopupPosition,
    showSubPopup,
  } = usePopup();

  const questionContainerRef = useRef(null);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

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
      // Update the attribute with the selected type
      // Maintain the order by directly updating the map
      setSchema((prevSchema) => {
        const newSchema = new Map(prevSchema);
        const entityData = newSchema.get(selectedTypeEntity);
        if (entityData) {
          const updatedAttributes = new Map(entityData.attribute);
          if (updatedAttributes.has(selectedTypeAttribute)) {
            const attributeData = updatedAttributes.get(selectedTypeAttribute);
            attributeData.type = type; // Update the type in the attribute object
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
    hidePopup(); // Hide popup after adding entity
  };

  const handleAddAttribute = (entityName, attribute, key = '') => {
    addAttribute(entityName, attribute, key);
    hidePopup(); // Hide popup after adding attribute
  };

  const handleQuestionClick = (question) => {
    onQuestionClick(question);
    // Clear schema and relationships when switching questions
    setSchema(new Map());
    setRelationships(new Map());
  };

  const handleAddMethod = (
    entityName,
    methodName,
    returnType = 'void',
    parameters = [],
    isStatic = false,
    visibility = 'public'
  ) => {
    // Ensure parameters are an array of strings
    if (typeof parameters === 'string') {
      parameters = parameters.split(',').map((param) => param.trim()).filter((param) => param);
    }

    const methodDetails = {
      name: methodName,
      returnType,
      parameters,
      static: isStatic,
      visibility,
    };
    addMethod(entityName, methodDetails);
    hidePopup();
  };

  const handleRemoveMethod = (entityName, methodName) => {
    removeMethod(entityName, methodName);
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
                {/* Method Management Section */}
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
                          {method.name}(
                          {Array.isArray(method.parameters)
                            ? method.parameters.join(', ')
                            : method.parameters}
                          ) : {method.returnType}
                        </Typography>
                        <IconButton
                          onClick={() => handleRemoveMethod(entity, method.name)}
                          size="small"
                          sx={{ color: 'blue' }}
                        >
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
      {subPopup.visible && (
        <PopupContainer
          ref={subPopupRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            top: subPopup.y,
            left: subPopup.x,
          }}
        >
          {subPopup.entities.map((entity) => (
            <div key={entity}>
              <button onClick={() => handleAddAttribute(entity, subPopup.entityOrAttribute)}>{entity}</button>
            </div>
          ))}
        </PopupContainer>
      )}
    </DrawerContainer>
  );
};

export default ControlsComponent;
