/**
 * DE/FR/AR proje çevirileri (şablonlu): 19 referans projesi + 7 kapasite paketi. Girdi: %TEMP%/loc/project.json (i18n-dump-en.ts çıktısı),
 * çıktı: prisma/migration/data/loc/<dil>/project-a.json. Metinler sabit kalıplardır (ülke/şehir/tür/kapasite sözlüklerinden kurulur).
 * Kullanım: node prisma/migration/gen-loc-projects.cjs
 */
const fs = require("fs");
const path = require("path");
const pj = JSON.parse(fs.readFileSync(path.join(process.env.TEMP, "loc", "project.json"), "utf8"));

const COUNTRY = {
  Albania: ["Albanien", "Albanie", "ألبانيا"], Argentina: ["Argentinien", "Argentine", "الأرجنتين"], Azerbaijan: ["Aserbaidschan", "Azerbaïdjan", "أذربيجان"],
  "Bosnia and Herzegovina": ["Bosnien und Herzegowina", "Bosnie-Herzégovine", "البوسنة والهرسك"], Georgia: ["Georgien", "Géorgie", "جورجيا"],
  Kyrgyzstan: ["Kirgisistan", "Kirghizistan", "قيرغيزستان"], Morocco: ["Marokko", "Maroc", "المغرب"], Netherlands: ["Niederlande", "Pays-Bas", "هولندا"],
  "Puerto Rico": ["Puerto Rico", "Porto Rico", "بورتوريكو"], Qatar: ["Katar", "Qatar", "قطر"], Tajikistan: ["Tadschikistan", "Tadjikistan", "طاجيكستان"],
  Turkey: ["Türkei", "Turquie", "تركيا"], Turkmenistan: ["Turkmenistan", "Turkménistan", "تركمانستان"],
};
const CITY = {
  Pogradec: ["Pogradec", "Pogradec", "بوغرادتس"], "Buenos Aires": ["Buenos Aires", "Buenos Aires", "بوينس آيرس"], Baku: ["Baku", "Bakou", "باكو"],
  Gobustan: ["Gobustan", "Gobustan", "قوبستان"], Khachmaz: ["Chatschmaz", "Khachmaz", "خاتشماز"], Novkhani: ["Novxanı", "Novkhani", "نوخاني"],
  Tovuz: ["Tovuz", "Tovuz", "توفوز"], Prijedor: ["Prijedor", "Prijedor", "بريدور"], Khashuri: ["Chaschuri", "Khachouri", "خاشوري"],
  Bishkek: ["Bischkek", "Bichkek", "بشكيك"], Karakol: ["Karakol", "Karakol", "كاراكول"], Kenitra: ["Kenitra", "Kénitra", "القنيطرة"],
  Harderwijk: ["Harderwijk", "Harderwijk", "هاردرفايك"], "San Juan": ["San Juan", "San Juan", "سان خوان"], "Al Khor": ["Al Khor", "Al Khor", "الخور"],
  Dushanbe: ["Duschanbe", "Douchanbé", "دوشنبه"], Afyon: ["Afyon", "Afyon", "أفيون"], Corum: ["Çorum", "Çorum", "تشوروم"], Ashgabat: ["Aschgabat", "Achgabat", "عشق آباد"],
};
const TYPE = {
  "Micro Slaughterhouse": ["Mikro-Schlachthof", "Micro-abattoir", "مسلخ مصغّر"], "Hide Skinning": ["Häuteabzug", "Écorchage des peaux", "سلخ الجلود"],
  "Meat Processing": ["Fleischverarbeitung", "Transformation de viande", "معالجة اللحوم"], Slaughterhouse: ["Schlachthof", "Abattoir", "مسلخ"],
  "Rotational Cattle Box": ["Drehbare Rinderbox", "Box rotatif pour bovins", "صندوق دوّار للأبقار"],
  "Meat Processing Cold Room": ["Kühlraum für die Fleischverarbeitung", "Chambre froide de transformation de viande", "غرفة تبريد لمعالجة اللحوم"],
  "Modern Slaughterhouse": ["Moderner Schlachthof", "Abattoir moderne", "مسلخ حديث"], "Meat Factory": ["Fleischfabrik", "Usine de viande", "مصنع لحوم"],
};
const ANIMAL = { cattle: ["Rinder", "bovins", "رأس بقر"], sheep: ["Schafe", "ovins", "رأس غنم"], pig: ["Schweine", "porcs", "رأس خنزير"], carcass: ["Tierkörper", "carcasse", "ذبيحة"] };
const PER = { hour: ["pro Stunde", "par heure", "في الساعة"], shift: ["pro Schicht", "par équipe", "في الوردية"] };

function capacity(text, i) {
  return text.replace(/^Capacity:\s*/, "").replace(/\.$/, "").split(/,\s*/).map((part) => {
    const m = part.match(/^([\d.]+)\s+(kg|cattle|sheep|pig|carcass)(?:\/(hour|shift))?$/);
    if (!m) throw new Error("Kapasite çözülemedi: " + part);
    const [, n, what, per] = m;
    const unit = what === "kg" ? "kg" : ANIMAL[what][i];
    return [n, unit, per ? PER[per][i] : ""].filter(Boolean).join(" ").replace(/^(\S+) kg (.+)$/, "$1 kg $2");
  }).join(i === 2 ? "، " : ", ");
}

const LANGS = ["de", "fr", "ar"];
const out = { de: [], fr: [], ar: [] };

for (const p of pj) {
  const m = p.description.match(/^(.+?) project in (.+?), (.+?), a Slaughterhouse Technologies reference\.\s*(.*)$/);
  if (!m) continue;
  const [, type, city, country, cap] = m;
  LANGS.forEach((l, i) => {
    const T = TYPE[type][i], C = CITY[city][i], K = COUNTRY[country][i], CAP = capacity(cap, i);
    const name = `${K} / ${C} — ${T}`;
    let description, seoTitle;
    if (l === "de") { description = `${T} in ${C}, ${K} – ein Referenzprojekt von Mezbaha Teknolojileri. Kapazität: ${CAP}.`; seoTitle = `${T} ${C}, ${K} – Referenzprojekt`; }
    if (l === "fr") { description = `Projet ${T} à ${C}, ${K}, une référence Mezbaha Teknolojileri. Capacité : ${CAP}.`; seoTitle = `Projet ${T} ${C}, ${K}`; }
    if (l === "ar") { description = `مشروع ${T} في ${C}، ${K}، أحد مراجع تقنيات المسالخ. الطاقة الإنتاجية: ${CAP}.`; seoTitle = `مشروع ${T} ${C}، ${K}`; }
    out[l].push({ enSlug: p.slug, name, shortDescription: description, description, seoTitle, seoDescription: description });
  });
}

// Kapasite paketleri
const PK = {
  "c-50": { area: 350, cattle: 50, small: 100 },
  "c-50-plus": { area: 400, cattle: 70, small: 200, cold: 1, cut: "area", classic: true },
  "c-100": { area: 550, cattle: 100, small: 300, cold: 2 },
  "c-100-plus": { area: 680, cattle: 100, small: 300, cold: 3, cut: "room", plus: true },
  "c-100-xl": { area: 980, cattle: 150, small: 500, cold: 2 },
  "c-200": { area: 1200, cattle: 200, small: 700, cold: 3 },
  "c-300": { area: 2700, cattle: 300, small: 2000, cold: 4, big: true },
};
const T = {
  de: {
    c50s: (k) => `C-50 ist ein kompaktes, kleines Schlachthofprojekt für eine Kapazität von ${k.cattle} Rindern und ${k.small} Schafen auf etwa ${k.area} m².`,
    c50: (k) => `${T.de.c50s(k)} Es umfasst den Schlachtbereich, einen Innereienraum, einen Kühlraum, einen Bürobereich sowie die grundlegenden Maschinen und Ausrüstungen für die Rinder- und Schafschlachtung. Dank der wirtschaftlichen Investition, des einfachen Grundrisses und des hygienischen Prozessablaufs ist C-50 eine ideale Mini-Schlachthoflösung für Kommunen, Genossenschaften und kleine Fleischbetriebe.`,
    intro: (k) => {
      const cold = k.cold === 1 ? "einem Kühlraum" : `${k.cold} Tierkörper-Kühlräumen`;
      const store = k.cold === 1 ? "" : ", 2 Lagerräumen (-18/-40)";
      const cut = k.cut === "area" ? ", einem Fleischzerlegebereich" : k.cut === "room" ? ", einem Fleischzerlegeraum" : "";
      return `Ein Schlachthof auf ${k.area} m² für ${k.cattle} Rinder und ${k.small} Kleinwiederkäuer, mit Schlachthalle, Innereienraum, ${cold}${store}${cut} und einem Büro auf einer Zwischenebene.`;
    },
    tail: (k) => {
      if (k.classic) return " Er erfüllt alle Hygiene- und Rotfleischvorschriften. Hauptausrüstung: Rinderschlachtbox, Entblutungskran, Transferkran, Transferstation, klassische Enthäutemaschine, Pansenstation, Tierkörper-Spaltstation und Tierkörper-Spaltsäge.";
      const base = `Hauptausrüstung: ${k.big ? "Rundbetäubungsbox, Rinderschlachtbox, automatische Entblutungslinie" : "Rundbetäubungsbox"}, Entblutungskran, Transferkran, Transferstation, hydraulische Enthäutemaschine, Pansenstation, Tierkörper-Spaltstation und Tierkörper-Spaltsäge, Beinschneidschere, Brustbeinsäge`;
      return ` ${base}${k.plus ? ", Fleischzerlegesäge und Fleischzerlegetische" : ""}.`;
    },
    title: (n) => `${n} Kapazitätspaket`,
  },
  fr: {
    c50s: (k) => `Le C-50 est un projet d'abattoir compact et de petite taille pour une capacité de ${k.cattle} bovins et ${k.small} ovins sur environ ${k.area} m².`,
    c50: (k) => `${T.fr.c50s(k)} Il comprend la zone d'abattage, une salle de préparation des abats, une chambre froide, une zone de bureaux ainsi que les machines et équipements de base nécessaires aux processus d'abattage des bovins et des ovins. Grâce à un investissement économique, un plan d'implantation simple et un flux de process hygiénique, le C-50 est une solution idéale de mini-abattoir pour les municipalités, les coopératives et les petites entreprises de viande.`,
    intro: (k) => {
      const cold = k.cold === 1 ? "une chambre froide" : `${k.cold} chambres froides pour carcasses`;
      const store = k.cold === 1 ? "" : ", 2 chambres de stockage (-18/-40)";
      const cut = k.cut === "area" ? ", une zone de découpe de viande" : k.cut === "room" ? ", une salle de découpe de viande" : "";
      return `Un abattoir de ${k.area} m² pour ${k.cattle} bovins et ${k.small} petits ruminants, avec une salle d'abattage, une salle des abats, ${cold}${store}${cut} et un bureau en mezzanine.`;
    },
    tail: (k) => {
      if (k.classic) return " Il répond à toutes les exigences d'hygiène et à la réglementation sur les viandes rouges. Équipement principal : box d'abattage pour bovins, palan de saignée, palan de transfert, poste de transfert, machine à écorcher classique, poste de lavage des tripes, poste de fente des carcasses et scie à fendre les carcasses.";
      const base = `Équipement principal : ${k.big ? "box d'étourdissement rotatif, box d'abattage pour bovins, ligne de saignée automatique" : "box d'étourdissement rotatif"}, palan de saignée, palan de transfert, poste de transfert, machine à écorcher hydraulique, poste de lavage des tripes, poste de fente des carcasses et scie à fendre les carcasses, cisaille à pattes, scie à sternum`;
      return ` ${base}${k.plus ? ", scie à découper la viande et tables de découpe de viande" : ""}.`;
    },
    title: (n) => `Forfait de capacité ${n}`,
  },
  ar: {
    c50s: (k) => `C-50 مشروع مسلخ صغير ومدمج مصمم لطاقة إنتاجية قدرها ${k.cattle} من الأبقار و${k.small} من الأغنام على مساحة نحو ${k.area} م².`,
    c50: (k) => `${T.ar.c50s(k)} ويشمل منطقة الذبح وغرفة تجهيز الأحشاء وغرفة تبريد ومنطقة مكاتب والآلات والمعدات الأساسية اللازمة لعمليات ذبح الأبقار والأغنام. وبفضل هيكل الاستثمار الاقتصادي ومخطط التوزيع البسيط وتدفق العمليات الصحي، يُعد C-50 حلاً مثالياً لمسلخ صغير للبلديات والتعاونيات ومشاريع اللحوم الصغيرة.`,
    intro: (k) => {
      const cold = k.cold === 1 ? "غرفة تبريد" : `${k.cold} غرف تبريد للذبائح`;
      const store = k.cold === 1 ? "" : "، وغرفتي تخزين (-18/-40)";
      const cut = k.cut === "area" ? "، ومنطقة تقطيع اللحوم" : k.cut === "room" ? "، وغرفة تقطيع اللحوم" : "";
      return `مسلخ مُقام على مساحة ${k.area} م² لذبح ${k.cattle} من الأبقار و${k.small} من المجترات الصغيرة، ويضم صالة ذبح وغرفة أحشاء و${cold}${store}${cut} ومكتباً في طابق وسطي.`;
    },
    tail: (k) => {
      if (k.classic) return " ويلبّي جميع متطلبات النظافة ولوائح اللحوم الحمراء. المعدات الرئيسية: صندوق ذبح الأبقار، رافعة التنزيف، رافعة النقل، محطة النقل، آلة سلخ تقليدية، محطة الكرش، محطة شق الذبائح ومنشار شق الذبائح.";
      const base = `المعدات الرئيسية: ${k.big ? "صندوق التبنيج الدوّار، صندوق ذبح الأبقار، خط التنزيف الآلي" : "صندوق التبنيج الدوّار"}، رافعة التنزيف، رافعة النقل، محطة النقل، آلة السلخ الهيدروليكية، محطة الكرش، محطة شق الذبائح ومنشار شق الذبائح، مقص قطع الأرجل، منشار الصدر`;
      return ` ${base}${k.plus ? "، منشار تقطيع اللحوم وطاولات تقطيع اللحوم" : ""}.`;
    },
    title: (n) => `باقة ${n}`,
  },
};
for (const [slug, k] of Object.entries(PK)) {
  const p = pj.find((x) => x.slug === slug);
  LANGS.forEach((l) => {
    const t = T[l];
    const short = slug === "c-50" ? t.c50s(k) : t.intro(k);
    const desc = slug === "c-50" ? t.c50(k) : t.intro(k) + t.tail(k);
    const name = p.name;
    out[l].push({ enSlug: slug, name, shortDescription: short, description: desc, seoTitle: t.title(name), seoDescription: short });
  });
}

for (const l of LANGS) {
  const dir = path.join(__dirname, "data", "loc", l);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "project-a.json"), JSON.stringify(out[l], null, 1));
  console.log(l, out[l].length);
}
console.log(JSON.stringify(out.de.slice(0, 2), null, 1));
console.log(out.ar[out.ar.length - 1].description);
