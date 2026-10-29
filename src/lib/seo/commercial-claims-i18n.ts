/**
 * Altı dilde (tr, en, ru, de, fr, ar) ticari iddia denetimi — saf fonksiyonlar (DB/ağ yok).
 * Site mezbaha makine ve ekipmanı sunar; anahtar teslim tesis, kurulum, devreye alma, tesis inşaatı/projelendirmesi veya
 * doğrulanmamış sertifika/garanti/servis ağı iddiası yapılamaz. Bu modül YALNIZCA raporlar; içerik değiştirmez.
 *
 * severity:
 *  - DEFINITE: firmanın sunmadığı hizmetin açık vaadi (anahtar teslim, devreye alma, kurulum hizmeti, tesis inşaatı, liderlik).
 *  - REVIEW:   bağlama bakılmalı (tasarım/proje ekibi, genel "kurulum" sözcüğü, sertifika, garanti, helal uyum).
 */
export type Locale6 = "tr" | "en" | "ru" | "de" | "fr" | "ar";
export type Severity = "DEFINITE" | "REVIEW";
export type RuleId = "TURNKEY" | "COMMISSIONING" | "INSTALL_SERVICE" | "CONSTRUCTION" | "SUPERLATIVE" | "SUPERLATIVE_SOFT" | "PLANT_DESIGN" | "INSTALL_WORD" | "CERTIFICATION" | "HALAL_CLAIM" | "WARRANTY_SERVICE";

type Rule = { id: RuleId; severity: Severity; re: Record<Locale6, RegExp> };

const RAW_RULES: Rule[] = [
  { id: "TURNKEY", severity: "DEFINITE", re: {
    en: /turn-?key/i, tr: /anahtar\s*teslim/i, ru: /под\s+ключ/i, de: /schl[üu]ssel-?fertig/i, fr: /cl[ée]s?\s+en\s+main/i,
    ar: /تسليم\s*(ال)?مفتاح|مفتاح\s*في\s*اليد/ } },
  { id: "COMMISSIONING", severity: "DEFINITE", re: {
    en: /\bcommission(ing|ed)\b/i, tr: /devreye\s*al|işletmeye\s*al|hizmete\s*al/i, ru: /(ввод\w*|введ[её]нн\w*)\s+в\s+эксплуатац|пуско-?наладк/i,
    de: /inbetriebnahme|in\s+betrieb\s+genommen|inbetriebsetzung/i, fr: /mise\s+en\s+(service|route|marche)|mis(e|es)?\s+en\s+service/i,
    ar: /بدء\s+التشغيل|التشغيل\s+التجريبي|تركيب\w*\s*(و|،)\s*تشغيل|وشغل(ت|ها)|شغلت/ } },
  { id: "INSTALL_SERVICE", severity: "DEFINITE", re: {
    en: /(professional|full|complete|on-?site|plant|new slaughterhouse) installation|installation (and|&) commissioning|plants? (installed|completed|built)|installed and commissioned|we (install|build|construct)\b/i,
    tr: /(profesyonel|komple|tam|tesis|mezbaha|fabrika)\s+(kurulum|montaj)|kurulum\s+(ve|&)\s+(devreye|bakım)|kurduğumuz|kurulan\s+(tesis|mezbaha)|tesis(ler)?\s+kur(ul|u)|kurulmuş\s+ve/i,
    ru: /монтаж\w*\s+(и|&)\s+(ввод|наладк|обслуж)|(установк\w+|монтаж\w*)\s+(завод|бойн|цех|лини|предприят)|(завод|бойн|предприяти)\w*\s+(установлен|смонтирован)|установленн\w+\s+(завод|бойн|предприят)|построенн\w+\s+и\s+введ/i,
    de: /(montage|installation|aufbau)\s+(und|&)\s+(inbetriebnahme|wartung)|installiert\w*\s+(und|&)|anlagen\w*\s+(installiert|errichtet)|(professionelle|komplette)\s+(installation|montage)/i,
    fr: /installation\s+(et|&)\s+mise|install[ée]\w*\s+(et|&)|usines?\s+install|installations?\s+(professionnelle|complète|sur\s+site)/i,
    ar: /تركيب\s*(و|&)\s*(تشغيل|صيانة)|تركيب\s+(المسالخ|المصانع|مصانع|المنشآت)|(منشآت|مصانع)\s+(تم\s+)?(تركيبها|مركبة)|ركبها|أنشئت\s+و/ } },
  { id: "CONSTRUCTION", severity: "DEFINITE", re: {
    en: /\bEPC\b|general contractor|design[- ]build|(slaughterhouse|plant|facility) (building|construction)|building design|built on a/i,
    tr: /inşaat|\binşa\b|bina\s*(tasarım|dizayn|yapım)|tesis\s*(yapım|inşa)|alan\s+üzerine\s+kurulu/i,
    ru: /строительств|проектирование\s+здани|скотобойн\w*\s+на\s+площади/i,
    de: /geb[äa]udeplanung|bauplanung|\berrichtung|bau\s+von\s+(schlacht|anlag)|schlachthof\s+auf\s+\d+/i,
    fr: /construction\s+d[eu']?[’\s]*(l[’']\s*)?(un[e]?\s+)?(nouvel\s+|nouveau\s+|nouvelle\s+)?(abattoir|usine|b[âa]timent|[ée]tablissement)|conception\s+d[ue]\s+(b[âa]timent|abattoir)|abattoir\s+de\s+\d+\s*m/i,
    ar: /بناء\s+(المسالخ|مسلخ|المصنع)|إنشاء\s+(المسالخ|مسلخ)|تصميم\s+(المباني|مبنى)|مسلخ\s+مقام/ } },
  { id: "SUPERLATIVE", severity: "DEFINITE", re: {
    en: /\bleader in\b|\b(a|the|our) leading\b|number one|world[- ]class|proven in the field/i,
    tr: /\blider\b|lideri|sahada\s+kanıtlanmış|birinci/i,
    ru: /лидер|проверенн\w+\s+в\s+(поле|эксплуатац)/i,
    de: /marktf[üu]hrer|bew[äa]hrt\w*\s+im\s+(einsatz|feld)|weltklasse/i,
    fr: /\bleader\b|num[ée]ro\s+un|[ée]prouv\w*\s+sur\s+le\s+terrain/i,
    ar: /رائد(ة)?\s+في|الرائد(ة)?\s+في|مجربة\s+في\s+الميدان|المركز\s+الأول/ } },
  { id: "SUPERLATIVE_SOFT", severity: "REVIEW", re: {
    en: /most modern|state-of-the-art|cutting-edge/i, tr: /en\s+modern|öncü|son\s+teknoloji/i, ru: /самы[еий]\s+современн|ведущ/i,
    de: /modernste|f[üu]hrend/i, fr: /plus\s+modernes?|pointe/i, ar: /الأحدث|الأفضل/ } },
  { id: "PLANT_DESIGN", severity: "REVIEW", re: {
    en: /plant (engineering|design)|facility design|project (team|experts)|plan your plant|capacity-specific|\bwe (design|plan)\b/i,
    tr: /tesis\s+(tasarım|mühendis|proje)|projelendir|proje\s+(ekib|uzman)|mezbaha\s+(tasarım|proje|dizayn)|kapasiteye\s+özel|birlikte\s+planlayal/i,
    ru: /проектирован\w+\s+(завод|бойн|предприят)|проектн\w+\s+(групп|команд|специалист)|спланир\w+\s+ваш\w*\s+(завод|предприят)/i,
    de: /anlagenplanung|projektierung|projektteam|projektexperten|planung\s+(der|von)\s+(anlage|schlacht)|planen\s+(wir|sie)\s+ihre\s+anlage/i,
    fr: /ing[ée]nierie|conception\s+d.usine|[ée]quipe\s+(de\s+)?projet|planifi\w+\s+(ensemble\s+)?votre\s+(usine|abattoir)|[ée]tude\s+et\s+conception/i,
    ar: /هندسة\s+(المصانع|المنشآت)|فريق\s+(المشاريع|المشروع)|تصميم\s+المسالخ|لنخطط|خطط\w*\s+(مصنعك|مسلخك|لمنشأتكم)/ } },
  { id: "INSTALL_WORD", severity: "REVIEW", re: {
    en: /\binstall(ation|ed|ing)?\b/i, tr: /kurulum|kuruldu|kurulan|kurulmuş|montaj/i, ru: /установк|установлен|монтаж/i,
    de: /installation|installiert|montage|aufbau/i, fr: /installation|install[ée]|montage/i, ar: /تركيب/ } },
  { id: "CERTIFICATION", severity: "REVIEW", re: {
    en: /\bUSDA\b|\bFSIS\b|\bFDA\b|\bHACCP\b|\bISO\s?\d|certif|approved by|fully compliant|in compliance with/i,
    tr: /\bUSDA\b|\bHACCP\b|\bISO\s?\d|sertifika|belgelen|onaylı|uyumlu/i,
    ru: /\bUSDA\b|\bHACCP\b|\bISO\s?\d|сертиф|одобрен|соответству/i,
    de: /\bUSDA\b|\bHACCP\b|\bISO\s?\d|zertifi|zugelassen|konform/i,
    fr: /\bUSDA\b|\bHACCP\b|\bISO\s?\d|certifi|agr[ée]|conforme/i,
    ar: /\bUSDA\b|\bHACCP\b|\bISO\s?\d|شهادة|معتمد|اعتماد|مطابق/ } },
  { id: "HALAL_CLAIM", severity: "REVIEW", re: {
    en: /halal[- ]compliant|100%\s*halal|compliant with.*halal/i, tr: /helal\s*(uyumlu|sertifikalı)|%\s*100\s*helal/i,
    ru: /халяль\w*\s*(сертифиц|соответств)|соответству\w+\s+(требован\w+\s+)?халяль/i, de: /halal-?(konform|zertifiziert)/i,
    fr: /conforme\s+(aux?\s+)?(normes\s+)?halal|halal\s+certifi/i, ar: /متوافق\w*\s+مع\s+(الحلال|الشريعة)|معتمد\s+حلال/ } },
  { id: "WARRANTY_SERVICE", severity: "REVIEW", re: {
    en: /warrant|after-sales|nationwide|service network/i, tr: /garanti|satış\s+sonrası|servis\s+ağı/i, ru: /гаранти|послепродаж|сервисн\w+\s+сет/i,
    de: /garantie|kundendienst|service-?netz|nach\s*verkauf/i, fr: /garantie|apr[èe]s-vente|r[ée]seau\s+de\s+service/i, ar: /ضمان|ما\s+بعد\s+البيع|شبكة\s+(الخدمة|خدمات)/ } },
];

/** JS'te \w yalnızca ASCII'dir; Kiril/Almanca/Fransızca/Arapça harfler için Unicode duyarlı (u bayrağı, \p{L}) sürüme çevrilir. */
const unicode = (re: RegExp) => new RegExp(re.source.replace(/\\w/g,"[\\p{L}\\p{N}_]"), re.flags.includes("u") ? re.flags : re.flags + "u");
export const RULES: Rule[] = RAW_RULES.map((r) => ({ ...r, re: Object.fromEntries(Object.entries(r.re).map(([l, re]) => [l, unicode(re)])) as Rule["re"] }));

const strip = (t: string) => t.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** Kapsam açıklaması/olumsuzlama cümleleri iddia sayılmaz (ör. "We do not offer … installation"). */
const DISCLAIMER: Record<Locale6, RegExp> = {
  en: /\b(do not|does not|don't|not) (offer|provide|perform|carry out)\b/i,
  tr: /(sunmuyoruz|sunmamaktadır|yapmamaktadır|yapmıyoruz|hizmeti\s+verilmemektedir)/i,
  ru: /(не\s+(оказыва|предоставля|выполня))/i,
  de: /(bieten\s+(wir\s+)?(keine?|nicht)|nicht\s+an)/i,
  fr: /(ne\s+(proposons|fournissons|réalisons)\s+pas)/i,
  ar: /(لا\s+(نقدم|نوفر|نقوم))/,
};

export type Hit = { rule: RuleId; severity: Severity; match: string; context: string };

export function scanText(raw: string, locale: Locale6): Hit[] {
  const text = strip(raw).replace(/[\u064B-\u0652\u0670]/g, ""); // Arapça harekeleri at
  if (!text) return [];
  const sentences = text.split(/(?<=[.!?؟。])\s+/);
  const hits: Hit[] = [];
  for (const sentence of sentences) {
    if (DISCLAIMER[locale].test(sentence)) continue;
    const found = new Set<RuleId>();
    for (const r of RULES) {
      const m = sentence.match(r.re[locale]);
      if (m) { found.add(r.id); hits.push({ rule: r.id, severity: r.severity, match: m[0], context: sentence.slice(0, 220) }); }
    }
    // Aynı cümlede kesin kural varsa genel "kurulum sözcüğü" tekrarını ekleme.
    if (found.has("INSTALL_SERVICE") || found.has("COMMISSIONING") || found.has("TURNKEY")) {
      for (let i = hits.length - 1; i >= 0; i--) if (hits[i].rule === "INSTALL_WORD" && hits[i].context === sentence.slice(0, 220)) hits.splice(i, 1);
    }
  }
  return hits;
}
