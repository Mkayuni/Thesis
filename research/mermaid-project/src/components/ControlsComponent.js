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
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BookmarkIcon from '@mui/icons-material/Bookmark';

// Main container styled as an academic book
const BookContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(0),
  backgroundColor: '#fbf8f2', // Cream color similar to book pages
  borderRadius: '4px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25), 0 0 6px rgba(0, 0, 0, 0.05)', 
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  position: 'relative',
  backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0) 1%, rgba(0,0,0,0) 99%, rgba(0,0,0,0.03) 100%)',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    width: '20px',
    height: '100%',
    backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0))',
    zIndex: 1
  },
  overflow: 'hidden'
}));

// Book header (like a chapter heading)
const BookHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 4, 2, 4),
  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
  background: 'linear-gradient(to right, #54361a, #785e46)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

// Book pages content
const BookContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  minHeight: '400px',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '10px',
    bottom: 0,
    left: 0,
    backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 100%)'
  }
}));

// Academic-style accordion
const AcademicAccordion = styled(Accordion)(({ theme }) => ({
  background: 'transparent',
  boxShadow: 'none',
  '&::before': {
    display: 'none',
  },
  marginTop: theme.spacing(2)
}));

// Custom accordion summary
const AcademicAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  padding: theme.spacing(0),
  '& .MuiAccordionSummary-content': {
    margin: theme.spacing(1, 0)
  },
  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.02)'
  }
}));

// Question list item
const QuestionItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(2, 1),
  borderLeft: '3px solid transparent',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderLeft: `3px solid ${theme.palette.primary.main}`,
  },
  transition: 'all 0.2s ease',
}));

// Custom bookmark button
const BookmarkButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(-2),
  zIndex: 2,
  color: theme.palette.primary.main,
}));

// Add Question text field
const AcademicTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 0,
    borderBottom: '1px solid rgba(0, 0, 0, 0.23)',
    '&:hover': {
      borderBottom: '1px solid rgba(0, 0, 0, 0.87)',
    },
    '&.Mui-focused': {
      borderBottom: `2px solid ${theme.palette.primary.main}`,
    }
  }
}));

// Academic-style button
const AcademicButton = styled(Button)(({ theme }) => ({
  borderRadius: 0,
  padding: theme.spacing(1, 3),
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.95rem',
  boxShadow: 'none',
  '&:hover': {
    boxShadow: 'none',
  }
}));

const ControlsComponent = ({ setQuestionMarkdown, questions, setQuestions, onQuestionClick }) => {
  const [showTextBox, setShowTextBox] = useState(false);
  const [tempQuestion, setTempQuestion] = useState('');
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
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
    <BookContainer>
      <BookmarkButton size="large">
        <BookmarkIcon fontSize="large" color="primary" />
      </BookmarkButton>
      
      <BookHeader>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MenuBookIcon sx={{ mr: 2 }} />
          <Typography variant="h5" sx={{ fontFamily: 'Garamond, serif', fontWeight: 600, letterSpacing: 0.5 }}>
            Question Repository
          </Typography>
        </Box>
        <Tooltip title="Add a new question" placement="left">
          <IconButton color="inherit" onClick={() => setShowTextBox(!showTextBox)}>
            <AddCircleOutlineIcon />
          </IconButton>
        </Tooltip>
      </BookHeader>
      
      <BookContent>
        {showTextBox && (
          <Box sx={{ mb: 4, position: 'relative', p: 3, background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Typography variant="h6" sx={{ fontFamily: 'Garamond, serif', mb: 2, color: '#333' }}>
              Add New Question
            </Typography>
            <AcademicTextField
              inputRef={inputRef}
              placeholder="Enter your question..."
              value={tempQuestion}
              onChange={(e) => setTempQuestion(e.target.value)}
              multiline
              rows={3}
              fullWidth
              variant="outlined"
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <AcademicButton 
                variant="text" 
                onClick={() => setShowTextBox(false)} 
                sx={{ mr: 1, color: '#666' }}
              >
                Cancel
              </AcademicButton>
              <AcademicButton 
                variant="contained" 
                color="primary" 
                onClick={handleQuestionSubmit}
              >
                Add to Repository
              </AcademicButton>
            </Box>
          </Box>
        )}

        <AcademicAccordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
          <AcademicAccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              '&.Mui-expanded': { 
                minHeight: 'unset',
                borderBottom: '2px solid rgba(0, 0, 0, 0.5)'
              }
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: 'Garamond, serif',
                color: '#333',
                fontWeight: 500
              }}
            >
              Available Questions
            </Typography>
          </AcademicAccordionSummary>
          <AccordionDetails sx={{ p: 0, mt: 1 }}>
            {questions.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography 
                  variant="body1" 
                  color="textSecondary"
                  sx={{ fontStyle: 'italic', color: '#666' }}
                >
                  The repository is currently empty.
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {questions.map((question, index) => (
                  <React.Fragment key={index}>
                    <QuestionItem 
                      button 
                      onClick={() => onQuestionClick(question)}
                    >
                      <ListItemText 
                        primary={
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontFamily: 'Georgia, serif',
                              color: '#333',
                              fontWeight: 400,
                              fontSize: '0.95rem',
                              // Truncate long questions
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {question}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Remove from repository">
                          <IconButton 
                            edge="end" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuestion(index);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </QuestionItem>
                    {index < questions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </AccordionDetails>
        </AcademicAccordion>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: 'Georgia, serif', 
              color: '#666', 
              fontStyle: 'italic',
              fontSize: '0.85rem'
            }}
          >
            — Select a question to begin —
          </Typography>
        </Box>
      </BookContent>
    </BookContainer>
  );
};

export default ControlsComponent;