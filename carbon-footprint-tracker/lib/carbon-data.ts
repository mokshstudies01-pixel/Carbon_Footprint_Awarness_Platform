/**
 * carbon-data.ts
 * ----------------------------------------------------------------------------
 * Static, client-side emission factor datasets + strict domain types and the
 * baseline footprint math. Keeping all of this in one typed module means the
 * calculation engine runs instantly in the browser with zero network calls.
 *
 * Emission factors below are approximate annualized averages expressed in
 * kg CO2e (carbon-dioxide-equivalent). Sources are simplified from public
 * lifecycle datasets (EPA / Our World in Data) and rounded for clarity.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type EffortLevel = "Low" | "Medium" | "High"

export type ActionCategory = "Food" | "Transport" | "Home" | "Goods"

/** A single committable micro-action shown in the Reduce catalog. */
export interface Action {
  id: string
  title: string
  description: string
  category: ActionCategory
  /** Carbon avoided per month, kg CO2e. */
  monthlySavingsKg: number
  effort: EffortLevel
}

export type DietType = "heavy-meat" | "average" | "low-meat" | "vegetarian" | "vegan"
export type CommuteType = "car-petrol" | "car-electric" | "public-transit" | "bike-walk" | "remote"

/** Raw answers captured by the onboarding quiz. */
export interface QuizAnswers {
  diet: DietType
  commute: CommuteType
  /** Weekly commute distance in miles (one-way trips summed for the week). */
  weeklyMiles: number
  /** Number of round-trip flights per year. */
  flightsPerYear: number
  /** Household size used to amortize shared home energy. */
  householdSize: number
}

/** A lifestyle archetype the user is mapped to after the quiz. */
export interface UserPersona {
  id: string
  name: string
  blurb: string
}

/** Fully derived footprint snapshot for the dashboard. */
export interface FootprintData {
  /** Per-category annual emissions, kg CO2e. */
  breakdown: Record<"food" | "transport" | "flights" | "home", number>
  /** Total annual emissions, kg CO2e. */
  annualKg: number
  /** Convenience monthly figure, kg CO2e. */
  monthlyKg: number
  persona: UserPersona
}

/* -------------------------------------------------------------------------- */
/* Emission factor datasets                                                   */
/* -------------------------------------------------------------------------- */

/** Annual dietary footprint by diet type (kg CO2e / year). */
const DIET_FACTORS: Record<DietType, number> = {
  "heavy-meat": 3300,
  average: 2500,
  "low-meat": 1900,
  vegetarian: 1700,
  vegan: 1500,
}

/** Per-mile emission factor for commuting modes (kg CO2e / mile). */
const COMMUTE_FACTORS: Record<CommuteType, number> = {
  "car-petrol": 0.36,
  "car-electric": 0.1,
  "public-transit": 0.14,
  "bike-walk": 0,
  remote: 0,
}

/** Average emissions per round-trip flight (kg CO2e / flight). */
const FLIGHT_FACTOR = 900

/** Baseline annual home energy per person before household amortization. */
const HOME_BASE = 1600

/* -------------------------------------------------------------------------- */
/* Personas                                                                   */
/* -------------------------------------------------------------------------- */

const PERSONAS: Record<string, UserPersona> = {
  jetsetter: {
    id: "jetsetter",
    name: "The Jetsetter",
    blurb: "Frequent flights dominate your footprint. Grounding even one trip a year moves the needle hard.",
  },
  commuter: {
    id: "commuter",
    name: "The Urban Commuter",
    blurb: "Daily travel is your biggest lever. Shifting modes or trimming miles compounds fast.",
  },
  homebody: {
    id: "homebody",
    name: "The Homebody",
    blurb: "Home energy and food shape most of your impact. Efficiency wins stack up here.",
  },
  foodie: {
    id: "foodie",
    name: "The Food-First Liver",
    blurb: "What's on your plate carries the most weight. Small dietary swaps deliver outsized payoffs.",
  },
  steward: {
    id: "steward",
    name: "The Low-Impact Steward",
    blurb: "You're already well below average. Fine-tuning habits keeps you ahead of the curve.",
  },
}

/* -------------------------------------------------------------------------- */
/* Calculation engine                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Computes a full annual footprint from quiz answers.
 *
 * Baseline math (all values kg CO2e):
 *   food      = DIET_FACTORS[diet]
 *   transport = weeklyMiles * 52 weeks * COMMUTE_FACTORS[commute]
 *   flights   = flightsPerYear * FLIGHT_FACTOR
 *   home      = HOME_BASE / max(1, householdSize)   // shared energy is split
 *   annual    = food + transport + flights + home
 *
 * The persona is the single largest contributing category, with a special
 * "steward" case when the total lands well under the ~5000 kg average.
 */
export function calculateFootprint(answers: QuizAnswers): FootprintData {
  const food = DIET_FACTORS[answers.diet]
  const transport = answers.weeklyMiles * 52 * COMMUTE_FACTORS[answers.commute]
  const flights = answers.flightsPerYear * FLIGHT_FACTOR
  const home = HOME_BASE / Math.max(1, answers.householdSize)

  const breakdown = {
    food: Math.round(food),
    transport: Math.round(transport),
    flights: Math.round(flights),
    home: Math.round(home),
  }
  const annualKg = breakdown.food + breakdown.transport + breakdown.flights + breakdown.home

  return {
    breakdown,
    annualKg,
    monthlyKg: Math.round(annualKg / 12),
    persona: derivePersona(breakdown, annualKg),
  }
}

/** Maps the dominant emission category to a lifestyle persona. */
function derivePersona(breakdown: FootprintData["breakdown"], annualKg: number): UserPersona {
  // Well below the ~5000 kg average annual footprint => steward.
  if (annualKg < 4000) return PERSONAS.steward

  const dominant = (Object.entries(breakdown) as [keyof typeof breakdown, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0]

  switch (dominant) {
    case "flights":
      return PERSONAS.jetsetter
    case "transport":
      return PERSONAS.commuter
    case "home":
      return PERSONAS.homebody
    case "food":
    default:
      return PERSONAS.foodie
  }
}

/* -------------------------------------------------------------------------- */
/* Relatable equivalence helpers                                              */
/* -------------------------------------------------------------------------- */

/**
 * Translates abstract kg CO2e into tangible ecological equivalents so progress
 * feels real. Conversion constants are widely cited public approximations.
 */
export function toEquivalents(kgCo2: number) {
  return {
    // A mature tree sequesters ~21 kg CO2 per year.
    trees: kgCo2 / 21,
    // ~0.082 kg CO2 is embodied per single-use plastic bottle (production).
    bottles: kgCo2 / 0.082,
    // Average passenger car emits ~0.4 kg CO2 per mile driven.
    carMiles: kgCo2 / 0.4,
    // A typical smartphone charge is ~0.005 kg CO2.
    phoneCharges: kgCo2 / 0.005,
  }
}

/* -------------------------------------------------------------------------- */
/* Micro-action catalog                                                       */
/* -------------------------------------------------------------------------- */

export const ACTIONS: Action[] = [
  {
    id: "leds",
    title: "Switch to LED Bulbs",
    description: "Replace your most-used incandescent bulbs with LEDs that draw up to 80% less power.",
    category: "Home",
    monthlySavingsKg: 8,
    effort: "Low",
  },
  {
    id: "meatless-monday",
    title: "Meatless Monday",
    description: "Swap one meat-heavy day a week for plant-based meals to cut dietary emissions.",
    category: "Food",
    monthlySavingsKg: 14,
    effort: "Low",
  },
  {
    id: "line-dry",
    title: "Line Dry Clothes",
    description: "Skip the tumble dryer and air-dry laundry to eliminate a major appliance load.",
    category: "Home",
    monthlySavingsKg: 12,
    effort: "Medium",
  },
  {
    id: "thermostat",
    title: "Adjust the Thermostat 2°",
    description: "Nudge heating down or cooling up by two degrees to trim home energy use.",
    category: "Home",
    monthlySavingsKg: 18,
    effort: "Low",
  },
  {
    id: "transit-commute",
    title: "Commute by Transit Twice Weekly",
    description: "Leave the car home two days a week in favor of buses or trains.",
    category: "Transport",
    monthlySavingsKg: 30,
    effort: "Medium",
  },
  {
    id: "shorter-showers",
    title: "Shorter, Cooler Showers",
    description: "Trim five minutes and lower the temperature to save heated water energy.",
    category: "Home",
    monthlySavingsKg: 9,
    effort: "Low",
  },
  {
    id: "no-beef",
    title: "Cut Beef From Your Diet",
    description: "Beef is the most carbon-intensive protein. Replacing it has an outsized payoff.",
    category: "Food",
    monthlySavingsKg: 40,
    effort: "High",
  },
  {
    id: "local-seasonal",
    title: "Buy Local & Seasonal Produce",
    description: "Reduce transport and storage emissions by shopping in-season and nearby.",
    category: "Food",
    monthlySavingsKg: 7,
    effort: "Low",
  },
  {
    id: "unplug",
    title: "Eliminate Phantom Power",
    description: "Use smart power strips to cut standby draw from idle electronics.",
    category: "Home",
    monthlySavingsKg: 6,
    effort: "Low",
  },
  {
    id: "carpool",
    title: "Carpool the School Run",
    description: "Share rides for recurring trips to halve the per-person travel footprint.",
    category: "Transport",
    monthlySavingsKg: 22,
    effort: "Medium",
  },
  {
    id: "secondhand",
    title: "Buy One Item Secondhand",
    description: "Choosing pre-owned goods avoids the embodied carbon of new manufacturing.",
    category: "Goods",
    monthlySavingsKg: 11,
    effort: "Low",
  },
  {
    id: "offset-flight",
    title: "Replace One Flight With Rail",
    description: "Swap a short-haul flight for rail travel to slash trip emissions dramatically.",
    category: "Transport",
    monthlySavingsKg: 55,
    effort: "High",
  },
]
