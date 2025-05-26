import { ClaudeCode } from 'claude-code-js';

/**
 * Traveling Salesman Problem using Genetic Algorithm with claude-code-js
 * 
 * This example demonstrates a more appropriate use of genetic algorithms:
 * finding optimal routes between cities where exhaustive search is impractical.
 * Each genome (session) represents a different route strategy that evolves.
 */

class TravelingSalesmanGA {
  constructor(claude, cities, populationSize = 6) {
    this.claude = claude;
    this.cities = cities;
    this.populationSize = populationSize;
    this.generation = 0;
    this.population = [];
    this.distanceMatrix = this.calculateDistanceMatrix();
  }

  calculateDistanceMatrix() {
    const matrix = {};
    for (const cityA of this.cities) {
      matrix[cityA.name] = {};
      for (const cityB of this.cities) {
        const dx = cityA.x - cityB.x;
        const dy = cityA.y - cityB.y;
        matrix[cityA.name][cityB.name] = Math.sqrt(dx * dx + dy * dy);
      }
    }
    return matrix;
  }

  async initialize() {
    console.log('🗺️  Initializing Traveling Salesman GA...\n');
    console.log('Cities to visit:');
    this.cities.forEach(city => {
      console.log(`  ${city.name} at (${city.x}, ${city.y})`);
    });
    
    const baseSession = await this.claude.newSession();
    
    // Explain the problem to Claude
    const cityList = this.cities.map(c => c.name).join(', ');
    await baseSession.prompt({
      prompt: `You are solving the Traveling Salesman Problem. 
        Cities: ${cityList}
        Task: Find the shortest route that visits all cities exactly once and returns to start.
        Suggest a route starting from ${this.cities[0].name} and ending on ${this.cities[0].name}. 
        Respond with ONLY the city names in order, separated by arrows (→)`,
      systemPrompt: 'You are a route optimization AI that suggests traveling salesman routes.'
    });

    // Create initial population with diverse strategies
    const strategies = [
      'nearest neighbor approach',
      'random shuffling',
      'geographical clustering',
      'spiral pattern',
      'zigzag pattern',
      'perimeter first approach'
    ];

    for (let i = 0; i < this.populationSize; i++) {
      const genome = baseSession.fork();
      const route = await genome.prompt({
        prompt: `Create a different route using a ${strategies[i % strategies.length]}. 
          Start from ${this.cities[0].name}, visit all cities once.
          Respond with ONLY the city names in order, separated by arrows (→).`
      });
      
      this.population.push({
        session: genome,
        route: route.result.trim(),
        fitness: null,
        distance: null,
        id: i
      });
    }

    console.log('\n📍 Initial population created:');
    this.population.forEach(genome => {
      console.log(`  Route ${genome.id}: ${genome.route}`);
    });
  }

  parseRoute(routeString) {
    const cities = routeString.split('→').map(city => city.trim());
    
    // If the route ends with the starting city, remove it
    // (TSP implies returning to start, no need to list it twice)
    if (cities.length > 1 && cities[cities.length - 1] === cities[0]) {
      cities.pop();
    }
    
    return cities;
  }

  calculateRouteDistance(route) {
    let totalDistance = 0;
    for (let i = 0; i < route.length; i++) {
      const from = route[i];
      const to = route[(i + 1) % route.length]; // Loop back to start
      if (this.distanceMatrix[from] && this.distanceMatrix[from][to]) {
        totalDistance += this.distanceMatrix[from][to];
      } else {
        return Infinity; // Invalid city
      }
    }
    return totalDistance;
  }

  async evaluateFitness() {
    console.log('\n📊 Evaluating route fitness...');
    
    for (const genome of this.population) {
      const route = this.parseRoute(genome.route);
      
      // Check if route is valid (visits all cities once)
      const uniqueCities = new Set(route);
      const cityNames = this.cities.map(c => c.name);
      const invalidCities = route.filter(city => !cityNames.includes(city));
      
      if (invalidCities.length > 0) {
        genome.distance = Infinity;
        genome.fitness = 0;
      } else if (uniqueCities.size !== this.cities.length) {
        genome.distance = Infinity;
        genome.fitness = 0;
      } else {
        genome.distance = this.calculateRouteDistance(route);
        genome.fitness = genome.distance === Infinity ? 0 : 1000 / genome.distance;
      }
    }

    // Sort by fitness (best first)
    this.population.sort((a, b) => b.fitness - a.fitness);
    
    console.log('Route distances:');
    this.population.forEach(genome => {
      const dist = genome.distance === Infinity ? 'Invalid' : genome.distance.toFixed(2);
      console.log(`  Route ${genome.id}: ${dist} units (fitness: ${genome.fitness.toFixed(2)})`);
    });
  }

  async evolve() {
    console.log(`\n🔄 Generation ${++this.generation}`);
    
    // Keep the best routes
    const survivors = this.population.slice(0, Math.floor(this.populationSize / 2));
    console.log(`✅ Best routes: ${survivors.map(g => g.id).join(', ')}`);
    
    const newPopulation = [...survivors];
    
    // Create offspring through crossover and mutation
    for (let i = 0; i < this.populationSize - survivors.length; i++) {
      const parent1 = survivors[i % survivors.length];
      const parent2 = survivors[(i + 1) % survivors.length];
      const offspring = parent1.session.fork();
      
      const mutatedRoute = await offspring.prompt({
        prompt: `Parent routes:
          Route 1: ${parent1.route} (distance: ${parent1.distance.toFixed(2)})
          Route 2: ${parent2.route} (distance: ${parent2.distance.toFixed(2)})
          
          Create a new route by combining good segments from both parents.
          You can: swap city segments, reverse sub-routes, or shift positions.
          Ensure all cities are visited exactly once starting from ${this.cities[0].name}.
          Respond with ONLY the city names in order, separated by arrows (→).`
      });
      
      newPopulation.push({
        session: offspring,
        route: mutatedRoute.result.trim(),
        fitness: null,
        distance: null,
        id: this.population.length + i
      });
    }
    
    this.population = newPopulation;
    
    console.log('\nNew routes:');
    this.population.forEach((genome, idx) => {
      if (idx >= survivors.length) {
        console.log(`  Route ${genome.id}: ${genome.route} (new)`)
      }
    });
  }

  async run(generations = 8) {
    await this.initialize();
    
    let bestDistance = Infinity;
    let stagnantGenerations = 0;
    
    for (let gen = 0; gen < generations; gen++) {
      await this.evaluateFitness();
      
      // Check for improvement
      if (this.population[0].distance < bestDistance) {
        bestDistance = this.population[0].distance;
        stagnantGenerations = 0;
      } else {
        stagnantGenerations++;
      }
      
      // Early stopping if no improvement
      if (stagnantGenerations >= 3) {
        console.log('\n🛑 No improvement for 3 generations. Stopping.');
        break;
      }
      
      if (gen < generations - 1) {
        await this.evolve();
      }
    }
    
    // Final results
    console.log('\n🏆 Final Results:');
    console.log(`Best route: ${this.population[0].route}`);
    console.log(`Total distance: ${this.population[0].distance.toFixed(2)} units`);
    console.log(`Fitness score: ${this.population[0].fitness.toFixed(2)}`);
    
    // Visualize the route
    console.log('\n🗺️  Route visualization:');
    const bestRoute = this.parseRoute(this.population[0].route);
    for (let i = 0; i < bestRoute.length; i++) {
      const city = this.cities.find(c => c.name === bestRoute[i]);
      const nextCity = this.cities.find(c => c.name === bestRoute[(i + 1) % bestRoute.length]);
      const distance = this.distanceMatrix[city.name][nextCity.name];
      console.log(`  ${city.name} → ${nextCity.name}: ${distance.toFixed(2)} units`);
    }
  }
}

// Main execution
async function main() {
  console.log('🧬 Traveling Salesman Problem with Genetic Algorithm\n');
  console.log('This demonstrates a problem where genetic algorithms truly shine:');
  console.log('finding near-optimal routes when exhaustive search is impractical.\n');
  
  const claude = new ClaudeCode();
  
  // Define cities with coordinates
  const cities = [
    { name: 'New York', x: 0, y: 0 },
    { name: 'Boston', x: 2, y: 3 },
    { name: 'Philadelphia', x: -1, y: -2 },
    { name: 'Washington DC', x: -2, y: -4 },
    { name: 'Baltimore', x: -1.5, y: -3 },
    { name: 'Newark', x: 0.5, y: 0.5 },
    { name: 'Hartford', x: 1.5, y: 2 },
    { name: 'Providence', x: 2.5, y: 2.5 }
  ];
  
  const ga = new TravelingSalesmanGA(claude, cities, 8);
  await ga.run(10);
  
  console.log('\n✨ Evolution complete!');
}

main().catch(console.error);