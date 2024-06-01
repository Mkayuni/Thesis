# Mermaid Diagram

```mermaid
graph TD;
  A[Start] --> B{Decision 1};
  B -->|Yes| C[Process 1];
  B -->|No| D[Process 2];
  C --> E[Process 3];
  D --> E;
  E --> F{Decision 2};
  F -->|Yes| G[Process 4];
  F -->|No| H[Process 5];
  G --> I[Process 6];
  H --> I;
  I --> J{Decision 3};
  J -->|Yes| K[Process 7];
  J -->|No| L[Process 8];
  K --> M[End];
  L --> M;
  subgraph Cluster1
    C --> N[Sub-process 1];
    N --> O[Sub-process 2];
  end
  subgraph Cluster2
    H --> P[Sub-process 3];
    P --> Q[Sub-process 4];
  end
  Q --> R[Process 9];
  R --> M;
