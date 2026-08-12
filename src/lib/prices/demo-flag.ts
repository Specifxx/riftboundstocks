// Its own module so lib/site.ts can re-export the flag without importing the
// whole pricing layer (and the price JSON with it) into every consumer of site.ts.
import { HAS_LIVE_PRICES } from "./live";

export const PRICES_ARE_DEMO = !HAS_LIVE_PRICES;
