import React, { useState } from 'react';
import { Box, Typography, Autocomplete, TextField, Chip, IconButton, ToggleButton, ToggleButtonGroup, Checkbox, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

const RelationshipManager = ({ schema, relationships, addRelationship, removeRelationship, onClose }) => {
  const [relationA, setRelationA] = useState('');
  const [relationB, setRelationB] = useState('');
  const [cardinalityA, setCardinalityA] = useState('1');
  const [cardinalityB, setCardinalityB] = useState('1');
  const [relationshipType, setRelationshipType] = useState('cardinality'); // 'cardinality', 'inheritance', 'composition', or 'aggregation'
  const [isInterface, setIsInterface] = useState(false);
  const entities = Array.from(schema.keys());
  const cardinalityOptions = ['1', '0..1', '1..*', '0..*'];

  const handleAddRelationship = () => {
    // Validate inputs
    if (!relationB || !relationA) {
      console.error('Both entities must be selected.');
      return;
    }

    // Generate a unique ID for this relationship
    const relationshipId = `${relationB}-${isInterface ? 'implements' : 'extends'}-${relationA}`;

    let newRelationship;
    if (relationshipType === 'inheritance') {
      // For inheritance, we only change the type if isInterface is checked
      // The relationB is the parent, relationA is the child
      newRelationship = {
        id: relationshipId,
        type: isInterface ? 'implementation' : 'inheritance',
        relationA: relationB, // Child
        relationB: relationA, // Parent
        label: isInterface ? 'implements' : 'extends'
      };
    } else if (relationshipType === 'composition') {
      // Store composition relationship with default cardinalities
      newRelationship = {
        id: relationshipId,
        type: 'composition',
        relationA: relationA, // Owner
        relationB: relationB, // Owned
        cardinalityA: cardinalityA || '1',
        cardinalityB: cardinalityB || '1',
        label: 'Composition'
      };
    } else if (relationshipType === 'aggregation') {
      // Store aggregation relationship with default cardinalities
      newRelationship = {
        id: relationshipId,
        type: 'aggregation',
        relationA: relationA, // Whole
        relationB: relationB, // Part
        cardinalityA: cardinalityA || '1',
        cardinalityB: cardinalityB || 'many',
        label: 'Aggregation'
      };
    } else {
      // Store cardinality relationship
      if (!cardinalityA || !cardinalityB) {
        console.error('Cardinality values must be selected for cardinality relationships.');
        return;
      }
      newRelationship = {
        id: relationshipId,
        type: 'cardinality',
        relationA: relationA,
        relationB: relationB,
        cardinalityA: cardinalityA,
        cardinalityB: cardinalityB,
        label: ''
      };
    }

    // Add the relationship
    addRelationship(newRelationship);

    // Reset the form
    setRelationA('');
    setRelationB('');
    setCardinalityA('1');
    setCardinalityB('1');
    setIsInterface(false);
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

      {/* Relationship Type Toggle */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
        {/* First Row: Cardinality and Inheritance */}
        <ToggleButtonGroup
          value={relationshipType}
          exclusive
          onChange={(_, newType) => {
            if (newType) {
              setRelationshipType(newType);
              if (newType !== 'inheritance') {
                setIsInterface(false);
              }
            }
          }}
          size="small"
          sx={{ width: '100%' }}
        >
          <ToggleButton value="cardinality" sx={{ flex: 1 }}>Cardinality</ToggleButton>
          <ToggleButton value="inheritance" sx={{ flex: 1 }}>Inheritance</ToggleButton>
        </ToggleButtonGroup>

        {/* Second Row: Composition and Aggregation */}
        <ToggleButtonGroup
          value={relationshipType}
          exclusive
          onChange={(_, newType) => {
            if (newType) {
              setRelationshipType(newType);
              if (newType !== 'inheritance') {
                setIsInterface(false);
              }
            }
          }}
          size="small"
          sx={{ width: '100%' }}
        >
          <ToggleButton value="composition" sx={{ flex: 1 }}>Composition</ToggleButton>
          <ToggleButton value="aggregation" sx={{ flex: 1 }}>Aggregation</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Add Relationship Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        <Autocomplete
          size="small"
          options={entities}
          value={relationA}
          onChange={(_, newValue) => setRelationA(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={
                relationshipType === 'inheritance'
                  ? 'Parent'
                  : relationshipType === 'composition'
                  ? 'Owner'
                  : relationshipType === 'aggregation'
                  ? 'Whole'
                  : 'Entity A'
              }
              size="small"
            />
          )}
        />

        {relationshipType === 'inheritance' && (
          <FormControlLabel
            control={
              <Checkbox
                checked={isInterface}
                onChange={(e) => setIsInterface(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                Parent is Interface
              </Typography>
            }
            sx={{ m: 0 }}
          />
        )}

        {['cardinality', 'composition', 'aggregation'].includes(relationshipType) && (
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
        )}

        <Autocomplete
          size="small"
          options={entities}
          value={relationB}
          onChange={(_, newValue) => setRelationB(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={
                relationshipType === 'inheritance'
                  ? 'Child'
                  : relationshipType === 'composition'
                  ? 'Owned'
                  : relationshipType === 'aggregation'
                  ? 'Part'
                  : 'Entity B'
              }
              size="small"
            />
          )}
        />

        {['cardinality', 'composition', 'aggregation'].includes(relationshipType) && (
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
        )}

        <Chip
          label={
            relationshipType === 'inheritance'
              ? isInterface 
                ? 'Add Implementation'
                : 'Add Inheritance'
              : relationshipType === 'composition'
              ? 'Add Composition'
              : relationshipType === 'aggregation'
              ? 'Add Aggregation'
              : 'Add Relationship'
          }
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
              {rel.type === 'inheritance' ? (
                `${rel.relationB} ▷ ${rel.relationA}` // Use a symbol for inheritance
              ) : rel.type === 'implementation' ? (
                `${rel.relationB} ⊳⊳ ${rel.relationA}` // Use a different symbol for interface implementation
              ) : rel.type === 'composition' ? (
                `${rel.relationA} ◆ ${rel.relationB} (${rel.cardinalityA} - ${rel.cardinalityB})` // Use a filled diamond for composition
              ) : rel.type === 'aggregation' ? (
                `${rel.relationA} ◇ ${rel.relationB} (${rel.cardinalityA} - ${rel.cardinalityB})` // Use an empty diamond for aggregation
              ) : (
                `${rel.relationA} ${rel.cardinalityA} - ${rel.cardinalityB} ${rel.relationB}`
              )}
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