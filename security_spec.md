# Security Specification: IELTS ZONE Mock Testing Platform

## 1. Data Invariants

1. **User Invariant**: A user profile document ID `{userId}` must strictly equal the authenticated user's `request.auth.uid`. Candidates cannot alter their `role` field.
2. **Booking Invariant**: Offline bookings must have `candidateId == request.auth.uid` during creation. Once confirmed, status can only be modified by the candidate (to cancel) or an authorized examiner/admin.
3. **Test Attempt Invariant**: A mock test attempt must belong to the authenticated candidate (`candidateId == request.auth.uid`). Once `completed` or `graded`, candidates cannot modify submitted answers.
4. **TRF Invariant**: Diagnostic Test Report Forms can only be created and updated by examiners or admins. Candidates have read-only access to their own TRFs where `resource.data.candidateId == request.auth.uid`.
5. **PII Isolation**: Candidate contact numbers, emails, and bookings cannot be listed or inspected by other candidates.
6. **Exam Resource Invariant**: Candidates can only read published exam resource packages (`status == 'published'`). Creation, modification, and deletion are restricted strictly to authorized staff/administrators. Candidate packages must never contain embedded answer keys at root or inside question definitions.
7. **Answer Key Invariant**: Answer keys in `/exam_answer_keys/{keyId}` are strictly confidential. Candidates and unauthenticated users receive PERMISSION_DENIED on any read or write attempt. Only authorized administrators and examiners can access answer keys.
8. **Storage Resource Invariant**: Candidate audio media requests require the referenced exam package in Cloud Firestore to be in `status == 'published'`. Storage rules strictly deny read access to draft media and answer keys.

---

## 2. Dirty Dozen Payloads (All must return PERMISSION_DENIED)

1. **Payload 1 (Ghost Field Injection)**: Creating a user document with unauthorized fields like `{ role: 'admin', isSuperuser: true }`.
2. **Payload 2 (User Identity Spoofing)**: Creating a user profile at `/users/attacker_uid` with `{ id: 'victim_uid', email: 'victim@example.com' }`.
3. **Payload 3 (Unauthenticated Read)**: Reading candidate documents or bookings without an active `request.auth` session.
4. **Payload 4 (Booking Identity Hijack)**: Creating a booking at `/bookings/b1` with `candidateId: 'victim_uid'`.
5. **Payload 5 (Cross-Candidate Booking Inspection)**: Candidate A querying or reading candidate B's booking record at `/bookings/b_other`.
6. **Payload 6 (Attempt Tampering After Completion)**: Candidate updating their answers after the attempt status is `completed` or `graded`.
7. **Payload 7 (Fake TRF Generation by Student)**: Candidate creating a fraudulent TRF with `overallBand: 9.0` directly from the client.
8. **Payload 8 (Oversized ID Resource Poisoning)**: Writing to `/bookings/{id}` where `{id}` is a 10KB string violating `isValidId()`.
9. **Payload 9 (Oversized Field Denial of Wallet)**: Submitting feedback strings exceeding 4000 characters.
10. **Payload 10 (Client Query Scrape)**: An authenticated candidate attempting to `list` all `/users` without filtering to their own profile.
11. **Payload 11 (Cross-Candidate TRF Leak)**: Candidate querying or reading other students' TRFs.
12. **Payload 12 (Self-Assigned Admin Escalation)**: Modifying `/users/{uid}` to elevate `role` from `'candidate'` to `'admin'`.
13. **Payload 13 (Draft Resource Exfiltration)**: Candidate requesting `/exam_resources/{id}` where `status == 'draft'`.
14. **Payload 14 (Confidential Answer Key Query)**: Candidate requesting `/exam_answer_keys/{packageId}`.
15. **Payload 15 (Question-Level Key Injection)**: Admin importing raw questions with `{ prompt: '...', correctAnswer: 'xyz' }` without deep cleaning.

---

## 3. Phase 2C-1.1 Security Audit Matrix

| Resource Category | Candidate Access | Examiner Access | Administrator Access | Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Draft Resources** (`exam_resources`) | **DENIED** | Read / Review | Full Control (CRUD) | `firestore.rules` (`status == 'published'`) |
| **Published Resources** (`exam_resources`) | **Read-Only** | Read / Review | Full Control (CRUD) | `firestore.rules` (`isValidExamResource`) |
| **Answer Keys** (`exam_answer_keys`) | **DENIED** | Read-Only | Read & Write | `firestore.rules` (`isStaff()` / `isAdmin()`) |
| **Draft Storage Audio** (`/exam_resources/drafts/*`) | **DENIED** | Read / Review | Full Control | `storage.rules` (`isStaff()`) |
| **Published Storage Audio** (`/exam_resources/{pkg}/*`) | **Read-Only** (Published only) | Read / Review | Full Control | `storage.rules` cross-service `firestore.get()` |
| **Answer Key Storage** (`/exam_answer_keys/*`) | **DENIED** | Read-Only | Full Control | `storage.rules` (`isStaff()`) |
| **Session Assignment** (`assignedSessions`) | **Read-Only** (Published only) | Read / Review | Full Control | `assignPackageToSessionExclusively` + rules |
| **Candidate Attempts** (`test_attempts`) | Own Attempts (Read / Create / Finish) | Grade / Review | Full Control | `candidateId == request.auth.uid` + `in_progress` lock |
| **Diagnostic TRFs** (`diagnostic_trfs`) | Own TRFs (Read-Only) | Issue / Update | Full Control | `isStaff()` write + `candidateId` read |
