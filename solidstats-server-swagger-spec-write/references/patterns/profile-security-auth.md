# SolidStats security and auth patterns

These checks apply to the actual target security policy. They do not import the
Estesis permission microservice or infer a new authentication architecture.

## profile/security-session-and-role-policy

### Document the actual session and authorization policy

**Severity:** HIGH, calibrated by the actual consequence.

**Rule:** Start from Steam OpenID sign-in and the server-2 session transport.
Resolve the exact session cookie name from source or an explicit target
decision. A cookie session is described by the appropriate cookie security
scheme; Steam sign-in is not automatically a JWT or OAuth2 API scheme.

**Detection:** Check required versus optional authentication, operation
security, roles, ownership and cross-user access. Record any redesign as an
explicit target change.

**Good example (synthetic):** A protected operation declares its verified
session scheme and the required moderator role or ownership condition.

**Bad example (synthetic):** Every private endpoint declares bearerAuth merely
because an Estesis template used it.

**Evidence to load:** server-2/.planning/PROJECT.md and the relevant current
auth source; intended changes in CHANGES.

## profile/security-public-projections

### Specify public and privileged fields separately

**Severity:** HIGH, calibrated by the actual consequence.

**Rule:** Define each public/privileged projection and its access condition.
Minimize exposure of identifiers and operational internals according to the
target policy. Express absence or nullability deliberately; do not
mechanically require unions where one safe projection suffices.

**Detection:** Compare anonymous, authenticated owner and privileged
responses. Ensure examples match masking and presence rules, including list
and event payloads.

**Good example (synthetic):** The public player payload documents a masked
identifier while a justified privileged operation has a distinct projection.

**Bad example (synthetic):** A list masks identifiers but the corresponding
live event returns the unmasked value.

**Evidence to load:** The slice's role/data-visibility matrix and shared
security requirements.

## profile/security-browser-mutations

### Cover cookie-authenticated mutation behavior

**Severity:** HIGH, calibrated by the actual consequence.

**Rule:** When the contract changes cookie-authenticated mutations or browser
login, research the actual CSRF/origin/session policy and specify
client-visible requirements, expiry and failures. Do not invent headers, token
fields or security guarantees.

**Detection:** Check that a frontend developer can implement a valid request
and handle expired or forbidden sessions. Verify access control per resource,
not only the presence of a session.

**Good example (synthetic):** The contract names the agreed origin/CSRF
requirement and distinguishes unauthenticated from forbidden outcomes.

**Bad example (synthetic):** The spec assumes a browser session alone proves
authority to mutate any referenced UUID.

**Evidence to load:** Target auth policy, browser client contract and primary
framework documentation when needed.
