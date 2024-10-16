// src/components/methods.js

import React, { useRef } from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Button } from '@mui/material';

// Methods Logic
export const handleAddMethodClick = (addMethod, entity, methodDetails, hidePopup) => {
  const parameters = methodDetails.parameters
    .split(',')
    .map((param) => param.trim())
    .map((param) => {
      const [name, type] = param.split(':').map((s) => s.trim());
      return `${name}: ${type}`;
    })
    .join(', ');

  const formattedMethodDetails = {
    ...methodDetails,
    parameters,
    returnType: methodDetails.returnType,
  };

  addMethod(entity, formattedMethodDetails);
  hidePopup();
};

export const handleVisibilityChange = (event, setVisibility) => {
  setVisibility(event.target.value);
};

export const handleStaticChange = (event, setIsStatic) => {
  setIsStatic(event.target.checked);
};

export const handleReturnTypeChange = (event, setReturnType) => {
  setReturnType(event.target.value);
};

// Method Form Component
const MethodForm = ({
  addMethod,
  subPopup,
  visibility,
  setVisibility,
  isStatic,
  setIsStatic,
  returnType,
  setReturnType,
  hidePopup,
}) => {
  const methodInputRef = useRef();
  const parametersRef = useRef();

  return (
    <div>
      <TextField inputRef={methodInputRef} label="Method Name" variant="outlined" fullWidth />
      <TextField
        inputRef={parametersRef}
        label="Parameters (e.g., param1: Type1, param2: Type2)"
        variant="outlined"
        fullWidth
        margin="normal"
      />
      <FormControl variant="outlined" fullWidth margin="normal">
        <InputLabel id="visibility-label">Visibility</InputLabel>
        <Select
          labelId="visibility-label"
          value={visibility}
          onChange={(event) => handleVisibilityChange(event, setVisibility)}
          label="Visibility"
          onMouseDown={(e) => e.stopPropagation()} // Prevent event from closing the popup
        >
          <MenuItem value="public">Public</MenuItem>
          <MenuItem value="protected">Protected</MenuItem>
          <MenuItem value="private">Private</MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Checkbox
            checked={isStatic}
            onChange={(event) => handleStaticChange(event, setIsStatic)}
            color="primary"
            onMouseDown={(e) => e.stopPropagation()} // Prevent event from closing the popup
          />
        }
        label="Static"
      />
      <FormControl variant="outlined" fullWidth margin="normal">
        <InputLabel id="return-type-label">Return Type</InputLabel>
        <Select
          labelId="return-type-label"
          value={returnType}
          onChange={(event) => handleReturnTypeChange(event, setReturnType)}
          label="Return Type"
          onMouseDown={(e) => e.stopPropagation()} // Prevent event from closing the popup
        >
          <MenuItem value="void">void</MenuItem>
          <MenuItem value="int">int</MenuItem>
          <MenuItem value="float">float</MenuItem>
          <MenuItem value="String">String</MenuItem>
          <MenuItem value="List<Fish>">List&lt;Fish&gt;</MenuItem>
        </Select>
      </FormControl>
      <Button
        variant="contained"
        color="primary"
        onClick={(e) => {
          e.stopPropagation();
          handleAddMethodClick(
            addMethod,
            subPopup.entityOrAttribute,
            {
              name: methodInputRef.current.value.trim(),
              parameters: parametersRef.current.value.trim(),
              visibility: visibility,
              static: isStatic,
              returnType: returnType,
            },
            hidePopup
          );
        }}
        sx={{ marginTop: 2 }}
      >
        Add Method
      </Button>
    </div>
  );
};

export default MethodForm;
