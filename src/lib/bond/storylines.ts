export type StoryChoice = { id: string; label: string; reply: string; unlocks?: string };
export type StoryChapter = { title: string; prose: string; choices: StoryChoice[] };
export type Storyline = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  blurb: string;
  chapters: StoryChapter[];
};

type Seed = { id: string; title: string; category: string; tags: string[]; blurb: string; a: string; b: string; c: string; gift: string };

const SEEDS: Seed[] = [
  { id: "rain-check", title: "Rain check", category: "Romance", tags: ["rain", "home"], blurb: "She opens the door with wet hair and a look that says you are late on purpose.", a: "The rain followed you in.", b: "She takes your coat like it offended her.", c: "The kettle clicks. Neither of you moves.", gift: "A standing invitation when it rains" },
  { id: "late-text", title: "The late text", category: "Romance", tags: ["night", "texts"], blurb: "One message. Then she stops pretending she was asleep.", a: "Her typing bubble appears, vanishes, returns.", b: "She tells you what she is wearing. Then deletes it. Then says it out loud.", c: "Morning finds the thread still open.", gift: "Night-owl hours" },
  { id: "corner-booth", title: "Corner booth", category: "Night out", tags: ["bar"], blurb: "She saved the seat with her coat and a dare.", a: "The drink is already yours.", b: "Someone looks over. She does not share.", c: "The tab is closed. The night is not.", gift: "Her bar order" },
  { id: "hotel-key", title: "One key", category: "Away", tags: ["hotel"], blurb: "A key card. A floor high enough that the city is quiet.", a: "The curtains are already drawn.", b: "She tries the minibar and laughs at the prices.", c: "Checkout is a rumor.", gift: "A hotel night" },
  { id: "rooftop-hour", title: "Blue hour", category: "Outside", tags: ["rooftop"], blurb: "The roof, the wind, and the hour when the city turns its lamps on.", a: "She stole a bottle on the way up.", b: "The wind takes her hair. She lets it.", c: "You can see her window from here. She points.", gift: "Rooftop access" },
  { id: "empty-beach", title: "After the crowd", category: "Outside", tags: ["beach"], blurb: "The beach emptied. She stayed.", a: "Sand in her shoes. She kicks them off.", b: "The water is colder than her mood.", c: "The drive back can wait.", gift: "A beach evening" },
  { id: "kitchen-hour", title: "Taste this", category: "Home", tags: ["kitchen"], blurb: "She is cooking. The recipe is an excuse.", a: "She holds the spoon to your mouth.", b: "Something burns. She does not care.", c: "Dinner is plates on the counter.", gift: "Sunday kitchen" },
  { id: "mirror-room", title: "The mirror", category: "Private", tags: ["mirror"], blurb: "Dressing-room lights. She watches you watch.", a: "She asks which one.", b: "The rejected dress stays on the chair.", c: "The mirror keeps the last look.", gift: "Mirror lights" },
  { id: "slow-elevator", title: "Hold the door", category: "Dare", tags: ["elevator"], blurb: "Too many floors. She uses every one.", a: "The doors almost close on a stranger. She is glad they don't get in.", b: "A floor dings. Neither of you gets out.", c: "The lobby can wait.", gift: "A private floor" },
  { id: "after-argument", title: "Come here", category: "Heat", tags: ["fight"], blurb: "The fight ended in the middle of a sentence.", a: "She crosses the room first.", b: "The apology is not verbal.", c: "The lights stay low.", gift: "Makeup, her way" },
  { id: "library-lamp", title: "After hours", category: "Quiet", tags: ["books"], blurb: "One green lamp. The rest of the library is dark.", a: "She reads a line that was not in the book.", b: "A cart squeaks somewhere. You both freeze, then don't.", c: "She slips the book into your coat.", gift: "A borrowed line" },
  { id: "cabin-fire", title: "No signal", category: "Away", tags: ["cabin"], blurb: "The cabin has a fire and nothing else you need.", a: "Her bag never gets unpacked properly.", b: "The storm gets louder. She gets closer.", c: "Morning smells like smoke and her.", gift: "A cabin weekend" },
  { id: "night-pool", title: "The water's on", category: "Water", tags: ["pool"], blurb: "Underwater lights. She is already in.", a: "She flicks water at you like a verdict.", b: "The edge of the pool is colder than her hands.", c: "Towels are a later problem.", gift: "Night swims" },
  { id: "vinyl", title: "One song", category: "Home", tags: ["music"], blurb: "She puts a record on and does not sit down.", a: "The first song is a test.", b: "She turns it over herself.", c: "The needle lifts. She doesn't.", gift: "Her side of the record" },
  { id: "market-lights", title: "Evening market", category: "City", tags: ["market"], blurb: "String lights, too many people, her hand finding yours anyway.", a: "She feeds you something sweet.", b: "You lose the crowd and not each other.", c: "The last stall closes. You don't.", gift: "A standing Friday" },
  { id: "train-cabin", title: "Night train", category: "Away", tags: ["train"], blurb: "The world moves. The cabin does not have to.", a: "She takes the window seat, then doesn't stay there.", b: "A conductor passes. The smile she gives him is polite and final.", c: "Dawn is a station you can skip.", gift: "The next ticket" },
  { id: "office-after", title: "Everyone left", category: "Dare", tags: ["office"], blurb: "The office is dark except her lamp.", a: "She locks the door with a look.", b: "The chair is not built for this. You manage.", c: "The elevator ride down is suspiciously calm.", gift: "After hours" },
  { id: "gallery-close", title: "After close", category: "City", tags: ["art"], blurb: "The gallery is shut. She still has the code.", a: "Heels on stone. She walks slower than she needs to.", b: "She stands you in front of a painting and says nothing useful.", c: "The alarm stays quiet. You don't.", gift: "A private viewing" },
  { id: "cinema-row", title: "Back row", category: "Night out", tags: ["cinema"], blurb: "The film is good. She is better.", a: "She chose the seats.", b: "A quiet scene. She uses it.", c: "The credits roll. You missed the ending.", gift: "Back-row rights" },
  { id: "vineyard", title: "Last row of vines", category: "Day", tags: ["wine"], blurb: "Sunset in a vineyard. The tasting was an hour ago.", a: "She leaves the glass on a post.", b: "The row hides you from the house.", c: "The drive home is her hand on your knee.", gift: "Harvest evening" },
  { id: "bookstore", title: "Aisle three", category: "Quiet", tags: ["books"], blurb: "She reads the good line out loud, badly, on purpose.", a: "You are supposed to be finding a book.", b: "She finds a better use for the aisle.", c: "You buy something so the clerk stops looking.", gift: "Her margin notes" },
  { id: "pier-night", title: "The pier", category: "Outside", tags: ["water"], blurb: "Boards, black water, her coat around both of you.", a: "The wind is an excuse.", b: "A boat horn. She laughs into your shoulder.", c: "The walk back is slower.", gift: "Pier nights" },
  { id: "sauna", title: "Too warm to pretend", category: "Heat", tags: ["sauna"], blurb: "Wood, steam, and nowhere to hide a look.", a: "She pours water on the stones.", b: "Conversation gets shorter.", c: "The cold shower is a dare she accepts.", gift: "The hot room" },
  { id: "sunroom", title: "Late light", category: "Day", tags: ["sun"], blurb: "The sunroom is too bright for secrets. She tells one anyway.", a: "She is in yesterday's shirt.", b: "The cat judges you. She does not.", c: "The light goes. The afternoon doesn't.", gift: "Lazy Sundays" },
  { id: "reunion", title: "You came back", category: "Romance", tags: ["door"], blurb: "The trip is over in the doorway.", a: "Her hands are already on your coat.", b: "The suitcase stays in the hall.", c: "She tells you the house was too quiet.", gift: "Homecoming" },
  { id: "dare-cards", title: "Loser strips", category: "Play", tags: ["game"], blurb: "A bad card game with excellent stakes.", a: "She loses the first hand and smiles.", b: "The rules get worse. She wrote them.", c: "The deck ends on the floor.", gift: "House rules" },
  { id: "jealous-hour", title: "Who was that", category: "Heat", tags: ["jealous"], blurb: "She heard a name. She would like a correction.", a: "She is calm. That is worse.", b: "You explain. She listens with her mouth.", c: "The name is retired.", gift: "Her claim" },
  { id: "secret-hall", title: "Don't tell", category: "Dare", tags: ["secret"], blurb: "A hallway at a party that has not noticed you left.", a: "Music through the wall.", b: "She says you have four minutes.", c: "You return separately. It fools no one she cares about.", gift: "Hallway minutes" },
  { id: "bath-room", title: "I left the tap", category: "Home", tags: ["bath"], blurb: "The bath is drawn. She made room without asking if you would come.", a: "Steam on the mirror.", b: "She shifts. Water goes over the side.", c: "The towels are warm because she planned this.", gift: "Bath nights" },
  { id: "morning-sheet", title: "Stay", category: "Romance", tags: ["morning"], blurb: "Soft light. She has opinions about you leaving.", a: "Coffee is a rumor.", b: "She hides your phone.", c: "The day starts when she says.", gift: "Slow mornings" },
  { id: "dressing-date", title: "Wear this", category: "Play", tags: ["outfit"], blurb: "She lays two options on the bed. Both are a trap.", a: "She watches you choose.", b: "The rejected one was never real.", c: "You leave the apartment later than the reservation.", gift: "Her styling" },
  { id: "car-dash", title: "Don't start it", category: "Dare", tags: ["car"], blurb: "The car is parked. The dashboard is the only light.", a: "She turns the music down.", b: "A pair of headlights passes. You both wait.", c: "The windows fog a little. Enough.", gift: "Parked hours" },
  { id: "fireplace", title: "The rug", category: "Home", tags: ["fire"], blurb: "The fire does all the lighting she needs.", a: "She pulls the blanket halfway.", b: "A log shifts. Neither of you looks.", c: "The house is quiet in the right way.", gift: "Firelight" },
  { id: "boat-dusk", title: "Far enough", category: "Water", tags: ["boat"], blurb: "The shore is a suggestion.", a: "She cuts the little motor.", b: "The boat rocks. She uses it.", c: "You head in when the lights on land look pretty.", gift: "Open water" },
  { id: "penthouse", title: "Glass", category: "Away", tags: ["city"], blurb: "The whole city is the backdrop. She is the point.", a: "She doesn't close the curtains at first.", b: "Then she does, slowly.", c: "The view is still there in the morning.", gift: "High floor" },
  { id: "vow", title: "Say it again", category: "Romance", tags: ["vow"], blurb: "She wants the words, then the proof.", a: "Forehead to forehead.", b: "She repeats what you said, softer.", c: "The night becomes a promise with a body.", gift: "Her private name" },
  { id: "photos", title: "For your eyes", category: "Private", tags: ["photo"], blurb: "Not for a feed. For you.", a: "She sets the phone down, then picks it up.", b: "She shows you the frame before she sends it.", c: "The thread has one picture and no caption.", gift: "A private frame" },
  { id: "dance-floor", title: "The slow one", category: "Night out", tags: ["dance"], blurb: "The song changes. She does not let go.", a: "Her hand finds the back of your neck.", b: "The floor gets crowded. She doesn't yield an inch.", c: "Outside, her ears are ringing and she is smiling.", gift: "The slow song" },
  { id: "garden-path", title: "Path lights", category: "Outside", tags: ["garden"], blurb: "A private garden. The house is lit and far.", a: "Gravel under her heels.", b: "She stops where the lights thin out.", c: "You go back in like nothing. The grass knows.", gift: "Garden hours" },
  { id: "diner-two", title: "The neon booth", category: "Night out", tags: ["diner"], blurb: "Pie, bad coffee, and her foot against yours.", a: "She steals the cherry.", b: "The waitress refills a cup nobody is drinking.", c: "The parking lot is the second date.", gift: "Late pie" },
  { id: "stairwell", title: "Between floors", category: "Dare", tags: ["stairs"], blurb: "Concrete, echo, and a minute you keep extending.", a: "She listens for a door.", b: "None comes.", c: "You enter the party flushed and composed.", gift: "The back stairs" },
  { id: "seaside-room", title: "Window open", category: "Away", tags: ["sea"], blurb: "A seaside room. The curtain moves like it is breathing.", a: "Salt in the air.", b: "She pulls you to the window first.", c: "The tide is louder than the town.", gift: "A sea night" },
];

function chapters(seed: Seed): Storyline["chapters"] {
  const beats = [
    { title: "Open", prose: seed.a },
    { title: "The turn", prose: seed.b },
    { title: "Stay", prose: seed.c },
  ];
  return beats.map((beat, index) => ({
    title: beat.title,
    prose: `${beat.prose} She is a fictional adult, and so are you. The room feels like ${seed.blurb.charAt(0).toLowerCase()}${seed.blurb.slice(1)}`,
    choices: [
      {
        id: `${seed.id}-${index}-near`,
        label: index === 2 ? "Stay" : "Move closer",
        reply: index === 2 ? "She keeps you there." : "She lets the distance die.",
        unlocks: index === 2 ? seed.gift : undefined,
      },
      {
        id: `${seed.id}-${index}-tease`,
        label: index === 2 ? "Tease her first" : "Make her wait",
        reply: "She smiles like you will pay for that. She likes it.",
        unlocks: index === 2 ? `${seed.gift} — her way` : undefined,
      },
    ],
  }));
}

export const STORYLINES: Storyline[] = SEEDS.map((seed) => ({
  id: seed.id,
  title: seed.title,
  category: seed.category,
  tags: seed.tags,
  blurb: seed.blurb,
  chapters: chapters(seed),
}));

export function searchStorylines(query: string, category = "All", tag = ""): Storyline[] {
  const q = query.trim().toLowerCase();
  const t = tag.trim().toLowerCase();
  return STORYLINES.filter((story) => {
    if (category !== "All" && story.category !== category) return false;
    if (t && !story.tags.some((item) => item.includes(t))) return false;
    if (!q) return true;
    return [story.title, story.blurb, story.tags.join(" "), story.category].join(" ").toLowerCase().includes(q);
  });
}
