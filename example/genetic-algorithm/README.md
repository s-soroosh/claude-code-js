# Genetic Algorithm Example - Traveling Salesman Problem

This example demonstrates how to use `claude-code-js` session forking to implement a genetic algorithm for solving the Traveling Salesman Problem (TSP).

## Why This Example?

The Traveling Salesman Problem is an ideal demonstration of genetic algorithms because:
- It's NP-hard - exhaustive search becomes impractical even with modest city counts
- It benefits from parallel exploration of different solution strategies
- Crossover operations (combining routes) make intuitive sense
- It's a real-world optimization problem

## How It Works

### 1. **Population Initialization**
- Creates a base Claude session that understands the TSP problem
- Forks the session to create multiple "genomes" (route strategies)
- Each genome explores a different approach (nearest neighbor, clustering, etc.)

### 2. **Fitness Evaluation**
- Calculates the total distance for each route
- Assigns fitness scores inversely proportional to distance
- Invalid routes (missing cities) receive zero fitness

### 3. **Natural Selection**
- The best-performing routes survive to the next generation
- Poor performers are eliminated from the population

### 4. **Evolution Through Forking**
- Survivor sessions are forked to create offspring
- Claude combines good segments from parent routes through crossover
- Mutations introduce variations to explore new possibilities

### 5. **Convergence**
- Process repeats until finding near-optimal solutions
- Early stopping when no improvement for multiple generations

## Key Features Demonstrated

- **Session Forking**: Each route is a separate Claude session maintaining its own context
- **Parallel Evolution**: Multiple solution branches evolve simultaneously
- **Intelligent Crossover**: Claude understands route structure and creates meaningful combinations
- **Heuristic Selection**: Distance-based fitness guides evolution toward better solutions

## Running the Example

```bash
# Install dependencies
npm install

# Run the genetic algorithm
npm start
```

## Example Output

```
🧬 Traveling Salesman Problem with Genetic Algorithm

🗺️  Initializing Traveling Salesman GA...

Cities to visit:
  New York at (0, 0)
  Boston at (2, 3)
  Philadelphia at (-1, -2)
  Washington DC at (-2, -4)
  Baltimore at (-1.5, -3)
  Newark at (0.5, 0.5)
  Hartford at (1.5, 2)
  Providence at (2.5, 2.5)

📍 Initial population created:
  Route 0: New York → Newark → Hartford → Boston → Providence → Philadelphia → Baltimore → Washington DC
  Route 1: New York → Philadelphia → Baltimore → Washington DC → Newark → Hartford → Boston → Providence
  ...

📊 Evaluating route fitness...
Route distances:
  Route 0: 18.52 units (fitness: 54.00)
  Route 3: 19.37 units (fitness: 51.62)
  ...

🔄 Generation 1
✅ Best routes: 0, 3, 5

[... evolution continues ...]


🏆 Final Results:
Best route: New York → Newark → Hartford → Boston → Providence → Philadelphia → Baltimore → Washington DC → New York
Total distance: 16.74 units
Fitness score: 59.72

🗺️  Route visualization:
  New York → Newark: 0.71 units
  Newark → Hartford: 1.80 units
  Hartford → Boston: 1.12 units
  Boston → Providence: 0.71 units
  Providence → Philadelphia: 5.70 units
  Philadelphia → Baltimore: 1.12 units
  Baltimore → Washington DC: 1.12 units
  Washington DC → New York: 4.47 units

```

## Understanding the Code

The implementation showcases several important concepts:

1. **Session Management**: Each genome maintains conversation history about its route strategy
2. **Prompt Engineering**: Claude receives structured prompts to perform crossover operations
3. **Fitness Heuristics**: Simple distance-based evaluation guides selection
4. **Early Stopping**: Prevents unnecessary computation when converged

## Customization

You can modify:
- `cities`: Add more cities or change coordinates
- `populationSize`: Larger populations explore more possibilities
- `generations`: Maximum evolution cycles
- Selection pressure and mutation rates
- Early stopping criteria