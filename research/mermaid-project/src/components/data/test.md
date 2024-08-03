```mermaid
classDiagram
    class Fish {
        - tank: String
        - weight: Float
        - species: String (PK)
        + static addMango(fish: Fish): void
    }
