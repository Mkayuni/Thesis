```mermaid
classDiagram
class Fish {
  -id: String (PK)
  -weight: String 
  -color: String 
  + addFish(Fish: fish): void
  + static addWeight(Weight: weight): int
}
