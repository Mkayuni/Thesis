# Interactive UML Teaching Framework

![UML Teaching Framework](https://img.shields.io/badge/UML-Teaching%20Framework-blue)
![Version](https://img.shields.io/badge/version-1.0.0--alpha-orange)
![License](https://img.shields.io/badge/license-MIT-green)

> A dual-approach framework for teaching object-oriented design through UML class diagrams.

## 🚀 Overview

This project implements an interactive educational framework designed to teach object-oriented design principles through UML class diagrams. The framework features two complementary approaches:

- **Code-Based Generation**: Automatically transforms Java/Python code into UML diagrams
- **Direct Diagram Manipulation**: Allows building diagrams by interacting with highlighted terms in problem descriptions

## ✨ Key Features

- **Interactive UML Diagram Creation**: Click on highlighted terms to add diagram elements
- **Code Parsing**: Extracts classes, methods, attributes, and relationships from source code
- **Real-time Feedback**: Immediate assessment against reference solutions
- **Bi-directional Learning**: Connects visual design with code implementation
- **Pan & Zoom Navigation**: Intuitive diagram exploration

## 🛠️ Technical Architecture

### Frontend (React)
- **MermaidDiagram**: Core component for rendering and manipulating UML diagrams
- **CodeWorkbench**: Interface for writing and parsing code
- **RelationshipManager**: Tool for creating and editing relationships between entities

### Backend (Flask)
- **Code Parsing API**: Processes Java and Python code
- **Assessment Engine**: Evaluates diagrams against reference solutions
- **Question Management**: Handles storage and retrieval of exercises

## 📋 Getting Started

> Note: This is a preliminary guide. A comprehensive setup guide will be available when the project is complete.

### Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- Flask
- React

### Installation

```bash
# Clone the repository
git clone https://github.com/username/mermaid-project.git

# Navigate to project directory
cd Thesis/research/mermaid-project

# Install dependencies
npm install

# Start the development server
npm start
```

## 🏛️ Project Structure

```
Thesis/
└── research/
    └── mermaid-project/
        ├── node_modules/      # Node.js dependencies
        ├── public/            # Static files
        ├── src/
        │   ├── components/
        │   │   ├── containers/    # Container components
        │   │   ├── entityManager/ # Entity management tools
        │   │   ├── mermaidDiagram/# UML diagram rendering
        │   │   ├── methods/       # Method handling
        │   │   ├── monacoWrapper/ # Code editor integration
        │   │   ├── questionSetup/ # Question configuration
        │   │   ├── relationshipManager/ # Relationship tools
        │   │   ├── ui/            # UI components
        │   │   └── xgrading/      # Grading system
        │   │       ├── instance/      # Instance management
        │   │       ├── migrations/    # Data migrations
        │   │       ├── Questions/     # Question database
        │   │       │   ├── Autoshop/  # Example questions
        │   │       │   ├── Banks/     # Example questions
        │   │       │   ├── Fish Store/# Example questions
        │   │       │   │   └── question.html
        │   │       │   └── University/# Example questions
        │   │       └── Submissions/   # Student submissions
        │   │           ├── Autoshop/
        │   │           ├── Fish Store/
        │   │           │   ├── Fish_Store_1741371805.json
        │   │           │   └── Fish_Store_1741374032.json
        │   │           └── University/
        │   ├── utils/
        │   │   ├── CodeWorkbench.js   # Code parsing tools
        │   │   ├── MermaidDiagramUtils.js  # Diagram utilities
        │   │   ├── mermaidUtils.js    # Mermaid integration
        │   │   ├── Popup.js           # Popup dialog utilities
        │   │   ├── popupUtils.js      # Popup helper functions
        │   │   └── usePopup.js        # Popup hooks
        │   ├── App.css
        │   ├── App.js                 # Main application component
        │   ├── index.css
        │   ├── index.js               # Application entry point
        │   └── theme.js               # Styling theme
        ├── server.js                  # Backend server
        ├── server.py                  # Python API server
        ├── package.json               # Project dependencies
        └── package-lock.json          # Dependency lock file
```

## 🧪 Running Tests

```bash
# Run frontend tests
npm test

# Start development environment
npm start
```

## 🙏 Acknowledgments

- Built on the [Mermaid](https://github.com/mermaid-js/mermaid) diagramming framework by Knut Sveidqvist
- Inspired by research in computer science education and cognitive load theory
- Thanks to Western Kentucky University for supporting this research

## 📃 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

⭐ **Project Status**: Under active development as part of a thesis at Western Kentucky University
