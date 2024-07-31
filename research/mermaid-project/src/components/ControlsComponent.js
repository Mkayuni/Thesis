// src/components/ControlsComponent.js

import React, { useEffect, useState, useRef } from 'react';
import { Typography, TextField, Divider, IconButton, Accordion, AccordionSummary, AccordionDetails, Button, Box, Menu, MenuItem, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyIcon from '@mui/icons-material/VpnKey';
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
  addMethod,
  addRelationship,
  editRelationship,
  onQuestionClick,
  hidePopup,
  setRelationships, // Ensure setRelationships is passed as a prop
}) => {
  const [showTextBox, setShowTextBox] = useState(false);
  const [tempQuestion, setTempQuestion] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(false);

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

  const handleAddMethod = (entityName, method) => {
    addMethod(entityName, method);
    hidePopup(); // Hide popup after adding method
  };

  const handleQuestionClick = (question) => {
    onQuestionClick(question);
    // Clear schema and relationships when switching questions
    setSchema(new Map());
    setRelationships(new Map());
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
        <Accordion
          expanded={expandedQuestions}
          onChange={handleQuestionsAccordionChange}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ marginBottom: '8px' }}>Questions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ padding: '16px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginTop: '16px' }}>
              {questions.map((question, index) => (
                <Button key={index} onClick={() => handleQuestionClick(question)} fullWidth sx={{ justifyContent: 'flex-start', marginBottom: '8px' }}>
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
            <Typography>Manage Entities</Typography>
          </AccordionSummaryStyled>
          <AccordionDetails sx={{ backgroundColor: '#e0f7fa' }}>
            {Array.from(schema.entries()).map(([entity, { attribute }]) => (
              <Box key={entity} sx={{ marginBottom: '16px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{entity}</Typography>
                  <IconButton onClick={() => removeEntity(entity)} size="small" sx={{ color: 'red' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                {Array.from(attribute.entries()).map(([attr, { key }]) => (
                  <Box key={attr} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Typography variant="body1" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {attr} {key && <span>({key})</span>}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton onClick={(event) => handleKeyMenuClick(event, entity, attr)} size="small" sx={{ color: 'green' }}>
                        <KeyIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => removeAttribute(entity, attr)} size="small" sx={{ color: 'blue' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
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
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleKeyMenuClose('')}
      >
        <MenuItem onClick={() => handleKeyMenuClose('')}>Not a key</MenuItem>
        <MenuItem onClick={() => handleKeyMenuClose('PK')}>Primary Key</MenuItem>
        <MenuItem onClick={() => handleKeyMenuClose('PPK')}>Partial Primary Key</MenuItem>
      </Menu>
      <Popup popup={popup} hidePopup={hidePopupMethod} addEntity={handleAddEntity} addAttribute={handleAddAttribute} addMethod={handleAddMethod} showSubPopup={showSubPopup} entityPopupRef={entityPopupRef} />
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
