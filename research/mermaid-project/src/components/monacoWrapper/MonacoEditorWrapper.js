// src/monacoWrapper/MonacoEditorWrapper.js
import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

const MonacoEditorWrapper = (props) => {
  const containerRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  
  // Only mount the editor after a small delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle ResizeObserver errors
  useEffect(() => {
    // Create a global error handler specifically for ResizeObserver errors
    const originalOnError = window.onerror;
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      if (msg.toString().includes('ResizeObserver') || 
          (error && error.message && error.message.includes('ResizeObserver'))) {
        return true; // Suppress ResizeObserver errors
      }
      return originalOnError ? originalOnError(msg, url, lineNo, columnNo, error) : false;
    };
    
    return () => {
      window.onerror = originalOnError;
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: props.height,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {mounted && <Editor {...props} height="100%" />}
    </div>
  );
};

export default MonacoEditorWrapper;