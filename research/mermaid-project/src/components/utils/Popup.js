// src/components/utils/Popup.js

import React, { useRef, useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const PopupContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  padding: theme.spacing(2),
  backgroundColor: '#f0f0f0',
  border: '1px solid #ccc',
  boxShadow: theme.shadows[5],
  zIndex: 1000,
  maxHeight: '80vh',
  overflowY: 'auto',
  width: 'fit-content',
}));

const Popup = ({
  popup,
  hidePopup,
  addEntity,
  addAttribute,
  addMethod,
  showSubPopup,
  entityPopupRef,
}) => {
  const methodInputRef = useRef();
  const attributeInputRef = useRef();
  const [visibility, setVisibility] = useState('public');
  const [isStatic, setIsStatic] = useState(false);
  const [attributeType, setAttributeType] = useState('String'); // Default type

  const handleAddMethod = () => {
    const methodName = methodInputRef.current.value.trim();

    if (methodName) {
      const methodDetails = {
        name: methodName,
        visibility,
        static: isStatic,
      };
      console.log("Adding Method:", methodDetails);  // Debugging log
      addMethod(popup.entityOrAttribute, methodDetails);
      hidePopup();
    } else {
      alert("Please enter a method name.");
    }
  };

  const handleAddAttribute = () => {
    const attributeName = attributeInputRef.current.value.trim();

    if (attributeName) {
      addAttribute(popup.entityOrAttribute, attributeName, attributeType); // Pass type here
      hidePopup();
    } else {
      alert("Please enter an attribute name.");
    }
  };

  const handleVisibilityChange = (event) => {
    setVisibility(event.target.value);
  };

  const handleStaticChange = (event) => {
    setIsStatic(event.target.checked);
  };

  const handleTypeChange = (event) => {
    setAttributeType(event.target.value);
  };

  return (
    popup.visible && (
      <PopupContainer ref={entityPopupRef} style={{ top: popup.y, left: popup.x }}>
        {popup.type === 'method' ? (
          <div>
            <TextField
              inputRef={methodInputRef}
              label="Method Name"
              variant="outlined"
              fullWidth
              defaultValue={popup.entityOrAttribute} // Pre-fill with the method name
            />
            <FormControl variant="outlined" fullWidth margin="normal">
              <InputLabel id="visibility-label">Visibility</InputLabel>
              <Select
                labelId="visibility-label"
                value={visibility}
                onChange={handleVisibilityChange}
                label="Visibility"
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
                  onChange={handleStaticChange}
                  color="primary"
                />
              }
              label="Static"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddMethod}
              sx={{ marginTop: 2 }}
            >
              Add Method
            </Button>
          </div>
        ) : (
          <div>
            <TextField
              inputRef={attributeInputRef}
              label="Attribute Name"
              variant="outlined"
              fullWidth
              defaultValue={popup.entityOrAttribute} // Pre-fill with the attribute name
            />
            <FormControl variant="outlined" fullWidth margin="normal">
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                value={attributeType}
                onChange={handleTypeChange}
                label="Type"
              >
                <MenuItem value="String">String</MenuItem>
                <MenuItem value="int">Integer</MenuItem>
                <MenuItem value="boolean">Boolean</MenuItem>
                <MenuItem value="float">Float</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddAttribute}
              sx={{ marginTop: 2 }}
            >
              Add Attribute
            </Button>
          </div>
        )}
      </PopupContainer>
    )
  );
};

export default Popup;
