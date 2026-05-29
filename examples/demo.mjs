// Throwaway demo: feeds example inputs to the deterministic core and prints
// what each result carries — the data a "show your work" card will render.
import {
  convert,
  toSigFigs,
  apiToSg,
  CALC_REGISTRY,
} from "../dist/index.js";

const line = "─".repeat(64);

function card(title, res) {
  const tier = {
    exact: "✔ Exact",
    computed: "≈ Computed — formula shown",
    validated: "★ Validated against standard",
    "ai-estimate": "⚠ AI estimate — verify",
  }[res.trustTier];
  console.log(line);
  console.log(`  ${title}`);
  console.log(line);
  console.log(`  Result : ${toSigFigs(res.result.value, 5)} ${res.result.unit}`);
  console.log(`  Formula: ${res.formula}`);
  console.log(`  Method : ${res.method}` + (res.alternativeMethods ? `   (alt: ${res.alternativeMethods.join(", ")})` : ""));
  if (res.reference) console.log(`  Std ref: ${res.reference}`);
  console.log(`  Trust  : ${tier}`);
  if (res.assumptions.length)
    console.log(`  Assume : ${res.assumptions.map((a) => `${a.key}=${a.value.value}${a.value.unit ? " " + a.value.unit : ""}`).join(", ")}`);
  console.log("  Steps  :");
  for (const s of res.steps) {
    const r = s.result ? `  →  ${toSigFigs(s.result.value, 5)} ${s.result.unit}` : "";
    console.log(`    • ${s.label}: ${s.expression}${r}`);
  }
  if (res.flags.length)
    for (const f of res.flags) console.log(`  ⚠ FLAG : ${f.message}  [${f.reference ?? ""}]`);
  console.log("");
}

// 1. Pure unit conversion (Tier 1) — your "1550 psi to bar"
console.log(line);
console.log("  Conversion (Tier 1 — exact, no LLM, offline)");
console.log(line);
console.log(`  1550 psi  =  ${toSigFigs(convert(1550, "psi", "bar"), 5)} bar`);
console.log(`  1 MMscf   =  ${toSigFigs(convert(1, "MMscf", "ft^3"), 5)} ft³`);
console.log(`  30 °API   =  ${toSigFigs(apiToSg(30), 4)} SG`);
console.log("");

// 2. Cylinder volume — your "radius 3 m, length 100 m"
card(
  "Cylinder volume  (r = 3 m, L = 100 m)",
  CALC_REGISTRY.cylinderVolume.run({
    inputs: { radius: { value: 3, unit: "m" }, length: { value: 100, unit: "m" } },
  }),
);

// 3. Reynolds number (viscosity given in cP — auto-normalised)
card(
  "Reynolds number  (ρ=1000 kg/m³, v=2 m/s, D=0.1 m, μ=1 cP)",
  CALC_REGISTRY.reynolds.run({
    inputs: {
      density: { value: 1000, unit: "kg/m^3" },
      velocity: { value: 2, unit: "m/s" },
      diameter: { value: 0.1, unit: "m" },
      viscosity: { value: 1, unit: "cP" },
    },
  }),
);

// 4. Barlow wall thickness (Tier 3 — standard-cited, editable assumption E)
card(
  "Pipe wall thickness — Barlow  (P=1000 psi, OD=10 in, S=20000 psi, E=0.85)",
  CALC_REGISTRY.barlowWallThickness.run({
    inputs: {
      pressure: { value: 1000, unit: "psi" },
      outsideDiameter: { value: 10, unit: "inch" },
      allowableStress: { value: 20000, unit: "psi" },
    },
    assumptionOverrides: { E: { value: 0.85, unit: "" } },
  }),
);

// 5. Transit time — like your chemical-into-stream example (total Q in a line)
card(
  "Pipeline transit time  (Q=0.01 m³/s, D=0.1 m, L=300 m)",
  CALC_REGISTRY.transitTime.run({
    inputs: {
      flowrate: { value: 0.01, unit: "m^3/s" },
      diameter: { value: 0.1, unit: "m" },
      distance: { value: 300, unit: "m" },
    },
  }),
);

// 6. Same calc at high flow — fires the sanity guardrail
card(
  "Transit time at HIGH flow  (Q=0.4 m³/s, D=0.1 m, L=300 m)  ← sanity flag",
  CALC_REGISTRY.transitTime.run({
    inputs: {
      flowrate: { value: 0.4, unit: "m^3/s" },
      diameter: { value: 0.1, unit: "m" },
      distance: { value: 300, unit: "m" },
    },
  }),
);
