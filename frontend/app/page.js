"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
const NAMASTE_SYSTEM = "https://namaste.ayush.gov.in/fhir/CodeSystem/namaste";
const TM2_SYSTEM = "https://id.who.int/icd/release/11/tm2";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function codingLabel(coding) {
  return `${coding.code}${coding.display ? ` \u2014 ${coding.display}` : ""}`;
}

function Nav({ onPlaygroundClick }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 shadow-sm backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-900 text-sm font-semibold tracking-tight text-white">
            C
          </div>
          <span className="text-lg font-semibold tracking-tight text-gray-900">CodeSutra</span>
        </div>
        <div className="flex items-center gap-8 text-sm">
          <button onClick={() => document.getElementById("problem")?.scrollIntoView({ behavior: "smooth" })} className="text-gray-500 hover:text-gray-900 transition-colors">
            Problem
          </button>
          <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="text-gray-500 hover:text-gray-900 transition-colors">
            Features
          </button>
          <button onClick={onPlaygroundClick} className="text-gray-500 hover:text-gray-900 transition-colors">
            Demo
          </button>
          <a href={`${API_BASE}/docs`} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors">
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
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-teal-700">
            FHIR R4 Terminology Microservice
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900 sm:text-6xl">
            Bridge Traditional Medicine with Modern Clinical Coding
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-500">
            CodeSutra dual-codes NAMASTE traditional medicine terms with ICD-11 TM2 concepts, 
            enabling Ayurveda, Siddha, and Unani practitioners to document diagnoses 
            in a globally interoperable FHIR R4 format.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <button
              onClick={() => document.getElementById("playground")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors"
            >
              Try the Demo
            </button>
            <a
              href={`${API_BASE}/docs`}
              className="rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              Explore API
            </a>
          </div>
        </div>
        <div className="mt-20 grid grid-cols-3 gap-8 border-t border-gray-100 pt-10">
          {[
            { label: "NAMASTE Concepts", value: "5+" },
            { label: "ICD-11 TM2 Mappings", value: "5+" },
            { label: "FHIR R4 Compliant", value: "Yes" }
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section id="problem" className="bg-gray-50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-teal-700">The Challenge</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Traditional medicine lacks a standard clinical vocabulary
            </h2>
            <p className="mt-5 leading-relaxed text-gray-600">
              India&apos;s AYUSH systems (Ayurveda, Siddha, Unani) use the NAMASTE terminology, 
              while global health records rely on ICD-11. Without a bridge between these 
              vocabularies, traditional medicine practitioners cannot participate in 
              interoperable digital health ecosystems.
            </p>
            <p className="mt-4 leading-relaxed text-gray-600">
              CodeSutra solves this by providing a FHIR R4 terminology server that maps 
              NAMASTE concepts to ICD-11 Traditional Medicine (TM2) codes, enabling 
              dual-coded clinical documentation that satisfies both local practice 
              and international standards.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">How it works</h3>
            <div className="mt-6 grid gap-6">
              {[
                { step: "01", title: "Ingest", desc: "NAMASTE traditional medicine terms are loaded from structured CSV data." },
                { step: "02", title: "Map", desc: "Each term is linked to the corresponding ICD-11 TM2 concept via curated mappings." },
                { step: "03", title: "Serve", desc: "A FHIR R4 API exposes CodeSystems, ConceptMaps, and terminology operations." },
                { step: "04", title: "Document", desc: "Clinicians submit dual-coded Conditions to a versioned Problem List." }
              ].map((item) => (
                <div className="flex gap-4" key={item.step}>
                  <span className="mt-0.5 text-sm font-bold text-teal-700">{item.step}</span>
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{item.desc}</p>
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
      desc: "Full CodeSystem and ConceptMap resources for NAMASTE and ICD-11 TM2, served with correct application/fhir+json content type."
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
      title: "Role-Based Access Control",
      desc: "Clinician, Coder, Patient, and Admin roles with ISO 22600-style permissions. JWT-based authentication ready for ABHA OAuth2 integration."
    }
  ];

  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-teal-700">Capabilities</p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Everything you need for dual coding</h2>
          <p className="mt-4 text-gray-500">
            Built as a hackathon prototype, designed for production-grade terminology management.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} className="rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 h-8 w-8 rounded bg-gray-100" />
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Playground() {
  const [role, setRole] = useState("CLINICIAN");
  const [abhaId, setAbhaId] = useState("clinician-demo");
  const [facilityId, setFacilityId] = useState("facility-001");
  const [token, setToken] = useState("");
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
    setStatus(`Signed in as ${role}`);
  }

  async function search() {
    setStatus("Searching terminology...");
    const body = await request(`/fhir/ValueSet/$expand?filter=${encodeURIComponent(query)}&count=20`);
    const contains = body.expansion.contains || [];
    setResults(contains);
    setTranslations({});
    const namaste = contains.filter((item) => item.system === NAMASTE_SYSTEM);
    const translatedEntries = await Promise.all(
      namaste.map(async (item) => {
        try { return [item.code, await translate(item.code)]; }
        catch { return [item.code, null]; }
      })
    );
    setTranslations(Object.fromEntries(translatedEntries));
    setStatus(`Found ${body.expansion.total} result${body.expansion.total === 1 ? "" : "s"}`);
  }

  async function translate(code) {
    const body = await request("/fhir/ConceptMap/$translate", {
      method: "POST",
      body: JSON.stringify({ system: NAMASTE_SYSTEM, code, targetSystem: TM2_SYSTEM })
    });
    const match = body.parameter?.find((parameter) => parameter.name === "match");
    return match?.part?.find((part) => part.name === "concept")?.valueCoding || null;
  }

  async function addToProblemList(item) {
    setStatus("Preparing dual-coded Bundle...");
    const tm2Coding = await translate(item.code);
    const bundle = {
      resourceType: "Bundle",
      type: "transaction",
      entry: [
        {
          resource: {
            resourceType: "Condition",
            subject: { reference: `Patient/${patientId}` },
            clinicalStatus: {
              coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }]
            },
            code: {
              text: item.display,
              coding: [{ system: NAMASTE_SYSTEM, code: item.code, display: item.display }]
            }
          }
        },
        {
          resource: {
            resourceType: "Consent",
            id: `consent-${patientId}`,
            status: "active"
          }
        }
      ]
    };
    await request("/fhir/Bundle", {
      method: "POST",
      body: JSON.stringify(bundle)
    });
    setSelected({ namaste: item, tm2: tm2Coding });
    setStatus(`Added ${item.code}${tm2Coding ? ` with ${tm2Coding.code}` : ""}`);
    await loadProblemList();
  }

  async function loadProblemList() {
    setStatus("Loading Problem List...");
    const history = includeHistory ? "?includeHistory=true" : "";
    const body = await request(`/fhir/Patient/${encodeURIComponent(patientId)}/ProblemList${history}`);
    setProblemList(body);
    setStatus(`Loaded ${body.total} Problem List entr${body.total === 1 ? "y" : "ies"}`);
  }

  return (
    <section id="playground" className="bg-gray-50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-teal-700">Interactive Demo</p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Test the API live</h2>
          <p className="mt-4 text-gray-500">
            Explore NAMASTE terms, view ICD-11 TM2 mappings, and submit dual-coded conditions to a Problem List.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">Authentication</h3>
            <p className="mt-1 text-xs text-gray-400">Demo JWT token (mock OAuth2)</p>
            <div className="mt-5 grid gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Role</label>
                <select className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option>CLINICIAN</option>
                  <option>CODER</option>
                  <option>PATIENT</option>
                  <option>ADMIN</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">ABHA ID</label>
                <input className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300" value={abhaId} onChange={(e) => setAbhaId(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Facility</label>
                <input className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300" value={facilityId} onChange={(e) => setFacilityId(e.target.value)} />
              </div>
              <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors" onClick={getToken}>
                Get Demo Token
              </button>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900">Patient</h3>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">ABHA ID</label>
                  <input className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300 text-gray-900 shadow-sm focus:ring-gray-300" checked={includeHistory} onChange={(e) => setIncludeHistory(e.target.checked)} />
                  Include version history
                </label>
                <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors" onClick={loadProblemList}>
                  Load Problem List
                </button>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6">
              <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500 font-mono">
                {status || "Ready"}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") search(); }}
                  placeholder="Search terms (e.g. fever, cough)..."
                />
                <button className="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors" onClick={search}>
                  Search
                </button>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Traditional (NAMASTE)</p>
                  {namasteResults.length === 0 && <div className="rounded-md border border-dashed border-gray-200 p-4 text-sm text-gray-400">No results</div>}
                  <div className="grid gap-2">
                    {namasteResults.map((item) => (
                      <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm" key={`${item.system}-${item.code}`}>
                        <div className="font-medium text-gray-900">{item.display}</div>
                        <div className="text-sm text-gray-500">{item.code}</div>
                        {translations[item.code] && (
                          <div className="mt-2 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600">
                            TM2: {codingLabel(translations[item.code])}
                          </div>
                        )}
                        {isClinician && (
                          <button className="mt-2 rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600 transition-colors" onClick={() => addToProblemList(item)}>
                            Add to Problem List
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">ICD-11 TM2</p>
                  {tm2Results.length === 0 && <div className="rounded-md border border-dashed border-gray-200 p-4 text-sm text-gray-400">No results</div>}
                  <div className="grid gap-2">
                    {tm2Results.map((item) => (
                      <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm" key={`${item.system}-${item.code}`}>
                        <div className="font-medium text-gray-900">{item.display}</div>
                        <div className="text-sm text-gray-500">{item.code}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {selected && (
                <div className="mt-4 rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <span className="font-medium">Last added:</span> {codingLabel(selected.namaste)}
                  {selected.tm2 ? <span> mapped to {codingLabel(selected.tm2)}</span> : ""}
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

function ProblemList({ bundle }) {
  const entries = bundle?.entry || [];
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900">Problem List</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400">
              <th className="pb-2 pr-4 font-medium">NAMASTE</th>
              <th className="pb-2 pr-4 font-medium">TM2</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 font-medium">Version</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td className="py-6 text-gray-400" colSpan="4">
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
                <tr className="border-b border-gray-100 text-gray-700" key={resource.id}>
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
    <footer className="border-t border-gray-100 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} CodeSutra. MIT License.
        </p>
        <p className="text-sm text-gray-400">
          Built for SIH 25026 &mdash; Ministry of Ayush / AIIA
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  const playgroundRef = useRef(null);
  const handlePlaygroundClick = () => {
    document.getElementById("playground")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Nav onPlaygroundClick={handlePlaygroundClick} />
      <main>
        <Hero />
        <Problem />
        <Features />
        <Playground />
        <Footer />
      </main>
    </>
  );
}
