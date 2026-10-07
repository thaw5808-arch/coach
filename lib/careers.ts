/** Figma "Careers — Openings" (100:255). Concept study: roles are illustrative and applications are not accepted. */
export type Opening = { id: string; title: string; team: string; location: string; type: string; summary: string; details: string[] };

export const OPENINGS: Opening[] = [
  {
    id: "leather-artisan",
    title: "Leather Artisan",
    team: "Workshop",
    location: "New York",
    type: "Full time",
    summary: "Cut, stitch and finish pieces by hand alongside the workshop’s senior artisans.",
    details: ["Hand-cutting and skiving leather", "Edge painting and finishing", "Working to the workshop’s quality sign-offs"],
  },
  {
    id: "client-advisor",
    title: "Client Advisor",
    team: "Boutique",
    location: "Mercer Street",
    type: "Full time",
    summary: "Welcome clients to the boutique, from personal styling appointments to repairs and personalisation.",
    details: ["Personal styling appointments", "Personalisation and repair intake", "Caring for clients long after the first visit"],
  },
  {
    id: "repair-specialist",
    title: "Repair Specialist",
    team: "Restore Studio",
    location: "New York",
    type: "Full time",
    summary: "Clean, condition and restore pieces that come home to the workshop.",
    details: ["Assessing pieces sent in for repair", "Cleaning, conditioning and edge repainting", "Hardware and lining repairs"],
  },
  {
    id: "junior-designer",
    title: "Junior Designer, Leather Goods",
    team: "Studio",
    location: "New York",
    type: "Full time",
    summary: "Help develop new chapters, from first sketches to the prototypes our artisans make by hand.",
    details: ["Sketching and technical drawings", "Material and hardware research", "Working with the workshop on prototypes"],
  },
];
