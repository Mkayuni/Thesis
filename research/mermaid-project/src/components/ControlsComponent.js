import React, { useState, useRef, useEffect } from 'react';
import {
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Box,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const Container = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: '#ffffff',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[4],
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  width: '100%',
}));

const ControlsComponent = ({ setQuestionMarkdown, questions, setQuestions, onQuestionClick }) => {
  const [showTextBox, setShowTextBox] = useState(false);
  const [tempQuestion, setTempQuestion] = useState('');
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    console.log("Questions updated:", questions);
  }, [questions]);

  const handleQuestionSubmit = () => {
    if (tempQuestion.trim()) {
      setQuestions((prev) => [...prev, tempQuestion]);
      setTempQuestion('');
      setShowTextBox(false);
    }
  };

  const handleDeleteQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Question Bank
        </Typography>
        <Tooltip title="Add a new question">
          <IconButton color="primary" onClick={() => setShowTextBox(!showTextBox)}>
            <AddCircleOutlineIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {showTextBox && (
        <Box>
          <TextField
            inputRef={inputRef}
            placeholder="Enter your question..."
            value={tempQuestion}
            onChange={(e) => setTempQuestion(e.target.value)}
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            sx={{ backgroundColor: '#fafafa', borderRadius: 1 }}
          />
          <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleQuestionSubmit}>
            Submit Question
          </Button>
        </Box>
      )}

      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Saved Questions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {questions.length === 0 ? (
              <Typography variant="body2" color="textSecondary">No questions added yet.</Typography>
            ) : (
              questions.map((question, index) => (
                <ListItem key={index} button onClick={() => onQuestionClick(question)} divider>
                  <ListItemText primary={question} />
                  <ListItemSecondaryAction>
                    <Tooltip title="Delete this question">
                      <IconButton edge="end" onClick={() => handleDeleteQuestion(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Container>
  );
};

export default ControlsComponent;
