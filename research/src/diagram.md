# Mermaid Diagram

```mermaid
graph LR
  A[Start] --> B{Decision 1};
  B -->|Yes| C[Process 1];
  B -->|No| D[Process 2];
  C --> E{Decision 2};
  D --> F[Process 3];
  E -->|Yes| G[Process 4];
  E -->|No| H[Process 5];
  F --> E;
  G --> I[Process 6];
  H --> I;
  I --> J{Decision 3};
  J -->|Yes| K[Process 7];
  J -->|No| L[Process 8];
  K --> M[End];
  L --> M;

  subgraph ClusterChiso1
    C --> N[Sub-process 1];
    N --> O[Sub-process 2];
    O --> P[Sub-process 3];
  end

  subgraph CLusterChiso2
    H --> Q[Sub-process 4];
    Q --> R[Sub-process 5];
    R --> S[Sub-process 6];
  end

  subgraph NestedCluster
    P --> T[Sub-process 7];
    T --> U[Sub-process 8];
  end

  Q --> R[Process 9];
  R --> M;
  U --> V[Sub-process 9];
  V --> W[Sub-process 10];
  W --> X[Process 10];
  X --> Y[End Process];