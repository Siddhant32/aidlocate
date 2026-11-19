---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: ["src/App.css","src/index.css"]
---

# AidLocate core experience

## Scope and mode

Redesign all existing routes and workflows. Operate: help a person in a public place find nearby first aid quickly.

## Audience and task

The primary user needs to find a publicly available first-aid kit. Their first action is to share location or search; they then compare nearby records and choose a destination.

## Content and constraints

Keep all current routes and behavior. The eight kit records are samples, not verified or confirmed publicly accessible; label them plainly. Preserve optional browser geolocation, manual search, maps, hospital lookup, QR, SOS, contacts, account, and tracking flows. Never imply AidLocate replaces emergency services or that an SOS notification was delivered when it was not.

## Direction contract

THESIS: Make nearby help read like a clear destination board, not a generic map directory.

OWN-WORLD: Use the high-contrast hierarchy of contemporary Mumbai suburban railway platform displays: black-and-white surfaces, restrained green for actions and selected states, red for emergency and error states, aligned destination rows, and legible location data. Keep unverified sample markers monochrome. Use no paper nostalgia, invented routes, or availability signals.

STORY: The visitor shares location or searches, scans the nearest records, sees which information is sample, and chooses a map or directions action.

FIRST VIEWPORT: At `/find`, keep the utility navigation compact; place the first-aid task and location action above the fold, with an explicit sample-data notice, ordered results, and map visible together on desktop. On mobile, put search and its data caveat before the map and result list. Signature interaction: Use My Location reorders results by distance and recenters the map, while the selected result remains visibly identified.

FORM: Mumbai suburban railway destination-board hierarchy, grounded direction 1; selected as IMPECCABLE'S PICK. Direction seed key: 348668a6. Code-led build.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
