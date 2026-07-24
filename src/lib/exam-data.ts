export type Question = {
  id: string;
  q: string;
  options: string[];
  answer: number; // 0-3
  explanation: string;
};

export type Subject = {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  questions: Question[];
};

export type Field = {
  id: string;
  name: string;
  nameAr: string;
  category: "scientific" | "humanitarian";
  icon: string;
  subjects: Subject[];
};

const mk = (prefix: string, items: [string, string[], number, string][]): Question[] =>
  items.map(([q, options, answer, explanation], i) => ({
    id: `${prefix}-${i + 1}`,
    q,
    options,
    answer,
    explanation,
  }));

// ===== Grade 11 Subjects =====
export const grade11Subjects: Subject[] = [
  {
    id: "g11-islamic",
    name: "Islamic Education",
    nameAr: "التربية الإسلامية",
    icon: "📖",
    color: "from-emerald-500 to-teal-600",
    questions: mk("g11-islamic", [
      ["ما هو الركن الأول من أركان الإسلام؟", ["الصلاة", "الشهادتان", "الزكاة", "الصوم"], 1, "الشهادتان هما الركن الأول من أركان الإسلام."],
      ["كم عدد ركعات صلاة الفجر؟", ["ركعتان", "ثلاث ركعات", "أربع ركعات", "ركعة واحدة"], 0, "صلاة الفجر ركعتان."],
      ["في أي شهر نزل القرآن الكريم؟", ["رجب", "شعبان", "رمضان", "شوال"], 2, "نزل القرآن في شهر رمضان."],
      ["من هو خاتم الأنبياء والمرسلين؟", ["عيسى عليه السلام", "موسى عليه السلام", "محمد ﷺ", "إبراهيم عليه السلام"], 2, "النبي محمد ﷺ هو خاتم الأنبياء."],
      ["كم عدد سور القرآن الكريم؟", ["100", "114", "120", "99"], 1, "عدد سور القرآن 114 سورة."],
    ]),
  },
  {
    id: "g11-history",
    name: "Jordan History",
    nameAr: "تاريخ الأردن",
    icon: "🏛️",
    color: "from-amber-500 to-orange-600",
    questions: mk("g11-history", [
      ["متى تأسست إمارة شرق الأردن؟", ["1918", "1921", "1946", "1952"], 1, "تأسست إمارة شرق الأردن عام 1921."],
      ["من هو مؤسس المملكة الأردنية الهاشمية؟", ["الملك حسين", "الملك عبدالله الأول", "الملك طلال", "الشريف حسين"], 1, "الملك عبدالله الأول بن الحسين هو المؤسس."],
      ["في أي عام تم استقلال الأردن؟", ["1921", "1946", "1948", "1952"], 1, "استقل الأردن في 25 مايو 1946."],
      ["ما هي عاصمة المملكة الأردنية الهاشمية؟", ["إربد", "الزرقاء", "عمّان", "العقبة"], 2, "عمّان هي العاصمة."],
      ["الثورة العربية الكبرى انطلقت عام؟", ["1908", "1916", "1920", "1925"], 1, "انطلقت الثورة العربية الكبرى عام 1916."],
    ]),
  },
  {
    id: "g11-math",
    name: "Mathematics",
    nameAr: "الرياضيات",
    icon: "📐",
    color: "from-blue-500 to-indigo-600",
    questions: mk("g11-math", [
      ["ما قيمة س في المعادلة: 2س + 5 = 15؟", ["3", "5", "7", "10"], 1, "2س = 10 إذن س = 5."],
      ["ما هو ناتج (3)² + (4)²؟", ["25", "49", "12", "7"], 0, "9 + 16 = 25."],
      ["مساحة المستطيل طوله 8 وعرضه 5:", ["13", "26", "40", "45"], 2, "المساحة = الطول × العرض = 40."],
      ["جا 30° تساوي:", ["1", "0.5", "√3/2", "0"], 1, "جا 30° = 1/2."],
      ["مشتقة الدالة س² هي:", ["س", "2س", "س³", "2"], 1, "d/dx(س²) = 2س."],
    ]),
  },
  {
    id: "g11-arabic",
    name: "Arabic",
    nameAr: "اللغة العربية",
    icon: "🖋️",
    color: "from-rose-500 to-pink-600",
    questions: mk("g11-arabic", [
      ["ما نوع الكلمة (كتاب)؟", ["فعل", "حرف", "اسم", "ضمير"], 2, "كتاب اسم لأنه يدل على مسمى."],
      ["إعراب الفاعل:", ["مجرور", "منصوب", "مرفوع", "مجزوم"], 2, "الفاعل مرفوع دائماً."],
      ["جمع كلمة (قلم):", ["قلمان", "أقلام", "قلوم", "قلمات"], 1, "الجمع هو أقلام."],
      ["ما نوع (لن) في (لن أذهب)؟", ["حرف نفي", "حرف نصب ونفي", "حرف جزم", "اسم"], 1, "لن حرف نصب ونفي واستقبال."],
      ["من هو شاعر النيل؟", ["أحمد شوقي", "حافظ إبراهيم", "المتنبي", "نزار قباني"], 1, "حافظ إبراهيم هو شاعر النيل."],
    ]),
  },
];

// Helper to generate generic subject questions
const genQuestions = (prefix: string, topic: string, topicAr: string): Question[] => [
  { id: `${prefix}-1`, q: `ما هو المفهوم الأساسي في ${topicAr}؟`, options: ["المفهوم الأول", "المفهوم الثاني", "المفهوم الثالث", "المفهوم الرابع"], answer: 1, explanation: `المفهوم الأساسي في ${topicAr} هو الثاني وفقاً للمنهاج.` },
  { id: `${prefix}-2`, q: `أي مما يلي يعتبر من تطبيقات ${topicAr}؟`, options: ["التطبيق أ", "التطبيق ب", "التطبيق ج", "جميع ما سبق"], answer: 3, explanation: "جميع الخيارات المذكورة من التطبيقات المهمة." },
  { id: `${prefix}-3`, q: `ما هي الوحدة القياسية المستخدمة في ${topicAr}؟`, options: ["الوحدة الأولى", "الوحدة الثانية", "الوحدة الثالثة", "الوحدة الرابعة"], answer: 0, explanation: "الوحدة الأولى هي القياسية المعتمدة." },
  { id: `${prefix}-4`, q: `من أهم علماء ${topicAr}:`, options: ["العالم الأول", "العالم الثاني", "العالم الثالث", "العالم الرابع"], answer: 2, explanation: "العالم الثالث كان له إسهامات بارزة." },
  { id: `${prefix}-5`, q: `النظرية الأساسية في ${topicAr} تنص على:`, options: ["النص الأول", "النص الثاني", "النص الثالث", "النص الرابع"], answer: 1, explanation: "النص الثاني هو الصياغة المعتمدة للنظرية." },
];

// Physics-specific
const physicsQ: Question[] = mk("g12-physics", [
  ["وحدة قياس القوة في النظام الدولي:", ["جول", "نيوتن", "واط", "باسكال"], 1, "وحدة القوة هي النيوتن (N)."],
  ["قانون نيوتن الثاني يربط بين:", ["السرعة والزمن", "القوة والتسارع", "الطاقة والقدرة", "الكتلة والحجم"], 1, "F = m × a."],
  ["سرعة الضوء في الفراغ تقريباً:", ["3×10⁶ م/ث", "3×10⁸ م/ث", "3×10¹⁰ م/ث", "3×10⁵ م/ث"], 1, "سرعة الضوء ≈ 3×10⁸ م/ث."],
  ["الطاقة الحركية تعطى بالعلاقة:", ["mgh", "½mv²", "F×d", "P×t"], 1, "KE = ½mv²."],
  ["وحدة قياس الشحنة الكهربائية:", ["أمبير", "فولت", "كولوم", "أوم"], 2, "الشحنة تقاس بالكولوم."],
]);

// Chemistry-specific
const chemistryQ: Question[] = mk("g12-chem", [
  ["الرمز الكيميائي للماء:", ["CO₂", "H₂O", "O₂", "NaCl"], 1, "الماء = H₂O."],
  ["العدد الذري للكربون:", ["6", "8", "12", "14"], 0, "الكربون عدده الذري 6."],
  ["الأس الهيدروجيني للماء النقي:", ["5", "7", "9", "14"], 1, "pH الماء النقي = 7."],
  ["أي مما يلي فلز؟", ["أكسجين", "نيتروجين", "حديد", "كلور"], 2, "الحديد فلز."],
  ["الرابطة بين الصوديوم والكلور في NaCl:", ["تساهمية", "أيونية", "فلزية", "هيدروجينية"], 1, "رابطة أيونية."],
]);

// Biology-specific
const biologyQ: Question[] = mk("g12-bio", [
  ["الوحدة الأساسية للكائن الحي:", ["النسيج", "العضو", "الخلية", "الجهاز"], 2, "الخلية هي الوحدة الأساسية."],
  ["الحمض النووي يوجد في:", ["السيتوبلازم فقط", "النواة", "الغشاء", "الجدار"], 1, "DNA في النواة."],
  ["عملية البناء الضوئي تحدث في:", ["الميتوكوندريا", "البلاستيدات الخضراء", "الريبوسومات", "النواة"], 1, "في البلاستيدات الخضراء."],
  ["كم عدد الكروموسومات في خلية الإنسان الجسدية؟", ["23", "46", "48", "44"], 1, "46 كروموسوم (23 زوج)."],
  ["الجزيء الحامل للطاقة في الخلية:", ["DNA", "RNA", "ATP", "الجلوكوز"], 2, "ATP يخزن الطاقة."],
]);

// Math advanced
const mathAdvQ: Question[] = mk("g12-math", [
  ["مشتقة الدالة f(س) = س³:", ["س²", "3س²", "3س", "س⁴/4"], 1, "d/dx(س³) = 3س²."],
  ["نهاية س→0 من (جاس/س):", ["0", "1", "∞", "غير معرفة"], 1, "نهاية شهيرة = 1."],
  ["تكامل 2س dx:", ["س²", "س² + c", "2", "2س² + c"], 1, "∫2س dx = س² + c."],
  ["حل المعادلة: س² - 4 = 0:", ["±2", "2 فقط", "4", "0"], 0, "س = ±2."],
  ["لوغاريتم 100 على الأساس 10:", ["1", "2", "10", "100"], 1, "log₁₀(100) = 2."],
]);

// English advanced
const englishQ: Question[] = mk("g12-eng", [
  ["Choose the correct form: 'She ___ to school every day.'", ["go", "goes", "going", "gone"], 1, "Third person singular takes 'goes'."],
  ["What is a synonym of 'happy'?", ["sad", "joyful", "angry", "tired"], 1, "'Joyful' means happy."],
  ["Past tense of 'run':", ["runned", "ran", "runs", "running"], 1, "Irregular past: 'ran'."],
  ["Choose the passive: 'The book was ___ by Ali.'", ["write", "wrote", "written", "writing"], 2, "Passive uses past participle."],
  ["Which is a preposition?", ["quickly", "under", "beautiful", "run"], 1, "'Under' is a preposition."],
]);

// Arabic specialization
const arabicSpecQ: Question[] = mk("g12-ar", [
  ["البلاغة تنقسم إلى:", ["علمين", "ثلاثة علوم", "أربعة علوم", "خمسة علوم"], 1, "المعاني والبيان والبديع."],
  ["التشبيه من علم:", ["المعاني", "البيان", "البديع", "العروض"], 1, "التشبيه من علم البيان."],
  ["البحر الطويل تفعيلته:", ["فعولن مفاعيلن", "مستفعلن فاعلن", "متفاعلن", "مفاعلتن"], 0, "فعولن مفاعيلن."],
  ["الجناس من محسنات:", ["معنوية", "لفظية", "خبرية", "إنشائية"], 1, "الجناس محسن لفظي."],
  ["ديوان المتنبي يعبر عن العصر:", ["الجاهلي", "الأموي", "العباسي", "الأندلسي"], 2, "المتنبي عباسي."],
]);

// Islamic specialization
const islamicSpecQ: Question[] = mk("g12-isl", [
  ["أصول الفقه الأربعة:", ["القرآن والسنة والإجماع والقياس", "القرآن فقط", "السنة والقياس", "الإجماع فقط"], 0, "الأدلة الأربعة المتفق عليها."],
  ["أنواع الحديث من حيث الصحة:", ["نوعان", "ثلاثة", "أربعة", "خمسة"], 1, "صحيح وحسن وضعيف."],
  ["الفقه لغةً:", ["الفهم", "العلم", "الحفظ", "الكتابة"], 0, "الفقه = الفهم."],
  ["مقاصد الشريعة الكلية:", ["ثلاثة", "أربعة", "خمسة", "ستة"], 2, "الدين والنفس والعقل والنسل والمال."],
  ["أول من دون علم أصول الفقه:", ["أبو حنيفة", "الشافعي", "مالك", "أحمد"], 1, "الإمام الشافعي في الرسالة."],
]);

// Financial literacy
const financeQ: Question[] = mk("g12-fin", [
  ["الفائدة المركبة تحسب على:", ["الأصل فقط", "الأصل والفائدة السابقة", "الفائدة فقط", "المصروفات"], 1, "الأصل + الفوائد المتراكمة."],
  ["الميزانية الشخصية تعني:", ["الإنفاق فقط", "الدخل فقط", "خطة للدخل والإنفاق", "الاقتراض"], 2, "خطة موازنة."],
  ["الاستثمار طويل الأجل يشمل:", ["الحساب الجاري", "الأسهم والسندات", "النقد فقط", "الودائع اليومية"], 1, "أسهم وسندات."],
  ["التضخم يؤدي إلى:", ["زيادة القوة الشرائية", "انخفاض القوة الشرائية", "لا تأثير", "استقرار الأسعار"], 1, "انخفاض القوة الشرائية."],
  ["البنك المركزي في الأردن:", ["البنك العربي", "البنك المركزي الأردني", "بنك الإسكان", "الأهلي"], 1, "البنك المركزي الأردني."],
]);

const businessMathQ: Question[] = mk("g12-bmath", [
  ["إذا كان سعر السلعة 50 دينار وخصم 20%، السعر بعد الخصم:", ["30", "40", "45", "48"], 1, "50 - 10 = 40."],
  ["الربح = ", ["الإيراد + التكلفة", "الإيراد - التكلفة", "التكلفة - الإيراد", "الإيراد × التكلفة"], 1, "الربح = الإيراد - التكلفة."],
  ["نسبة 25% من 200 =", ["25", "50", "75", "100"], 1, "200 × 0.25 = 50."],
  ["إذا كان الراتب 800 والضريبة 10%، الصافي:", ["700", "720", "780", "800"], 1, "800 - 80 = 720."],
  ["معدل النمو السنوي 5%، بعد سنتين المبلغ 1000 يصبح:", ["1050", "1100", "1102.5", "1150"], 2, "1000×1.05² = 1102.5."],
]);

const makeSubject = (id: string, name: string, nameAr: string, icon: string, color: string, questions: Question[]): Subject => ({
  id, name, nameAr, icon, color, questions,
});

// ===== Grade 12 Fields =====
export const grade12Fields: Field[] = [
  {
    id: "medical",
    name: "Medical Field",
    nameAr: "الحقل الصحّي",
    category: "scientific",
    icon: "🩺",
    subjects: [
      makeSubject("med-chem", "Chemistry", "الكيمياء", "⚗️", "from-green-500 to-emerald-600", chemistryQ),
      makeSubject("med-bio", "Biology", "الأحياء", "🧬", "from-teal-500 to-cyan-600", biologyQ),
      makeSubject("med-eng", "Advanced English", "الإنجليزي المتقدم", "🇬🇧", "from-blue-500 to-sky-600", englishQ),
      makeSubject("med-elective", "Elective Subject", "مبحث اختياري", "📚", "from-violet-500 to-purple-600", genQuestions("med-elective", "elective", "المبحث الاختياري")),
    ],
  },
  {
    id: "engineering",
    name: "Engineering Field",
    nameAr: "الحقل الهندسي",
    category: "scientific",
    icon: "⚙️",
    subjects: [
      makeSubject("eng-math", "Mathematics", "الرياضيات", "📐", "from-blue-500 to-indigo-600", mathAdvQ),
      makeSubject("eng-phys", "Physics", "الفيزياء", "⚛️", "from-orange-500 to-red-600", physicsQ),
      makeSubject("eng-sci", "Scientific Subject", "مبحث علمي", "🔬", "from-cyan-500 to-blue-600", genQuestions("eng-sci", "science", "المبحث العلمي")),
      makeSubject("eng-elective", "Elective Subject", "مبحث اختياري", "📚", "from-violet-500 to-purple-600", genQuestions("eng-elective", "elective", "المبحث الاختياري")),
    ],
  },
  {
    id: "science-tech",
    name: "Science & Technology",
    nameAr: "العلوم والتكنولوجيا",
    category: "scientific",
    icon: "💻",
    subjects: [
      makeSubject("st-math", "Mathematics", "الرياضيات", "📐", "from-blue-500 to-indigo-600", mathAdvQ),
      makeSubject("st-sci1", "Scientific Subject 1", "علمي 1", "🧪", "from-green-500 to-teal-600", genQuestions("st-sci1", "sci1", "العلمي الأول")),
      makeSubject("st-sci2", "Scientific Subject 2", "علمي 2", "🔭", "from-cyan-500 to-blue-600", genQuestions("st-sci2", "sci2", "العلمي الثاني")),
      makeSubject("st-elective", "Elective Subject", "مبحث اختياري", "📚", "from-violet-500 to-purple-600", genQuestions("st-elective", "elective", "المبحث الاختياري")),
    ],
  },
  {
    id: "languages",
    name: "Languages & Social Sciences",
    nameAr: "اللغات والعلوم الاجتماعية",
    category: "humanitarian",
    icon: "🌍",
    subjects: [
      makeSubject("lang-ar", "Arabic Specialization", "عربي تخصص", "🖋️", "from-rose-500 to-pink-600", arabicSpecQ),
      makeSubject("lang-eng", "Advanced English", "إنجليزي متقدم", "🇬🇧", "from-blue-500 to-sky-600", englishQ),
      makeSubject("lang-hum", "Humanitarian Subject", "مبحث إنساني", "📖", "from-amber-500 to-orange-600", genQuestions("lang-hum", "humanities", "المبحث الإنساني")),
      makeSubject("lang-elective", "Elective Subject", "مبحث اختياري", "📚", "from-violet-500 to-purple-600", genQuestions("lang-elective", "elective", "المبحث الاختياري")),
    ],
  },
  {
    id: "law",
    name: "Law & Islamic Sciences",
    nameAr: "القانون والعلوم الشرعية",
    category: "humanitarian",
    icon: "⚖️",
    subjects: [
      makeSubject("law-ar", "Arabic Specialization", "عربي تخصص", "🖋️", "from-rose-500 to-pink-600", arabicSpecQ),
      makeSubject("law-isl", "Islamic Sciences", "علوم شرعية تخصص", "🕌", "from-emerald-500 to-teal-600", islamicSpecQ),
      makeSubject("law-hum", "Humanitarian Subject", "مبحث إنساني", "📖", "from-amber-500 to-orange-600", genQuestions("law-hum", "humanities", "المبحث الإنساني")),
      makeSubject("law-elective", "Elective Subject", "مبحث اختياري", "📚", "from-violet-500 to-purple-600", genQuestions("law-elective", "elective", "المبحث الاختياري")),
    ],
  },
  {
    id: "business",
    name: "Business Field",
    nameAr: "حقل الأعمال",
    category: "humanitarian",
    icon: "💼",
    subjects: [
      makeSubject("bus-math", "Business Mathematics", "رياضيات الأعمال", "📊", "from-indigo-500 to-blue-600", businessMathQ),
      makeSubject("bus-fin", "Financial Literacy", "الثقافة المالية", "💰", "from-yellow-500 to-amber-600", financeQ),
      makeSubject("bus-eng", "Advanced English", "إنجليزي متقدم", "🇬🇧", "from-blue-500 to-sky-600", englishQ),
      makeSubject("bus-elective", "Elective Subject", "مبحث اختياري", "📚", "from-violet-500 to-purple-600", genQuestions("bus-elective", "elective", "المبحث الاختياري")),
    ],
  },
];

export const allSubjects: Subject[] = [
  ...grade11Subjects,
  ...grade12Fields.flatMap((f) => f.subjects),
];

export const getSubject = (id: string): Subject | undefined =>
  allSubjects.find((s) => s.id === id);

export const getField = (id: string): Field | undefined =>
  grade12Fields.find((f) => f.id === id);

// ===== Dummy Users =====
export type DummyUser = {
  id: string;
  name: string;
  email: string;
  grade: "11" | "12";
  field?: string;
  joined: string;
  subscription: "Free" | "Premium" | "Full Year";
  active: boolean;
  score: number;
  examsCompleted: number;
};

export const dummyUsers: DummyUser[] = [
  { id: "u1", name: "أحمد الخطيب", email: "ahmad@example.com", grade: "12", field: "medical", joined: "2025-09-12", subscription: "Premium", active: true, score: 187, examsCompleted: 24 },
  { id: "u2", name: "ليلى العمري", email: "layla@example.com", grade: "12", field: "engineering", joined: "2025-08-03", subscription: "Full Year", active: true, score: 194, examsCompleted: 31 },
  { id: "u3", name: "خالد الزعبي", email: "khaled@example.com", grade: "11", joined: "2025-10-20", subscription: "Free", active: true, score: 142, examsCompleted: 8 },
  { id: "u4", name: "سارة المومني", email: "sara@example.com", grade: "12", field: "business", joined: "2025-07-15", subscription: "Premium", active: true, score: 178, examsCompleted: 19 },
  { id: "u5", name: "يوسف حداد", email: "yousef@example.com", grade: "12", field: "law", joined: "2025-11-01", subscription: "Free", active: false, score: 120, examsCompleted: 5 },
  { id: "u6", name: "رنا القيسي", email: "rana@example.com", grade: "12", field: "languages", joined: "2025-06-08", subscription: "Full Year", active: true, score: 189, examsCompleted: 27 },
  { id: "u7", name: "عمر السرحان", email: "omar@example.com", grade: "11", joined: "2025-10-11", subscription: "Premium", active: true, score: 165, examsCompleted: 14 },
  { id: "u8", name: "دانا الحاج", email: "dana@example.com", grade: "12", field: "science-tech", joined: "2025-09-28", subscription: "Free", active: true, score: 154, examsCompleted: 11 },
  { id: "u9", name: "محمد الطراونة", email: "moh@example.com", grade: "12", field: "medical", joined: "2025-05-19", subscription: "Full Year", active: true, score: 196, examsCompleted: 40 },
  { id: "u10", name: "نور العجارمة", email: "noor@example.com", grade: "11", joined: "2025-11-15", subscription: "Free", active: true, score: 131, examsCompleted: 6 },
  { id: "u11", name: "فارس الكردي", email: "faris@example.com", grade: "12", field: "engineering", joined: "2025-08-22", subscription: "Premium", active: true, score: 182, examsCompleted: 22 },
  { id: "u12", name: "هبة سليمان", email: "hiba@example.com", grade: "12", field: "law", joined: "2025-04-30", subscription: "Full Year", active: true, score: 191, examsCompleted: 34 },
];

export const activityData = [
  { day: "السبت", users: 210, exams: 145 },
  { day: "الأحد", users: 340, exams: 234 },
  { day: "الاثنين", users: 412, exams: 298 },
  { day: "الثلاثاء", users: 385, exams: 271 },
  { day: "الأربعاء", users: 456, exams: 331 },
  { day: "الخميس", users: 502, exams: 389 },
  { day: "الجمعة", users: 289, exams: 178 },
];

export const subjectPopularity = [
  { name: "الرياضيات", value: 32 },
  { name: "الفيزياء", value: 24 },
  { name: "الكيمياء", value: 21 },
  { name: "الأحياء", value: 18 },
  { name: "الإنجليزي", value: 28 },
  { name: "العربي", value: 19 },
];

export const revenueData = [
  { month: "يناير", revenue: 4200 },
  { month: "فبراير", revenue: 5100 },
  { month: "مارس", revenue: 6300 },
  { month: "أبريل", revenue: 5800 },
  { month: "مايو", revenue: 7200 },
  { month: "يونيو", revenue: 8400 },
  { month: "يوليو", revenue: 9100 },
];

export const blogPosts = [
  { id: "1", title: "أفضل 10 نصائح للاستعداد للتوجيهي", excerpt: "دليلك الشامل لتحقيق أعلى المعدلات في امتحان الثانوية العامة الأردنية.", category: "نصائح دراسية", date: "2025-11-15", read: "5 دقائق" },
  { id: "2", title: "كيف تدرس الرياضيات بذكاء؟", excerpt: "استراتيجيات مثبتة علمياً لإتقان مادة الرياضيات وحل المسائل بسرعة.", category: "رياضيات", date: "2025-11-10", read: "7 دقائق" },
  { id: "3", title: "إدارة الوقت خلال الامتحان", excerpt: "تعلم كيف توزع وقتك على الأسئلة لتجنب التوتر وتحقيق أفضل نتيجة.", category: "استراتيجيات", date: "2025-11-05", read: "4 دقائق" },
  { id: "4", title: "الفرق بين المسار الأكاديمي الجديد والقديم", excerpt: "شرح مفصل للتغييرات في نظام التوجيهي الجديد وكيف تختار حقلك المناسب.", category: "أخبار تعليمية", date: "2025-10-28", read: "8 دقائق" },
  { id: "5", title: "التغذية الصحية وأثرها على التركيز", excerpt: "أطعمة تعزز الذاكرة والتركيز خلال فترة الدراسة والامتحانات.", category: "صحة الطالب", date: "2025-10-20", read: "6 دقائق" },
  { id: "6", title: "خطة دراسية أسبوعية فعّالة", excerpt: "نموذج جاهز لتنظيم أسبوعك الدراسي وتحقيق التوازن بين المواد.", category: "تنظيم", date: "2025-10-12", read: "5 دقائق" },
];
