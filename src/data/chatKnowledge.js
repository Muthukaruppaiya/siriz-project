import { studio } from "./site"

export const suggestedQuestions = {
  en: [
    "What interior design services do you offer?",
    "How much does a 3BHK interior cost?",
    "Can I see 3D designs before execution?",
    "Do you provide modular kitchens?",
    "Can you design interiors within my budget?",
    "How can I book a consultation?",
  ],
  ta: [
    "நீங்கள் என்ன உள்துறை சேவைகள் வழங்குகிறீர்கள்?",
    "3BHK உள்துறைக்கு எவ்வளவு செலவாகும்?",
    "வேலைக்கு முன் 3D வடிவமைப்பை பார்க்க முடியுமா?",
    "மாட்யூலர் கிச்சன் செய்கிறீர்களா?",
    "என் பட்ஜெட்டில் வடிவமைக்க முடியுமா?",
    "ஆலோசனை எப்படி பதிவு செய்வது?",
  ],
}

export const leadFields = [
  { key: "name", en: "May I have your name?", ta: "உங்கள் பெயர் என்ன?" },
  { key: "phone", en: "What is the best mobile number to reach you?", ta: "தொடர்பு கொள்ள சிறந்த மொபைல் எண் என்ன?" },
  { key: "email", en: "What is your email address?", ta: "உங்கள் மின்னஞ்சல் முகவரி என்ன?" },
  { key: "location", en: "Where is the property located?", ta: "சொத்து எங்கே உள்ளது?" },
  { key: "propertyType", en: "Is it a 1BHK, 2BHK, 3BHK, villa, or a commercial space?", ta: "இது 1BHK, 2BHK, 3BHK, வில்லா, அல்லது வணிக இடமா?" },
  { key: "services", en: "Do you need complete home interiors, or specific areas like kitchen, living, and bedrooms?", ta: "முழு வீட்டு உள்துறையா, அல்லது கிச்சன், லிவிங், படுக்கையறை போன்ற குறிப்பிட்ட இடங்களா?" },
  { key: "budget", en: "Do you have an approximate budget in mind?", ta: "ஏறக்குறைய ஒரு பட்ஜெட் உள்ளதா?" },
  { key: "startDate", en: "When would you like the project to begin?", ta: "திட்டம் எப்போது தொடங்க விரும்புகிறீர்கள்?" },
  { key: "notes", en: "Any extra notes for the designer?", ta: "டிசைனருக்கான கூடுதல் குறிப்புகள் உள்ளனவா?" },
]

export const verified = {
  phone: studio.phone,
  phoneHref: studio.phoneHref,
  email: studio.email,
  whatsapp: studio.whatsapp,
  location: studio.location,
  delivery: "Forty-five days of guaranteed delivery.",
  warranty: "A ten-year warranty on the wooden work.",
  deliveryTa: "டெலிவரி நாற்பத்தைந்து நாட்கள்.",
  warrantyTa: "மர வேலைக்கு பத்து ஆண்டு உத்தரவாதம்.",
}

/** Local knowledge used when no AI API is configured. */
export const knowledge = [
  {
    id: "services",
    match: /service|offer|what do you|interior design|complete home|residential|commercial|living room|bedroom|kitchen|wardrobe|storage|false ceiling|lighting|furniture|renovation|சேவை|உள்துறை|கிச்சன்|வாட்ரோப்/,
    en: "Siriz covers complete home interiors, residential and commercial spaces, living rooms, bedrooms, modular kitchens, wardrobes and storage, false ceilings and lighting, custom furniture, and home renovation. Which of these would you like to plan first?",
    ta: "சிரிஸ் முழு வீட்டு உள்துறை, குடியிருப்பு மற்றும் வணிக இடங்கள், லிவிங், படுக்கையறை, மாட்யூலர் கிச்சன், வாட்ரோப் மற்றும் சேமிப்பு, ஃபால்ஸ் சீலிங் மற்றும் விளக்குகள், தனிப்பயன் தளபாடங்கள், புதுப்பித்தல் ஆகியவற்றைச் செய்கிறது. எதிலிருந்து தொடங்க விரும்புகிறீர்கள்?",
  },
  {
    id: "styles",
    match: /modern|contemporary|minimal|luxury|scandinavian|traditional|industrial|style|look|theme|ஸ்டைல்|நவீன|மினிமல்|லக்ஷரி/,
    en: "We can shape modern, contemporary, minimalist, luxury, Scandinavian, traditional, or industrial interiors. Tell me the rooms and the mood you prefer, and I will suggest a direction.",
    ta: "நவீன, கண்டெம்பரரி, மினிமலிஸ்ட், லக்ஷரி, ஸ்காண்டிநேவியன், பாரம்பரிய அல்லது இண்டஸ்ட்ரியல் உள்துறையை உருவாக்கலாம். அறைகளையும் விரும்பும் தோற்றத்தையும் சொல்லுங்கள்.",
  },
  {
    id: "materials",
    match: /plywood|mdf|hdhmr|laminate|acrylic|veneer|glass|hardware|material|finish|மரம்|லேமினேட்|அக்ரிலிக்|மேட்டீரியல்/,
    en: "Common choices include plywood, MDF, and HDHMR, with laminate, acrylic, veneer, or glass finishes, plus hardware and lighting suited to each room. The right mix depends on use, moisture, and budget. Which room are you finishing first?",
    ta: "பொதுவாக பிளைவுட், MDF, HDHMR மற்றும் லேமினேட், அக்ரிலிக், வெனியர் அல்லது கண்ணாடி முடிவுகள் பயன்படும். பயன்பாடு, ஈரப்பதம், பட்ஜெட் ஆகியவற்றைப் பொறுத்து தேர்வு மாறும். முதலில் எந்த அறை?",
  },
  {
    id: "kitchen",
    match: /modular kitchen|kitchen|கிச்சன்/,
    en: "Yes, we design modular kitchens with layouts, storage, finishes, and lighting planned around how you cook. Would you like a straight, L-shaped, or U-shaped kitchen?",
    ta: "ஆம், மாட்யூலர் கிச்சன் வடிவமைக்கிறோம். நேர், L வடிவம், அல்லது U வடிவம் எது வேண்டும்?",
  },
  {
    id: "3d",
    match: /3d|visual|render|drawing|floor plan|design before|பார்க்க|3டி|வரைபடம்/,
    en: "Yes. After the consultation and measurements, the design can be shown in 2D and 3D before manufacturing begins, so you can review the look first.",
    ta: "ஆம். ஆலோசனை மற்றும் அளவீட்டுக்குப் பிறகு, உற்பத்திக்கு முன் 2D மற்றும் 3D-ல் வடிவமைப்பைக் காட்டலாம்.",
  },
  {
    id: "budget",
    match: /price|cost|budget|quote|charge|how much|3bhk|2bhk|1bhk|விலை|பட்ஜெட்|செலவு/,
    en: "Costs depend on the home size, materials, and the rooms you choose. We do not quote a fixed number until we understand your plan. What is your approximate budget, and is this a 1BHK, 2BHK, 3BHK, or villa?",
    ta: "செலவு வீட்டின் அளவு, பொருட்கள், அறைகளைப் பொறுத்தது. திட்டம் தெரிந்த பிறகுதான் சரியான மதிப்பீடு. ஏறக்குறைய பட்ஜெட் என்ன? 1BHK, 2BHK, 3BHK, அல்லது வில்லாவா?",
  },
  {
    id: "process",
    match: /process|how it works|steps|execution|consultation|measure|manufactur|install|timeline|delivery|warranty|உத்தரவாதம்|டெலிவரி|எப்படி/,
    en: `A typical path is consultation, site measurement, floor-plan review, 2D and 3D visuals, material selection, manufacturing, then installation. ${verified.delivery} ${verified.warranty} Would you like to book a consultation?`,
    ta: `பொதுவாக ஆலோசனை, அளவீடு, தரைத் திட்டம், 2D மற்றும் 3D காட்சி, பொருள் தேர்வு, உற்பத்தி, பின்னர் நிறுவல். ${verified.deliveryTa} ${verified.warrantyTa} ஆலோசனை பதிவு செய்ய விரும்புகிறீர்களா?`,
  },
  {
    id: "book",
    match: /book|consult|enquiry|enquir|contact|visit|call|whatsapp|start|ஆலோசனை|பதிவு|தொடர்பு|அழை|வாட்ஸ்/,
    en: "I can start a short enquiry for the studio. Shall we begin with your name?",
    ta: "ஸ்டுடியோவுக்கு ஒரு சிறிய விசாரணையைத் தொடங்கலாம். உங்கள் பெயரிலிருந்து தொடங்கலாமா?",
  },
  {
    id: "contact",
    match: /phone|number|email|address|location|studio|where|தொலை|மின்னஞ்சல்|முகவரி|சென்னை|ஸ்டுடியோ/,
    en: `You can call ${verified.phone}, write to ${verified.email}, or visit ${verified.location}.`,
    ta: `அழைக்க ${verified.phone}, எழுத ${verified.email}, அல்லது வர ${verified.location}.`,
  },
]
