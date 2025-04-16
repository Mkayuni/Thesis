import React from 'react';

const UMLAssessmentDisplay = ({ assessmentData }) => {
  // If no data is provided, show a loading state
  if (!assessmentData) {
    return <div style={{ padding: '16px', textAlign: 'center', color: 'white' }}>Loading assessment...</div>;
  }

  // Parse score
  const scoreValue = typeof assessmentData.score === 'number' 
    ? assessmentData.score 
    : parseFloat(assessmentData.score || '0');

  // Function to parse the feedback text into structured data
  const parseFeedback = (feedback) => {
    if (!feedback) return [];
    
    const lines = feedback.split('\n');
    const sections = [];
    let currentSection = null;
    
    for (const line of lines) {
      // Section headers (e.g., "#### Entity Assessment: 0.3/1.6 (18.8%)")
      if (line.startsWith('#### ')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        const headerMatch = line.match(/#### (.*?): ([\d.]+)\/([\d.]+) \(([\d.]+)%\)/);
        if (headerMatch) {
          currentSection = {
            title: headerMatch[1],
            score: `${headerMatch[2]}/${headerMatch[3]}`,
            percentage: parseFloat(headerMatch[4]),
            items: []
          };
        } else {
          currentSection = {
            title: line.replace('#### ', ''),
            score: "N/A",
            percentage: 0,
            items: []
          };
        }
      } 
      // List items (e.g., "- ✓ Found required entity: tank")
      else if (line.startsWith('- ') && currentSection) {
        const itemText = line.substring(2);
        let type = "info";
        
        if (itemText.startsWith('✓')) {
          type = "success";
        } else if (itemText.startsWith('✗')) {
          type = "error";
        } else if (itemText.startsWith('!')) {
          type = "warning";
        }
        
        currentSection.items.push({
          type,
          text: itemText.replace(/^[✓✗!]\s*/, '') // Remove the icon prefix
        });
      }
      // Summary section
      else if (line.startsWith('### Summary Feedback') && currentSection) {
        sections.push(currentSection);
        currentSection = {
          title: "Summary Feedback",
          isSummary: true,
          items: [],
          summaryText: ""
        };
      }
      // Add text to summary
      else if (currentSection && currentSection.isSummary && line.trim() !== '') {
        currentSection.summaryText += line + " ";
      }
    }
    
    // Add the last section if it exists
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  // Parse the feedback into structured sections
  const parsedSections = parseFeedback(assessmentData.feedback);

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '100%',
      backgroundColor: '#1a1a1a',
      color: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header with score - moved score to the left side to avoid overlap with close button */}
      <div style={{
        padding: '16px',
        backgroundColor: '#2a2a2a',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          margin: 0,
          marginRight: '16px'
        }}>UML Diagram Assessment</h2>
        
        {/* Score indicator now directly next to the title */}
        <div style={{
          backgroundColor: scoreValue >= 80 ? '#4caf50' : 
                          scoreValue >= 60 ? '#ff9800' : '#f44336',
          color: 'white',
          borderRadius: '20px',
          padding: '6px 12px',
          fontWeight: 'bold'
        }}>
          {scoreValue}%
        </div>
      </div>

      {/* Assessment sections */}
      <div style={{ padding: '16px' }}>
        {parsedSections.map((section, index) => {
          // Skip summary sections here
          if (section.isSummary) return null;
          
          return (
            <div key={index} style={{
              marginBottom: '24px',
              backgroundColor: '#2a2a2a',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {/* Section header with score */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#333',
                padding: '12px 16px',
              }}>
                <h3 style={{ 
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}>{section.title}</h3>
                
                <div style={{
                  backgroundColor: section.percentage >= 80 ? '#388e3c' : 
                                  section.percentage >= 60 ? '#f57c00' : '#d32f2f',
                  color: 'white',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '0.875rem',
                  fontWeight: 'medium'
                }}>
                  {section.score} ({section.percentage}%)
                </div>
              </div>
              
              {/* Section items */}
              <div style={{ padding: '16px' }}>
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: item.type === "success" ? '#388e3c' : 
                                       item.type === "error" ? '#d32f2f' : 
                                       item.type === "warning" ? '#f57c00' : '#1976d2',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: '12px',
                      flexShrink: 0,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'white'
                    }}>
                      {item.type === "success" ? "✓" : 
                       item.type === "error" ? "✗" : 
                       item.type === "warning" ? "!" : "i"}
                    </div>
                    
                    <div style={{
                      color: item.type === "success" ? '#81c784' : 
                            item.type === "error" ? '#e57373' : 
                            item.type === "warning" ? '#ffb74d' : '#64b5f6',
                      fontSize: '1rem'
                    }}>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary feedback */}
      {parsedSections.find(section => section.isSummary) && (
        <div style={{
          padding: '16px',
          backgroundColor: '#2a2a2a',
          borderTop: '1px solid #333'
        }}>
          <h3 style={{ 
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '12px'
          }}>Summary Feedback</h3>
          
          <p style={{ 
            color: '#ccc',
            lineHeight: '1.5' 
          }}>
            {parsedSections.find(section => section.isSummary).summaryText}
          </p>
        </div>
      )}
    </div>
  );
};

export default UMLAssessmentDisplay;