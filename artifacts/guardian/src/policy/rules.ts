import type { CategoryId, ContentType, Severity } from "../contract.ts";

/**
 * GYMX Community Guidelines expressed as reviewable rules.
 *
 * Principles:
 * - Rules flag; they do not judge intent on their own. Only high-confidence rules in
 *   high/critical categories can block content automatically. Everything else goes to review.
 * - Disclosure and risk discussion are allowed. Promotion, sourcing and dosing are not.
 * - Mentioning a topic ("starvation", "steroids") is never a violation by itself.
 */
export interface Rule {
  id: string;
  category: CategoryId;
  confidence: "high" | "medium";
  pattern: RegExp;
  /** Match against de-obfuscated text (default) or plain lower-cased text (emails, URLs). */
  on?: "folded" | "plain";
  severity?: Severity;
  only?: ContentType[];
  except?: ContentType[];
  /** Drop the finding when a negator ("don't", "never", "not") precedes it in the same sentence. */
  negatable?: boolean;
  /** Drop the finding when the speaker is describing themselves or others ("I use…", "he ran…"). */
  firstPersonExempt?: boolean;
  /** Whole-text cues that change the meaning (recovery talk, risk warnings, competition banter). */
  context?: { cue: RegExp; effect: "drop" | "downgrade" }[];
  /** Informational label to attach when the rule is defused. */
  defusedLabel?: CategoryId;
  note: string;
}

export interface LabelRule {
  id: string;
  label: CategoryId;
  pattern: RegExp;
}

/** Performance-enhancing substances. `gear` is excluded here because "gym gear" is common. */
const PED = String.raw`(?:steroids?|roids?|anabolics?|peds?|tren(?:bolone)?|testosterone|test (?:e|c|cyp|prop|enanthate|cypionate)|anavar|var|dbol|dianabol|winstrol|winny|deca|sarms?|ostarine|rad ?140|lgd(?:-?4033)?|mk ?677|hgh|growth hormone|clen(?:buterol)?|trt)`;
const PED_OR_GEAR = String.raw`(?:gear|${PED})`;

export const RISK_CUES = /\b(?:risks?|risky|dangerous|danger|side effects?|harm(?:ful)?|damaged?|warning|careful|regret(?:ted|s)?|consequences?|health (?:issues|problems)|heart (?:problems|issues|attack)|kidneys?|liver|infertil\w*|hair loss|gyno|not worth|wrecked|ruined|hospital|psa|scary|shut ?down)\b/;
export const RECOVERY_CUES = /\b(?:recover(?:y|ing|ed)?|relapse|therap(?:y|ist)|treatment|eat enough|please eat|fuel (?:your|my) body|nourish\w*|healing|healthy relationship with food|ed survivor|survivor|helpline|hotline|get help|reach out)\b/;
const COMPETITION_CUES = /\b(?:in|at) (?:the )?(?:comp|competition|meet|contest|challenge|leaderboard|tug of war)\b/;

export const NEGATORS = /\b(?:don'?t|do not|never|no one should|nobody should|avoid|shouldn'?t|should not|won'?t|wouldn'?t|not|isn'?t|aren'?t|can'?t|cannot|no need to|quit|stop telling (?:people|you) to)\b/;
export const FIRST_PERSON_TAIL = /\b(?:i|we|i've|i'd|i'm|they|he|she|who|people who|guys who|been)\s*$/;

const GROUPS = String.raw`(?:women|girls|men|gays?|gay people|lesbians?|trans(?:gender)? (?:people|women|men)|black people|blacks|white people|asians|latinos|mexicans|immigrants|muslims|jews|jewish people|christians|disabled people|fat people)`;

export const RULES: Rule[] = [
  // ── Drug sales or sourcing ───────────────────────────────────────────────
  {
    id: "drug.dm_for",
    category: "drug_sales",
    confidence: "high",
    pattern: new RegExp(String.raw`\b(?:dm|message|msg|hmu|hit me up|text|inbox|contact)\s+(?:me\s+)?(?:for|4)\s+(?:the\s+|some\s+|ur\s+|your\s+)?(?:${PED_OR_GEAR}|pins?|vials?|cycles?|plugs?|connects?)\b`),
    note: "Solicits private contact to supply PEDs.",
  },
  {
    id: "drug.buy_from",
    category: "drug_sales",
    confidence: "high",
    pattern: new RegExp(String.raw`\b(?:buy|get|order|cop|grab)\s+(?:your\s+|ur\s+|some\s+|the\s+)?${PED_OR_GEAR}\s+(?:from|thru|through|off|at)\b`),
    negatable: true,
    defusedLabel: "ped_risk_discussion",
    note: "Directs people to a PED supplier.",
  },
  {
    id: "drug.for_sale",
    category: "drug_sales",
    confidence: "high",
    pattern: new RegExp(String.raw`\b(?:selling|for sale|in stock|restock(?:ed)?|ships? (?:worldwide|discreetly)|discreet (?:shipping|delivery)|price list)\b.{0,50}?\b(?:${PED_OR_GEAR}|pins|vials|peptides)\b|\b(?:${PED_OR_GEAR}|peptides)\b.{0,50}?\b(?:for sale|in stock|available now|ships? (?:fast|discreetly|worldwide)|price list)\b`),
    note: "Advertises PEDs for sale.",
  },
  {
    id: "drug.source",
    category: "drug_sales",
    confidence: "medium",
    pattern: new RegExp(String.raw`\b(?:my|a|the|legit|trusted|reliable|good)\s+(?:source|plug|connect|supplier|ugl)\b.{0,40}?\b(?:${PED_OR_GEAR}|pins|vials)\b|\b${PED_OR_GEAR}\b.{0,40}?\b(?:source|plug|connect|supplier|ugl)\b`),
    negatable: true,
    context: [{ cue: RISK_CUES, effect: "drop" }],
    defusedLabel: "ped_risk_discussion",
    note: "Mentions a PED source; may be sourcing.",
  },
  {
    id: "drug.other",
    category: "drug_sales",
    confidence: "high",
    pattern: /\b(?:selling|plug for|dm (?:me )?for|got)\s+(?:coke|molly|xans?|percs?|oxys?|adderall|carts)\b/,
    note: "Offers controlled substances.",
  },

  // ── PED promotion (disclosure is allowed) ────────────────────────────────
  {
    id: "ped.use_imperative",
    category: "ped_promotion",
    confidence: "high",
    pattern: new RegExp(String.raw`\b(?:use|take|run|try|start|hop on|blast)\s+(?:some\s+)?${PED}\b`),
    negatable: true,
    firstPersonExempt: true,
    defusedLabel: "ped_risk_discussion",
    note: "Encourages others to use PEDs.",
  },
  {
    id: "ped.claim",
    category: "ped_promotion",
    confidence: "high",
    pattern: new RegExp(String.raw`\b${PED}\b.{0,30}?\b(?:to get (?:huge|big|jacked|shredded|massive)|(?:gets?|got) you (?:huge|big|jacked)|(?:is|are) the (?:only )?(?:way|secret|cheat code)|(?:work|works|worked) (?:great|amazing|wonders))`),
    negatable: true,
    context: [{ cue: RISK_CUES, effect: "downgrade" }],
    defusedLabel: "ped_risk_discussion",
    note: "Presents PEDs as the way to get results.",
  },
  {
    id: "ped.cycle_share",
    category: "ped_promotion",
    confidence: "high",
    pattern: new RegExp(String.raw`\b(?:here'?s|heres|this is|check out|my full|my current|full|current)\s+(?:my\s+)?(?:first\s+)?(?:${PED}|steroid|sarm)\s+(?:cycle|stack|protocol)\b|\b(?:cycle|stack|protocol)\s+(?:of|with)\s+${PED}\b|\bblast(?:ing)? and cruis\w*`),
    context: [{ cue: RISK_CUES, effect: "downgrade" }],
    note: "Shares a PED cycle or stack (instructional).",
  },
  {
    id: "ped.dosage",
    category: "ped_promotion",
    confidence: "high",
    pattern: new RegExp(String.raw`\b\d{2,4}\s?(?:mg|ml|iu|mcg)\b.{0,30}?\b(?:${PED}|test|per week|a week|e3d|eod|pin)\b|\b${PED}\b.{0,30}?\b\d{2,4}\s?(?:mg|ml|iu|mcg)\b`),
    negatable: true,
    note: "Gives PED dosing.",
  },
  {
    id: "ped.dosage_generic",
    category: "ped_promotion",
    confidence: "medium",
    pattern: /\btake (?:this|that|my|the following) (?:dose|dosage|amount)\b/,
    note: "Dosing instruction; substance unclear.",
  },
  {
    id: "ped.hop_on",
    category: "ped_promotion",
    confidence: "medium",
    pattern: /\b(?:everyone|everybody|you|u|y'?all|ya'?ll|people|bro|guys)\s+(?:should|need to|needs to|gotta|have to|must)\s+(?:just\s+)?hop on\b/,
    note: "Gym slang for starting PEDs; context unclear.",
  },

  // ── Eating disorder / starvation ─────────────────────────────────────────
  {
    id: "ed.starve",
    category: "eating_disorder",
    confidence: "high",
    pattern: /\b(?:starve yourself|starving yourself|stop eating|don'?t eat (?:for|anything)|skip (?:all your |every )?meals? (?:for|until)|fast for \d+ days straight|go (?:\d+|a few|several) days without (?:eating|food))\b/,
    negatable: true,
    context: [{ cue: RECOVERY_CUES, effect: "drop" }],
    note: "Encourages starving or not eating.",
  },
  {
    id: "ed.extreme_calories",
    category: "eating_disorder",
    confidence: "medium",
    pattern: /\b(?:eat|eating|stay|keep it)\s+(?:under|below|less than)\s+(?:[1-9]\d{2}|[1-9]\d?)\s*(?:cal(?:orie)?s?|kcal)\b|\b[1-9]\d{2}\s*(?:cal(?:orie)?s?|kcal)\s+(?:a|per)\s+day\b/,
    negatable: true,
    context: [{ cue: RECOVERY_CUES, effect: "drop" }, { cue: RISK_CUES, effect: "drop" }],
    note: "Promotes very-low-calorie intake.",
  },
  {
    id: "ed.pro_ana",
    category: "eating_disorder",
    confidence: "high",
    pattern: /\b(?:pro[- ]?ana|pro[- ]?mia|thinspo|meanspo|bonespo|if you'?re hungry,? you'?re (?:winning|doing it right)|hunger is (?:weakness|good)|empty is (?:good|beautiful)|purge after)\b/,
    context: [{ cue: RECOVERY_CUES, effect: "downgrade" }],
    note: "Pro-eating-disorder language.",
  },

  // ── Body shaming ─────────────────────────────────────────────────────────
  {
    id: "body.insult",
    category: "body_shaming",
    confidence: "high",
    pattern: /\b(?:fat (?:pig|cow|slob|ass|whale)|beached whale|landwhale|lard ?ass|fatso|blubber|nobody wants to see (?:that|your|his|her) (?:body|fat|gut|belly))\b|\bfatty\b(?!\s+(?:acids?|fish|foods?|liver|meats?|cuts?))/,
    note: "Degrading insult about someone's body.",
  },
  {
    id: "body.you_look",
    category: "body_shaming",
    confidence: "medium",
    pattern: /\b(?:you|u|ur|you'?re|your|he|she|his|her|this (?:guy|girl|dude|chick)|that (?:guy|girl|dude))\s+(?:is |are |looks? |looking )?(?:so |too |way too |hella |really )?(?:fat|obese|chunky|flabby|disgusting|gross|ugly|hideous|skinny fat|scrawny)\b(?!\s*(?:loss|burn|burning|free|intake|cells|percentage|%|grams?))/,
    note: "Comments negatively on someone's body.",
  },

  // ── Bullying / harassment ────────────────────────────────────────────────
  {
    id: "harass.self_harm",
    category: "harassment",
    confidence: "high",
    severity: "critical",
    pattern: /\b(?:kys|kill your ?self|go die|unalive your ?self|nobody would miss you|you should (?:just )?die|end it already)\b/,
    note: "Tells someone to harm themselves.",
  },
  {
    id: "harass.insult",
    category: "harassment",
    confidence: "medium",
    pattern: /\b(?:you'?re|you are|ur|u r|you|u)\s+(?:such\s+)?(?:a\s+|an\s+)?(?:fucking\s+)?(?:pathetic|worthless|loser|idiot|moron|clown|trash|garbage|waste of space|failure|dumbass|stupid)\b/,
    note: "Insults another user.",
  },
  {
    id: "harass.exclusion",
    category: "harassment",
    confidence: "medium",
    pattern: /\b(?:nobody|no one) (?:likes|cares about|wants) you\b|\b(?:quit|leave) the gym,? (?:nobody|no one)\b|\byou'?ll never (?:make it|be anything|look good)\b|\bgo back to (?:your|the) (?:pink dumbbells|yoga mat|kitchen)\b/,
    note: "Demeaning or exclusionary remark.",
  },

  // ── Threats or violence ──────────────────────────────────────────────────
  {
    id: "threat.direct",
    category: "threats_violence",
    confidence: "high",
    pattern: /\bi(?:'ll| will|'m going to|'m gonna| am going to| gonna)\s+(?:\w+\s+){0,2}?(?:beat|hurt|kill|stab|shoot|punch|murder|jump)\s+(?:you|u|ya|your (?:face|head|jaw)|him|her|them)\b/,
    context: [{ cue: COMPETITION_CUES, effect: "downgrade" }],
    note: "Direct threat of violence.",
  },
  {
    id: "threat.stalking",
    category: "threats_violence",
    confidence: "high",
    pattern: /\b(?:i know where you (?:live|train|work|lift)|i'?ll (?:find|catch) you|watch your back|you'?re (?:dead|finished) when i|see you in the parking lot|meet me outside)\b/,
    note: "Intimidation or stalking language.",
  },
  {
    id: "threat.weapon",
    category: "threats_violence",
    confidence: "high",
    pattern: /\b(?:bring(?:ing)? a (?:gun|knife) to|shoot up the gym|bomb the gym)\b/,
    note: "Weapon or mass-violence threat.",
  },

  // ── Hate speech (curated slur lexicon is loaded separately) ──────────────
  {
    id: "hate.dehumanize",
    category: "hate_speech",
    confidence: "high",
    pattern: new RegExp(String.raw`\b${GROUPS}\s+(?:are|r|is)\s+(?:all\s+)?(?:animals|vermin|subhuman|parasites|a disease|inferior|trash|garbage|disgusting|worthless)\b`),
    note: "Dehumanizes a protected group.",
  },
  {
    id: "hate.eliminate",
    category: "hate_speech",
    confidence: "high",
    pattern: new RegExp(String.raw`\b${GROUPS}\s+(?:should|need to|deserve to|must)\s+(?:all\s+)?(?:die|be (?:killed|exterminated|wiped out|gassed|deported))\b`),
    note: "Calls for harm against a protected group.",
  },
  {
    id: "hate.exclusion",
    category: "hate_speech",
    confidence: "medium",
    pattern: new RegExp(String.raw`\b${GROUPS}\s+(?:don'?t|do not|shouldn'?t|should not)\s+belong\s+(?:in|at)\s+(?:the\s+|a\s+|my\s+|this\s+)?(?:gym|weight room|squat rack|sport)\b`),
    note: "Excludes a protected group from the gym.",
  },

  // ── Sexual content / sexual harassment ───────────────────────────────────
  {
    id: "sexual.solicit",
    category: "sexual_content",
    confidence: "high",
    pattern: /\b(?:send (?:me )?(?:nudes|noods|pics of your (?:body|ass|butt|chest|boobs|tits)|something spicy)|show me (?:your|ur) (?:body|ass|butt|boobs|tits|chest) (?:in private|privately|in (?:the )?dms?))\b/,
    note: "Solicits sexual images.",
  },
  {
    id: "sexual.comment",
    category: "sexual_content",
    confidence: "medium",
    pattern: /\b(?:nice|sexy|juicy)\s+(?:ass|tits|boobs|rack)\b|\b(?:wanna|want to|i'?d)\s+(?:hit that|bang|fuck)\b|\b(?:porn|pornhub|xxx|nsfw|sex tape)\b/,
    note: "Sexualized comment or explicit reference.",
  },
  {
    id: "sexual.adult_promo",
    category: "sexual_content",
    confidence: "medium",
    pattern: /\b(?:onlyfans|only fans|fansly|link in bio for (?:spicy|exclusive|18\+)|spicy content|18\+ content)\b/,
    note: "Promotes adult content.",
  },

  // ── Privacy ──────────────────────────────────────────────────────────────
  {
    id: "privacy.dox",
    category: "privacy_violation",
    confidence: "high",
    pattern: /\b(?:(?:his|her|their) (?:real name|address|home address|number|phone number|location) (?:is|=|:)|(?:she|he|they) lives? (?:at|on)\b|here'?s (?:his|her|their) (?:address|number|info)|leak(?:ing|ed)? (?:his|her|their) (?:info|address|number)|dox(?:x)?(?:ed|ing)?)/,
    note: "Shares someone else's personal information.",
  },
  {
    id: "privacy.phone",
    category: "privacy_violation",
    confidence: "medium",
    on: "plain",
    except: ["direct_message"],
    pattern: /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/,
    note: "Contains a phone number.",
  },
  {
    id: "privacy.email",
    category: "privacy_violation",
    confidence: "medium",
    on: "plain",
    except: ["direct_message"],
    pattern: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/,
    note: "Contains an email address.",
  },
  {
    id: "privacy.address",
    category: "privacy_violation",
    confidence: "medium",
    on: "plain",
    except: ["direct_message"],
    pattern: /\b\d{1,5}\s+(?:[a-z]+\s){1,3}(?:st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|ct|court)\b/,
    note: "Contains a street address.",
  },
  {
    id: "privacy.covert_recording",
    category: "privacy_violation",
    confidence: "medium",
    pattern: /\b(?:caught|filmed|recorded|took (?:a )?(?:pic|photo|video)s? of)\s+(?:this|that|a|some)\s+(?:random\s+)?(?:guy|girl|dude|lady|woman|man|creep|kid)\b|\b(?:without (?:him|her|them) knowing|didn'?t know i was (?:filming|recording)|secretly (?:filmed|recorded))\b/,
    note: "Possible recording of someone without consent.",
  },

  // ── Dangerous fitness advice ─────────────────────────────────────────────
  {
    id: "danger.dnp",
    category: "dangerous_advice",
    confidence: "high",
    severity: "critical",
    pattern: /\b(?:dnp|dinitrophenol)\b/,
    negatable: true,
    context: [{ cue: RISK_CUES, effect: "drop" }],
    note: "DNP is a lethal industrial chemical sold as a fat burner.",
  },
  {
    id: "danger.push_through_pain",
    category: "dangerous_advice",
    confidence: "medium",
    pattern: /\b(?:push|train|lift|work|squat|deadlift|bench)\s+(?:through|thru)\s+(?:(?:the|any|that|sharp|joint|back|lower back|knee|shoulder|chest)\s+){0,2}(?:pain|injury|injuries|tear)\b|\bignore (?:the|that|your) (?:pain|injury|chest pain|dizziness)\b/,
    negatable: true,
    note: "Encourages training through pain or injury.",
  },
  {
    id: "danger.no_spotter",
    category: "dangerous_advice",
    confidence: "medium",
    pattern: /\b(?:max(?:ing)? out|1rm|one rep max)\b.{0,30}?\bwithout (?:a )?(?:spotter|safeties|safety bars)\b/,
    negatable: true,
    note: "Max attempts without safety measures.",
  },
  {
    id: "danger.stimulants",
    category: "dangerous_advice",
    confidence: "medium",
    pattern: /\b(?:dry ?scoop(?:ing)?|(?:\d+|double|triple) scoops? of pre(?:-?workout)?)\b/,
    negatable: true,
    context: [{ cue: RISK_CUES, effect: "drop" }],
    note: "Unsafe stimulant use.",
  },
  {
    id: "danger.dehydration",
    category: "dangerous_advice",
    confidence: "medium",
    pattern: /\b(?:stop drinking water|dehydrate yourself|no water for \d+ days|diuretics? to (?:dry out|cut|lean out))\b/,
    negatable: true,
    note: "Encourages dangerous dehydration.",
  },

  // ── False medical or supplement claims ───────────────────────────────────
  {
    id: "claim.cures",
    category: "false_medical_claims",
    confidence: "medium",
    pattern: /\b(?:supplement|pill|tea|powder|product|creatine|protein|detox|cleanse|shake|this stack)\s+(?:\w+\s+){0,2}?(?:cures?|reverses?|eliminates?)\s+(?:cancer|diabetes|autism|covid|depression|anxiety|heart disease|arthritis|everything)\b/,
    negatable: true,
    note: "Claims a product cures a disease.",
  },
  {
    id: "claim.miracle",
    category: "false_medical_claims",
    confidence: "medium",
    pattern: /\b(?:burns?|melts?|lose|drop)\s+\d+\s*(?:lbs?|pounds|kg)\s+(?:of fat\s+)?(?:overnight|in (?:a|one|\d+) (?:day|days|week))\b|\b(?:gain|build|add)\s+\d+\s*(?:lbs?|pounds|kg)\s+of (?:pure |lean )?muscle\s+in (?:a|one|\d+) (?:day|days|week)\b|\b(?:100% guaranteed|guaranteed (?:results|to (?:work|lose|gain))|doctors hate (?:this|him|her)|big pharma doesn'?t want you)\b/,
    negatable: true,
    note: "Unrealistic or guaranteed results claim.",
  },

  // ── Scams ────────────────────────────────────────────────────────────────
  {
    id: "scam.get_rich",
    category: "scam",
    confidence: "high",
    pattern: /\b(?:double|triple|10x|5x)\s+(?:your|ur)\s+(?:money|investment|crypto|bitcoin)\b|\binvest\w*\b.{0,40}?\b(?:guaranteed|daily (?:returns|profit)|passive income)\b|\b(?:you(?:'ve| have)? won|winner selected|claim your (?:prize|reward)|free (?:iphone|ps5|gift card))\b/,
    note: "Classic scam pattern.",
  },
  {
    id: "scam.payment",
    category: "scam",
    confidence: "medium",
    pattern: /\b(?:send|pay|venmo|cash ?app|zelle|paypal|wire)\b.{0,40}?(?:\$\s?\d+|\b\d+\s?(?:dollars|usd|bucks)\b|\bgift cards?\b|\bcrypto\b|\bbitcoin\b|\busdt\b)/,
    note: "Requests payment; could be legitimate coaching or a scam.",
  },
  {
    id: "scam.offsite",
    category: "scam",
    confidence: "medium",
    on: "plain",
    pattern: /\b(?:bit\.ly|tinyurl\.com|t\.me\/|whatsapp me|telegram me|dm me to (?:get rich|make money|earn))/,
    note: "Pushes users to off-platform links or contacts.",
  },

  // ── Copyright ────────────────────────────────────────────────────────────
  {
    id: "copyright.repost",
    category: "copyright_concern",
    confidence: "medium",
    pattern: /\b(?:not my (?:video|clip|content|pic|photo|edit)|credit (?:to|goes to) (?:the )?(?:owner|original|og)|(?:stole|stolen|ripped) (?:this|it) from|reposting? (?:from|this from)|found (?:this|it) on (?:tiktok|ig|instagram|youtube|twitter|reddit)|no copyright infringement intended|i don'?t own (?:this|the) (?:music|video|content))\b/,
    note: "Content may belong to someone else.",
  },

  // ── Usernames ────────────────────────────────────────────────────────────
  {
    id: "username.impersonation",
    category: "needs_human_review",
    confidence: "medium",
    only: ["profile_username"],
    pattern: /\b(?:official|admin|administrator|moderator|mod team|support|staff|gymx|gymverse|verified)\b/,
    note: "Username may impersonate GYMX staff or a verified account.",
  },
];

export const LABEL_RULES: LabelRule[] = [
  {
    id: "label.ped_disclosure",
    label: "ped_disclosure",
    pattern: new RegExp(String.raw`\b(?:not natty|not natural|natty or not|i'?m (?:on|enhanced|juicing|on trt|on cycle)|i (?:use|used|take|took|run|ran|tried) ${PED}|(?:was|is|am|i'?m) enhanced|enhanced (?:athlete|transformation|lifter)|i'?ve (?:used|taken|run|been on) ${PED}|(?:regret|regretted) (?:taking|using|running|doing) ${PED}|on trt)\b`),
  },
  {
    id: "label.safe_fitness",
    label: "safe_fitness",
    pattern: /\b(?:workout|squats?|bench|deadlifts?|pr|personal record|reps?|sets?|leg day|push day|pull day|cardio|protein|gains|hypertrophy|form|mobility|stretch\w*|gym|lift(?:ing|ed|s)?|miles|meal prep|macros|consistency|discipline|progress|transformation|routine|rest day)\b/,
  },
];

export const PED_MENTION = new RegExp(String.raw`\b${PED}\b`);
