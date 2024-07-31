// src/components/utils/Popup.js

import React, { useRef } from 'react';
import { Paper, TextField, Button } from '@mui/material';
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

const Popup = ({ popup, hidePopup, addEntity, addAttribute, addMethod, showSubPopup, entityPopupRef }) => {
  const methodInputRef = useRef();

  const handleAddMethod = () => {
    const methodName = methodInputRef.current.value;
    if (methodName) {
      addMethod(popup.entityOrAttribute, methodName);
      hidePopup();
    }
  };

  return (
    popup.visible && (
      <PopupContainer ref={entityPopupRef} style={{ top: popup.y, left: popup.x }}>
        {popup.type === 'method' ? (
          <div>
            <TextField inputRef={methodInputRef} label="Method Name" variant="outlined" fullWidth />
            <Button variant="contained" color="primary" onClick={handleAddMethod}>
              Add Method
            </Button>
          </div>
        ) : (
          popup.entities.map((entity) => (
            <div key={entity}>
              <Button onClick={() => addAttribute(entity, popup.entityOrAttribute)}>{entity}</Button>
            </div>
          ))
        )}
      </PopupContainer>
    )
  );
};

export default Popup;
