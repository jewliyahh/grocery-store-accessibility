# Uptown Grocery Access

How many people in Uptown, San Diego can get to a grocery store without a car? This project estimates the share of
residents within a **10-minute walk**, a **5-minute bike ride**, and a **10-minute bus + walk trip** of a grocery store,
weighted by where people actually live (2020 Census blocks spread across buildings by floor area).

- **Website:** `docs/` (toggle walk / transit / bike on a map, then read the datasets and assumptions)
- **Analysis:** [`notebooks/grocery_stores_population.ipynb`](notebooks/grocery_stores_population.ipynb)

## Rebuild the data

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd notebooks && jupyter lab     # run grocery_stores_population.ipynb top to bottom
```

The first run downloads the neighborhood boundaries and the MTS bus schedule into `data/raw/` and caches
OpenStreetMap requests in `notebooks/cache/` (both gitignored). The last cell, **Export for the website**, writes
the map layers and stats into `docs/data/`. Commit those files to update the site.

## Preview the site locally

```bash
cd docs && python3 -m http.server 8000     # then open http://localhost:8000
```

(Opening `index.html` directly won't load the map data, because browsers block `fetch` from `file://`.)

## Publish on GitHub Pages (free)

1. Push this repo to GitHub as a **public** repo.
2. Settings → Pages → Build and deployment → Source: **Deploy from a branch**, Branch: `main`, folder: **`/docs`**.
3. The site appears at `https://<your-username>.github.io/<repo-name>/` in a minute or two.
4. In `docs/about.md`, replace `YOUR-USERNAME` in the "See the notebook" link.

`docs/.nojekyll` must stay: it stops GitHub Pages from running Jekyll, which would turn `about.md` into its own page
instead of serving the Markdown file the site loads.
