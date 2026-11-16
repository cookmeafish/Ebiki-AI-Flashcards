# Reference: numbers, ports, standards and acronyms
Checked as of 2026-11 for SY0-701.

## Ports and protocols
Default port numbers and transports for the services the course names. A port is only a convention: the protocol in use, not the number, decides whether traffic is secure, and any service can be moved to another port.

### Secure versus insecure protocol pairs with default ports (reference)
Each row pairs a cleartext protocol with its protected replacement. TCP is Transmission Control Protocol, UDP is User Datagram Protocol, TLS is Transport Layer Security and SSH is Secure Shell.

| Job | Insecure protocol (port) | Secure replacement (port) | Note |
|---|---|---|---|
| Remote command line | Telnet (TCP 23) | SSH (TCP 22) | Telnet sends the password in clear text |
| File transfer | FTP, File Transfer Protocol (TCP 21 control, TCP 20 data) | SFTP, file transfer inside SSH (TCP 22) | SFTP and FTPS are different protocols that share only a purpose |
| File transfer over TLS | FTP (TCP 21) | FTPS explicit: the client sends AUTH TLS on TCP 21; FTPS implicit: TCP 990 control, TCP 989 data | FTPS uses certificates, SFTP uses SSH keys or passwords |
| Simple file transfer | TFTP, Trivial File Transfer Protocol (UDP 69) | SFTP (TCP 22) | TFTP has no login at all |
| Web | HTTP, Hypertext Transfer Protocol (TCP 80) | HTTPS, HTTP over TLS (TCP 443) | HTTP/3 runs over QUIC on UDP, so a rule for TCP 443 alone does not cover it |
| Directory | LDAP, Lightweight Directory Access Protocol (TCP 389) | LDAPS, LDAP over TLS (TCP 636), or StartTLS on 389 | Active Directory Global Catalog: TCP 3268, over TLS TCP 3269 |
| Network management | SNMPv1 and SNMPv2c, Simple Network Management Protocol (UDP 161 queries, UDP 162 traps) | SNMPv3 (same ports) | v1 and v2c send the community string in clear text; v3 adds authentication and encryption (privacy) |
| Mail retrieval | POP3, Post Office Protocol 3 (TCP 110) | POP3S (TCP 995) | |
| Mail retrieval | IMAP, Internet Message Access Protocol (TCP 143) | IMAPS (TCP 993) | |
| Mail sending by a client | SMTP, Simple Mail Transfer Protocol (TCP 25) | Submission with STARTTLS (TCP 587) or implicit TLS (TCP 465) | Server to server mail still uses TCP 25 |
| Name lookup | DNS, Domain Name System (UDP 53, TCP 53) | DNS over TLS (TCP 853), DNS over HTTPS (TCP 443); DNSSEC on 53 | DNSSEC signs answers for integrity but does not encrypt them |
| Logging | syslog (UDP 514) | syslog over TLS (TCP 6514) | |
| Voice and video media | RTP, Real-time Transport Protocol (registered UDP 5004, RTCP 5005; usually negotiated ports) | SRTP, Secure Real-time Transport Protocol (negotiated ports) | |
| Call setup | SIP, Session Initiation Protocol (5060, UDP or TCP) | SIP over TLS (TCP 5061) | |

**Grading cue:** "use port 22 instead of 23" is half an answer: the fix is SSH replacing Telnet. "LDAPS on 389" and "SFTP on 990" are wrong pairings.

### Network service ports: directory, authentication, management and time (reference)
Infrastructure services that firewall rules, scans and logs mention. Kerberos is the Windows domain ticket protocol; RADIUS is Remote Authentication Dial-In User Service; TACACS+ is Terminal Access Controller Access-Control System Plus.

| Service | Port | Transport | Security note |
|---|---|---|---|
| Kerberos | 88 | UDP and TCP | Tickets; a key distribution center (KDC) answers |
| Kerberos password change | 464 | UDP (Windows) | |
| LDAP / LDAPS | 389 / 636 | TCP | Plain LDAP binds can expose passwords |
| RADIUS authentication | 1812 | UDP | Older gear used UDP 1645 |
| RADIUS accounting | 1813 | UDP | RADIUS hides only the password field |
| TACACS+ | 49 | TCP | Encrypts (the standard says obfuscates) the whole message body; separates authentication, authorization and accounting |
| DHCP, Dynamic Host Configuration Protocol | 67 server, 68 client | UDP | |
| DNS | 53 | UDP for most queries, TCP for large answers and zone transfers | |
| NTP, Network Time Protocol | 123 | UDP | Time matters for Kerberos and log correlation |
| SNMP | 161 polling, 162 traps | UDP | Use SNMPv3 |
| syslog / syslog over TLS | 514 / 6514 | UDP / TCP | |
| IPFIX, IP Flow Information Export (the open standard related to NetFlow) | 4739 | UDP, TCP or SCTP | Flow metadata, not packet contents |

**Worked example:** a log line "DENY UDP 10.1.4.20:51544 to 10.1.0.5:1812" is a client or access point failing to reach the RADIUS server, so wireless 802.1X logins will fail.

### Remote access, file sharing and database ports (reference)
Ports that often appear as exposed services in a scan. RDP is Remote Desktop Protocol and SMB is Server Message Block (Windows file sharing).

| Service | Port | Transport | Why it is a finding when exposed |
|---|---|---|---|
| SSH and SFTP | 22 | TCP | Brute force target when open to the internet |
| Telnet | 23 | TCP | Clear text; replace with SSH |
| RDP | 3389 | TCP and UDP | Remote login exposed to password guessing |
| SMB | 445 | TCP | The worm path for WannaCry (SMBv1) |
| NetBIOS name, datagram and session services (older Windows networking) | 137, 138, 139 | TCP and UDP registered | Older file sharing |
| WinRM, Windows Remote Management (WS-Management) | 5985 HTTP, 5986 HTTPS | TCP | Remote PowerShell |
| Microsoft SQL Server | 1433 | TCP | Databases belong on an internal segment |
| MySQL | 3306 | TCP | |
| PostgreSQL | 5432 | TCP | |
| NFS, Network File System | 2049 | TCP and UDP | |
| HTTP alternate | 8080 | TCP | Registered as an alternate HTTP port; still plain HTTP |

**Scenario:** a scan of the internet edge shows TCP 3389 open on a file server. The fix is to close it and require a VPN or jump host, not to move RDP to another port, because a moved service is still found by a full port scan.

### VPN and tunneling ports and IP protocol numbers (reference)
Some VPN parts are not TCP or UDP at all: they are separate IP protocols with their own protocol numbers, which a firewall must allow by number. IPsec is Internet Protocol Security, IKE is Internet Key Exchange, ESP is Encapsulating Security Payload, AH is Authentication Header and GRE is Generic Routing Encapsulation.

| Part | Port or protocol number | What it does | Status |
|---|---|---|---|
| IKE (IPsec key setup) | UDP 500 | Builds the security associations and keys | Current (IKEv2) |
| IPsec NAT traversal | UDP 4500 | Wraps ESP in UDP so it passes NAT devices | Current |
| ESP | IP protocol 50 | Encryption plus integrity | Current |
| AH | IP protocol 51 | Integrity and origin authentication only, no encryption | Current |
| L2TP, Layer 2 Tunneling Protocol | UDP 1701 | Tunnel with no encryption of its own; paired with IPsec | Older; being phased out with PPTP in Windows Server |
| PPTP, Point-to-Point Tunneling Protocol | TCP 1723 control plus GRE (IP protocol 47) | Older VPN tunnel | Legacy; Microsoft is deprecating it and L2TP in Windows Server in favor of IKEv2 and SSTP |
| TLS VPN (often called SSL VPN) | TCP 443 | Client or browser based remote access | Current; SSL itself is broken |
| OpenVPN | 1194 UDP or TCP (registered) | VPN software with its own registered port | |
| Other IP protocol numbers | ICMP 1, TCP 6, UDP 17, ICMPv6 58 | | |

**Common confusion:** "allow port 50" is wrong. ESP is IP protocol 50 and has no port.

### Email ports and DNS mail authentication records (reference)
Mail flow uses different ports for server relay, client submission and client reading. SPF, DKIM and DMARC are DNS TXT records that let a receiver check a sender's domain; they are not ports and do not encrypt mail.

| Item | Value | Meaning |
|---|---|---|
| SMTP relay between servers | TCP 25 | Opportunistic STARTTLS may be used |
| Message submission | TCP 587 (STARTTLS) | Client to its own mail server, with login |
| Message submission over TLS | TCP 465 (implicit TLS) | TLS starts before any SMTP command |
| IMAP / IMAPS | TCP 143 / TCP 993 | Reading mail, kept on the server |
| POP3 / POP3S | TCP 110 / TCP 995 | Reading mail, usually downloaded |
| SPF, Sender Policy Framework | TXT record such as "v=spf1 mx -all" | Lists hosts allowed to send for the domain; "-all" means fail the rest |
| DKIM, DomainKeys Identified Mail | TXT record under selector._domainkey.example.com | Public key that verifies a signature over the message |
| DMARC, Domain-based Message Authentication, Reporting and Conformance | TXT record at _dmarc.example.com | Policy p=none, p=quarantine or p=reject, plus report addresses |
| S/MIME, Secure/Multipurpose Internet Mail Extensions | Certificates, no own port | Encrypts and signs the message itself, end to end |

**Grading cue:** SPF checks the sending server, DKIM checks a signature, DMARC tells the receiver what to do when they fail. None of them hides content: that is S/MIME or PGP.

### Private and special IP address ranges (reference)
Addresses that are never routed on the internet. Seeing them as a source on an internet facing interface suggests spoofing; seeing 169.254 on a client means DHCP failed. NAT is Network Address Translation.

| Range | Purpose | Defined by |
|---|---|---|
| 10.0.0.0/8 | Private (internal) IPv4 | RFC 1918 |
| 172.16.0.0/12 (172.16.0.0 to 172.31.255.255) | Private IPv4 | RFC 1918 |
| 192.168.0.0/16 | Private IPv4 | RFC 1918 |
| 169.254.0.0/16 | IPv4 link local, self assigned when no DHCP answer comes | RFC 3927 |
| 127.0.0.0/8 and ::1 | Loopback (the host itself) | IPv4 and IPv6 standards |

**Common confusion:** private addressing plus NAT hides inside hosts but is not a firewall; port forwarding exposes them again.

## Cryptography sizes and algorithms
Exact sizes and status for the algorithms the course names. "Current" means approved for new protection today; "legacy" means only for reading or checking old data; "broken" means practical attacks exist.

### Symmetric ciphers: block size, key size and status (reference)
Symmetric ciphers use one shared secret key to encrypt and decrypt. AES is the Advanced Encryption Standard; DES is the Data Encryption Standard; 3DES (TDEA) is Triple DES.

| Cipher | Type | Block size | Key size | Status |
|---|---|---|---|---|
| AES-128 / AES-192 / AES-256 | Block | 128 bits | 128, 192 or 256 bits (10, 12 or 14 rounds) | Current; the default choice |
| ChaCha20 | Stream | none (stream) | 256 bits, with a 96-bit nonce | Current; a TLS 1.3 option (with Poly1305) |
| DES | Block | 64 bits | 56 effective bits (64 with parity bits) | Broken; standard withdrawn |
| 3DES (TDEA) | Block | 64 bits | Three 56-bit keys (168 bits of key material), about 112 bits of strength; two-key form about 80 | Legacy: disallowed for encryption after 2023, NIST withdrew it on 1 January 2024; decrypting old data still allowed |
| RC4, Rivest Cipher 4 | Stream | none | Variable | Broken; banned in TLS; it was inside WEP and TKIP |
| IDEA, International Data Encryption Algorithm | Block | 64 bits | 128 bits | Older; not on NIST's approved list |

**Common confusions:** bigger block size and bigger key size are different things: AES-256 still has a 128-bit block. 3DES is not "three times as strong" as DES; its strength is about 112 bits.

**Scenario:** a policy says "approved symmetric encryption for new systems". AES (with GCM) fits. 3DES fails because it is disallowed for new encryption, not because its key is short.

### Asymmetric algorithms and comparable key sizes (reference)
Asymmetric (public key) algorithms use a key pair. Their key sizes are not comparable bit for bit with symmetric keys, so NIST lists equal strengths. RSA is Rivest, Shamir and Adleman; ECC is elliptic curve cryptography; DH is Diffie-Hellman; DSA is the Digital Signature Algorithm.

| Security strength (bits) | Symmetric equal | RSA modulus | DH or DSA (finite field) | ECC key (ECDSA, ECDH, EdDSA) | NIST status |
|---|---|---|---|---|---|
| 80 | 2-key 3DES | 1024 | 1024 | 160 to 223 | Not allowed for new protection |
| 112 | 3-key 3DES | 2048 | 2048 | 224 to 255 | Lowest allowed; NIST's draft plan deprecates it after 2030 |
| 128 | AES-128 | 3072 | 3072 | 256 to 383 | Allowed |
| 192 | AES-192 | 7680 | 7680 | 384 to 511 | Allowed |
| 256 | AES-256 | 15360 | 15360 | 512 or more | Allowed |

Other status facts:
- RSA keys under 2048 bits are disallowed for new signatures and key transport.
- DSA is no longer approved for creating signatures (FIPS 186-5); it may still verify old ones. ECDSA, EdDSA and RSA remain.
- NIST's draft post-quantum transition plan (IR 8547) has RSA and ECC disallowed after 2035, because a large quantum computer would break them.
- DHE and ECDHE are the ephemeral forms that give perfect forward secrecy (PFS).

**Worked example:** a certificate with an ECC P-256 key and one with RSA 3072 give about the same 128-bit strength; the ECC key is about twelve times shorter.

### Hash functions: digest size and status (reference)
A hash maps any input to a fixed size digest and cannot be reversed. Collision resistance is about half the digest length in bits (the birthday bound), so a 256-bit digest gives about 128 bits of collision strength. SHA is the Secure Hash Algorithm; MD5 is Message Digest 5.

| Hash | Digest size | Status |
|---|---|---|
| MD5 | 128 bits | Broken for collisions; never for signatures or certificates |
| SHA-1 | 160 bits | Broken for collisions (public collision shown in 2017); disallowed for new signatures; public certificates must stop using it in 2026 |
| SHA-224, SHA-256, SHA-384, SHA-512 (SHA-2 family) | 224, 256, 384, 512 bits | Current; SHA-256 is the common default |
| SHA3-224, SHA3-256, SHA3-384, SHA3-512 (SHA-3 family) | 224, 256, 384, 512 bits | Current; different internal design from SHA-2 |
| SHAKE128, SHAKE256 | Chosen output length | Current extendable output functions |
| RIPEMD-160 | 160 bits | Older, not a NIST standard |
| HMAC, keyed-hash message authentication code (HMAC-SHA-256 and others) | Same as the hash used | Current; adds a secret key for integrity plus authenticity |

**Common confusions:** a CRC (cyclic redundancy check) catches accidental errors only; an attacker can forge it. A plain hash proves integrity only if the expected hash arrives over a trusted path; HMAC or a digital signature is needed when an attacker could replace both file and hash.

### Password hashing and key stretching settings (reference)
Fast hashes such as SHA-256 let attackers test billions of guesses. Password storage uses a slow, salted function so each guess costs time (and for Argon2 and scrypt, memory). Settings below are current minimums from the OWASP password storage guidance.

| Function | Minimum setting | Notes |
|---|---|---|
| Argon2id | 19 MiB of memory, 2 iterations, parallelism 1 | First choice; memory hard |
| scrypt | Cost 2^17, block size 8, parallelism 1 | Use when Argon2id is not available |
| bcrypt | Work factor 10 or more | Legacy systems; reads at most 72 bytes of the password |
| PBKDF2 (Password-Based Key Derivation Function 2) | 600,000 iterations with HMAC-SHA-256 | When FIPS 140 validated crypto is required |
| Salt | Unique random value per password, stored with the hash | Defeats precomputed rainbow tables; it is not secret |
| Pepper | Secret value kept apart from the database | Optional extra layer |

**Common confusions:** salting stops precomputed tables, stretching slows each guess; good storage does both. Encrypting passwords is the wrong answer, because a stolen key reveals them all.

**Worked example:** at 600,000 PBKDF2 iterations, every guess costs 600,000 HMAC calls, so a list of 1 million guesses against one salted hash costs 600 billion HMAC operations.

### Block cipher modes of operation (reference)
A mode says how a block cipher such as AES handles data longer than one block. IV is initialization vector; a nonce is a number used once.

| Mode | Full name | Gives | IV rule | Status |
|---|---|---|---|---|
| ECB | Electronic Codebook | Confidentiality only, poorly | None | Avoid: equal plaintext blocks give equal ciphertext blocks, so patterns show |
| CBC | Cipher Block Chaining | Confidentiality | Must be unpredictable | Legacy in TLS; needs a separate integrity check |
| CFB | Cipher Feedback | Confidentiality (stream like) | Must be unpredictable | Rare |
| OFB | Output Feedback | Confidentiality (stream like) | Must be unique per message | Rare |
| CTR | Counter (the acronym list writes CTM) | Confidentiality, parallel | Every counter block unique under a key | Basis of GCM |
| GCM | Galois/Counter Mode | Confidentiality plus integrity (AEAD, authenticated encryption) | 96-bit IV recommended, never reused with the same key | Current; used in TLS 1.3, WPA3 192-bit (GCMP-256) |
| CCM | Counter with CBC-MAC | Confidentiality plus integrity | Unique nonce | Current; CCMP in WPA2 and WPA3 |

**Scenario:** an image encrypted with AES still shows the outline of the original picture. The clue points to ECB. CBC with a random IV, or GCM, fixes it; a longer key does not.

### TLS and SSL versions and TLS 1.3 cipher suites (reference)
TLS protects data in transit; SSL (Secure Sockets Layer) is its broken predecessor. Version status per current IETF rules (RFC 8996 and RFC 9325).

| Version | Status |
|---|---|
| SSL 2.0 and SSL 3.0 | Must not be used; SSL 3.0 fell to the POODLE downgrade attack |
| TLS 1.0 and TLS 1.1 | Deprecated in 2021 (RFC 8996) |
| TLS 1.2 | Current; must be supported; use AEAD suites with ECDHE |
| TLS 1.3 | Current and preferred; only forward secret key exchange, only AEAD ciphers |

TLS 1.3 defines five cipher suites: TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256, TLS_AES_128_CCM_SHA256 and TLS_AES_128_CCM_8_SHA256. RC4 is banned in every TLS version (RFC 7465).

**Common confusions:** "SSL VPN" and "SSL certificate" are old names; the protocol in use is TLS. A TLS 1.2 server that still offers static RSA key exchange has no forward secrecy.

### Certificate file formats and validity limits (reference)
Formats for X.509 certificates (the standard certificate layout) and related files. PKI is public key infrastructure; CSR is certificate signing request; PKCS is Public Key Cryptography Standards.

| Format | Typical extensions | Holds | Encoding |
|---|---|---|---|
| PEM, Privacy Enhanced Mail (text form) | .pem, .crt, .cer, .key | Certificates, keys or CSRs between "-----BEGIN ...-----" lines | Base64 text |
| DER, Distinguished Encoding Rules | .der, .cer | One certificate | Binary |
| PKCS #12 (P12 or PFX) | .p12, .pfx | Private key plus its certificate chain, password protected | Binary |
| PKCS #7 | .p7b, .p7c | Certificates and chain, never a private key | Base64 or binary |
| PKCS #10 CSR | .csr | Public key and requested name, signed by the requester's private key | Usually PEM |

Revocation checks: a CRL (certificate revocation list) is a signed list the CA publishes; OCSP (Online Certificate Status Protocol) answers for one certificate. Public web (TLS server) certificate maximum validity under the CA/Browser Forum rules: 398 days until 15 March 2026, 200 days from then, 100 days from 15 March 2027, 47 days from 15 March 2029.

**Grading cue:** moving a certificate WITH its private key to another server needs a PKCS #12 (.pfx) file; a .p7b cannot carry the key.

### One-time password and Kerberos timing numbers (reference)
Numbers behind common authentication mechanisms. HOTP is HMAC-based one-time password; TOTP is time-based one-time password.

| Item | Number | Meaning |
|---|---|---|
| HOTP code length | At least 6 digits | Counter based: each press or use moves the counter |
| TOTP time step | 30 seconds recommended | The code changes every step; clocks must roughly agree |
| Kerberos allowed clock skew | Commonly 5 minutes | A client clock further off fails with a skew error, so NTP matters |
| Kerberos port | 88 UDP and TCP | |

**Scenario:** users suddenly fail Kerberos logins after a virtual machine restore with a wrong time. The cause is clock skew beyond the allowed window; fix time sync, not passwords.

## Wireless standards and security
Wi-Fi security protocols, their handshakes and the setup features to disable. WPA is Wi-Fi Protected Access; IEEE 802.11 is the Wi-Fi standard; 802.1X is port based network access control.

### Wi-Fi security generations: WEP, WPA, WPA2 and WPA3 (reference)
Each generation replaced a broken one. CCMP is Counter Mode with CBC-MAC Protocol (AES based); TKIP is Temporal Key Integrity Protocol; GCMP is Galois/Counter Mode Protocol.

| Generation | Encryption | Key and integrity facts | Status |
|---|---|---|---|
| WEP, Wired Equivalent Privacy | RC4 | 40-bit or 104-bit key plus a 24-bit IV sent in the clear; IVs repeat quickly and keys can be recovered from captured traffic | Broken, legacy |
| WPA (first version) | TKIP, still RC4, with the Michael integrity check | A stopgap for WEP era hardware | Broken, legacy; Windows warns on WEP and TKIP networks |
| WPA2 (IEEE 802.11i) | CCMP, AES with 128-bit keys | 4-way handshake derives per session keys from the pairwise master key | Still common; WPA2-Personal handshakes allow offline guessing |
| WPA3 | CCMP-128 minimum; GCMP-256 in the 192-bit mode | SAE (Simultaneous Authentication of Equals) for personal; protected management frames (802.11w) required | Current; required for new Wi-Fi certified devices |

**Common confusions:** WPA2 is not broken the way WEP is; its weak point is a guessable shared passphrase. WPA3 does not drop the 4-way handshake: SAE runs first and makes a strong key, then the 4-way handshake still runs.

### WPA2 and WPA3 modes and handshakes compared (reference)
Personal modes share one secret; enterprise modes log each user in through 802.1X and a RADIUS server. PSK is pre-shared key; PMF is protected management frames; OWE is Opportunistic Wireless Encryption.

| Mode | How a client is admitted | Key facts |
|---|---|---|
| WPA2-Personal (PSK) | Shared passphrase turned into the pairwise master key with PBKDF2 and HMAC-SHA1 | A captured 4-way handshake lets an attacker test passphrase guesses offline |
| WPA3-Personal (SAE, "dragonfly") | Password based exchange, fresh key each session | Resists offline dictionary attacks, forward secrecy, PMF mandatory |
| WPA3-Personal transition mode | WPA3 clients use SAE, WPA2 clients use PSK on the same network | PMF optional; keeps the WPA2 weakness for WPA2 clients; use only while migrating |
| WPA2-Enterprise | 802.1X with an EAP method checked by RADIUS | Individual credentials; disable one account to remove one user |
| WPA3-Enterprise | As WPA2-Enterprise plus PMF required | 128-bit by default |
| WPA3-Enterprise 192-bit mode | EAP-TLS only | GCMP-256 encryption, SHA-384 based keys, ECDHE and ECDSA or RSA of at least 3072 bits on certificates |
| Wi-Fi Enhanced Open (OWE) | No password; Diffie-Hellman during association | Encrypts open (guest or cafe) Wi-Fi, but does not authenticate the network, so an evil twin is still possible |
| 6 GHz band (Wi-Fi 6E and later) | WPA3 or OWE | PMF mandatory |

**Scenario:** a hotel wants encrypted guest Wi-Fi with no password to share. Enhanced Open fits. WPA3-Personal needs a shared password, and WPA3-Enterprise needs accounts for every guest.

### EAP methods for 802.1X compared (reference)
EAP, the Extensible Authentication Protocol, is a framework that carries a login method between the client (supplicant), the switch or access point (authenticator) and the RADIUS server (authentication server).

| Method | Certificates needed | How the user proves identity | Note |
|---|---|---|---|
| EAP-TLS | Server AND every client | Client certificate (mutual authentication) | Strongest; required for WPA3-Enterprise 192-bit |
| PEAP, Protected EAP | Server only | Password (often MSCHAPv2) inside a TLS tunnel | Common with Active Directory |
| EAP-TTLS, Tunneled TLS | Server only | Any inner method, including legacy ones, inside a TLS tunnel | |
| EAP-FAST | None required | Tunnel built from a Protected Access Credential (PAC) | Defined in RFC 4851 |
| LEAP, Lightweight EAP | Not covered here | Appears on the acronym list | Prefer the methods above |

**Grading cue:** "certificates on both sides" points to EAP-TLS; "server certificate only, user password inside a tunnel" is PEAP or EAP-TTLS.

### Wi-Fi Protected Setup (WPS) PIN weakness (reference)
WPS lets a device join by pushing a button or typing a PIN printed on the router. The PIN mode is the weak part.

| Fact | Value |
|---|---|
| PIN length | 8 digits |
| Why it is weak | The router reveals whether the first half is right, and the last digit is a checksum |
| Guesses needed in the worst case | About 11,000 (10^4 + 10^3) instead of 100 million |
| Fix | Turn off WPS PIN (external registrar) on the router; lockouts only slow the attack |

**Scenario:** an attacker joins a WPA2-Personal network in a few hours without knowing the passphrase. With a strong passphrase, the clue is WPS left on.

## RAID levels
RAID (redundant array of inexpensive or independent disks) spreads data over several disks for speed, fault tolerance or both. It is availability, not backup: deletion, corruption and ransomware are copied to every disk at once.

### RAID 0, 1, 5, 6 and 10 at a glance (reference)
The five levels the course compares. Striping splits data across disks; mirroring writes the same data twice; parity is calculated data that rebuilds a lost disk.

| Level | Technique | Minimum disks | Disk failures survived | Usable space with n equal disks |
|---|---|---|---|---|
| RAID 0 | Striping only | 2 | None: one failure loses the whole array | All n disks |
| RAID 1 | Mirroring | 2 | 1 in a two disk mirror | Half (one disk's worth for a pair) |
| RAID 5 | Striping with single distributed parity | 3 | 1 | n minus 1 disks |
| RAID 6 | Striping with double distributed parity | 4 (some controllers allow 3) | Any 2 | n minus 2 disks |
| RAID 10 (1+0) | Stripe across mirrored pairs | 4 | At least 1; up to one per mirrored pair | Half |

**Common confusions:** RAID 5 survives one failure, not two; a second failure during the rebuild loses the array, which is why large arrays use RAID 6. RAID 10 survives two failures only if they hit different mirror pairs.

### RAID usable capacity worked examples (reference)
Worked numbers with 2 TB disks, a common exam style calculation.

| Setup | Raw space | Usable space | Survives |
|---|---|---|---|
| RAID 0, four 2 TB disks | 8 TB | 8 TB | No failure |
| RAID 1, two 2 TB disks | 4 TB | 2 TB | 1 failure |
| RAID 5, four 2 TB disks | 8 TB | 6 TB | 1 failure |
| RAID 6, four 2 TB disks | 8 TB | 4 TB | Any 2 failures |
| RAID 10, four 2 TB disks | 8 TB | 4 TB | 1 failure for sure, 2 if in different pairs |

**Scenario:** a server needs the most usable space from four disks while surviving one disk failure. RAID 5 gives 6 TB. RAID 10 also survives one failure but gives only 4 TB; RAID 0 gives 8 TB but survives nothing.

## Backup and recovery metrics
Targets set in a business impact analysis (BIA) and the measures that show whether systems can meet them.

### RTO, RPO, MTD, MTTR, MTBF and MTTF defined (reference)
Two groups: objectives the business sets (RTO, RPO, MTD) and reliability measures taken from real equipment (MTTR, MTBF, MTTF).

| Term | Full name | Question it answers | Direction |
|---|---|---|---|
| RTO | Recovery time objective | How long may this system be down before the harm is unacceptable? | Looks forward from the outage; drives recovery method and site |
| RPO | Recovery point objective | How much data, measured in time, may be lost? | Looks back from the outage; drives backup or replication frequency |
| MTD | Maximum tolerable downtime | How long can the business process itself survive the outage? | RTO must be shorter than MTD |
| MTTR | Mean time to repair (the acronym list says recover) | On average, how long does a fix take? | Lower is better; should fit inside the RTO |
| MTBF | Mean time between failures | On average, how long does a repairable system run between failures? | Higher is better; total uptime divided by failures |
| MTTF | Mean time to failure | On average, how long does a non repairable part last? | Higher is better; for parts that are replaced |

**Common confusions:** RPO is not a time to recover; it is lost data. MTBF counts only running time, not repair time. Availability is roughly MTBF divided by (MTBF plus MTTR).

### Recovery metrics worked numbers (reference)
Calculations of the kind a scenario asks for.

| Given | Result | Working |
|---|---|---|
| Nightly backup at 01:00, failure at 17:00 | 16 hours of data lost | Last good copy is 16 hours old; meets an RPO of 24 hours, fails an RPO of 4 hours |
| RPO 15 minutes | Backups or replication at least every 15 minutes | RPO sets frequency |
| RTO 2 hours, restore takes 5 hours | Target missed | Needs a faster method (hot site, replication), not more frequent backups |
| Three repairs took 2, 3 and 4 hours | MTTR 3 hours | (2 + 3 + 4) / 3 |
| 9,000 running hours, 3 failures | MTBF 3,000 hours | 9,000 / 3 |
| MTBF 3,000 hours, MTTR 3 hours | Availability about 99.9% | 3,000 / 3,003 |
| 1,000 drives with MTTF 1.5 million hours | About one failure every 1,500 hours across the fleet | 1,500,000 / 1,000 |

### Availability percentages and yearly downtime (reference)
Uptime targets in service level agreements (SLAs), converted to downtime over a 365 day year (8,760 hours).

| Availability | Downtime per year | Downtime per 30 day month |
|---|---|---|
| 99% ("two nines") | 87.6 hours | About 7.2 hours |
| 99.9% ("three nines") | 8.76 hours | About 43 minutes |
| 99.99% ("four nines") | About 52.6 minutes | About 4.3 minutes |
| 99.999% ("five nines") | About 5.26 minutes | About 26 seconds |

**Grading cue:** each extra nine cuts allowed downtime by ten times. High availability is measured this way; fault tolerance means a part fails with no interruption at all.

### Backup types and what a restore needs (reference)
How much each backup copies and which copies a restore needs. Incremental and differential differ only in their starting point: the last backup of any kind, or the last full.

| Type | Copies | Backup time | Restore needs |
|---|---|---|---|
| Full | Everything selected | Longest | The one full backup |
| Incremental | Changes since the last backup of any type | Shortest | The last full plus EVERY incremental since, in order |
| Differential | Changes since the last full | Grows each day until the next full | The last full plus only the latest differential |
| Snapshot | Point in time image of a volume or virtual machine | Short | The snapshot; if it is stored on the system that failed, it is lost with it |
| Replication | Continuous copy to another system or site | Constant | The replica; also copies deletions and encryption by ransomware |

3-2-1 rule: three copies of important data (the original and two backups), on two different media types, with one copy offsite. Keep one copy offline or immutable against ransomware, and test restores.

**Worked example:** full backup Sunday, incremental Monday to Thursday, failure Friday morning: restore Sunday then Monday, Tuesday, Wednesday and Thursday in order. With differentials instead: Sunday plus Thursday's differential.

### Recovery site types: cold, warm, hot and mirrored (reference)
Alternate sites trade cost against how fast operations move (NIST SP 800-34 gives setup time and cost only as relative values). Pick the cheapest site whose ready time meets the RTO.

| Site | What is there | Time to take over | Cost |
|---|---|---|---|
| Cold | Space, power, cooling and connections; no equipment installed | Long | Low |
| Warm | Partly equipped: some or all hardware, software, telecommunications and power | Medium | Medium |
| Hot | Fully equipped and staffed, able to take over quickly | Short | Medium to high |
| Mirrored | Fully redundant copy with real time mirroring | Close to immediate, near 100% availability | Highest |

**Scenario:** an RTO of 30 minutes for order processing rules out cold and warm sites. A hot or mirrored site, or cloud failover with replicated data, can meet it.

## Risk and vulnerability numbers
Formulas and score ranges used in risk analysis and vulnerability management.

### Quantitative risk formulas: SLE, ARO and ALE (reference)
Quantitative risk analysis puts money values on risk. AV is asset value; EF is exposure factor (the share of the asset lost in one event); SLE is single loss expectancy; ARO is annualized rate of occurrence; ALE is annualized loss expectancy.

| Formula | Meaning |
|---|---|
| SLE = AV x EF | Money lost in one event |
| ALE = SLE x ARO | Expected money lost per year |
| ARO | Events per year: once in 4 years = 0.25, twice a year = 2 |

| Worked example | Value |
|---|---|
| Asset value | $200,000 |
| Exposure factor | 25% |
| SLE | $50,000 |
| ARO (once every 2 years) | 0.5 |
| ALE | $25,000 per year |

**Grading cue:** a control costing more per year than the ALE it removes is not worth buying on cost alone. An EF is a fraction or percentage, never a dollar value.

### CVSS severity score ranges (reference)
CVSS, the Common Vulnerability Scoring System, gives each vulnerability a 0.0 to 10.0 score; versions 3.1 and 4.0 use the same severity bands.

| Rating | Score |
|---|---|
| None | 0.0 |
| Low | 0.1 to 3.9 |
| Medium | 4.0 to 6.9 |
| High | 7.0 to 8.9 |
| Critical | 9.0 to 10.0 |

**Common confusions:** CVSS measures severity, not risk to your organization; exposure, asset value and exploitation in the wild change priority. CVE (Common Vulnerabilities and Exposures) is the identifier, such as CVE-2026-12345; CVSS is the score.

## Log and event sources
What each log source shows, standard severity numbers, the Windows event IDs analysts look for first, and the order to collect volatile evidence.

### Log sources and what each one shows (reference)
Which source answers which investigation question. SIEM is security information and event management; IDS and IPS are intrusion detection and prevention systems; EDR is endpoint detection and response.

| Source | Records | Answers |
|---|---|---|
| Firewall logs | Source and destination address, ports, protocol, allow or deny, time | Who talked to whom, what was blocked |
| IDS or IPS logs | Signature or anomaly alerts, action taken | Which known attack pattern was seen or stopped |
| Network logs (switches, routers, VPN, wireless controllers) | Logins, configuration changes, link and routing events | Who changed the network, who connected |
| Flow data (NetFlow, IPFIX) | Metadata: addresses, ports, byte counts, times | Volume and direction, exfiltration, beaconing |
| Packet capture (PCAP) | Full packet contents | Exactly what was sent, if unencrypted |
| Endpoint logs (EDR, antivirus) | Processes, files, registry, detections | What ran on the host |
| OS security logs (Windows Security log, Linux authentication logs) | Logins, privilege use, account changes | Which account did what |
| Application logs (web server, database) | Requests, errors, application logins | Attacks against the application, such as injection attempts |
| Metadata (email headers, file properties) | Data about data | Mail route, author, creation time |
| Vulnerability scan reports | Findings with scores | Which weakness was open at the time |

**Grading cue:** "how much data left and where to" points to flow data or firewall logs; "what exactly was in it" needs a packet capture.

### Syslog severity levels and priority (reference)
Syslog marks every message with a severity from 0 (worst) to 7. The priority value in angle brackets is facility x 8 + severity.

| Level | Name | Meaning |
|---|---|---|
| 0 | Emergency | System unusable |
| 1 | Alert | Act immediately |
| 2 | Critical | Critical condition |
| 3 | Error | Error condition |
| 4 | Warning | Warning condition |
| 5 | Notice | Normal but significant |
| 6 | Informational | Routine information |
| 7 | Debug | Debugging detail |

**Worked example:** a message starting <165> is facility 20 (local4) and severity 5 (Notice), because 20 x 8 + 5 = 165. Ports: UDP 514, or TCP 6514 over TLS.

### Windows security event IDs and logon types (reference)
Windows Security log entries most used in investigations. A burst of 4625 then a 4624 for the same account suggests a successful password guess.

| Event ID | Meaning |
|---|---|
| 4624 | An account logged on successfully |
| 4625 | An account failed to log on |
| 4672 | Special (administrator level) privileges assigned to a new logon |
| 4720 | A user account was created |
| 4740 | A user account was locked out |
| 1102 | The audit (Security) log was cleared |

| Logon type (in 4624 and 4625) | Meaning |
|---|---|
| 2 | Interactive, at the keyboard |
| 3 | Network, such as a file share |
| 4 / 5 | Batch (scheduled task) / Service |
| 7 | Workstation unlock |
| 8 | Network with the password sent in clear text |
| 10 | Remote interactive, Remote Desktop |
| 11 | Cached credentials, no domain controller contacted |

**Scenario:** an alert shows event 1102 on a server minutes after a 4672 for an unusual account. Clearing the log right after privileged access is a classic sign of an attacker hiding tracks.

### Order of volatility for evidence collection (reference)
Collect the most volatile evidence first, because it disappears soonest (a power off erases memory). Based on RFC 3227.

| Order | Evidence |
|---|---|
| 1 | CPU registers and cache |
| 2 | Routing table, ARP cache, process table, kernel statistics, memory (RAM) |
| 3 | Temporary file systems |
| 4 | Disk |
| 5 | Remote logging and monitoring data |
| 6 | Physical configuration and network topology |
| 7 | Archival media (backups) |

**Common confusion:** imaging the disk first is the classic wrong order when the machine is still running: capture memory first, then take a hashed bit for bit disk image through a write blocker.

## Frameworks and standards at a glance
Who publishes each framework, what kind of document it is, and the ordered lists the course uses.

### Security frameworks and standards compared (reference)
Frameworks guide a program; standards set requirements; regulations are law. NIST is the US National Institute of Standards and Technology.

| Name | Publisher | Kind | Use |
|---|---|---|---|
| NIST CSF 2.0 (Cybersecurity Framework) | NIST | Voluntary framework, six functions | Organize and measure a whole security program |
| NIST RMF (SP 800-37) | NIST | Seven step process | Authorize and monitor systems (US federal) |
| NIST SP 800-53 | NIST | Control catalog | Pick specific controls |
| ISO/IEC 27001:2022 | ISO and IEC | Certifiable requirements for an information security management system (ISMS) | Certification by an outside auditor |
| ISO/IEC 27002:2022 | ISO and IEC | Guidance for the Annex A controls (93 controls in four themes) | How to implement controls; not certifiable |
| CIS Critical Security Controls | Center for Internet Security | 18 prioritized control groups | Practical hardening priorities |
| PCI DSS | PCI Security Standards Council | Industry standard (contract, not law) | Anyone who stores, processes or transmits card data |
| SOC 2 | AICPA (US accountants) | Audit report on five Trust Services Criteria | Show customers a service provider's controls |
| GDPR | European Union | Regulation (law) | Personal data of people in the EU |
| MITRE ATT&CK | MITRE | Knowledge base of adversary tactics and techniques | Map detections and threat behavior |
| CVE / CVSS | CVE Program / FIRST | Vulnerability identifier / severity score | Name and rate vulnerabilities |

**Common confusion:** ISO 27001 is the one an organization is certified against; 27002 only explains the controls.

### NIST CSF 2.0 functions and RMF steps in order (reference)
Two NIST ordered lists that questions often ask to sequence.

| NIST CSF 2.0 function | Purpose |
|---|---|
| Govern | Set strategy, roles, policy and supply chain risk oversight |
| Identify | Know assets and risks |
| Protect | Safeguards to prevent or limit harm |
| Detect | Find attacks and anomalies |
| Respond | Act on a detected incident |
| Recover | Restore operations |

| RMF step (SP 800-37) | Purpose |
|---|---|
| 1. Prepare | Context and priorities |
| 2. Categorize | Impact level of the system and its data |
| 3. Select | Choose controls |
| 4. Implement | Put controls in place and document them |
| 5. Assess | Test whether controls work |
| 6. Authorize | A senior official accepts the risk to operate |
| 7. Monitor | Ongoing checks and changes |

### Process phases in order: incident response, penetration testing and media sanitization (reference)
Ordered processes where the sequence itself is the tested fact.

| Process | Phases in order | Source |
|---|---|---|
| Incident response life cycle | Preparation; detection and analysis; containment, eradication and recovery; post incident activity (lessons learned) | NIST SP 800-61 rev 2 (rev 3 now maps response to CSF 2.0 functions) |
| Penetration test | Planning; discovery; attack; reporting (reporting runs alongside the others) | NIST SP 800-115 |
| Media sanitization methods, weakest to strongest | Clear (overwrite through normal commands); purge (techniques such as cryptographic erase, media can be reused); destroy (disintegrate, pulverize, melt, incinerate) | NIST SP 800-88 |

**Common confusion:** containment comes before eradication; removing malware before isolating the host lets it spread or alerts the attacker.

### Compliance numbers: GDPR, SOC 2, ISO/IEC 27001 and PCI DSS (reference)
Exact numbers from regulations and audit standards.

| Item | Number |
|---|---|
| GDPR breach notice to the supervisory authority | Without undue delay, within 72 hours of becoming aware where feasible |
| GDPR maximum fine (most serious breaches) | Up to 20 million euros or 4% of worldwide annual turnover, whichever is higher |
| SOC 2 Type 1 report | Design of controls at one point in time |
| SOC 2 Type 2 report | Design and operating effectiveness over a period, typically 3 to 12 months |
| SOC 2 Trust Services Criteria | Security (always), availability, confidentiality, processing integrity, privacy |
| ISO/IEC 27001:2022 Annex A | 93 controls: organizational 37, people 8, physical 14, technological 34 |
| ISO/IEC 27001:2013 certificates | Expired by 31 October 2025 at the latest |
| PCI DSS scope | Any entity that stores, processes or transmits cardholder data, or can affect its security |

**Grading cue:** a customer asking for proof that a vendor's controls worked all year wants a SOC 2 Type 2, not Type 1.

### Password and authentication policy numbers from NIST SP 800-63B (reference)
Current NIST password rules (SP 800-63B revision 4). Many older policies in the field still use the rules NIST dropped. MFA is multifactor authentication.

| Rule | Current NIST value |
|---|---|
| Minimum length, password as the only factor | 15 characters |
| Minimum length, password used with MFA | 8 characters |
| Maximum length allowed | At least 64 characters |
| Composition rules (must mix types) | Must not be imposed |
| Periodic forced change | Must not be required; change only on evidence of compromise |
| Blocklist check | Required: reject common, expected or breached passwords |
| Failed attempt limit | No more than 100 consecutive failures on one account |

**Common confusion:** "change every 90 days and require a symbol" is an old practice, not current NIST guidance.

## Acronyms that look alike
Acronyms with more than one meaning, and list expansions that differ from the standards' own names. Read the context, not only the letters.

### One acronym, several meanings (reference)
Each row is one acronym the course uses in different senses.

| Acronym | Meanings | How to tell |
|---|---|---|
| MAC | Mandatory access control; Media Access Control (hardware) address; message authentication code | Access model, network card address, or integrity tag |
| RBAC | Role-based access control; rule-based access control | Job role versus admin rules for everyone (firewall ACLs, time of day) |
| PAM | Privileged access management; Pluggable Authentication Modules (Linux) | Admin account control versus Linux login plumbing |
| SAN | Storage area network; subject alternative name (certificate field) | Storage versus extra host names on a certificate |
| RA | Registration authority (PKI); recovery agent (encryption key recovery) | Identity checks for certificates versus recovering encrypted data |
| SOC / SoC | Security operations center; system on chip | Team and facility versus a single chip |
| PAC | Proxy auto configuration (browser proxy file); Protected Access Credential (EAP-FAST) | Web proxy settings versus wireless authentication |
| ESP | Encapsulating Security Payload (IPsec) | IP protocol 50, not a port |
| CTR / CTM | Counter mode (block cipher mode) | Same mode, two abbreviations |
| PEM | Privacy Enhanced Mail; today the Base64 certificate file format | The file format is what is meant in PKI questions |

### Acronym list expansions that differ from the standards (reference)
A few expansions in the exam acronym list differ from the name the standard itself uses. Both forms point to the same thing; answers using either should be accepted.

| Acronym | Acronym list form | Name used by the standard |
|---|---|---|
| CVE | Common Vulnerability Enumeration | Common Vulnerabilities and Exposures (CVE Program) |
| DES | Digital Encryption Standard | Data Encryption Standard (NIST) |
| MTTR | Mean time to recover | Objective 5.2 writes mean time to repair |
| ESP | Encapsulated Security Payload | Encapsulating Security Payload (RFC 4303) |
| HMAC | Hashed message authentication code | Keyed-hash message authentication code (RFC 2104) |
| CTM | Counter mode | CTR (NIST SP 800-38A) |
