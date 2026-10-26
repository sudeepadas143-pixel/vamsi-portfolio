// Structured headers for the case studies. Every value is taken from the original
// page's header block (which was free-positioned text in Framer); `skip` is the
// number of measured rows in case-studies/<slug>.json that this header replaces.
// Order here is the "next level" order used for the footer navigation.

export const caseMeta = {
  darkfen: {
    title: 'Darkfen', path: '/work/darkfen---darkfen', skip: 4,
    logo: 'NzbKDsumgmtQkpAtDzVCBroizMw', badge: 'ibpMyxSRwby6wRmjWjJcpCzxklw', genre: 'Souls-like RPG',
    lede: 'In this project, my main goal was to create an Dark Souls style level -one that is highly interconnected and has multiple layers and hiding spaces for the asto explore. The challenge was to design different types of shortcuts while keeping the overall map layout interesting.',
    facts: [
      ['Type', 'Personal Project'],
      ['Timeline', 'Six Weeks'],
      ['Software Used', 'UE5, Blueprints, Procreate, Perforce, Miro'],
      ['Inspiration', 'Dark Souls\nElden Ring'],
    ],
    hero: { kind: 'youtube', id: 'a4xQcbsh51U', label: 'Game Walkthrough' },
  },
  delumination: {
    title: 'Delumination', path: '/projects/delumination', skip: 4,
    logo: '8XwM7jFzvw2OASUtNE38iX63I', genre: 'Narrative based RPG',
    award: 'Futuregames Award 2025 · Best Narrative Nomination',
    facts: [
      ['Type', 'Group Project · Team of 4'],
      ['My Role', 'Level Design\nSystem Design\nQuest Design'],
      ['Timeline', 'Four Months'],
      ['Software Used', 'UE5, Blueprints, Procreate, Perforce, Miro'],
    ],
    links: [{ label: 'Play on itch.io', href: 'https://futuregames.itch.io/delumination' }],
    hero: { kind: 'video', media: 'njXzS9nOISL0LmFBXDVl5r9Ho', label: 'Trailer' },
  },
  'pier-extract': {
    title: 'Pier Extract', path: '/pier-extract', skip: 9,
    logo: '8ceJHuWcfdtZ3SsmQTEwC5w3Lz0', genre: 'Extraction shooter',
    lede: 'In this third-person project, you play as an adventurer exploring the abandoned **carnival pier** in a post-apocalyptic cityscape. My primary focus was to create a semi-whitebox experience, with both **gameplay** and **narrative** beats working together to keep the player intrigued.',
    facts: [
      ['Type', 'Personal Project · Ongoing'],
      ['Software Used', 'UE5, Blueprints, Procreate, Perforce, Miro'],
      ['Inspiration', 'Escape From Tarkov\nArc Raiders'],
      ['Notes', 'AGLS Locomotion System is used in this project'],
    ],
    breakdown: [
      'Developed over four weeks half-time (4 hours/day)',
      'Strong spatial composition',
      'Intentional combat arenas and sightlines',
      'Consistent environmental storytelling',
      'Clear affordances to guide player movement',
      'Created using Unreal Engine 5.6',
    ],
    hero: { kind: 'video', media: '5Mhmzm03gKO3PfLDGD446DXlNcI', label: 'Gameplay' },
  },
  furscape: {
    title: 'Furscape', path: '/furscape', skip: 5,
    logo: 'aXlDmHCcIs3BVi4FYy9JxA9No', genre: 'Solo project',
    lede: 'Furscape is my solo design and developed game on Unreal Engine 5. The game is based on an abandoned puppy in a forest named Chunnu, a challenge awaits for the player as they need to unveil their way through the forest avoiding obstacles and plan their escape. The idea for the entire project was inspired by a real life incident.',
    facts: [
      ['Type', 'Personal Project'],
      ['Timeline', 'Five Weeks'],
      ['Software Used', 'UE5, Blueprints, Procreate, Miro'],
      ['Inspiration', 'Real Life Incident\nStray'],
    ],
    walkthrough: 'm_GjTV5jNxo',
    hero: { kind: 'video', media: '15j3CyPZwCsQpJOnCjjNDrDlM', label: 'Gameplay' },
  },
  'castle-infiltration': {
    title: 'Castle Infiltration', path: '/castle-infiltration', skip: 9,
    logo: 'lp0CnWYvkjrSh7zXoJMkBuyBC8', genre: 'Stealth mission',
    lede: 'You play as an officer tasked with retrieving critical documents that reveal the location of an impending terrorist attack. The documents are heavily guarded inside an abandoned castle used as a hideout. To succeed, the player must stealthily infiltrate the castle and steal the intel without being detected.',
    facts: [
      ['Type', 'Personal Project · Ongoing'],
      ['Software Used', 'UE5, Blueprints, Procreate, Perforce, Miro'],
      ['Inspiration', 'Assassins Creed 3\nDishonored\nCall of Duty'],
      ['Notes', 'AGLS Locomotion System is used in this project'],
    ],
    hero: { kind: 'image', media: 'D1KIqHWADlJXREigl2XUqAPAceQ', label: 'Castle exterior' },
  },
};

export const caseOrder = ['darkfen', 'delumination', 'pier-extract', 'furscape', 'castle-infiltration'];
