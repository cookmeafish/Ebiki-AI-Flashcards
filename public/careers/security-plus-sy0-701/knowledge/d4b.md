# Domain 4 (part 2): Identity, automation, incident response and investigations
Checked as of 2026-11 for SY0-701.

## 4.6 Put identity and access management in place and keep it working
Depth asked: apply in a scenario. An answer names the specific control, protocol, model or setting that fits the situation described, and can say why the nearest alternative does not fit.

### Account provisioning and de-provisioning (joiner, mover, leaver process)
Provisioning creates an account and gives it the access a role needs; de-provisioning disables and later removes that account and its access when the person leaves or no longer needs it. It is an administrative and technical control that protects confidentiality and integrity by making sure only current, approved people hold working credentials.

How it works, in the order that keeps evidence and stops misuse:
1. A trusted source of truth (usually the HR system) records a joiner, a mover (role change) or a leaver. Reason: access decisions follow a record, not an email or a memory.
2. Joiner: an approver signs off, then the account is created with the role's groups only. Reason: least privilege from day one.
3. Mover: new role access is added AND old role access is removed in the same change. Reason: skipping the removal is how privilege creep starts.
4. Leaver: disable the account at once, revoke sessions, tokens and remote access, and rotate any shared secrets the person knew. Reason: a disabled account cannot log in but its data and audit trail stay intact.
5. Delete the account only after retention needs are met (mailbox, files, logs). Reason: deleting first destroys evidence and data the business may need.
Common wrong order: deleting before disabling and archiving, or removing email but forgetting VPN, cloud apps and service tokens.

**Why it matters:** an orphaned account (still active after its owner left) is a ready-made entry point for an ex-employee or an attacker, and auditors treat late removal as a control failure.

**Common confusions:** Provisioning is about the account's life cycle, while identity proofing is the one-time check that the person is real before the account exists. Disabling and deleting are not the same step: disabling is immediate, deleting comes later. Automating provisioning (objective 4.7) is how it is done at scale; this section is what must happen.

**Scenario:** A contractor's project ended three weeks ago, yet the firewall shows their VPN session last night. The failure is de-provisioning, because the account should have been disabled when the contract ended. The closest wrong answer, "weak password policy", misses the point: the password could be strong and the account should still not work.

Worked mini-example, a leaver ticket: "Status: terminated 17:00. Directory account: disabled 17:04. VPN profile: revoked. Cloud app sessions: signed out. Mailbox: retained 90 days, then removed."

### Permission assignments and privilege creep (access reviews)
Permission assignment is how rights are granted to users, groups and service accounts, and the implication is how much damage a compromised or careless account can do with them. Assigning rights to groups or roles, and reviewing them regularly, is a preventive administrative control for confidentiality and integrity.

How it works:
1. Define roles from job functions and attach permissions to groups that represent those roles. Reason: one change to a group updates everyone in it, and reviewers can read it.
2. Put people into groups, never grant rights to individuals directly except for documented exceptions. Reason: direct grants are invisible in reviews and survive role changes.
3. Review assigned privileges on a schedule and after role changes; managers confirm each right is still needed. Reason: needs change over time, so a right once justified may no longer be.
4. Remove or reassign anything that cannot be re-justified.

**Privilege creep** is the slow build-up of rights as a person changes jobs and keeps the old ones. **Excessive permissions** can also come from convenience grants such as "give everyone local admin".

**Why it matters:** every extra right widens the blast radius of a phished account, ransomware running as that user, or an insider. Over-permissioned service accounts are common targets because they rarely log in interactively and are rarely reviewed.

**Common confusions:** Privilege creep is not privilege escalation. Creep is legitimate rights piling up through poor process; escalation is an attacker gaining rights they were never given. An access review checks who has access; an audit log review checks what they did with it.

**Scenario:** A payroll clerk who moved to marketing a year ago can still open payroll files. The issue is privilege creep from a mover change that added access but never removed it, fixed by group-based assignment and periodic access reviews. The closest wrong answer, "implement MFA", protects logins but does nothing about rights the account already holds.

### Identity proofing (verifying a person before issuing credentials)
Identity proofing is the process of collecting, checking and confirming evidence about a person so their claimed identity can be trusted before an account or credential is issued. It happens at enrollment and again when an account is recovered after lost credentials. It is a preventive control that protects the integrity of every later authentication: a credential issued to an impostor authenticates the impostor perfectly.

How it works (the NIST SP 800-63A model):
1. **Resolution:** gather the claimed identity's core details and evidence and confirm they point to one unique, real person. Reason: rule out duplicates and invented identities.
2. **Validation:** confirm the evidence (for example a passport or driver's license) is genuine and its details match authoritative or credible records. Reason: forged documents fail here.
3. **Verification:** confirm the applicant is the actual owner of that evidence, for example by comparing a live face to the photo on the document. Reason: a stolen genuine passport passes validation but should fail here.
4. **Enrollment:** create the subscriber account and bind authenticators to it.

NIST defines three identity assurance levels: IAL1 (basic, remote or on site), IAL2 (more evidence and stronger checks against scaled and targeted fraud), IAL3 (in person with a trained proofing agent and a biometric collected). Proofing can be remote unattended, remote attended over video, on site unattended at a kiosk, or on site attended. The current NIST guidance says knowledge-based questions (for example "which of these streets did you live on?") must not be used to verify identity, though older practice, and much study material for this objective, still gives credit-history questions as an example of an identity check.

**Why it matters:** account-opening fraud and help-desk recovery scams succeed when proofing is weak; everything built on the account inherits that weakness.

**Common confusions:** Proofing proves who a person is once; authentication proves, at each login, that the person holds the credential issued to them. Proofing is not authorization: a well-proofed person may still have no rights.

**Scenario:** A bank wants new online customers to show a government ID and take a live selfie before an account opens. That is identity proofing (validation plus verification). The closest wrong answer, "multifactor authentication", applies at login after the account exists.

### Attestation in identity management (identity, access and device attestation)
Attestation means confirming a claim with evidence. In identity management, where this objective lists it, it means confirming a user's identity claims with extra proof, and the word has two other common security senses that a scenario may mean instead. Read the context to pick the right one.

The three senses:
1. **Identity attestation:** extra evidence that a person is who they claim, such as a passport or driver's license, an in-person meeting, or answers drawn from credit history. It works with identity proofing when an account is created or recovered. Note that NIST SP 800-63A now forbids knowledge-based verification for identity proofing, so credit-history questions are a traditional example, not current best practice.
2. **Access attestation (recertification):** on a schedule, managers or data owners confirm that each person's access is still needed, and anything not confirmed is removed. This is the review step that fights privilege creep.
3. **Device attestation:** hardware such as a Trusted Platform Module (TPM) signs a set of measurements (for example of the boot sequence), and a verifier checks the signature and the measurements before trusting the device. NIST also uses "attestation" for information about an authenticator supplied when it is registered.

**Why it matters:** identity attestation stops impostors at enrollment, access attestation produces the evidence auditors ask for (who approved this access and when), and device attestation lets a zero trust policy refuse a tampered or unmanaged device.

**Common confusions:** Attestation (a party vouches, with evidence) is not authentication (a credential is checked at login). Access attestation is not an access log review: the first asks "should this person have this right?", the second asks "what did they do?". Device attestation is not the same as a device certificate: the certificate names the device, attestation reports its measured state.

**Scenario clue:** "Every quarter, department heads sign off on the list of people who can open the finance share." Answer: access attestation (recertification). The closest wrong answer, "auditing", is broader and usually means reviewing activity, not certifying entitlements.

**Scenario clue:** "Before activating a remote hire, HR meets them on video and checks their passport against their face." Answer: identity attestation alongside proofing.

### Federation (cross-organization identity trust, identity provider and service provider)
Federation is a trust arrangement that lets identity and authentication information flow between separate organizations or security domains, so a user signs in at their home identity provider (IdP) and a partner's service provider (SP), also called the relying party, accepts that result. It sits in identity and access management as a technical and administrative control: the trust is set up by agreement and enforced by signed messages.

How it works:
1. The two parties agree to trust each other and exchange metadata: endpoints and the public keys used to verify signatures. Reason: without that exchange the SP cannot tell a real assertion from a forged one.
2. A user asks the SP for a resource. The SP sends them to their own IdP. Reason: the SP never handles the user's password.
3. The IdP authenticates the user with its own methods (password, MFA, smart card).
4. The IdP returns a signed assertion or token (SAML assertion, or an OpenID Connect ID token) naming the user and attributes such as group or email.
5. The SP checks the signature, audience and expiry, maps the attributes to its own permissions, and opens a session.

**Why it matters:** partners, customers and contractors get access without the SP creating and later forgetting separate accounts, and when the home organization disables a leaver, access to every federated partner stops too. The cost: the SP's security now depends on the IdP's.

**Common confusions:** Federation is the trust between domains; the protocols that carry it are SAML, OpenID Connect and WS-Federation. "Sign in with" a large consumer provider on a third-party site is federation. Federation is not the same as synchronizing accounts: no copy of the password goes to the partner. Authentication happens at the IdP; authorization still happens at the SP.

**Scenario:** A manufacturer lets a supplier's staff use the supplier's own company login to reach the manufacturer's ordering portal. That is federation, because two organizations trust each other's identity systems. The closest wrong answer, "single sign-on", describes one login for many apps but does not by itself say that the trust crosses organizations.

Worked mini-example, what an SP checks in an assertion: issuer = the supplier's IdP; audience = this portal; signature valid with the IdP's published key; not-on-or-after time still in the future; subject = a pseudonymous user id; attribute role = buyer.

### Single sign-on (SSO)
Single sign-on lets a user authenticate once and then reach several applications without signing in again. NIST describes it as one account and its authenticators being used to reach multiple applications, usually through a federation protocol. It is a technical control that mostly improves usability and centralizes authentication, which helps integrity and accountability.

How it works inside one organization:
1. The user signs in to a central identity service (for example a Windows domain sign-in or a cloud IdP).
2. The service issues a session, ticket or token the user's browser or device keeps.
3. Each application trusts that central service and accepts the ticket or a fresh assertion instead of asking for a password.
4. Signing out, or the session expiring, ends access everywhere, if the apps support single logout.

**Why it matters:** fewer passwords means fewer reused and written-down passwords, one place to enforce MFA and conditional access, and one switch to turn off a leaver. The trade-off is concentration: one stolen SSO session or credential opens every connected app, so SSO should always be paired with MFA and short session lifetimes.

**Common confusions:** SSO is not the same as password synchronization (same password on many systems, each still asking for it). SSO usually means one organization's apps; federation extends the same idea across organizations, and the two are often used together. The SY0-701 objectives list LDAP, OAuth and SAML under SSO; strictly, LDAP is a directory protocol many SSO systems read from, and OAuth is authorization, with OpenID Connect adding the sign-in.

**Scenario:** Staff complain about typing passwords into email, HR and the ticket system every morning, and the help desk spends hours on resets. The fix is SSO through a central IdP with MFA at that one sign-in. The closest wrong answer, "a password manager", still leaves a separate password per app and does not centralize revocation.

### Lightweight Directory Access Protocol (LDAP and LDAPS)
LDAP is the standard protocol for reading and updating a directory: a tree of entries for users, groups, computers and other objects, each named by a distinguished name (DN) such as `cn=Ana Ruiz,ou=Staff,dc=example,dc=org`. Microsoft Active Directory answers LDAP. Applications use it to look up identities and group membership and to check passwords through a "bind". It is a building block of identity management, not a single sign-on protocol by itself.

How a typical application login uses it:
1. The application connects to the directory server. Plain LDAP uses the registered LDAP port and LDAPS (LDAP over TLS) its own port; see the Reference chapter for the numbers (389 and 636).
2. It protects the connection with TLS first: either LDAPS from the start, or the StartTLS operation on a plain connection before any bind. Reason: a simple bind sends the password itself, which the LDAP standard calls unsuitable without confidentiality protection.
3. It performs a bind with the user's DN and password; success means the password was right.
4. It searches for the user's group memberships and maps them to application roles.

**Security points:** an anonymous bind (empty name and empty password) gives an unauthenticated session, and an "unauthenticated" bind (a name with an empty password) must never be treated as a successful login; servers should refuse it by default. StartTLS can be stripped by an attacker in the middle, so clients should verify the server certificate and refuse to continue without TLS. User input placed in search filters must be escaped to prevent LDAP injection.

**Why it matters:** the directory holds the keys to everything; cleartext binds on the network hand passwords to anyone capturing traffic.

**Common confusions:** LDAP is not authorization by itself and not web-token based like SAML or OAuth. LDAPS and StartTLS both add TLS; they differ in whether TLS starts immediately (LDAPS) or is negotiated on the plain port (StartTLS).

**Scenario:** A packet capture on the server network shows readable passwords in traffic between a web app and the domain controllers. The fix is to require LDAPS or StartTLS before binds. The closest wrong answer, "move to SAML", changes the app's sign-in design but is not needed to stop cleartext directory binds.

### Open Authorization (OAuth 2.0)
OAuth 2.0 is an authorization framework: it lets a user allow one application (the client) to use limited parts of their data or account on another service, by giving the client an access token instead of the user's password. It answers "what may this app do on my behalf?", not "who is this user?". It protects confidentiality by keeping passwords away from third-party apps and limiting what each app can reach.

The four roles: the **resource owner** (usually the user), the **client** (the app asking for access), the **authorization server** (signs the user in, asks for consent, issues tokens) and the **resource server** (the API holding the data, which accepts tokens).

How the authorization code flow works:
1. The client sends the user's browser to the authorization server with its client id, the requested **scope** (for example read-only access to one photo album), a redirect address and a random state value.
2. The authorization server authenticates the user (how is outside OAuth itself) and shows a consent screen.
3. If the user approves, the browser is sent back to the client with a short-lived authorization code.
4. The client exchanges that code, from its own back end, at the token endpoint and receives an **access token** and sometimes a **refresh token**.
5. The client calls the API with the access token; the resource server checks it and its scope.

Current best practice (RFC 9700): public clients such as mobile and single-page apps must use PKCE (proof key for code exchange) with the code flow; the old implicit grant should not be used; and the grant where the app collects the user's password must not be used.

**Why it matters:** without OAuth, apps ask for your real password and get unlimited, unrevocable access. With it, access is scoped, revocable per app and expires.

**Common confusions:** OAuth alone is not authentication; OpenID Connect is the layer that adds a sign-in on top of OAuth 2.0. An access token is a bearer credential: whoever holds it can use it, so it must be protected like a password. Scope limits the app, not the user's own rights.

**Scenario:** A printing website asks to read one cloud photo album; the user approves and the site never learns the cloud password. That is OAuth delegated authorization. The closest wrong answer, "SAML", carries sign-in assertions for web SSO and does not express "let this app read my album".

Worked mini-example, a consent request: client = PrintNow; scope = albums.read; redirect = the callback page PrintNow registered; expires = 1 hour; refresh allowed = no.

### OpenID Connect (OIDC)
OpenID Connect is an identity layer built on OAuth 2.0 that adds authentication: after the user signs in at an identity provider, the application receives an ID token that says who the user is. It is the common choice for modern web, mobile and API sign-in and for consumer "sign in with" buttons.

How it works:
1. The application starts an OAuth 2.0 authorization request and includes the scope value `openid`. Reason: that scope is what turns a plain OAuth request into an OpenID Connect sign-in.
2. The identity provider authenticates the user and gets consent.
3. The application receives a code and exchanges it at the token endpoint for an **ID token** (and usually an access token).
4. The application validates the ID token before trusting it: the signature, the issuer, that the audience is its own client id, and that it has not expired. If a nonce was sent in step 1, the token must carry the same value back, which blocks replay.
5. Optionally the application calls the UserInfo endpoint with the access token for more profile claims.

The ID token is a JSON Web Token (JWT) that must be signed (and may also be encrypted). Required claims: `iss` (issuer), `sub` (a stable user identifier), `aud` (audience, the client id), `exp` (expiry) and `iat` (issued at). Optional claims include `auth_time`, `nonce`, `acr` (the assurance level met) and `amr` (methods used, such as password plus one-time code).

**Why it matters:** apps get a standard, signed statement of identity without ever seeing the password, and can require MFA through the identity provider.

**Common confusions:** The ID token is for the application to learn who signed in; the access token is for calling APIs. Sending an ID token to an API as if it were an access token is a design error. OIDC uses JSON tokens; SAML uses XML assertions. Both can provide SSO and federation.

**Scenario:** A startup's mobile app must let users sign in with their existing accounts at a large provider and needs a verified user id, not just API access. OpenID Connect fits. The closest wrong answer, "plain OAuth 2.0", would give the app an access token but no standard proof of who signed in.

Worked mini-example, decoded ID token claims: iss = the provider's issuer identifier; sub = 84211907; aud = mobile-app-7; iat = 1763200000; exp = 1763203600; amr = ["pwd","otp"].

### Security Assertions Markup Language (SAML, Security Assertion Markup Language)
SAML is an XML-based open standard (from OASIS; its official name is Security Assertion Markup Language, the SY0-701 objectives write "Assertions") for an identity provider (IdP) to send signed statements about a user to a service provider (SP). It is mostly used for browser-based enterprise single sign-on and federation, for example a company login reaching a cloud HR or payroll app.

An assertion can carry three kinds of statements: **authentication** (who signed in, when and how), **attribute** (details such as department or group) and **authorization decision** (whether a given action is allowed; SAML 2.0 froze this feature with no further work planned and points to the Extensible Access Control Markup Language (XACML) for richer authorization, so it is rarely used).

How the SP-initiated web flow works:
1. The user opens the SP's app without a session.
2. The SP redirects the browser to the IdP with an authentication request.
3. The IdP signs the user in, or reuses an existing session.
4. The IdP builds a digitally signed assertion inside a response and returns an HTML form that the browser posts automatically to the SP's assertion consumer address.
5. The SP checks the XML signature, the audience and the time limits, creates its own session and opens the requested page.
In the IdP-initiated variant, the user starts at the IdP's portal and clicks the app; there is no request from the SP. SAML also defines single logout, which tries to end the session at the IdP and every SP, though completion is not guaranteed.

**Why it matters:** the SP never sees or stores the password, the company controls MFA and account removal centrally, and partners can trust each other's users.

**Common confusions:** SAML handles authentication and attribute exchange; OAuth handles delegated authorization for apps and APIs. SAML is XML; OpenID Connect is JSON. SAML was built for browsers; native mobile apps and APIs usually use OAuth 2.0 with OpenID Connect instead. An assertion posted through the browser must be signed, which proves origin and integrity; signing is not encryption, which is a separate option.

**Scenario:** Employees open a cloud expense app, are bounced to the corporate login page, then land in the app already signed in; the app's admin uploaded the IdP's signing certificate during setup. That is SAML web SSO. The closest wrong answer, "LDAP", would mean the cloud app querying the company directory directly, which is exactly what this design avoids.

### SAML vs OAuth vs OpenID Connect vs LDAP
These four come up together under single sign-on and are easy to mix up because each touches identity. The decisive question is what the protocol produces: a directory answer, a permission for an app, a sign-in statement for a web app, or a sign-in token for a modern app.

| | LDAP | OAuth 2.0 | OpenID Connect (OIDC) | SAML |
|---|---|---|---|---|
| Main job | Read and update a directory; check a password by binding | Delegated authorization: let an app call an API for the user | Authentication on top of OAuth 2.0 | Authentication and attribute exchange between IdP and SP |
| What it produces | Directory entries and a bind result | Access token (and maybe refresh token) | ID token (signed JWT) plus access token | Signed XML assertion |
| Format | LDAP protocol messages | Tokens, usually JSON based | JSON (JWT) | XML |
| Typical use | Internal apps checking Active Directory groups | Third-party app reading your calendar or files | Mobile, single-page and consumer "sign in with" | Enterprise browser SSO to cloud apps, partner federation |
| Clue words | Directory, bind, distinguished name, group lookup | Scope, consent, token, "on behalf of", API | ID token, claims, openid scope | Assertion, XML, IdP, SP, assertion consumer |

How to decide:
1. The app must know who the user is, through a browser, in an enterprise: SAML (or OIDC if the description says modern, mobile or JSON).
2. The app must act on the user's data elsewhere without the password: OAuth.
3. The app needs a signed identity and also API access, especially on mobile: OpenID Connect.
4. The app looks up users and groups in the company directory: LDAP.

**Why it matters:** an app that treats any OAuth access token as proof of sign-in can be fooled by a token that was issued to a different app; OpenID Connect closes that gap by requiring the app to check that the ID token names it as the audience.

**Common confusions:** All four can appear in one design: the IdP checks the password against LDAP, issues SAML assertions to older SaaS apps and OIDC tokens to newer ones, and apps use OAuth access tokens to call APIs. "Token" alone does not mean OAuth: SAML calls its statement an assertion, OIDC calls its identity token an ID token. Kerberos tickets are a separate on-premises SSO mechanism not listed in this objective.

**Scenario:** A design document mentions "XML", "assertion" and "service provider": that is SAML. If it instead mentions "scope", "consent" and "access the user's files", that is OAuth. The common mistake is choosing OAuth whenever SSO is mentioned: OAuth by itself does not identify the user.

### Federation vs single sign-on
Both let a user avoid separate logins, so each can look like the answer to the same need. The decisive feature is the trust boundary.

| | Single sign-on (SSO) | Federation |
|---|---|---|
| Core idea | One sign-in, many applications | Trust between separate organizations or domains |
| Where the user's account lives | The organization that runs the apps | The user's home organization, not the app owner |
| Who authenticates | The organization's own identity service | The home identity provider; the partner relies on it |
| Typical protocols | Windows domain sign-in, SAML, OIDC with one company IdP | SAML, OIDC, WS-Federation between companies |
| Clue words | "one login", "no more prompts", "portal" | "partner", "supplier", "another company", "sign in with" |

How they combine: a company runs SSO for its own apps, and the same identity provider also federates with partners so outside users reach a shared portal with their own credentials. A user can therefore experience SSO that is delivered through federation.

**Why it matters:** choosing federation removes the need to create and maintain accounts for every partner's staff, which is where orphaned outside accounts come from. Choosing SSO alone does not solve that, because SSO still needs every user to have an account in your directory.

**Common confusions:** Federation does not mean every federated app has single logout; ending the session at the IdP may leave app sessions alive until they expire. Federation is not account synchronization: no partner receives a copy of your password. SSO is not "the same password everywhere": that is password synchronization, where each system still prompts.

**Scenario:** A university wants visiting researchers from other universities to reach its lab booking system with their home university logins. The answer is federation, because the trust crosses institutions. The closest wrong answer, SSO, would require the university to issue its own accounts to every visitor.

**Scenario:** A hospital wants nurses to sign in once at the start of a shift and open the charting, pharmacy and scheduling systems without more prompts. The answer is SSO; no outside organization is involved.

### Interoperability in identity and access management (open standards, SCIM)
Interoperability is the ability of identity systems from different vendors to work together, sharing sign-ins, attributes and account changes through common standards. It is a design and procurement concern: a service that cannot speak your identity standards forces you into separate, unmanaged accounts.

The standards that make it work:
- **Sign-in and federation:** SAML and OpenID Connect let any compliant SP trust any compliant IdP.
- **Authorization for APIs:** OAuth 2.0 lets apps from different vendors call each other with scoped tokens.
- **Directories:** LDAP lets applications read users and groups from any compliant directory.
- **Account life cycle:** the System for Cross-domain Identity Management (SCIM) creates, updates and removes user and group accounts between an identity provider and cloud apps. It is a REST protocol over HTTP with JSON records: POST creates, GET reads, PUT replaces, PATCH changes part of a record, DELETE removes, against endpoints such as /Users and /Groups (RFC 7644; the schema is RFC 7643). The user record carries an `active` attribute, so a leaver can be disabled by setting it to false.

How to check interoperability before buying:
1. List the sign-in standards the service supports (SAML, OIDC) and test with your IdP.
2. Confirm automatic provisioning and de-provisioning (SCIM, or a documented API).
3. Confirm MFA and conditional access are enforced by your IdP, not a separate login.
4. Confirm attributes and groups map cleanly to the app's roles.

**Why it matters:** sign-in standards alone do not remove leavers. If a SaaS app supports SAML but not SCIM, a departed user cannot sign in through SSO but their local account and data may persist.

**Common confusions:** SCIM manages accounts; SAML and OIDC sign users in; they complement each other. Interoperability is not integration by custom scripts: scripts work but break when either side changes, which is an ongoing supportability cost (objective 4.7).

**Scenario:** A company picks a new chat app and wants leavers removed from it within minutes of HR marking them gone. Require SCIM support alongside SAML or OIDC. The closest wrong answer, "require SAML", covers sign-in but not removing the account itself.

### Mandatory access control (MAC)
Mandatory access control is a model in which the system, not the data owner, enforces access by comparing a security label on each object (such as Confidential, Secret, Top Secret) with the clearance of each subject. A central authority sets labels and clearances, and users cannot change or pass on access. It is the strictest common model and mainly protects confidentiality; NIST classes it as a kind of nondiscretionary access control.

How a decision works:
1. Every object carries a sensitivity label set by administrators or a security officer.
2. Every user (subject) holds a clearance, and often compartments or categories (need to know).
3. On each access the operating system compares them: a Secret-cleared user may read Secret and lower, not Top Secret.
4. Even after access is granted, the user cannot hand the information to someone uncleared, give away their rights, relabel the object or change the rules. Reason: this is the property that separates MAC from DAC.

**Why it matters:** in military, intelligence and some regulated settings, a single careless share is unacceptable, so the decision is taken away from individuals. The trade-off is rigidity: adding a project or changing a label needs administrators, and users often find it slow.

**Common confusions:** "Mandatory" does not mean "rule-based": rule-based applies admin conditions such as firewall rules; MAC compares labels with clearances. Labels in MAC are not the same as data classification labels on documents in an office suite, although classification feeds the labels. MAC can be combined with DAC: the label must allow access AND the owner's permissions must allow it.

**Scenario:** An analyst cleared to Secret can open Secret and Confidential reports but the system blocks a Top Secret annex, and she cannot share the Secret report with a contractor who holds no clearance even though she can read it. The answer is MAC. The closest wrong answer, RBAC, would let anyone in the analyst role read everything that role is given; it has no concept of comparing levels.

Worked mini-example, a decision line: subject clearance = Secret {Project Kite}; object label = Secret {Project Kite, Project Wren}; result = denied, because the subject lacks the Wren category even though the level matches.

### Discretionary access control (DAC)
Discretionary access control lets the owner of a resource (usually its creator) decide who may use it and with what rights. It is the everyday model of file shares and file systems: owners grant read, change or full control to other users and groups through access control lists. It is flexible and mainly serves usability, at the cost of weak central control.

How it works:
1. A user creates a file or folder and becomes its owner.
2. The owner edits its access control list (ACL), adding users or groups and their rights.
3. Anyone given access can, in turn, copy the data or pass it on; DAC places no system-wide limit on what they do with information once they can read it.
4. The operating system enforces whatever the ACL says on each access.

**Why it matters:** DAC lets teams share quickly without tickets, but sensitive data spreads by copying and broad grants ("Everyone: read"), and malware running as the owner can change permissions as freely as the owner can. That is why sensitive data often needs MAC labels, data loss prevention or tight group design on top.

**Common confusions:** NTFS permissions and Unix file permissions are classic DAC even when owners grant rights to groups; using groups does not turn DAC into RBAC. The key question is who decides: in DAC the owner, in RBAC the organization through role definitions, in MAC the system through labels.

**Scenario:** A project lead creates a shared folder and personally grants edit rights to three colleagues and read rights to a client contact. The answer is DAC, because the owner chose. The closest wrong answer, rule-based access control, would be a global condition applied to everyone by an administrator.

Worked mini-example, an ACL an owner set: `Budget-2026.xlsx owner=Lin; Lin=Full control; Finance-Team=Modify; Auditors=Read`.

### Role-based access control (RBAC)
Role-based access control ties permissions to roles that match job functions, and users get access by being assigned a role. NIST describes it as identifying permitted actions with roles rather than with individual identities. It is a preventive control that makes least privilege manageable at scale.

How it works:
1. Define roles from real job functions (Help desk, Accounts payable clerk, Nurse).
2. Attach to each role only the permissions that job needs.
3. Assign users to roles, usually through directory groups; users inherit the role's rights. Roles may inherit from other roles in a hierarchy.
4. When someone changes jobs, move them to the new role and out of the old one; review role membership periodically.
5. Where duties conflict (requesting and approving a payment), mark the roles as mutually exclusive.

**Why it matters:** onboarding becomes "add to role", audits read roles instead of thousands of individual grants, and moving people between jobs is one change. RBAC goes wrong when roles become too broad ("Staff" with everything) or when people keep old roles after a move.

**Common confusions:** RBAC can mean role-based or rule-based, so check which full name is meant. Role-based is about who you are in the organization; rule-based is about conditions an administrator sets for all. RBAC uses one dimension, the role; ABAC can combine role with device, location, time and data sensitivity.

**Scenario:** Every new help desk technician should automatically get password reset rights and the ticket queue, and lose them when they move to networking. The answer is RBAC with a Help desk role group. The closest wrong answer, DAC, would rely on each resource owner remembering to add and remove each technician.

### Rule-based access control
Rule-based access control applies rules or conditions that an administrator defines to every access attempt, whoever the user is. The classic example is a firewall or router access control list: traffic is allowed or denied by matching conditions, not by the user's identity or job. It is a technical, usually preventive control.

How it works:
1. An administrator writes rules: conditions plus an action (allow or deny).
2. Rules are checked on every request; on many devices their order matters and the first rule that matches decides.
3. Anything no rule permits is blocked (deny by default), often written as a final deny-all rule.

Examples: "allow TCP to the web server on the HTTPS port from anywhere; deny everything else"; "deny logins to lab PCs after 18:00"; "block uploads larger than 25 MB".

**Why it matters:** rules give consistent, central control that users cannot override, but rules that are too broad, out of order or never cleaned up quietly open holes.

**Common confusions:** Rule-based is sometimes abbreviated RBAC, the same as role-based, so read the full words. A time-of-day restriction is a rule, but it can be added on top of any model. ABAC also evaluates conditions, but uses many attributes of the subject, object, action and environment in one policy; rule-based usually means simple fixed conditions applied to everyone.

**Scenario:** A school blocks every account, staff and students alike, from the grading server outside 08:00 to 16:00. The answer is rule-based access control, since one admin rule applies to all. The closest wrong answer, role-based, would grant or deny by job, which is not what decides access here.

Worked mini-example, an ACL rule set read top to bottom: `permit tcp any host 10.0.5.10 eq 443` then `deny ip any any log`. A request to port 22 on that host matches only the second line, so it is dropped and logged.

### Attribute-based access control (ABAC)
Attribute-based access control decides each request by evaluating attributes against a policy: attributes of the subject (department, clearance, employment type), the object or resource (sensitivity, owner, project), the requested action (read, write, delete) and the environment (time, location, device health, network). NIST describes it as granting or denying operations by checking attributes against policies or rules. It is the most granular and context-aware of the common models.

How a decision works:
1. The user requests an action on a resource.
2. A policy decision point gathers the attributes: from the directory, from labels on the data, from the device management system and from the request itself.
3. It evaluates the policy, for example: allow READ on records tagged Customer-EU if department = Sales AND device = managed AND country = EU AND hour between 07:00 and 19:00.
4. A policy enforcement point (the app, gateway or proxy) applies the answer. Attributes are re-checked on each request, so a change (device falls out of compliance, user moves department) takes effect at once without editing permissions on every file.

**Why it matters:** ABAC expresses rules that roles cannot without exploding into hundreds of roles ("Sales-EU-Managed-Daytime"). Trying to do the same with roles creates many tiny one-off roles, a problem called role explosion. Its costs are complexity: attributes must be accurate and policies tested, or access fails in surprising ways.

**Common confusions:** ABAC is not rule-based access control, although both evaluate conditions: rule-based applies a few fixed admin rules to everyone; ABAC combines many attributes of user, resource, action and environment per request. ABAC can use the role as one attribute, so RBAC can be seen as a special case. NIST notes ABAC can be implemented in a mandatory or a discretionary way.

**Scenario:** Access to the customer database should be allowed only for sales staff, on company-managed laptops, from inside the country, during business hours. The answer is ABAC, because several attributes are combined in one decision. The closest wrong answer, RBAC, would grant the Sales role access everywhere and at any time; adding device and location would need extra controls.

Worked mini-example, an evaluation record: subject.dept = Sales; subject.type = employee; resource.tag = Customer-EU; action = read; env.device = managed; env.country = DE; env.time = 21:40; result = deny (time outside 07:00 to 19:00).

### MAC vs DAC vs RBAC vs rule-based vs ABAC (access control models compared)
The five models differ in one decisive thing: who or what makes the access decision. Find that in the scenario and the model follows.

| Model | Who decides | Decisive feature | Clue words |
|---|---|---|---|
| Mandatory (MAC) | The system, from labels set by a central authority | Object label compared with subject clearance; users cannot pass access on | Classification, clearance, Secret, Top Secret, labels, government |
| Discretionary (DAC) | The resource owner | Owner edits the ACL and can share freely | Owner, creator, "shares the folder", NTFS permissions |
| Role-based (RBAC) | The organization, through roles | Rights attached to job functions; users inherit by role | Job title, department role, new hire gets the role, group |
| Rule-based | An administrator's rules applied to all | Conditions match the request, not the user's role | Firewall ACL, router rules, "everyone after 6 p.m." |
| Attribute-based (ABAC) | A policy over many attributes | Subject, resource, action and environment combined | Device AND location AND time AND department, context, conditional |

Modifiers that combine with any model: **time-of-day restrictions** limit when access works, and **least privilege** limits how much is granted. Neither is a model on its own.

How to name the model:
1. Labels and clearances in the clue: MAC.
2. A person who created or owns the data granting access: DAC.
3. A job title or team deciding what a person gets: RBAC.
4. A blanket condition applied to every user or packet: rule-based.
5. Three or more conditions about user, device, data and context evaluated together: ABAC.

**Why it matters:** the model determines how a breach spreads. DAC spreads by owner decisions, RBAC by role design, and MAC resists casual sharing. Choosing the wrong model for the data creates either friction or leakage.

**Common confusions:** "RBAC" is ambiguous, so check whether a text means role-based or rule-based. Groups appear in DAC and RBAC alike; what matters is whether an owner or the organization's role design decides. ABAC with a single attribute (the role) behaves like RBAC.

**Scenario:** A defense contractor stores design files by classification and wants the operating system to stop engineers re-sharing them. Answer: MAC. If the scenario instead says each engineer decides who sees their own drafts, answer DAC.

### Time-of-day restrictions (usage conditions on accounts)
A time-of-day restriction limits when an account or resource can be used, for example allowing sign-in only during working hours or a shift. NIST treats this as a usage condition on accounts that supports least privilege, accountability and monitoring. It is a preventive technical control that can be added to any access control model.

How it works:
1. Decide the allowed window per account type or group (staff 07:00 to 19:00 weekdays; night-shift nurses 19:00 to 07:00; service accounts no interactive logon at all).
2. Configure it where authentication or authorization is enforced: directory logon hours, conditional access policies, VPN and remote access gateways.
3. Decide what happens at the boundary: block new sign-ins only, or also end existing sessions.
4. Alert on attempts outside the window, because they often mean stolen credentials or an attacker in a different time zone.
5. Provide an exception path (on-call, incident response) that is approved and logged.

**Why it matters:** many intrusions run at night or on weekends when no one is watching. A stolen password that only works from 07:00 to 19:00 is far less useful, and a 03:00 attempt becomes a strong signal.

**Common confusions:** A time-of-day restriction is a condition, not an access control model; it can sit inside rule-based, role-based or attribute-based designs. It is not the same as account expiration (a date after which the account stops working at all) or password expiration. Windows records a failed logon outside permitted hours with its own status code, which helps investigators.

**Scenario:** A clinic's front desk accounts should not work after the clinic closes. The answer is a time-of-day restriction on those accounts. The closest wrong answer, "account lockout", only reacts to repeated wrong passwords and would not stop a correct password at midnight.

Worked mini-example, a Windows Security log entry (event 4625, failed logon): Account Name = frontdesk2; Status = 0xC000006F (logon outside authorized hours); Logon Type = 2 (interactive); Workstation = RECEPTION-01.

### Least privilege in access management (minimum necessary rights)
Least privilege means each user, service and process gets only the access needed for its assigned tasks, and keeps it only as long as needed. NIST frames it as limiting every entity to the minimum resources and authorizations required for its function. It is a design principle applied through preventive controls, and it limits the damage to confidentiality, integrity and availability when an account is misused.

How to put it into practice:
1. Start from no access and add what the task requires (deny by default), rather than starting broad and trimming.
2. Give administrators two accounts: a normal one for email and browsing, and a separate privileged one used only for admin work. NIST requires privileged users to use non-privileged accounts for non-security tasks.
3. Give service accounts only the database, folder or API permissions their application uses; never domain or global admin "to make it work".
4. Make elevation temporary: just-in-time permissions in a privileged access management tool, or sudo for one command instead of a root shell.
5. Review privileges regularly and remove what cannot be re-justified; disable accounts that have expired, are inactive or no longer belong to anyone.

**Why it matters:** most attacks need privileges to spread. Ransomware launched from a standard user account on a hardened laptop does far less than the same file run by a domain admin reading email. Least privilege also limits mistakes: a junior admin without delete rights on production cannot delete production.

**Common confusions:** Least privilege is about how much access; need to know is the narrower idea that even cleared people see only the information their task requires. Least privilege is not separation of duties: separation splits a sensitive task between people so one person cannot complete it alone. Least privilege applies to software and machines, not only humans.

**Scenario:** A web application's database account can create logins and read every database on the server; an SQL injection flaw then exposed all of them. The fix is least privilege for the service account (only its own tables, read and write). The closest wrong answer, "encrypt the database", protects data at rest but not data the application's own over-powered account is allowed to read.

Worked mini-example, a tightened grant: before `app_svc: db_owner on SERVER`; after `app_svc: SELECT, INSERT, UPDATE on ShopDB.Orders, ShopDB.Customers; no other databases`.

### Multifactor authentication (MFA) and authentication factors (know, have, are, somewhere you are)
Multifactor authentication requires two or more DIFFERENT kinds of factor before granting access. It is a preventive technical control that protects confidentiality and integrity by making a stolen password alone useless. The factors the SY0-701 objectives list:

| Factor | What it proves | Examples | Main weakness |
|---|---|---|---|
| Something you know | A secret in memory | Password, PIN, passphrase | Guessed, phished, reused |
| Something you have | Possession of an object | Smart card, hardware token, security key, phone with an authenticator app | Lost or stolen; some codes can be phished |
| Something you are | A body trait | Fingerprint, face, iris, voice | Cannot be changed if copied; false matches |
| Somewhere you are | Location | IP geolocation, GPS, being on the corporate network | Spoofed by VPNs and proxies; usually supporting, not alone |

How a sound MFA design works:
1. Combine factor types, never two of the same kind: a password plus a PIN is still single-factor (both are known secrets).
2. Prefer phishing-resistant factors for high-value accounts: NIST says only cryptographic authenticators (security keys, smart cards, passkeys) resist phishing; codes typed by hand, push approvals and SMS do not, because the code is not tied to the real site.
3. Use location and device signals to require MORE checks (step-up), rather than as the only factor.
4. Protect enrollment and recovery as strongly as login; attackers target the reset path.

**Why it matters:** password reuse and phishing make passwords alone unreliable. Security guidance from OWASP ranks MFA as the strongest single defense against password attacks such as credential stuffing and password spraying. SMS codes remain the weakest common second factor: NIST lists codes sent over the phone network as a "restricted" authenticator because of SIM swaps and number porting.

**Common confusions:** Two-step is not always two-factor: a password then a security question is two steps, one factor. Somewhere you are is listed as a factor in the SY0-701 objectives. "Something you do" (typing rhythm, signature) is sometimes discussed but is not in this objective's list. A phone is "something you have" only when the code or key is tied to that device.

**Scenario:** Users sign in with a password and then answer "your first pet's name". The design is single-factor, because both are something you know. The fix is a second factor of another type, such as an authenticator app or security key. The closest wrong answer, "add a third question", adds steps but no new factor.

### Biometrics in authentication (FAR, FRR, crossover error rate)
Biometrics authenticate by measuring a physical or behavioral trait: fingerprint, face, iris, retina, voice, or typing pattern. They deliver the "something you are" factor and systems commonly keep a template (a mathematical summary of the trait) rather than the raw picture.

Accuracy measures:
- **False acceptance rate (FAR):** the share of impostor attempts wrongly accepted. A security failure.
- **False rejection rate (FRR):** the share of genuine attempts wrongly rejected. A usability failure.
- **Crossover error rate (CER), also called equal error rate (EER):** the point where FAR and FRR are equal when the matching threshold is adjusted. A lower CER means a more accurate system, so CER is a common single figure for comparing products.

How tuning works:
1. Raising the match threshold (demanding a closer match) lowers FAR and raises FRR.
2. Lowering it does the reverse.
3. High-security doors are tuned for low FAR and accept more re-tries; consumer phones lean toward low FRR.

Good practice: use a biometric to unlock something you have (a phone, a laptop's secure chip, a security key) rather than as a standalone network password; add liveness or presentation attack detection against photos and fake fingers; limit attempts. NIST SP 800-63B-4 allows no more than five failed biometric attempts in a row (ten with presentation attack detection); after that each further try must wait at least 30 seconds, and after 50 failures in a row (100 with presentation attack detection) the biometric is disabled and another factor offered. NIST also allows a biometric only as part of MFA with a physical authenticator, never alone.

**Why it matters:** a biometric cannot be reissued. If a template database leaks, a password can be changed but a fingerprint cannot, so templates must be protected and matching done on the device where possible.

**Common confusions:** FAR is the dangerous one for security; FRR is the annoying one. Do not mix up the CER (comparison point) with either rate alone. Biometrics are "something you are", not "somewhere you are".

**Scenario:** Two fingerprint readers are compared for a server room: one has a CER of 2 percent, the other 0.5 percent. Choose the 0.5 percent reader, since a lower crossover rate means better overall accuracy. The closest wrong answer, "the one with the lowest FRR", picks convenience and may let impostors in.

### Hard and soft authentication tokens (TOTP, HOTP one-time passcodes)
Authentication tokens generate one-time passcodes (OTPs) that prove possession of a device: the "something you have" factor. A **hard token** is a dedicated physical device such as a key fob with a small screen; a **soft token** is an authenticator app on a phone or computer. Both hold a secret seed shared with the server and compute codes from it.

How the two code types work:
- **HOTP (HMAC-based one-time password, RFC 4226):** the code is computed from the seed and a counter that goes up each time a code is used. The server tracks the counter and accepts a small look-ahead window if the token was pressed without logging in.
- **TOTP (time-based one-time password, RFC 6238):** the same algorithm, with the counter replaced by the number of time steps since a fixed start time; the recommended step is 30 seconds. The server allows a small clock drift window (the RFC suggests at most one step for network delay) and must refuse a code that was already accepted once.

Typical enrollment and use:
1. The server creates a random seed and shows it once, usually as a QR code, which the app or token stores.
2. At sign-in the user types the current six-digit code after their password.
3. The server computes the expected codes in its window and compares.

Strengths and limits: codes are short-lived and useless alone, but they are typed by the user, so a fake login page can relay them to the real site in real time (an adversary-in-the-middle phish). NIST counts OTPs as not phishing resistant. Codes delivered by SMS or voice call are weaker still: NIST lists them as restricted because of SIM swaps and number porting, and requires a stronger alternative to be offered.

**Why it matters:** OTP tokens are cheap, work offline and stop password-only attacks, which makes them the common baseline MFA. For administrators and high-value staff, security keys are the stronger choice.

**Common confusions:** Hard versus soft is about the device (dedicated hardware versus an app), not about the algorithm; both can run TOTP. HOTP changes per use, TOTP per time step. A push notification ("Approve sign-in?") is not an OTP; it is an out-of-band approval and is open to MFA fatigue, also called push bombing (a flood of prompts until the user approves one by accident or to stop them); number matching, where the user types a number shown on the login screen into the app, reduces it.

**Scenario:** Field engineers work in sites with no phone signal and need a second factor. A hardware TOTP token or an authenticator app (both work offline) fits. The closest wrong answer, SMS codes, needs signal and is a restricted authenticator.

Worked mini-example: seed shared at enrollment; time step = 30 s; Unix time 1763200015 gives step 58773333; the token shows 482 913 until second 1763200020, then a new code.

### Security keys (FIDO2, WebAuthn and U2F hardware authenticators)
A security key is a small USB or NFC device that signs in with public key cryptography under the FIDO standards (FIDO2, made of WebAuthn and CTAP, and the older U2F). It delivers "something you have", often combined with a PIN or fingerprint on the key, and is the strongest common defense against phishing.

How it works:
1. **Registration:** the website (the relying party) asks the key to create a new key pair scoped to the site's domain (its relying party ID). The private key stays on the key; the public key goes to the site.
2. **Authentication:** the site sends a random challenge. The browser passes it to the key together with the origin the user is really on.
3. The key checks the user is present (a touch) and, if required, verifies the user (PIN or biometric on the key), then signs the challenge and origin data.
4. The site verifies the signature with the stored public key and checks the origin.

Why it resists phishing: the credential only works for the domain it was created for, and the signed response carries the real origin. A look-alike domain gets either no credential at all or a response the real site rejects. NIST places this "verifier name binding" among the phishing-resistant methods, along with client-certificate smart cards.

**Why it matters:** there is no code to type, so there is nothing for a phishing page to relay; there is no shared secret on the server, so a database breach yields only public keys. Organizations that issue keys to administrators remove the most damaging phishing outcome.

**Common confusions:** A security key is not an OTP token: it does not display a code. "User presence" (a touch) is not "user verification" (PIN or biometric on the key). Losing a key does not leak the account, but users need a backup key or a recovery path, or they lock themselves out. Passkeys use the same standards; a device-bound passkey on a hardware key is a security key.

**Scenario:** After a wave of fake login pages captured employees' authenticator codes, the security team wants administrators protected even if they click a convincing phishing link. Issue FIDO2 security keys. The closest wrong answer, "move from SMS to authenticator app codes", is an improvement but codes can still be relayed by a real-time phishing proxy.

### Password length and complexity (password policy strength settings)
Length is the minimum number of characters a password must have; complexity is a rule that passwords mix character types (uppercase, lowercase, digits, symbols). Both are preventive technical settings meant to make guessing and brute force harder. The SY0-701 objectives list both; current NIST guidance strongly favors length.

How each works:
1. **Length:** every added character multiplies the number of possible passwords, so time to brute force grows exponentially with length. Passphrases (several random words) make long passwords memorable.
2. **Complexity:** enlarges the alphabet per character, but people respond with predictable patterns (capital first, digit and "!" at the end), so real-world strength gains are smaller than the math suggests.

What NIST SP 800-63B-4 (2025) requires of verifiers:
- at least 15 characters for a password used as the only factor, at least 8 when it is used as part of MFA;
- should accept passwords of at least 64 characters, including spaces and Unicode characters;
- check every new password against a blocklist of common, expected and breached passwords, and tell the user why it was rejected;
- do NOT impose composition rules (required character mixes);
- no hints and no security questions when choosing a password;
- limit consecutive failed attempts (no more than 100 per account).

**Why it matters:** short or common passwords fall to spraying and offline cracking within hours, and complexity rules often produce "Winter2026!" style passwords that are on every attacker's list. Length plus a breached-password check stops more real attacks.

**Common confusions:** Complexity here is a password setting; "complexity" in objective 4.7 is a drawback of automation. A long password is not a strong one if it is a known phrase or appears in a breach list. Complexity is still listed in the objectives and still common in real policies, so it remains a setting to know even though NIST no longer recommends it.

**Scenario:** An audit finds users choosing "Password1!" because it satisfies the 8-character complexity rule. The best change is a longer minimum (a passphrase policy) plus a blocklist of common passwords. The closest wrong answer, "add a symbol requirement", is already met by the weak example.

### Password reuse, expiration and minimum age (password history settings)
Three policy settings control how passwords change over time. **Reuse** is blocked by a password history that remembers recent passwords. **Expiration** (maximum password age) forces a change after a set period. **Age** (minimum password age) makes a user keep a new password for a set time before changing it again. They are preventive technical settings, usually set in a domain or identity provider password policy.

How the three interact:
1. History: the system stores a number of previous passwords (Windows allows 0 to 24 and recommends 24) and rejects a new password that matches one of them.
2. Expiration: after the maximum age (Microsoft's documentation for the Windows setting suggests 30 to 90 days, with a default of 42 days, and notes that Microsoft's own security baseline no longer includes password expiration) the user must choose a new password.
3. Minimum age: blocks another change until the period passes (Windows allows 0 to 998 days and recommends 1 day). Without it, a user who must change can change the password many times in a row in a few minutes, push the old one out of the history, and set it again. With a history of 24, a minimum age of 0 lets that happen; a minimum age of 1 day stops it.
4. Minimum age must be lower than maximum age, unless passwords never expire.

Reuse across sites is the other half of the reuse problem: when one site is breached, attackers try the same email and password everywhere (credential stuffing). History settings cannot see other sites; password managers, breached-password checks and MFA address it.

Current guidance: NIST SP 800-63B-4 says verifiers must not force periodic changes, and must force a change when there is evidence the password was compromised. Frequent forced changes lead to predictable patterns (Spring2026, Summer2026). The classic settings are still listed in the objectives and widely deployed; know both.

**Why it matters:** a password that never changes after a breach stays useful to the attacker; a policy that forces changes without a minimum age is defeated in minutes by users cycling back to a favorite.

**Common confusions:** Expiration is the MAXIMUM age; "age" in this objective means MINIMUM age. History alone does not stop reuse; it needs a minimum age. Account lockout (wrong attempts) is a different setting from any of these.

**Scenario:** The help desk notices users keep the same password for years even though the policy remembers 12 past passwords and forces a change every 90 days. The missing setting is minimum password age. The closest wrong answer, "increase history to 24", only makes users cycle 24 times instead of 12.

Worked mini-example, a domain policy: Enforce password history = 24; Maximum password age = 0 (never, following current NIST guidance; change on evidence of compromise); Minimum password age = 1 day; Minimum length = 15.

### Password expiration vs minimum age vs history (password setting comparison)
These settings are easy to confuse because each stops a different behavior, and picking the wrong one leaves the problem in place.

| Setting | Also called | What it stops | Clue in a scenario |
|---|---|---|---|
| Expiration | Maximum password age | One password being used for ever, including after an unnoticed compromise | "Passwords never change", "force a change every N days" |
| Age | Minimum password age | Changing many times in a row to get back to an old password | "Users cycle back to their old password despite history" |
| Reuse | Password history, remembered passwords | Choosing one of the last N passwords again | "Users pick a password they used last time" |
| Length | Minimum length | Short, quickly brute-forced passwords | "Cracked in minutes", "8 characters" |
| Complexity | Composition rules | Single-character-type passwords | "Only lowercase letters allowed" |

How to read a scenario:
1. Is the user setting an old password again? If the policy already has history, the answer is minimum age; if it has no history, the answer is history (reuse).
2. Is the same password staying in use far too long? Expiration (or, in current practice, forced change on compromise).
3. Are passwords guessed or cracked quickly? Length first, then a blocklist; complexity is the older answer.

**Why it matters:** choosing the wrong control leaves the behavior untouched while giving the appearance of a stricter policy. For instance, shortening expiration from 90 to 30 days makes cycling worse, not better, when minimum age is zero.

**Common confusions:** In the SY0-701 objectives "age" means minimum age, because maximum age is listed separately as expiration. Lockout threshold and lockout duration are separate settings against online guessing, not part of this group. NIST's modern guidance drops expiration and complexity but keeps length and blocklists; the objectives still list the classic settings.

**Scenario:** A security review says "users change their password five times in a minute to get back to their favorite". Minimum age stops this. The closest wrong answer, expiration, is what forces the first change but does nothing to stop the cycling.

### Password managers
A password manager is an application that generates, stores and fills strong, unique passwords in an encrypted vault, unlocked by one strong master credential and ideally MFA. It is a user-side technical control that removes the human reason for reuse: nobody can remember a different 24-character password for every site, but a manager can.

How it works:
1. The user creates a vault protected by a long master passphrase (and MFA where offered).
2. For each site, the manager generates a long random password and saves it with the site's address.
3. At sign-in it fills the saved password for that site, so the user never types or remembers it.
4. Enterprise versions add shared vaults for teams, central policy, and removal of a leaver's access to shared entries.

NIST SP 800-63B-4 requires sites to allow password managers and autofill, and says they should allow pasting into password fields, because blocking paste pushes users back to short, memorable passwords.

**Why it matters:** credential stuffing works because people reuse passwords. Unique passwords per site turn a breach at one site into a problem for that site only.

**Common confusions:** A password manager is a user tool; password vaulting in a privileged access management system is the enterprise control for admin and service accounts, with check-out, rotation and session recording. A browser's built-in password store is a password manager too, with fewer enterprise controls. The vault's master credential becomes a high-value target, so protect it with MFA and never reuse it.

**Scenario:** Staff reuse one password across vendor portals, and a breach at one vendor led to logins at two others. Roll out a company password manager plus MFA. The closest wrong answer, "force password changes every 30 days", does not stop reuse across different sites.

### Passwordless authentication (passkeys, security keys, platform biometrics)
Passwordless authentication signs a user in without a typed password, usually with a cryptographic key on a device unlocked by a biometric or PIN: passkeys, security keys, platform authenticators such as a laptop's face or fingerprint sign-in, or smart cards. Passwordless removes the shared secret attackers phish, guess and reuse.

How a passkey sign-in works (FIDO2 standards):
1. When the user registers, the device creates a key pair for that site. The site keeps only the public key.
2. At sign-in, the site sends a challenge; the user unlocks the device with a fingerprint, face or PIN (that check happens on the device; the biometric is not sent).
3. The device signs the challenge with the private key and the site verifies it with the public key.
The result is usually multifactor in one gesture: something you have (the device holding the key) plus something you are or know (the unlock).

Two kinds of passkey:
- **Synced passkeys** are copied across a user's devices by a passkey provider (a platform or third-party credential manager), end-to-end encrypted. Convenient, and recovery is easier.
- **Device-bound passkeys** never leave the device that made them, such as a hardware security key. Highest assurance; NIST does not allow syncable (exportable) keys at its highest authenticator level, AAL3.

**Why it matters:** with no password there is nothing to phish, spray or stuff, and a breach of the site's database yields only public keys. Help desk password resets drop.

**Common confusions:** Passwordless does not mean single-factor: the device plus its unlock usually counts as two factors. Passwordless still needs a strong recovery process for lost devices; a weak recovery path (SMS reset) becomes the new weak point. A biometric unlock on a phone does not send your fingerprint to the website. A push approval on a registered phone can also replace the typed password, but NIST does not count push approvals as phishing resistant (and no longer accepts a prompt the user merely approves: a code must be carried between the screens, as in number matching), so passkeys and security keys are the stronger passwordless options.

**Scenario:** A retailer wants customers to stop falling for password phishing without adding a code step. Offer passkeys. The closest wrong answer, "SMS one-time codes", adds friction and is still phishable.

### Privileged access management (PAM) tools
Privileged access management tools secure, control and record the use of accounts with elevated rights: domain and cloud administrators, root, database administrators, network device admins and service accounts. The three features this objective lists are just-in-time permissions, password vaulting and ephemeral credentials. PAM is a mix of preventive and detective technical controls that applies least privilege to the accounts that can do the most damage.

How a typical PAM workflow runs:
1. Admins hold no standing privileged rights; they are "eligible" for a role.
2. To do privileged work, the admin requests access in the PAM tool, gives a reason (often a change ticket) and passes MFA.
3. An approver, or a policy, grants it for a set time.
4. The tool either elevates the admin's account for that window (just-in-time), or checks out a vaulted credential, or issues a short-lived credential (ephemeral).
5. Sessions may be proxied and recorded; every request, approval and action is logged.
6. When the window ends, rights are removed and any checked-out password is rotated.

Features worth knowing beyond the three names: approval workflows, session recording for audit, automatic password rotation, and access reviews of who is still eligible. A cloud example is Microsoft Entra Privileged Identity Management, which offers time-bound role activation with approval, MFA, justification, notifications, access reviews and downloadable audit history, and refuses to remove the last active Global Administrator.

**Why it matters:** attackers aim for privileged accounts because one stolen admin credential can disable defenses, read every mailbox or encrypt every server. Removing standing admin rights shrinks the time window and the number of accounts worth stealing.

**Common confusions:** PAM is not the same as identity and access management (IAM) in general: IAM covers every user; PAM focuses on the privileged few. PAM password vaulting is not a personal password manager. Recording admin sessions is a detective control; removing standing rights is preventive.

**Scenario:** An audit finds 40 people permanently in the domain admins group and shared admin passwords in a spreadsheet. Deploy a PAM tool: eligible roles with just-in-time activation, and a vault with rotation for the shared accounts. The closest wrong answer, "enforce MFA on admin accounts", helps but leaves 40 standing admins and the spreadsheet in place.

### Just-in-time (JIT) permissions
Just-in-time permissions grant elevated rights only when they are requested and approved, for a limited period, and then remove them automatically. There are no standing admin rights between tasks. It is a preventive control that puts least privilege into practice for administrators.

How it works:
1. The user is made eligible for a privileged role but is not an active member of it.
2. When needed, the user activates the role in the PAM tool, choosing a duration within the maximum the admins set and giving a reason.
3. Activation may require MFA and approval by a designated approver.
4. The user works with the elevated rights; activation, approval and use are logged and notifications go out.
5. When the time expires, the rights are removed without anyone remembering to do it.

In Microsoft Entra Privileged Identity Management the terms are "eligible" (must activate before use) versus "active" (holds the rights now), and assignments can themselves be time-bound with start and end dates. The access granted is the same either way; the difference is that eligible users hold it only when they need it.

**Why it matters:** an attacker who phishes an admin while no role is active gets an ordinary account. The window for misuse drops from always to a few hours, and every elevation leaves a record with a reason.

**Common confusions:** JIT changes the rights of an existing account for a while; ephemeral credentials are new, short-lived secrets. JIT is not the same as a password vault check-out, although PAM tools often combine both. Time-of-day restrictions limit when an account can sign in at all; JIT limits when it holds extra rights.

**Scenario:** A database administrator needs owner rights on production only during a monthly patch window. Make her eligible for the role and require activation for up to four hours with approval. The closest wrong answer, "password vaulting", would protect a shared admin password but still leave a standing privileged account.

Worked mini-example, an activation record: user = r.okafor; role = SQL-Prod-Owner; requested 21:55; approved by m.lind 21:58 (MFA passed); active 22:00 to 02:00; justification = change CHG-4471; status at 02:00 = expired, rights removed.

### Password vaulting (privileged credential vault)
Password vaulting stores privileged account passwords (root, local admin, service accounts, network device logins, break-glass accounts) in a secured, access-controlled, audited vault inside a PAM tool. People check a credential out when they need it, and the vault usually changes the password after use, so nobody keeps a working copy.

How it works:
1. Privileged accounts are onboarded to the vault, which takes over their passwords and sets long random values.
2. An authorized admin requests a credential (with MFA, and approval if required).
3. The vault releases the password for a limited time; some tools instead open the session for the admin so the password is never shown.
4. Every check-out records who, when, which account and why; sessions may be recorded.
5. On check-in or after a set time, the vault rotates the password automatically.
6. Emergency (break-glass) credentials are vaulted too, with alerting on any use.

**Why it matters:** shared admin passwords in spreadsheets, scripts or sticky notes are a favorite find for attackers and leave no trail of who used them. Vaulting gives individual accountability for shared accounts and makes a stolen password stale quickly.

**Common confusions:** Password vaulting is the enterprise privileged control; a password manager is the everyday user tool. Vaulting protects existing long-lived accounts; ephemeral credentials avoid long-lived secrets altogether. Rotation after use is what makes a checked-out password worthless later.

**Scenario:** Three engineers share one root password for the core switches, written in a team wiki, and nobody can say who changed a config last week. Vault the root account with individual check-out and automatic rotation. The closest wrong answer, "change the root password every 90 days", still leaves one shared, untraceable password.

Worked mini-example, a vault audit line: 2026-03-04 09:12 checkout core-sw-01\admin by j.patel (ticket NET-212, MFA ok); 09:47 check-in; 09:48 password rotated (32 random characters).

### Ephemeral credentials (temporary short-lived credentials)
Ephemeral credentials are temporary credentials created for one session or task that expire on their own after a short time. Because they are short-lived and generated on demand, there is no long-term secret to steal, store or forget to rotate. They are common in cloud platforms, PAM tools and automation pipelines.

How it works, using a cloud role as the example:
1. A user, application or pipeline job proves who it is (its own identity, often with MFA for humans).
2. It asks a security token service to "assume" a role that carries the needed permissions.
3. The service returns a temporary set: an access key id, a secret key and a session token, with an expiry time.
4. The job uses them; when they expire they stop working, with nothing to revoke.

Real numbers, from AWS Security Token Service: AssumeRole sessions last from 15 minutes up to the role's maximum session duration, which can be set between 1 and 12 hours, with a default of 1 hour; a session obtained by one assumed role assuming another (role chaining) is limited to 1 hour. A session can be narrowed further with a session policy, never widened beyond the role's own permissions.

**Why it matters:** a long-lived access key that leaks (committed to a code repository, printed in a build log, copied to a laptop) keeps working until someone finds and revokes it. A key that expires in an hour limits that damage, and nothing piles up waiting to be rotated.

**Common confusions:** Ephemeral credentials are throwaway secrets; just-in-time permissions give temporary rights to a lasting account. A one-time password is also short-lived, but it is a second factor for a person's sign-in, not a working credential for API calls. Ephemeral does not mean unlogged: in AWS, the role session name and source identity appear in CloudTrail audit logs.

**Scenario:** A nightly backup job uses an access key created three years ago and stored in a script. Replace it with a role the job assumes at run time to get one-hour credentials. The closest wrong answer, "vault the access key", protects storage but still leaves a permanent key that works if it leaks.

Worked mini-example, a temporary credential set: AccessKeyId = ASIA...EXAMPLE; Expiration = 2026-05-10T03:15:00Z; AssumedRole = backup-writer/nightly-job.

### Just-in-time permissions vs password vaulting vs ephemeral credentials (PAM features compared)
The three privileged access management features all shorten how long powerful access exists, but each acts on a different thing: the rights, the password, or the credential itself.

| Feature | What is temporary | What stays | Best fit | Clue words |
|---|---|---|---|---|
| Just-in-time permissions | The elevated RIGHTS on a person's own account | The account | Named admins who need power occasionally | "eligible", "activate for two hours", "no standing admin" |
| Password vaulting | Access to a stored PASSWORD (checked out, then rotated) | The privileged account and its password, now secret and rotated | Shared, built-in or device accounts that must exist (root, local admin, switch admin, break-glass) | "check out", "rotate after use", "shared password in a spreadsheet" |
| Ephemeral credentials | The CREDENTIAL itself, created on demand | Nothing long-lived to steal | Cloud jobs, pipelines, one-off sessions | "temporary token", "expires in 15 minutes", "assume role" |

How to choose:
1. A person needs admin rights now and then: just-in-time permissions.
2. An account must keep a password because the system demands one (a network switch's admin, a legacy app): vault it and rotate after each use.
3. A program or short task needs to call an API: issue ephemeral credentials instead of a stored key.
4. Combine them: an admin activates a JIT role, which lets them check out a vaulted credential or get a temporary cloud session; all three leave an audit trail.

**Why it matters:** each gap has its own failure. Standing admin rights fail when the admin is phished; unvaulted shared passwords fail when someone leaves or a spreadsheet leaks; stored keys fail when code is published. Picking the matching feature closes the matching gap.

**Common confusions:** All three support least privilege, but only JIT changes what an existing identity may do. Vaulting does not by itself reduce the privileges of the vaulted account; it controls who can use it and makes the password short-lived in practice. Ephemeral credentials are not the same as a one-time passcode for MFA.

**Scenario:** A team's build server needs to upload artifacts to cloud storage every hour. Choose ephemeral credentials (a role assumed per run), because no person is involved and no stored key should exist. The closest wrong answer, just-in-time permissions, is designed for a human requesting elevation, not an automated job.

### Choosing an identity and access control (decision path for objective 4.6)
A scenario describes a problem, and several controls from this objective may look plausible. Map the goal or constraint to the control, and know when a control is the wrong tool.

| Goal or problem in the scenario | Choose | Do NOT choose it when |
|---|---|---|
| Leavers or contractors still have access | De-provisioning tied to HR (with SCIM for SaaS) | The issue is what current staff can do (that is permissions) |
| A mover kept old rights | Group or role assignment plus access reviews (attestation) | The person never had the rights (look at escalation instead) |
| Confirm a stranger is who they claim before issuing an account | Identity proofing (ID check plus liveness) | They already have an account and are logging in (that is authentication) |
| One login for many internal apps | SSO through an identity provider, with MFA | Users belong to another organization (federation) |
| Partner's staff use their own company logins | Federation (SAML or OIDC) | Everything is inside one organization |
| App acts on user data elsewhere without the password | OAuth 2.0 | The app needs to know who the user is (add OpenID Connect) |
| Classification labels, clearances, no re-sharing | MAC | Owners must decide sharing day to day (DAC) |
| Access by job title | RBAC | Several context conditions decide (ABAC) |
| Device, place, time and department combined | ABAC | One blanket condition for all (rule-based) |
| Stop phishing of passwords and codes | FIDO2 security keys or passkeys | Users cannot carry or register devices (then app-based codes with number matching as interim) |
| Users cycle back to old passwords | Minimum password age | No history is configured yet (set history first) |
| Reuse across websites | Password manager, MFA, breached-password checks | The problem is inside one domain's history (history plus minimum age) |
| Too many standing admins | PAM with just-in-time roles | The account is a shared device login (vault it) |
| Scripts with permanent cloud keys | Ephemeral credentials from an assumed role | A human needs interactive elevation (JIT) |

How to work a scenario:
1. Name the actual failure (who got in, what they could do, how they proved identity).
2. Find the control that removes that failure, not one that only makes it harder.
3. Check the scope words: "partner" points to federation, "label" to MAC, "on behalf of" to OAuth, "eligible" to JIT.

**Why it matters:** many tempting answers are good controls in general (MFA, encryption, longer passwords) that do not touch the failure described.

**Common confusions:** MFA does not fix excessive permissions, and least privilege does not fix stolen passwords. SSO increases convenience; it is a security gain only with MFA and fast de-provisioning behind it.

**Scenario:** "A cloud app lets departed employees keep working for weeks because accounts are created by hand." Answer: automated de-provisioning through the identity provider (SCIM). The tempting wrong answer, "require MFA", leaves the account fully usable by its old owner.

## 4.7 Explain why automation and orchestration matter for secure operations
Depth asked: explain. An answer says what a use case does, which benefit it brings, and which drawback it carries, and tells automation (one task) apart from orchestration (many tasks across tools).

### Automation, scripting and orchestration in security operations (SOAR)
**Automation** is a script or tool doing one task without a person: creating an account, blocking an address, opening a ticket. **Scripting** is the usual way to build it (PowerShell, Python, Bash, or a vendor's rule language). **Orchestration** coordinates many automated tasks across different tools into one workflow with decisions in between. A **SOAR** platform (security orchestration, automation and response) is the tool category built for this in a security operations center (SOC); some SIEM products include SOAR features.

How a SOAR playbook typically runs on a phishing alert:
1. **Trigger:** the SIEM raises an alert, or an automation rule matches an incident.
2. **Enrichment:** look up the sender, links and attachments in threat intelligence; pull the user's recent sign-ins.
3. **Decision:** if the link is known malicious, continue automatically; if uncertain, assign to an analyst with the evidence attached.
4. **Response:** remove the message from every mailbox, block the sender and URL, reset the user's sessions.
5. **Record:** open or update the ticket with every step taken, and close or escalate.

Playbooks can run automatically on a trigger or be launched by an analyst on demand; automation rules can also tag, assign or close incidents without a full playbook.

**Why it matters:** SOCs receive more alerts than people can read, so many go uninvestigated. Automating the predictable enrichment and response steps frees analysts for real investigation and hunting, and acts in seconds at any hour.

**Common confusions:** A SIEM collects and correlates events and raises alerts; SOAR acts on them. Automation is a single step; orchestration chains steps and tools. A bad playbook acts at machine speed too: one wrong condition can disable hundreds of accounts, so playbooks need testing, change control and an off switch.

**Scenario:** A SOC wants every alert about a known malicious domain to be enriched, the host isolated, the domain blocked on the proxy and a ticket opened, without waiting for an analyst. That is orchestration through a SOAR playbook. The closest wrong answer, "a script on the firewall", automates one step on one tool but does not coordinate the others.

In this objective, the SIEM is the alert source, see `### Security information and event management (SIEM)`.

### User provisioning automation (HR-driven account life cycle)
User provisioning automation creates, changes and removes accounts and their access from a trusted source, usually the HR system, without manual tickets. It is the automated form of the joiner, mover, leaver process in objective 4.6.

How it works:
1. HR records a hire, transfer or termination with a role, department and dates.
2. An identity governance or IdP connector reads the change (on a schedule or by event).
3. Rules map attributes to access: department and job code decide groups, licenses and apps.
4. Connectors create or update accounts in the directory and, through SCIM or vendor APIs, in cloud apps.
5. For leavers, accounts are disabled at the termination time and sessions revoked; deletion follows after the retention period.
6. Every change is logged for audit; exceptions go to a person for approval.

NIST's account management control asks that temporary and emergency accounts be removed or disabled automatically after a set time, rather than when an administrator gets to it, because automatic removal is more consistent.

**Why it matters:** manual provisioning is slow on day one (lost productivity) and slower on the last day (orphaned accounts). Automation makes both consistent, and leavers lose access across dozens of apps within minutes.

**Common confusions:** User provisioning automation is about people's accounts; resource provisioning is about servers, storage and networks. Automating provisioning does not remove the need for access reviews: rules can grant the wrong thing consistently.

**Scenario:** A company with 40 SaaS apps finds former staff still in half of them months later. Automate provisioning from HR through the identity provider with SCIM to each app. The closest wrong answer, "quarterly access reviews", would find the problem later instead of preventing it.

Worked mini-example, a rule: when job_code = "AP-CLERK" then groups = [Finance-AP, M365-E3]; apps = [ERP:ap_clerk]; on termination_date: disable at 17:00 local, revoke tokens, notify manager.

### Resource provisioning automation (infrastructure as code)
Resource provisioning automation builds and removes infrastructure (virtual machines, containers, storage, networks, cloud services) from templates or code instead of by hand. Infrastructure as code (IaC) is the common method: the desired compute, network and storage setup is written as code, stored in version control and applied by a tool.

How it works:
1. Engineers write the template or IaC file, starting from an approved hardened image and settings.
2. The file is reviewed and scanned like application code before use.
3. A pipeline or tool applies it, creating identical resources each time.
4. Resources are tagged with owner and expiry.
5. When the project ends, the same code tears the resources down, so nothing is left running and unpatched.

**Why it matters:** hand-built servers drift apart and get forgotten; forgotten test servers are a classic way in. Building from reviewed code means every instance starts secure, and the code itself is a record of what exists.

**Common confusions:** Resource provisioning creates infrastructure; user provisioning creates accounts. IaC makes configurations standard at build time; enforcing baselines keeps them correct afterward. A mistake in a template is copied to every resource built from it, so templates need review.

**Scenario:** Developers request test servers by email and three were found months later, unpatched, with public IP addresses. Automate resource provisioning from a hardened template with automatic expiry. The closest wrong answer, "run monthly vulnerability scans", finds the forgotten servers but does not stop them being created that way.

Worked mini-example, the intent of a template: image = approved-linux-2026-04; disk encryption = on; public IP = none; logging agent = installed; tags = owner:team-web, expires:2026-07-01.

### Guard rails (automated policy controls in cloud and IT operations)
Guard rails are automated checks and limits that keep changes inside approved boundaries: they block, flag or reverse a change that would break policy, without someone reviewing every change by hand. Some are preventive (the change is refused), some detective (the change is reported). AWS Control Tower used the term "guardrails" for its rules and now calls them "controls", applied to every account in an organizational unit; it describes preventive, detective and proactive controls.

How guard rails are used:
1. Write the policy as a rule: no publicly readable storage; no resources outside approved regions; no security group open to the whole internet on remote admin ports; encryption required on new disks.
2. Choose the behavior: block the action outright, check resources before they are created, or detect and alert (or auto-fix) after the fact.
3. Apply the rule at the highest sensible level (an organization, an account group, a subscription), so new projects inherit it.
4. Route violations to a ticket or chat channel and record exceptions with an owner and expiry.

**Why it matters:** in cloud environments anyone with the right role can create resources in minutes, and a single public bucket or open port can expose data. Guard rails make the safe path the default and catch mistakes at machine speed.

**Common confusions:** Guard rails prevent or catch breaking changes; enforcing baselines puts drifted settings back; standard configurations make new builds identical. A detective guard rail does not stop the change, it reports it. Guard rails can be too strict and block legitimate work, so exceptions need a process.

**Scenario:** A developer makes a storage bucket public for a quick test, and the platform immediately refuses the setting across all accounts. That is a guard rail. The closest wrong answer, "data loss prevention", inspects data leaving the organization; it is not the policy that blocked the configuration change.

Worked mini-example, a detective control result: rule = storage-no-public-read; resource = bucket analytics-tmp; status = NON_COMPLIANT; action = alert to cloud-security channel, ticket CLD-903 opened.

### Security group automation (directory groups and cloud security groups)
This use case covers two kinds of "security group", and a scenario may mean either. In directories, a security group is a set of users or computers that permissions are granted to; automating membership keeps access in line with roles. In cloud networks, a security group is a virtual firewall attached to instances or network interfaces; automating its rules keeps network access consistent.

How directory group automation works:
1. Group membership is computed from attributes (department, job code, location) by the identity system.
2. When HR records a transfer, the user is added to the new role's groups and removed from the old ones in the same run.
3. Access to files, apps and VPN profiles follows group membership, so it changes with no extra tickets.

How cloud security groups work and are automated:
1. A security group holds allow rules (source, port range, protocol) for inbound and outbound traffic; traffic not allowed by a rule does not reach the resource.
2. Security groups are stateful: replies to an allowed request are let through automatically.
3. Rules are created by IaC templates and checked by guard rails, so no one hand-edits "allow everything from anywhere".
4. Automation can also change rules on detection, for example moving a suspicious instance into a quarantine group with no access.

AWS guidance: allow remote admin ports (SSH, RDP) only from specific address ranges, never from all addresses, and avoid large port ranges.

**Why it matters:** group membership is the main way access is granted, so stale membership is privilege creep, and hand-edited cloud rules drift open over time.

**Common confusions:** A cloud security group is a stateful firewall attached to instances; a cloud network ACL is a separate filtering layer that can be added on top of it. A directory security group grants permissions to its members; it says nothing about network traffic. Automating group membership does not decide which permissions a group should have.

**Scenario:** An employee moved from sales to marketing and still opens the sales pipeline. Automate group membership from HR data so moves add and remove groups together. The closest wrong answer, "a firewall rule", controls network paths, not application permissions.

### Ticket creation and escalation automation
**Ticket creation** automation opens a record in the help desk or incident system when an event happens, filled in with the relevant details. **Escalation** automation routes an issue to a higher tier, a specialist, on-call staff or management when conditions are met, such as severity or time without a response.

How they work together:
1. A SIEM or monitoring alert fires.
2. Automation opens a ticket with the source, affected host and user, the rule that fired, log excerpts and enrichment, and links it to related tickets.
3. A priority is set from severity and asset value.
4. If no one acknowledges within the target time, the ticket escalates: page the on-call responder, then the incident manager.
5. Every update is time-stamped, giving an audit trail of who knew what and when.

NIST incident handling guidance describes an escalation process for when the team does not respond in time: repeat the contact, then after a short wait (it suggests about 15 minutes) go to a higher level, and keep going up until someone responds.

**Why it matters:** an alert in a console nobody watches is an alert lost. Automatic tickets ensure every event is tracked and measured; automatic escalation keeps critical issues from waiting overnight in a queue.

**Common confusions:** Ticket creation records the work; escalation moves it to the right person. Escalation in this sense is about people, not privilege escalation by an attacker. Too many automatic tickets create alert fatigue, so ticket rules need tuning just like detection rules.

**Scenario:** A critical ransomware alert sat unread from 01:00 to 08:00. Configure automatic escalation that pages on-call staff when a critical ticket is not acknowledged in 15 minutes. The closest wrong answer, "ticket creation", already happened; the ticket existed but nobody was notified.

Worked mini-example: 01:02 ticket SEC-5531 created (severity critical, host FS-02, rule ransomware-ext-change); 01:17 unacknowledged, paged on-call analyst; 01:32 unacknowledged, paged incident manager; 01:35 acknowledged.

### Enabling and disabling services and access automatically
This use case is automation that turns services, ports, features or account access on or off in response to an event, a schedule or a policy. It is used both for prevention (things are off unless needed) and for response (things are switched off the moment a threat is detected).

How it is used:
1. **On detection (response):** an endpoint tool sees ransomware-like behavior; automation isolates the host from the network, disables the user's account and revokes their sessions. A cloud key appears in a public code repository; automation deactivates it.
2. **On schedule (prevention):** remote access for a vendor is enabled only during an agreed maintenance window; test environments shut down at night.
3. **On policy:** a server that drifts from its baseline has an unapproved service stopped; a device that fails a health check loses network access until fixed.
4. **On request:** a just-in-time workflow enables admin access for a set time and disables it afterward.
5. Each action is logged and, for response actions, a ticket records why it happened and how to reverse it.

**Why it matters:** the first minutes of an attack decide how far it spreads. A person who must notice, decide and click takes minutes to hours; automation acts in seconds, even at night. Scheduled disabling also shrinks the attack surface when nobody needs the service.

**Common confusions:** Disabling access is containment, not eradication: the threat is stopped from spreading but not yet removed. Automatic disabling can hurt availability if the detection is wrong (a false positive isolates the CEO's laptop before a board meeting), so high-impact actions often need a human approval step, or apply only to lower-risk assets automatically.

**Scenario:** Endpoint telemetry shows a laptop encrypting files on a network share at 02:00. The fastest control is automated disabling of the account and network isolation of the host. The closest wrong answer, "open a ticket for the morning shift", records the event but lets encryption continue for hours.

Worked mini-example, a response rule: if EDR alert = ransomware-behavior and asset tier is not critical-server then isolate host, disable account, revoke tokens, open ticket; if asset tier = critical-server then page on-call for approval first.

### Continuous integration and testing (automated build and security testing in pipelines)
Continuous integration (CI) means every code change a developer commits is automatically built and tested in a pipeline, so problems are caught soon after they are introduced. Security testing becomes part of that pipeline instead of an occasional separate project. It is the "Sec" in DevSecOps and a preventive control for application integrity.

How a secure CI pipeline runs on each commit:
1. **Build:** compile and package the code in a clean, controlled build environment.
2. **Unit and functional tests:** confirm the code still works, including its security features.
3. **Static analysis (SAST):** scan the source for insecure patterns and coding-standard violations.
4. **Dependency scan (software composition analysis):** check third-party libraries for known vulnerabilities and licenses.
5. **Secret scan:** find passwords and keys committed by mistake.
6. **Dynamic tests (DAST) and fuzzing** where practical, against a running test build.
7. **Gate:** fail the build on findings above an agreed severity; record findings in the team's issue tracker.
Continuous delivery or deployment then moves an approved build onward through the same automated pipeline.

NIST's secure software development framework recommends configuring the toolchain to run automated code analysis and testing regularly or continuously, and adding tests for previously reported vulnerabilities so they do not come back.

**Why it matters:** a flaw found minutes after it is written is cheap to fix; the same flaw found in production after a breach is expensive. Running the same checks on every change also removes "we forgot to scan this release".

**Common confusions:** Continuous integration is about building and testing every change; continuous deployment is about releasing automatically. Static analysis reads code without running it; dynamic analysis tests the running application. A passing pipeline is not proof of security: tools miss logic flaws, so code review still matters.

**Scenario:** A team keeps shipping releases with a vulnerable logging library that a yearly penetration test eventually finds. Add dependency scanning to the CI pipeline with a gate that fails the build on critical findings. The closest wrong answer, "more frequent penetration tests", finds the issue sooner but still after release.

Worked mini-example, a pipeline result: commit 7e41c2a; unit tests 412 passed; SAST 0 high; dependency scan 1 critical (logging library, known remote code execution); gate = FAIL, merge blocked.

### Integrations and application programming interfaces (APIs) in security automation
An application programming interface (API) is a defined way for one program to ask another to read data or take an action. Integrations use APIs to connect security and IT tools so they share data and trigger each other without a person copying information between consoles. APIs are what make orchestration possible.

How an integration works:
1. Tool A (for example a SOAR platform) holds credentials for tool B's API, usually an API key or an OAuth client with limited scopes.
2. On a trigger, tool A calls tool B: query the firewall for a rule, ask the threat intelligence service about a hash, tell the email system to delete a message, tell the EDR to isolate a host.
3. Tool B returns a result in a structured format (usually JSON), which tool A uses to decide the next step.
4. Both sides log the call.

Security points for API integrations:
- Give each integration its own credential with the least privilege it needs (read-only where possible), never an admin account.
- Store API keys in a secrets vault, not in scripts; rotate them; prefer short-lived tokens.
- Watch for API changes from vendors: a changed or retired endpoint silently breaks the automation.
- Monitor API use; a stolen integration key can act with the integration's full rights.

**Why it matters:** without integrations, analysts copy addresses from one screen to another, which is slow and error-prone. With them, a dozen tools from different vendors act as one system.

**Common confusions:** An API is the interface; an integration is the working connection built on it. APIs are also an attack surface: an over-privileged integration key is as dangerous as an admin password. Integrations inherit the privileges of the credential they use, so their keys belong in the same reviews as admin accounts.

**Scenario:** A threat feed flags an address, and the team wants it blocked on the firewall in seconds with no one logging in. Build an integration in which the orchestration platform calls the firewall's API. The closest wrong answer, "a dashboard", would show the address to a person but take no action.

### Automation benefits: efficiency, time saving and reaction time
Two of the listed benefits are about speed, measured differently. **Efficiency and time saving** means each repetitive task takes less effort and finishes sooner. **Reaction time** means the gap between a detection and the response shrinks to seconds, at any hour.

How each shows up:
1. **Efficiency:** account setup that took a technician half an hour runs in under a minute; alert enrichment that took ten minutes of copying between tools happens before the analyst opens the ticket. Fewer manual steps also mean fewer typing mistakes.
2. **Time saving:** the hours freed go to analysis, threat hunting and improvement work that cannot be automated.
3. **Reaction time:** a playbook isolates an infected laptop seconds after the alert, before malware spreads; a leaked cloud key is disabled before anyone has read the notification.

NIST's incident response control lists automated support for incident handling (online incident management, live response data collection, packet capture and forensic analysis tools), and its configuration controls describe automated tools that keep baseline records accurate and current.

**Why it matters:** attackers automate too, and ransomware can encrypt a share in minutes. A defender who responds in hours loses data; one who responds in seconds may lose one laptop. Efficiency also controls cost: the same team handles growth without proportional hiring.

**Common confusions:** Efficiency is about effort per task; reaction time is about speed of response to a threat; workforce multiplier is about how much a fixed team can cover overall. The three often appear together in one scenario, so look for the wording: "each task takes less time" (efficiency), "acts within seconds of the alert" (reaction time), "three analysts cover thousands of endpoints" (workforce multiplier).

**Scenario:** After automation, the time from a malware alert to host isolation drops from 45 minutes to 20 seconds. The benefit named is reaction time. The closest wrong answer, "efficiency", describes effort saved per task, not how fast the response lands after detection.

Worked mini-example, before and after numbers a team might report: password reset ticket handling 12 min to 1 min (efficiency); alert to containment median 38 min to 25 s (reaction time).

### Automation benefits: enforcing baselines and standard infrastructure configurations
**Standard infrastructure configurations** means systems are built identically from the same templates or code, so every server, network device or cloud resource starts with the same approved settings. **Enforcing baselines** means automation keeps checking systems against the approved security baseline and puts back any setting that has drifted. One is about how systems are born; the other is about keeping them right afterward.

How they work together:
1. Define the secure baseline: required settings, disabled services, logging, patch level.
2. Build every system from a template or IaC that already meets it (standard configuration).
3. On a schedule, a configuration management tool compares each system with the baseline.
4. Drift is reported and, for approved settings, corrected automatically; unexpected changes open a ticket because they might be an attack.
5. The baseline itself changes only through change control, and the change rolls out everywhere by the same automation.

NIST asks organizations to keep the baseline configuration current, complete and accurate using automated mechanisms such as configuration management and inventory tools, and to use automation to document proposed changes, ask the approvers, and block changes until they are approved.

**Why it matters:** hand-built systems differ in small ways that break troubleshooting and hide weaknesses. Drift creeps in through quick fixes and attacker changes. Automation gives auditors evidence that every system matches policy and gives responders a known-good state.

**Common confusions:** Standard configurations happen at build time; enforcing baselines happens continuously after. Both differ from guard rails, which block or flag a change as it is made. A baseline is the approved settings; a configuration management tool is what enforces it.

**Scenario:** A nightly job finds that a web server's host firewall was turned off and turns it back on, then opens a ticket. The benefit is enforcing baselines. The closest wrong answer, "standard infrastructure configuration", is what made the server correct when it was built; it does not fix later changes.

### Enforcing baselines vs standard configurations vs guard rails
These three automation ideas all keep systems in a known good state, so they are easy to mix up. The decisive feature is WHEN they act.

| Idea | When it acts | What it does | Clue words |
|---|---|---|---|
| Standard infrastructure configurations | At build time | Every new system is created identically from a template or IaC | "same template", "identical builds", "deployed from one image" |
| Guard rails | At the moment of a change (or just after) | Block, check or flag a change that breaks policy | "cannot make the bucket public", "refused", "policy prevents" |
| Enforcing baselines | Continuously after build | Detect drift from the approved settings and restore them | "drift", "reset to baseline nightly", "settings put back" |

How they layer in one environment:
1. A new server comes from the hardened template (standard configuration).
2. An engineer tries to open the admin port to the whole internet; the cloud policy refuses (guard rail).
3. Months later a local change disables audit logging; the nightly check restores it and alerts (enforcing baselines).

**Why it matters:** each closes a different gap. Without standard builds, systems start inconsistent; without guard rails, risky changes go live; without baseline enforcement, good systems decay.

**Common confusions:** A detective guard rail that auto-corrects looks like baseline enforcement; the difference is that the guard rail reacts to a change event against a policy rule, while baseline enforcement periodically compares the whole system with its baseline. Both are automation benefits or use cases; neither replaces change management.

**Scenario:** "All 200 branch routers are configured from one approved template so none is missing logging." Answer: standard infrastructure configurations. If the description adds "and a weekly job resets any router whose settings were changed", the second part is enforcing baselines.

### Automation benefits: scaling securely, workforce multiplier and employee retention
Three listed benefits are about people and growth. **Scaling in a secure manner** means the organization can add many systems or users fast while each still gets the correct security settings. **Workforce multiplier** means a fixed team accomplishes the work of a much larger one. **Employee retention** means skilled staff stay because tedious, repetitive work is removed.

How each shows up:
1. **Scaling securely:** during a sales peak, auto-scaling adds fifty web servers; each is built from the hardened image, joined to monitoring and covered by the same guard rails, with nobody skipping a checklist under time pressure.
2. **Workforce multiplier:** three analysts monitor thousands of endpoints because enrichment, triage of known-benign alerts and routine containment are automated; people handle only what needs judgment.
3. **Employee retention:** analysts stop closing duplicate alerts by hand and spend time on investigation and hunting; less burnout means less turnover and less loss of hard-won knowledge.

**Why it matters:** security teams commonly face more alerts than staff can read, so alerts are ignored and incidents missed. Hiring alone rarely closes that gap. Automation raises capacity, keeps growth from outrunning security, and protects the experience of the people the organization already has.

**Common confusions:** Workforce multiplier is about total team capacity; efficiency is about effort per task. Scaling securely is about new systems arriving already secured, not about performance tuning. Employee retention is a benefit of automation, not a human resources control such as background checks. Automation does not replace analysts: it changes their work, and someone must still maintain the automation (see ongoing supportability).

**Scenario:** A company doubles its cloud footprint in a quarter while the security team stays at four people, and every new workload still ships with logging, encryption and hardened images. The benefits shown are scaling in a secure manner and workforce multiplier. The closest wrong answer, "reaction time", is about speed of response to a detection, which the scenario never mentions.

**Scenario:** Two senior analysts resigned citing endless manual ticket closing; after triage was automated, attrition fell. The benefit is employee retention.

### Automation considerations: complexity and cost
Automation is not free or risk-free. **Complexity** means automated workflows and integrations become hard to build, understand, troubleshoot and change, and the complexity itself causes errors. **Cost** means money and time for tools, licenses, development, integration and training must be spent before any saving appears.

How complexity grows and is managed:
1. Each new integration adds a dependency: an API, a credential, a data format, a failure mode.
2. Chains of scripts across several tools can fail silently in the middle, leaving half-finished actions.
3. Manage it with documentation, version control, testing in a non-production environment, clear ownership, logging at every step and alerts when a workflow fails.
4. Prefer a few well-understood playbooks to many clever ones.

How cost is judged:
1. Count the up-front spend (platform license, integration project, training) and the running spend (maintenance hours, renewals).
2. Compare with hours saved, incidents shortened and errors avoided.
3. Automate high-volume, rule-based tasks first; a task done twice a year rarely repays automation.

**Why it matters:** an automation project that costs more than it saves, or that nobody can debug at 03:00, weakens operations instead of strengthening them. A complex workflow can also hide a security flaw, such as an over-privileged integration account nobody remembers.

**Common confusions:** Complexity here is an automation drawback, not the password complexity setting in objective 4.6. Cost includes staff time, not only licenses. Complexity is about how hard the automation is to understand now; technical debt is about shortcuts that will need rework later; they often occur together.

**Scenario:** A response workflow spans five tools; when it stops midway nobody can tell which step failed, and analysts start doing the steps by hand again. The consideration is complexity. The closest wrong answer, "single point of failure", would be one platform going down and stopping everything, not a chain that is too tangled to troubleshoot.

**Scenario:** A SOAR license and consultant fees in year one exceed the value of the analyst hours saved. The consideration is cost.

### Automation considerations: single point of failure, technical debt and ongoing supportability
Three listed drawbacks concern what happens over time. A **single point of failure** exists when many processes depend on one automation platform, script or person, so its failure stops them all. **Technical debt** is the future cost of shortcuts and poorly designed or unmaintained automation: like a loan, it charges interest as extra effort on every later change until someone pays it down by reworking it. **Ongoing supportability** is the need to keep automation maintained as systems, APIs and staff change.

How each appears and is handled:
1. **Single point of failure:** the orchestration server goes down and no accounts, tickets or firewall changes are processed. Handle it with redundancy for the platform, monitoring of the automation itself and documented manual fallback procedures that staff still practice. A single engineer who alone understands the scripts is the same risk in human form.
2. **Technical debt:** hard-coded paths and credentials, copied scripts and "temporary" fixes break after a migration. Handle it by reviewing and reworking scripts, removing hard-coded secrets and retiring automation nobody uses.
3. **Ongoing supportability:** a vendor changes its API and an integration silently stops; the author has left. Handle it with named owners, documentation, version control, tests that run on a schedule, and budgeted maintenance time.

**Why it matters:** teams come to rely on automation, and their manual skills fade. When the automation fails or quietly stops (a disabled leaver workflow, a broken alert pipeline), the gap can go unnoticed until an incident exposes it.

**Common confusions:** Technical debt is the accumulated cost of past shortcuts; supportability is the continuing duty to maintain even well-built automation. Single point of failure is about dependency on one component; complexity is about too many tangled components. Hard-coded credentials in scripts are both technical debt and a direct security risk.

**Scenario:** After a server migration, a dozen old scripts with hard-coded paths and an embedded service password stop working and must be rewritten. The consideration is technical debt. The closest wrong answer, "cost", is a consequence, but the cause the scenario describes is accumulated shortcuts.

**Scenario:** A vendor retires an API version; the integration breaks and no one on the team knows how it was built. The consideration is ongoing supportability.

### Automation benefits vs considerations (which term a scenario describes)
A scenario about automation usually shows one listed benefit or consideration. Match the wording, because several terms sound alike.

| Term | Type | The scenario says |
|---|---|---|
| Efficiency and time saving | Benefit | Each task takes less effort or time |
| Enforcing baselines | Benefit | Drifted settings are detected and put back |
| Standard infrastructure configurations | Benefit | Every system is built the same from a template |
| Scaling in a secure manner | Benefit | Many new systems or users, each still secured |
| Employee retention | Benefit | Less tedious work, less burnout, staff stay |
| Reaction time | Benefit | Response lands seconds after detection |
| Workforce multiplier | Benefit | A small team covers far more than its size |
| Complexity | Consideration | Hard to understand, troubleshoot or change |
| Cost | Consideration | Licenses, build time and training outweigh or delay savings |
| Single point of failure | Consideration | One platform, script or person stops everything when it fails |
| Technical debt | Consideration | Old shortcuts and hard-coded values force rework |
| Ongoing supportability | Consideration | Must be maintained as APIs, systems and staff change |

How to decide between near neighbors:
1. Speed of one task versus speed of response to a threat: efficiency versus reaction time.
2. Built the same versus kept the same: standard configurations versus enforcing baselines.
3. Too tangled versus one thing everything hangs on: complexity versus single point of failure.
4. Past shortcuts versus future upkeep: technical debt versus ongoing supportability.

**Why it matters:** the decision to automate is a risk decision: the benefits are real only if the considerations are planned for with owners, fallbacks, testing and budget.

**Common confusions:** Use cases (what is automated, such as ticket creation) are a different list from benefits (why). A use case names a task; a benefit names an outcome.

**Scenario:** "All onboarding stops for a day because the one workflow server crashed." Answer: single point of failure. The tempting wrong answer, complexity, would fit if the workflow ran but nobody could work out why it misbehaved.

## 4.8 Explain the right incident response activities
Depth asked: explain. An answer puts the phases in order, says what belongs in each phase and why, tells the testing types apart, and explains each forensic term and what it protects.

### Incident response process (the seven phases in order)
The incident response (IR) process is the ordered set of phases an organization follows to handle a security incident. The SY0-701 objectives list seven: preparation, detection, analysis, containment, eradication, recovery and, last, lessons learned. It is an operational process built on administrative controls (the plan) and technical ones (the tools), aimed at limiting damage and restoring normal service.

The phases and the reason for the order:
1. **Preparation:** build the plan, team, tools and training before anything happens. Reason: nothing below works if it is improvised.
2. **Detection:** notice that something may be wrong, from alerts, logs or reports.
3. **Analysis:** confirm it is a real incident and work out scope, impact and priority. Reason: containing the wrong thing, or only part of it, wastes time and tips off the attacker.
4. **Containment:** stop it spreading while keeping evidence. Reason: limit damage first.
5. **Eradication:** remove the cause (malware, attacker accounts, the exploited weakness). Reason: recovering before the cause is gone means reinfection.
6. **Recovery:** restore systems and data to normal, verified and monitored.
7. **Lessons learned:** review and improve; the results feed back into preparation.

Common wrong orders: recovering (restoring from backup) before eradicating; wiping a machine before containing and collecting evidence; skipping lessons learned.

How this maps to NIST: the older NIST SP 800-61 Rev. 2 grouped the same work into four phases: preparation; a combined detection and analysis phase; a combined containment, eradication and recovery phase; and post-incident activity. Rev. 3 (April 2025) replaced Rev. 2 and arranges incident response around the six Cybersecurity Framework 2.0 functions (Govern, Identify, Protect, Detect, Respond, Recover), while saying organizations may use whichever life cycle model suits them. The SY0-701 objectives use the seven-phase list.

**Why it matters:** a practiced order turns panic into procedure, shortens outages, preserves evidence for legal action and insurance, and keeps the same incident from happening twice.

**Common confusions:** The phases loop in practice: while eradicating, responders often find more infected hosts and go back to detection and analysis. Containment stops the spread; eradication removes the threat; recovery restores service. Lessons learned is also called post-incident activity or an after-action review.

**Scenario:** Malware is confirmed on two servers and they have just been moved to an isolated network segment. The next phase is eradication. The closest wrong answer, recovery, comes only after the malware and the entry point are removed.

### Preparation phase of incident response
Preparation is everything done before an incident so the team can respond quickly and correctly: the plan, the people, the tools, the contacts and the practice. It is the first phase and the one lessons learned feed back into.

What preparation contains:
1. **An incident response policy and plan:** what counts as an incident, who has authority to act (for example to disconnect a system), severity levels and reporting rules.
2. **A team with roles:** incident handlers, a lead, and named contacts in legal, HR, public relations and management, plus outside contacts (law enforcement, a retained response firm, regulators).
3. **A communication plan:** contact lists, an on-call rota and out-of-band channels in case email or chat is compromised or down.
4. **Tools and resources:** a jump kit (a portable case kept ready, typically holding a laptop loaded with packet capture and forensic software, backup devices, blank media, and basic network gear and cables), spare investigation workstations, evidence storage, and clean operating system and application images for rebuilding.
5. **Knowledge for analysis:** network diagrams, lists of critical assets, baselines of normal activity, and cryptographic hashes of critical files.
6. **Playbooks** for common incident types (ransomware, phishing, lost device, data leak).
7. **Training and exercises** so people have done it before.
8. **Prevention basics:** patching, hardening, logging and time synchronization, so fewer incidents occur and evidence exists when they do.

**Why it matters:** during an incident there is no time to find out who may approve a shutdown, where the backups are, or how to reach the firewall admin at night. Organizations that prepare contain incidents faster and lose less.

**Common confusions:** Preparation is not prevention alone; it assumes incidents will happen and readies the response. Buying tools is not preparation unless staff are trained on them. A jump kit should not be borrowed from for daily work, because its purpose is to be ready at all times.

**Scenario:** During a breach, responders lose an hour because nobody knows who can authorize taking the payment server offline. The failing phase is preparation: the plan should name that authority in advance. The closest wrong answer, containment, is the phase that was delayed, not the one that failed.

### Detection phase of incident response
Detection is recognizing that an incident may be occurring or may have occurred. Signs arrive from security tools, logs and people, and most of them are not real incidents, so detection hands over to analysis for confirmation.

Where detections come from:
1. **Alerts:** a SIEM (security information and event management system) correlation rule, an intrusion detection or prevention system (IDS/IPS), endpoint detection and response (EDR), antimalware, file integrity monitoring.
2. **Logs:** operating system, application, firewall and network device logs showing something unusual.
3. **People:** a user reporting a strange email or a locked file, an administrator noticing an unknown account, a help desk pattern of similar calls.
4. **Outside parties:** a customer, partner, bank, researcher or law enforcement reporting something they saw.

Two kinds of sign (from NIST SP 800-61 Rev. 2):
- A **precursor** is a sign an incident may happen in the future, such as web server logs showing a vulnerability scanner at work, or a newly announced exploit for software you run. Precursors are rare.
- An **indicator** is a sign an incident may have happened or be happening now, such as an antimalware alert, a server contacting a known malicious address, or many failed logons followed by a success. Indicators are very common.

**Why it matters:** the longer an attacker stays unnoticed, the greater the damage. Good detection depends on logging being switched on, logs being collected centrally, clocks being synchronized and someone or something actually reading the alerts.

**Common confusions:** Detection notices; analysis confirms and scopes. An event is any observable occurrence; an incident is an event that violates policy or threatens security. A false positive is an alert with no real incident behind it; a false negative is a real incident with no alert, which is the more dangerous failure. Threat hunting is a proactive search without an alert, whereas detection in this phase is mostly reactive.

**Scenario:** A user forwards a suspicious invoice email to the security mailbox, and the SIEM later shows the same sender reached forty other mailboxes. The first event is detection by a user report. The closest wrong answer, analysis, is what begins once the team starts confirming who clicked and what ran.

### Analysis phase of incident response
Analysis is investigating what detection flagged to confirm whether a real incident exists and, if so, to establish its scope, type, impact and priority. It turns "something looks wrong" into "this is what is happening, to these systems, and this is how urgent it is".

How analysis proceeds:
1. **Validate:** is the alert a true positive? Check the indicator against other sources. Reason: a single indicator can be wrong, and correlating several sources confirms it.
2. **Scope:** which networks, hosts, accounts and data are affected; who or what is the origin; which methods and vulnerabilities are being used.
3. **Correlate:** line up logs from different sources on one timeline. A firewall log may hold the source address while an application log holds the username; a network sensor may show an attack was launched while only the host's own log shows whether it worked.
4. **Prioritize:** NIST SP 800-61 Rev. 2 uses three factors: functional impact (effect on business functions now and if nothing is done), information impact (whether data was exposed, changed or made unavailable) and recoverability (the time and resources needed to recover).
5. **Document and notify:** record every step taken with times, and tell the people the plan names (management, legal, system owners).

What makes analysis easier, set up in advance: baselines and profiles of normal activity, a log retention policy (attacks are often found weeks or months later), synchronized clocks through the Network Time Protocol (NTP), and a knowledge base of known alerts and their meaning.

**Why it matters:** acting on a wrong or partial picture is costly both ways. Treating a false positive as an incident wastes effort and may take a healthy system offline; missing three of five infected hosts means containment fails and the attacker learns they have been noticed.

**Common confusions:** Analysis confirms and scopes; detection only notices. Analysis in incident response is not the same as forensic analysis for court, though they share techniques; most incidents never need full forensics. Root cause analysis goes deeper into why the incident was possible and often completes later. Indicators of compromise (IoCs) such as file hashes, addresses and domains guide the search for other affected systems.

**Scenario:** An EDR alert names one laptop. The analyst searches the SIEM for the same file hash and outbound address and finds two more laptops, then rates the incident high because one belongs to the finance director. That work is the analysis phase. The closest wrong answer, containment, starts when the three laptops are isolated.

Worked mini-example, correlation across three logs with synchronized clocks: 09:14:02 mail gateway delivered invoice.zip to user kim; 09:16:40 endpoint log shows winword.exe starting powershell.exe on KIM-LT; 09:16:44 firewall log shows KIM-LT allowed outbound to 203.0.113.50 on TCP 443.

### Containment phase of incident response
Containment limits the spread and damage of a confirmed incident while keeping evidence intact. It buys time to plan proper removal. Containment actions are corrective technical controls applied under pressure, so the strategy for each major incident type should be decided in advance.

Common containment actions:
1. **Isolate hosts:** EDR network isolation, moving them to a quarantine VLAN, or disabling the switch port.
2. **Disable or reset accounts** and revoke active sessions and tokens.
3. **Block** malicious addresses, domains, hashes and email senders at the firewall, proxy, DNS and mail gateway.
4. **Segment:** close routes between affected and unaffected network zones.
5. **Take a service offline** if the damage of leaving it up is worse than the outage.

How to choose a strategy (criteria from NIST SP 800-61 Rev. 2): the potential damage and theft, the need to preserve evidence, the need to keep the service available, the time and resources the strategy takes, how effective it is (partial or full containment) and how long the solution will last (an emergency workaround for hours, a temporary one for weeks, or a permanent fix).

Cautions:
- Capture volatile evidence (memory, running processes, network connections) before powering a system off; pulling the plug destroys it.
- Some malware reacts to being cut off: a process that can no longer reach its controller may encrypt or wipe the disk. Isolation does not guarantee the host is safe.
- **Sandboxing as containment:** redirecting an attacker into an isolated environment to watch them is a recognized technique, but only after talking to legal counsel. Otherwise, knowingly letting a compromise continue (delayed containment) is dangerous: the attacker may escalate, and the organization may be liable if its system is used to attack others.

**Why it matters:** ransomware and worms spread in minutes. Fast, pre-approved containment decides whether the incident costs one laptop or the whole network.

**Common confusions:** Containment stops the spread but leaves the threat in place; eradication removes it. Containment is not always full disconnection: sometimes availability needs force a partial measure. Disconnecting a host from the network is different from shutting it down, and usually better for evidence.

**Scenario:** A file server is confirmed to be spreading ransomware to mapped drives. The right immediate action is to isolate it from the network (containment), keeping it powered for memory capture. The closest wrong answer, "restore the server from backup", is recovery and would be undone while the malware is still active elsewhere.

### Eradication phase of incident response
Eradication removes the cause and every trace of the incident from the environment: malware, attacker tools, backdoors, rogue accounts, and the vulnerability that let the attacker in. It follows containment and comes before recovery.

How it works:
1. **Identify everything affected.** Use the indicators from analysis to sweep all hosts, not only the ones first found. Reason: one missed foothold lets the attacker back in.
2. **Remove the attacker's presence:** delete malware and persistence (scheduled tasks, services, startup entries, web shells), or more reliably, wipe and rebuild from a known-good image.
3. **Disable breached accounts and reset credentials** the attacker could have seen, including service accounts and keys.
4. **Fix the entry point:** patch the exploited flaw, close the exposed service, correct the misconfiguration.
5. **Confirm:** rescan and re-check for the indicators before moving on.

NIST notes that for some incidents eradication is not needed or is carried out during recovery, for example when systems are simply rebuilt from clean media.

**Why it matters:** recovering without eradicating restores a compromised state. If systems are restored from backup while the stolen admin password still works, or the web shell is still in place, the attacker simply walks back in.

**Common confusions:** Eradication removes the threat; containment only fences it in; recovery returns systems to service. Running an antimalware "clean" on a deeply compromised system is weaker than rebuilding it, because changes nobody has found yet may survive. Fixing the vulnerability belongs here (and is verified in recovery), not only in lessons learned.

**Scenario:** After isolating three infected laptops, technicians reimage them, delete a rogue local admin account found on a server, patch the VPN flaw the attacker used and reset the passwords of every account that logged on to those machines. That is eradication. The closest wrong answer, containment, was the isolation step that came before.

Worked mini-example, an eradication checklist entry: host WEB-03; web shell /uploads/img.aspx removed and server rebuilt from image 2026-02; exploited upload flaw patched; service account svc-web password and API key rotated; indicator sweep of all web servers = clean.

### Recovery phase of incident response
Recovery returns affected systems and data to normal operation after the threat has been removed, confirms they work and are clean, and watches for the attacker's return. It protects availability and integrity and ends when the business is running normally with confidence.

How it works:
1. **Decide the order:** restore essential services first, following business priorities and the recovery time objectives from continuity planning.
2. **Restore or rebuild:** rebuild systems from scratch or from clean images, restore data from known-good backups, and replace compromised files with clean versions. Reason: a backup taken after the attacker arrived may contain the attacker's changes, so pick a restore point from before the compromise and scan it.
3. **Harden before reconnecting:** install patches, change passwords, and tighten firewall rules and access lists so the same path is closed.
4. **Verify:** system owners confirm that functions work and data is correct; check restored assets for indicators of compromise before production use.
5. **Monitor more closely:** raise logging and network monitoring on recovered systems for a period, because attackers often try to come back.
6. **Declare the end** against agreed criteria, and communicate it.

For large incidents recovery can take months and is often phased: quick steps to raise security and stop a repeat first, then longer-term changes.

**Why it matters:** recovery is where the outage ends and revenue resumes, so there is pressure to rush. Reconnecting an unverified system risks reinfection and a second, more damaging outage, plus the loss of trust that follows.

**Common confusions:** Recovery restores service; eradication removes the cause; they are separate even when one rebuild does both. Recovery here is incident recovery, related to but narrower than disaster recovery planning. Restoring from backup is not enough alone: the hole must be closed and the system verified. The recovery time objective (RTO) and recovery point objective (RPO) come from business continuity planning; see `### Recovery time objective (RTO) vs recovery point objective (RPO)`.

**Scenario:** Clean servers have been rebuilt from the golden image and last night's verified backup restored; the team now runs them with extra logging for two weeks and asks the application owner to confirm normal operation. That is recovery. The closest wrong answer, lessons learned, begins after normal operation is confirmed.

Worked mini-example, recovery sign-off: FS-02 rebuilt from image 2026-03; data restored from backup of 12 March 23:00 (before first indicator on 13 March 02:10); patch for exploited flaw installed; owner test passed; enhanced monitoring until 30 March.

### Lessons learned phase (post-incident review)
Lessons learned is the final phase: a structured review, soon after the incident, of what happened, how well the response worked and what must change. Its output feeds back into preparation, which is what makes incident response a cycle. It is also called post-incident activity or an after-action review.

How it works:
1. **Hold the meeting soon,** while details are fresh. The older NIST SP 800-61 Rev. 2 advised holding it within several days after the incident ends, with everyone involved, after every major incident and periodically for smaller ones.
2. **Walk the timeline** without blame. Questions that NIST suggests include: what precisely took place, and when; how staff and management handled it, and whether the written procedures were followed and good enough; what information was needed sooner; whether any action slowed recovery; what would be done differently next time; what corrective actions would prevent similar incidents; which precursors or indicators to watch for in future; and what extra tools or resources are needed.
3. **Write the report:** an after-action report documenting the incident, the response and recovery actions and the lessons.
4. **Assign actions** with owners and dates: update the plan and playbooks, add detections, fix the control gap, train staff.
5. **Keep the evidence and records** for the period set by policy; if prosecution is possible, until legal action ends, which can take years.
6. **Use the data:** counts, time to detect and contain, and cost per incident justify budget and show trends.

**Why it matters:** NIST calls learning and improving among the most valuable parts of the whole process, and also the part most often left out. A team that skips it once the pressure is off tends to meet the same incident again; a short, honest review is a cheap way to improve.

**Common confusions:** Lessons learned is not about finding someone to blame; blame hides facts. It is not the same as root cause analysis, though the review uses the root cause as input. It is the last phase, but its results change the first phase (preparation).

**Scenario:** A week after a phishing-led breach is closed, responders, IT, legal and management meet, agree that the VPN lacked MFA and that the contact list was out of date, and assign fixes. That is lessons learned. The closest wrong answer, recovery, ended when systems were confirmed back to normal.

### Containment vs eradication vs recovery
These three middle phases are the most often confused, because real responders overlap them. The decisive question for each action is what it achieves: stops spread, removes the cause, or restores service.

| Phase | Key question | Typical actions | It is NOT |
|---|---|---|---|
| Containment | How do we stop it spreading right now? | Isolate hosts, quarantine VLAN, disable accounts, block addresses and domains, sandbox | Removing the malware or fixing the hole |
| Eradication | How do we remove it and close the way in? | Delete malware and persistence, wipe and reimage, remove rogue accounts, patch the exploited flaw, reset credentials | Putting systems back in service |
| Recovery | How do we return to normal safely? | Restore from clean backups, rebuild from images, verify, reconnect, monitor closely | Complete until verified and monitored |

How to place an action from a scenario:
1. If the action cuts the attacker or malware off from other systems but the malware still exists: containment.
2. If the action deletes, wipes, patches or resets something the attacker depended on: eradication.
3. If the action brings a clean system or data back for users: recovery.
4. "What comes next?" follows the fixed order: containment, then eradication, then recovery, then lessons learned.

**Why it matters:** doing them out of order has predictable costs. Eradicating before containing lets the threat spread while you clean one machine. Recovering before eradicating restores into a hostile environment. Skipping evidence capture during containment loses the chance to learn how the attacker got in.

**Common confusions:** Reimaging a machine can serve eradication (removes the malware) and recovery (returns a working system) at once; by convention, wiping counts as eradication and restoring from backup as recovery. Patching the exploited vulnerability is eradication; adding general hardening afterward is part of recovery and lessons learned. Disabling a compromised account is containment; deleting an account the attacker created is eradication.

**Scenario:** "The team blocked the command-and-control domain at the DNS filter." Containment. "The team removed the scheduled task that relaunched the malware." Eradication. "The team restored the database from Tuesday's backup and reopened the application." Recovery.

### Incident response training
Incident response training teaches people their roles, procedures and tools before a real incident, matched to what each role needs. It is an administrative control and part of the preparation phase.

Who is trained and in what (following NIST's incident response training control):
1. **General users:** how to recognize something suspicious and exactly who to tell. They may need little more than "who to call and what an incident looks like".
2. **System administrators:** how to handle an incident on their systems without destroying evidence, for example not rebooting or "cleaning up" before responders arrive.
3. **Incident responders:** deeper skills such as forensics, data collection techniques, reporting, and system recovery and restoration.
4. **Management, legal, HR and communications:** their decisions and duties during an incident, such as approving a shutdown, notifying regulators or speaking to the press.

When training happens: soon after someone takes on a role or gains system access, when systems change, and on a regular schedule afterward. The content is reviewed and updated on a schedule and after events such as real incidents, exercise findings and changes in threats.

**Why it matters:** during an incident, untrained staff make things worse in predictable ways: they wipe the infected machine, forward the phishing email to colleagues, or stay silent for fear of blame. Trained staff report early and preserve evidence, which shortens every later phase.

**Common confusions:** Training teaches people what to do; testing (exercises) checks that the plan and the people actually work. Incident response training is narrower than general security awareness training, although user reporting is taught in both. Training is part of preparation, not a phase of its own.

**Scenario:** A help desk technician reimaged a laptop that showed a ransom note before anyone captured evidence. The gap is incident response training for IT staff on evidence handling. The closest wrong answer, "a tabletop exercise", would have revealed the gap, but the fix is training.

### Incident response testing: tabletop exercise and simulation
Testing exercises the incident response plan to find gaps before a real incident does. The objective lists two forms. A **tabletop exercise** is discussion-based: people with roles in the plan talk through a scenario. A **simulation** is hands-on: responders carry out real response steps against a staged incident.

How a tabletop exercise runs:
1. A facilitator presents a scenario (for example ransomware on the file servers on a Friday evening) and asks participants questions.
2. Participants discuss their roles, responsibilities, coordination and decisions. Nothing is deployed and no systems are touched.
3. New facts ("injects") are added as the discussion moves on: the backups are also encrypted; a journalist calls.
4. A debrief (sometimes called a hotwash) follows, and findings go into an after-action report.
NIST SP 800-84 describes tabletops as informal, classroom-style, typically two to eight hours long, and a cost-effective way to check that a plan's content is workable.

How a simulation runs:
1. Planners stage a realistic incident, usually in a test environment or with harmless test tools, such as a benign program that imitates ransomware behavior.
2. Responders must detect it with their real tools, contain it, collect evidence and brief management as if it were real.
3. Observers record timings and problems; a debrief and report follow.
NIST's closest term is a functional exercise, in which staff perform their duties in a simulated operational environment. NIST's testing control names checklists, walk-throughs or tabletops, and simulations as ways to test incident response.

| | Tabletop exercise | Simulation |
|---|---|---|
| Style | Talk it through | Do it for real against a staged incident |
| Systems touched | None | Tools and (test) systems used |
| Tests best | Roles, decisions, communication, the plan's content | Tools, technical procedures, speed |
| Cost and risk | Low | Higher; must be planned so production is not disrupted |

**Why it matters:** plans fail on details nobody noticed: an outdated phone number, a tool nobody is licensed for, two people who each think the other decides. Exercises reveal these cheaply.

**Common confusions:** Tabletop means talk; simulation means do. A penetration test examines defenses against attack; an incident response exercise examines the response. Testing checks the plan; training teaches the people.

**Scenario:** Executives, legal and IT sit in a meeting room while a facilitator describes a data breach and asks each what they would do next. That is a tabletop exercise. The closest wrong answer, simulation, would have responders working at consoles on a staged attack.

### Root cause analysis (RCA) in incident response
Root cause analysis is a structured way to find the underlying reason an incident could happen, not just the visible symptom, so the real problem is fixed and the incident does not recur. NIST describes it as a principle-based, systems approach to identifying the underlying causes of a set of risks. It usually starts during analysis and eradication and is completed for the lessons learned review.

Two common methods:
1. **Five whys:** state the problem, ask why it happened, then ask why again of each answer until the team agrees the root is reached; this often takes three to five rounds and sometimes more. A test for each answer: if this were corrected, could the problem still recur? If yes, it is a contributing factor, not the root.
2. **Cause-and-effect (fishbone) diagram:** write the problem at the "head" and brainstorm causes along branches by category, such as equipment, environment, policy or procedure, and people. It is more structured than the five whys and pushes the team to consider categories it might skip; the two are often used together.

Worked mini-example, five whys on a ransomware incident:
- Why were files encrypted? Malware ran on a finance laptop.
- Why did it run? The user opened a macro-enabled attachment.
- Why did the attachment arrive? The mail gateway does not block that file type.
- Why not? The filtering policy was copied from an old system and never reviewed.
- Root cause: no owner or review cycle for mail filtering policy. Fixing only the first answer (cleaning the laptop) would leave every other user exposed.

**Why it matters:** fixing symptoms guarantees repeats. Reimaging one laptop treats the symptom; fixing the policy gap protects everyone. NIST's current incident response guidance tells responders to look for the underlying or systemic causes and to fix them before restored systems return to production.

**Common confusions:** The root cause is rarely "the user clicked": ask why the click was able to cause harm. A root cause differs from a contributing factor, which made the incident more likely or worse but would not have prevented it alone. RCA is not blame; its output is a control or process change. RCA is input to lessons learned, not the same meeting.

**Scenario:** After three malware outbreaks in a year, each cleaned up quickly, a manager asks why they keep happening. The activity needed is root cause analysis, which finds that local administrator rights on all laptops let malware install. The closest wrong answer, threat hunting, searches for undetected attackers and would not explain the repeated cause.

### Threat hunting (proactive search for undetected threats)
Threat hunting is the proactive search of systems, networks and logs for threats that existing defenses have not detected. NIST describes it as active defense, set against traditional protections such as firewalls, intrusion detection and SIEM alerting: hunters look for indicators of compromise and aim to detect, track and disrupt threats that have evaded existing controls, as early in the attack as possible.

How a hunt runs:
1. **Start from a hypothesis or lead,** not an alert: a new threat intelligence report, a technique seen in your industry, or an oddity in the data. Example: "if an attacker were using stolen credentials here, we would see administrator logons from workstations that never did that before."
2. **Choose the data:** endpoint telemetry, authentication logs, DNS and proxy logs, network flow records.
3. **Search and analyze:** query for the behavior; look for outliers such as unusual network traffic, unusual file changes or the presence of malicious code.
4. **Conclude:** if something real is found, hand it to incident response (the hunt becomes a detection). If nothing is found, record what was checked.
5. **Improve defenses:** turn the successful query into an automated detection rule, close logging gaps the hunt exposed, and share new intelligence with peers or an information sharing and analysis center.

**Why it matters:** protective tools only catch what they were built or tuned to see, so some threats get past them. Hunting assumes a breach may already exist and shortens the time before it is found. Each hunt also strengthens automated detection.

**Common confusions:** Threat hunting is proactive and human-led; responding to alerts is reactive. It is not a vulnerability scan (which lists weaknesses) and not a penetration test (which simulates an attacker to test defenses): hunting looks for real adversaries already present. Threat intelligence is the information; threat hunting is the activity that uses it. Hunting needs good logs: you cannot hunt in data you never collected.

**Scenario:** No alert has fired, but after reading a report on attackers abusing a remote management tool, an analyst searches six months of endpoint logs for that tool running from unusual folders and finds a dormant backdoor on two servers. That is threat hunting. The closest wrong answer, "incident detection", normally begins with an alert or report; here the analyst went looking unprompted.

Worked mini-example, a hunt record: hypothesis = stolen admin credentials used laterally; data = Windows Security logons (type 3 and 10) for admin accounts, 90 days; finding = account adm-lee logged on to 14 workstations from HR-PC-22 at 02:00 to 03:00; outcome = escalated to incident response, new SIEM rule created.

### Digital forensics process (collection, examination, analysis, reporting)
Digital forensics is collecting, preserving, examining and reporting on digital evidence in a way that keeps it reliable and defensible, whether the audience is a court, a regulator, an insurer or internal management. In incident response it answers what happened, how, when and by whom. The objective lists six activities: legal hold, chain of custody, acquisition, preservation, reporting and e-discovery.

The basic process (NIST SP 800-86):
1. **Collection:** identify, label, record and acquire data from possible sources while preserving its integrity.
2. **Examination:** use forensic tools and manual methods to find and extract the relevant data, still protecting integrity.
3. **Analysis:** study the results to answer the questions that prompted the investigation.
4. **Reporting:** present the findings, the actions taken, what else needs doing, and recommended improvements.

Ground rules that hold throughout:
- Decide early whether legal action is possible, and involve legal counsel and HR; evidence handling must follow applicable law.
- Collect in order of volatility: the most short-lived data first.
- Never work on the original: make a master copy and a working copy and examine the working copy.
- Prove integrity with hashes computed before and after copying.
- Record everything: who did what, when, with which tool.

**Why it matters:** evidence gathered carelessly may be thrown out, and conclusions drawn from altered data may be wrong. Even with no court case, an investigation that cannot be trusted cannot support firing an employee, an insurance claim or a breach notification.

**Common confusions:** Forensics is not needed for every incident: NIST notes that the typical malware incident does not justify collecting evidence formally. Incident response aims to restore operations quickly; forensics aims to establish facts carefully, and the two can pull against each other (reimaging quickly destroys evidence). Legally, "evidence" is only what a judge admits; in practice the word is used for everything collected.

**Scenario:** An employee is suspected of copying client lists before resigning. The company needs findings that will stand up in a dispute, so investigators image the laptop, hash the image, document every handler and analyze a copy. That is digital forensics. The closest wrong answer, "incident eradication", would wipe the laptop and with it the evidence.

In this objective each listed activity has its own section: see `### Legal hold (litigation hold)`, `### Chain of custody (evidence handling record)`, `### Forensic acquisition and order of volatility`, `### Evidence preservation in digital forensics`, `### Forensic reporting` and `### E-discovery (electronic discovery)`.

### Legal hold (litigation hold)
A legal hold (also called a litigation hold) is a formal instruction, normally issued by legal counsel, to preserve all information that may be relevant to a lawsuit, an expected lawsuit, a government investigation or an audit. It suspends normal deletion: retention schedules, mailbox auto-purge and device wiping stop for the data in scope, and so does the recycling of backup media when the backups hold relevant data that exists nowhere else. It is an administrative control carried out with technical settings.

How it works:
1. **Trigger:** litigation is filed or reasonably expected, or an investigation or audit begins.
2. **Notice:** counsel sends a written hold to the custodians (the people who hold relevant data) and to IT, describing the subject, date range and data types and how to preserve them. Recipients acknowledge it and get periodic reminders.
3. **Suspend deletion:** IT places holds on mailboxes, file shares, chat and cloud storage; pauses auto-delete policies; keeps relevant backups; and keeps the devices of departing employees.
4. **Release:** the hold stays until counsel lifts it. Lifting it does not delete anything at once; after a check that no other hold covers the same data, the normal retention schedule applies again.

**Why it matters:** destroying relevant data after the duty to preserve begins is called spoliation. Under United States federal civil procedure (Rule 37(e)), when electronically stored information that should have been preserved is lost because reasonable steps were not taken, and it cannot be restored or replaced from another source, a court that finds the other side was harmed may order measures no greater than needed to cure that harm; and if the party acted with intent to deprive the other side, the court may presume the lost information was unfavorable or even dismiss the case or enter a default judgment.

**Common confusions:** A legal hold stops deletion; it does not collect or hand over anything (that is e-discovery). It overrides the retention policy for the data in scope, even where the policy says to delete. It is not chain of custody, which tracks the handling of evidence already collected. A hold applies to future data too, if it falls in scope while the hold is active.

**Scenario:** Counsel expects a wrongful dismissal claim and tells IT to stop the 90-day auto-deletion on a former manager's mailbox and keep her laptop untouched. That is a legal hold. The closest wrong answer, "data retention policy", is the normal schedule the hold suspends.

### Chain of custody (evidence handling record)
Chain of custody is the documented, unbroken record of everyone who collected, held, moved or examined a piece of evidence, with the date, time and reason for each transfer. NIST defines it as a process for following evidence from the moment it is collected, through safekeeping, to analysis. It protects the integrity and admissibility of evidence: it lets a court trust that the item presented is the item collected, unaltered.

How it works:
1. **At collection,** label the item and record identifying details: location, serial number, model, hostname, MAC and IP addresses.
2. **Record the collector:** name, title and contact details of each person who collects or handles it.
3. **Seal and store:** tamper-evident bag, locked evidence room or safe, with the storage location written down.
4. **Log every transfer:** when custody changes, the form records both parties, the date and time (with time zone), the reason and how it was transferred (including shipping numbers), and each party signs.
5. **Pair with hashes:** the hash of a disk image recorded at acquisition and checked later shows the content did not change, while the custody form shows who could have touched it.

**Why it matters:** a gap in the record ("where was the drive from Friday to Monday?") lets the other side argue the evidence could have been altered or swapped, which can make it inadmissible or worthless. Internally, it also protects investigators from accusations of tampering.

**Common confusions:** Chain of custody documents handling; preservation keeps the evidence unchanged; a legal hold stops data being deleted in the first place. A hash proves the data did not change; the custody record proves who had it. Chain of custody applies to digital copies and images, not only physical items.

**Scenario:** A seized laptop sat in an unlocked office over a weekend with no entry on its evidence form, and opposing counsel now challenges the findings. The failure is chain of custody. The closest wrong answer, "order of volatility", concerns the sequence of collecting data, not who handled it afterward.

Worked mini-example, a custody form: Item 07, laptop, serial 5CG1234XYZ, collected 2026-04-02 10:15 UTC+1 from desk 4.12 by R. Osei (IR analyst); 10:40 sealed in bag B-2231; 11:05 handed to M. Chen (forensic lab), both signed; stored in locker 3; 2026-04-03 09:00 removed by M. Chen for imaging; image SHA-256 recorded on the form.

### Forensic acquisition and order of volatility
Acquisition is collecting digital evidence (memory, disk images, logs, network data) in a forensically sound way: complete, verified and without changing the source. The order of volatility is the rule for sequencing it: collect the data that disappears fastest first.

Order of volatility, from RFC 3227, most volatile first:
1. CPU registers and cache.
2. Routing table, ARP cache, process table, kernel statistics and memory (RAM).
3. Temporary file systems.
4. Disk.
5. Remote logging and monitoring data relevant to the system.
6. Physical configuration and network topology.
7. Archival media (backups).

How to acquire soundly:
1. **Plan:** rank sources by likely value, volatility and effort.
2. **Capture live data first** on a running system (memory, running processes, network connections), using trusted tools run from read-only media, because programs on a compromised system cannot be trusted.
3. **Do not shut down until collection is complete:** an attacker may have altered shutdown scripts to destroy evidence, and power-off erases memory.
4. **Image storage bit for bit:** a bit stream image copies everything including free and slack space, unlike a logical backup that copies only files and folders. Use a write blocker (hardware or software that stops any write to the source media).
5. **Hash before and after:** compute the digest of the original before imaging, of the copy after, and of the original again; all should match, and the results are documented. Use a current algorithm such as SHA-256. MD5 and SHA-1 are legacy and both have known collision attacks; the older NIST SP 800-86 (2006) names them, but even that guide told agencies to plan a move to the stronger SHA-2 family.
6. **Note the clock:** record the difference between the system clock and UTC.
7. Avoid tools that change file access times.

**Why it matters:** the most valuable evidence of a live intrusion (decrypted malware in memory, encryption keys, active connections) exists only in RAM and vanishes at power-off. Collected out of order, it is gone for good.

**Common confusions:** Acquisition collects; preservation keeps what was collected safe and unchanged. A bit stream image is not the same as a backup or a file copy. Disconnecting a compromised machine from the network may trigger a "dead man's switch" that wipes data, so even containment is planned with evidence in mind.

**Scenario:** A responder reaches a running server suspected of compromise and may collect only one thing before a forced shutdown. Capture memory, the most volatile useful source on the list. The closest wrong answer, "image the hard disk", targets data that will still be there after power-off.

### Evidence preservation in digital forensics
Preservation is protecting evidence so that it stays unchanged, complete and available from the moment it is identified until it is no longer needed. It covers both the technical side (no alteration) and the custodial side (safe storage for as long as required).

How it works:
1. **Preserve the scene:** tell users and administrators not to keep using, "cleaning" or rebooting an affected system; capture a snapshot of the system as it is, before well-meaning staff alter it.
2. **Protect the original:** connect source media only through a write blocker; never run analysis on it.
3. **Make verified copies:** a master copy and a working copy; analysts use the working copy, and the master exists to make new working copies.
4. **Hash** originals and copies and record the values, so anyone can later show nothing changed.
5. **Store securely:** sealed, labeled, in access-controlled storage, logged through chain of custody.
6. **Preserve short-lived sources quickly:** logs that roll over, cloud audit trails with limited retention, security camera footage, voicemail.
7. **Retain for the right period:** NIST notes most organizations keep incident evidence for months or years; if prosecution is possible, until all legal action ends.

**Why it matters:** analysis tools, antimalware scans and even booting a system change timestamps and data. Once evidence is altered, nobody can prove what the original said, and conclusions drawn from it can be attacked.

**Common confusions:** Preservation keeps collected evidence intact; a legal hold is the legal instruction not to delete potentially relevant data in everyday systems; chain of custody records who handled the evidence. Preservation is not backup: a routine backup may not capture deleted files, slack space or memory.

**Scenario:** An investigator images a suspect's drive through a write blocker, records the SHA-256 value, seals the original in a bag in a locked cabinet and analyzes only the copy. Those steps are preservation. The closest wrong answer, "e-discovery", is the legal process of producing relevant data to the other side.

### Forensic reporting
Forensic reporting is preparing and presenting the results of an investigation: what was collected, how it was examined, what was found, and what it means. It is the final phase of the forensic process and the part most people outside the team will actually read.

What a sound report contains:
1. **Scope and question:** what the investigation was asked to establish.
2. **Evidence list:** each item, where it came from, its hash values and its chain of custody.
3. **Methods and tools:** what was done, with which tool and version, in enough detail that another examiner could repeat the work and get the same result.
4. **Timeline:** events in order, with the time zone stated and clock differences noted.
5. **Findings:** facts supported by evidence, kept separate from opinion.
6. **Alternative explanations:** where the data is incomplete and more than one explanation is plausible, each is considered and tested (a point NIST SP 800-86 stresses).
7. **Conclusions and recommendations:** including actionable information, such as a backdoor still present or a vulnerability to fix, and problems in policy, procedure or tools that should be corrected.

Write for the audience: law enforcement may need highly detailed reports and copies of the evidence; a system administrator wants the technical detail; senior management wants a short overview of what happened and what to do to prevent a repeat.

**Why it matters:** an investigation is only as useful as its report. Unsupported conclusions, missing methods or undefined times let the other side discredit the work, and investigators may have to testify about it years later, so the notes must stand without the author's memory.

**Common confusions:** Forensic reporting is written by investigators about one case; the "automated reports" in objective 4.9 are generated by tools on a schedule and are a data source. A forensic report is not the lessons learned report, which reviews how the response went. Reporting to regulators or customers about a breach is notification, a separate duty.

**Scenario:** An investigator documents the intrusion timeline, the tools and versions used, the hash values proving the image was unaltered and two possible explanations for a missing log, then writes a one-page summary for executives. That is forensic reporting. The closest wrong answer, "chain of custody", is one of the records the report cites, not the report itself.

### E-discovery (electronic discovery)
E-discovery is the legal process of identifying, preserving, collecting, reviewing and producing electronically stored information (ESI), such as email, documents, chat messages and database records, for a lawsuit, investigation or regulatory request. It is driven by lawyers and courts; IT and security supply the data.

The stages (the widely used Electronic Discovery Reference Model), built on good information governance:
1. **Identification:** define the scope of the matter and locate the relevant data sources and custodians.
2. **Preservation:** protect relevant ESI against alteration or destruction. This is where the legal hold operates.
3. **Collection:** gather the potentially relevant data in a defensible way, keeping its metadata.
4. **Processing:** convert and normalize the data so it can be reviewed and analyzed.
5. **Review:** check for relevance, responsiveness, privilege and confidentiality.
6. **Analysis:** assess the data using human judgment, technology or both.
7. **Production:** deliver the ESI to the other party in the agreed format.
8. **Presentation:** show it at depositions, hearings or trial.
The model is a map, not a strict sequence: stages overlap and repeat, and current versions also show disposition (lawful deletion once the matter and its holds end).

**Why it matters:** e-discovery is expensive and deadline-driven. Organizations that know where their data lives, keep it under sensible retention rules and can place holds quickly spend far less and face less risk of penalties for lost data.

**Common confusions:** E-discovery finds and hands over data for a legal matter; digital forensics examines evidence to establish what happened technically. A legal hold preserves; e-discovery goes on to collect and produce. E-discovery is not limited to security incidents: contract and employment disputes are typical triggers. Metadata (who created a file, when it was changed) is part of what must be preserved and may be produced.

**Scenario:** In a contract dispute, the court orders a company to provide all email between two managers about the deal from January to June; IT searches the archive and exports the messages with their headers for counsel to review. That is e-discovery. The closest wrong answer, "legal hold", was the earlier step that kept those emails from being deleted.

### Legal hold vs chain of custody vs preservation vs e-discovery
Four forensic terms sound alike because all deal with keeping and handling evidence. The decisive feature is what each one does to the data.

| Term | What it does | Who drives it | Clue words |
|---|---|---|---|
| Legal hold | Stops relevant data from being deleted or changed in normal systems | Legal counsel, carried out by IT | "suspend auto-deletion", "anticipated lawsuit", "do not delete" |
| Preservation | Keeps collected evidence intact and unaltered | Investigators | "write blocker", "hash", "work on a copy", "sealed and locked away" |
| Chain of custody | Records every person who handled the evidence, when and why | Everyone who touches it | "signed form", "who had the drive", "gap in the record" |
| Acquisition | Collects the evidence soundly, most volatile first | Responders and examiners | "capture memory first", "bit-for-bit image" |
| E-discovery | Finds, collects and produces electronic information to the other party | Lawyers and the court | "produce all email", "request for documents", "review for privilege" |
| Reporting | Writes up methods, timeline and findings | Investigators | "repeatable", "timeline", "findings for court or management" |

How they follow one another in a typical case:
1. A dispute or incident arises; counsel issues a legal hold so nothing relevant is deleted.
2. Evidence is acquired in order of volatility.
3. It is preserved (hashed, copied, originals locked away) and every handover goes on the chain of custody form.
4. Examination and analysis run on working copies.
5. If there is litigation, e-discovery identifies and produces the relevant information.
6. A forensic report documents what was done and found.

**Why it matters:** each term answers a different challenge to the evidence. "Was it deleted?" is answered by the legal hold. "Was it changed?" is answered by preservation and hashes. "Who could have touched it?" is answered by the chain of custody. "Did you hand over what the court required?" is answered by e-discovery.

**Common confusions:** A legal hold does not itself collect anything. Chain of custody does not prevent tampering, it makes handling accountable. Preservation is technical; a legal hold is a legal instruction. E-discovery can happen with no security incident at all.

**Scenario:** "IT is told not to recycle a departing executive's phone because a regulator has opened an inquiry." Legal hold. "The phone's image is hashed and the phone sealed in the evidence safe." Preservation. "The form shows the phone passing from IT to the lab, with signatures." Chain of custody.

## 4.9 Use data sources to support an investigation
Depth asked: apply in a scenario. An answer picks the source that actually holds the evidence for the question being asked, and can say what the nearest alternative source would fail to show.

### Log data in investigations (correlation, timestamps and time synchronization)
A log is a record of events written by a device, operating system or application, each entry carrying a timestamp and details. Investigators use logs to reconstruct what happened, in what order and by whom. Logs are a detective control; they support accountability and non-repudiation and are the raw material for every other source in this objective.

How logs are used in an investigation:
1. **Collect centrally:** forward logs to a log server or a SIEM (security information and event management system) so an attacker who controls one host cannot quietly erase its history, and so sources can be searched together.
2. **Normalize time:** every source should synchronize its clock to a common time source, typically with the Network Time Protocol (NTP), and timestamps should be in UTC or state their offset. Reason: correlating events is far harder when three devices report the same moment as three different times.
3. **Correlate:** join entries from different sources by time, address, username or host. One source rarely tells the whole story: a firewall log has the source address, an application log has the username, and only the host's own log shows whether the attack worked.
4. **Build the timeline:** first contact, initial access, privilege gain, movement, data access, exit.
5. **Preserve:** export and hash the relevant logs, since they may be evidence.

What to check about a log source itself: is logging enabled for the events you need; how long are logs retained (incidents are often discovered weeks or months later); can the logs be trusted (were they altered, are there gaps).

**Why it matters:** without logs there is no investigation, only guesses. Gaps (logging switched off, short retention, unsynchronized clocks) are the most common reason a breach cannot be scoped.

**Common confusions:** A log records that an event happened; a packet capture records the traffic content itself. A SIEM is not a log type: it collects, correlates and alerts on logs from many sources. Missing logs or a sudden gap are themselves an indicator: attackers clear logs to hide.

**Scenario:** An analyst cannot line up the VPN log with the server log because the server's clock is eleven minutes fast. The missing control is time synchronization (NTP). The closest wrong answer, "longer log retention", keeps more logs but leaves them just as hard to correlate.

Worked mini-example, three sources joined by time and address: 02:11:07Z VPN log: user jlee connected from 198.51.100.23, assigned 10.8.0.14; 02:12:40Z Windows Security log on FS-01: logon type 3 for jlee from 10.8.0.14; 02:19:55Z firewall: 10.8.0.14 to 203.0.113.9 TCP 443, 2.1 GB sent, allowed.

### Firewall logs
Firewall logs record the traffic a firewall allowed or blocked. A typical entry holds a timestamp, the source and destination addresses and ports, the protocol, the action (allow or deny) and often the rule that matched. Next-generation firewalls may add the application identified, the user, the URL category and threat verdicts.

What firewall logs answer:
1. **Who talked to whom, when, on which port, and was it allowed?** The basic connection record.
2. **Scanning:** one source touching many ports or many hosts in a short time, mostly denied.
3. **Command and control (C2):** an internal host connecting out to the same unknown address at regular intervals (beaconing).
4. **Exfiltration:** unusually large outbound transfers, especially at odd hours or to unfamiliar destinations, when the firewall logs byte counts.
5. **Policy problems:** which rule let unexpected traffic through.

Limits: a firewall sees only traffic that crosses it, so movement between two hosts on the same segment is invisible. It logs connection details, not what was said: file contents and commands are not there. Encrypted sessions show endpoints and sizes only. Firewalls are often set to log blocked traffic only; if allowed traffic is not logged, a successful attack leaves little trace.

**Why it matters:** firewall logs are usually the first place to confirm whether an internal host really contacted a suspicious address, and for how long, which sets the scope of an incident.

**Common confusions:** Firewall logs show connections allowed or denied by rules; IDS/IPS logs show traffic that matched an attack signature or anomaly. A firewall log does not show which process on the host made the connection (endpoint logs do) or which user account was logged in (operating system logs do).

**Scenario:** Threat intelligence names a malicious IP address, and the team must find every internal machine that communicated with it over the last month. Search the firewall logs. The closest wrong answer, "vulnerability scan results", lists weaknesses on hosts, not their network conversations.

Worked mini-example, firewall entries: `2026-05-03T02:10:15Z ALLOW TCP 10.20.4.37:51522 -> 203.0.113.50:4444 rule=out-any bytes=1840`, repeated every 300 seconds. An unusual destination port at a fixed interval from one workstation is a C2 beacon pattern; next step: endpoint logs on 10.20.4.37 to find the process.

### Application logs
Application logs are events recorded by a specific application about what happened inside it: web servers, databases, email servers, business systems and custom software. They hold details that no network or operating system log can see.

What applications commonly log (categories from NIST SP 800-92):
1. **Client requests and server responses:** for a web server, each URL requested and the response status; for an email server, sender, recipients, subject and attachment names; for a business application, which records each user opened.
2. **Account information:** successful and failed sign-ins to the application, account changes and use of privileges inside it.
3. **Usage information:** number and size of transactions in a period; a sudden jump can signal an attack or a data leak.
4. **Significant operational actions:** start-up and shutdown, failures and major configuration changes.

What they answer: which application account did what inside the application; was an injection or path traversal attempt made, and what did the server answer; which records were viewed or exported.

Limits: formats differ by product and are often proprietary; meaning depends on context, so they take more effort to read; many applications log little unless configured to.

**Why it matters:** for an attack on the application layer (SQL injection, credential stuffing against a login page, abuse of a business function), the application log is often the only place the decisive detail exists, especially when traffic is encrypted on the network.

**Common confusions:** Application logs record events inside one program; operating system security logs record events of the OS itself, such as Windows logons. A web server's access log is an application log, even though it lists IP addresses like a network log.

**Scenario:** A customer portal shows hundreds of failed sign-ins, each for a different username, from one address within a minute. The source that shows this is the web application's log. The closest wrong answer, the firewall log, would show many allowed HTTPS connections from that address but not the usernames or the failures.

Worked mini-example, a web access log line: `198.51.100.77 - - [14/May/2026:05:41:18 +0000] "GET /products?id=7%27%20OR%20%271%27=%271 HTTP/1.1" 200 48211`. The decoded parameter is `7' OR '1'='1`, an SQL injection attempt, and status 200 with a large response suggests it may have returned data.

### Endpoint logs (EDR and antimalware telemetry)
Endpoint logs come from security software on user devices and servers: antimalware, endpoint detection and response (EDR) agents, host firewalls and similar tools. They record what happened on the device itself: processes started and by which parent, files created or changed, registry and configuration changes, network connections per process, logged-on users and detections.

What endpoint logs answer:
1. **Which program did it?** The process name, path, hash, command line and parent process.
2. **How did it start?** The chain, for example an office document starting a scripting engine that downloads a file.
3. **What did it touch?** Files written, persistence added (services, scheduled tasks), other processes accessed.
4. **Where did it connect?** The process behind a network connection that the firewall saw only as addresses and ports.
5. **Was it blocked?** The detection name and the action taken (quarantined, killed, allowed).

Limits: there is data only where an agent is installed and running; attackers try to disable agents; a device that is off the network may upload its records later; volume is high.

**Why it matters:** network sources say that a host did something; endpoint logs say which process and which user on that host did it, which is what turns "10.20.4.37 beaconed" into "a macro in invoice.docm launched PowerShell".

**Common confusions:** Endpoint logs come from security agents on the host; operating system security logs are written by the OS itself (logons, account changes). The two overlap and are used together. Endpoint logs are not network logs, even though they record connections, because they see them from the host's side and tie them to a process.

**Scenario:** The firewall shows a laptop contacting a known malicious domain, and the analyst must learn which program made the connection. Use the endpoint (EDR) logs for that laptop. The closest wrong answer, a packet capture, shows the traffic but not which process on the laptop sent it.

Worked mini-example, an EDR process record: `host=KIM-LT user=kim parent=WINWORD.EXE process=powershell.exe cmdline="-enc JAB..." net=203.0.113.50:443 file_write=C:\Users\kim\AppData\Local\Temp\upd.exe verdict=suspicious`. An office program starting an encoded PowerShell command that writes an executable to a temp folder is a classic malicious-document pattern.

### OS-specific security logs (Windows Security log, Linux authentication logs)
Operating system security logs are written by the OS itself about security-relevant events: logons and logoffs, failed logons, account and group changes, privilege use, policy changes and, where enabled, object access and process creation. Their format and location depend on the OS, which is what "OS-specific" means.

Where they live:
- **Windows:** the Security event log, read in Event Viewer; entries have numeric event IDs. Examples documented by Microsoft: 4625 an account failed to log on, 4624 an account logged on successfully, 4720 a user account was created.
- **Linux and Unix:** authentication logs (commonly the file /var/log/auth.log on Debian and Ubuntu systems or /var/log/secure on Red Hat family systems, or the systemd journal), usually in syslog format, recording logins, sudo use and SSH sessions.

Two kinds of OS record (NIST SP 800-92): **system events** (operational actions such as a service starting or the system shutting down) and **audit records** (security events such as successful and failed authentication, file access, policy changes, account changes and use of privileges). Administrators choose which events are audited and whether successes, failures or both are logged, so a missing event may simply mean auditing was not enabled.

What they answer: who logged on to this machine, when, from where and how; who created or changed an account or group; whether a password-guessing attempt succeeded.

Reading a failed-logon event (Windows 4625): the fields include the account name, the failure status, the logon type and the source network address. Logon type 2 is interactive (at the keyboard), type 3 is network (for example a file share), type 10 is remote interactive (Remote Desktop). Status 0xC000006A means a wrong password; 0xC0000064 means the username does not exist, and a run of those suggests username guessing.

**Why it matters:** these logs are the authoritative record of account activity on a host and the core of most intrusion timelines. Attackers often clear them, which is itself an event worth alerting on.

**Common confusions:** OS security logs record the OS's own events; application logs record events inside one application; endpoint logs come from security agents. The Windows Security log is not the System or Application log beside it in Event Viewer.

**Scenario:** An investigator must find out who added an account to the local administrators group on a Windows server last night. The answer is the Windows Security event log (an OS-specific security log). The closest wrong answer, firewall logs, record network connections, not account changes.

Worked mini-example: 40 events 4625 for account "administrator" from 10.20.9.14, logon type 3, status 0xC000006A, between 01:02 and 01:04, then one 4624 for the same account and address at 01:05. Reading: password guessing that succeeded.

### IPS/IDS logs (intrusion prevention and detection system logs)
Logs from an intrusion detection system (IDS) or an intrusion prevention system (IPS) record traffic or host activity that matched a detection: a known attack signature, a deviation from normal behavior (anomaly), or a protocol being used in an unexpected way. An entry usually names the signature or rule, a classification and priority, the time, the source and destination addresses and ports, and, for an IPS, the action taken.

What they answer:
1. **What kind of attack was attempted?** The signature name tells you (SQL injection, exploit for a specific flaw, port scan).
2. **Against which target and from where?**
3. **Was it blocked?** An IDS only alerts; an IPS, placed inline, can drop the traffic, and its log says so.
4. **Is this part of a campaign?** Many alerts from one source or against one target.

How to read them with care:
- A **false positive** is benign activity flagged as malicious; a **false negative** is malicious activity missed. NIST notes that neither can be eliminated and that reducing one usually increases the other; adjusting the system to improve accuracy is called tuning.
- Signature detection is strong against known threats and weak against new or disguised ones, so no alert does not mean no attack.
- An alert shows an attack was launched, not that it succeeded; confirm on the target with host, application or endpoint logs.
- Encrypted traffic limits what a network sensor can inspect.

**Why it matters:** IDS/IPS logs are often the first sign of an attack and the fastest way to name the technique, which tells responders what to look for next and which systems to check.

**Common confusions:** Firewall logs say a connection was allowed or denied by a rule; IDS/IPS logs say the content or behavior looked like an attack. IDS detects and alerts (out of band); IPS detects and can block (inline). An IPS log entry reading "dropped" means that attempt failed, but the attacker may have tried other ways.

**Scenario:** The web team asks whether last night's traffic spike included attempts to exploit a newly published web server flaw. Check the IPS/IDS logs for that signature. The closest wrong answer, the firewall log, shows the HTTPS connections were allowed but not what attack they carried.

Worked mini-example, an IDS alert in a common text format: `[**] [1:2019401:3] SQL injection attempt in URI [**] [Classification: Web Application Attack] [Priority: 1] 05/14-05:41:18 198.51.100.77:50122 -> 10.0.5.10:80`. Next step: the web application log for the same time to see the server's response.

### Network logs (switch, router, DHCP, DNS, VPN and flow records)
Network logs come from the infrastructure that carries traffic and gives devices their place on the network: switches, routers, wireless controllers, DHCP and DNS servers, VPN gateways, proxies and authentication servers. They record connections, address assignments, lookups, sessions and device events, and they are how an investigator turns an IP address into a specific device, port and user.

What each common source answers:
1. **DHCP logs:** which device (by MAC address and hostname) held a given IP address at a given time. Needed because addresses are reassigned.
2. **DNS logs:** which names a host looked up, such as a malicious domain, even when the later connection was encrypted.
3. **Switch and wireless controller logs:** which physical port or access point a MAC address was on, so the device can be found in the building.
4. **Router logs:** routing and interface events, and basic details of traffic the router blocked.
5. **VPN logs:** who connected, from which outside address, when, for how long and which inside address they received.
6. **Authentication server logs:** each sign-in attempt with its origin, username, result and time.
7. **Flow records (for example NetFlow):** a summary of each conversation: source and destination addresses and ports, protocol, packet and byte counts and start and end times. Flow records are built from packet headers and do not carry the payload.

**Why it matters:** an alert usually names an IP address. Without DHCP, switch and VPN logs, nobody can say which laptop or person that was three weeks ago. Flow records give long-term visibility of who talked to whom at a fraction of the storage a full capture needs.

**Common confusions:** Network logs describe infrastructure events and connection summaries; packet captures hold the packets themselves. Firewall and IDS/IPS logs are listed separately in this objective even though those devices sit on the network. Flow data shows that 2 GB went to an address, not what the 2 GB contained.

**Scenario:** An IDS alert from last Tuesday names source 10.20.4.37, but addresses on that network are handed out dynamically. To identify the machine, check the DHCP log for which MAC address and hostname held that address at that time, then the switch log for its port. The closest wrong answer, endpoint logs, is the right next step only after you know which endpoint it was.

Worked mini-example: DHCP log: `2026-05-12 08:02:11 ACK 10.20.4.37 to 3c:52:82:aa:10:9f (KIM-LT), lease 8 h`; switch log: MAC 3c:52:82:aa:10:9f learned on port Gi1/0/14, floor 4; flow record: 10.20.4.37 to 203.0.113.50 TCP 443, 1.9 GB, 08:40 to 09:05.

### Metadata as an investigation source (email headers, file and image properties)
Metadata is data about data: it describes a file, message or connection without being its content. For a file, it is information about the file such as its author, creation and modification times and size. Investigators use metadata to establish origin, timing and authorship, and it is often available when the content itself is encrypted, deleted or disputed.

Common kinds and what they show:
1. **Email headers:** the path a message took (each mail server adds a Received line, so the oldest is at the bottom), the true sending server and address, message IDs, and the results of sender checks (SPF, DKIM and DMARC). The visible "From" name is easily forged; the header trail is much harder to fake.
2. **File metadata:** created, modified and accessed times, owner, author and software used, kept by the file system and inside many document formats.
3. **Image metadata (EXIF):** camera or phone model, date and time, and sometimes GPS coordinates of where the photo was taken.
4. **Web metadata:** in web server and proxy logs, the user agent, referrer and requested address.
5. **Mobile and call metadata:** numbers, times, durations and cell locations, without the conversation.
6. **Network metadata:** flow records, which give endpoints, sizes and times without payload.

**Why it matters:** metadata can prove or disprove a claim on its own: a document "written in March" whose metadata shows creation in June; a photo placing a person at a location; an email claiming to be from the chief executive that the headers show came from an outside server. It also leaks: documents published with author names, internal paths or location tags give attackers reconnaissance material.

**Common confusions:** Metadata is not the content. Metadata can be altered (timestamps can be changed deliberately, and copying a file may update them), so investigators corroborate it with other sources and protect it during collection, for instance by avoiding tools that change access times. Security labels on data are a form of metadata too.

**Scenario:** Finance receives an urgent payment request that appears to come from the chief executive's address. To see where it really came from, examine the email headers (metadata). The closest wrong answer, the firewall log, would show mail traffic arriving but not which outside server originated this particular message.

Worked mini-example, header lines: `From: "CEO Name" ceo@company.example`; `Return-Path: bounce@mailer.badhost.example`; `Received: from mailer.badhost.example (203.0.113.77)`; `Authentication-Results: mx.company.example; spf=pass smtp.mailfrom=mailer.badhost.example; dkim=none; dmarc=fail header.from=company.example` (the first value names the company's own mail server that ran the checks; real headers also put the addresses in angle brackets). The display name and From address are the executive's, but the message came from an outside server: SPF passed only for that outside domain, and DMARC failed because nothing verified the company domain shown in From. That is a spoof.

### Vulnerability scans as an investigation source
A vulnerability scan report lists, for each system scanned, its open ports and services, software versions, missing patches, misconfigurations and known vulnerabilities, usually with a severity score. In an investigation it is used as a record of how exposed a system was, which helps explain how an attacker probably got in and which other systems share the weakness.

How investigators use scan data:
1. **Find the likely entry point:** look up the compromised host in the most recent scan from before the incident. An unpatched, internet-facing service rated critical is a strong candidate.
2. **Compare over time:** differences between scans show new open ports, new services or new software, which may be the attacker's backdoor or tooling.
3. **Scope the exposure:** search all scan results for the same weakness to find other hosts the attacker could have used, and check them for indicators.
4. **Verify the fix:** rescan after eradication to confirm the patch or configuration change took effect.
5. **Check the process:** if the scan flagged the flaw months ago, the root cause includes a failure of remediation.

Limits: a scan shows weaknesses, not what an attacker actually did. It reflects only the moment it ran and only the hosts and checks included; unauthenticated scans miss issues that credentialed scans see; scanners produce false positives. Web server logs showing a vulnerability scanner you did not run are a precursor of attack.

**Why it matters:** knowing the weakness that was used turns cleanup from guesswork into a targeted fix, and tells you where else to look before the attacker returns through an identical hole elsewhere.

**Common confusions:** A vulnerability scan identifies potential weaknesses; a penetration test actively exploits them; a log records events that happened. Scan results are evidence of exposure, not of compromise. This section is the scan as a data source; running and prioritizing scans is covered in `### Vulnerability scan (identification method)` and `### Vulnerability management life cycle (identify, analyze, respond, validate, report)`.

**Scenario:** A server was compromised and the team wants to know how. Last month's scan lists a critical remote code execution flaw in its remote access service, still unpatched. The vulnerability scan supplies the likely entry point. The closest wrong answer, a dashboard, could show a spike in activity but not the underlying weakness.

### Automated reports and dashboards as investigation sources
Automated reports and dashboards are summaries that tools build from underlying data. An **automated report** is produced on a schedule or by a trigger by a tool such as a SIEM (security information and event management system), a vulnerability scanner or an endpoint platform, and summarizes events, trends and findings for a period. A **dashboard** is a visual, near real-time display of key measures (charts, counters, maps) that lets an analyst spot a trend or an anomaly at a glance.

How each is used in an investigation:
1. **Dashboards to notice and orient:** a sudden rise in outbound traffic, failed logons clustering on one account, alerts concentrated on one subnet. The dashboard shows that something changed and roughly where and when.
2. **Drill down:** from the chart to the underlying logs for the same time window; the dashboard is a starting point, never the evidence.
3. **Automated reports for baseline and history:** daily or weekly reports show what normal looked like before the incident, when a pattern began, and whether it is new. Examples: top blocked addresses, accounts with the most failed logons, new administrator accounts, hosts missing patches, antimalware detections by host.
4. **Reports as triggers:** a scheduled report that highlights an ongoing password spray or a host that keeps getting reinfected can open the investigation in the first place.
5. **After the incident:** new report and dashboard items are added so the same pattern is visible next time.

Limits: both show only what they were designed to show; a summary can hide the one event that matters; dashboards reflect the present and recent past, so the detail must be pulled from retained logs; a report is only as good as the data and the query behind it.

**Why it matters:** people cannot read millions of log lines. Summaries are how a pattern becomes visible to a human quickly, and saved reports are often the easiest proof of when abnormal activity started.

**Common confusions:** A dashboard is live and visual; a report is a document for a period, usually delivered on a schedule. Automated reports are generated by tools; forensic reporting (objective 4.8) is written by an investigator about one case. Neither a dashboard nor a report is the raw evidence: for court or a detailed timeline, go to the underlying logs.

**Scenario:** A security operations center wants to notice a sudden surge of outbound data the moment it happens. The fitting source is a dashboard. The closest wrong answer, a weekly automated report, would reveal the surge days later.

**Scenario:** A manager asks whether the failed-logon pattern seen today was also present last month. The daily automated SIEM reports from last month answer that quickly.

### Packet captures (PCAP, full packet capture)
A packet capture is a recording of the actual packets that crossed a network point, headers and payload, saved to a file (commonly the pcap format) with tools such as tcpdump or Wireshark. It is the most detailed network evidence there is: where other sources say a conversation happened, a capture shows what was said.

How captures are made and used:
1. **Choose the capture point:** a switch mirror (SPAN) port, a network tap, or on the host itself. You see only traffic that passes that point.
2. **Capture, usually with a filter:** for example tcpdump writes raw packets to a file with its write option and can limit the capture to one host or port; a snapshot length setting controls how many bytes of each packet are kept, and a small value saves space but discards higher-layer data.
3. **Analyze:** open the file, follow a session, rebuild transferred files, read protocol fields, extract indicators (addresses, domains, file hashes).
4. **Preserve:** hash the capture file and record how, where and when it was taken.

What a capture answers: exactly which file or data left; which commands were sent over an unencrypted protocol; which credentials crossed the network in cleartext; how an exploit was delivered; whether a suspicious connection really carried what the alert claimed.

Limits: captures are large, so full capture is usually kept for hours or days, not months; you must have been capturing at the right place before or during the event; encrypted traffic (TLS, SSH, VPN) shows endpoints, timing and sizes but not content unless it is decrypted at an inspection point; capturing content raises privacy and legal questions, so it needs authorization.

**Why it matters:** when the question is "what exactly was taken?" or "did the attack succeed?", only the content settles it. A capture can turn an assumed breach of everything into a proven breach of specific files, or prove that nothing sensitive left.

**Common confusions:** Packet captures hold content; flow records and firewall logs hold a summary of the connection. A capture shows traffic, not which process on a host produced it (endpoint logs do). A protocol analyzer is the tool; the capture is the data.

**Scenario:** An analyst must see the contents of an unencrypted file transfer to an outside FTP server to learn which documents were sent. Use a packet capture. The closest wrong answer, firewall logs, would confirm the connection and its size but not the files.

Worked mini-example: capture command intent: record everything to and from host 10.20.4.37 on the server VLAN into a file; in the analyzer, following the FTP data stream shows `STOR payroll_2026.xlsx` and the file itself can be rebuilt from the stream.

### Logs vs flow records vs packet captures vs metadata (level of detail compared)
Network and host evidence comes at different levels of detail, and each level costs more to store. The decisive question is whether you need to know that something happened, how much was exchanged, or exactly what was exchanged.

| Source | What it holds | Shows content? | Storage cost | Typical question |
|---|---|---|---|---|
| Firewall log | Each connection allowed or denied: addresses, ports, protocol, action, rule | No | Low | Did host A talk to address B, and was it allowed? |
| Flow record (NetFlow) | Per-conversation summary: endpoints, ports, packets, bytes, start and end | No | Low | How much data went where, and when? |
| IDS/IPS log | Traffic that matched an attack signature or anomaly, and the action | A hint (the rule name), not the full traffic | Low | What attack was attempted? Was it blocked? |
| Metadata | Data about a message or file: headers, timestamps, author, location | No | Low | Where did it really come from? When was it made? |
| Packet capture | Every packet with headers and payload | Yes, unless encrypted | Very high | What exactly was sent? |

How to choose the level:
1. To find every system that contacted an address over a long period: firewall logs or flow records, because they are kept longest.
2. To measure how much left: flow records or firewall byte counts.
3. To name the attack technique: IDS/IPS logs.
4. To prove what the data was: a packet capture, if one exists for that time and the traffic was readable.
5. To verify the origin of an email or file: metadata.

**Why it matters:** organizations cannot keep full captures of everything, so they keep summaries for a long time and full detail briefly or only at key points. Knowing what each level can prove prevents over-claiming ("the log shows the file was stolen") and under-collecting (no capture running when it was needed).

**Common confusions:** A large byte count in a flow record suggests exfiltration but does not prove what left. Encrypted traffic reduces a packet capture to roughly what a flow record gives. Logs say an event happened; they do not replay it.

**Scenario:** "The investigator needs the total volume sent to an outside address during the last 60 days." Flow records or firewall logs. "The investigator needs to read the commands the attacker typed over Telnet yesterday." Packet capture (Telnet is a legacy cleartext protocol, so the content is readable).

### Firewall logs vs IDS/IPS logs vs endpoint logs vs OS security logs vs application logs
These log types sit close together and are easy to confuse. The decisive feature is the vantage point: where the source sits and therefore what it can and cannot see.

| Log type | Vantage point | Sees | Cannot see | Clue words |
|---|---|---|---|---|
| Firewall | Network boundary | Connections allowed or denied: addresses, ports, protocol | What was said; which process or user | "blocked", "allowed", "port", "outbound connection" |
| IDS/IPS | Network (or host) sensor | Traffic matching an attack signature or anomaly; action taken | Whether the attack worked on the target | "signature", "alert", "exploit attempt", "dropped" |
| Endpoint (EDR, antimalware) | Agent on the device | Processes, parent and child, files, per-process connections, detections | Devices with no agent | "which process", "launched", "quarantined" |
| OS security log | The operating system | Logons, failed logons, account and group changes, privilege use | Events inside applications; details not audited | "who logged on", "account created", "event ID" |
| Application log | Inside one application | Requests, transactions, app sign-ins, errors | Anything outside that application | "web requests", "database query", "failed portal logins" |
| Network logs | Infrastructure services | Address assignments, name lookups, VPN sessions, switch ports | Content of traffic | "which device had this IP", "DNS query", "VPN session" |

How to pick the source:
1. Underline what must be learned: a connection, an attack type, a process, an account action, an in-app action, or a device identity.
2. Match it to the vantage point above.
3. Reject sources that sit in the wrong place, even if they mention the same address or time.

**Why it matters:** each source alone gives a partial story, and choosing the wrong one wastes hours. A full timeline normally chains them: IDS names the attack, the firewall confirms the connection, network logs identify the device, the OS log shows the logon, the endpoint log shows the process, the application log shows the data touched.

**Common confusions:** A next-generation firewall can log applications and users and so overlaps with IDS/IPS and proxy logs; an allowed or blocked connection remains the firewall log's defining fact. Endpoint and OS logs both live on the host; the OS log is the system's own audit record, the endpoint log is the security agent's view.

**Scenario:** "Which user account was used to log on to the database server at 03:00?" OS security log. "Which queries did that session run?" Application (database) log. "Which program on the admin's laptop opened the connection?" Endpoint log.

### Choosing a data source for an investigation (decision path for objective 4.9)
An investigation starts from one question, and several sources may look plausible. Map the question to the source that holds that evidence, and know when a source is the wrong one.

| The investigator needs to know | Best source | Not this source when |
|---|---|---|
| What exactly was sent or received (file contents, commands) | Packet capture | Traffic was encrypted or nothing was being captured; then use endpoint or application logs |
| Which hosts talked to an address, on which port, allowed or blocked | Firewall logs | The traffic never crossed the firewall (same segment) |
| How much data moved between two endpoints over weeks | Flow records (network logs) | You need the content |
| What attack technique was attempted and whether it was blocked | IDS/IPS logs | You need proof it succeeded; confirm on the target |
| Which process on a device did it, and what it launched or wrote | Endpoint logs (EDR) | The device has no agent |
| Who logged on, failed to log on, or changed an account or group | OS-specific security logs | The sign-in was to an application with its own accounts |
| What a user did inside an application or website | Application logs | The app was not configured to log it |
| Which physical device held an IP address at a time | DHCP and switch logs (network logs) | The address is static and documented |
| Which domain names a host looked up | DNS logs (network logs) | The host used an outside resolver you do not log |
| Who connected remotely, from where | VPN logs (network logs) | Access did not use the VPN |
| Where an email really came from; when a file was created | Metadata (headers, file properties) | The metadata may have been altered; corroborate |
| Which weakness the attacker likely used | Vulnerability scan results | You need proof of what the attacker did |
| A live view to spot a spike or anomaly | Dashboard | You need exact detail or evidence |
| A periodic summary or trend over time | Automated reports | You need real-time awareness |

How to work a scenario:
1. Reduce the scenario to one question: what, who, which device, which process, how much, or how they got in.
2. Pick the source whose vantage point holds that answer.
3. If two fit, prefer the one with the needed level of detail: content needs a capture, a summary needs logs or flow data.
4. Remember the chain: most real investigations use several sources joined by synchronized time.

When NOT to rely on a source: one that was not enabled or retained at the time; one an attacker could alter locally and that was not forwarded centrally; a summary (dashboard, report) when evidence is required.

**Why it matters:** the fastest investigations start at the right source. The same skill shapes logging strategy beforehand: if a question on this table could not be answered in your environment, that source needs to be switched on before the incident.

**Common confusions:** "Logs" in general is a weak answer when a specific log type holds the evidence. A SIEM is where the sources are searched, not a source in this objective's list.

**Scenario:** A spoofed invoice email led an employee to run an attachment, and data may have left. Sources in order: metadata (email headers) for the true sender; endpoint logs for what the attachment launched; firewall or flow records for outbound connections and volume; a packet capture, if available, for what was sent. The tempting single answer, "vulnerability scan", fits none of these questions, because no unpatched weakness was involved.
