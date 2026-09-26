import { ArrowDown, Braces, Languages, ScanText, SpellCheck2, Target } from "lucide-react";

const stages = [
  { icon: ScanText, title: "Preprocess", copy: "Tokenize while preserving exactly what the user typed." },
  { icon: Languages, title: "Identify", copy: "Combine script detection with auditable multilingual lexicons." },
  { icon: SpellCheck2, title: "Normalize", copy: "Resolve supported phonetic forms without destroying the original." },
  { icon: Target, title: "Understand", copy: "Infer conservative meaning, intent, and useful entities." },
  { icon: Braces, title: "Structure", copy: "Return one documented JSON contract for downstream systems." },
];

export default function AboutPage() {
  return (
    <main className="content-page about-page">
      <header className="about-hero">
        <span className="section-kicker"><span>?</span> System notes</span>
        <h1>One sentence.<br /><em>Several language signals.</em></h1>
        <p>Polyglot Pulse turns informal multilingual text into inspectable structure. The baseline is deterministic, honest about uncertainty, and designed to be replaced stage by stage as better models become available.</p>
      </header>
      <section className="about-flow" aria-label="Processing flow">
        {stages.map((stage, index) => (
          <div key={stage.title} className="about-stage">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <stage.icon size={21} />
            <h2>{stage.title}</h2>
            <p>{stage.copy}</p>
            {index < stages.length - 1 && <ArrowDown className="about-arrow" size={17} />}
          </div>
        ))}
      </section>
      <section className="principles-grid">
        <article><span>Principle 01</span><h2>Evidence over theater</h2><p>Technical terms, URLs, numbers, and emojis are classified by category—not falsely assigned to a language. Scores are labeled as heuristics.</p></article>
        <article><span>Principle 02</span><h2>Original stays intact</h2><p>Normalization is additive. Every correction points back to the surface form the person actually wrote.</p></article>
        <article><span>Principle 03</span><h2>Useful without a key</h2><p>The complete baseline runs offline. External model providers can enhance semantics through a single server-side boundary later.</p></article>
      </section>
    </main>
  );
}
