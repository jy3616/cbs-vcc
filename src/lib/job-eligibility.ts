/** Full-time Associate / Senior Associate levels, not internships or other levels. */
export function isAssociatePosition(title: string): boolean {
  return /\bassociate\b/i.test(title) && !/\banalyst\b|\bprincipal\b|vice president|\bvp\b|\bdirector\b|\bpartner\b|\bhead\b|\bchief\b|\bintern(ship)?\b|\bsummer\b|\bfellow(ship)?\b/i.test(title);
}