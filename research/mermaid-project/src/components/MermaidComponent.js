import React, { useEffect } from 'react';
import mermaid from 'mermaid';
import { Box, Button, Container, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const MermaidComponent = () => {
  useEffect(() => {
    mermaid.initialize({ startOnLoad: true });
  }, []);

  const fetchAndRenderUMLContent = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/convert_file');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      document.getElementById('question').innerHTML = `<p>${data.question}</p>`;
      document.getElementById('diagram').innerHTML = `<div class="mermaid">${data.mermaid_code}</div>`;
      mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    } catch (error) {
      console.error('Error fetching and rendering UML content:', error);
    }
  };

  const fetchAndRenderYAMLContent = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/convert_yaml_file');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      document.getElementById('diagram').innerHTML = `<div class="mermaid">${data.mermaid_code}</div>`;
      mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    } catch (error) {
      console.error('Error fetching and rendering YAML content:', error);
    }
  };

  const ButtonContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(4),
    gap: theme.spacing(2),
  }));

  return (
    <Container sx={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)' }}>
      <Typography variant="h4" sx={{ marginBottom: '16px', fontWeight: 'bold', color: '#0066ff' }}>
        Welcome to the Mermaid Project
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: '24px', color: '#333' }}>
        This is a test paragraph to ensure the HTML is being displayed correctly.
      </Typography>

      <ButtonContainer>
        <Button variant="contained" color="primary" onClick={fetchAndRenderUMLContent} sx={{ flex: 1 }}>
          Load UML Diagram
        </Button>
        <Button variant="contained" color="secondary" onClick={fetchAndRenderYAMLContent} sx={{ flex: 1 }}>
          Load YAML Diagram
        </Button>
      </ButtonContainer>

      <Box id="question" sx={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' }} />

      <Box id="diagram" sx={{ padding: '16px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' }} />
    </Container>
  );
};

export default MermaidComponent;
