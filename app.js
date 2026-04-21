/* ====================================================================
   単位取得確認アプリ — app.js
   東北大学 工学部 機械知能・航空工学科 全7コース対応
   ==================================================================== */

/* ====================================================================
   PDF.js 初期化
   ==================================================================== */
if (typeof pdfjsLib !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/* ====================================================================
   定数: GPA・カテゴリ・卒業要件（全コース共通）
   ==================================================================== */
var GP_MAP = { AA: 4, A: 3, B: 2, C: 1, D: 0 };

/* カテゴリ定義（全コース共通構造） */
var CATS = [
  {
    id: "z_kiban",
    name: "全学基盤必修",
    req: 20,
    grp: "zen_h",
    desc: "学問論, 自然科学総合実験, 情報とデータの基礎, 線形代数学A, 解析学A/B, 常微分方程式論, 物理学A/B, 化学B（10科目20単位）",
  },
  {
    id: "z_eigo",
    name: "英語必修",
    req: 6,
    grp: "zen_h",
    desc: "英語Ⅰ-A/B, Ⅱ-A/B, Ⅲ, Ⅲ(e-learning)（6科目6単位）",
  },
  {
    id: "z_s1",
    name: "選択1（体育等）",
    req: 1,
    grp: "zen_s",
    desc: "学問論演習, スポーツA, 体と健康, 身体の文化と科学",
  },
  {
    id: "z_s2",
    name: "選択2（現代素養等）",
    req: 6,
    grp: "zen_s",
    desc: "展開学問論, 現代素養科目群（情報とデータの基礎除く）, 先端学術科目群",
  },
  {
    id: "z_s3",
    name: "選択3（人文社会等）",
    req: 6,
    grp: "zen_s",
    desc: "人文科学, 社会科学, 学際科目群等（内2単位は選択4から読替可）",
  },
  {
    id: "z_s4",
    name: "選択4（学術基礎）",
    req: 6,
    grp: "zen_s",
    desc: "基礎数学(線形代数学B,複素関数論等), 基礎物理, 基礎化学(化学C等), 基礎生物, 基礎宇宙地球",
  },
  {
    id: "z_ga",
    name: "外国語（初修語Ⅰ）",
    req: 2,
    grp: "zen_s",
    desc: "初修語群の中から1外国語を選択し2単位",
  },
  {
    id: "z_gb",
    name: "外国語（初修語Ⅱ/工学英語等）",
    req: 2,
    grp: "zen_s",
    desc: "基礎初修語Ⅱ(2単位) または 工学英語Ⅰ/Ⅱ/ｱｶﾃﾞﾐｯｸ・ﾗｲﾃｨﾝｸﾞ(各1単位)から2単位",
  },
  {
    id: "s_kou",
    name: "工学共通必修",
    req: 3,
    grp: "sen_h",
    desc: "数学物理学演習Ⅰ/Ⅱ, 情報処理演習（3科目3単位）",
  },
  {
    id: "s_gak",
    name: "学科専門必修",
    req: 15,
    grp: "sen_h",
    desc: "☆印科目 + 卒業研究(6単位)",
  },
  {
    id: "s1",
    name: "選択必修①",
    grp: "sen_sm",
    desc: "数学Ⅰ/Ⅱ, 数理解析学, 力学, 数理情報学演習, 材料力学Ⅰ",
  },
  { id: "s2", name: "選択必修②", grp: "sen_sm", desc: "流体力学Ⅰ, 材料力学Ⅱ" },
  {
    id: "s3",
    name: "選択必修③",
    grp: "sen_sm",
    desc: "量子力学, 機械力学Ⅰ, 熱力学Ⅰ, 制御工学Ⅰ",
  },
  {
    id: "s4",
    name: "選択必修④",
    grp: "sen_sm",
    desc: "電磁気学, 熱力学Ⅱ, 材料科学Ⅰ/Ⅱ, 機械力学Ⅱ",
  },
  {
    id: "s5",
    name: "選択必修⑤",
    req: 16,
    grp: "sen_sm",
    desc: "5〜6セメスターの○印科目",
  },
  { id: "s6", name: "選択⑥", grp: "sen_sm", desc: "7セメスター以降の選択科目" },
  {
    id: "s_other",
    name: "専門一般選択",
    grp: "sen_s",
    desc: "選択必修①〜⑥に含まれない○印科目",
  },
];

/* 複合要件（全コース共通） */
var CROSS_REQS = [
  { cats: ["s1", "s2"], req: 12, label: "①＋② ≥ 12" },
  { cats: ["s2", "s3"], req: 10, label: "②＋③ ≥ 10" },
  { cats: ["s3", "s4"], req: 12, label: "③＋④ ≥ 12" },
  { cats: ["s5"], req: 16, label: "⑤ ≥ 16" },
];

/* 卒業要件単位数（全コース共通） */
var GRAD = { zen_h: 26, zen_s: 23, sen_h: 18, sen_s: 63, total: 130 };

/* ====================================================================
   コース定義（7コース）
   ==================================================================== */
var COURSE_LIST = [
  { id: "sys", name: "機械システムコース", eng: "Mechanical Systems" },
  { id: "fine", name: "ファインメカニクスコース", eng: "Finemechanics" },
  { id: "robo", name: "ロボティクスコース", eng: "Robotics" },
  { id: "aero", name: "航空宇宙コース", eng: "Aerospace Engineering" },
  {
    id: "biomed",
    name: "機械・医工学コース",
    eng: "Mechanical / Biomedical Engineering",
  },
  {
    id: "quantum",
    name: "量子サイエンスコース",
    eng: "Quantum Science and Energy Engineering",
  },
  {
    id: "energy",
    name: "エネルギー環境コース",
    eng: "Environment and Energy Engineering",
  },
];

/* ====================================================================
   科目→カテゴリ マッピング
   ==================================================================== */
function normName(s) {
  return s
    .replace(/\s+/g, "")
    .replace(/[Ａ-Ｚ]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
    })
    .replace(/[ａ-ｚ]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
    })
    .replace(/[０-９]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
    })
    .replace(/－/g, "-")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/　/g, "");
}

/* 全学教育科目マッピング（全コース共通） */
var COMMON_CAT = {};
(function () {
  var m = {
    /* 全学基盤必修 */
    学問論: "z_kiban",
    自然科学総合実験: "z_kiban",
    情報とデータの基礎: "z_kiban",
    線形代数学A: "z_kiban",
    解析学A: "z_kiban",
    解析学B: "z_kiban",
    常微分方程式論: "z_kiban",
    物理学A: "z_kiban",
    物理学B: "z_kiban",
    化学B: "z_kiban",
    /* 英語必修 */
    "英語Ⅰ-A": "z_eigo",
    "英語Ⅰ-B": "z_eigo",
    "英語Ⅱ-A": "z_eigo",
    "英語Ⅱ-B": "z_eigo",
    英語Ⅲ: "z_eigo",
    "英語Ⅲ(e-learning)": "z_eigo",
    /* 選択1 体育等 */
    スポーツA: "z_s1",
    スポーツB: "z_s1",
    体と健康: "z_s1",
    身体の文化と科学: "z_s1",
    学問論演習: "z_s1",
    /* 選択4 学術基礎 */
    線形代数学B: "z_s4",
    線形代数数学B: "z_s4",
    複素関数論: "z_s4",
    数理統計学: "z_s4",
    物理学C: "z_s4",
    基礎物理数学: "z_s4",
    化学A: "z_s4",
    化学C: "z_s4",
    生命科学A: "z_s4",
    地球物質科学: "z_s4",
    地球システム科学: "z_s4",
    /* 工学共通必修 */
    数学物理学演習Ⅰ: "s_kou",
    数学物理学演習Ⅱ: "s_kou",
    情報処理演習: "s_kou",
  };
  for (var k in m) {
    COMMON_CAT[normName(k)] = m[k];
  }
})();

/* 専門教育科目マッピング（コース別） */
/* 5メインコース共通の専門科目 */
var SENMON_COMMON = {
  /* 選択必修① */
  数学Ⅰ: "s1",
  数学Ⅱ: "s1",
  数理解析学: "s1",
  力学: "s1",
  数理情報学演習: "s1",
  材料力学Ⅰ: "s1",
  /* 選択必修② */
  流体力学Ⅰ: "s2",
  材料力学Ⅱ: "s2",
  /* 選択必修③ */
  量子力学: "s3",
  機械力学Ⅰ: "s3",
  熱力学Ⅰ: "s3",
  制御工学Ⅰ: "s3",
  /* 選択必修④ */
  電磁気学: "s4",
  熱力学Ⅱ: "s4",
  材料科学Ⅰ: "s4",
  材料科学Ⅱ: "s4",
  機械力学Ⅱ: "s4",
  /* 選択必修⑤ (5-6セメ) */
  機械創成学Ⅰ: "s5",
  機械創成学Ⅱ: "s5",
  情報科学基礎Ⅰ: "s5",
  情報科学基礎Ⅱ: "s5",
  電気電子回路Ⅰ: "s5",
  電気電子回路Ⅱ: "s5",
  制御工学Ⅱ: "s5",
  流体力学Ⅱ: "s5",
  伝熱学: "s5",
  "熱・物質輸送論": "s5",
  弾性力学: "s5",
  宇宙工学: "s5",
  生命機械工学: "s5",
  コンピュータ実習Ⅱ: "s5",
  材料強度学: "s5",
  計算材料力学: "s5",
  数値流体力学: "s5",
  空気力学: "s5",
  機械設計学Ⅰ: "s5",
  機械設計学Ⅱ: "s5",
  ロボティクスⅠ: "s5",
  ロボティクスⅡ: "s5",
  計測工学Ⅰ: "s5",
  計測工学Ⅱ: "s5",
  エネルギー変換工学: "s5",
  航空機設計学: "s5",
  /* 選択⑥ (7セメ〜) */
  トライボロジー: "s6",
  電子工学概論: "s6",
  材料理工学概論: "s6",
  環境工学概論: "s6",
  知的財産権入門: "s6",
  生体医工学入門: "s6",
  工学倫理: "s6",
  工学英語Ⅱ: "s6",
  燃焼工学: "s6",
  航空宇宙機学: "s6",
  /* 専門一般選択 */
  機械工学序説: "s_other",
  工学化学概論: "s_other",
  工学英語Ⅰ: "s_other",
  創造工学研修: "s_other",
  "アカデミック・ライティング": "s_other",
  "機械知能・航空特別研修": "s_other",
  "機械知能・航空特別講義Ⅰ": "s_other",
  "機械知能・航空特別講義Ⅱ": "s_other",
  工学教育院特別講義: "s_other",
  国際工学研修Ⅰ: "s_other",
  国際工学研修Ⅱ: "s_other",
  国際工学研修Ⅲ: "s_other",
  国際工学研修Ⅳ: "s_other",
};

/* 5メインコース共通の必修（☆）科目 → s_gak */
var HISSU_MAIN5 = [
  "コンピュータ実習Ⅰ",
  "機械知能・航空研修Ⅰ",
  "計画及び製図Ⅰ",
  "機械知能・航空実験Ⅰ",
  "機械知能・航空研修Ⅱ",
  "機械工作実習",
  "機械知能・航空実験Ⅱ",
  "計画及び製図Ⅱ",
  "学外見学",
  "卒業研究",
];

/* 量子サイエンス・エネルギー環境の必修科目 */
var HISSU_QE = [
  "コンピュータ実習",
  "計画及び製図",
  "機械知能・航空実験A",
  "機械知能・航空研修A",
  "機械知能・航空実験B",
  "機械知能・航空研修B",
  "学外見学",
  "卒業研究",
];

/* コース固有の追加マッピング */
var COURSE_SPECIFIC = {
  sys: {},
  fine: {},
  robo: {},
  aero: {},
  biomed: {},
  quantum: {
    /* 量子サイエンス入門は必修扱い */
    量子サイエンス入門: "s_gak",
    /* 量子固有の⑤科目 */
    量子力学B: "s5",
    電磁気学B: "s5",
    反応速度論: "s5",
    移動現象論: "s5",
    放射線医用工学: "s5",
    資源循環論: "s5",
    情報科学基礎: "s5",
    電気電子回路: "s5",
    /* 量子固有の⑥科目 */
    放射線安全工学: "s6",
    "核燃料・材料学概論": "s6",
    原子力安全規制概論: "s6",
    材料の強度と破壊: "s5",
  },
  energy: {
    /* エネルギー環境入門は必修扱い */
    エネルギー環境入門: "s_gak",
    /* エネルギー環境固有の⑤科目 */
    材料の強度と破壊: "s5",
    環境地球科学: "s5",
    環境システムⅠ: "s5",
    /* エネルギー環境固有の⑥科目 */
    計算力学: "s6",
    環境システムⅡ: "s6",
    環境材料学: "s6",
    ジオメカニクス: "s6",
    "エネルギー・資源論": "s6",
    核エネルギー物理学: "s6",
    放射化学: "s6",
    中性子輸送学: "s6",
    貯留層工学: "s6",
    エネルギー材料科学: "s6",
    核環境工学: "s6",
    エネルギー環境コース特別講義: "s6",
  },
};

/* 現在のコースに応じたCOURSE_CATを構築 */
var COURSE_CAT = {};
function buildCourseCat(courseId) {
  COURSE_CAT = {};
  /* 1. 共通全学 */
  for (var k in COMMON_CAT) {
    COURSE_CAT[k] = COMMON_CAT[k];
  }
  /* 2. 専門共通 */
  var senmon = {};
  for (var sk in SENMON_COMMON) {
    senmon[sk] = SENMON_COMMON[sk];
  }
  /* 3. 必修科目 → s_gak */
  var hissuList;
  if (courseId === "quantum" || courseId === "energy") {
    hissuList = HISSU_QE;
  } else {
    hissuList = HISSU_MAIN5;
  }
  hissuList.forEach(function (name) {
    senmon[name] = "s_gak";
  });
  /* 4. コース固有 */
  var specific = COURSE_SPECIFIC[courseId] || {};
  for (var cs in specific) {
    senmon[cs] = specific[cs];
  }
  /* 5. 正規化してマージ */
  for (var sn in senmon) {
    COURSE_CAT[normName(sn)] = senmon[sn];
  }
}

/* 成績証明書のセクション名 → カテゴリ (フォールバック用) */
var SECTION_CAT = {
  学問論: "z_s3",
  人文科学: "z_s3",
  社会科学: "z_s3",
  融合型理科実験: "z_kiban",
  保健体育: "z_s1",
  情報教育: "z_s2",
  国際教育: "z_s2",
  キャリア教育: "z_s2",
  "カレント・トピックス": "z_s2",
  "カレント・トピックス科目": "z_s2",
  先端学術: "z_s2",
  "先端学術科目": "z_s2",
  フロンティア: "z_s2",
  "フロンティア科目": "z_s2",
  基礎数学: "z_s4",
  基礎物理: "z_s4",
  基礎化学: "z_s4",
  基礎生物: "z_s4",
  基礎宇宙: "z_s4",
  基礎人文: "z_s4",
  基礎社会: "z_s4",
  学際: "z_s3",
};


/* ====================================================================
   デフォルト成績データ
   ==================================================================== */
var DEFAULT_COURSES = [];

/* ====================================================================
   アプリ状態
   ==================================================================== */
var courses = [];
var filterCat = "all";
var filterGrade = "all";
var currentCourse = "fine";
var currentTab = "dash";
var pendingImportCourses = [];

var STORAGE = {
  credits: "tohoku_credits_v7",
  course: "tohoku_course_id_v7",
};

var SEM_LABELS = { 前期: 1, 後期: 2 };
var GRADE_OPTIONS = ["AA", "A", "B", "C", "D"];

var ELIGIBLE_3SEM_POOL = buildNormSet([
  "自然科学総合実験",
  "情報とデータの基礎",
  "線形代数学A",
  "線形代数学B",
  "解析学A",
  "解析学B",
  "常微分方程式論",
  "複素関数論",
  "数理統計学",
  "物理学A",
  "物理学B",
  "物理学C",
  "基礎物理数学",
  "基礎物理学数学",
  "化学A",
  "化学B",
  "化学C",
  "生命科学A",
  "地球物質科学",
  "数学物理学演習Ⅰ",
  "数学物理学演習Ⅱ",
  "情報処理演習",
]);

var REQUIRED_BY_3SEM = buildNormSet([
  "学問論",
  "自然科学総合実験",
  "情報とデータの基礎",
  "線形代数学A",
  "解析学A",
  "解析学B",
  "常微分方程式論",
  "物理学A",
  "物理学B",
  "化学B",
  "英語Ⅰ-A",
  "英語Ⅰ-B",
  "英語Ⅱ-A",
  "英語Ⅱ-B",
  "英語Ⅲ",
  "英語Ⅲ(e-learning)",
  "数学物理学演習Ⅰ",
  "数学物理学演習Ⅱ",
  "情報処理演習",
]);

function buildNormSet(names) {
  var set = {};
  names.forEach(function (name) {
    set[normName(name)] = true;
  });
  return set;
}

function escapedHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toAscii(s) {
  return String(s == null ? "" : s)
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
    })
    .replace(/－/g, "-")
    .replace(/Ⅰ/g, "I")
    .replace(/Ⅱ/g, "II")
    .replace(/Ⅲ/g, "III")
    .replace(/Ⅳ/g, "IV")
    .replace(/Ⅴ/g, "V")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/　/g, " ");
}

function cleanCourseName(name) {
  var s = String(name || "").trim();
  s = s.replace(/^※+/, "");
  s = s.replace(/\s+/g, " ");
  if (!s) return "";
  var parts = s.split(" ");
  if (parts.length % 2 === 0) {
    var half = parts.length / 2;
    var first = parts.slice(0, half).join("");
    var second = parts.slice(half).join("");
    if (first === second) {
      s = parts.slice(0, half).join(" ");
    }
  }
  if (/^(.+)\s+\1$/.test(s)) {
    s = s.replace(/^(.+)\s+\1$/, "$1");
  }
  s = s.replace(/\s+\([^)]+\)$/, function (m) {
    return m.indexOf("e-learning") >= 0 ? m : "";
  });
  return s.trim();
}

function isIntroLanguageI(name) {
  var a = toAscii(name);
  return /^基礎(ドイツ|フランス|ロシア|スペイン|中国|朝鮮)語I$/.test(a);
}

function isIntroLanguageII(name) {
  var a = toAscii(name);
  return /^基礎(ドイツ|フランス|ロシア|スペイン|中国|朝鮮)語II$/.test(a);
}

function isEngineeringEnglish(name) {
  var n = normName(name);
  return (
    n === normName("工学英語Ⅰ") ||
    n === normName("工学英語Ⅱ") ||
    n === normName("アカデミック・ライティング")
  );
}

var ONE_CREDIT_COURSE_SET = buildNormSet([
  "英語Ⅰ-A",
  "英語Ⅰ-B",
  "英語Ⅱ-A",
  "英語Ⅱ-B",
  "英語Ⅲ",
  "英語Ⅲ(e-learning)",
  "学問論演習",
  "展開学問論",
  "スポーツA",
  "数学物理学演習Ⅰ",
  "数学物理学演習Ⅱ",
  "情報処理演習",
  "工学英語Ⅰ",
  "工学英語Ⅱ",
  "アカデミック・ライティング",
  "創造工学研修",
  "コンピュータ実習Ⅰ",
  "コンピュータ実習Ⅱ",
  "計画及び製図Ⅰ",
  "計画及び製図Ⅱ",
  "機械知能・航空実験Ⅰ",
  "機械知能・航空実験Ⅱ",
  "機械知能・航空研修Ⅱ",
  "機械工作実習",
  "機械知能・航空研修A1",
  "機械知能・航空研修A2",
  "機械知能・航空実験A",
  "機械知能・航空研修B",
  "機械知能・航空実験B",
  "知的財産権入門",
  "工学倫理"
]);

var ZERO_CREDIT_COURSE_SET = buildNormSet([
  "学外見学"
]);

var SIX_CREDIT_COURSE_SET = buildNormSet([
  "卒業研究"
]);

function inferCourseCredit(name, section) {
  var clean = cleanCourseName(name);
  var norm = normName(clean);
  if (!norm) return 0;
  if (ZERO_CREDIT_COURSE_SET[norm]) return 0;
  if (SIX_CREDIT_COURSE_SET[norm]) return 6;
  if (ONE_CREDIT_COURSE_SET[norm]) return 1;

  if (isIntroLanguageI(clean) || isIntroLanguageII(clean)) return 2;
  if (norm === normName("体と健康") || norm === normName("身体の文化と科学")) return 2;
  if (norm === normName("自然科学総合実験")) return 2;
  if (norm === normName("学問論")) return 2;

  if (
    section === "人文科学" ||
    section === "社会科学" ||
    section === "融合型理科実験" ||
    section === "情報教育" ||
    section === "国際教育" ||
    section === "キャリア教育" ||
    section === "カレント・トピックス科目" ||
    section === "先端学術科目" ||
    section === "フロンティア科目" ||
    section === "基礎数学" ||
    section === "基礎物理学" ||
    section === "基礎化学" ||
    section === "基礎生物学" ||
    section === "基礎宇宙地球科学" ||
    section === "基礎人文科学" ||
    section === "基礎社会科学" ||
    section === "中国語" ||
    section === "ドイツ語" ||
    section === "フランス語" ||
    section === "ロシア語" ||
    section === "スペイン語" ||
    section === "朝鮮語" ||
    section === "機械知能・航空工学科科目" ||
    section === "工学部共通科目"
  ) {
    return 2;
  }

  if (section === "英語") return 1;
  if (section === "保健体育") return norm === normName("スポーツA") ? 1 : 2;

  if (COMMON_CAT[norm] || COURSE_CAT[norm]) return 2;
  return 0;
}

function semesterOrder(sem) {
  return SEM_LABELS[sem] || 99;
}

function getBaseYear() {
  if (!courses.length) return new Date().getFullYear();
  return courses.reduce(function (m, c) {
    return typeof c.year === "number" && c.year < m ? c.year : m;
  }, courses[0].year || new Date().getFullYear());
}

function getSemesterIndex(course) {
  if (!course || !course.year) return 999;
  return (course.year - getBaseYear()) * 2 + semesterOrder(course.sem);
}

function isUpToSemester(course, maxSemesterIndex) {
  if (!maxSemesterIndex) return true;
  return getSemesterIndex(course) <= maxSemesterIndex;
}

function computeEarnedCredit(origCr, grade) {
  return grade === "D" ? 0 : Number(origCr || 0);
}

function normalizeCourse(raw, fallbackId) {
  var origCr = Number(raw.origCr != null ? raw.origCr : raw.cr || 0);
  var grade = raw.grade || "A";
  var gpaEligible = raw.gpaEligible !== false && grade !== "P";
  var course = {
    id: Number(raw.id || fallbackId || 0),
    name: cleanCourseName(raw.name),
    origCr: origCr,
    cr: computeEarnedCredit(origCr, grade),
    grade: grade,
    cat: raw.cat || "s_other",
    year: Number(raw.year || getBaseYear()),
    sem: raw.sem === "後期" ? "後期" : "前期",
    gpaEligible: gpaEligible,
  };
  return course;
}

function sortCourses(list) {
  list.sort(function (a, b) {
    if (a.year !== b.year) return a.year - b.year;
    if (semesterOrder(a.sem) !== semesterOrder(b.sem)) {
      return semesterOrder(a.sem) - semesterOrder(b.sem);
    }
    return a.name.localeCompare(b.name, "ja");
  });
  return list;
}

function normalizeCoursesData(list) {
  var normalized = (list || []).map(function (c, idx) {
    return normalizeCourse(c, idx + 1);
  });
  reconcileFlexibleCategories(normalized);
  sortCourses(normalized);
  normalized.forEach(function (c, idx) {
    if (!c.id) c.id = idx + 1;
  });
  return normalized;
}

function reconcileFlexibleCategories(list) {
  var hasIntroII = list.some(function (c) {
    return isIntroLanguageII(c.name);
  });
  var engCandidates = list.filter(function (c) {
    return isEngineeringEnglish(c.name);
  });
  sortCourses(engCandidates);

  list.forEach(function (c) {
    if (isIntroLanguageI(c.name)) c.cat = "z_ga";
    if (isIntroLanguageII(c.name)) c.cat = "z_gb";
  });

  if (hasIntroII) {
    engCandidates.forEach(function (c) {
      c.cat = "s_other";
    });
    return;
  }

  var allocated = 0;
  engCandidates.forEach(function (c) {
    if (allocated < 2) {
      c.cat = "z_gb";
      allocated += c.cr;
    } else {
      c.cat = "s_other";
    }
  });
}

function load() {
  var savedCourse = localStorage.getItem(STORAGE.course);
  if (
    savedCourse &&
    COURSE_LIST.some(function (c) {
      return c.id === savedCourse;
    })
  ) {
    currentCourse = savedCourse;
  }
  buildCourseCat(currentCourse);

  var saved = localStorage.getItem(STORAGE.credits);
  if (!saved) {
    courses = [];
    save();
    return;
  }

  try {
    courses = normalizeCoursesData(JSON.parse(saved));
  } catch (e) {
    courses = [];
  }
  save();
}

function save() {
  courses = normalizeCoursesData(courses);
  localStorage.setItem(STORAGE.credits, JSON.stringify(courses));
  localStorage.setItem(STORAGE.course, currentCourse);
}

function nextId() {
  return courses.length
    ? Math.max.apply(
        null,
        courses.map(function (c) {
          return c.id || 0;
        }),
      ) + 1
    : 1;
}

/* ====================================================================
   ナビゲーション・レンダリング
   ==================================================================== */
function switchCourse(courseId) {
  currentCourse = courseId;
  buildCourseCat(courseId);
  courses.forEach(function (c) {
    if (
      c.cat === "s1" ||
      c.cat === "s2" ||
      c.cat === "s3" ||
      c.cat === "s4" ||
      c.cat === "s5" ||
      c.cat === "s6" ||
      c.cat === "s_gak" ||
      c.cat === "s_other"
    ) {
      c.cat = guessCategory(c.name, "");
    }
  });
  reconcileFlexibleCategories(courses);
  save();
  updateHeader();
  renderAll();
}

function updateHeader() {
  var info = COURSE_LIST.find(function (c) {
    return c.id === currentCourse;
  });
  var sub = document.querySelector(".hdr .sub");
  if (sub && info) {
    sub.textContent = "東北大学 工学部 機械知能・航空工学科 " + info.name;
  }
  var sel = document.getElementById("courseSelect");
  if (sel) sel.value = currentCourse;
  var setSel = document.getElementById("courseSelectSetting");
  if (setSel) setSel.value = currentCourse;
}

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll(".tab").forEach(function (el) {
    el.classList.toggle("active", el.id === tabId);
  });
  document.querySelectorAll(".nav button").forEach(function (btn) {
    btn.classList.toggle("active", btn.id === "t_" + tabId);
  });
  if (tabId === "set") {
    renderSet();
  }
}

function renderAll() {
  updateHeader();
  renderDash();
  renderList();
  renderReq();
  renderSet();
  switchTab(currentTab);
}

/* ====================================================================
   集計関数
   ==================================================================== */
function earned(catId, maxSemesterIndex) {
  return courses
    .filter(function (c) {
      return c.cat === catId && isUpToSemester(c, maxSemesterIndex);
    })
    .reduce(function (s, c) {
      return s + c.cr;
    }, 0);
}

function earnedMulti(catIds, maxSemesterIndex) {
  return courses
    .filter(function (c) {
      return catIds.indexOf(c.cat) >= 0 && isUpToSemester(c, maxSemesterIndex);
    })
    .reduce(function (s, c) {
      return s + c.cr;
    }, 0);
}

function totalEarned(maxSemesterIndex) {
  return courses
    .filter(function (c) {
      return isUpToSemester(c, maxSemesterIndex);
    })
    .reduce(function (s, c) {
      return s + c.cr;
    }, 0);
}

function grpEarned(grp, maxSemesterIndex) {
  var ids = CATS.filter(function (c) {
    return c.grp === grp;
  }).map(function (c) {
    return c.id;
  });
  return earnedMulti(ids, maxSemesterIndex);
}

function sumCreditsByNames(nameSet, maxSemesterIndex) {
  return courses
    .filter(function (c) {
      return (
        c.cr > 0 &&
        isUpToSemester(c, maxSemesterIndex) &&
        !!nameSet[normName(c.name)]
      );
    })
    .reduce(function (s, c) {
      return s + c.cr;
    }, 0);
}

function calcGPA() {
  var num = 0;
  var den = 0;
  courses.forEach(function (c) {
    if (!c.gpaEligible || c.grade === "P") return;
    var gp = GP_MAP[c.grade];
    if (gp === undefined) return;
    var cr = c.origCr || c.cr || 0;
    if (cr <= 0) return;
    num += gp * cr;
    den += cr;
  });
  return den > 0 ? num / den : 0;
}

function getProgressSections() {
  var zenH = grpEarned("zen_h");
  var zenS = grpEarned("zen_s");
  var senH = grpEarned("sen_h");
  var senSelTotal = grpEarned("sen_sm") + grpEarned("sen_s");
  return [
    { l: "全学必修", g: zenH, r: GRAD.zen_h },
    { l: "全学選択", g: zenS, r: GRAD.zen_s },
    { l: "専門必修", g: senH, r: GRAD.sen_h },
    { l: "専門選択", g: senSelTotal, r: GRAD.sen_s },
  ];
}

function getShortfallTotal() {
  return getProgressSections().reduce(function (sum, s) {
    return sum + Math.max(0, s.r - s.g);
  }, 0);
}

function getCrossReqStatus(maxSemesterIndex) {
  return CROSS_REQS.map(function (cr) {
    var got = earnedMulti(cr.cats, maxSemesterIndex);
    return {
      label: cr.label,
      got: got,
      req: cr.req,
      ok: got >= cr.req,
    };
  });
}

/* ====================================================================
   ダッシュボード
   ==================================================================== */
function renderDash() {
  var el = document.getElementById("dash");
  var tot = totalEarned();
  var gpa = calcGPA();
  var pct = Math.min(100, Math.round((tot / GRAD.total) * 100));
  var shortfall = getShortfallTotal();
  var crossStatus = getCrossReqStatus();
  var crossOk = crossStatus.every(function (x) {
    return x.ok;
  });

  var allOk =
    shortfall === 0 &&
    crossOk &&
    totalEarned() >= GRAD.total;

  var jClass = "jf";
  var jText = "まだ成績データがありません。設定タブからPDFをインポートしてください。";
  if (courses.length) {
    if (allOk) {
      jClass = "jp";
      jText = "卒業要件を全て満たしています";
    } else if (tot >= 120) {
      jClass = "jw";
      jText = "卒業要件の一部が未充足です";
    } else {
      jClass = "jf";
      jText = "卒業要件を満たしていません（区分別不足合計 " + shortfall + " 単位）";
    }
  }

  var h = '<div class="jb ' + jClass + '">' + escapedHtml(jText) + "</div>";
  h += '<div class="sg">';
  h +=
    '<div class="sc"><div class="num" style="color:var(--pri)">' +
    tot +
    '</div><div class="lbl">修得単位 / ' +
    GRAD.total +
    "</div></div>";
  h +=
    '<div class="sc"><div class="num" style="color:' +
    (gpa >= 3 ? "var(--ok)" : gpa >= 2 ? "var(--warn)" : "var(--ng)") +
    '">' +
    gpa.toFixed(2) +
    '</div><div class="lbl">累積GPA</div></div>';
  h +=
    '<div class="sc"><div class="num" style="color:var(--pri)">' +
    pct +
    '%</div><div class="lbl">進捗率</div></div>';
  h +=
    '<div class="sc"><div class="num" style="color:' +
    (shortfall <= 6 ? "var(--ok)" : "var(--warn)") +
    '">' +
    shortfall +
    '</div><div class="lbl">残り単位数</div></div>';
  h += "</div>";

  h += '<div class="card"><div class="ct">区分別進捗</div>';
  getProgressSections().forEach(function (s) {
    var p = s.r ? Math.min(100, Math.round((s.g / s.r) * 100)) : 0;
    var col = p >= 100 ? "grn" : p >= 70 ? "ylw" : "red";
    h +=
      '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:4px"><span style="font-weight:600">' +
      escapedHtml(s.l) +
      '</span><span style="color:var(--g400)">' +
      s.g +
      " / " +
      s.r +
      '</span></div><div class="pb"><div class="pf ' +
      col +
      '" style="width:' +
      p +
      '%">' +
      p +
      "%</div></div></div>";
  });
  h += "</div>";

  h += '<div class="card"><div class="ct">専門選択必修（複合要件）</div>';
  crossStatus.forEach(function (cr) {
    h +=
      '<div class="sr ' +
      (cr.ok ? "sr-ok" : "sr-ng") +
      '"><span style="font-weight:700">' +
      (cr.ok ? "✓" : "✗") +
      '</span><span style="flex:1">' +
      escapedHtml(cr.label) +
      '</span><span style="font-weight:700">' +
      cr.got +
      " / " +
      cr.req +
      "</span></div>";
  });
  h += "</div>";

  h +=
    '<div class="card"><div class="ct">3セメスターバリア <span class="csub">コース配属条件</span></div>';
  check3SemBarrier().forEach(function (item) {
    h +=
      '<div class="sr ' +
      (item.ok ? "sr-ok" : "sr-ng") +
      '"><span style="font-weight:700">' +
      (item.ok ? "✓" : "✗") +
      '</span><span style="flex:1">' +
      escapedHtml(item.label) +
      "</span></div>";
  });
  h += "</div>";

  h +=
    '<div class="card"><div class="ct">6セメスターバリア <span class="csub">卒業研究履修条件</span></div>';
  check6SemBarrier().forEach(function (item) {
    h +=
      '<div class="sr ' +
      (item.ok ? "sr-ok" : "sr-ng") +
      '"><span style="font-weight:700">' +
      (item.ok ? "✓" : "✗") +
      '</span><span style="flex:1">' +
      escapedHtml(item.label) +
      "</span></div>";
  });
  h += "</div>";

  el.innerHTML = h;
}

function check3SemBarrier() {
  var maxSem = 3;
  var poolCredits = sumCreditsByNames(ELIGIBLE_3SEM_POOL, maxSem);
  var requiredCredits = sumCreditsByNames(REQUIRED_BY_3SEM, maxSem);
  var foreignTotal = earned("z_eigo", maxSem) + earned("z_ga", maxSem) + earned("z_gb", maxSem);
  var s1s2 = earnedMulti(["s1", "s2"], maxSem);
  var hasExperiment = courses.some(function (c) {
    return (
      c.cr > 0 &&
      isUpToSemester(c, maxSem) &&
      normName(c.name) === normName("自然科学総合実験")
    );
  });

  return [
    {
      label: "指定科目群（実験・情報基礎・1〜3セメ学術基礎・1〜2セメ工学共通） " + poolCredits + " ≥ 24",
      ok: poolCredits >= 24,
    },
    {
      label: "自然科学総合実験を修得",
      ok: hasExperiment,
    },
    {
      label: "3セメまでの必修科目群 " + requiredCredits + " ≥ 15",
      ok: requiredCredits >= 15,
    },
    {
      label: "外国語群 " + foreignTotal + " ≥ 4",
      ok: foreignTotal >= 4,
    },
    {
      label: "①+② = " + s1s2 + " ≥ 12",
      ok: s1s2 >= 12,
    },
  ];
}

function check6SemBarrier() {
  var maxSem = 6;
  var hK = earned("s_kou", maxSem);
  var hG = courses
    .filter(function (c) {
      return (
        c.cat === "s_gak" &&
        c.name !== "卒業研究" &&
        isUpToSemester(c, maxSem)
      );
    })
    .reduce(function (s, c) {
      return s + c.cr;
    }, 0);
  var zH = grpEarned("zen_h", maxSem);
  var s3v = earned("z_s3", maxSem);
  var eig = earned("z_eigo", maxSem);
  var ga = earned("z_ga", maxSem);
  var gb = earned("z_gb", maxSem);
  var eng1 = courses.some(function (c) {
    return (
      c.cr > 0 &&
      isUpToSemester(c, maxSem) &&
      normName(c.name) === normName("工学英語Ⅰ")
    );
  });

  return [
    {
      label: "6セメまでの全必修単位を修得",
      ok: hK >= 3 && hG >= 9 && zH >= 26,
    },
    {
      label:
        "選択3(" +
        s3v +
        ")+外国語群(" +
        (eig + ga + gb) +
        ")=" +
        (s3v + eig + ga + gb) +
        " ≥ 14",
      ok: s3v + eig + ga + gb >= 14,
    },
    {
      label: "②+③ = " + earnedMulti(["s2", "s3"], maxSem) + " ≥ 8",
      ok: earnedMulti(["s2", "s3"], maxSem) >= 8,
    },
    {
      label: "③+④ = " + earnedMulti(["s3", "s4"], maxSem) + " ≥ 12",
      ok: earnedMulti(["s3", "s4"], maxSem) >= 12,
    },
    {
      label: "⑤ = " + earned("s5", maxSem) + " ≥ 16",
      ok: earned("s5", maxSem) >= 16,
    },
    {
      label: "工学英語Ⅰを修得",
      ok: eng1,
    },
  ];
}

/* ====================================================================
   科目一覧
   ==================================================================== */
function renderList() {
  var el = document.getElementById("list");
  var h = "";

  h +=
    '<div class="card" style="padding:12px 16px"><div style="font-size:.73rem;font-weight:600;color:var(--g400);margin-bottom:6px">カテゴリ</div><div class="flx">';
  h +=
    '<button class="fsel ' +
    (filterCat === "all" ? "on" : "") +
    '" onclick="setFilter(\'all\')">全て</button>';

  CATS.forEach(function (c) {
    var n = courses.filter(function (x) {
      return x.cat === c.id;
    }).length;
    if (n > 0) {
      h +=
        '<button class="fsel ' +
        (filterCat === c.id ? "on" : "") +
        '" onclick="setFilter(\'' +
        c.id +
        "')\">" +
        escapedHtml(c.name) +
        "(" +
        n +
        ")</button>";
    }
  });

  h += "</div>";
  h +=
    '<div style="font-size:.73rem;font-weight:600;color:var(--g400);margin-top:12px;margin-bottom:6px">評価</div><div class="flx">';
  h +=
    '<button class="fsel ' +
    (filterGrade === "all" ? "on" : "") +
    '" onclick="setGradeFilter(\'all\')">全て</button>';

  GRADE_OPTIONS.forEach(function (g) {
    var n = courses.filter(function (x) {
      return x.grade === g;
    }).length;
    var gc =
      g === "AA" ? "gaa" : g === "A" ? "ga" : g === "B" ? "gb" : g === "C" ? "gc" : "gd";
    if (n > 0) {
      h +=
        '<button class="fsel ' +
        (filterGrade === g ? "on" : "") +
        '" onclick="setGradeFilter(\'' +
        g +
        '\')"><span class="' +
        gc +
        '">' +
        g +
        "</span> (" +
        n +
        ")</button>";
    }
  });

  h += "</div></div>";

  var filtered = courses.slice();
  if (filterCat !== "all") {
    filtered = filtered.filter(function (c) {
      return c.cat === filterCat;
    });
  }
  if (filterGrade !== "all") {
    filtered = filtered.filter(function (c) {
      return c.grade === filterGrade;
    });
  }

  sortCourses(filtered);
  var filteredEarned = filtered.reduce(function (s, c) {
    return s + c.cr;
  }, 0);

  h +=
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:0 4px">';
  h +=
    '<span style="font-size:.82rem;color:var(--g500)">' +
    filtered.length +
    "科目 / " +
    filteredEarned +
    "単位</span>";
  if (filterCat !== "all" || filterGrade !== "all") {
    h +=
      "<button class=\"btn bsm bo\" onclick=\"clearFilters()\">フィルター解除</button>";
  }
  h += "</div>";

  h +=
    '<div class="card"><div class="tw"><table><thead><tr><th>科目名</th><th>単位</th><th>評価</th><th>カテゴリ</th><th>年度</th><th></th></tr></thead><tbody>';

  if (!filtered.length) {
    h +=
      '<tr><td colspan="6" style="text-align:center;color:var(--g300);padding:30px">科目がありません。設定タブからPDFをインポートするか、右下の＋で追加してください。</td></tr>';
  }

  filtered.forEach(function (c) {
    var cat = CATS.find(function (x) {
      return x.id === c.cat;
    });
    var gc =
      c.grade === "AA" ? "gaa" : c.grade === "A" ? "ga" : c.grade === "B" ? "gb" : c.grade === "C" ? "gc" : "gd";
    h +=
      '<tr><td style="font-weight:500">' +
      escapedHtml(c.name) +
      "</td><td>" +
      c.cr +
      (c.grade === "D"
        ? '<span style="font-size:.7rem;color:var(--ng)"> (不可)</span>'
        : "") +
      '</td><td class="' +
      gc +
      '">' +
      escapedHtml(c.grade) +
      '</td><td style="font-size:.73rem;color:var(--g500)">' +
      escapedHtml(cat ? cat.name : "?") +
      '</td><td style="font-size:.8rem">' +
      c.year +
      " " +
      escapedHtml(c.sem) +
      '</td><td><button class="bg-del" onclick="editCourse(' +
      c.id +
      ')" title="編集">✎</button><button class="bg-del" onclick="delCourse(' +
      c.id +
      ')" title="削除">✕</button></td></tr>';
  });

  h += "</tbody></table></div></div>";
  el.innerHTML = h;
}

function setFilter(cat) {
  filterCat = cat;
  renderList();
}

function setGradeFilter(g) {
  filterGrade = g;
  renderList();
}

function clearFilters() {
  filterCat = "all";
  filterGrade = "all";
  renderList();
}

/* ====================================================================
   卒業要件
   ==================================================================== */
function renderReq() {
  var el = document.getElementById("req");
  var h = "";

  h +=
    '<div class="card"><div class="ct">全学教育科目 <span class="csub">必修26 ＋ 選択23 ＝ 49以上</span></div>';
  CATS.filter(function (c) {
    return c.grp === "zen_h" || c.grp === "zen_s";
  }).forEach(function (cat) {
    var got = earned(cat.id);
    var req = cat.req || 0;
    var ok = req > 0 ? got >= req : true;
    h +=
      '<div class="rw"><div class="rn">' +
      escapedHtml(cat.name) +
      (cat.desc ? '<div class="note">' + escapedHtml(cat.desc) + "</div>" : "") +
      '</div><div class="rv">' +
      got +
      (req ? " / " + req : "") +
      '</div><div class="rs">' +
      (req > 0
        ? ok
          ? '<span class="badge b-ok">充足</span>'
          : '<span class="badge b-ng">不足 ' + (req - got) + "</span>"
        : "—") +
      "</div></div>";
  });

  var zenST = grpEarned("zen_s");
  h +=
    '<hr class="sep"><div class="rw"><div class="rn" style="font-weight:700">全学選択 合計</div><div class="rv" style="font-weight:700">' +
    zenST +
    " / " +
    GRAD.zen_s +
    '</div><div class="rs">' +
    (zenST >= GRAD.zen_s
      ? '<span class="badge b-ok">充足</span>'
      : '<span class="badge b-ng">不足 ' + (GRAD.zen_s - zenST) + "</span>") +
    "</div></div></div>";

  h +=
    '<div class="card"><div class="ct">専門教育科目 — 必修 <span class="csub">工学共通3 ＋ 学科専門15 ＝ 18</span></div>';
  CATS.filter(function (c) {
    return c.grp === "sen_h";
  }).forEach(function (cat) {
    var got = earned(cat.id);
    var ok = got >= (cat.req || 0);
    h +=
      '<div class="rw"><div class="rn">' +
      escapedHtml(cat.name) +
      (cat.desc ? '<div class="note">' + escapedHtml(cat.desc) + "</div>" : "") +
      '</div><div class="rv">' +
      got +
      " / " +
      cat.req +
      '</div><div class="rs">' +
      (ok
        ? '<span class="badge b-ok">充足</span>'
        : '<span class="badge b-wa">残 ' + (cat.req - got) + "</span>") +
      "</div></div>";
  });
  h += "</div>";

  h +=
    '<div class="card"><div class="ct">専門教育科目 — 選択必修 <span class="csub">複合要件あり</span></div>';
  ["s1", "s2", "s3", "s4", "s5", "s6"].forEach(function (id) {
    var cat = CATS.find(function (c) {
      return c.id === id;
    });
    var got = earned(id);
    h +=
      '<div class="rw"><div class="rn">' +
      escapedHtml(cat.name) +
      '<div class="note">' +
      escapedHtml(cat.desc || "") +
      '</div></div><div class="rv">' +
      got +
      (cat.req ? " / " + cat.req : "") +
      '</div><div class="rs">' +
      (cat.req
        ? got >= cat.req
          ? '<span class="badge b-ok">充足</span>'
          : '<span class="badge b-ng">不足 ' + (cat.req - got) + "</span>"
        : "—") +
      "</div></div>";
  });

  h +=
    '<hr class="sep"><div style="font-size:.85rem;font-weight:700;margin-bottom:10px">複合要件</div>';
  getCrossReqStatus().forEach(function (cr) {
    h +=
      '<div class="sr ' +
      (cr.ok ? "sr-ok" : "sr-ng") +
      '" style="margin-bottom:6px"><span style="font-weight:700">' +
      (cr.ok ? "✓" : "✗") +
      '</span><span style="flex:1">' +
      escapedHtml(cr.label) +
      '</span><span style="font-weight:700">' +
      cr.got +
      " / " +
      cr.req +
      "</span></div>";
  });

  var senSMtot = grpEarned("sen_sm");
  var senStot = grpEarned("sen_s");
  var senSelAll = senSMtot + senStot;
  h +=
    '<hr class="sep"><div class="rw"><div class="rn" style="font-weight:700">専門選択 合計（①〜⑥＋一般選択）</div><div class="rv" style="font-weight:700">' +
    senSelAll +
    " / " +
    GRAD.sen_s +
    '</div><div class="rs">' +
    (senSelAll >= GRAD.sen_s
      ? '<span class="badge b-ok">充足</span>'
      : '<span class="badge b-ng">不足 ' +
        (GRAD.sen_s - senSelAll) +
        "</span>") +
    "</div></div></div>";

  h +=
    '<div class="card"><div class="ct">セメスターバリア</div>';
  h += '<div style="font-size:.85rem;font-weight:700;margin-bottom:10px">3セメスターバリア</div>';
  check3SemBarrier().forEach(function (item) {
    h +=
      '<div class="sr ' +
      (item.ok ? "sr-ok" : "sr-ng") +
      '" style="margin-bottom:6px"><span style="font-weight:700">' +
      (item.ok ? "✓" : "✗") +
      '</span><span style="flex:1">' +
      escapedHtml(item.label) +
      "</span></div>";
  });
  h += '<hr class="sep"><div style="font-size:.85rem;font-weight:700;margin-bottom:10px">6セメスターバリア</div>';
  check6SemBarrier().forEach(function (item) {
    h +=
      '<div class="sr ' +
      (item.ok ? "sr-ok" : "sr-ng") +
      '" style="margin-bottom:6px"><span style="font-weight:700">' +
      (item.ok ? "✓" : "✗") +
      '</span><span style="flex:1">' +
      escapedHtml(item.label) +
      "</span></div>";
  });
  h += "</div>";

  var tot = totalEarned();
  var vZH = grpEarned("zen_h");
  var vZS = grpEarned("zen_s");
  var vSH = grpEarned("sen_h");

  function bdg(ok, yesText, noText) {
    return ok
      ? '<span class="badge b-ok">' + yesText + "</span>"
      : '<span class="badge b-ng">' + noText + "</span>";
  }
  function bdgW(ok, yesText, noText) {
    return ok
      ? '<span class="badge b-ok">' + yesText + "</span>"
      : '<span class="badge b-wa">' + noText + "</span>";
  }

  h +=
    '<div class="card"><div class="ct">卒業に要する最低修得単位数</div><table style="font-size:.85rem">';
  h +=
    '<tr><th></th><th style="text-align:right">必要</th><th style="text-align:right">修得済</th><th style="text-align:right">判定</th></tr>';
  h +=
    '<tr><td>全学必修</td><td style="text-align:right">' +
    GRAD.zen_h +
    '</td><td style="text-align:right">' +
    vZH +
    '</td><td style="text-align:right">' +
    bdg(vZH >= GRAD.zen_h, "✓", "✗") +
    "</td></tr>";
  h +=
    '<tr><td>全学選択</td><td style="text-align:right">' +
    GRAD.zen_s +
    '</td><td style="text-align:right">' +
    vZS +
    '</td><td style="text-align:right">' +
    bdg(vZS >= GRAD.zen_s, "✓", "✗") +
    "</td></tr>";
  h +=
    '<tr><td>専門必修</td><td style="text-align:right">' +
    GRAD.sen_h +
    '</td><td style="text-align:right">' +
    vSH +
    '</td><td style="text-align:right">' +
    bdgW(vSH >= GRAD.sen_h, "✓", "残" + (GRAD.sen_h - vSH)) +
    "</td></tr>";
  h +=
    '<tr><td>専門選択</td><td style="text-align:right">' +
    GRAD.sen_s +
    '</td><td style="text-align:right">' +
    senSelAll +
    '</td><td style="text-align:right">' +
    bdg(senSelAll >= GRAD.sen_s, "✓", "残" + (GRAD.sen_s - senSelAll)) +
    "</td></tr>";
  h +=
    '<tr style="font-weight:700;border-top:2px solid var(--g200)"><td>合計</td><td style="text-align:right">' +
    GRAD.total +
    '</td><td style="text-align:right">' +
    tot +
    '</td><td style="text-align:right">' +
    bdg(tot >= GRAD.total, "✓", "残" + (GRAD.total - tot)) +
    "</td></tr>";
  h += "</table></div>";

  el.innerHTML = h;
}

/* ====================================================================
   設定タブ
   ==================================================================== */
function renderSet() {
  var el = document.getElementById("set");
  var tot = totalEarned();
  var gpa = calcGPA();
  var dCount = courses.filter(function (c) {
    return c.grade === "D";
  }).length;
  var gpaCr = courses.reduce(function (s, c) {
    if (!c.gpaEligible || c.grade === "P") return s;
    return s + (c.origCr || c.cr);
  }, 0);
  var curInfo = COURSE_LIST.find(function (c) {
    return c.id === currentCourse;
  });
  var h = "";

  h += '<div class="card">';
  h += '<div class="ct">コース設定</div>';
  h +=
    '<p style="font-size:.83rem;color:var(--g600);margin-bottom:10px">所属コースを選択してください。卒業要件の科目分類がコースに応じて切り替わります。</p>';
  h +=
    '<select id="courseSelectSetting" style="font-size:.92rem;padding:10px 14px" onchange="switchCourse(this.value)">';
  COURSE_LIST.forEach(function (c) {
    h +=
      '<option value="' +
      c.id +
      '"' +
      (c.id === currentCourse ? " selected" : "") +
      ">" +
      escapedHtml(c.name) +
      "</option>";
  });
  h += "</select>";
  h +=
    '<div class="note" style="margin-top:6px">現在: <b>' +
    escapedHtml(curInfo.name) +
    "</b> (" +
    escapedHtml(curInfo.eng) +
    ")</div>";
  h += "</div>";

  h += '<div class="card">';
  h += '<div class="ct">成績証明書PDFインポート</div>';
  h +=
    '<p style="font-size:.83rem;color:var(--g600);margin-bottom:14px">東北大学の成績証明書PDFをインポートすると、科目データを反映します。</p>';
  h +=
    '<div class="drop-zone" id="dropZone" onclick="document.getElementById(\'pdfInput\').click()">';
  h += '<div class="dz-icon">📄</div>';
  h += '<div class="dz-text">PDFファイルをドラッグ＆ドロップ</div>';
  h += '<div class="dz-sub">またはクリックしてファイルを選択</div>';
  h += "</div>";
  h +=
    '<input type="file" id="pdfInput" accept=".pdf" style="display:none" onchange="handlePDFSelect(event)">';
  h += '<div id="pdfStatus" style="margin-top:12px"></div>';
  h += "</div>";

  h += '<div class="card"><div class="ct">データ管理</div>';
  h +=
    '<button class="btn bd bbl" onclick="resetData()">データをリセット（空の状態に戻す）</button>';
  h += "</div>";

  h += '<div class="card"><div class="ct">統計情報</div>';
  h +=
    '<div class="rw"><div class="rn">登録科目数</div><div class="rv">' +
    courses.length +
    "</div></div>";
  h +=
    '<div class="rw"><div class="rn">修得単位数（D除く）</div><div class="rv">' +
    tot +
    "</div></div>";
  h +=
    '<div class="rw"><div class="rn">不可(D)科目数</div><div class="rv">' +
    dCount +
    "</div></div>";
  h +=
    '<div class="rw"><div class="rn">累積GPA</div><div class="rv">' +
    gpa.toFixed(2) +
    "</div></div>";
  h +=
    '<div class="rw"><div class="rn">GPA計算対象単位</div><div class="rv">' +
    gpaCr +
    "</div></div>";
  h += "</div>";

  h += '<div class="card"><div class="ct">このアプリについて</div>';
  h += '<div style="font-size:.83rem;line-height:1.7;color:var(--g600)">';
  h +=
    "<p>東北大学 工学部 機械知能・航空工学科の卒業要件チェッカーです。全7コースに対応しています。</p>";
  h +=
    '<p style="margin-top:8px">学生便覧（令和5年度）の履修方法をもとに、成績証明書PDFから科目を分類して表示します。</p>';
  h +=
    '<p style="margin-top:8px">開発者: 奥村颯(おくむらはやて)';
  h +=
    '<p style="margin-top:8px">ハンドルネーム: 猫神(ねこがみ)</p>';
  h +=
    '<p style="margin-top:8px;color:var(--warn)"><b>注意:</b> 本アプリは参考ツールです。正式な卒業判定は教務課に確認してください。</p>';
  h += "</div></div>";

  el.innerHTML = h;
  setTimeout(setupDropZone, 0);
}

function setupDropZone() {
  var dz = document.getElementById("dropZone");
  if (!dz || dz.dataset.ready === "1") return;
  dz.dataset.ready = "1";
  dz.addEventListener("dragover", function (e) {
    e.preventDefault();
    dz.classList.add("over");
  });
  dz.addEventListener("dragleave", function () {
    dz.classList.remove("over");
  });
  dz.addEventListener("drop", function (e) {
    e.preventDefault();
    dz.classList.remove("over");
    var files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      processPDF(files[0]);
    } else {
      alert("PDFファイルを選択してください。");
    }
  });
}

function handlePDFSelect(e) {
  var file = e.target.files[0];
  if (file) processPDF(file);
  e.target.value = "";
}

function resetData() {
  if (!confirm("現在の科目データを全て削除して、空の状態に戻します。よろしいですか？")) {
    return;
  }
  courses = [];
  pendingImportCourses = [];
  localStorage.removeItem(STORAGE.credits);
  save();
  renderAll();
  switchTab("set");
}

function guessCategory(name, section) {
  var clean = cleanCourseName(name);
  var norm = normName(clean);
  if (COURSE_CAT[norm]) return COURSE_CAT[norm];

  if (isIntroLanguageI(clean)) return "z_ga";
  if (isIntroLanguageII(clean)) return "z_gb";
  if (isEngineeringEnglish(clean)) return "s_other";

  if (section === "英語") return "z_eigo";
  if (
    section === "中国語" ||
    section === "ドイツ語" ||
    section === "フランス語" ||
    section === "ロシア語" ||
    section === "スペイン語" ||
    section === "朝鮮語"
  ) {
    if (isIntroLanguageI(clean)) return "z_ga";
    if (isIntroLanguageII(clean)) return "z_gb";
  }

  if (SECTION_CAT[section]) return SECTION_CAT[section];
  return "s_other";
}

/* ====================================================================
   科目追加・編集
   ==================================================================== */
function openModal(html) {
  document.getElementById("mdBody").innerHTML = html;
  document.getElementById("modal").classList.add("show");
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
  document.getElementById("mdBody").innerHTML = "";
}

function getDefaultYear() {
  if (courses.length) return courses[courses.length - 1].year;
  return new Date().getFullYear();
}

function buildCategoryOptions(selected) {
  return CATS.map(function (cat) {
    return (
      '<option value="' +
      cat.id +
      '"' +
      (cat.id === selected ? " selected" : "") +
      ">" +
      escapedHtml(cat.name) +
      "</option>"
    );
  }).join("");
}

function openAdd() {
  var nowYear = getDefaultYear();
  var guessed = "z_kiban";
  openModal(
    '<div class="ct">科目追加</div>' +
      '<div class="fg"><label>科目名</label><input id="courseName" placeholder="例: 計測工学Ⅰ"></div>' +
      '<div class="fr"><div class="fg"><label>単位数</label><input id="courseCr" type="number" step="0.5" min="0" value="2"></div><div class="fg"><label>評価</label><select id="courseGrade">' +
      GRADE_OPTIONS.map(function (g) {
        return '<option value="' + g + '">' + g + "</option>";
      }).join("") +
      "</select></div></div>" +
      '<div class="fg"><label>カテゴリ</label><select id="courseCat">' +
      buildCategoryOptions(guessed) +
      "</select></div>" +
      '<div class="fr"><div class="fg"><label>年度</label><input id="courseYear" type="number" min="2000" max="2100" value="' +
      nowYear +
      '"></div><div class="fg"><label>学期</label><select id="courseSem"><option value="前期">前期</option><option value="後期">後期</option></select></div></div>' +
      '<div class="note">科目名を入力したあと「自動分類」を押すと、学生便覧に基づくカテゴリ候補を反映します。</div>' +
      '<div class="flx" style="margin-top:16px;justify-content:flex-end"><button class="btn bo" onclick="autoDetectCategoryFromForm()">自動分類</button><button class="btn bo" onclick="closeModal()">キャンセル</button><button class="btn bp" onclick="submitCourse()">追加</button></div>',
  );
}

function editCourse(id) {
  var course = courses.find(function (c) {
    return c.id === id;
  });
  if (!course) return;
  openModal(
    '<div class="ct">科目編集</div>' +
      '<input type="hidden" id="editId" value="' +
      course.id +
      '">' +
      '<div class="fg"><label>科目名</label><input id="courseName" value="' +
      escapedHtml(course.name) +
      '"></div>' +
      '<div class="fr"><div class="fg"><label>単位数</label><input id="courseCr" type="number" step="0.5" min="0" value="' +
      course.origCr +
      '"></div><div class="fg"><label>評価</label><select id="courseGrade">' +
      GRADE_OPTIONS.map(function (g) {
        return (
          '<option value="' +
          g +
          '"' +
          (g === course.grade ? " selected" : "") +
          ">" +
          g +
          "</option>"
        );
      }).join("") +
      "</select></div></div>" +
      '<div class="fg"><label>カテゴリ</label><select id="courseCat">' +
      buildCategoryOptions(course.cat) +
      "</select></div>" +
      '<div class="fr"><div class="fg"><label>年度</label><input id="courseYear" type="number" min="2000" max="2100" value="' +
      course.year +
      '"></div><div class="fg"><label>学期</label><select id="courseSem"><option value="前期"' +
      (course.sem === "前期" ? " selected" : "") +
      '>前期</option><option value="後期"' +
      (course.sem === "後期" ? " selected" : "") +
      '>後期</option></select></div></div>' +
      '<div class="note">科目名を変更した場合は「自動分類」でカテゴリ候補を更新できます。</div>' +
      '<div class="flx" style="margin-top:16px;justify-content:flex-end"><button class="btn bo" onclick="autoDetectCategoryFromForm()">自動分類</button><button class="btn bo" onclick="closeModal()">キャンセル</button><button class="btn bp" onclick="submitCourse(' +
      course.id +
      ')">保存</button></div>',
  );
}

function autoDetectCategoryFromForm() {
  var name = document.getElementById("courseName").value;
  var cat = guessCategory(name, "");
  var select = document.getElementById("courseCat");
  if (select) select.value = cat;
}

function submitCourse(editId) {
  var name = cleanCourseName(document.getElementById("courseName").value);
  var origCr = Number(document.getElementById("courseCr").value);
  var grade = document.getElementById("courseGrade").value;
  var cat = document.getElementById("courseCat").value;
  var year = Number(document.getElementById("courseYear").value);
  var sem = document.getElementById("courseSem").value;

  if (!name) {
    alert("科目名を入力してください。");
    return;
  }
  if (!(origCr >= 0)) {
    alert("単位数を入力してください。");
    return;
  }
  if (!(year >= 2000)) {
    alert("年度を入力してください。");
    return;
  }

  var payload = normalizeCourse(
    {
      id: editId || nextId(),
      name: name,
      origCr: origCr,
      grade: grade,
      cat: cat,
      year: year,
      sem: sem,
    },
    editId || nextId(),
  );

  if (editId) {
    courses = courses.map(function (c) {
      return c.id === editId ? payload : c;
    });
  } else {
    courses.push(payload);
  }

  reconcileFlexibleCategories(courses);
  save();
  renderAll();
  closeModal();
  switchTab("list");
}

function delCourse(id) {
  var course = courses.find(function (c) {
    return c.id === id;
  });
  if (!course) return;
  if (!confirm("「" + course.name + "」を削除しますか？")) return;
  courses = courses.filter(function (c) {
    return c.id !== id;
  });
  save();
  renderAll();
}

/* ====================================================================
   PDF解析エンジン
   ==================================================================== */
function processPDF(file) {
  var statusEl = document.getElementById("pdfStatus");
  if (!statusEl) return;
  statusEl.innerHTML =
    '<div style="text-align:center;padding:16px"><span class="spin"></span> <span style="margin-left:8px;font-size:.85rem">PDFを解析中...</span></div>';

  var reader = new FileReader();
  reader.onload = function (ev) {
    var data = new Uint8Array(ev.target.result);
    if (typeof pdfjsLib === "undefined") {
      statusEl.innerHTML =
        '<div class="sr sr-ng">PDF.jsライブラリの読み込みに失敗しました。</div>';
      return;
    }

    pdfjsLib
      .getDocument({ data: data })
      .promise.then(function (pdf) {
        extractAllText(pdf).then(function (pageTexts) {
          var parsed = parseTranscript(pageTexts);
          if (!parsed.length) {
            statusEl.innerHTML =
              '<div class="sr sr-ng">科目データを検出できませんでした。東北大学の成績証明書PDFを使用してください。</div>';
            return;
          }
          statusEl.innerHTML =
            '<div class="sr sr-ok">PDFから ' +
            parsed.length +
            " 科目を検出しました。内容確認ダイアログを開きます。</div>";
          showPDFPreview(parsed);
        });
      })
      .catch(function (err) {
        statusEl.innerHTML =
          '<div class="sr sr-ng">PDF読み込みエラー: ' + escapedHtml(err.message) + "</div>";
      });
  };
  reader.readAsArrayBuffer(file);
}

function extractAllText(pdf) {
  var promises = [];
  for (var i = 1; i <= pdf.numPages; i++) {
    (function (pageNum) {
      promises.push(
        pdf.getPage(pageNum).then(function (page) {
          return page.getTextContent().then(function (tc) {
            var items = tc.items.filter(function (it) {
              return it.str && it.str.trim().length > 0;
            });

            var lines = [];
            var lineMap = {};

            items.forEach(function (it) {
              var y = Math.round(it.transform[5]);
              if (!lineMap[y]) {
                lineMap[y] = [];
                lines.push(y);
              }
              lineMap[y].push({ x: it.transform[4], text: it.str });
            });

            lines.sort(function (a, b) {
              return b - a;
            });

            var result = [];
            lines.forEach(function (y) {
              var sitems = lineMap[y].sort(function (a, b) {
                return a.x - b.x;
              });
              result.push(
                sitems
                  .map(function (it) {
                    return it.text;
                  })
                  .join(" "),
              );
            });

            return { pageNum: pageNum, lines: result };
          });
        }),
      );
    })(i);
  }

  return Promise.all(promises).then(function (results) {
    results.sort(function (a, b) {
      return a.pageNum - b.pageNum;
    });
    return results;
  });
}

function parseTranscript(pageTexts) {
  var results = [];
  var seen = {};
  var currentSection = "";
  var gradeRe = /^(ＡＡ|Ａ|Ｂ|Ｃ|Ｄ|Ｐ|AA|A|B|C|D|P)$/;
  var gradeConv = { ＡＡ: "AA", Ａ: "A", Ｂ: "B", Ｃ: "C", Ｄ: "D", Ｐ: "P" };

  var sectionHeaders = [
    "全学教育科目",
    "全学教育基盤科目",
    "全学教育先進科目",
    "全学教育言語科目",
    "全学教育学術基礎科目",
    "学問論",
    "人文科学",
    "社会科学",
    "融合型理科実験",
    "保健体育",
    "情報教育",
    "国際教育",
    "キャリア教育",
    "カレント・トピックス科目",
    "先端学術科目",
    "フロンティア科目",
    "英語",
    "中国語",
    "ドイツ語",
    "フランス語",
    "ロシア語",
    "スペイン語",
    "朝鮮語",
    "基礎数学",
    "基礎物理学",
    "基礎化学",
    "基礎生物学",
    "基礎宇宙地球科学",
    "基礎人文科学",
    "基礎社会科学",
    "専門教育科目",
    "機械知能・航空工学科科目",
    "工学部共通科目",
  ];

  pageTexts.forEach(function (pt) {
    var isStatusPage = pt.lines.some(function (l) {
      return l.indexOf("単位修得状況表") >= 0;
    });
    if (isStatusPage) return;

    pt.lines.forEach(function (line) {
      var trimmed = String(line || "").replace(/\s+/g, " ").trim();
      if (
        !trimmed ||
        trimmed.indexOf("成績一覧表") >= 0 ||
        trimmed.indexOf("科目 単位数") >= 0 ||
        trimmed.indexOf("(注)") >= 0 ||
        trimmed.match(/^\d+\s*\/\s*\d+/) ||
        trimmed.indexOf("GPA") >= 0 ||
        trimmed.match(/^C\d+TB/) ||
        trimmed.match(/^\d+年\s/) ||
        trimmed.indexOf("対象") >= 0
      ) {
        return;
      }

      var working = trimmed;
      var strippedHeader = false;
      while (working) {
        var matchedHeader = "";
        for (var si = 0; si < sectionHeaders.length; si++) {
          var hd = sectionHeaders[si];
          if (
            working === hd ||
            working.indexOf(hd + " ") === 0 ||
            working.replace(/\s/g, "") === hd.replace(/\s/g, "")
          ) {
            if (hd.length > matchedHeader.length) matchedHeader = hd;
          }
        }

        if (!matchedHeader && /^保健体育[^ ]*/.test(working)) {
          matchedHeader = working.split(/\s+/)[0];
          currentSection = "保健体育";
        }
        if (!matchedHeader && working.indexOf("カレント・トピックス科目") === 0) {
          matchedHeader = "カレント・トピックス科目";
          currentSection = "カレント・トピックス科目";
        }

        if (!matchedHeader) break;

        var remainder = matchedHeader === "保健体育"
          ? working.replace(/^保健体育[^ ]*/, "").trim()
          : working.slice(matchedHeader.length).trim();
        var remainderHead = remainder.split(/\s+/)[0] || "";

        /*
         * 学問論のように「セクション名」と「科目名」が同一の行は、
         * ヘッダーではなく科目行として扱う。
         * 例: 学問論 2.0 A 2023 前期 ...
         */
        if (/^\d+(\.\d+)?$/.test(toAscii(remainderHead))) {
          break;
        }

        strippedHeader = true;
        if (matchedHeader === "保健体育") {
          working = remainder;
        } else {
          currentSection = sectionHeaders.indexOf(matchedHeader) >= 0 ? matchedHeader : currentSection;
          working = remainder;
        }
      }

      if (!working && strippedHeader) return;

      if (working.match(/^基礎(ドイツ|フランス|ロシア|スペイン|中国|朝鮮)語/)) {
        currentSection = working.indexOf("中国") >= 0
          ? "中国語"
          : working.indexOf("ドイツ") >= 0
            ? "ドイツ語"
            : working.indexOf("フランス") >= 0
              ? "フランス語"
              : working.indexOf("ロシア") >= 0
                ? "ロシア語"
                : working.indexOf("スペイン") >= 0
                  ? "スペイン語"
                  : "朝鮮語";
      }

      var tokens = working.split(/\s+/);
      var grade = "";
      var credit = null;
      var year = 0;
      var sem = "";
      var gpaEligible = false;
      var foundGrade = false;
      var nameTokens = [];

      for (var ti = 0; ti < tokens.length; ti++) {
        var tok = tokens[ti];
        var tokAscii = toAscii(tok);

        if (!foundGrade && gradeRe.test(tok)) {
          foundGrade = true;
          grade = gradeConv[tok] || tokAscii;
          if (nameTokens.length > 0) {
            var last = toAscii(nameTokens[nameTokens.length - 1]);
            if (/^\d+(\.\d+)?$/.test(last)) {
              credit = parseFloat(last);
              nameTokens.pop();
            }
          }
          continue;
        }

        if (foundGrade) {
          if (tok === "○") {
            gpaEligible = true;
            continue;
          }
          if (/^\d{4}$/.test(tokAscii)) {
            year = parseInt(tokAscii, 10);
            continue;
          }
          if (tok === "前期" || tok === "後期") {
            sem = tok;
            continue;
          }
          continue;
        }

        nameTokens.push(tok);
      }

      var courseName = cleanCourseName(nameTokens.join(" "));
      if (credit == null && foundGrade) {
        credit = inferCourseCredit(courseName, currentSection);
      }
      if (!foundGrade || !courseName || credit == null || !year || !sem) return;

      var cat = guessCategory(courseName, currentSection);
      var entry = normalizeCourse(
        {
          name: courseName,
          origCr: credit,
          grade: grade,
          cat: cat,
          year: year,
          sem: sem,
          gpaEligible: gpaEligible,
        },
        results.length + 1,
      );

      var key = [
        normName(entry.name),
        entry.origCr,
        entry.grade,
        entry.year,
        entry.sem,
      ].join("|");

      if (!seen[key]) {
        seen[key] = true;
        results.push(entry);
      }
    });
  });

  reconcileFlexibleCategories(results);
  sortCourses(results);
  return results;
}

function showPDFPreview(parsed) {
  pendingImportCourses = normalizeCoursesData(parsed);

  var categorySummary = {};
  pendingImportCourses.forEach(function (c) {
    categorySummary[c.cat] = (categorySummary[c.cat] || 0) + 1;
  });

  var h = '<div class="ct">PDFインポート確認</div>';
  h +=
    '<div class="sr sr-ok"><span style="font-weight:700">✓</span><span>' +
    pendingImportCourses.length +
    " 科目を検出しました。この内容で現在のデータを置き換えます。</span></div>";
  h += '<div class="note" style="margin-bottom:12px">成績はPDFを反映した時点ではじめて保存されます。既存データは上書きされます。</div>';

  h += '<div class="preview-table"><table><thead><tr><th>科目名</th><th>単位</th><th>評価</th><th>カテゴリ</th><th>年度</th><th>学期</th></tr></thead><tbody>';
  pendingImportCourses.forEach(function (c) {
    var cat = CATS.find(function (x) {
      return x.id === c.cat;
    });
    h +=
      "<tr><td>" +
      escapedHtml(c.name) +
      "</td><td>" +
      c.origCr +
      "</td><td>" +
      escapedHtml(c.grade) +
      "</td><td>" +
      escapedHtml(cat ? cat.name : c.cat) +
      "</td><td>" +
      c.year +
      "</td><td>" +
      escapedHtml(c.sem) +
      "</td></tr>";
  });
  h += "</tbody></table></div>";

  h += '<div class="flx" style="margin-top:16px;justify-content:flex-end">';
  h += '<button class="btn bo" onclick="closeModal()">キャンセル</button>';
  h += '<button class="btn bp" onclick="applyPendingImport()">この内容で反映</button>';
  h += "</div>";

  openModal(h);
}

function applyPendingImport() {
  courses = normalizeCoursesData(
    pendingImportCourses.map(function (c, idx) {
      return Object.assign({}, c, { id: idx + 1 });
    }),
  );
  save();
  closeModal();
  renderAll();
  switchTab("dash");
}

/* ====================================================================
   初期化
   ==================================================================== */
document.addEventListener("DOMContentLoaded", function () {
  load();
  renderAll();
  switchTab("dash");
});
