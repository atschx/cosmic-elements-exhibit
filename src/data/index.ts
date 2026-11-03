/**
 * Typed entry point for every dataset. Components and the model layer import from here;
 * nothing else should reach into the JSON files directly.
 */
import atmosphereJson from './abundance/atmosphere.json';
import crustJson from './abundance/crust.json';
import humanJson from './abundance/human.json';
import oceanJson from './abundance/ocean.json';
import solarLogEpsJson from './abundance/solar-logeps.json';
import categoriesJson from './categories.json';
import domainsJson from './domains.json';
import elementsJson from './elements.json';
import essentialJson from './essential.json';
import {
  parseCategories,
  parseDomains,
  parseElements,
  parseEssential,
  parseStages,
  parseSymbolTable,
} from './schema';
import stagesJson from './stages.json';
import type { PpmTable, SymbolTable } from './types';

export * from './types';

export const categories = parseCategories(categoriesJson);
export const stages = parseStages(stagesJson);
export const elements = parseElements(elementsJson);
export const domains = parseDomains(domainsJson);
export const essentialSymbols = parseEssential(essentialJson);

export const solarLogEps: SymbolTable = parseSymbolTable(solarLogEpsJson, 'solar-logeps.json');
export const ppmTables: Readonly<Record<PpmTable, SymbolTable>> = {
  crust: parseSymbolTable(crustJson, 'crust.json'),
  atmosphere: parseSymbolTable(atmosphereJson, 'atmosphere.json'),
  ocean: parseSymbolTable(oceanJson, 'ocean.json'),
  human: parseSymbolTable(humanJson, 'human.json'),
};
