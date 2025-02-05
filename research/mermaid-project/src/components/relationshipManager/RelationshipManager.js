import React, { useState } from 'react';
import { Box, Button, Typography, Select, MenuItem, TextField, Accordion, AccordionSummary, AccordionDetails, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';

const RelationshipManager = ({ schema, relationships, addRelationship, removeRelationship }) => {
  const [relationA, setRelationA] = useState('');
  const [relationB, setRelationB] = useState('');
  const [cardinalityA, setCardinalityA] = useState('');
  const [cardinalityB, setCardinalityB] = useState('');
  const [cardinalityText, setCardinalityText] = useState('');
  const [expanded, setExpanded] = useState(false);

  const entities = Array.from(schema.keys());

  const handleAddRelationship = () => {
    if (relationA && relationB && cardinalityA && cardinalityB) {
      addRelationship(relationA, relationB, cardinalityA, cardinalityB, cardinalityText);
      // Reset the form
      setRelationA('');
      setRelationB('');
      setCardinalityA('');
      setCardinalityB('');
      setCardinalityText('');
    }
  };

  const handleAccordionChange = () => {
    setExpanded(!expanded);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Add Relationship</Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        <Select value={relationA} onChange={(e) => setRelationA(e.target.value)} displayEmpty>
          <MenuItem value="" disabled>Select first entity</MenuItem>
          {entities.map((entity) => (
            <MenuItem key={entity} value={entity}>{entity}</MenuItem>
          ))}
        </Select>
        <Select value={cardinalityA} onChange={(e) => setCardinalityA(e.target.value)} displayEmpty>
          <MenuItem value="" disabled>Select cardinality for first entity</MenuItem>
          <MenuItem value="1..1">1..1</MenuItem>
          <MenuItem value="0..1">0..1</MenuItem>
          <MenuItem value="1..*">1..*</MenuItem>
          <MenuItem value="0..*">0..*</MenuItem>
        </Select>
        <Select value={relationB} onChange={(e) => setRelationB(e.target.value)} displayEmpty>
          <MenuItem value="" disabled>Select second entity</MenuItem>
          {entities.map((entity) => (
            <MenuItem key={entity} value={entity}>{entity}</MenuItem>
          ))}
        </Select>
        <Select value={cardinalityB} onChange={(e) => setCardinalityB(e.target.value)} displayEmpty>
          <MenuItem value="" disabled>Select cardinality for second entity</MenuItem>
          <MenuItem value="1..1">1..1</MenuItem>
          <MenuItem value="0..1">0..1</MenuItem>
          <MenuItem value="1..*">1..*</MenuItem>
          <MenuItem value="0..*">0..*</MenuItem>
        </Select>
        <TextField
          placeholder="Enter relationship text"
          value={cardinalityText}
          onChange={(e) => setCardinalityText(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handleAddRelationship}>
          Add
        </Button>
      </Box>
      <Accordion expanded={expanded} onChange={handleAccordionChange}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" gutterBottom>Edit Relationship</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ul>
            {Array.from(relationships.values()).map((rel) => (
              <li key={rel.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography>
                  {rel.relationA} {rel.cardinalityA} - {rel.cardinalityB} {rel.relationB}: {rel.cardinalityText}
                </Typography>
                <IconButton onClick={() => removeRelationship(rel.id)} size="small" sx={{ color: 'red' }}>
                  <DeleteIcon />
                </IconButton>
              </li>
            ))}
          </ul>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default RelationshipManager;
