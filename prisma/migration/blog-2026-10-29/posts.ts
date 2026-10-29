/**
 * 29.10.2026 blog yazıları (3 yazı × 6 dil). İçerik YALNIZCA sitedeki ürün sayfalarında yayımlanmış bilgilere dayanır
 * (Pnömatik İç Organ Platformu, Ayak Kesme Makası, Pnömatik Aktarma Platformu); yeni teknik değer/sertifika/garanti/üretici
 * iddiası YOKTUR. Anahtar teslim, kurulum, devreye alma, "manufacturer" ve hide-puller ifadeleri kullanılmaz.
 * ABD SEO anahtar kelimeleri (EN, başlık/H2/ilk paragraf/meta'da doğal biçimde):
 *   Yazı 1: pneumatic evisceration platform, evisceration platform for cattle, offal transfer platform, height adjustable platform slaughterhouse, stainless steel evisceration platform
 *   Yazı 2: hydraulic leg and horn cutter, cattle leg cutter, cattle horn cutter, hydraulic shears slaughterhouse, leg and horn cutting saw, 60 Hz hydraulic power unit
 *   Yazı 3: pneumatic work platform, adjustable height platform slaughterhouse, fixed vs pneumatic platform, foot-controlled platform, slaughterhouse transfer platform
 * Etiketler (BlogTag) sitede tek dillidir (Türkçe) ve yalnızca TR sayfalarında gösterilir; EN için anahtar kelimeler metinde yer alır.
 */
export type Loc = "tr" | "en" | "ru" | "de" | "fr" | "ar";
export type Doc = { intro: string[]; sections: { h: string; p?: string[]; ul?: string[] }[]; faq: { h: string; items: [string, string][] } };
export type LocaleData = { slug: string | null; title: string; excerpt: string; seoTitle: string; seoDescription: string; imageAlt: string; doc: Doc };
export type Post = {
  key: number;
  slug: string; // kanonik (Türkçe) slug
  productSlug: string; // Product.slug (iç bağlantı)
  cover: { file: string; originalName: string; seoName: string };
  tags: string[]; // Türkçe etiket adları
  locales: Record<Loc, LocaleData>;
};

export const html = (d: Doc): string =>
  [
    ...d.intro.map((p) => `<p>${p}</p>`),
    ...d.sections.flatMap((s) => [`<h2>${s.h}</h2>`, ...(s.p ?? []).map((p) => `<p>${p}</p>`), ...(s.ul ? [`<ul>\n${s.ul.map((li) => `<li>${li}</li>`).join("\n")}\n</ul>`] : [])]),
    `<h2>${d.faq.h}</h2>`,
    ...d.faq.items.flatMap(([q, a]) => [`<h3>${q}</h3>`, `<p>${a}</p>`]),
  ].join("\n");

/* ======================================================================================================= */
/* YAZI 1 — Pnömatik İç Organ Platformu                                                                    */
/* ======================================================================================================= */
const p1: Post = {
  key: 1,
  slug: "pnomatik-ic-organ-platformu-ayarlanabilir-yukseklik-hijyen",
  productSlug: "pnomatik-iskembe-platformu",
  cover: { file: "cover-1.webp", originalName: "EVISCERA PNEUMATIC PLATFORM.jpeg", seoName: "pneumatic-evisceration-platform-cover" },
  tags: ["Pnömatik İç Organ Platformu", "Pnömatik Platform", "İç Organ Platformu", "Mezbaha Platformları", "İşkembe Aktarımı", "Büyükbaş Mezbaha Ekipmanları", "Paslanmaz Çelik Mezbaha Ekipmanları", "Mezbaha Hijyeni", "Kesimhane Ekipmanları"],
  locales: {
    tr: {
      slug: null,
      title: "Büyükbaş Mezbahalarda Pnömatik İç Organ Platformu: Ayarlanabilir Yükseklik, Hijyen ve İç Organ Aktarımı",
      excerpt: "Büyükbaş iç organ hattında pnömatik iç organ platformunun görevi, dikkat edilecek özellikler ve teklif istemeden önce tedarikçiye sorulacaklar.",
      seoTitle: "Büyükbaş Pnömatik İç Organ Platformu",
      seoDescription: "Ayarlanabilir pnömatik iç organ platformu: işkembe ve iç organların bant konveyöre aktarımı, 304 paslanmaz çelik, ayak kumandası, lavabo ve bıçak sterilizatörü.",
      imageAlt: "Pnömatik iç organ platformunun 3B görseli: korkuluklu paslanmaz çelik çalışma platformu, sarı ayak pedalları ve lavabo, mezbaha salonunda",
      doc: {
        intro: [
          "Büyükbaş kesim hattında iç organ istasyonu, işkembe ve diğer iç organların karkastan ayrılıp iç organ hattına geçtiği noktadır. Operatör ağır ve kaygan bir malzemeyle çalışır; bu yüzden çalışma platformunun yüksekliği, hareket şekli ve temizlenebilirliği önemlidir. Pnömatik iç organ platformu bu üç noktaya göre tasarlanmış bir ekipmandır.",
          "Bu yazıda platformun ne işe yaradığını, hangi özelliklere bakılması gerektiğini ve teklif istemeden önce neler sorulabileceğini bulacaksınız. Aşağıdaki teknik bilgiler Mezbaha Teknolojileri ürün sayfasından alınmıştır; her değeri kendi hattınız için teyit edin.",
        ],
        sections: [
          { h: "Pnömatik iç organ platformu nedir?", p: ["İşkembe ve iç organların bant konveyöre aktarımını destekleyen, yüksekliği ayarlanabilir bir çalışma platformudur. Platformu pnömatik silindir kaldırır ve indirir; operatör hareketi ayak pedalıyla yönetir, böylece iki eli bıçak işine serbest kalır."] },
          { h: "Ayarlanabilir çalışma yüksekliği neden önemli?", p: ["Hayvanların boyu da operatörlerin boyu da farklıdır. Sabit bir platform herkesi tek bir yükseklikte çalışmaya zorlar. Ayarlanabilir platformda operatör, hayvana ve kendi çalışma konumuna uygun seviyeyi seçer; bu da iç organların konveyöre daha rahat ve kontrollü aktarılmasına yardımcı olur."] },
          { h: "İncelenecek temel özellikler", ul: ["<strong>Tahrik:</strong> ayak kumandalı pnömatik hareket; operatör aletini bırakmak zorunda kalmaz.", "<strong>Malzeme:</strong> yıkamaya uygun paslanmaz çelik gövde (listelenen modelde 304 kalite paslanmaz çelik profil).", "<strong>Entegre ekipman:</strong> lavabo ve bıçak sterilizatörü, gerekli donanımı çalışma noktasında toplar.", "<strong>Kullanıcı düzeni:</strong> bir operatör için tasarlanmıştır.", "<strong>Aktarım yönü:</strong> işkembe ve iç organlar bant konveyöre aktarılır."] },
          { h: "Pnömatik İç Organ Platformu için listelenen teknik bilgiler", ul: ["Tahrik sistemi: 100 × 1.200 pnömatik silindir", "Kontrol: ayak kumandalı", "Gövde: komple 304 kalite paslanmaz çelik profil", "Entegre ekipman: lavabo ve bıçak sterilizatörü", "Çalışma seviyesi: yüksekliği ayarlanabilir"], p: ["Ürün sayfasında bu model için platform taşıma kapasitesi ve platform ölçüsü listelenmemiştir. Yerleşiminiz için gerekiyorsa bu değerleri teklifle birlikte yazılı olarak isteyin."] },
          { h: "İç organ hattına nasıl oturur?", p: ["Platform, organların alınıp iç organ konveyörüne verildiği noktada durur. Karkas rayına, konveyör yüksekliğine ve zemin drenajına göre konumu pratikte çalışma şeklini belirler; bilgi isterken basit bir yerleşim krokisi paylaşmak işi hızlandırır."] },
          { h: "Tedarikçiye sorulacak sorular", ul: ["Platformun kaldırma aralığı ve maksimum yükü nedir?", "Silindir için hangi basınçlı hava beslemesi (basınç ve debi) gerekir; hava filtresi dahil mi?", "Lavabo ve sterilizatör su ve tahliye düzeninize uygun bağlantılarla verilebilir mi?", "Hangi yedek parçaları (conta, pedal, hortum) stokta tutmalısınız?", "Kayıtlarınız için çizim ve yedek parça listesi alınabilir mi?"] },
        ],
        faq: { h: "Sık sorulan sorular", items: [["Platform elle mi yoksa ayakla mı kullanılır?", "Ayakla. Listelenen model ayak kumandalı pnömatik sistem kullanır; operatörün iki eli serbest kalır."], ["Platformda kaç operatör çalışır?", "Bir operatör için tasarlanmıştır."], ["Lavabo dahil mi?", "Evet, listelenen model lavabo ve bıçak sterilizatörünü platformla birlikte sunar."], ["Tam teknik özellikleri nerede görebilirim?", "Aşağıdaki Pnömatik İç Organ Platformu ürün sayfasında. Teklif için hat yerleşiminizi ve adedi teklif formundan iletin."]] },
      },
    },
    en: {
      slug: "pneumatic-evisceration-platform-adjustable-height-offal-transfer",
      title: "Pneumatic Evisceration Platforms for Cattle Slaughterhouses: Adjustable Height, Hygiene and Offal Transfer",
      excerpt: "What a pneumatic evisceration platform does on the cattle offal line, which features matter, and what to ask a supplier before you request a quote.",
      seoTitle: "Pneumatic Evisceration Platform for Cattle",
      seoDescription: "Height-adjustable pneumatic evisceration platform for cattle: offal transfer to a belt conveyor, 304 stainless steel, foot control, sink and knife sterilizer.",
      imageAlt: "Render of a pneumatic evisceration platform: stainless steel work deck with handrails, yellow foot pedals and a wash basin in a slaughterhouse hall",
      doc: {
        intro: [
          "On a cattle slaughter line, the evisceration station is where tripe (paunch) and other internal organs leave the carcass and move to the offal line. Operators handle heavy, slippery material, so the height of the work deck, the way the platform moves and how easy it is to keep clean all matter. A pneumatic evisceration platform is built around those three points.",
          "This article explains what the platform does, which features to look at and what to ask before you request a quote. The technical data below comes from the Mezbaha Teknolojileri product page; confirm every value for your own line.",
        ],
        sections: [
          { h: "What is a pneumatic evisceration platform?", p: ["It is a height-adjustable work platform that supports the transfer of tripe and internal organs to a belt conveyor. A pneumatic cylinder raises and lowers the deck, and the operator controls the movement with a foot pedal, which keeps both hands free for knife work."] },
          { h: "Why adjustable working height matters", p: ["Animals differ in size, and so do operators. A fixed deck forces everyone to work at one height. An adjustable deck lets the operator set the level that suits the animal and their own working position, which supports a more comfortable and more controlled transfer of organs onto the conveyor."] },
          { h: "Key features to review", ul: ["<strong>Drive:</strong> foot-controlled pneumatic movement, so the operator does not have to put tools down.", "<strong>Material:</strong> a stainless steel body for wash-down conditions (the listed model uses 304-grade stainless steel profile).", "<strong>Integrated equipment:</strong> a sink and a knife sterilizer keep essential items at the work station.", "<strong>Operator arrangement:</strong> designed for one operator.", "<strong>Transfer direction:</strong> tripe and offal are passed to a belt conveyor."] },
          { h: "Technical data listed for the Pneumatic Evisceration Platform", ul: ["Drive system: 100 × 1,200 pneumatic cylinder", "Control: foot-controlled", "Body: complete 304-grade stainless steel profile", "Integrated equipment: sink and knife sterilizer", "Working level: height-adjustable"], p: ["The product page does not list a load rating or deck dimensions for this model. If these values matter for your layout, ask for them in writing with your quote."] },
          { h: "How it fits the offal line", p: ["The platform sits where organs are removed and handed to the offal conveyor. Its position relative to the carcass rail, the conveyor height and the floor drainage all affect how it works in practice, so share a simple layout sketch when you ask for information."] },
          { h: "Questions to ask a supplier", ul: ["What is the lifting range of the deck, and what is the maximum load?", "What compressed-air supply (pressure and flow) does the cylinder need, and is an air filter included?", "Can the sink and sterilizer be supplied with connections that suit your water and drain layout?", "Which spare parts (seals, pedals, hoses) should you keep in stock?", "Can drawings and a parts list be provided for your records?"] },
        ],
        faq: { h: "Frequently asked questions", items: [["Is the platform operated by hand or by foot?", "By foot. The listed model uses a foot-controlled pneumatic system, so the operator keeps both hands free."], ["How many operators work on it?", "It is designed for one operator."], ["Does it include a sink?", "Yes. The listed model combines a sink and a knife sterilizer with the platform."], ["Where can I see the full specification?", "On the Pneumatic Evisceration Platform product page, linked below. For a quotation, send your line layout and the quantity you need through the quote form."]] },
      },
    },
    ru: {
      slug: "pnevmaticheskaya-platforma-vnutrennih-organov-regulirovka-vysoty",
      title: "Пневматическая платформа для внутренних органов на бойне КРС: регулировка высоты, гигиена и передача субпродуктов",
      excerpt: "Что делает пневматическая платформа для внутренних органов на линии субпродуктов КРС, на какие характеристики смотреть и что спросить у поставщика перед запросом предложения.",
      seoTitle: "Пневматическая платформа для субпродуктов КРС",
      seoDescription: "Пневматическая платформа с регулировкой высоты для внутренних органов КРС: передача рубца и субпродуктов на ленточный конвейер, нержавеющая сталь 304, ножное управление.",
      imageAlt: "3D-изображение пневматической платформы для внутренних органов: рабочая площадка из нержавеющей стали с поручнями, жёлтыми ножными педалями и раковиной в цехе убоя",
      doc: {
        intro: [
          "На линии убоя КРС пост извлечения внутренних органов — это место, где рубец и другие внутренние органы отделяются от туши и передаются на линию субпродуктов. Оператор работает с тяжёлым и скользким материалом, поэтому важны высота рабочей площадки, принцип её движения и простота очистки. Пневматическая платформа для внутренних органов построена вокруг этих трёх задач.",
          "В статье описано, для чего нужна платформа, на какие характеристики смотреть и что спросить перед запросом предложения. Технические данные взяты со страницы изделия Mezbaha Teknolojileri; подтвердите каждое значение для вашей линии.",
        ],
        sections: [
          { h: "Что такое пневматическая платформа для внутренних органов?", p: ["Это рабочая платформа с регулировкой высоты, которая облегчает передачу рубца и внутренних органов на ленточный конвейер. Пневматический цилиндр поднимает и опускает площадку, а оператор управляет движением ножной педалью, поэтому обе руки остаются свободными для работы ножом."] },
          { h: "Почему важна регулировка рабочей высоты", p: ["Животные и операторы бывают разного роста. Неподвижная площадка заставляет всех работать на одной высоте. Регулируемая площадка позволяет выбрать уровень под животное и под собственное рабочее положение, что помогает более удобно и контролируемо передавать органы на конвейер."] },
          { h: "Ключевые характеристики", ul: ["<strong>Привод:</strong> пневматическое движение с ножным управлением — оператору не нужно откладывать инструмент.", "<strong>Материал:</strong> корпус из нержавеющей стали для влажной уборки (в указанной модели — профиль из нержавеющей стали марки 304).", "<strong>Встроенное оборудование:</strong> раковина и стерилизатор для ножей находятся на рабочем месте.", "<strong>Рабочее место:</strong> рассчитано на одного оператора.", "<strong>Направление передачи:</strong> рубец и субпродукты передаются на ленточный конвейер."] },
          { h: "Технические данные, указанные для пневматической платформы", ul: ["Привод: пневматический цилиндр 100 × 1 200", "Управление: ножное", "Корпус: профиль из нержавеющей стали марки 304", "Встроенное оборудование: раковина и стерилизатор для ножей", "Рабочий уровень: регулируемая высота"], p: ["На странице изделия для этой модели не указаны грузоподъёмность и размеры площадки. Если эти значения важны для вашей планировки, запросите их письменно вместе с предложением."] },
          { h: "Как платформа вписывается в линию субпродуктов", p: ["Платформа стоит там, где органы извлекают и передают на конвейер субпродуктов. На работу влияют её положение относительно подвесного пути туши, высота конвейера и дренаж пола, поэтому при запросе приложите простую схему планировки."] },
          { h: "Вопросы поставщику", ul: ["Каков диапазон подъёма площадки и максимальная нагрузка?", "Какое питание сжатым воздухом (давление и расход) нужно цилиндру и входит ли воздушный фильтр?", "Можно ли поставить раковину и стерилизатор с подключениями под вашу схему воды и стока?", "Какие запасные части (уплотнения, педали, шланги) стоит держать на складе?", "Можно ли получить чертежи и перечень запасных частей для вашей документации?"] },
        ],
        faq: { h: "Часто задаваемые вопросы", items: [["Платформой управляют рукой или ногой?", "Ногой. В указанной модели используется пневматическая система с ножным управлением, обе руки оператора остаются свободными."], ["Сколько операторов работает на платформе?", "Она рассчитана на одного оператора."], ["Есть ли в комплекте раковина?", "Да, в указанной модели раковина и стерилизатор для ножей объединены с платформой."], ["Где посмотреть полную спецификацию?", "На странице изделия «Пневматическая платформа для внутренних органов» по ссылке ниже. Для предложения отправьте планировку линии и нужное количество через форму запроса."]] },
      },
    },
    de: {
      slug: "pneumatische-ausweideplattform-hoehenverstellbar-innereien",
      title: "Pneumatische Ausweideplattform für Rinderschlachthöfe: Höhenverstellung, Hygiene und Innereien-Transfer",
      excerpt: "Was eine pneumatische Ausweideplattform an der Innereienlinie leistet, welche Merkmale zählen und was Sie vor einer Angebotsanfrage beim Lieferanten klären sollten.",
      seoTitle: "Pneumatische Ausweideplattform für Rinder",
      seoDescription: "Höhenverstellbare pneumatische Ausweideplattform für Rinder: Innereien-Transfer auf ein Förderband, Edelstahl 304, Fußsteuerung, Waschbecken, Messersterilisator.",
      imageAlt: "3D-Darstellung einer pneumatischen Ausweideplattform: Arbeitsfläche aus Edelstahl mit Geländer, gelben Fußpedalen und Waschbecken in einer Schlachthalle",
      doc: {
        intro: [
          "An der Rinderschlachtlinie ist der Ausweidebereich die Stelle, an der Pansen und andere Innereien vom Schlachtkörper getrennt und zur Innereienlinie weitergegeben werden. Die Mitarbeitenden arbeiten mit schwerem, rutschigem Material; deshalb zählen die Höhe der Arbeitsfläche, die Art der Bewegung und die Reinigungsfreundlichkeit. Eine pneumatische Ausweideplattform ist auf diese drei Punkte ausgelegt.",
          "Dieser Beitrag erklärt, was die Plattform leistet, auf welche Merkmale Sie achten sollten und was Sie vor einer Angebotsanfrage klären können. Die technischen Angaben stammen von der Produktseite von Mezbaha Teknolojileri; bestätigen Sie jeden Wert für Ihre Linie.",
        ],
        sections: [
          { h: "Was ist eine pneumatische Ausweideplattform?", p: ["Es ist eine höhenverstellbare Arbeitsplattform, die den Transfer von Pansen und Innereien auf ein Förderband unterstützt. Ein Pneumatikzylinder hebt und senkt die Fläche; die Bewegung wird per Fußpedal gesteuert, sodass beide Hände für die Messerarbeit frei bleiben."] },
          { h: "Warum die Arbeitshöhe verstellbar sein sollte", p: ["Tiere und Mitarbeitende sind unterschiedlich groß. Eine feste Plattform zwingt alle auf dieselbe Höhe. Bei einer verstellbaren Plattform wählt die Person die Höhe passend zum Tier und zur eigenen Arbeitsposition – das unterstützt einen bequemeren und kontrollierteren Transfer der Organe auf das Förderband."] },
          { h: "Wichtige Merkmale", ul: ["<strong>Antrieb:</strong> pneumatische Bewegung mit Fußsteuerung – das Werkzeug muss nicht abgelegt werden.", "<strong>Material:</strong> Edelstahlkörper für Nassreinigung (das aufgeführte Modell nutzt Edelstahlprofil der Güte 304).", "<strong>Integrierte Ausstattung:</strong> Waschbecken und Messersterilisator am Arbeitsplatz.", "<strong>Besetzung:</strong> für eine Person ausgelegt.", "<strong>Transferrichtung:</strong> Pansen und Innereien werden auf ein Förderband übergeben."] },
          { h: "Aufgeführte technische Daten der Pneumatischen Ausweideplattform", ul: ["Antrieb: Pneumatikzylinder 100 × 1.200", "Steuerung: Fußsteuerung", "Körper: Edelstahlprofil Güte 304", "Integrierte Ausstattung: Waschbecken und Messersterilisator", "Arbeitsebene: höhenverstellbar"], p: ["Die Produktseite nennt für dieses Modell weder Traglast noch Plattformmaße. Wenn diese Werte für Ihr Layout wichtig sind, fordern Sie sie schriftlich mit dem Angebot an."] },
          { h: "Einbindung in die Innereienlinie", p: ["Die Plattform steht dort, wo die Organe entnommen und an das Innereienförderband übergeben werden. Position zur Schlachtkörperbahn, Förderhöhe und Bodenentwässerung beeinflussen die Praxis; legen Sie Ihrer Anfrage deshalb eine einfache Layoutskizze bei."] },
          { h: "Fragen an den Lieferanten", ul: ["Wie groß ist der Hubbereich und was ist die maximale Last?", "Welche Druckluftversorgung (Druck und Volumenstrom) braucht der Zylinder, und ist ein Luftfilter enthalten?", "Können Waschbecken und Sterilisator mit Anschlüssen passend zu Ihrem Wasser- und Abflussplan geliefert werden?", "Welche Ersatzteile (Dichtungen, Pedale, Schläuche) sollten Sie vorrätig halten?", "Sind Zeichnungen und eine Ersatzteilliste für Ihre Unterlagen erhältlich?"] },
        ],
        faq: { h: "Häufig gestellte Fragen", items: [["Wird die Plattform mit der Hand oder mit dem Fuß bedient?", "Mit dem Fuß. Das aufgeführte Modell nutzt ein fußgesteuertes pneumatisches System; beide Hände bleiben frei."], ["Wie viele Personen arbeiten daran?", "Sie ist für eine Person ausgelegt."], ["Ist ein Waschbecken enthalten?", "Ja, das aufgeführte Modell kombiniert Waschbecken und Messersterilisator mit der Plattform."], ["Wo finde ich die vollständige Spezifikation?", "Auf der unten verlinkten Produktseite der Pneumatischen Ausweideplattform. Für ein Angebot senden Sie Ihr Linienlayout und die Stückzahl über das Anfrageformular."]] },
      },
    },
    fr: {
      slug: "plateforme-evisceration-pneumatique-hauteur-reglable-abats",
      title: "Plateforme d’éviscération pneumatique pour abattoirs bovins : hauteur réglable, hygiène et transfert des abats",
      excerpt: "Le rôle d’une plateforme d’éviscération pneumatique sur la ligne des abats bovins, les caractéristiques qui comptent et les questions à poser au fournisseur avant une demande de devis.",
      seoTitle: "Plateforme d’éviscération pneumatique bovine",
      seoDescription: "Plateforme d’éviscération pneumatique à hauteur réglable pour bovins : transfert des abats vers un convoyeur, inox 304, commande au pied, lavabo et stérilisateur.",
      imageAlt: "Rendu 3D d’une plateforme d’éviscération pneumatique : plan de travail en inox avec garde-corps, pédales jaunes et lavabo dans une salle d’abattage",
      doc: {
        intro: [
          "Sur une ligne d’abattage bovin, le poste d’éviscération est l’endroit où la panse et les autres organes internes quittent la carcasse pour rejoindre la ligne des abats. Les opérateurs manipulent une matière lourde et glissante : la hauteur du plan de travail, le mode de déplacement de la plateforme et la facilité de nettoyage comptent donc beaucoup. Une plateforme d’éviscération pneumatique est conçue autour de ces trois points.",
          "Cet article explique son rôle, les caractéristiques à examiner et les questions à poser avant une demande de devis. Les données techniques proviennent de la fiche produit de Mezbaha Teknolojileri ; vérifiez chaque valeur pour votre propre ligne.",
        ],
        sections: [
          { h: "Qu’est-ce qu’une plateforme d’éviscération pneumatique ?", p: ["C’est une plateforme de travail à hauteur réglable qui facilite le transfert de la panse et des organes internes vers un convoyeur à bande. Un vérin pneumatique monte et descend le plateau ; l’opérateur commande le mouvement à la pédale, ce qui laisse ses deux mains libres pour le travail au couteau."] },
          { h: "Pourquoi une hauteur de travail réglable ?", p: ["Les animaux n’ont pas tous la même taille, les opérateurs non plus. Un plateau fixe impose la même hauteur à tous. Un plateau réglable permet de choisir le niveau adapté à l’animal et à sa propre position de travail, ce qui favorise un transfert des organes plus confortable et mieux maîtrisé."] },
          { h: "Caractéristiques à examiner", ul: ["<strong>Entraînement :</strong> mouvement pneumatique commandé au pied, sans poser les outils.", "<strong>Matériau :</strong> corps en inox adapté au lavage (le modèle indiqué utilise un profilé inox de nuance 304).", "<strong>Équipement intégré :</strong> lavabo et stérilisateur de couteaux au poste de travail.", "<strong>Organisation :</strong> conçue pour un seul opérateur.", "<strong>Sens du transfert :</strong> la panse et les abats sont transférés vers un convoyeur à bande."] },
          { h: "Données techniques indiquées pour la plateforme d’éviscération pneumatique", ul: ["Entraînement : vérin pneumatique 100 × 1 200", "Commande : au pied", "Corps : profilé inox complet de nuance 304", "Équipement intégré : lavabo et stérilisateur de couteaux", "Niveau de travail : hauteur réglable"], p: ["La fiche produit n’indique ni charge admissible ni dimensions du plateau pour ce modèle. Si ces valeurs comptent pour votre implantation, demandez-les par écrit avec votre devis."] },
          { h: "Intégration dans la ligne des abats", p: ["La plateforme se place là où les organes sont retirés puis remis au convoyeur des abats. Sa position par rapport au rail de carcasses, la hauteur du convoyeur et l’évacuation au sol influencent son fonctionnement ; joignez donc un schéma d’implantation simple à votre demande."] },
          { h: "Questions à poser au fournisseur", ul: ["Quelle est la course de levage du plateau et la charge maximale ?", "Quelle alimentation en air comprimé (pression et débit) le vérin exige-t-il, et un filtre à air est-il inclus ?", "Le lavabo et le stérilisateur peuvent-ils être fournis avec des raccordements adaptés à votre réseau d’eau et d’évacuation ?", "Quelles pièces de rechange (joints, pédales, flexibles) faut-il garder en stock ?", "Peut-on obtenir des plans et une liste de pièces pour vos dossiers ?"] },
        ],
        faq: { h: "Questions fréquentes", items: [["La plateforme se commande-t-elle à la main ou au pied ?", "Au pied. Le modèle indiqué utilise un système pneumatique commandé au pied ; l’opérateur garde les deux mains libres."], ["Combien d’opérateurs y travaillent ?", "Elle est conçue pour un seul opérateur."], ["Un lavabo est-il inclus ?", "Oui, le modèle indiqué associe un lavabo et un stérilisateur de couteaux à la plateforme."], ["Où trouver la spécification complète ?", "Sur la fiche produit de la plateforme d’éviscération pneumatique, liée ci-dessous. Pour un devis, envoyez l’implantation de votre ligne et la quantité souhaitée via le formulaire."]] },
      },
    },
    ar: {
      slug: "pneumatic-evisceration-platform-adjustable-height-offal-transfer",
      title: "منصة نزع الأحشاء الهوائية في مسالخ الأبقار: ارتفاع قابل للضبط ونظافة ونقل للأحشاء",
      excerpt: "ما الذي تفعله منصة نزع الأحشاء الهوائية على خط أحشاء الأبقار، وما الخصائص المهمة، وما الذي ينبغي سؤال المورّد عنه قبل طلب عرض السعر.",
      seoTitle: "منصة نزع الأحشاء الهوائية للأبقار",
      seoDescription: "منصة هوائية قابلة لضبط الارتفاع لنزع أحشاء الأبقار: نقل الكرش والأحشاء إلى ناقل سيري، فولاذ مقاوم للصدأ 304، تحكّم بالقدم، حوض ومعقّم سكاكين.",
      imageAlt: "تصور ثلاثي الأبعاد لمنصة نزع الأحشاء الهوائية: سطح عمل من الفولاذ المقاوم للصدأ بدرابزين وأزرار قدم صفراء وحوض غسيل داخل قاعة ذبح",
      doc: {
        intro: [
          "في خط ذبح الأبقار، تُعدّ محطة نزع الأحشاء النقطة التي يخرج عندها الكرش وبقية الأحشاء الداخلية من الذبيحة وتنتقل إلى خط الأحشاء. يتعامل العاملون مع مواد ثقيلة وزلقة، لذلك يهمّ ارتفاع سطح العمل وطريقة حركة المنصة وسهولة تنظيفها. وقد صُمّمت منصة نزع الأحشاء الهوائية حول هذه النقاط الثلاث.",
          "يشرح هذا المقال دور المنصة والخصائص التي ينبغي النظر فيها وما يمكن السؤال عنه قبل طلب عرض السعر. البيانات الفنية أدناه مأخوذة من صفحة المنتج لدى Mezbaha Teknolojileri؛ تحقّق من كل قيمة لخطّك الخاص.",
        ],
        sections: [
          { h: "ما هي منصة نزع الأحشاء الهوائية؟", p: ["هي منصة عمل قابلة لضبط الارتفاع تدعم نقل الكرش والأحشاء الداخلية إلى ناقل سيري. يرفع أسطوانة هوائية السطح ويخفضه، ويتحكم العامل بالحركة بدواسة القدم، فتبقى يداه حرّتين لعمل السكين."] },
          { h: "لماذا يهمّ ضبط ارتفاع العمل؟", p: ["تختلف أحجام الحيوانات كما تختلف أطوال العاملين. المنصة الثابتة تُجبر الجميع على العمل بارتفاع واحد. أما المنصة القابلة للضبط فتتيح اختيار المستوى المناسب للحيوان ولوضع العامل، ما يساعد على نقل الأحشاء إلى الناقل بشكل أكثر راحة وتحكّمًا."] },
          { h: "أهم الخصائص التي تستحق المراجعة", ul: ["<strong>التشغيل:</strong> حركة هوائية بالتحكم بالقدم، فلا يضطر العامل إلى ترك أدواته.", "<strong>المادة:</strong> هيكل من الفولاذ المقاوم للصدأ يناسب الغسيل (يستخدم الطراز المذكور مقطعًا من الفولاذ المقاوم للصدأ درجة 304).", "<strong>التجهيزات المدمجة:</strong> حوض ومعقّم سكاكين في موقع العمل.", "<strong>ترتيب التشغيل:</strong> مصمّمة لعامل واحد.", "<strong>اتجاه النقل:</strong> يُنقل الكرش والأحشاء إلى ناقل سيري."] },
          { h: "البيانات الفنية المدرجة لمنصة نزع الأحشاء الهوائية", ul: ["نظام التشغيل: أسطوانة هوائية 100 × 1200", "التحكم: بالقدم", "الهيكل: مقطع كامل من الفولاذ المقاوم للصدأ درجة 304", "التجهيزات المدمجة: حوض ومعقّم سكاكين", "مستوى العمل: قابل لضبط الارتفاع"], p: ["لا تذكر صفحة المنتج حمولة المنصة ولا أبعاد السطح لهذا الطراز. إذا كانت هذه القيم مهمة لمخططك، فاطلبها كتابةً مع عرض السعر."] },
          { h: "كيف تندمج مع خط الأحشاء؟", p: ["تقع المنصة حيث تُستخرج الأحشاء وتُسلَّم إلى ناقل الأحشاء. يؤثر موقعها بالنسبة لسكة الذبائح وارتفاع الناقل وتصريف الأرضية في الأداء العملي، لذا أرفق رسمًا بسيطًا للمخطط عند طلب المعلومات."] },
          { h: "أسئلة للمورّد", ul: ["ما مدى الرفع وما الحمولة القصوى؟", "ما إمداد الهواء المضغوط (الضغط والتدفق) الذي تحتاجه الأسطوانة، وهل يشمل مرشّح هواء؟", "هل يمكن توريد الحوض والمعقّم بوصلات تناسب مخطط المياه والصرف لديك؟", "ما قطع الغيار (الأختام والدواسات والخراطيم) التي ينبغي الاحتفاظ بها؟", "هل يمكن الحصول على رسومات وقائمة قطع غيار لسجلاتك؟"] },
        ],
        faq: { h: "الأسئلة الشائعة", items: [["هل تُشغَّل المنصة باليد أم بالقدم؟", "بالقدم. يستخدم الطراز المذكور نظامًا هوائيًا بالتحكم بالقدم، فتبقى يدا العامل حرّتين."], ["كم عاملًا يعمل عليها؟", "هي مصمّمة لعامل واحد."], ["هل يشمل المنتج حوضًا؟", "نعم، يجمع الطراز المذكور بين الحوض ومعقّم السكاكين والمنصة."], ["أين أجد المواصفات الكاملة؟", "في صفحة منتج منصة نزع الأحشاء الهوائية عبر الرابط أدناه. لطلب عرض سعر أرسل مخطط خطّك والكمية المطلوبة عبر نموذج الطلب."]] },
      },
    },
  },
};

/* ======================================================================================================= */
/* YAZI 2 — Ayak ve Boynuz Kesme Makası                                                                    */
/* ======================================================================================================= */
const p2: Post = {
  key: 2,
  slug: "hidrolik-ayak-ve-boynuz-kesme-makasi-buyukbas-kesim-hatti",
  productSlug: "ayak-kesme-makasi",
  cover: { file: "cover-2.webp", originalName: "LEG AND HORN CUTTING SAW.jpeg", seoName: "hydraulic-leg-and-horn-cutter-cover" },
  tags: ["Ayak Kesme Makası", "Boynuz Kesme Makası", "Hidrolik Kesim Makası", "Hidrolik Sistemler", "Büyükbaş Mezbaha Ekipmanları", "Kesim Ekipmanları", "Mezbaha Ekipmanları", "Büyükbaş Kesim Hattı", "Paslanmaz Çelik Mezbaha Ekipmanları"],
  locales: {
    tr: {
      slug: null,
      title: "Büyükbaş Kesim Hattı İçin Hidrolik Ayak ve Boynuz Kesme Makası: Almadan Önce Nelere Bakılmalı?",
      excerpt: "Hidrolik ayak ve boynuz kesme makasının listelenen özellikleri, aktarma istasyonunda kullanımı ve tedarikçiyle teyit edilecek noktalar.",
      seoTitle: "Hidrolik Ayak ve Boynuz Kesme Makası",
      seoDescription: "Büyükbaş için hidrolik ayak ve boynuz kesme makası: 44 kN kesme gücü, 105 mm bıçak açıklığı, paslanmaz çelik gövde. Teknik bilgiler ve satın alma kontrol listesi.",
      imageAlt: "Hidrolik ayak ve boynuz kesme makasının 3B görseli: kavisli açık bıçak ve kırmızı gövde, mezbaha salonunda",
      doc: {
        intro: [
          "Ayak ve boynuz kesimi büyükbaş kesim hattının rutin adımlarından biridir ve aletler için zordur. Hidrolik ayak ve boynuz kesme makası, operatöre elle kesimin yorgunluğu olmadan kontrollü bir kesme kuvveti sunar. Alıcılar bu ekipmanı “ayak ve boynuz kesme testeresi” diye de arar; Mezbaha Teknolojileri ürün sayfasında ise hidrolik Ayak Kesme Makası olarak listelenir.",
        ],
        sections: [
          { h: "Ayak ve boynuz kesme makası ne yapar?", p: ["Her boyuttaki büyükbaş hayvanda ön ve arka ayak eklem yerlerini ve kemik hizalarını keser, boynuzları keser. Genellikle aktarma istasyonunda balansör desteğiyle kullanılır; balansör makinenin ağırlığını taşır, operatör de makineyi doğru konumlandırır."] },
          { h: "Listelenen teknik özellikler", ul: ["Tahrik: hidrolik", "Kesme gücü: 44 kN", "Bıçak açıklığı: 105 mm", "Makine uzunluğu: 650 mm; makine ağırlığı: 28 kg", "Gövde: paslanmaz çelik; sertleştirilmiş, korozyona dayanıklı kesici ağızlar", "Hidrolik güç ünitesi: 3 kW motor, 230 V, 3 faz, 60 Hz", "Hortum uzunluğu: 5 m; yağ kapasitesi: 56 L"], p: ["Bu değerler ürün sayfasından alınmıştır. Güç ünitesinin tesisinizin elektrik şebekesine (gerilim, faz ve frekans) uyduğunu sipariş vermeden önce teyit edin; listelenen besleme 230 V, 3 faz, 60 Hz’dir."] },
          { h: "Neden hidrolik?", p: ["Hidrolik kesici, bıçakta sabit bir kesme gücü sağlar ve çalışma kafasını küçük tutar. Operatörün tuttuğu 650 mm uzunluğundaki 28 kg’lık kısım kafadır; pompa, motor ve yağ ise 5 m’lik hortumla bağlanan ayrı bir güç ünitesindedir."] },
          { h: "Hijyen ve bakım", p: ["Listelenen modelde paslanmaz çelik gövde ile sertleştirilmiş, korozyona dayanıklı bıçaklar bulunur; bunlar yıkama koşullarına dayanmak ve bıçak bakımını azaltmaya yardımcı olmak üzere seçilmiştir. Hortum, rakor ve yağ seviyesini düzenli kontrol edin; duruşun hattı durduracağı durumlarda yedek bıçak seti bulundurun."] },
          { h: "Teklif istemeden önce kontrol listesi", ul: ["Hangi kesimlere ihtiyacınız var (ön ayak, arka ayak, boynuz) ve hangi hayvan boyutlarında?", "Doğru yükseklikte bir balansörünüz veya aktarma istasyonu rayınız var mı?", "Güç ünitesi elektrik beslemenize (gerilim, faz, frekans) uyuyor mu?", "Güç ünitesi nereye konacak ve kesim noktasına uzaklığı ne kadar (hortum 5 m)?", "Hangi yedek parçalar gerekli: bıçak, hortum, conta?", "Hidrolik yağ tipi ve doldurma talimatını yazılı istiyor musunuz?"] },
        ],
        faq: { h: "Sık sorulan sorular", items: [["Testere mi, makas mı?", "Listelenen makine, 105 mm bıçak açıklığıyla hidrolik olarak keser. Ürün sayfası adını ayak ve boynuz kesme makası olarak verir; bazı alıcılar buna ayak ve boynuz kesme testeresi der."], ["Kesme gücü nedir?", "44 kN."], ["Büyük hayvanların boynuzunu keser mi?", "Ürün sayfası, yapının her boyuttaki büyükbaşa uygun olduğunu ve boynuz kesimini kapsadığını belirtir; ihtiyacınız olan en büyük boynuz ölçüsünü tedarikçiyle teyit edin."], ["Balansör gerekir mi?", "Genellikle aktarma istasyonunda balansör desteğiyle kullanılır. Hattınızda balansör gerekip gerekmediği yerleşime bağlıdır; teklif isteğinizde görüş isteyin."]] },
      },
    },
    en: {
      slug: "hydraulic-leg-and-horn-cutter-cattle-slaughter-line",
      title: "Hydraulic Leg and Horn Cutter for Cattle Slaughter Lines: What to Check Before You Buy",
      excerpt: "A practical look at a hydraulic leg and horn cutter: listed specifications, how it is used at the transfer station and what to confirm with a supplier.",
      seoTitle: "Hydraulic Leg and Horn Cutter for Cattle",
      seoDescription: "Hydraulic leg and horn cutter for cattle: 44 kN cutting force, 105 mm blade opening, stainless steel body. Specs and a buyer's checklist.",
      imageAlt: "Render of a hydraulic leg and horn cutter with a curved open blade and red housing, shown in a slaughterhouse hall",
      doc: {
        intro: [
          "Cutting legs and horns is a routine step on a cattle slaughter line, and it is hard on tools. A hydraulic leg and horn cutter gives the operator a controlled cutting force without the strain of manual tools. Buyers also search for this tool as a leg and horn cutting saw; on the Mezbaha Teknolojileri product page it is listed as a hydraulic leg and horn cutter.",
        ],
        sections: [
          { h: "What does a leg and horn cutter do?", p: ["It cuts the fore and hind leg joints, cuts along bone lines and cuts horns on cattle of all sizes. It is generally used with balancer support at the transfer station: the balancer carries the machine's weight so the operator can position it accurately."] },
          { h: "Listed specifications", ul: ["Drive: hydraulic", "Cutting force: 44 kN", "Blade opening: 105 mm", "Machine length: 650 mm; machine weight: 28 kg", "Body: stainless steel, with hardened, corrosion-resistant cutting edges", "Hydraulic power unit: 3 kW motor, 230 V, 3-phase, 60 Hz", "Hose length: 5 m; oil capacity: 56 L"], p: ["These values are taken from the product page. Before you order, confirm that the power unit matches your facility's electrical supply (voltage, phase and frequency); the listed supply is 230 V, 3-phase, 60 Hz."] },
          { h: "Why hydraulic?", p: ["A hydraulic cutter delivers a steady cutting force at the blade and keeps the working head compact. The part the operator handles is the 650 mm, 28 kg head; the pump, motor and oil sit in a separate power unit connected by a 5 m hose."] },
          { h: "Hygiene and maintenance", p: ["The listed model has a stainless steel body and hardened, corrosion-resistant blades, which are intended to hold up in wash-down conditions and to help reduce blade maintenance. Plan regular checks of hoses, fittings and oil level, and keep a spare blade set if downtime would stop the line."] },
          { h: "Checklist before you request a quote", ul: ["Which cuts do you need (fore leg, hind leg, horns) and on what animal sizes?", "Do you already have a balancer or transfer-station rail at a suitable height?", "Does the power unit match your electrical supply (voltage, phase, frequency)?", "Where will the power unit sit, and how far is it from the cutting point (the hose is 5 m)?", "Which spares do you need: blades, hoses, seals?", "Do you want the hydraulic oil type and filling instructions in writing?"] },
        ],
        faq: { h: "Frequently asked questions", items: [["Is it a saw or a cutter?", "The listed machine cuts hydraulically with a 105 mm blade opening. The product page names it a leg and horn cutter; some buyers call it a leg and horn cutting saw."], ["What cutting force does it have?", "44 kN."], ["Can it cut horns on large cattle?", "The product page states that the design suits cattle of all sizes and covers horn cutting. Confirm the largest horn size you need with the supplier."], ["Does it need a balancer?", "It is generally used with balancer support at the transfer station. Whether you need one depends on your layout; ask for advice with your quote request."]] },
      },
    },
    ru: {
      slug: "gidravlicheskie-nozhnicy-dlya-nog-i-rogov-liniya-uboya-krs",
      title: "Гидравлические ножницы для ног и рогов на линии убоя КРС: что проверить перед покупкой",
      excerpt: "Практический обзор гидравлических ножниц для ног и рогов: указанные характеристики, использование на посту передачи и что уточнить у поставщика.",
      seoTitle: "Гидравлические ножницы для ног и рогов КРС",
      seoDescription: "Гидравлические ножницы для ног и рогов КРС: усилие реза 44 кН, раскрытие лезвия 105 мм, корпус из нержавеющей стали. Характеристики и чек-лист покупателя.",
      imageAlt: "3D-изображение гидравлических ножниц для ног и рогов с изогнутым открытым лезвием и красным корпусом в цехе убоя",
      doc: {
        intro: [
          "Обрезка ног и рогов — обычный этап линии убоя КРС, тяжёлый для инструмента. Гидравлические ножницы для ног и рогов дают оператору контролируемое усилие реза без нагрузки, характерной для ручного инструмента. Покупатели ищут это оборудование и как «пилу для ног и рогов»; на странице изделия Mezbaha Teknolojileri оно указано как гидравлические ножницы для ног и рогов.",
        ],
        sections: [
          { h: "Что делают ножницы для ног и рогов?", p: ["Они режут суставы передних и задних ног, режут по линиям костей и срезают рога у КРС любого размера. Обычно их используют на посту передачи с поддержкой балансира: балансир несёт вес машины, а оператор точно её позиционирует."] },
          { h: "Указанные характеристики", ul: ["Привод: гидравлический", "Усилие реза: 44 кН", "Раскрытие лезвия: 105 мм", "Длина машины: 650 мм; масса машины: 28 кг", "Корпус: нержавеющая сталь; закалённые коррозионностойкие режущие кромки", "Гидравлическая станция: двигатель 3 кВт, 230 В, 3 фазы, 60 Гц", "Длина шланга: 5 м; объём масла: 56 л"], p: ["Эти значения взяты со страницы изделия. Перед заказом убедитесь, что гидравлическая станция соответствует электропитанию вашего предприятия (напряжение, число фаз и частота); указанное питание — 230 В, 3 фазы, 60 Гц."] },
          { h: "Почему гидравлика?", p: ["Гидравлические ножницы дают стабильное усилие на лезвии и позволяют сделать рабочую головку компактной. В руках оператора находится головка длиной 650 мм и массой 28 кг; насос, двигатель и масло размещены в отдельной станции, соединённой шлангом длиной 5 м."] },
          { h: "Гигиена и обслуживание", p: ["В указанной модели корпус из нержавеющей стали и закалённые коррозионностойкие лезвия — они рассчитаны на влажную уборку и призваны сократить обслуживание лезвий. Планируйте регулярную проверку шлангов, соединений и уровня масла и держите запасной комплект лезвий, если простой остановит линию."] },
          { h: "Чек-лист перед запросом предложения", ul: ["Какие резы нужны (передняя нога, задняя нога, рога) и для животных какого размера?", "Есть ли у вас балансир или рельс поста передачи подходящей высоты?", "Соответствует ли гидравлическая станция вашему электропитанию (напряжение, фазы, частота)?", "Где будет стоять станция и как далеко она от места реза (шланг 5 м)?", "Какие запчасти нужны: лезвия, шланги, уплотнения?", "Нужны ли вам письменно тип гидравлического масла и инструкция по заправке?"] },
        ],
        faq: { h: "Часто задаваемые вопросы", items: [["Это пила или ножницы?", "Указанная машина режет гидравлически, раскрытие лезвия — 105 мм. На странице изделия она названа ножницами для ног и рогов; некоторые покупатели называют её пилой для ног и рогов."], ["Какое у неё усилие реза?", "44 кН."], ["Режет ли она рога у крупного скота?", "На странице изделия указано, что конструкция подходит для КРС любого размера и охватывает срез рогов. Уточните у поставщика максимальный размер рогов, который вам нужен."], ["Нужен ли балансир?", "Обычно её используют с поддержкой балансира на посту передачи. Нужен ли он на вашей линии, зависит от планировки; запросите совет вместе с предложением."]] },
      },
    },
    de: {
      slug: "hydraulischer-bein-und-hornschneider-rinderschlachtlinie",
      title: "Hydraulischer Bein- und Hornschneider für Rinderschlachtlinien: Worauf Sie vor dem Kauf achten sollten",
      excerpt: "Ein praxisnaher Blick auf den hydraulischen Bein- und Hornschneider: aufgeführte Daten, Einsatz an der Übergabestation und was Sie mit dem Lieferanten klären sollten.",
      seoTitle: "Hydraulischer Bein- und Hornschneider Rind",
      seoDescription: "Hydraulischer Bein- und Hornschneider für Rinder: 44 kN Schnittkraft, 105 mm Klingenöffnung, Edelstahlkörper. Aufgeführte Daten und Checkliste für Schlachtlinien.",
      imageAlt: "3D-Darstellung eines hydraulischen Bein- und Hornschneiders mit gebogener offener Klinge und rotem Gehäuse in einer Schlachthalle",
      doc: {
        intro: [
          "Das Abtrennen von Beinen und Hörnern ist ein Routineschritt an der Rinderschlachtlinie und beansprucht das Werkzeug stark. Ein hydraulischer Bein- und Hornschneider gibt dem Bediener eine kontrollierte Schnittkraft ohne die Belastung manueller Werkzeuge. Käufer suchen dieses Gerät auch als Bein- und Hornsäge; auf der Produktseite von Mezbaha Teknolojileri wird es als hydraulischer Bein- und Hornschneider geführt.",
        ],
        sections: [
          { h: "Was macht ein Bein- und Hornschneider?", p: ["Er trennt bei Rindern jeder Größe die Gelenke der Vorder- und Hinterbeine, schneidet entlang von Knochenlinien und trennt Hörner ab. Üblicherweise wird er an der Übergabestation mit Balancer-Unterstützung eingesetzt: Der Balancer trägt das Maschinengewicht, sodass der Bediener präzise positionieren kann."] },
          { h: "Aufgeführte Spezifikationen", ul: ["Antrieb: hydraulisch", "Schnittkraft: 44 kN", "Klingenöffnung: 105 mm", "Maschinenlänge: 650 mm; Maschinengewicht: 28 kg", "Körper: Edelstahl, mit gehärteten, korrosionsbeständigen Schneiden", "Hydraulikaggregat: Motor 3 kW, 230 V, 3-phasig, 60 Hz", "Schlauchlänge: 5 m; Ölmenge: 56 l"], p: ["Diese Werte stammen von der Produktseite. Bestätigen Sie vor der Bestellung, dass das Aggregat zur elektrischen Versorgung Ihres Betriebs (Spannung, Phasen, Frequenz) passt; die aufgeführte Versorgung ist 230 V, 3-phasig, 60 Hz."] },
          { h: "Warum hydraulisch?", p: ["Ein hydraulischer Schneider liefert eine gleichmäßige Schnittkraft an der Klinge und hält den Arbeitskopf kompakt. Vom Bediener geführt wird der Kopf mit 650 mm Länge und 28 kg; Pumpe, Motor und Öl befinden sich in einem separaten Aggregat, das über einen 5 m langen Schlauch verbunden ist."] },
          { h: "Hygiene und Wartung", p: ["Das aufgeführte Modell hat einen Edelstahlkörper und gehärtete, korrosionsbeständige Klingen; sie sind für Nassreinigung ausgelegt und sollen den Wartungsaufwand der Klingen verringern. Planen Sie regelmäßige Kontrollen von Schläuchen, Verschraubungen und Ölstand und halten Sie einen Ersatzklingensatz bereit, falls ein Stillstand die Linie stoppen würde."] },
          { h: "Checkliste vor der Angebotsanfrage", ul: ["Welche Schnitte benötigen Sie (Vorderbein, Hinterbein, Hörner) und bei welchen Tiergrößen?", "Haben Sie bereits einen Balancer oder eine Übergabebahn in passender Höhe?", "Passt das Aggregat zu Ihrer elektrischen Versorgung (Spannung, Phasen, Frequenz)?", "Wo steht das Aggregat und wie weit ist es vom Schnittpunkt entfernt (der Schlauch ist 5 m lang)?", "Welche Ersatzteile brauchen Sie: Klingen, Schläuche, Dichtungen?", "Möchten Sie Hydrauliköltyp und Befüllanweisung schriftlich?"] },
        ],
        faq: { h: "Häufig gestellte Fragen", items: [["Ist es eine Säge oder ein Schneider?", "Die aufgeführte Maschine schneidet hydraulisch mit 105 mm Klingenöffnung. Die Produktseite nennt sie Bein- und Hornschneider; manche Käufer sagen Bein- und Hornsäge."], ["Welche Schnittkraft hat sie?", "44 kN."], ["Schneidet sie auch Hörner bei großen Rindern?", "Die Produktseite gibt an, dass die Bauweise für Rinder jeder Größe geeignet ist und das Abtrennen von Hörnern abdeckt. Klären Sie die größte benötigte Hornstärke mit dem Lieferanten."], ["Braucht man einen Balancer?", "Üblicherweise wird er an der Übergabestation mit Balancer-Unterstützung eingesetzt. Ob Sie einen benötigen, hängt vom Layout ab; fragen Sie bei der Angebotsanfrage nach einer Empfehlung."]] },
      },
    },
    fr: {
      slug: "coupe-pattes-coupe-cornes-hydraulique-ligne-abattage-bovin",
      title: "Coupe-pattes et coupe-cornes hydraulique pour lignes d’abattage bovin : ce qu’il faut vérifier avant d’acheter",
      excerpt: "Un regard pratique sur le coupe-pattes et coupe-cornes hydraulique : données indiquées, usage au poste de transfert et points à confirmer avec le fournisseur.",
      seoTitle: "Coupe-pattes et coupe-cornes hydraulique",
      seoDescription: "Coupe-pattes et coupe-cornes hydraulique pour bovins : force de coupe 44 kN, ouverture de lame 105 mm, corps en inox. Données et liste de contrôle.",
      imageAlt: "Rendu 3D d’un coupe-pattes et coupe-cornes hydraulique avec lame courbe ouverte et corps rouge dans une salle d’abattage",
      doc: {
        intro: [
          "Couper les pattes et les cornes est une étape de routine sur une ligne d’abattage bovin, et elle sollicite fortement l’outil. Un coupe-pattes et coupe-cornes hydraulique offre à l’opérateur une force de coupe maîtrisée sans l’effort des outils manuels. Les acheteurs cherchent aussi cet outil sous le nom de scie à pattes et à cornes ; sur la fiche produit de Mezbaha Teknolojileri, il est présenté comme coupe-pattes et coupe-cornes hydraulique.",
        ],
        sections: [
          { h: "À quoi sert un coupe-pattes et coupe-cornes ?", p: ["Il coupe les articulations des pattes avant et arrière, coupe le long des lignes osseuses et coupe les cornes de bovins de toutes tailles. Il s’utilise généralement avec un équilibreur au poste de transfert : l’équilibreur supporte le poids de la machine et l’opérateur la positionne avec précision."] },
          { h: "Caractéristiques indiquées", ul: ["Entraînement : hydraulique", "Force de coupe : 44 kN", "Ouverture de lame : 105 mm", "Longueur de la machine : 650 mm ; poids : 28 kg", "Corps : inox, avec lames trempées résistantes à la corrosion", "Centrale hydraulique : moteur 3 kW, 230 V, triphasé, 60 Hz", "Longueur du flexible : 5 m ; capacité d’huile : 56 L"], p: ["Ces valeurs proviennent de la fiche produit. Avant de commander, vérifiez que la centrale correspond à l’alimentation électrique de votre site (tension, phases, fréquence) ; l’alimentation indiquée est de 230 V, triphasée, 60 Hz."] },
          { h: "Pourquoi l’hydraulique ?", p: ["Un coupe-pattes hydraulique délivre une force de coupe régulière à la lame et garde la tête de travail compacte. L’opérateur manipule la tête de 650 mm et 28 kg ; la pompe, le moteur et l’huile se trouvent dans une centrale séparée reliée par un flexible de 5 m."] },
          { h: "Hygiène et maintenance", p: ["Le modèle indiqué possède un corps en inox et des lames trempées résistantes à la corrosion, conçus pour supporter le lavage et aider à réduire l’entretien des lames. Prévoyez un contrôle régulier des flexibles, raccords et niveau d’huile, et gardez un jeu de lames de rechange si un arrêt bloquerait la ligne."] },
          { h: "Liste de contrôle avant la demande de devis", ul: ["De quelles coupes avez-vous besoin (patte avant, patte arrière, cornes) et sur quelles tailles d’animaux ?", "Disposez-vous déjà d’un équilibreur ou d’un rail de poste de transfert à bonne hauteur ?", "La centrale correspond-elle à votre alimentation électrique (tension, phases, fréquence) ?", "Où sera placée la centrale et à quelle distance du point de coupe (le flexible mesure 5 m) ?", "Quelles pièces de rechange vous faut-il : lames, flexibles, joints ?", "Souhaitez-vous le type d’huile hydraulique et la procédure de remplissage par écrit ?"] },
        ],
        faq: { h: "Questions fréquentes", items: [["Est-ce une scie ou un coupe-pattes ?", "La machine indiquée coupe de façon hydraulique avec une ouverture de lame de 105 mm. La fiche produit la nomme coupe-pattes et coupe-cornes ; certains acheteurs parlent de scie à pattes et à cornes."], ["Quelle force de coupe a-t-elle ?", "44 kN."], ["Coupe-t-elle les cornes des gros bovins ?", "La fiche produit indique que la conception convient aux bovins de toutes tailles et couvre la coupe des cornes. Confirmez avec le fournisseur la taille de corne maximale dont vous avez besoin."], ["Faut-il un équilibreur ?", "Elle s’utilise généralement avec un équilibreur au poste de transfert. Le besoin dépend de votre implantation ; demandez conseil avec votre demande de devis."]] },
      },
    },
    ar: {
      slug: "hydraulic-leg-and-horn-cutter-cattle-slaughter-line",
      title: "قاطع الأرجل والقرون الهيدروليكي لخطوط ذبح الأبقار: ما الذي ينبغي فحصه قبل الشراء",
      excerpt: "نظرة عملية على قاطع الأرجل والقرون الهيدروليكي: المواصفات المدرجة واستخدامه في محطة النقل وما ينبغي تأكيده مع المورّد.",
      seoTitle: "قاطع الأرجل والقرون الهيدروليكي للأبقار",
      seoDescription: "قاطع أرجل وقرون هيدروليكي للأبقار: قوة قطع 44 كيلونيوتن، فتحة شفرة 105 مم، جسم من الفولاذ المقاوم للصدأ. المواصفات المدرجة وقائمة فحص للمشتري.",
      imageAlt: "تصور ثلاثي الأبعاد لقاطع أرجل وقرون هيدروليكي بشفرة منحنية مفتوحة وهيكل أحمر داخل قاعة ذبح",
      doc: {
        intro: [
          "قطع الأرجل والقرون خطوة روتينية في خط ذبح الأبقار، وهي مرهقة للأدوات. يمنح قاطع الأرجل والقرون الهيدروليكي العامل قوة قطع متحكَّمًا بها دون الجهد الذي تتطلبه الأدوات اليدوية. يبحث المشترون عن هذه الأداة أيضًا باسم منشار قطع الأرجل والقرون؛ وتُدرج في صفحة المنتج لدى Mezbaha Teknolojileri باسم قاطع الأرجل والقرون الهيدروليكي.",
        ],
        sections: [
          { h: "ما وظيفة قاطع الأرجل والقرون؟", p: ["يقطع مفاصل الأرجل الأمامية والخلفية، ويقطع على امتداد خطوط العظم، ويقطع القرون في أبقار بجميع الأحجام. يُستخدم عادةً مع دعم موازن في محطة النقل: يحمل الموازن وزن الآلة ليضعها العامل في الموضع الدقيق."] },
          { h: "المواصفات المدرجة", ul: ["التشغيل: هيدروليكي", "قوة القطع: 44 كيلونيوتن", "فتحة الشفرة: 105 مم", "طول الآلة: 650 مم؛ وزن الآلة: 28 كغ", "الجسم: فولاذ مقاوم للصدأ، مع حواف قطع مقسّاة ومقاومة للتآكل", "وحدة القدرة الهيدروليكية: محرك 3 كيلوواط، 230 فولت، ثلاثي الأطوار، 60 هرتز", "طول الخرطوم: 5 م؛ سعة الزيت: 56 لترًا"], p: ["هذه القيم مأخوذة من صفحة المنتج. قبل الطلب تأكد من أن وحدة القدرة تناسب الإمداد الكهربائي في منشأتك (الجهد وعدد الأطوار والتردد)؛ الإمداد المدرج هو 230 فولت ثلاثي الأطوار 60 هرتز."] },
          { h: "لماذا هيدروليكي؟", p: ["يمنح القاطع الهيدروليكي قوة قطع ثابتة عند الشفرة ويُبقي رأس العمل مدمجًا. الجزء الذي يمسكه العامل هو الرأس بطول 650 مم ووزن 28 كغ؛ أما المضخة والمحرك والزيت فتوجد في وحدة قدرة منفصلة موصولة بخرطوم طوله 5 م."] },
          { h: "النظافة والصيانة", p: ["يتميز الطراز المدرج بجسم من الفولاذ المقاوم للصدأ وشفرات مقسّاة مقاومة للتآكل، وهي مصمّمة لتحمّل الغسيل وللمساعدة في تقليل صيانة الشفرات. خطّط لفحص دوري للخراطيم والوصلات ومستوى الزيت، واحتفظ بطقم شفرات احتياطي إذا كان التوقف سيوقف الخط."] },
          { h: "قائمة فحص قبل طلب عرض السعر", ul: ["ما القطوع التي تحتاجها (رجل أمامية، رجل خلفية، قرون) ولأي أحجام من الحيوانات؟", "هل لديك موازن أو سكة محطة نقل بارتفاع مناسب؟", "هل تناسب وحدة القدرة إمدادك الكهربائي (الجهد، الأطوار، التردد)؟", "أين ستوضع وحدة القدرة وكم تبعد عن نقطة القطع (الخرطوم 5 م)؟", "ما قطع الغيار التي تحتاجها: شفرات، خراطيم، أختام؟", "هل تريد نوع الزيت الهيدروليكي وتعليمات التعبئة كتابةً؟"] },
        ],
        faq: { h: "الأسئلة الشائعة", items: [["هل هو منشار أم قاطع؟", "الآلة المدرجة تقطع هيدروليكيًا بفتحة شفرة 105 مم. تسمّيها صفحة المنتج قاطع الأرجل والقرون؛ ويسميها بعض المشترين منشار قطع الأرجل والقرون."], ["ما قوة القطع؟", "44 كيلونيوتن."], ["هل تقطع قرون الأبقار الكبيرة؟", "تذكر صفحة المنتج أن التصميم يناسب الأبقار بجميع الأحجام ويشمل قطع القرون. أكّد مع المورّد أكبر حجم قرن تحتاجه."], ["هل يلزم موازن؟", "يُستخدم عادةً مع دعم موازن في محطة النقل. وتعتمد الحاجة إليه على مخططك؛ اطلب المشورة مع طلب عرض السعر."]] },
      },
    },
  },
};

/* ======================================================================================================= */
/* YAZI 3 — Pnömatik Aktarma Platformu                                                                     */
/* ======================================================================================================= */
const p3: Post = {
  key: 3,
  slug: "pnomatik-aktarma-platformu-sabit-platform-karsilastirma",
  productSlug: "aktarma-platformu",
  cover: { file: "cover-3.webp", originalName: "PNEUMATIC PLATFORM.jpeg", seoName: "pneumatic-transferring-platform-cover" },
  tags: ["Pnömatik Aktarma Platformu", "Pnömatik Platform", "Sabit Platform", "Mezbaha Platformları", "Çalışma Platformları", "İş Güvenliği", "Kesimhane Ekipmanları", "Büyükbaş Mezbaha Ekipmanları", "Paslanmaz Çelik Mezbaha Ekipmanları"],
  locales: {
    tr: {
      slug: null,
      title: "Mezbahada Pnömatik Çalışma Platformu ve Sabit Platform: İstasyon Yüksekliği Nasıl Seçilir?",
      excerpt: "Ayarlanabilir pnömatik aktarma platformu ile sabit platformların karşılaştırması ve satın almadan önce sorulacak sorular.",
      seoTitle: "Pnömatik ve Sabit Mezbaha Platformu",
      seoDescription: "Ayarlanabilir pnömatik aktarma platformu (500–1.700 mm, en az 200 kg) ile sabit platformları karşılaştırın; satın almadan önce tedarikçiye sorulacakları görün.",
      imageAlt: "Pnömatik aktarma platformunun 3B görseli: korkuluklu paslanmaz çelik çerçeve, ayak pedalları ve lavabolu hijyen modülü, mezbaha salonunda",
      doc: {
        intro: [
          "Büyükbaş kesim hattındaki her istasyonun, işe uygun bir çalışma yüksekliği vardır: kuyruk açma, aktarma, temizleme, veteriner kontrolü. Sabit platformlar bu yüksekliği bir kez belirler. Pnömatik platform ise yüksekliğin hayvana ve operatöre göre değişmesine izin verir. Bu yazıda ikisini karşılaştırıyor ve seçim yapmadan önce nelere bakılacağını sıralıyoruz.",
        ],
        sections: [
          { h: "Sabit platformlar: sade ve dengeli", p: ["Sabit platformlar mezbahadaki birçok istasyonda kullanılır; örneğin kuyruk açma, deri yüzme, veteriner kontrol, göğüs açma veya temizleme istasyonu olarak. Mezbaha Teknolojileri’nin sabit platform sayfaları tipik yüksekliği 1.200 ile 1.500 mm arasında verir. Hareketli parçası olmadığı için bakımı azdır. Karşılığında tek bir yükseklik her hayvana ve her operatöre hizmet etmek zorundadır."] },
          { h: "Pnömatik platformlar: işe uyan yükseklik", p: ["Pnömatik platform, çalışma platformunu basınçlı havayla kaldırır ve indirir. Listelenen Pnömatik Aktarma Platformu, çalışma seviyesinin hayvan boyuna ve kasabın çalışma noktasına göre ayarlanması için tasarlanmıştır ve aktarma işlemlerinde sabit platformlara göre daha hızlı ve esnek bir iş akışını desteklediği belirtilir."] },
          { h: "Listelenen teknik özellikler", ul: ["Çalışma yüksekliği: 500–1.700 mm, ayak kumandalı hareket", "Taşıma kapasitesi: en az 200 kg", "Platform ölçüsü: işletme koşullarına göre 800 × 1.000 mm; 3 mm alüminyum sac kaplama", "Tahrik: çift pnömatik silindir; hareket hız kontrolü, alt ve üst limit şalterleri, kontrol paneli", "Kılavuzlama: birbirinden 1.000 mm mesafede iki poliamid kızak", "Koruma: silindirler için hava giriş filtresi ve hava kurutucu; kenarlarda Ø 1 inç boru parapet", "Şasi: 100 × 100 × 4 mm kutu profil; komple paslanmaz yapı"] },
          { h: "Nasıl seçilir?", ul: ["Bir istasyon her zaman aynı işi tek yükseklikte yapıyorsa ve en az hareketli parça istiyorsanız sabit platform seçin.", "Hayvan boyları değişiyorsa, istasyonu birkaç operatör paylaşıyorsa veya iş yüksekliği değişiyorsa pnömatik platform seçin.", "Bir hat ikisini birlikte kullanabilir: yüksekliğin hiç değişmediği yerde sabit, aktarma noktalarında pnömatik platform."] },
          { h: "Tedarikçiye sorulacak sorular", ul: ["Pnömatik sistem için hangi basınçlı hava beslemesi (basınç ve debi) gerekir?", "Yük kapasitesi nasıl belirlendi ve hangi güvenlik payıyla çalışır?", "Üründe gösterilen lavabolu hijyen modülü, sizin konfigürasyonunuz için sunulabilir mi?", "Hangi yedek parçalar (silindir contası, kızak, limit şalteri) stokta tutulmalı?", "Çizim ve yedek parça listesi alınabilir mi?"] },
        ],
        faq: { h: "Sık sorulan sorular", items: [["Çalışma yüksekliği aralığı nedir?", "Listelenen modelde 500–1.700 mm."], ["Ayakla mı kontrol edilir?", "Evet, ayak kumandalı pnömatik hareket ve indirme sistemi vardır."], ["Taşıma kapasitesi nedir?", "Ürün sayfasında en az 200 kg olarak listelenir."], ["Basınçlı hava gerekir mi?", "Evet, sistem pnömatiktir. Ürün sayfası hava besleme değerlerini vermez; teklifle birlikte yazılı isteyin."]] },
      },
    },
    en: {
      slug: "pneumatic-vs-fixed-platform-slaughterhouse-station-height",
      title: "Pneumatic Work Platform vs. Fixed Platform in a Slaughterhouse: How to Choose Station Height",
      excerpt: "A comparison of an adjustable pneumatic transferring platform with fixed platforms, and the questions to ask before you buy.",
      seoTitle: "Pneumatic vs Fixed Slaughterhouse Platform",
      seoDescription: "Compare an adjustable pneumatic work platform (500–1,700 mm, at least 200 kg) with fixed slaughterhouse platforms. What to ask before you buy.",
      imageAlt: "Render of a pneumatic transferring platform with handrails, stainless steel frame, foot pedals and a hygiene module with a wash basin in a slaughterhouse hall",
      doc: {
        intro: [
          "Every station on a cattle slaughter line has a working height that suits its task: tail opening, transfer, trimming, inspection. Fixed platforms set that height once. A pneumatic platform lets the height change with the animal and the operator. This article compares the two and lists what to check before you choose.",
        ],
        sections: [
          { h: "Fixed platforms: simple and stable", p: ["Fixed platforms are used at many stations in a slaughterhouse, for example as tail opening, skinning, veterinary inspection, breast opening or trimming stations. Mezbaha Teknolojileri's fixed platform pages describe typical heights between 1,200 mm and 1,500 mm. With no moving parts there is little to maintain. The trade-off is that one height has to serve every animal and every operator."] },
          { h: "Pneumatic platforms: height that follows the work", p: ["A pneumatic platform raises and lowers the work deck with compressed air. The listed Pneumatic Transferring Platform is designed so the working level can be adjusted to the animal's height and the butcher's operating position, and it is described as supporting a faster and more flexible workflow than fixed platforms in transfer operations."] },
          { h: "Listed specifications", ul: ["Working height: 500–1,700 mm, foot-controlled movement", "Carrying capacity: at least 200 kg", "Platform size: 800 × 1,000 mm, according to operating conditions; covered with 3 mm aluminum sheet", "Drive: twin pneumatic cylinders with movement-speed control, lower and upper limit switches and a control panel", "Guiding: two polyamide skids positioned 1,000 mm apart", "Protection: air-inlet filter and air dryer for the cylinders; Ø 1-inch pipe parapet around the edge", "Frame: 100 × 100 × 4 mm box profile; complete stainless steel construction"] },
          { h: "How to choose", ul: ["Choose a fixed platform when a station always does the same task at one height and you want the fewest moving parts.", "Choose a pneumatic platform when animal sizes vary, several operators share the station or the task changes the working height.", "A line can combine both: fixed platforms where the height never changes and pneumatic platforms at transfer points."] },
          { h: "Questions to ask a supplier", ul: ["What compressed-air supply (pressure and flow) does the pneumatic system need?", "How was the load capacity determined, and what safety margin applies?", "Can the hygiene module with a wash basin, as shown on the product render, be supplied for your configuration?", "Which spare parts (cylinder seals, skids, limit switches) should you keep in stock?", "Can drawings and a parts list be provided?"] },
        ],
        faq: { h: "Frequently asked questions", items: [["What is the working height range?", "500–1,700 mm on the listed model."], ["Is it foot-controlled?", "Yes. It has a foot-controlled pneumatic movement and lowering system."], ["What is the load capacity?", "The product page lists at least 200 kg."], ["Does it need compressed air?", "Yes, the system is pneumatic. The product page does not give air-supply values; ask for them in writing with your quote."]] },
      },
    },
    ru: {
      slug: "pnevmaticheskaya-i-stacionarnaya-platforma-vysota-stancii-uboya",
      title: "Пневматическая рабочая платформа и стационарная платформа на бойне: как выбрать высоту поста",
      excerpt: "Сравнение регулируемой пневматической платформы для передачи со стационарными платформами и вопросы, которые стоит задать перед покупкой.",
      seoTitle: "Пневматическая и стационарная платформа",
      seoDescription: "Сравните регулируемую пневматическую платформу (500–1 700 мм, не менее 200 кг) со стационарными платформами бойни и узнайте, что спросить у поставщика перед покупкой.",
      imageAlt: "3D-изображение пневматической платформы для передачи с поручнями, рамой из нержавеющей стали, ножными педалями и гигиеническим модулем с раковиной в цехе убоя",
      doc: {
        intro: [
          "У каждого поста на линии убоя КРС есть рабочая высота, подходящая для его задачи: вскрытие хвоста, передача, зачистка, ветеринарный осмотр. Стационарная платформа задаёт эту высоту один раз. Пневматическая платформа позволяет менять высоту под животное и оператора. В статье сравниваются оба варианта и перечислено, что проверить перед выбором.",
        ],
        sections: [
          { h: "Стационарные платформы: просто и устойчиво", p: ["Стационарные платформы используются на многих постах бойни, например для вскрытия хвоста, съёмки шкуры, ветеринарного осмотра, вскрытия груди или зачистки. На страницах стационарных платформ Mezbaha Teknolojileri типичная высота указана в пределах 1 200–1 500 мм. Подвижных частей нет, поэтому обслуживания мало. Взамен одна высота должна подходить каждому животному и каждому оператору."] },
          { h: "Пневматические платформы: высота подстраивается под работу", p: ["Пневматическая платформа поднимает и опускает рабочую площадку сжатым воздухом. Указанная пневматическая платформа для передачи рассчитана на регулировку уровня под рост животного и рабочее положение обвальщика, и сообщается, что она поддерживает более быстрый и гибкий процесс при передаче, чем стационарные платформы."] },
          { h: "Указанные характеристики", ul: ["Рабочая высота: 500–1 700 мм, ножное управление движением", "Грузоподъёмность: не менее 200 кг", "Размер платформы: 800 × 1 000 мм в зависимости от условий эксплуатации; покрытие алюминиевым листом 3 мм", "Привод: два пневматических цилиндра, регулировка скорости, нижний и верхний концевые выключатели, панель управления", "Направляющие: два полиамидных ползуна на расстоянии 1 000 мм", "Защита: входной воздушный фильтр и осушитель для цилиндров; бортовое ограждение из трубы Ø 1 дюйм", "Рама: коробчатый профиль 100 × 100 × 4 мм; полностью нержавеющая конструкция"] },
          { h: "Как выбрать", ul: ["Выбирайте стационарную платформу, если пост всегда выполняет одну задачу на одной высоте и нужно минимум подвижных частей.", "Выбирайте пневматическую платформу, если размеры животных различаются, пост делят несколько операторов или задача меняет рабочую высоту.", "Линия может сочетать оба варианта: стационарные платформы там, где высота не меняется, и пневматические — на точках передачи."] },
          { h: "Вопросы поставщику", ul: ["Какое питание сжатым воздухом (давление и расход) нужно пневматической системе?", "Как определена грузоподъёмность и какой запас прочности применяется?", "Можно ли поставить гигиенический модуль с раковиной, как на изображении изделия, для вашей конфигурации?", "Какие запчасти (уплотнения цилиндров, ползуны, концевые выключатели) стоит держать на складе?", "Можно ли получить чертежи и перечень запчастей?"] },
        ],
        faq: { h: "Часто задаваемые вопросы", items: [["Каков диапазон рабочей высоты?", "500–1 700 мм у указанной модели."], ["Есть ли ножное управление?", "Да, предусмотрена пневматическая система движения и опускания с ножным управлением."], ["Какова грузоподъёмность?", "На странице изделия указано не менее 200 кг."], ["Нужен ли сжатый воздух?", "Да, система пневматическая. Значения подачи воздуха на странице изделия не приведены; запросите их письменно вместе с предложением."]] },
      },
    },
    de: {
      slug: "pneumatische-vs-feste-plattform-schlachthof-stationshoehe",
      title: "Pneumatische Arbeitsplattform oder feste Plattform im Schlachthof: So wählen Sie die Stationshöhe",
      excerpt: "Ein Vergleich der höhenverstellbaren pneumatischen Übergabeplattform mit festen Plattformen und die Fragen, die Sie vor dem Kauf stellen sollten.",
      seoTitle: "Pneumatische vs. feste Schlachthofplattform",
      seoDescription: "Vergleichen Sie eine höhenverstellbare pneumatische Arbeitsplattform (500–1.700 mm, mind. 200 kg) mit festen Schlachthofplattformen und klären Sie Fragen vor dem Kauf.",
      imageAlt: "3D-Darstellung einer pneumatischen Übergabeplattform mit Geländer, Edelstahlrahmen, Fußpedalen und Hygienemodul mit Waschbecken in einer Schlachthalle",
      doc: {
        intro: [
          "Jede Station an der Rinderschlachtlinie hat eine Arbeitshöhe, die zur Aufgabe passt: Schwanzöffnung, Übergabe, Parieren, Untersuchung. Feste Plattformen legen diese Höhe einmal fest. Eine pneumatische Plattform lässt die Höhe mit Tier und Bediener wechseln. Dieser Beitrag vergleicht beide und nennt, was Sie vor der Wahl prüfen sollten.",
        ],
        sections: [
          { h: "Feste Plattformen: einfach und stabil", p: ["Feste Plattformen werden an vielen Stationen im Schlachthof eingesetzt, etwa zum Schwanzöffnen, Enthäuten, für die Fleischuntersuchung, zum Brustöffnen oder Parieren. Die Seiten zu festen Plattformen von Mezbaha Teknolojileri nennen typische Höhen zwischen 1.200 mm und 1.500 mm. Ohne bewegliche Teile ist der Wartungsaufwand gering. Dafür muss eine einzige Höhe jedem Tier und jedem Bediener genügen."] },
          { h: "Pneumatische Plattformen: Höhe folgt der Arbeit", p: ["Eine pneumatische Plattform hebt und senkt die Arbeitsfläche mit Druckluft. Die aufgeführte Pneumatische Übergabeplattform ist so ausgelegt, dass die Arbeitsebene an Tierhöhe und Arbeitsposition des Metzgers angepasst werden kann; sie unterstütze bei Übergabevorgängen einen schnelleren und flexibleren Ablauf als feste Plattformen."] },
          { h: "Aufgeführte Spezifikationen", ul: ["Arbeitshöhe: 500–1.700 mm, fußgesteuerte Bewegung", "Tragfähigkeit: mindestens 200 kg", "Plattformgröße: 800 × 1.000 mm je nach Einsatzbedingungen; 3-mm-Aluminiumblech als Belag", "Antrieb: zwei Pneumatikzylinder, Geschwindigkeitsregelung, untere und obere Endschalter, Steuerpult", "Führung: zwei Polyamid-Gleiter im Abstand von 1.000 mm", "Schutz: Lufteintrittsfilter und Lufttrockner für die Zylinder; Rohrgeländer Ø 1 Zoll am Rand", "Rahmen: Kastenprofil 100 × 100 × 4 mm; vollständige Edelstahlkonstruktion"] },
          { h: "So wählen Sie", ul: ["Wählen Sie eine feste Plattform, wenn eine Station immer dieselbe Aufgabe in einer Höhe erledigt und Sie möglichst wenige bewegliche Teile wollen.", "Wählen Sie eine pneumatische Plattform, wenn Tiergrößen schwanken, mehrere Personen die Station teilen oder die Aufgabe die Arbeitshöhe ändert.", "Eine Linie kann beides kombinieren: feste Plattformen, wo die Höhe konstant bleibt, und pneumatische an Übergabepunkten."] },
          { h: "Fragen an den Lieferanten", ul: ["Welche Druckluftversorgung (Druck und Volumenstrom) braucht das pneumatische System?", "Wie wurde die Tragfähigkeit bestimmt und welche Sicherheitsreserve gilt?", "Kann das auf der Produktdarstellung gezeigte Hygienemodul mit Waschbecken für Ihre Konfiguration geliefert werden?", "Welche Ersatzteile (Zylinderdichtungen, Gleiter, Endschalter) sollten Sie vorrätig halten?", "Sind Zeichnungen und eine Ersatzteilliste erhältlich?"] },
        ],
        faq: { h: "Häufig gestellte Fragen", items: [["Wie groß ist der Arbeitshöhenbereich?", "500–1.700 mm beim aufgeführten Modell."], ["Ist sie fußgesteuert?", "Ja, sie hat ein fußgesteuertes pneumatisches Hub- und Senksystem."], ["Wie hoch ist die Tragfähigkeit?", "Die Produktseite nennt mindestens 200 kg."], ["Braucht sie Druckluft?", "Ja, das System ist pneumatisch. Die Produktseite nennt keine Luftversorgungswerte; fordern Sie sie schriftlich mit dem Angebot an."]] },
      },
    },
    fr: {
      slug: "plateforme-pneumatique-ou-fixe-abattoir-hauteur-poste",
      title: "Plateforme de travail pneumatique ou plateforme fixe en abattoir : comment choisir la hauteur du poste",
      excerpt: "Comparaison entre une plateforme de transfert pneumatique réglable et des plateformes fixes, avec les questions à poser avant d’acheter.",
      seoTitle: "Plateforme pneumatique ou fixe en abattoir",
      seoDescription: "Comparez une plateforme pneumatique réglable (500–1 700 mm, au moins 200 kg) à des plateformes fixes d’abattoir. Que demander avant d’acheter.",
      imageAlt: "Rendu 3D d’une plateforme de transfert pneumatique avec garde-corps, cadre en inox, pédales et module d’hygiène avec lavabo dans une salle d’abattage",
      doc: {
        intro: [
          "Chaque poste d’une ligne d’abattage bovin a une hauteur de travail adaptée à sa tâche : ouverture de la queue, transfert, parage, inspection. Les plateformes fixes fixent cette hauteur une fois pour toutes. Une plateforme pneumatique laisse la hauteur évoluer avec l’animal et l’opérateur. Cet article compare les deux et liste ce qu’il faut vérifier avant de choisir.",
        ],
        sections: [
          { h: "Plateformes fixes : simples et stables", p: ["Les plateformes fixes servent à de nombreux postes d’abattoir, par exemple pour l’ouverture de la queue, le dépouillement, l’inspection vétérinaire, l’ouverture du thorax ou le parage. Les pages des plateformes fixes de Mezbaha Teknolojileri indiquent des hauteurs courantes entre 1 200 mm et 1 500 mm. Sans pièce mobile, l’entretien est limité. En contrepartie, une seule hauteur doit convenir à chaque animal et à chaque opérateur."] },
          { h: "Plateformes pneumatiques : une hauteur qui suit le travail", p: ["Une plateforme pneumatique monte et descend le plateau à l’air comprimé. La plateforme de transfert pneumatique indiquée est conçue pour que le niveau de travail soit réglé selon la taille de l’animal et la position de travail du boucher ; elle est décrite comme soutenant un flux plus rapide et plus souple que les plateformes fixes lors des transferts."] },
          { h: "Caractéristiques indiquées", ul: ["Hauteur de travail : 500–1 700 mm, mouvement commandé au pied", "Capacité de charge : au moins 200 kg", "Dimensions du plateau : 800 × 1 000 mm selon les conditions d’exploitation ; revêtement en tôle d’aluminium de 3 mm", "Entraînement : deux vérins pneumatiques, réglage de vitesse, fins de course basse et haute, armoire de commande", "Guidage : deux patins en polyamide espacés de 1 000 mm", "Protection : filtre d’entrée d’air et sécheur d’air pour les vérins ; garde-corps en tube Ø 1 pouce sur le pourtour", "Châssis : profilé caisson 100 × 100 × 4 mm ; construction entièrement en inox"] },
          { h: "Comment choisir", ul: ["Choisissez une plateforme fixe quand un poste fait toujours la même tâche à une seule hauteur et que vous voulez le moins de pièces mobiles.", "Choisissez une plateforme pneumatique quand les tailles d’animaux varient, que plusieurs opérateurs partagent le poste ou que la tâche change la hauteur de travail.", "Une ligne peut combiner les deux : plateformes fixes là où la hauteur ne change jamais, plateformes pneumatiques aux points de transfert."] },
          { h: "Questions à poser au fournisseur", ul: ["Quelle alimentation en air comprimé (pression et débit) le système pneumatique exige-t-il ?", "Comment la capacité de charge a-t-elle été déterminée et quelle marge de sécurité s’applique ?", "Le module d’hygiène avec lavabo, tel que montré sur le rendu du produit, peut-il être fourni pour votre configuration ?", "Quelles pièces de rechange (joints de vérin, patins, fins de course) faut-il garder en stock ?", "Peut-on obtenir des plans et une liste de pièces ?"] },
        ],
        faq: { h: "Questions fréquentes", items: [["Quelle est la plage de hauteur de travail ?", "500–1 700 mm sur le modèle indiqué."], ["Est-elle commandée au pied ?", "Oui, elle dispose d’un système pneumatique de montée et de descente commandé au pied."], ["Quelle est la capacité de charge ?", "La fiche produit indique au moins 200 kg."], ["Faut-il de l’air comprimé ?", "Oui, le système est pneumatique. La fiche produit ne donne pas de valeurs d’alimentation en air ; demandez-les par écrit avec votre devis."]] },
      },
    },
    ar: {
      slug: "pneumatic-vs-fixed-platform-slaughterhouse-station-height",
      title: "منصة العمل الهوائية أم المنصة الثابتة في المسلخ: كيف تختار ارتفاع المحطة",
      excerpt: "مقارنة بين منصة النقل الهوائية القابلة للضبط والمنصات الثابتة، والأسئلة التي ينبغي طرحها قبل الشراء.",
      seoTitle: "منصة هوائية أم ثابتة في المسلخ",
      seoDescription: "قارن منصة عمل هوائية قابلة للضبط (500–1700 مم، 200 كغ على الأقل) بمنصات المسالخ الثابتة، واعرف ما يُسأل عنه المورّد قبل الشراء.",
      imageAlt: "تصور ثلاثي الأبعاد لمنصة نقل هوائية بدرابزين وهيكل من الفولاذ المقاوم للصدأ ودواسات قدم ووحدة نظافة بحوض غسيل داخل قاعة ذبح",
      doc: {
        intro: [
          "لكل محطة في خط ذبح الأبقار ارتفاع عمل يناسب مهمتها: فتح الذيل أو النقل أو التشذيب أو الفحص. تحدد المنصات الثابتة هذا الارتفاع مرة واحدة، بينما تتيح المنصة الهوائية تغيير الارتفاع بحسب الحيوان والعامل. يقارن هذا المقال بين الخيارين ويذكر ما ينبغي فحصه قبل الاختيار.",
        ],
        sections: [
          { h: "المنصات الثابتة: بسيطة ومستقرة", p: ["تُستخدم المنصات الثابتة في كثير من محطات المسلخ، مثل فتح الذيل والسلخ والفحص البيطري وفتح الصدر والتشذيب. تذكر صفحات المنصات الثابتة لدى Mezbaha Teknolojileri ارتفاعات نموذجية بين 1200 مم و1500 مم. ولأنها بلا أجزاء متحركة فصيانتها قليلة. مقابل ذلك يجب أن يخدم ارتفاع واحد كل حيوان وكل عامل."] },
          { h: "المنصات الهوائية: ارتفاع يتبع العمل", p: ["ترفع المنصة الهوائية سطح العمل وتخفضه بالهواء المضغوط. صُمّمت منصة النقل الهوائية المدرجة بحيث يُضبط مستوى العمل بحسب ارتفاع الحيوان وموضع عمل الجزار، ويُذكر أنها تدعم سير عمل أسرع وأكثر مرونة من المنصات الثابتة في عمليات النقل."] },
          { h: "المواصفات المدرجة", ul: ["ارتفاع العمل: 500–1700 مم، حركة بالتحكم بالقدم", "سعة الحمل: 200 كغ على الأقل", "أبعاد المنصة: 800 × 1000 مم بحسب ظروف التشغيل؛ مغطاة بصفيحة ألمنيوم 3 مم", "التشغيل: أسطوانتان هوائيتان مع تحكم بسرعة الحركة ومفتاحي حد سفلي وعلوي ولوحة تحكم", "التوجيه: منزلقان من البولي أميد بينهما 1000 مم", "الحماية: مرشّح دخول هواء ومجفّف هواء للأسطوانات؛ درابزين أنبوبي Ø 1 بوصة على الحافة", "الهيكل: مقطع صندوقي 100 × 100 × 4 مم؛ إنشاء كامل من الفولاذ المقاوم للصدأ"] },
          { h: "كيف تختار؟", ul: ["اختر منصة ثابتة إذا كانت المحطة تؤدي دائمًا المهمة نفسها بارتفاع واحد وتريد أقل عدد من الأجزاء المتحركة.", "اختر منصة هوائية إذا اختلفت أحجام الحيوانات أو تشارك عدة عمال المحطة أو غيّرت المهمة ارتفاع العمل.", "يمكن للخط الجمع بين الاثنين: منصات ثابتة حيث لا يتغير الارتفاع ومنصات هوائية عند نقاط النقل."] },
          { h: "أسئلة للمورّد", ul: ["ما إمداد الهواء المضغوط (الضغط والتدفق) الذي يحتاجه النظام الهوائي؟", "كيف حُدّدت سعة الحمل وما هامش الأمان المطبّق؟", "هل يمكن توريد وحدة النظافة بالحوض، كما في تصور المنتج، لتهيئتك؟", "ما قطع الغيار (أختام الأسطوانات، المنزلقات، مفاتيح الحد) التي ينبغي الاحتفاظ بها؟", "هل يمكن الحصول على رسومات وقائمة قطع غيار؟"] },
        ],
        faq: { h: "الأسئلة الشائعة", items: [["ما مدى ارتفاع العمل؟", "500–1700 مم في الطراز المدرج."], ["هل تُتحكَّم بها بالقدم؟", "نعم، فيها نظام حركة وإنزال هوائي بالتحكم بالقدم."], ["ما سعة الحمل؟", "تذكر صفحة المنتج 200 كغ على الأقل."], ["هل تحتاج هواءً مضغوطًا؟", "نعم، فالنظام هوائي. لا تذكر صفحة المنتج قيم إمداد الهواء؛ اطلبها كتابةً مع عرض السعر."]] },
      },
    },
  },
};

export const POSTS: Post[] = [p1, p2, p3];
