# Additional material

The library groups resource categories into eight cards: topics; commentaries; places and maps; biographies; timelines and family trees; historical background (archaeology and cultural background); charts; and language tools. All cards remain visible when empty and are marked as such. Add resources to `content.json` using the example in `content.example.json`. Set `status` to `published`, supply the applicable Bible references, and set `category` to one of:

`topics`, `archaeology`, `maps`, `places`, `biographies`, `family-trees`, `timelines`, `charts`, `commentaries`, `cultural-background`, `language-tools`.

`category` is independent of `type`, which can describe the format (for example, `map`, `article`, or `video`). Older entries without a category are matched by type when possible, including `map` and `table`; other entries remain visible under All material. Drafts are not shown. The cards are categories, not claims that resources already exist.

## Study search placement

The in-question Bible search is offered under “Key words and themes” for tracing a term across passages. Observation questions ask what is in the current passage, and a translated-text search is not a dictionary or original-language lexicon, so it is not presented as one. Search remains available separately for names, places, or other terms. Compare any results in their contexts: the same translated word does not necessarily represent the same original word or meaning. See [Mark Strauss, Principles for Word Studies](https://www.biblicaltraining.org/learn/foundations/nt110-biblical-exegesis/nt110-06-principles-for-word-studies) and [6 Ways Biblical Word Studies Go Wrong](https://www.thegospelcoalition.org/article/word-studies-go-wrong/).

## Topics

Topics are prompts for personal study, not prewritten answers. The topic entries in `content.json` can be published without references while research is pending. Add verified starting references to an entry’s `refs` array when ready; they will then appear with the topic and allow passage matching. Keep topic IDs stable so saved topics remain available after updates.

Each topic has a separate autosaved personal notes field, where users can enter notes and references without a reference picker. Topic notes are local and included in editable backups; the curated starting references remain separate and read-only.

## Biographies

Person entries (`category: biographies`, `type: person`) are study placeholders: names are visible without published biographies or references. Add independently researched descriptions in `desc`, sources and licensing details when ready, and verified starting passages in `refs`. Users can save a person and keep private, editable notes and references, which are included in backups. Keep person IDs stable. Other biography resource types still require references when published.
