import { useRef, useState, useCallback } from 'react';

export const usePopup = () => {
  const [popup, setPopup] = useState({ 
    visible: false, 
    x: 0, 
    y: 0, 
    entityOrAttribute: '', 
    type: '', // This will be 'entity', 'attribute', or 'method'
    entities: [] 
  });
  
  const [subPopup, setSubPopup] = useState({ 
    visible: false, 
    x: 0, 
    y: 0, 
    entityOrAttribute: '', 
    type: '', 
    entities: [] 
  });
  
  const entityPopupRef = useRef(null);
  const subPopupRef = useRef(null);

  const handleClickOutside = useCallback((event) => {
    if (
      entityPopupRef.current &&
      !entityPopupRef.current.contains(event.target) &&
      (!subPopupRef.current || !subPopupRef.current.contains(event.target))
    ) {
      setPopup({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
    }
    if (subPopupRef.current && !subPopupRef.current.contains(event.target)) {
      setSubPopup({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
    }
  }, []);

  const showPopup = useCallback((e, entityOrAttribute, type, schema, questionContainerRef) => {
    // Validate type parameter
    if (!['entity', 'attribute', 'method'].includes(type)) {
      console.warn(`Invalid popup type: ${type}. Using default 'entity'.`);
      type = 'entity';
    }
    
    // Log for debugging
    console.log(`Showing popup for: ${entityOrAttribute}, Type: ${type}`);
    
    if (e.preventDefault) e.preventDefault(); 
    const rect = e.target ? e.target.getBoundingClientRect() : { left: 0, bottom: 0, right: 0, top: 0 };
    const questionContainerRect = questionContainerRef.current.getBoundingClientRect();
    const popupWidth = 200;
    const popupHeight = 100;
    let x = rect.left - questionContainerRect.left;
    let y = rect.bottom - questionContainerRect.top + window.scrollY;

    // Make sure schema is available
    const entities = schema && typeof schema.keys === 'function' 
      ? Array.from(schema.keys()) 
      : [];

    setPopup({
      visible: true,
      x,
      y,
      entityOrAttribute,
      type, // Store the type which will determine which form to show
      entities,
    });
  }, []);

  const hidePopup = () => {
    setPopup({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
    setSubPopup({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
  };

  const adjustPopupPosition = (x, y, popupWidth, popupHeight, questionContainerRef) => {
    const questionContainerRect = questionContainerRef.current.getBoundingClientRect();
    if (x + popupWidth > questionContainerRect.right - questionContainerRect.left) {
      x = questionContainerRect.right - questionContainerRect.left - popupWidth - 10;
    }
    if (y + popupHeight > questionContainerRect.bottom - questionContainerRect.top) {
      y = questionContainerRect.bottom - questionContainerRect.top - popupHeight - 10;
    }
    return { x, y };
  };

  // New function to determine if a method popup should be shown
  const isMethodPopup = () => {
    return popup.visible && popup.type === 'method';
  };

  // New function to determine if an entity popup should be shown
  const isEntityPopup = () => {
    return popup.visible && popup.type === 'entity';
  };

  // New function to determine if an attribute popup should be shown
  const isAttributePopup = () => {
    return popup.visible && popup.type === 'attribute';
  };

  return {
    popup,
    subPopup,
    entityPopupRef,
    subPopupRef,
    handleClickOutside,
    showPopup,
    hidePopup,
    adjustPopupPosition,
    setPopup,
    setSubPopup,
    isMethodPopup,
    isEntityPopup,
    isAttributePopup
  };
};