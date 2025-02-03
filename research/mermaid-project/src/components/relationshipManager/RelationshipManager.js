import React, { useState } from 'react';
import { Box, Typography, Autocomplete, TextField, Chip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

const RelationshipManager = ({ schema, relationships, addRelationship, removeRelationship, onClose }) => {
  const [relationA, setRelationA] = useState('');
  const [relationB, setRelationB] = useState('');
  const [cardinalityA, setCardinalityA] = useState('1..1');
  const [cardinalityB, setCardinalityB] = useState('1..1');

  const entities = Array.from(schema.keys());
  const cardinalityOptions = ['1..1', '0..1', '1..*', '0..*'];

  const handleAddRelationship = () => {
    if (relationA && relationB && cardinalityA && cardinalityB) {
      addRelationship(relationA, relationB, cardinalityA, cardinalityB);
      // Reset the form
      setRelationA('');
      setRelationB('');
      setCardinalityA('1..1');
      setCardinalityB('1..1');
    }
  };

  return (
    <Box sx={{ width: '240px', p: 1.5, border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9', position: 'relative' }}>
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        size="small"
        sx={{ position: 'absolute', top: 8, right: 8, color: '#666' }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      {/* Title */}
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#555', pr: 2 }}>
        Relationships
      </Typography>

      {/* Add Relationship Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        <Autocomplete
          size="small"
          options={entities}
          value={relationA}
          onChange={(_, newValue) => setRelationA(newValue)}
          renderInput={(params) => <TextField {...params} label="Entity A" size="small" />}
        />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {cardinalityOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              onClick={() => setCardinalityA(option)}
              variant={cardinalityA === option ? 'filled' : 'outlined'}
              color="primary"
              size="small"
              sx={{ cursor: 'pointer', flex: 1, fontSize: '0.75rem' }}
            />
          ))}
        </Box>
        <Autocomplete
          size="small"
          options={entities}
          value={relationB}
          onChange={(_, newValue) => setRelationB(newValue)}
          renderInput={(params) => <TextField {...params} label="Entity B" size="small" />}
        />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {cardinalityOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              onClick={() => setCardinalityB(option)}
              variant={cardinalityB === option ? 'filled' : 'outlined'}
              color="secondary"
              size="small"
              sx={{ cursor: 'pointer', flex: 1, fontSize: '0.75rem' }}
            />
          ))}
        </Box>
        <Chip
          label="Add Relationship"
          onClick={handleAddRelationship}
          color="success"
          size="small"
          sx={{ cursor: 'pointer', mt: 1, fontSize: '0.75rem' }}
        />
      </Box>

      {/* List of Relationships */}
      <Box sx={{ maxHeight: '150px', overflowY: 'auto' }}>
        {Array.from(relationships.values()).map((rel) => (
          <Box
            key={rel.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 0.5,
              mb: 0.5,
              backgroundColor: '#fff',
              borderRadius: '4px',
              border: '1px solid #eee',
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              {rel.relationA} {rel.cardinalityA} - {rel.cardinalityB} {rel.relationB}
            </Typography>
            <IconButton
              onClick={() => removeRelationship(rel.id)}
              size="small"
              sx={{ color: 'red', p: 0.5 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default RelationshipManager;