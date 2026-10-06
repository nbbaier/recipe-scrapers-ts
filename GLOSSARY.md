# Recipe Scrapers

A TypeScript port of the Python recipe-scrapers library that extracts structured recipe data from recipe web pages.

## Language

### Sites and scrapers

**Host**:
The normalized name of a recipe website, without a leading `www.` (for example `allrecipes.com`), used to pick which scraper handles a page.
_Avoid_: Hostname, domain, site, website

**Supported**:
Describes a host that has a site scraper in this project.
_Avoid_: Implemented

**Site scraper**:
A scraper written for one specific host.
_Avoid_: Supported scraper, custom scraper

**Schema scraper**:
The generic scraper used in wild mode, which reads recipe data only from the page's Schema.org markup.
_Avoid_: Wild scraper, generic scraper

**Wild mode**:
Scraping a page whose host is not supported by falling back to a schema scraper.
_Avoid_: Fallback, unsupported mode

### Recipes

**Recipe field**:
One named piece of recipe data a scraper extracts, such as title, ingredients, or cooking method.
_Avoid_: Method, attribute, property

**Cooking method**:
The way a recipe is cooked, such as baking, frying, or grilling.
_Avoid_: Method

### Filling gaps

**Fill**:
Supplying a missing recipe field from the page's Schema.org or OpenGraph data, whichever scraper is in use.
_Avoid_: Fallback

### Parity

**Upstream**:
The Python recipe-scrapers library this project ports.
_Avoid_: Original, Python version, reference implementation

**Parity**:
This project producing the same output as upstream for the same page, whether through a site scraper or wild mode.
_Avoid_: Compatibility, equivalence

**Parity divergence**:
A known, recorded difference between this project's output and upstream's.
_Avoid_: Parity issue, discrepancy, mismatch

**Fixture**:
A saved recipe page paired with the output upstream produces for it.
_Avoid_: Test data, test case, sample
