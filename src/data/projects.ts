export type Project = {
  slug: string;
  number: string;
  title: string;
  location: string;
  year: string;
  category: string;
  area: string;
  excerpt: string;
  description: string;
  materials: string[];
  hero: string;
  images: string[];
};

// Replace the placeholder image paths with real project photography.
export const projects: Project[] = [
  {
    slug: 'quiet-residence',
    number: '01',
    title: 'Quiet Residence',
    location: 'Mumbai',
    year: '2026',
    category: 'Residential',
    area: '2,400 sq.ft',
    excerpt: 'A calm residential interior built around natural light, warm stone and restrained detailing.',
    description:
      'Quiet Residence explores how material, proportion and daylight can make a contemporary home feel deeply personal. The palette is deliberately restrained, allowing texture and changing light to carry the atmosphere through the day.',
    materials: ['Natural stone', 'Oak', 'Brushed brass', 'Linen'],
    hero: '/images/project-01.svg',
    images: ['/images/project-01.svg', '/images/project-02.svg', '/images/project-03.svg'],
  },
  {
    slug: 'earth-and-line',
    number: '02',
    title: 'Earth & Line',
    location: 'Pune',
    year: '2026',
    category: 'Residential',
    area: '1,850 sq.ft',
    excerpt: 'An earthy palette and clean geometry create a home that feels collected rather than decorated.',
    description:
      'Earth & Line balances tactile materials with crisp architectural lines. Every room is designed to transition naturally into the next, creating a quiet visual rhythm across the home.',
    materials: ['Travertine', 'Walnut', 'Clay plaster', 'Cotton'],
    hero: '/images/project-02.svg',
    images: ['/images/project-02.svg', '/images/project-03.svg', '/images/project-01.svg'],
  },
  {
    slug: 'soft-geometry',
    number: '03',
    title: 'Soft Geometry',
    location: 'Mumbai',
    year: '2025',
    category: 'Commercial',
    area: '3,100 sq.ft',
    excerpt: 'A contemporary workplace softened by natural textures, sculptural lighting and warm neutrals.',
    description:
      'Soft Geometry creates a hospitality-led workplace where circulation, light and texture shape the experience. The result is professional without feeling corporate, and refined without feeling precious.',
    materials: ['Microcement', 'Ash', 'Textured glass', 'Wool'],
    hero: '/images/project-03.svg',
    images: ['/images/project-03.svg', '/images/project-01.svg', '/images/project-02.svg'],
  },
];
