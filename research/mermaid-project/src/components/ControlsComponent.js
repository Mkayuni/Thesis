import React, { useState } from 'react';
import { Typography, TextField, Divider, IconButton, Accordion, AccordionSummary, AccordionDetails, Button, Box, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyIcon from '@mui/icons-material/VpnKey';
import RelationshipManager from './relationshipManager/RelationshipManager';

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

const ControlsComponent = ({
  questionMarkdown,
  setQuestionMarkdown,
  schema,
  setSchema,
  showPopup,
  questions,
  expandedPanel,
  setExpandedPanel,
  removeEntity,
  removeAttribute,
  relationships,
  removeRelationship,
  updateAttributeKey,
  controlsRef,
  addRelationship,
  editRelationship,
}) => {
  const [showTextBox, setShowTextBox] = useState(false);
  const [tempQuestion, setTempQuestion] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedAttribute, setSelectedAttribute] = useState(null);

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
        <Box sx={{ padding: '16px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginTop: '16px' }}>
          <Typography variant="h6" sx={{ marginBottom: '8px' }}>Questions</Typography>
          {questions.map((question, index) => (
            <Button key={index} onClick={() => setQuestionMarkdown(question)} fullWidth sx={{ justifyContent: 'flex-start', marginBottom: '8px' }}>
              {question}
            </Button>
          ))}
        </Box>
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
    </DrawerContainer>
  );
};

export default ControlsComponent;
