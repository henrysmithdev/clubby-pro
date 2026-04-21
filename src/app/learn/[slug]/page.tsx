import { articles, getArticleBySlug } from "@/data/articles";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

function renderMarkdown(content: string) {
  const lines = content.trim().split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;
  let tableBuffer: string[] = [];
  let inTable = false;

  while (i < lines.length) {
    const line = lines[i];

    // Table handling
    if (line.includes("|") && line.trim().startsWith("|")) {
      if (!inTable) inTable = true;
      tableBuffer.push(line);
      i++;
      continue;
    } else if (inTable) {
      // Flush table
      const rows = tableBuffer.filter(r => !r.match(/^\|[-| ]+\|$/));
      result.push(
        <div key={i} className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-masters-green text-white">
                {rows[0].split("|").filter(Boolean).map((cell, ci) => (
                  <th key={ci} className="px-4 py-2 text-left font-semibold">{cell.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-cream" : "bg-white"}>
                  {row.split("|").filter(Boolean).map((cell, ci) => (
                    <td key={ci} className="px-4 py-2 text-charcoal border-b border-gray-100">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
      inTable = false;
      continue;
    }

    if (line.startsWith("## ")) {
      result.push(<h2 key={i} className="font-[var(--font-heading)] text-2xl font-bold text-charcoal mt-10 mb-4">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      result.push(<h3 key={i} className="font-[var(--font-heading)] text-xl font-bold text-charcoal mt-7 mb-3">{line.slice(4)}</h3>);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      result.push(<p key={i} className="font-semibold text-charcoal my-2">{line.slice(2, -2)}</p>);
    } else if (line.startsWith("- ")) {
      result.push(
        <li key={i} className="ml-4 text-gray-700 leading-relaxed my-1 list-disc list-inside"
          dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
        />
      );
    } else if (line.match(/^\d+\. /)) {
      result.push(
        <li key={i} className="ml-4 text-gray-700 leading-relaxed my-1 list-decimal list-inside"
          dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\. /, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
        />
      );
    } else if (line === "---") {
      result.push(<hr key={i} className="my-8 border-gray-200" />);
    } else if (line.trim() === "") {
      result.push(<div key={i} className="h-2" />);
    } else {
      result.push(
        <p key={i} className="text-gray-700 leading-relaxed my-3"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>') }}
        />
      );
    }
    i++;
  }
  return result;
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const related = articles.filter(a => a.slug !== article.slug && a.category === article.category).slice(0, 2);

  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-4xl mx-auto">
          <span className="px-3 py-1 bg-gold text-charcoal text-xs font-bold rounded-full uppercase tracking-wide">
            {article.category}
          </span>
          <h1 className="mt-3 font-[var(--font-heading)] text-2xl md:text-4xl font-bold text-white leading-tight">
            {article.title}
          </h1>
          <p className="mt-2 text-white/60 text-sm">{article.time} read</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <nav className="text-sm text-gray-400 flex items-center gap-2">
          <Link href="/" className="hover:text-masters-green transition">Home</Link>
          <span>›</span>
          <Link href="/learn" className="hover:text-masters-green transition">Learn</Link>
          <span>›</span>
          <span className="text-charcoal">{article.title}</span>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 prose-like">
          {renderMarkdown(article.content)}
        </div>

        {/* CTA */}
        <div className="mt-10 p-8 bg-gradient-to-r from-masters-green to-deep-green rounded-2xl text-center text-white">
          <h3 className="font-[var(--font-heading)] text-2xl font-bold">Ready to Find the Right Clubs?</h3>
          <p className="mt-2 text-white/80">Get a personalized recommendation in under 2 minutes — free.</p>
          <Link href="/fit" className="inline-block mt-5 px-8 py-3 bg-gold text-charcoal font-bold rounded-full hover:bg-soft-gold transition">
            Get Fitted Free →
          </Link>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="font-[var(--font-heading)] text-xl font-bold text-charcoal mb-6">More {article.category} Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map((a) => (
                <Link key={a.slug} href={`/learn/${a.slug}`} className="group block">
                  <div className="h-36 rounded-t-xl overflow-hidden">
                    <img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="bg-white rounded-b-xl p-4 border border-t-0 border-gray-100 group-hover:shadow-md transition-shadow">
                    <h4 className="font-[var(--font-heading)] font-bold text-charcoal group-hover:text-masters-green transition">{a.title}</h4>
                    <p className="mt-1 text-xs text-gray-400">{a.time} read</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/learn" className="text-masters-green font-medium hover:underline">← Back to all articles</Link>
        </div>
      </div>
    </div>
  );
}
