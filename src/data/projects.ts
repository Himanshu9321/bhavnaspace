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

export const projects: Project[] = [
  {
    slug: 'kalyan-kitchen',
    number: '01',
    title: 'Kitchen Project, Kalyan',
    location: 'Kalyan',
    year: '2026',
    category: 'Residential',
    // TODO: Update with actual kitchen area once confirmed by client
    area: '— sq.ft',
    excerpt:
      'A functional, warm kitchen designed with clean cabinetry, stone countertops and considered storage — built for everyday living in Kalyan.',
    description:
      // TODO: Add a detailed project description once available from the studio
      'This kitchen project in Kalyan balances practicality with warmth. Structured cabinetry, stone surfaces and carefully chosen finishes create a space that is as pleasant to cook in as it is to look at.',
    materials: ['Stone countertop', 'Lacquered cabinetry', 'Stainless steel', 'Ceramic tile'],
    hero: '/images/kalyan-kitchen-01.jpeg',
    images: [
      '/images/kalyan-kitchen-01.jpeg',
      '/images/kalyan-kitchen-02.jpeg',
      '/images/kalyan-kitchen-03.jpeg',
      '/images/kalyan-kitchen-04.jpeg',
    ],
  },
];
