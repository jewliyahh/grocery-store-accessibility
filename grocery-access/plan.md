# Plan: simpler lot → building rule ("biggest building gets the lot's homes")

The website plan that used to be here is done; it's in git history (`d9bfedb`).

## Why
The assessor counts housing units per **lot**, but the maps color **buildings**, so each lot's units have to be handed
to its buildings. Right now `residents_by_units()` does that by cutting every building along lot lines
(`gpd.overlay`) and splitting each lot's units by how much footprint lands on it. That creates fractional units,
slivers from the 3,366 buildings that cross a lot line, and a 400 sq ft cutoff to keep sheds out. It's hard to
explain, and it barely matters. Redoing the split three ways moved the headline by 0.3 points at most:

| How a lot's units go to its buildings | Walk 10 min | Bike 5 min | Bus 10 min |
|---|---|---|---|
| By footprint (current) | 37.7% | 69.7% | 56.5% |
| Evenly per building | 38.0% | 69.7% | 56.5% |
| All to the biggest building | 37.6% | 69.7% | 56.6% |

Explainability over precision: pick the rule that fits in one sentence.

## The new rule
1. **Each building belongs to the lot its center falls in**, the same way it belongs to a Census block. No overlay,
   no slivers.
2. **All of a lot's units go to its biggest building** (by footprint). Every other building on the lot gets 0.
3. **Every unit on a block gets the same share of the block's people:** residents = units × (block `POP100` ÷ block units).
4. **Lot has units but no building center on it** → its units go to the building covering the most of the lot, if it
   covers at least 20% (`MIN_LOT_COVER`). Added after the first run: a big building covers several lots but has one
   center, so without this 157 lots (1,544 people) under big buildings became lot outlines.
5. **Still no building** → the lot outline stands in as the building (same as today).

Unchanged: condo merging and land-use rules in `get_parcels()`; the floor-area fallback for blocks with no units;
`place_leftovers()`; the street-access and reach code.

Known trade-off, documented rather than fixed: a lot with several real residential buildings (a garden apartment
complex, a duplex built as two structures) puts everyone in one building and the rest show 0 on the map.

## Steps
1. **`residents_by_units()`** (notebook library cell)
   - Replace the overlay + footprint split with: `sjoin` building centers → lots, then per lot give `lots.units`
     to the building with the largest `sqft` (`idxmax`), 0 to the rest.
   - Drop the `MIN_RESIDENTIAL_SQFT` filter from this function (it stays in `estimate_residents()` for the
     floor-area fallback/comparison).
   - Lot stand-ins: lots with units where no building center landed.
   - Update the docstring and the `check` stats (`units_no_building`, `lots_stand_in`, `pop_on_lots`).
2. **Notebook markdown**
   - Intro cell (dasymetric mapping) and "What the notebook uses: assessor housing units": rewrite step 3 and the
     caveats with the new rule, in plain words.
   - New short section **"From lots to buildings"** after the assessor-units example: the 4-step rule, a real
     Uptown lot with a house + garage as a worked example (table: building, footprint, units, residents), the
     comparison table above, and the apartment-complex trade-off.
   - Check the "Sanity checks" and "Why the headline barely moves" text still match the numbers.
3. **Re-run the notebook** top to bottom so saved outputs and `docs/data/stats.json` are current.
4. **Website (`docs/about.md`)**
   - "Where people live": replace "the bigger building gets more of them" with the new rule; update the
     stand-in people count (1,676) and any other numbers that move.
   - "Tough calls" images (`img/splitting-people.png`): regenerate only if the units panel visibly changes.

## Verification
- Every block's residents still sum to its `POP100` (existing asserts), and nobody is unallocated.
- Headline % within 0.5 points of today's (walk 37.7%, bike 69.7%, bus 56.5%).
- "Residential buildings" and `pct_buildings` **will** change (garages and ADUs stop counting as homes). Note the
  new numbers in the summary.
- Eyeball the residents map: how many lots look wrong (a complex with one dark building and empty neighbors)?
  If it's more than a handful, revisit the "split evenly across buildings" option.

## Result (2026-09-25)
- Done: steps 1–4. `splitting-people.png` unchanged in substance (same 113-person block); `street-access.png`
  picked a different example home.
- Headline: walk 37.6%, bike 70.0%, bus 56.6% (was 37.7 / 69.7 / 56.5). Block totals all match; 0 unallocated.
- Residential buildings 8,709 → 6,748; % of buildings: walk 28%, bike 62%, bus 44% (was 30 / 65 / 46).
- Lot stand-ins: 642 lots, 2,208 people (was ~1,676).
- **Open:** 350 lots have 4+ units and a second building of 1,000+ sq ft, which could be apartment complexes where
  only one building shows people. Look at a sample on the map before deciding whether to split those evenly.
