// Site-wide content. Copy is taken verbatim from the original Framer site
// (https://voluntary-path-520226.framer.app/) unless noted.

export const site = {
  name: 'Vamsi Kasina',
  firstName: 'VAMSI',
  lastName: 'KASINA',
  role: 'LEVEL / GAME DESIGNER',
  title: 'Vamsi Kasina | Portfolio',
  description:
    'Vamsi Kasina is a level and game designer based in Stockholm, studying at Futuregames. Portfolio of level design, quest design and systems work in Unreal Engine 5.',
  location: 'Stockholm, Sweden',
  email: 'vamsikkasina@gmail.com',
  phone: '+46 764437442',
  phoneHref: 'tel:+46764437442',
  linkedin: 'https://www.linkedin.com/in/vamsikkasina/',
  resume: 'https://drive.google.com/file/d/1lqqVm1fk55NRmhKQMCnSpxjqblFFhjS4/view?usp=sharing',
  heroVideo: 'C68RXlqYZEHmSyQSdQOWK06nI',
  heroCaption: 'Click to View a 60 Second Summary of My Portfolio.',
  portrait: '6SlTnxFENgv2X0ORIsZXje8bq0o',
};

export const nav = [
  { label: 'PROJECTS', href: '/projects' },
  { label: 'OTHER PROJECTS', href: '/otherprojects' },
  { label: 'RESUME', href: site.resume, external: true },
  { label: 'ABOUT', href: '/about' },
];

// Featured projects (home + /projects) and secondary projects (/otherprojects).
export const projects = [
  {
    slug: 'darkfen', title: 'Darkfen', genre: 'SOULS-LIKE RPG', href: '/work/darkfen---darkfen',
    cover: 'mh28kHE0h4BQbwkbebjtI1hw', featured: true,
    summary: 'A Dark Souls style level built around interconnected routes, shortcuts and hidden spaces.',
    meta: { type: 'Personal Project', timeline: 'Six Weeks', engine: 'UE5' },
  },
  {
    slug: 'delumination', title: 'Delumination', genre: 'NARRATIVE BASED RPG', href: '/projects/delumination',
    cover: '8NDoYYbqyMg6ztDoOZDRI1NQ', featured: true,
    award: '🏆 Futuregames Award 2025 Best Narrative Nomination 🏆',
    summary: 'Team project: level, system and quest design for a narrative RPG set in the city of Elysium.',
    meta: { type: 'Group Project · Team of 4', timeline: 'Four Months', engine: 'UE5' },
  },
  {
    slug: 'pier-extract', title: 'Pier Extract', genre: 'EXTRACTION SHOOTER', href: '/pier-extract',
    cover: 'nWzvTXMadte1d11F1Ohyjr84U8', featured: true,
    summary: 'A third-person extraction level through an abandoned carnival pier in a post-apocalyptic cityscape.',
    meta: { type: 'Personal Project', timeline: 'Four Weeks', engine: 'UE5.6' },
  },
  {
    slug: 'furscape', title: 'Furscape', href: '/furscape',
    cover: 'impLI30h2WnHs9RM2WiKszY14wg', featured: false,
    summary: 'A solo-developed survival adventure about a lone puppy escaping the forest.',
    meta: { type: 'Personal Project', timeline: 'Five Weeks', engine: 'UE5' },
  },
  {
    slug: 'castle-infiltration', title: 'Castle Infiltration', href: '/castle-infiltration',
    cover: 'D1KIqHWADlJXREigl2XUqAPAceQ', featured: false,
    summary: 'A three-act infiltration mission to retrieve intel from a heavily guarded castle.',
    meta: { type: 'Personal Project', timeline: 'Ongoing', engine: 'UE5' },
  },
];

export const tools = [
  { name: 'Unreal Engine 5', icon: 'NqxcrfdFvXdPLw26t4DljsdGLs' },
  { name: 'Unity', icon: 'YIddApUylbCsLsafYYUo4VcHgE4' },
  { name: 'Quixel Megascans', icon: 'eo5Udhg1I0OGGLugx9Ku6pDR9NU' },
  { name: 'GitHub', icon: 'zrF5jHXYTUQt6Z2gBIIG5N4rIZg' },
  { name: 'Jira', icon: 'qw2h2AopcQPmd5xmWjSOtFD5A' },
  { name: 'Miro', icon: 'WmsFa4372W3gs8DQt1THVX6XKQ' },
];

export const about = [
  'In 2024, I completed my Bachelor’s degree in Design with a focus on Animation and Motion Graphics. During my final semester, I explored Game Design and became deeply interested in it. That interest led me to move to Stockholm to continue studying Game Design.',
  'I’m drawn to games where the world and the mechanics feel like they belong together. When the story, systems, and rules support each other, the experience becomes more than just gameplay. Those are the games that stay with me. At the same time, I enjoy exploring all kinds of games and I don’t limit myself to any single genre or style. Some of my all-time favourites include Assassin’s Creed III, Clair Obscur: Expedition 33, and It Takes Two.',
  'Outside of video games, I enjoy fishing, cooking and drawing.',
];

export const education = [
  {
    title: 'Game Design, Higher Vocational Diploma',
    school: 'Futuregames, Stockholm, Sweden',
    years: '2024 - Present',
    text: 'Currently studying game design with a specialization in level design and worldbuilding.',
  },
  {
    title: 'Bachelor of Design in Animation and Motion Graphics',
    school: 'Unitedworld Institute Of Design, Gandhinagar, India',
    years: '2020 - 2024',
    text: 'Built a solid foundation in animation and strengthened my understanding of design fundamentals.',
  },
];

export const tickerWords = ['UNREAL ENGINE', 'UNITY', 'PERFORCE', 'PROCREATE'];
