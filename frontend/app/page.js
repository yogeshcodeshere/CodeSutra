"use client";

import { useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
const NAMASTE_SYSTEM = "https://namaste.ayush.gov.in/fhir/CodeSystem/namaste";
const TM2_SYSTEM = "https://id.who.int/icd/release/11/tm2";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function codingLabel(coding) {
  return `${coding.code}${coding.display ? ` - ${coding.display}` : ""}`;
}

export default function Home() {
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
        try {
          return [item.code, await translate(item.code)];
        } catch {
          return [item.code, null];
        }
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
    <main className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold">NAMASTE ICD-11 Dual Coding</h1>
            <p className="text-sm text-slate-600">Terminology search, translation, and Problem List demo</p>
          </div>
          <a className="text-sm font-medium text-leaf underline-offset-4 hover:underline" href={`${API_BASE}/docs`}>
            Swagger
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-5 lg:grid-cols-[360px_1fr]">
        <aside className="rounded border border-line bg-white p-4">
          <h2 className="text-base font-semibold">Demo Access</h2>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm">
              Role
              <select className="rounded border border-line bg-field px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
                <option>CLINICIAN</option>
                <option>CODER</option>
                <option>PATIENT</option>
                <option>ADMIN</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              ABHA ID
              <input className="rounded border border-line bg-field px-3 py-2" value={abhaId} onChange={(e) => setAbhaId(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              Facility
              <input className="rounded border border-line bg-field px-3 py-2" value={facilityId} onChange={(e) => setFacilityId(e.target.value)} />
            </label>
            <button className="rounded bg-leaf px-4 py-2 font-medium text-white" onClick={getToken}>
              Get Demo Token
            </button>
          </div>

          <div className="mt-6 grid gap-3 border-t border-line pt-4">
            <label className="grid gap-1 text-sm">
              Patient ABHA ID
              <input className="rounded border border-line bg-field px-3 py-2" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeHistory} onChange={(e) => setIncludeHistory(e.target.checked)} />
              Include history
            </label>
            <button className="rounded border border-leaf px-4 py-2 font-medium text-leaf" onClick={loadProblemList}>
              Load Problem List
            </button>
          </div>

          <p className="mt-5 min-h-6 rounded bg-field px-3 py-2 text-sm text-slate-700">{status || "Ready"}</p>
        </aside>

        <section className="grid gap-4">
          <div className="rounded border border-line bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="min-w-0 flex-1 rounded border border-line bg-field px-3 py-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") search();
                }}
                placeholder="Search diagnosis terms"
              />
              <button className="rounded bg-saffron px-5 py-2 font-medium text-white" onClick={search}>
                Search
              </button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <ResultColumn
                title="Traditional (NAMASTE)"
                items={namasteResults}
                canAdd={isClinician}
                onAdd={addToProblemList}
                translations={translations}
              />
              <ResultColumn title="ICD-11 TM2" items={tm2Results} />
            </div>
          </div>

          {selected && (
            <div className="rounded border border-line bg-clinic p-4 text-sm">
              <span className="font-semibold">Last added:</span> {codingLabel(selected.namaste)}
              {selected.tm2 ? ` mapped to ${codingLabel(selected.tm2)}` : ""}
            </div>
          )}

          <ProblemList bundle={problemList} />
        </section>
      </section>
    </main>
  );
}

function ResultColumn({ title, items, canAdd = false, onAdd, translations = {} }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
      <div className="grid gap-2">
        {items.length === 0 && <div className="rounded border border-dashed border-line p-3 text-sm text-slate-500">No results</div>}
        {items.map((item) => (
          <div className="rounded border border-line bg-field p-3" key={`${item.system}-${item.code}`}>
            <div className="font-medium">{item.display}</div>
            <div className="text-sm text-slate-600">{item.code}</div>
            {translations[item.code] && (
              <div className="mt-2 rounded border border-line bg-white px-2 py-1 text-xs text-slate-700">
                TM2: {codingLabel(translations[item.code])}
              </div>
            )}
            {canAdd && (
              <button className="mt-3 rounded bg-leaf px-3 py-1.5 text-sm font-medium text-white" onClick={() => onAdd(item)}>
                Add to Problem List
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProblemList({ bundle }) {
  const entries = bundle?.entry || [];

  return (
    <div className="rounded border border-line bg-white p-4">
      <h2 className="text-base font-semibold">Problem List</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2 pr-3">NAMASTE</th>
              <th className="py-2 pr-3">TM2</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Version</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td className="py-4 text-slate-500" colSpan="4">
                  No Problem List entries loaded
                </td>
              </tr>
            )}
            {entries.map(({ resource }) => {
              const codings = resource.code?.coding || [];
              const namaste = codings.find((coding) => coding.system === NAMASTE_SYSTEM);
              const tm2 = codings.find((coding) => coding.system === TM2_SYSTEM);
              const version = resource.extension?.find((item) => item.url.endsWith("/version"))?.valueInteger;
              return (
                <tr className="border-b border-line" key={resource.id}>
                  <td className="py-2 pr-3">{namaste ? codingLabel(namaste) : ""}</td>
                  <td className="py-2 pr-3">{tm2 ? codingLabel(tm2) : ""}</td>
                  <td className="py-2 pr-3">{resource.clinicalStatus?.coding?.[0]?.code}</td>
                  <td className="py-2 pr-3">{version}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
