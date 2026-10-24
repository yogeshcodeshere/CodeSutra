"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3002";
const NAMASTE_SYSTEM = "https://namaste.ayush.gov.in/fhir/CodeSystem/namaste";
const TM2_SYSTEM = "https://id.who.int/icd/release/11/tm2";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function codingLabel(coding) {
  return `${coding.code}${coding.display ? ` \u2014 ${coding.display}` : ""}`;
}

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("codesutra-theme");
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("codesutra-theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, setDark];
}

function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function Nav({ onPlaygroundClick, onAdminClick, dark, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 shadow-sm backdrop-blur dark:bg-gray-950/95 dark:shadow-black/20" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-900 text-sm font-semibold tracking-tight text-white dark:bg-gray-100 dark:text-gray-900">
            C
          </div>
          <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">CodeSutra</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <button onClick={() => document.getElementById("problem")?.scrollIntoView({ behavior: "smooth" })} className="text-gray-500 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">
            Problem
          </button>
          <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="text-gray-500 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">
            Features
          </button>
          <button onClick={onPlaygroundClick} className="text-gray-500 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">
            Playground
          </button>
          <button onClick={onAdminClick} className="font-medium text-teal-700 hover:text-teal-800 transition-colors dark:text-teal-400 dark:hover:text-teal-300">
            Admin Console
          </button>
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
          <a href={`${API_BASE}/docs`} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-900">
            API Docs
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="flex min-h-screen flex-col justify-center px-6 pt-24 pb-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-teal-700 dark:text-teal-400">
            FHIR R4 Terminology Microservice &amp; Clinical Bridge
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-50 sm:text-6xl">
            Bridge Traditional Medicine with Modern Clinical Coding
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-500 dark:text-gray-400">
            CodeSutra dual-codes NAMASTE traditional medicine terms with ICD-11 TM2 concepts,
            enabling Ayurveda, Siddha, and Unani practitioners to document diagnoses
            in a globally interoperable FHIR R4 format.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <button
              onClick={() => document.getElementById("playground")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
            >
              Try the Demo
            </button>
            <button
              onClick={() => document.getElementById("admin")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-md bg-teal-700 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-teal-800 transition-colors dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              Open Admin Console
            </button>
            <a
              href={`${API_BASE}/docs`}
              className="rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-900"
            >
              Explore API Docs
            </a>
          </div>
        </div>
        <div className="mt-20 grid grid-cols-3 gap-8 border-t border-gray-100 pt-10 dark:border-gray-800">
          {[
            { label: "NAMASTE Concepts", value: "100+" },
            { label: "ICD-11 TM2 Mappings", value: "100+" },
            { label: "FHIR R4 Compliant", value: "Yes" }
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section id="problem" className="bg-gray-50 px-6 py-24 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-teal-700 dark:text-teal-400">The Challenge</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Traditional medicine lacks a standard clinical vocabulary
            </h2>
            <p className="mt-5 leading-relaxed text-gray-600 dark:text-gray-400">
              India&apos;s AYUSH systems (Ayurveda, Siddha, Unani) use the NAMASTE terminology,
              while global health records rely on ICD-11. Without a bridge between these
              vocabularies, traditional medicine practitioners cannot participate in
              interoperable digital health ecosystems.
            </p>
            <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
              CodeSutra solves this by providing a FHIR R4 terminology server that maps
              NAMASTE concepts to ICD-11 Traditional Medicine (TM2) codes, enabling
              dual-coded clinical documentation that satisfies both local practice
              and international standards.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">How it works</h3>
            <div className="mt-6 grid gap-6">
              {[
                { step: "01", title: "Ingest", desc: "100+ NAMASTE traditional medicine terms loaded across Ayurveda, Siddha, and Unani." },
                { step: "02", title: "Map", desc: "Each term is linked to the corresponding ICD-11 TM2 concept via curated mappings." },
                { step: "03", title: "Serve", desc: "A FHIR R4 API exposes CodeSystems, ConceptMaps, and terminology operations." },
                { step: "04", title: "Administer", desc: "Admins manage roles of doctors and patients, and expand terminology mappings directly." }
              ].map((item) => (
                <div className="flex gap-4" key={item.step}>
                  <span className="mt-0.5 text-sm font-bold text-teal-700 dark:text-teal-400">{item.step}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      title: "FHIR R4 Terminology Server",
      desc: "Full CodeSystem and ConceptMap resources for 100+ NAMASTE and ICD-11 TM2 terms, served with correct application/fhir+json content type."
    },
    {
      title: "Dual-Coded Problem List",
      desc: "Append-only, versioned clinical Problem List with consent tracking and audit logging. Each entry carries both NAMASTE and TM2 codes."
    },
    {
      title: "Terminology Operations",
      desc: "$expand for autocomplete search, $lookup for code details, and $translate for NAMASTE-to-TM2 mapping lookups."
    },
    {
      title: "Role & User Governance",
      desc: "Manage roles of Doctors (Clinicians) and Patients, with ISO 22600-style permissions. Dedicated Admin Console to create custom mappings."
    }
  ];

  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-teal-700 dark:text-teal-400">Capabilities</p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Everything you need for dual coding</h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Engineered for high-integrity AYUSH clinical practice and international reporting.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} className="rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 h-8 w-8 rounded bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-700 dark:text-teal-400 font-semibold text-sm">
                ✓
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Playground({ token, setToken, role, setRole, abhaId, setAbhaId, facilityId, setFacilityId }) {
  const [query, setQuery] = useState("fever");
  const [results, setResults] = useState([]);
  const [translations, setTranslations] = useState({});
  const [selected, setSelected] = useState(null);
  const [patientId, setPatientId] = useState("patient-demo-001");
  const [problemList, setProblemList] = useState(null);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [status, setStatus] = useState("");

  const isClinician = role === "CLINICIAN";
  const namasteResults = useMemo(() => results.filter((item) => item.system === NAMASTE_SYSTEM), [results]);
  const tm2Results = useMemo(() => results.filter((item) => item.system === TM2_SYSTEM), [results]);

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
        ...(options.headers || {})
      }
    });
    const body = await response.json();
    if (!response.ok) {
      const message = body.issue?.[0]?.diagnostics || `HTTP ${response.status}`;
      throw new Error(message);
    }
    return body;
  }

  async function getToken() {
    setStatus("Getting demo token...");
    try {
      const response = await fetch(`${API_BASE}/auth/mock-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abhaId, role, facilityId })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.issue?.[0]?.diagnostics || "Token request failed");
      }
      setToken(body.accessToken);
      setStatus(`Signed in as ${role} (${abhaId})`);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  async function search() {
    setStatus("Searching terminology...");
    try {
      const body = await request(`/fhir/ValueSet/$expand?filter=${encodeURIComponent(query)}&count=20`);
      const contains = body.expansion?.contains || [];
      setResults(contains);
      setTranslations({});
      const namaste = contains.filter((item) => item.system === NAMASTE_SYSTEM);
      const translatedEntries = await Promise.all(
        namaste.map(async (item) => {
          try {
            return [item.code, await translate(item.code)];
          } catch {
            return [item.code, null];
          }
        })
      );
      setTranslations(Object.fromEntries(translatedEntries));
      setStatus(`Found ${body.expansion?.total || contains.length} results`);
    } catch (err) {
      setStatus(`Search failed: ${err.message}`);
    }
  }

  async function translate(code) {
    const body = await request("/fhir/ConceptMap/$translate", {
      method: "POST",
      body: JSON.stringify({
        system: NAMASTE_SYSTEM,
        code,
        targetSystem: TM2_SYSTEM
      })
    });
    const match = body.parameter?.find((param) => param.name === "match");
    const concept = match?.part?.find((param) => param.name === "concept")?.valueCoding;
    const equivalence = match?.part?.find((param) => param.name === "equivalence")?.valueCode;
    return concept ? { ...concept, equivalence } : null;
  }

  async function loadProblemList() {
    setStatus("Loading problem list...");
    try {
      const body = await request(`/fhir/Patient/${encodeURIComponent(patientId)}/ProblemList${includeHistory ? "?includeHistory=true" : ""}`);
      setProblemList(body);
      const count = body.entry?.length || 0;
      setStatus(`Loaded ${count} condition${count === 1 ? "" : "s"}`);
    } catch (err) {
      setStatus(`Load failed: ${err.message}`);
    }
  }

  async function submitCondition() {
    if (!selected) return;
    setStatus("Submitting condition bundle...");
    const translation = translations[selected.code];
    const codings = [
      {
        system: NAMASTE_SYSTEM,
        code: selected.code,
        display: selected.display
      }
    ];
    if (translation) {
      codings.push({
        system: TM2_SYSTEM,
        code: translation.code,
        display: translation.display
      });
    }

    const bundle = {
      resourceType: "Bundle",
      type: "transaction",
      entry: [
        {
          fullUrl: "urn:uuid:condition-1",
          resource: {
            resourceType: "Condition",
            clinicalStatus: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
                  code: "active"
                }
              ]
            },
            subject: {
              reference: `Patient/${patientId}`
            },
            code: {
              coding: codings,
              text: selected.display
            },
            recordedDate: new Date().toISOString(),
            recorder: {
              reference: `Practitioner/${abhaId}`
            },
            extension: [
              {
                url: "https://codesutra.ayush.gov.in/fhir/StructureDefinition/consent-id",
                valueString: "consent-demo-1"
              }
            ]
          },
          request: {
            method: "POST",
            url: "Condition"
          }
        }
      ]
    };

    try {
      await request("/fhir/Bundle", {
        method: "POST",
        body: JSON.stringify(bundle)
      });
      setStatus("Condition saved to Problem List");
      await loadProblemList();
    } catch (err) {
      setStatus(`Save failed: ${err.message}`);
    }
  }

  const cardClass = "rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950";
  const inputClass = "mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-600 dark:focus:ring-gray-700";
  const labelClass = "text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400";
  const primaryBtn = "w-full rounded-md bg-gray-900 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300";
  const secondaryBtn = "w-full rounded-md border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-900";

  return (
    <section id="playground" className="bg-gray-50 px-6 py-24 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-teal-700 dark:text-teal-400">Interactive Demo</p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Test the API live</h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Explore 100+ NAMASTE terms, view ICD-11 TM2 mappings, and submit dual-coded conditions to a Problem List.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[340px_1fr]">
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Authentication</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${token ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                {token ? "Authenticated" : "No Token"}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Demo JWT token (ABHA mock OAuth2)</p>

            <div className="mt-4">
              <label className={labelClass}>Quick Profile Select</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { name: "Dr. Sharma", role: "CLINICIAN", abha: "clinician-demo", fac: "facility-001" },
                  { name: "Dr. Iyer", role: "CLINICIAN", abha: "clinician-siddha", fac: "facility-002" },
                  { name: "Dr. Tariq", role: "CLINICIAN", abha: "clinician-unani", fac: "facility-003" },
                  { name: "Aarav (Patient)", role: "PATIENT", abha: "patient-demo-001", fac: "facility-001" },
                  { name: "Admin Lead", role: "ADMIN", abha: "admin-demo", fac: "facility-001" }
                ].map((p) => (
                  <button
                    key={p.abha}
                    onClick={() => {
                      setRole(p.role);
                      setAbhaId(p.abha);
                      setFacilityId(p.fac);
                    }}
                    className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div>
                <label className={labelClass}>Role (Coder role removed)</label>
                <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="CLINICIAN">Doctor / Clinician (CLINICIAN)</option>
                  <option value="PATIENT">Patient (PATIENT)</option>
                  <option value="ADMIN">System Administrator (ADMIN)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>ABHA ID</label>
                <input className={inputClass} value={abhaId} onChange={(e) => setAbhaId(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Facility</label>
                <input className={inputClass} value={facilityId} onChange={(e) => setFacilityId(e.target.value)} />
              </div>
              <button className={primaryBtn} onClick={getToken}>
                Get Demo Token
              </button>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Patient Problem List</h3>
              <div className="mt-3 grid gap-3">
                <div>
                  <label className={labelClass}>Patient ABHA ID</label>
                  <input className={inputClass} value={patientId} onChange={(e) => setPatientId(e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-gray-900 shadow-sm focus:ring-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-gray-700"
                    checked={includeHistory}
                    onChange={(e) => setIncludeHistory(e.target.checked)}
                  />
                  Include version history
                </label>
                <button className={secondaryBtn} onClick={loadProblemList}>
                  Load Problem List
                </button>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
              <div className="rounded-md bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                {status || "Ready"}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className={cardClass}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className={`min-w-0 flex-1 ${inputClass} mt-0`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") search();
                  }}
                  placeholder="Search 100+ terms (e.g. fever, Jwara, Prameha, asthma, cough)..."
                />
                <button className={`${primaryBtn} px-5 sm:w-auto`} onClick={search}>
                  Search $expand
                </button>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    NAMASTE Terms ({namasteResults.length})
                  </h4>
                  <div className="mt-3 max-h-72 overflow-y-auto pr-1">
                    {namasteResults.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500">No NAMASTE concepts found</p>
                    ) : (
                      namasteResults.map((item) => {
                        const isSel = selected?.code === item.code;
                        return (
                          <div
                            key={item.code}
                            onClick={() => setSelected(item)}
                            className={`mb-2 cursor-pointer rounded-lg border p-3 transition-colors ${
                              isSel
                                ? "border-teal-700 bg-teal-50/50 dark:border-teal-500 dark:bg-teal-950/30"
                                : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-400">{item.code}</span>
                              <span className="text-xs text-gray-400">{translations[item.code] ? "Mapped" : "Unmapped"}</span>
                            </div>
                            <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">{item.display}</p>
                            {translations[item.code] && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                → {translations[item.code].code} ({translations[item.code].display})
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    ICD-11 Concepts ({tm2Results.length})
                  </h4>
                  <div className="mt-3 max-h-72 overflow-y-auto pr-1">
                    {tm2Results.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500">No direct ICD-11 search matches</p>
                    ) : (
                      tm2Results.map((item) => (
                        <div key={item.code} className="mb-2 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                          <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{item.code}</span>
                          <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">{item.display}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {selected && (
                <div className="mt-6 rounded-lg border border-teal-200 bg-teal-50/40 p-4 dark:border-teal-900/50 dark:bg-teal-950/20">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-teal-800 dark:text-teal-400">Selected for Dual Coding</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {selected.code} &mdash; {selected.display}
                      </p>
                      {translations[selected.code] && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          TM2 Concept: <span className="font-mono">{translations[selected.code].code}</span> ({translations[selected.code].display})
                        </p>
                      )}
                    </div>
                    <button
                      disabled={!isClinician}
                      onClick={submitCondition}
                      className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-800 transition-colors disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500"
                    >
                      {isClinician ? "Record Condition (FHIR Bundle)" : "Clinician Role Required to Write"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ProblemList bundle={problemList} />
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminConsole({ token, onSelectUser }) {
  const [tab, setTab] = useState("mappings"); // "mappings" | "users" | "system"
  const [mappings, setMappings] = useState([]);
  const [mappingTotal, setMappingTotal] = useState(0);
  const [mappingFilter, setMappingFilter] = useState("");
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // New mapping form state
  const [newNamasteCode, setNewNamasteCode] = useState("");
  const [newNamasteDisplay, setNewNamasteDisplay] = useState("");
  const [newNamasteCat, setNewNamasteCat] = useState("ayurveda");
  const [newTm2Code, setNewTm2Code] = useState("");
  const [newTm2Title, setNewTm2Title] = useState("");
  const [newEquivalence, setNewEquivalence] = useState("equivalent");
  const [newConfidence, setNewConfidence] = useState(0.85);
  const [newNotes, setNewNotes] = useState("");

  // New user form state
  const [newAbhaId, setNewAbhaId] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("CLINICIAN");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newFacility, setNewFacility] = useState("facility-001");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  async function adminFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
        ...(options.headers || {})
      }
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.issue?.[0]?.diagnostics || body.message || `HTTP ${res.status}`);
    }
    return body;
  }

  async function loadMappings() {
    setLoading(true);
    try {
      const data = await adminFetch(`/admin/mappings?filter=${encodeURIComponent(mappingFilter)}&limit=100`);
      setMappings(data.mappings || []);
      setMappingTotal(data.total || 0);
      setStatus(`Loaded ${data.mappings.length} of ${data.total} mappings`);
    } catch (err) {
      setStatus(`Error loading mappings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await adminFetch(`/admin/users?query=${encodeURIComponent(userQuery)}`);
      setUsers(data.users || []);
      setStatus(`Loaded ${data.users.length} users`);
    } catch (err) {
      setStatus(`Error loading users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      if (tab === "mappings") loadMappings();
      if (tab === "users") loadUsers();
    }
  }, [token, tab]);

  async function handleAddMapping(e) {
    e.preventDefault();
    if (!newNamasteCode || !newTm2Code) {
      setStatus("Please provide both NAMASTE code and TM2 code.");
      return;
    }
    setStatus("Adding mapping...");
    try {
      await adminFetch("/admin/mappings", {
        method: "POST",
        body: JSON.stringify({
          namasteCode: newNamasteCode.trim(),
          tm2Code: newTm2Code.trim(),
          namasteDisplay: newNamasteDisplay.trim() || undefined,
          namasteCategory: newNamasteCat,
          tm2Title: newTm2Title.trim() || undefined,
          equivalence: newEquivalence,
          confidence: parseFloat(newConfidence),
          notes: newNotes.trim() || undefined,
          reviewedBy: "admin"
        })
      });
      setStatus(`Successfully added mapping ${newNamasteCode} → ${newTm2Code}`);
      setNewNamasteCode("");
      setNewNamasteDisplay("");
      setNewTm2Code("");
      setNewTm2Title("");
      setNewNotes("");
      await loadMappings();
    } catch (err) {
      setStatus(`Failed to add mapping: ${err.message}`);
    }
  }

  async function handleDeleteMapping(id) {
    if (!confirm("Are you sure you want to delete this mapping?")) return;
    setStatus("Deleting mapping...");
    try {
      await adminFetch(`/admin/mappings/${id}`, { method: "DELETE" });
      setStatus("Mapping deleted successfully.");
      await loadMappings();
    } catch (err) {
      setStatus(`Delete failed: ${err.message}`);
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    if (!newAbhaId || !newName) {
      setStatus("Please provide ABHA ID and Name.");
      return;
    }
    setStatus("Creating user...");
    try {
      await adminFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          abhaId: newAbhaId.trim(),
          name: newName.trim(),
          role: newRole,
          specialty: newSpecialty.trim() || undefined,
          facilityId: newFacility.trim() || undefined,
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined
        })
      });
      setStatus(`Successfully created ${newRole}: ${newName}`);
      setNewAbhaId("");
      setNewName("");
      setNewSpecialty("");
      setNewEmail("");
      setNewPhone("");
      await loadUsers();
    } catch (err) {
      setStatus(`Failed to create user: ${err.message}`);
    }
  }

  async function handleUpdateRole(abhaId, role) {
    setStatus(`Updating role of ${abhaId} to ${role}...`);
    try {
      await adminFetch(`/admin/users/${encodeURIComponent(abhaId)}`, {
        method: "PUT",
        body: JSON.stringify({ role })
      });
      setStatus(`Updated role of ${abhaId} to ${role}`);
      await loadUsers();
    } catch (err) {
      setStatus(`Role update failed: ${err.message}`);
    }
  }

  async function handleDeleteUser(abhaId) {
    if (!confirm(`Delete user ${abhaId}?`)) return;
    setStatus(`Deleting user ${abhaId}...`);
    try {
      await adminFetch(`/admin/users/${encodeURIComponent(abhaId)}`, { method: "DELETE" });
      setStatus(`User ${abhaId} deleted.`);
      await loadUsers();
    } catch (err) {
      setStatus(`Failed to delete user: ${err.message}`);
    }
  }

  async function handleDemoReset() {
    if (!confirm("Reseed all demo data (100 NAMASTE concepts, 104 ICD-11 concepts, 100 mappings, and demo users)?")) return;
    setStatus("Resetting and reseeding demo data...");
    try {
      await adminFetch("/admin/demo-reset", { method: "POST" });
      setStatus("Demo data successfully reseeded!");
      if (tab === "mappings") await loadMappings();
      if (tab === "users") await loadUsers();
    } catch (err) {
      setStatus(`Demo reset failed: ${err.message}`);
    }
  }

  const cardClass = "rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950";
  const inputClass = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-600 dark:focus:ring-gray-700";
  const labelClass = "text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400";
  const submitBtn = "rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-800 transition-colors dark:bg-teal-600 dark:hover:bg-teal-500";

  return (
    <section id="admin" className="px-6 py-24 border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-teal-700 dark:text-teal-400">
              Administrative Control Center
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Manage Terminology Mappings &amp; Roles
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
              Create new NAMASTE to ICD-11 mappings and manage Doctor and Patient roles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("mappings")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "mappings"
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              Terminology Mappings ({mappingTotal || 100})
            </button>
            <button
              onClick={() => setTab("users")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "users"
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              Doctors &amp; Patients ({users.length || 7})
            </button>
            <button
              onClick={() => setTab("system")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "system"
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              System Operations
            </button>
          </div>
        </div>

        {status && (
          <div className="mt-4 rounded-md bg-teal-50 border border-teal-200 px-4 py-2.5 text-xs font-mono text-teal-800 dark:bg-teal-950/40 dark:border-teal-900 dark:text-teal-300">
            {status}
          </div>
        )}

        {/* TAB 1: MAPPINGS */}
        {tab === "mappings" && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
            {/* Add Mapping Form */}
            <div className={cardClass}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Add NAMASTE &rarr; ICD Mapping</h3>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Create custom clinical mappings from traditional medicine concepts to ICD-11 TM2.
              </p>

              <form onSubmit={handleAddMapping} className="mt-5 grid gap-3">
                <div>
                  <label className={labelClass}>NAMASTE Code *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. NAM101"
                    value={newNamasteCode}
                    onChange={(e) => setNewNamasteCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Concept Display Term</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Tamaka Shwasa"
                    value={newNamasteDisplay}
                    onChange={(e) => setNewNamasteDisplay(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>AYUSH System</label>
                  <select className={inputClass} value={newNamasteCat} onChange={(e) => setNewNamasteCat(e.target.value)}>
                    <option value="ayurveda">Ayurveda</option>
                    <option value="siddha">Siddha</option>
                    <option value="unani">Unani</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>ICD-11 TM2 / Bio Code *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. TM2-005 or CA23"
                    value={newTm2Code}
                    onChange={(e) => setNewTm2Code(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>ICD Title</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Dyspnea and breathing disorder pattern"
                    value={newTm2Title}
                    onChange={(e) => setNewTm2Title(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Equivalence</label>
                    <select className={inputClass} value={newEquivalence} onChange={(e) => setNewEquivalence(e.target.value)}>
                      <option value="equivalent">equivalent</option>
                      <option value="wider">wider</option>
                      <option value="narrower">narrower</option>
                      <option value="relatedto">relatedto</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Confidence ({newConfidence})</label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      className="mt-3 w-full"
                      value={newConfidence}
                      onChange={(e) => setNewConfidence(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Clinical Review Notes</label>
                  <textarea
                    className={`${inputClass} h-16`}
                    placeholder="Clinical equivalence rationale..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
                <button type="submit" className={`mt-2 ${submitBtn}`}>
                  Save Concept Mapping
                </button>
              </form>
            </div>

            {/* Mappings Table */}
            <div className={cardClass}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Configured Mappings</h3>
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                    {mappingTotal} Total
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    className={`${inputClass} w-64`}
                    placeholder="Filter by code or text..."
                    value={mappingFilter}
                    onChange={(e) => setMappingFilter(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadMappings();
                    }}
                  />
                  <button onClick={loadMappings} className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium dark:border-gray-700">
                    Filter
                  </button>
                </div>
              </div>

              <div className="mt-4 max-h-[560px] overflow-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-gray-950">
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:text-gray-500">
                      <th className="pb-2 pr-3 font-semibold">NAMASTE</th>
                      <th className="pb-2 pr-3 font-semibold">Category</th>
                      <th className="pb-2 pr-3 font-semibold">ICD-11 Target</th>
                      <th className="pb-2 pr-3 font-semibold">Equivalence</th>
                      <th className="pb-2 pr-3 font-semibold">Score</th>
                      <th className="pb-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-400">
                          {loading ? "Loading mappings..." : "No mappings found."}
                        </td>
                      </tr>
                    ) : (
                      mappings.map((m) => (
                        <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="py-2.5 pr-3">
                            <span className="font-mono font-medium text-teal-700 dark:text-teal-400">{m.namasteCode}</span>
                            <p className="text-xs text-gray-600 dark:text-gray-300">{m.namasteDisplay || m.namasteCode}</p>
                          </td>
                          <td className="py-2.5 pr-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                m.namasteCategory === "ayurveda"
                                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                                  : m.namasteCategory === "siddha"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {m.namasteCategory || "ayurveda"}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{m.tm2Code}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{m.tm2Title || m.tm2Code}</p>
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {m.equivalence}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-xs font-mono text-gray-600 dark:text-gray-400">
                            {(m.confidence * 100).toFixed(0)}%
                          </td>
                          <td className="py-2.5">
                            <button
                              onClick={() => handleDeleteMapping(m.id)}
                              className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCTOR & PATIENT ROLES */}
        {tab === "users" && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
            {/* Register User Form */}
            <div className={cardClass}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Register Doctor or Patient</h3>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Add doctors and patients with specific roles and institutional facilities.
              </p>

              <form onSubmit={handleAddUser} className="mt-5 grid gap-3">
                <div>
                  <label className={labelClass}>ABHA ID *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. dr-kulkarni-ayush or patient-042"
                    value={newAbhaId}
                    onChange={(e) => setNewAbhaId(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Dr. Ramesh Kulkarni"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Role (Coder removed)</label>
                  <select className={inputClass} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                    <option value="CLINICIAN">Doctor / Clinician (CLINICIAN)</option>
                    <option value="PATIENT">Patient (PATIENT)</option>
                    <option value="ADMIN">Administrator (ADMIN)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Specialty / Department</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Kayachikitsa / General Medicine"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Facility Identifier</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. facility-001"
                    value={newFacility}
                    onChange={(e) => setNewFacility(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="e.g. ramesh@hospital.org"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. +91-9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
                <button type="submit" className={`mt-2 ${submitBtn}`}>
                  Register User
                </button>
              </form>
            </div>

            {/* Users Roster Table */}
            <div className={cardClass}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Registered Doctors &amp; Patients</h3>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {users.length} Active
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    className={`${inputClass} w-56`}
                    placeholder="Search name or ABHA..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadUsers();
                    }}
                  />
                  <button onClick={loadUsers} className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium dark:border-gray-700">
                    Search
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:text-gray-500">
                      <th className="pb-2 pr-3 font-semibold">User / Name</th>
                      <th className="pb-2 pr-3 font-semibold">ABHA ID</th>
                      <th className="pb-2 pr-3 font-semibold">Role</th>
                      <th className="pb-2 pr-3 font-semibold">Specialty / Facility</th>
                      <th className="pb-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-400">
                          {loading ? "Loading users..." : "No users found."}
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="py-3 pr-3 font-medium text-gray-900 dark:text-gray-100">
                            {u.name}
                            {u.email && <p className="text-xs font-normal text-gray-400">{u.email}</p>}
                          </td>
                          <td className="py-3 pr-3 font-mono text-xs text-gray-600 dark:text-gray-400">{u.abhaId}</td>
                          <td className="py-3 pr-3">
                            <select
                              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.abhaId, e.target.value)}
                            >
                              <option value="CLINICIAN">Doctor (CLINICIAN)</option>
                              <option value="PATIENT">Patient (PATIENT)</option>
                              <option value="ADMIN">Admin (ADMIN)</option>
                            </select>
                          </td>
                          <td className="py-3 pr-3 text-xs text-gray-500 dark:text-gray-400">
                            <p>{u.specialty || (u.role === "PATIENT" ? "Patient Record" : "General")}</p>
                            <p className="text-[10px] text-gray-400">{u.facilityId || "facility-001"}</p>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  onSelectUser(u);
                                  document.getElementById("playground")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="rounded bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300 dark:hover:bg-teal-900"
                              >
                                Sign in as
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.abhaId)}
                                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM OPERATIONS */}
        {tab === "system" && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className={cardClass}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Reseed Terminology Demo Data</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Re-ingests the 100 NAMASTE concepts, 104 ICD-11 concepts, 100 mappings, and restores the standard roster of demo doctors and patients.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleDemoReset}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
                >
                  Trigger Database Reseed
                </button>
              </div>
            </div>

            <div className={cardClass}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Live WHO ICD-11 Sync</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Connects to the official WHO ICD API (`id.who.int`) to download the latest release of Chapter 26 Traditional Medicine Module 2.
              </p>
              <div className="mt-6">
                <button
                  onClick={async () => {
                    setStatus("Running live WHO ICD-11 sync...");
                    try {
                      const res = await adminFetch("/admin/sync/icd11?source=sample", { method: "POST" });
                      setStatus(`Sync complete: processed ${res.processed} concepts`);
                    } catch (err) {
                      setStatus(`Sync error: ${err.message}`);
                    }
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900 transition-colors"
                >
                  Run ICD-11 Sync
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProblemList({ bundle }) {
  const entries = bundle?.entry || [];
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Problem List</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400 dark:border-gray-800 dark:text-gray-500">
              <th className="pb-2 pr-4 font-medium">NAMASTE</th>
              <th className="pb-2 pr-4 font-medium">TM2</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 font-medium">Version</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td className="py-6 text-gray-400 dark:text-gray-500" colSpan="4">
                  No entries loaded. Search a term and add it to the Problem List.
                </td>
              </tr>
            )}
            {entries.map(({ resource }) => {
              const codings = resource.code?.coding || [];
              const namaste = codings.find((coding) => coding.system === NAMASTE_SYSTEM);
              const tm2 = codings.find((coding) => coding.system === TM2_SYSTEM);
              const version = resource.extension?.find((item) => item.url.endsWith("/version"))?.valueInteger;
              return (
                <tr className="border-b border-gray-100 text-gray-700 dark:border-gray-800 dark:text-gray-300" key={resource.id}>
                  <td className="py-3 pr-4">{namaste ? codingLabel(namaste) : ""}</td>
                  <td className="py-3 pr-4">{tm2 ? codingLabel(tm2) : ""}</td>
                  <td className="py-3 pr-4">{resource.clinicalStatus?.coding?.[0]?.code}</td>
                  <td className="py-3">{version}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 px-6 py-12 dark:border-gray-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          &copy; {new Date().getFullYear()} CodeSutra. MIT License.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Dual-Coding Traditional Medicine &bull; Ministry of Ayush / AIIA
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  const [dark, setDark] = useTheme();
  const [token, setToken] = useState("");
  const [role, setRole] = useState("CLINICIAN");
  const [abhaId, setAbhaId] = useState("clinician-demo");
  const [facilityId, setFacilityId] = useState("facility-001");

  const handlePlaygroundClick = () => {
    document.getElementById("playground")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAdminClick = () => {
    document.getElementById("admin")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectUser = (u) => {
    setRole(u.role);
    setAbhaId(u.abhaId);
    if (u.facilityId) setFacilityId(u.facilityId);
    setToken("");
  };

  return (
    <>
      <Nav
        dark={dark}
        onToggleTheme={() => setDark(!dark)}
        onPlaygroundClick={handlePlaygroundClick}
        onAdminClick={handleAdminClick}
      />
      <main>
        <Hero />
        <Problem />
        <Features />
        <Playground
          token={token}
          setToken={setToken}
          role={role}
          setRole={setRole}
          abhaId={abhaId}
          setAbhaId={setAbhaId}
          facilityId={facilityId}
          setFacilityId={setFacilityId}
        />
        <AdminConsole token={token} onSelectUser={handleSelectUser} />
        <Footer />
      </main>
    </>
  );
}
