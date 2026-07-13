import type { FountainFacts } from "@/lib/fountainModel";

// ─────────────────────────────────────────────────────────────────────────────
// Worked examples of every fountain "type" the app can record — the domain
// facts (FountainFacts) paired with the exact OSM tags they encode to. Reference
// only; not imported by the app. Mirror lib/osm.ts `applyAction` + the mapping
// table in docs/human/osm-wiki-standards.md.
//
// All examples start from a base primary of amenity=drinking_water and a survey
// on this date. Audience + dispenser + seasonal are written only while working
// (confirm); the out-of-order / removed examples show why those fields drop.
// ─────────────────────────────────────────────────────────────────────────────

const CHECK_DATE = "2026-07-13";

type ExampleFountain = {
  name: string;
  facts: FountainFacts;
  osmTags: Record<string, string>;
};

export const exampleFountains: ExampleFountain[] = [
  // ── Working · humans ───────────────────────────────────────────────────────
  {
    name: "Human drinking fountain, bubbler (the default)",
    facts: {
      status: "working",
      humans: true,
      dogs: false,
      bubbler: true,
      bottleFiller: false,
      seasonal: false,
    },
    osmTags: {
      amenity: "drinking_water",
      drinking_water: "yes",
      dog: "no",
      fountain: "bubbler",
      bottle: "no",
      check_date: CHECK_DATE,
    },
  },
  {
    name: "Human, bottle-filler only",
    facts: {
      status: "working",
      humans: true,
      dogs: false,
      bubbler: false,
      bottleFiller: true,
      seasonal: false,
    },
    osmTags: {
      amenity: "drinking_water",
      drinking_water: "yes",
      dog: "no",
      fountain: "bottle_refill",
      bottle: "yes",
      check_date: CHECK_DATE,
    },
  },
  {
    name: "Human, bubbler + bottle filler",
    facts: {
      status: "working",
      humans: true,
      dogs: false,
      bubbler: true,
      bottleFiller: true,
      seasonal: false,
    },
    osmTags: {
      amenity: "drinking_water",
      drinking_water: "yes",
      dog: "no",
      fountain: "bubbler",
      bottle: "yes",
      check_date: CHECK_DATE,
    },
  },

  // ── Working · humans + dogs (a human fountain with a dog bowl) ──────────────
  {
    name: "Humans + dogs, bubbler",
    facts: {
      status: "working",
      humans: true,
      dogs: true,
      bubbler: true,
      bottleFiller: false,
      seasonal: false,
    },
    osmTags: {
      amenity: "drinking_water",
      drinking_water: "yes",
      dog: "yes",
      fountain: "bubbler",
      bottle: "no",
      check_date: CHECK_DATE,
    },
  },

  // ── Working · dogs only → amenity=watering_place ───────────────────────────
  {
    name: "Dogs only, bubbler (retagged as animal drinking place)",
    facts: {
      status: "working",
      humans: false,
      dogs: true,
      bubbler: true,
      bottleFiller: false,
      seasonal: false,
    },
    osmTags: {
      amenity: "watering_place",
      drinking_water: "no",
      dog: "yes",
      fountain: "bubbler",
      bottle: "no",
      check_date: CHECK_DATE,
    },
  },
  {
    name: "Dogs only, bottle filler",
    facts: {
      status: "working",
      humans: false,
      dogs: true,
      bubbler: false,
      bottleFiller: true,
      seasonal: false,
    },
    osmTags: {
      amenity: "watering_place",
      drinking_water: "no",
      dog: "yes",
      fountain: "bottle_refill",
      bottle: "yes",
      check_date: CHECK_DATE,
    },
  },

  // ── Working · modifiers (seasonal, note) ───────────────────────────────────
  {
    name: "Seasonal human bubbler (runs only part of the year)",
    facts: {
      status: "working",
      humans: true,
      dogs: false,
      bubbler: true,
      bottleFiller: false,
      seasonal: true,
    },
    osmTags: {
      amenity: "drinking_water",
      drinking_water: "yes",
      dog: "no",
      fountain: "bubbler",
      bottle: "no",
      seasonal: "yes",
      check_date: CHECK_DATE,
    },
  },
  {
    name: "Human bubbler with a public note",
    facts: {
      status: "working",
      humans: true,
      dogs: false,
      bubbler: true,
      bottleFiller: false,
      seasonal: false,
      note: "Behind the visitor centre, low pressure in summer",
    },
    osmTags: {
      amenity: "drinking_water",
      drinking_water: "yes",
      dog: "no",
      fountain: "bubbler",
      bottle: "no",
      note: "Behind the visitor centre, low pressure in summer",
      check_date: CHECK_DATE,
    },
  },
  {
    name: "Everything at once — humans + dogs, both dispensers, seasonal, note",
    facts: {
      status: "working",
      humans: true,
      dogs: true,
      bubbler: true,
      bottleFiller: true,
      seasonal: true,
      note: "Park fountain with dog bowl and bottle tap",
    },
    osmTags: {
      amenity: "drinking_water",
      drinking_water: "yes",
      dog: "yes",
      fountain: "bubbler",
      bottle: "yes",
      seasonal: "yes",
      note: "Park fountain with dog bowl and bottle tap",
      check_date: CHECK_DATE,
    },
  },

  // ── Out of order · primary moves behind disused: ───────────────────────────
  // Audience / dispenser / seasonal are NOT written for non-working states, so
  // they can't contradict a source that no longer serves water. A note still can.
  {
    name: "Out of order (was a human drinking fountain)",
    facts: {
      status: "out_of_order",
      humans: true,
      dogs: false,
      bubbler: true,
      bottleFiller: false,
      seasonal: false,
      note: "Tap missing, reported to city",
    },
    osmTags: {
      "disused:amenity": "drinking_water",
      note: "Tap missing, reported to city",
      check_date: CHECK_DATE,
    },
  },

  // ── Removed · primary moves behind abandoned: ──────────────────────────────
  {
    name: "Removed (fountain gone from the ground)",
    facts: {
      status: "removed",
      humans: true,
      dogs: false,
      bubbler: true,
      bottleFiller: false,
      seasonal: false,
    },
    osmTags: {
      "abandoned:amenity": "drinking_water",
      check_date: CHECK_DATE,
    },
  },
];
