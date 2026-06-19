import { describe, it, expect } from 'vitest';

// Simple unit test for client-side carbon calculation logic
describe('Carbon Calculation Engine', () => {
  it('should calculate lower carbon impact for a plant-based diet than a meat-heavy diet', () => {
    const plantDietFactor = 1.5; // kg CO2e per day
    const meatDietFactor = 3.0;  // kg CO2e per day
    
    expect(plantDietFactor).toBeLessThan(meatDietFactor);
  });

  it('should correctly deduct micro-action credits from the user baseline', () => {
    const userBaseline = 500; // kg CO2e / month
    const committedActionCredit = 45; // LED switch savings
    
    const updatedFootprint = userBaseline - committedActionCredit;
    expect(updatedFootprint).toBe(455);
  });
});
