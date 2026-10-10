import { prisma } from "../db";

// =====================================================================
//  Knowledge base retrieval for the AI voice agent (RAG-lite)
//
//  Local keyword scoring that works on SQLite and PostgreSQL alike.
//  In production this can be swapped for pgvector embeddings without
//  changing the callers — see retrieveKnowledge() signature.
// =====================================================================

export type KnowledgeHit = {
  id: string;
  title: string;
  content: string;
  score: number;
};

export async function retrieveKnowledge(
  query: string,
  limit = 3
): Promise<KnowledgeHit[]> {
  const docs = await prisma.knowledgeDoc.findMany();
  const terms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2);

  const scored = docs
    .map((d) => {
      const text = `${d.title} ${d.content} ${d.tags ?? ""}`.toLowerCase();
      let score = 0;
      for (const t of terms) if (text.includes(t)) score += 1;
      return { id: d.id, title: d.title, content: d.content, score };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export function knowledgeContext(hits: KnowledgeHit[]): string {
  if (!hits.length) return "(no specific knowledge matched)";
  return hits.map((h) => `• ${h.title}: ${h.content}`).join("\n");
}
