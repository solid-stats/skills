# Wording registry

Write concise English technical prose. Keep behavior close to the field,
parameter or response it defines. Preserve identifiers exactly.

<!-- markdownlint-disable MD013 -->

| Concept | Wording |
| --- | --- |
| Product | Solid Stats |
| Community | Solid Games |
| Backend | `server-2` or backend |
| Browser consumer | `web` or frontend |
| Replay discovery | `replays-fetcher` |
| Parsing worker | `replay-parser-2` |
| Proposed behavior | target contract |
| Existing API evidence | current contract or baseline |
| Agreement | user approval of the identified revision |

<!-- markdownlint-enable MD013 -->

Do not use Estesis service names, untranslated Russian business vocabulary or
workstation paths in normative examples. Synthetic examples must be labeled
as examples and must not masquerade as existing endpoints or source evidence.

Distinguish a replay, its parse job, a player identity and an authenticated
user.
Do not call all of them a "record" where their lifecycle or permissions differ.
Use a precise condition instead of "as usual", "standard permissions", "etc."
or "the implementation decides" when it changes observable behavior.
