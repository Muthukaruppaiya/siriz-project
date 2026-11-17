const ORIGIN = "https://sirizinteriors.com"

export function media(path) {
  return `${ORIGIN}/${path
    .replace(/^\//, "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`
}

function frames(folder, word, count, title) {
  return Array.from({ length: count }, (_, index) => ({
    src: media(`img/projectwise-gallery-images/${folder}/project-${word}-img-${index + 1}.jpg`),
    alt: `${title}, Siriz Interiors`,
    caption: `${title} ${String(index + 1).padStart(2, "0")}`,
    room: "Interior",
  }))
}

export const studio = {
  name: "Siriz Interiors",
  email: "info@sirizinteriors.com",
  phone: "+91 84384 23938",
  phoneHref: "tel:+918438423938",
  whatsapp: "https://api.whatsapp.com/send?phone=919384577177&text=Hi%20I'm%20Interested%20in%20your%20interior%20designing",
  instagram: "https://www.instagram.com/siriz_interiors",
  youtube: "https://youtube.com/@siriz_interiors",
  website: "https://sirizinteriors.com",
  location: "5th main road, Sivagami street, Pearl Flora Building, Medavakkam, Chennai, Tamil Nadu 600100",
  completed: "500",
  ongoing: "15",
  clients: "600",
  hero: media("img/projectwise-gallery-images/project -1/project-one-img-1.jpg"),
  heroAlt: "A Siriz Interiors residence",
  about: media("img/about.webp"),
  aboutAlt: "The Siriz Interiors studio",
  formNote:
    "A free consultation starts with a conversation. You can also call +91 84384 23938 or write to info@sirizinteriors.com.",
}

export const palette = [
  {
    name: "Cream",
    hex: "#F3EEE4",
    ink: "#1C140F",
    note: "The quiet ground of the Siriz rooms.",
  },
  {
    name: "Warm beige",
    hex: "#D7C4A3",
    ink: "#1C140F",
    note: "Daylight on timber, cloth, and plaster.",
  },
  {
    name: "Dark brown",
    hex: "#2A1C14",
    ink: "#F3EEE4",
    note: "The line that holds a room still.",
  },
]

export const principles = [
  {
    no: "01",
    title: "Creativity",
    body: "Fresh ideas in every space. The studio plans, designs, and builds interiors that reflect the people who live there.",
  },
  {
    no: "02",
    title: "Turnkey",
    body: "A full range of planning and turnkey fit-out, from the first drawing to the day you move in.",
  },
  {
    no: "03",
    title: "Delivery",
    body: "Forty-five days of guaranteed delivery, with a ten-year warranty on the wooden work.",
  },
]

export const nav = [
  { label: "Home", to: "/", image: media("img/about.webp") },
  {
    label: "Signatures",
    to: "/signatures",
    image: media("img/signature-gallery-images/signature-1.jpg"),
    children: [
      { label: "Siriz Signature", to: "/signatures/siriz-signature" },
      { label: "Signature Mood Board", to: "/signatures/mood-board" },
    ],
  },
  {
    label: "Portfolio",
    to: "/portfolio",
    image: media("img/projectwise-gallery-images/project -2/project-two-img-1.jpg"),
  },
  {
    label: "Gallery",
    to: "/gallery",
    image: media("img/projects/Interior-gallery.webp"),
    children: [
      { label: "Interior Gallery", to: "/gallery/interior" },
      { label: "Video Gallery", to: "/gallery/video" },
      { label: "Projectwise Gallery", to: "/gallery/projects" },
    ],
  },
  {
    label: "Guide",
    to: "/guide",
    image: media("img/guides_images/guides3.JPG"),
  },
  {
    label: "Contact",
    to: "/contact",
    image: media("img/abt-bg.webp"),
  },
]

const projectList = [
  {
    slug: "alpha",
    title: "Alpha",
    typology: "Residence",
    palette: "Siriz interior",
    scope: "Full home",
    summary: "Site 1, Alpha. A completed Siriz residence, photographed for the projectwise gallery.",
    quote: "We design your dream home.",
    tour: "https://sirizinteriors.com/siriz-Interiors-360-vtour/site-1/index.htm",
    story: [
      "Alpha is the first house in the Siriz projectwise gallery. The rooms were planned, designed, and built by the Chennai studio.",
      "A 360 tour of the finished house is on the Siriz site as Site 1, Alpha.",
    ],
    images: frames("project -1", "one", 11, "Alpha"),
  },
  {
    slug: "radiance",
    title: "Radiance",
    typology: "Residence",
    palette: "Siriz interior",
    scope: "Full home",
    summary: "Site 2, Radiance. A Siriz home with a walk-through of the finished rooms.",
    quote: "We design your dream home.",
    tour: "https://sirizinteriors.com/siriz-Interiors-360-vtour/site-2/index.htm",
    story: [
      "Radiance is Site 2 in the Siriz virtual tours. The stills here are the projectwise photographs of that house.",
    ],
    images: frames("project -2", "two", 6, "Radiance"),
  },
  {
    slug: "celesta",
    title: "Celesta",
    typology: "Residence",
    palette: "Siriz interior",
    scope: "Full home",
    summary: "Site 3, Celesta. Another Siriz house, kept together frame by frame.",
    quote: "We design your dream home.",
    tour: "https://sirizinteriors.com/siriz-Interiors-360-vtour/site-3/index.htm",
    story: [
      "Celesta is Site 3. The photographs are from the Siriz projectwise gallery.",
    ],
    images: frames("project -3", "three", 6, "Celesta"),
  },
  {
    slug: "site-four",
    title: "Site 4",
    typology: "Residence",
    palette: "Siriz interior",
    scope: "Full home",
    summary: "Site 4, Radiance. The fourth Siriz walk-through, with its own set of rooms.",
    quote: "We design your dream home.",
    tour: "https://sirizinteriors.com/siriz-Interiors-360-vtour/site-4/index.htm",
    story: [
      "Site 4 is the fourth Siriz virtual tour. These frames are the matching projectwise photographs.",
    ],
    images: frames("project -4", "four", 9, "Site 4"),
  },
  {
    slug: "project-five",
    title: "Project 5",
    typology: "Residence",
    palette: "Siriz interior",
    scope: "Full home",
    summary: "The fifth house in the Siriz projectwise gallery.",
    quote: "We design your dream home.",
    story: [
      "Project 5 is the fifth set of rooms published in the Siriz projectwise gallery.",
    ],
    images: frames("project -5", "five", 11, "Project 5"),
  },
]

export const projects = projectList.map((project) => ({
  ...project,
  cover: project.images[0].src,
  coverAlt: project.images[0].alt,
}))

const signatureShots = Array.from({ length: 13 }, (_, index) =>
  media(`img/signature-gallery-images/signature-${index + 1}.jpg`)
)

export const signatures = [
  {
    slug: "siriz-signature",
    title: "Siriz Signature",
    summary: "The studio's own signature rooms: special touches, custom design, and a finished interior.",
    image: signatureShots[0],
    imageAlt: "Siriz Signature interior",
    lede: "Transparent pricing, customised design, and a high-quality finish. These photographs are the Siriz signature gallery.",
    quote: "We design your dream home, the excellence of interior.",
    gallery: signatureShots.map((src, index) => ({
      src,
      alt: `Siriz Signature ${index + 1}`,
    })),
    chapters: [
      {
        no: "01",
        title: "Creativity",
        body: "The studio is driven by creativity and innovation in every project, bringing fresh ideas to the spaces it touches.",
      },
      {
        no: "02",
        title: "Custom design",
        body: "Each home is planned around the people who will live in it, from the first discussion with a designer through to the finished rooms.",
      },
      {
        no: "03",
        title: "Finish",
        body: "Transparent pricing, high quality, and a flawless output are the studio's own words for the work.",
      },
    ],
  },
  {
    slug: "mood-board",
    title: "Siriz Mood Board",
    summary: "Plates from the Siriz mood board: the surfaces and rooms the studio returns to.",
    image: media("img/siriz-mood-board/siriz-board-newpage-images/siriz-newpage-board-img-1.jpeg"),
    imageAlt: "A plate from the Siriz mood board",
    lede: "The mood board published by Siriz Interiors. Each plate is a finished interior from the studio.",
  },
]

export const moodBoard = Array.from({ length: 12 }, (_, index) => ({
  name: `Plate ${String(index + 1).padStart(2, "0")}`,
  note: "Siriz mood board",
  image: media(
    `img/siriz-mood-board/siriz-board-newpage-images/siriz-newpage-board-img-${index + 1}.jpeg`
  ),
  alt: `Siriz mood board plate ${index + 1}`,
}))

export const interiorImages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => ({
  src: media(
    `img/Interior-gallery-images/Interior-img-${number}.${number === 7 || number === 8 ? "png" : "jpg"}`
  ),
  alt: `Siriz interior gallery ${number}`,
  caption: `Interior ${String(number).padStart(2, "0")}`,
  room: "Interior",
  project: "Interior Gallery",
}))

export const rooms = ["All"]

export const videos = [
  {
    slug: "film-01",
    title: "Film 01",
    project: "Siriz Interiors",
    lede: "Experience the interiors in a few clicks, anytime.",
    youtube: "https://www.youtube.com/embed/pWiTEjKYmIg",
    frames: [
      {
        src: media("img/Thumbnail-images/thumnail-1.jpeg"),
        alt: "Siriz video gallery film 1",
        caption: "Film 01",
      },
    ],
  },
  {
    slug: "film-02",
    title: "Film 02",
    project: "Siriz Interiors",
    lede: "A film from the Siriz video gallery.",
    youtube: "https://www.youtube.com/embed/szXGKEWzWZ0",
    frames: [
      {
        src: media("img/Thumbnail-images/thumnail-2.jpeg"),
        alt: "Siriz video gallery film 2",
        caption: "Film 02",
      },
    ],
  },
  {
    slug: "film-03",
    title: "Film 03",
    project: "Siriz Interiors",
    lede: "A film from the Siriz video gallery.",
    youtube: "https://www.youtube.com/embed/U1j-lvLU_aQ",
    frames: [
      {
        src: media("img/Thumbnail-images/thumnail-3.jpeg"),
        alt: "Siriz video gallery film 3",
        caption: "Film 03",
      },
    ],
  },
  {
    slug: "film-04",
    title: "Film 04",
    project: "Siriz Interiors",
    lede: "A film from the Siriz video gallery.",
    youtube: "https://www.youtube.com/embed/zgIgP3ELJRA",
    frames: [
      {
        src: media("img/Thumbnail-images/thumnail-4.jpeg"),
        alt: "Siriz video gallery film 4",
        caption: "Film 04",
      },
    ],
  },
]

export const articles = [
  {
    slug: "living-room",
    title: "Living room interior design",
    summary: "Craft welcoming spaces for family time and for guests.",
    image: media("img/guides_images/guides3.JPG"),
    imageAlt: "Siriz living room guide",
    pull: "A living room should feel ready for the people who actually use it.",
    paragraphs: [
      "Siriz Interiors designs living rooms as welcoming spaces for family time and for entertaining guests.",
      "The studio plans the room with you, then shows the design in 3D before production begins at the factory.",
    ],
  },
  {
    slug: "modular-kitchen",
    title: "Modular kitchen design",
    summary: "Sleek, efficient kitchens for modern living. Modular kitchens begin at ₹69,000.",
    image: media("img/guides_images/guides4.JPG"),
    imageAlt: "Siriz kitchen guide",
    pull: "A modular kitchen is planned around how the room is actually cooked in.",
    paragraphs: [
      "Siriz offers modular kitchens with a choice of kitchen types, components, accessories, and decor.",
      "Published pricing for a modular kitchen begins at ₹69,000.",
    ],
  },
  {
    slug: "bedroom",
    title: "Bedroom interior design",
    summary: "A bedroom planned as a calm place to rest.",
    image: media("img/guides_images/guides3.JPG"),
    imageAlt: "Siriz bedroom guide",
    pull: "The bedroom should feel settled on the night you move in.",
    paragraphs: [
      "Siriz designs bedrooms as serene rooms for rest, including wardrobes with a choice of types, accessories, and doors.",
    ],
  },
  {
    slug: "kids-bedroom",
    title: "A guide to kids' bedroom interior design",
    summary: "Playful, functional, and safe spaces where children can grow.",
    image: media("img/guides_images/guides3.JPG"),
    imageAlt: "Siriz kids bedroom guide",
    pull: "A child's room cannot follow the same rules as the rest of the house.",
    paragraphs: [
      "Siriz designs kids' bedrooms as playful, functional, and safe spaces where children can grow.",
      "A child's room does not follow the same decor ideas as the rooms around it.",
    ],
  },
  {
    slug: "study-room",
    title: "Study room interior design",
    summary: "Focused, uncluttered rooms for work.",
    image: media("img/guides_images/guides4.JPG"),
    imageAlt: "Siriz study guide",
    pull: "A study should make it easy to begin.",
    paragraphs: [
      "Siriz plans study rooms as focused, uncluttered places that support work.",
    ],
  },
  {
    slug: "dining-room",
    title: "Dining room interior design",
    summary: "Rooms arranged for sitting down to a meal.",
    image: media("img/guides_images/guides4.JPG"),
    imageAlt: "Siriz dining guide",
    pull: "The dining room earns its place at the table.",
    paragraphs: [
      "Siriz designs dining rooms as elegant spaces for meals at home.",
    ],
  },
  {
    slug: "balcony",
    title: "Balcony design",
    summary: "Balconies turned into places to sit.",
    image: media("img/guides_images/guides3.JPG"),
    imageAlt: "Siriz balcony guide",
    pull: "A balcony can be a room if it is given a reason to sit.",
    paragraphs: [
      "Siriz converts balconies into corners for leisure and rest.",
    ],
  },
  {
    slug: "materials-and-finishes",
    title: "Materials and finishes",
    summary: "Materials chosen for a durable, finished interior.",
    image: media("img/guides_images/guides3.JPG"),
    imageAlt: "Siriz materials guide",
    pull: "The finish is part of the design, not a coat added at the end.",
    paragraphs: [
      "Siriz specifies materials and finishes for durable interiors, then builds the agreed work at the studio factory.",
      "Wooden work carries a ten-year warranty, claimed through the customer login.",
    ],
  },
]

export const reviews = [
  {
    name: "Ganesh Anand C",
    quote: "One of the best architects, who listens to the client's preference and enhances it to the current trend. An ideal person if you expect quality work.",
  },
  {
    name: "Sorna KS",
    quote: "Great work. Ideas are nice. Committed to the best output and budget friendly.",
  },
  {
    name: "Saravanan Vinayagam",
    quote: "They did the work on time and stayed committed. Skilled workers were on the job, and the team answered our queries properly.",
  },
  {
    name: "Amruth",
    quote: "Best interior designer. A very good job. My shop is like a mall now.",
  },
  {
    name: "Prakash Ranganathan",
    quote: "Best service. Very innovative, and I was satisfied. Budget friendly too.",
  },
  {
    name: "Nasreen Fathima",
    quote: "He makes a clever design and the final look is great.",
  },
  {
    name: "Kamar Kabir",
    quote: "Punctuality, the best interiors, and a punctual design consultant.",
  },
  {
    name: "Zhahir Hussain",
    quote: "Punctuality, quality, responsiveness, and value.",
  },
]

export const process = [
  { no: "01", title: "Meet a designer", body: "Speak with a Siriz designer to plan the home." },
  { no: "02", title: "Start designing", body: "The home is designed in discussion with the architect." },
  { no: "03", title: "View it in 3D", body: "The agreed design is shown before anything is built." },
  { no: "04", title: "Plan the work", body: "Production and execution are scheduled." },
  { no: "05", title: "The factory begins", body: "Work starts on the finalised materials." },
  { no: "06", title: "Move in", body: "The home is ready to live in." },
]

export const roomsOf = (room) =>
  room === "All" ? interiorImages : interiorImages.filter((image) => image.room === room)

export const getProject = (slug) => projects.find((project) => project.slug === slug)
export const getArticle = (slug) => articles.find((article) => article.slug === slug)
export const getSignature = (slug) => signatures.find((item) => item.slug === slug)
export const getVideo = (slug) => videos.find((film) => film.slug === slug)
