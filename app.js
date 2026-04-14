/* ====================================================================
   単位取得確認アプリ — app.js
   東北大学 工学部 機械知能・航空工学科 全7コース対応
   ==================================================================== */

/* ====================================================================
   PDF.js 初期化
   ==================================================================== */
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

/* ====================================================================
   定数: GPA・カテゴリ・卒業要件（全コース共通）
   ==================================================================== */
var GP_MAP = {AA:4, A:3, B:2, C:1, D:0};

/* カテゴリ定義（全コース共通構造） */
var CATS = [
  {id:'z_kiban', name:'全学基盤必修', req:20, grp:'zen_h', desc:'学問論, 自然科学総合実験, 情報とデータの基礎, 線形代数学A, 解析学A/B, 常微分方程式論, 物理学A/B, 化学B（10科目20単位）'},
  {id:'z_eigo',  name:'英語必修', req:6, grp:'zen_h', desc:'英語Ⅰ-A/B, Ⅱ-A/B, Ⅲ, Ⅲ(e-learning)（6科目6単位）'},
  {id:'z_s1', name:'選択1（体育等）', req:1, grp:'zen_s', desc:'学問論演習, スポーツA, 体と健康, 身体の文化と科学'},
  {id:'z_s2', name:'選択2（現代素養等）', req:6, grp:'zen_s', desc:'展開学問論, 現代素養科目群（情報とデータの基礎除く）, 先端学術科目群'},
  {id:'z_s3', name:'選択3（人文社会等）', req:6, grp:'zen_s', desc:'人文科学, 社会科学, 学際科目群等（内2単位は選択4から読替可）'},
  {id:'z_s4', name:'選択4（学術基礎）', req:6, grp:'zen_s', desc:'基礎数学(線形代数学B,複素関数論等), 基礎物理, 基礎化学(化学C等), 基礎生物, 基礎宇宙地球'},
  {id:'z_ga', name:'外国語（初修語Ⅰ）', req:2, grp:'zen_s', desc:'初修語群の中から1外国語を選択し2単位'},
  {id:'z_gb', name:'外国語（初修語Ⅱ/工学英語等）', req:2, grp:'zen_s', desc:'基礎初修語Ⅱ(2単位) または 工学英語Ⅰ/Ⅱ/ｱｶﾃﾞﾐｯｸ・ﾗｲﾃｨﾝｸﾞ(各1単位)から2単位'},
  {id:'s_kou', name:'工学共通必修', req:3, grp:'sen_h', desc:'数学物理学演習Ⅰ/Ⅱ, 情報処理演習（3科目3単位）'},
  {id:'s_gak', name:'学科専門必修', req:15, grp:'sen_h', desc:'☆印科目 + 卒業研究(6単位)'},
  {id:'s1', name:'選択必修①', grp:'sen_sm', desc:'数学Ⅰ/Ⅱ, 数理解析学, 力学, 数理情報学演習, 材料力学Ⅰ'},
  {id:'s2', name:'選択必修②', grp:'sen_sm', desc:'流体力学Ⅰ, 材料力学Ⅱ'},
  {id:'s3', name:'選択必修③', grp:'sen_sm', desc:'量子力学, 機械力学Ⅰ, 熱力学Ⅰ, 制御工学Ⅰ'},
  {id:'s4', name:'選択必修④', grp:'sen_sm', desc:'電磁気学, 熱力学Ⅱ, 材料科学Ⅰ/Ⅱ, 機械力学Ⅱ'},
  {id:'s5', name:'選択必修⑤', req:16, grp:'sen_sm', desc:'5〜6セメスターの○印科目'},
  {id:'s6', name:'選択⑥', grp:'sen_sm', desc:'7セメスター以降の選択科目'},
  {id:'s_other', name:'専門一般選択', grp:'sen_s', desc:'選択必修①〜⑥に含まれない○印科目'},
];

/* 複合要件（全コース共通） */
var CROSS_REQS = [
  {cats:['s1','s2'], req:12, label:'①＋② ≥ 12'},
  {cats:['s2','s3'], req:10, label:'②＋③ ≥ 10'},
  {cats:['s3','s4'], req:12, label:'③＋④ ≥ 12'},
  {cats:['s5'], req:16, label:'⑤ ≥ 16'},
];

/* 卒業要件単位数（全コース共通） */
var GRAD = {zen_h:26, zen_s:23, sen_h:18, sen_s:63, total:130};

/* ====================================================================
   コース定義（7コース）
   ==================================================================== */
var COURSE_LIST = [
  {id:'sys',     name:'機械システムコース',       eng:'Mechanical Systems'},
  {id:'fine',    name:'ファインメカニクスコース',  eng:'Finemechanics'},
  {id:'robo',    name:'ロボティクスコース',       eng:'Robotics'},
  {id:'aero',    name:'航空宇宙コース',          eng:'Aerospace Engineering'},
  {id:'biomed',  name:'機械・医工学コース',       eng:'Mechanical / Biomedical Engineering'},
  {id:'quantum', name:'量子サイエンスコース',     eng:'Quantum Science and Energy Engineering'},
  {id:'energy',  name:'エネルギー環境コース',     eng:'Environment and Energy Engineering'},
];

/* ====================================================================
   科目→カテゴリ マッピング
   ==================================================================== */
function normName(s) {
  return s.replace(/\s+/g, '')
    .replace(/[Ａ-Ｚ]/g, function(c){ return String.fromCharCode(c.charCodeAt(0)-0xFEE0); })
    .replace(/[ａ-ｚ]/g, function(c){ return String.fromCharCode(c.charCodeAt(0)-0xFEE0); })
    .replace(/[０-９]/g, function(c){ return String.fromCharCode(c.charCodeAt(0)-0xFEE0); })
    .replace(/－/g, '-').replace(/（/g, '(').replace(/）/g, ')').replace(/　/g, '');
}

/* 全学教育科目マッピング（全コース共通） */
var COMMON_CAT = {};
(function(){
  var m = {
    /* 全学基盤必修 */
    "学問論":"z_kiban", "自然科学総合実験":"z_kiban", "情報とデータの基礎":"z_kiban",
    "線形代数学A":"z_kiban", "解析学A":"z_kiban", "解析学B":"z_kiban",
    "常微分方程式論":"z_kiban", "物理学A":"z_kiban", "物理学B":"z_kiban", "化学B":"z_kiban",
    /* 英語必修 */
    "英語Ⅰ-A":"z_eigo","英語Ⅰ-B":"z_eigo","英語Ⅱ-A":"z_eigo","英語Ⅱ-B":"z_eigo",
    "英語Ⅲ":"z_eigo","英語Ⅲ(e-learning)":"z_eigo",
    /* 選択1 体育等 */
    "スポーツA":"z_s1","スポーツB":"z_s1","体と健康":"z_s1","身体の文化と科学":"z_s1","学問論演習":"z_s1",
    /* 選択4 学術基礎 */
    "線形代数学B":"z_s4","線形代数数学B":"z_s4","複素関数論":"z_s4","数理統計学":"z_s4",
    "物理学C":"z_s4","基礎物理学数学":"z_s4",
    "化学A":"z_s4","化学C":"z_s4",
    "生命科学A":"z_s4","地球物質科学":"z_s4","地球システム科学":"z_s4",
    /* 工学共通必修 */
    "数学物理学演習Ⅰ":"s_kou","数学物理学演習Ⅱ":"s_kou","情報処理演習":"s_kou",
  };
  for (var k in m) { COMMON_CAT[normName(k)] = m[k]; }
})();

/* 専門教育科目マッピング（コース別） */
/* 5メインコース共通の専門科目 */
var SENMON_COMMON = {
  /* 選択必修① */
  "数学Ⅰ":"s1","数学Ⅱ":"s1","数理解析学":"s1","力学":"s1","数理情報学演習":"s1","材料力学Ⅰ":"s1",
  /* 選択必修② */
  "流体力学Ⅰ":"s2","材料力学Ⅱ":"s2",
  /* 選択必修③ */
  "量子力学":"s3","機械力学Ⅰ":"s3","熱力学Ⅰ":"s3","制御工学Ⅰ":"s3",
  /* 選択必修④ */
  "電磁気学":"s4","熱力学Ⅱ":"s4","材料科学Ⅰ":"s4","材料科学Ⅱ":"s4","機械力学Ⅱ":"s4",
  /* 選択必修⑤ (5-6セメ) */
  "機械創成学Ⅰ":"s5","機械創成学Ⅱ":"s5","情報科学基礎Ⅰ":"s5","情報科学基礎Ⅱ":"s5",
  "電気電子回路Ⅰ":"s5","電気電子回路Ⅱ":"s5","制御工学Ⅱ":"s5",
  "流体力学Ⅱ":"s5","伝熱学":"s5","熱・物質輸送論":"s5","弾性力学":"s5",
  "宇宙工学":"s5","生命機械工学":"s5","コンピュータ実習Ⅱ":"s5",
  "材料強度学":"s5","計算材料力学":"s5","数値流体力学":"s5","空気力学":"s5",
  "機械設計学Ⅰ":"s5","機械設計学Ⅱ":"s5","ロボティクスⅠ":"s5","ロボティクスⅡ":"s5",
  "計測工学Ⅰ":"s5","計測工学Ⅱ":"s5","エネルギー変換工学":"s5","航空機設計学":"s5",
  /* 選択⑥ (7セメ〜) */
  "トライボロジー":"s6","電子工学概論":"s6","材料理工学概論":"s6","環境工学概論":"s6",
  "知的財産権入門":"s6","生体医工学入門":"s6","工学倫理":"s6","工学英語Ⅱ":"s6",
  "燃焼工学":"s6","航空宇宙機学":"s6",
  /* 専門一般選択 */
  "機械工学序説":"s_other","工学化学概論":"s_other","工学英語Ⅰ":"s_other",
  "創造工学研修":"s_other","アカデミック・ライティング":"s_other",
  "機械知能・航空特別研修":"s_other","機械知能・航空特別講義Ⅰ":"s_other","機械知能・航空特別講義Ⅱ":"s_other",
  "工学教育院特別講義":"s_other","国際工学研修Ⅰ":"s_other","国際工学研修Ⅱ":"s_other",
  "国際工学研修Ⅲ":"s_other","国際工学研修Ⅳ":"s_other",
};

/* 5メインコース共通の必修（☆）科目 → s_gak */
var HISSU_MAIN5 = [
  "コンピュータ実習Ⅰ","機械知能・航空研修Ⅰ","計画及び製図Ⅰ",
  "機械知能・航空実験Ⅰ","機械知能・航空研修Ⅱ","機械工作実習",
  "機械知能・航空実験Ⅱ","計画及び製図Ⅱ","学外見学","卒業研究"
];

/* 量子サイエンス・エネルギー環境の必修科目 */
var HISSU_QE = [
  "コンピュータ実習","計画及び製図",
  "機械知能・航空実験A","機械知能・航空研修A",
  "機械知能・航空実験B","機械知能・航空研修B",
  "学外見学","卒業研究"
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
    "量子サイエンス入門": "s_gak",
    /* 量子固有の⑤科目 */
    "量子力学B":"s5","電磁気学B":"s5","反応速度論":"s5","移動現象論":"s5","放射線医用工学":"s5",
    "資源循環論":"s5","情報科学基礎":"s5","電気電子回路":"s5",
    /* 量子固有の⑥科目 */
    "放射線安全工学":"s6","核燃料・材料学概論":"s6","原子力安全規制概論":"s6",
    "材料の強度と破壊":"s5",
  },
  energy: {
    /* エネルギー環境入門は必修扱い */
    "エネルギー環境入門": "s_gak",
    /* エネルギー環境固有の⑤科目 */
    "材料の強度と破壊":"s5","環境地球科学":"s5","環境システムⅠ":"s5",
    /* エネルギー環境固有の⑥科目 */
    "計算力学":"s6","環境システムⅡ":"s6","環境材料学":"s6",
    "ジオメカニクス":"s6","エネルギー・資源論":"s6",
    "核エネルギー物理学":"s6","放射化学":"s6","中性子輸送学":"s6",
    "貯留層工学":"s6","エネルギー材料科学":"s6","核環境工学":"s6",
    "エネルギー環境コース特別講義":"s6",
  },
};

/* 現在のコースに応じたCOURSE_CATを構築 */
var COURSE_CAT = {};
function buildCourseCat(courseId) {
  COURSE_CAT = {};
  /* 1. 共通全学 */
  for (var k in COMMON_CAT) { COURSE_CAT[k] = COMMON_CAT[k]; }
  /* 2. 専門共通 */
  var senmon = {};
  for (var sk in SENMON_COMMON) { senmon[sk] = SENMON_COMMON[sk]; }
  /* 3. 必修科目 → s_gak */
  var hissuList;
  if (courseId === 'quantum' || courseId === 'energy') {
    hissuList = HISSU_QE;
  } else {
    hissuList = HISSU_MAIN5;
  }
  hissuList.forEach(function(name) { senmon[name] = 's_gak'; });
  /* 4. コース固有 */
  var specific = COURSE_SPECIFIC[courseId] || {};
  for (var cs in specific) { senmon[cs] = specific[cs]; }
  /* 5. 正規化してマージ */
  for (var sn in senmon) { COURSE_CAT[normName(sn)] = senmon[sn]; }
}

/* 成績証明書のセクション名 → カテゴリ (フォールバック用) */
var SECTION_CAT = {
  "学問論":"z_s3", "人文科学":"z_s3", "社会科学":"z_s3",
  "融合型理科実験":"z_kiban", "保健体育":"z_s1",
  "情報教育":"z_s2", "国際教育":"z_s2", "キャリア教育":"z_s2",
  "カレント・トピックス":"z_s2", "先端学術":"z_s2", "フロンティア":"z_s2",
  "基礎数学":"z_s4", "基礎物理":"z_s4", "基礎化学":"z_s4",
  "基礎生物":"z_s4", "基礎宇宙":"z_s4", "基礎人文":"z_s4", "基礎社会":"z_s4",
  "学際":"z_s3",
};

/* ====================================================================
   デフォルト成績データ（ファインメカニクスの例）
   ==================================================================== */
var DEFAULT_COURSES = [
  {name:"学問論",cr:2,origCr:2,grade:"A",cat:"z_kiban",year:2023,sem:"前期"},
  {name:"自然科学総合実験",cr:2,origCr:2,grade:"A",cat:"z_kiban",year:2023,sem:"前期"},
  {name:"情報とデータの基礎",cr:2,origCr:2,grade:"B",cat:"z_kiban",year:2023,sem:"前期"},
  {name:"線形代数学A",cr:2,origCr:2,grade:"A",cat:"z_kiban",year:2023,sem:"前期"},
  {name:"解析学A",cr:2,origCr:2,grade:"B",cat:"z_kiban",year:2023,sem:"前期"},
  {name:"解析学B",cr:2,origCr:2,grade:"B",cat:"z_kiban",year:2023,sem:"後期"},
  {name:"常微分方程式論",cr:2,origCr:2,grade:"C",cat:"z_kiban",year:2024,sem:"前期"},
  {name:"物理学A",cr:2,origCr:2,grade:"A",cat:"z_kiban",year:2023,sem:"前期"},
  {name:"物理学B",cr:2,origCr:2,grade:"B",cat:"z_kiban",year:2023,sem:"後期"},
  {name:"化学B",cr:2,origCr:2,grade:"B",cat:"z_kiban",year:2024,sem:"前期"},
  {name:"英語Ⅰ-A",cr:1,origCr:1,grade:"B",cat:"z_eigo",year:2023,sem:"前期"},
  {name:"英語Ⅰ-B",cr:1,origCr:1,grade:"B",cat:"z_eigo",year:2023,sem:"前期"},
  {name:"英語Ⅱ-A",cr:1,origCr:1,grade:"B",cat:"z_eigo",year:2023,sem:"後期"},
  {name:"英語Ⅱ-B",cr:1,origCr:1,grade:"B",cat:"z_eigo",year:2023,sem:"後期"},
  {name:"英語Ⅲ",cr:1,origCr:1,grade:"B",cat:"z_eigo",year:2024,sem:"前期"},
  {name:"英語Ⅲ(e-learning)",cr:1,origCr:1,grade:"A",cat:"z_eigo",year:2024,sem:"前期"},
  {name:"スポーツA",cr:1,origCr:1,grade:"A",cat:"z_s1",year:2024,sem:"前期"},
  {name:"機械学習アルゴリズム概論",cr:2,origCr:2,grade:"B",cat:"z_s2",year:2023,sem:"後期"},
  {name:"文化理解",cr:2,origCr:2,grade:"B",cat:"z_s2",year:2023,sem:"後期"},
  {name:"社会起業家・NPO入門ゼミ",cr:2,origCr:2,grade:"AA",cat:"z_s2",year:2023,sem:"前期"},
  {name:"AI構築を目指すPython文法とプログラミングの基礎",cr:2,origCr:2,grade:"AA",cat:"z_s2",year:2023,sem:"前期"},
  {name:"宗教学",cr:2,origCr:2,grade:"C",cat:"z_s3",year:2025,sem:"前期"},
  {name:"芸術",cr:2,origCr:2,grade:"AA",cat:"z_s3",year:2025,sem:"後期"},
  {name:"心理学",cr:2,origCr:2,grade:"A",cat:"z_s3",year:2024,sem:"後期"},
  {name:"線形代数学B",cr:2,origCr:2,grade:"C",cat:"z_s4",year:2023,sem:"後期"},
  {name:"複素関数論",cr:2,origCr:2,grade:"B",cat:"z_s4",year:2024,sem:"後期"},
  {name:"化学C",cr:2,origCr:2,grade:"B",cat:"z_s4",year:2023,sem:"後期"},
  {name:"地球物質科学",cr:0,origCr:2,grade:"D",cat:"z_s4",year:2023,sem:"後期"},
  {name:"基礎中国語Ⅰ",cr:2,origCr:2,grade:"C",cat:"z_ga",year:2023,sem:"前期"},
  {name:"基礎中国語Ⅱ",cr:2,origCr:2,grade:"C",cat:"z_gb",year:2023,sem:"後期"},
  {name:"数学物理学演習Ⅰ",cr:1,origCr:1,grade:"AA",cat:"s_kou",year:2023,sem:"前期"},
  {name:"数学物理学演習Ⅱ",cr:1,origCr:1,grade:"B",cat:"s_kou",year:2023,sem:"後期"},
  {name:"情報処理演習",cr:1,origCr:1,grade:"B",cat:"s_kou",year:2023,sem:"後期"},
  {name:"コンピュータ実習Ⅰ",cr:1,origCr:1,grade:"A",cat:"s_gak",year:2024,sem:"後期"},
  {name:"機械知能・航空研修Ⅰ",cr:2,origCr:2,grade:"AA",cat:"s_gak",year:2024,sem:"後期"},
  {name:"計画及び製図Ⅰ",cr:1,origCr:1,grade:"B",cat:"s_gak",year:2024,sem:"後期"},
  {name:"機械知能・航空実験Ⅰ",cr:1,origCr:1,grade:"A",cat:"s_gak",year:2025,sem:"前期"},
  {name:"機械知能・航空研修Ⅱ",cr:1,origCr:1,grade:"A",cat:"s_gak",year:2025,sem:"後期"},
  {name:"機械工作実習",cr:1,origCr:1,grade:"B",cat:"s_gak",year:2025,sem:"前期"},
  {name:"機械知能・航空実験Ⅱ",cr:1,origCr:1,grade:"A",cat:"s_gak",year:2025,sem:"後期"},
  {name:"計画及び製図Ⅱ",cr:1,origCr:1,grade:"B",cat:"s_gak",year:2025,sem:"後期"},
  {name:"数学Ⅰ",cr:2,origCr:2,grade:"C",cat:"s1",year:2024,sem:"前期"},
  {name:"数学Ⅱ",cr:2,origCr:2,grade:"B",cat:"s1",year:2024,sem:"前期"},
  {name:"数理解析学",cr:2,origCr:2,grade:"A",cat:"s1",year:2024,sem:"前期"},
  {name:"力学",cr:2,origCr:2,grade:"B",cat:"s1",year:2024,sem:"前期"},
  {name:"数理情報学演習",cr:2,origCr:2,grade:"B",cat:"s1",year:2024,sem:"前期"},
  {name:"材料力学Ⅰ",cr:2,origCr:2,grade:"B",cat:"s1",year:2024,sem:"前期"},
  {name:"流体力学Ⅰ",cr:2,origCr:2,grade:"A",cat:"s2",year:2024,sem:"前期"},
  {name:"材料力学Ⅱ",cr:2,origCr:2,grade:"C",cat:"s2",year:2024,sem:"前期"},
  {name:"量子力学",cr:2,origCr:2,grade:"B",cat:"s3",year:2024,sem:"後期"},
  {name:"機械力学Ⅰ",cr:2,origCr:2,grade:"C",cat:"s3",year:2024,sem:"後期"},
  {name:"熱力学Ⅰ",cr:2,origCr:2,grade:"B",cat:"s3",year:2024,sem:"後期"},
  {name:"制御工学Ⅰ",cr:2,origCr:2,grade:"C",cat:"s3",year:2024,sem:"後期"},
  {name:"電磁気学",cr:2,origCr:2,grade:"B",cat:"s4",year:2024,sem:"後期"},
  {name:"熱力学Ⅱ",cr:2,origCr:2,grade:"AA",cat:"s4",year:2024,sem:"後期"},
  {name:"材料科学Ⅰ",cr:2,origCr:2,grade:"A",cat:"s4",year:2024,sem:"後期"},
  {name:"材料科学Ⅱ",cr:2,origCr:2,grade:"C",cat:"s4",year:2024,sem:"後期"},
  {name:"機械創成学Ⅰ",cr:2,origCr:2,grade:"C",cat:"s5",year:2025,sem:"前期"},
  {name:"情報科学基礎Ⅰ",cr:2,origCr:2,grade:"B",cat:"s5",year:2025,sem:"前期"},
  {name:"電気電子回路Ⅰ",cr:2,origCr:2,grade:"B",cat:"s5",year:2025,sem:"前期"},
  {name:"情報科学基礎Ⅱ",cr:2,origCr:2,grade:"A",cat:"s5",year:2025,sem:"前期"},
  {name:"伝熱学",cr:2,origCr:2,grade:"C",cat:"s5",year:2025,sem:"前期"},
  {name:"宇宙工学",cr:2,origCr:2,grade:"C",cat:"s5",year:2025,sem:"前期"},
  {name:"ロボティクスⅠ",cr:2,origCr:2,grade:"B",cat:"s5",year:2025,sem:"後期"},
  {name:"機械設計学Ⅰ",cr:2,origCr:2,grade:"C",cat:"s5",year:2025,sem:"後期"},
  {name:"計測工学Ⅰ",cr:2,origCr:2,grade:"C",cat:"s5",year:2025,sem:"後期"},
  {name:"エネルギー変換工学",cr:2,origCr:2,grade:"B",cat:"s5",year:2025,sem:"後期"},
  {name:"数値流体力学",cr:2,origCr:2,grade:"C",cat:"s5",year:2025,sem:"後期"},
  {name:"計算材料力学",cr:2,origCr:2,grade:"B",cat:"s5",year:2025,sem:"後期"},
  {name:"材料強度学",cr:2,origCr:2,grade:"B",cat:"s5",year:2025,sem:"後期"},
  {name:"電気電子回路Ⅱ",cr:0,origCr:2,grade:"D",cat:"s5",year:2025,sem:"前期"},
  {name:"コンピュータ実習Ⅱ",cr:0,origCr:1,grade:"D",cat:"s5",year:2025,sem:"前期"},
  {name:"熱・物質輸送論",cr:0,origCr:2,grade:"D",cat:"s5",year:2025,sem:"前期"},
  {name:"計測工学Ⅱ",cr:0,origCr:2,grade:"D",cat:"s5",year:2025,sem:"後期"},
  {name:"機械工学序説",cr:2,origCr:2,grade:"A",cat:"s_other",year:2023,sem:"前期"},
  {name:"工学英語Ⅰ",cr:1,origCr:1,grade:"B",cat:"s_other",year:2023,sem:"後期"},
];

/* ====================================================================
   アプリ状態
   ==================================================================== */
var courses = [];
var filterCat = 'all';
var filterGrade = 'all';
var currentCourse = 'fine'; /* デフォルトコース */

function load() {
  /* コース設定を復元 */
  var savedCourse = localStorage.getItem('tohoku_course_id');
  if (savedCourse && COURSE_LIST.some(function(c){ return c.id === savedCourse; })) {
    currentCourse = savedCourse;
  }
  buildCourseCat(currentCourse);

  var saved = localStorage.getItem('tohoku_credits_v4');
  if (saved) { try { courses = JSON.parse(saved); return; } catch(e) {} }
  courses = DEFAULT_COURSES.map(function(c,i){ return Object.assign({}, c, {id: i+1}); });
  save();
}
function save() {
  localStorage.setItem('tohoku_credits_v4', JSON.stringify(courses));
  localStorage.setItem('tohoku_course_id', currentCourse);
}
function nextId() { return courses.length ? Math.max.apply(null, courses.map(function(c){return c.id;})) + 1 : 1; }

/* コース切り替え */
function switchCourse(courseId) {
  currentCourse = courseId;
  buildCourseCat(courseId);
  save();
  updateHeader();
  renderAll();
}

function updateHeader() {
  var info = COURSE_LIST.find(function(c){ return c.id === currentCourse; });
  var sub = document.querySelector('.hdr .sub');
  if (sub && info) sub.textContent = '東北大学 工学部 機械知能・航空工学科 ' + info.name;
  var sel = document.getElementById('courseSelect');
  if (sel) sel.value = currentCourse;
}

/* ====================================================================
   集計関数
   ==================================================================== */
function earned(catId) { return courses.filter(function(c){return c.cat===catId;}).reduce(function(s,c){return s+c.cr;},0); }
function earnedMulti(catIds) { return courses.filter(function(c){return catIds.indexOf(c.cat)>=0;}).reduce(function(s,c){return s+c.cr;},0); }
function totalEarned() { return courses.reduce(function(s,c){return s+c.cr;},0); }
function grpEarned(grp) { var ids=CATS.filter(function(c){return c.grp===grp;}).map(function(c){return c.id;}); return earnedMulti(ids); }
function calcGPA() {
  var num=0, den=0;
  courses.forEach(function(c){
    if (c.grade==='P') return;
    var gp = GP_MAP[c.grade];
    if (gp===undefined) return;
    var cr = c.origCr || c.cr || 0;
    if (cr<=0) return;
    num += gp * cr; den += cr;
  });
  return den>0 ? num/den : 0;
}

/* ====================================================================
   ダッシュボード
   ==================================================================== */
function renderDash() {
  var el = document.getElementById('dash');
  var tot = totalEarned(), gpa = calcGPA(), pct = Math.min(100, Math.round(tot/GRAD.total*100));
  var zenH = grpEarned('zen_h'), zenS = grpEarned('zen_s');
  var senH = grpEarned('sen_h'), senSM = grpEarned('sen_sm'), senS = grpEarned('sen_s');
  var senSelTotal = senSM + senS;
  var crossOk = CROSS_REQS.every(function(cr){ return earnedMulti(cr.cats)>=cr.req; });
  var allOk = zenH>=GRAD.zen_h && zenS>=GRAD.zen_s && senH>=GRAD.sen_h && senSelTotal>=GRAD.sen_s && crossOk && tot>=GRAD.total;
  var jClass, jText;
  if (allOk) { jClass='jp'; jText='卒業要件を全て満たしています'; }
  else if (tot>=120) { jClass='jw'; jText='卒業要件の一部が未充足です'; }
  else { jClass='jf'; jText='卒業要件を満たしていません（残り'+(GRAD.total-tot)+'単位）'; }
  var h = '<div class="jb '+jClass+'">'+jText+'</div>';
  h += '<div class="sg">';
  h += '<div class="sc"><div class="num" style="color:var(--pri)">'+tot+'</div><div class="lbl">修得単位 / '+GRAD.total+'</div></div>';
  h += '<div class="sc"><div class="num" style="color:'+(gpa>=3?'var(--ok)':gpa>=2?'var(--warn)':'var(--ng)')+'">'+gpa.toFixed(2)+'</div><div class="lbl">累積GPA</div></div>';
  h += '<div class="sc"><div class="num" style="color:var(--pri)">'+pct+'%</div><div class="lbl">進捗率</div></div>';
  h += '<div class="sc"><div class="num" style="color:'+(GRAD.total-tot<=6?'var(--ok)':'var(--warn)')+'">'+(GRAD.total-tot)+'</div><div class="lbl">残り単位数</div></div>';
  h += '</div>';
  h += '<div class="card"><div class="ct">区分別進捗</div>';
  var secs=[{l:'全学必修',g:zenH,r:GRAD.zen_h},{l:'全学選択',g:zenS,r:GRAD.zen_s},{l:'専門必修',g:senH,r:GRAD.sen_h},{l:'専門選択',g:senSelTotal,r:GRAD.sen_s}];
  secs.forEach(function(s){ var p=Math.min(100,Math.round(s.g/s.r*100)), col=p>=100?'grn':p>=70?'ylw':'red';
    h+='<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:4px"><span style="font-weight:600">'+s.l+'</span><span style="color:var(--g400)">'+s.g+' / '+s.r+'</span></div><div class="pb"><div class="pf '+col+'" style="width:'+p+'%">'+p+'%</div></div></div>';
  });
  h += '</div>';
  h += '<div class="card"><div class="ct">専門選択必修（複合要件）</div>';
  CROSS_REQS.forEach(function(cr){ var got=earnedMulti(cr.cats), ok=got>=cr.req;
    h+='<div class="sr '+(ok?'sr-ok':'sr-ng')+'"><span style="font-weight:700">'+(ok?'✓':'✗')+'</span><span style="flex:1">'+cr.label+'</span><span style="font-weight:700">'+got+' / '+cr.req+'</span></div>';
  });
  h += '</div>';
  h += '<div class="card"><div class="ct">6セメスターバリア <span class="csub">卒業研究履修条件</span></div>';
  checkBarrier().forEach(function(item){ h+='<div class="sr '+(item.ok?'sr-ok':'sr-ng')+'"><span style="font-weight:700">'+(item.ok?'✓':'✗')+'</span><span style="flex:1">'+item.label+'</span></div>'; });
  h += '</div>';
  el.innerHTML = h;
}
function checkBarrier() {
  var hK=earned('s_kou'), hG=courses.filter(function(c){return c.cat==='s_gak'&&c.name!=='卒業研究';}).reduce(function(s,c){return s+c.cr;},0);
  var zH=grpEarned('zen_h'), s3v=earned('z_s3'), eig=earned('z_eigo'), ga=earned('z_ga'), gb=earned('z_gb');
  return [
    {label:'6セメまでの全必修単位を修得', ok:hK>=3&&hG>=9&&zH>=26},
    {label:'選択3('+s3v+')+外国語群('+(eig+ga+gb)+')='+(s3v+eig+ga+gb)+' ≥ 14', ok:(s3v+eig+ga+gb)>=14},
    {label:'②+③ = '+earnedMulti(['s2','s3'])+' ≥ 8', ok:earnedMulti(['s2','s3'])>=8},
    {label:'③+④ = '+earnedMulti(['s3','s4'])+' ≥ 12', ok:earnedMulti(['s3','s4'])>=12},
    {label:'⑤ = '+earned('s5')+' ≥ 16', ok:earned('s5')>=16},
    {label:'工学英語Ⅰを修得', ok:courses.some(function(c){return c.name.indexOf('工学英語Ⅰ')>=0&&c.cr>0;})},
  ];
}

/* ====================================================================
   科目一覧
   ==================================================================== */
function renderList() {
  var el = document.getElementById('list'), h = '';
  h += '<div class="card" style="padding:12px 16px"><div style="font-size:.73rem;font-weight:600;color:var(--g400);margin-bottom:6px">カテゴリ</div><div class="flx">';
  h += '<button class="fsel '+(filterCat==='all'?'on':'')+'" onclick="setFilter(\'all\')">全て</button>';
  CATS.forEach(function(c){ var n=courses.filter(function(x){return x.cat===c.id;}).length;
    if(n>0) h+='<button class="fsel '+(filterCat===c.id?'on':'')+'" onclick="setFilter(\''+c.id+'\')">'+c.name+'('+n+')</button>';
  });
  h += '</div>';
  h += '<div style="font-size:.73rem;font-weight:600;color:var(--g400);margin-top:12px;margin-bottom:6px">評価</div><div class="flx">';
  h += '<button class="fsel '+(filterGrade==='all'?'on':'')+'" onclick="setGradeFilter(\'all\')">全て</button>';
  ['AA','A','B','C','D'].forEach(function(g){
    var n = courses.filter(function(x){return x.grade===g;}).length;
    var gc = g==='AA'?'gaa':g==='A'?'ga':g==='B'?'gb':g==='C'?'gc':'gd';
    if(n>0) h+='<button class="fsel '+(filterGrade===g?'on':'')+'" onclick="setGradeFilter(\''+g+'\')"><span class="'+gc+'">'+g+'</span> ('+n+')</button>';
  });
  h += '</div></div>';
  var filtered = courses;
  if (filterCat !== 'all') filtered = filtered.filter(function(c){return c.cat===filterCat;});
  if (filterGrade !== 'all') filtered = filtered.filter(function(c){return c.grade===filterGrade;});
  var sorted = filtered.slice().sort(function(a,b){return a.year!==b.year?a.year-b.year:(a.sem<b.sem?-1:1);});
  var filteredEarned = filtered.reduce(function(s,c){return s+c.cr;},0);
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:0 4px">';
  h += '<span style="font-size:.82rem;color:var(--g500)">'+filtered.length+'科目 / '+filteredEarned+'単位</span>';
  if(filterCat!=='all'||filterGrade!=='all') h+='<button class="btn bsm bo" onclick="setFilter(\'all\');filterGrade=\'all\';renderList();">フィルター解除</button>';
  h += '</div>';
  h += '<div class="card"><div class="tw"><table><thead><tr><th>科目名</th><th>単位</th><th>評価</th><th>カテゴリ</th><th>年度</th><th></th></tr></thead><tbody>';
  if(!sorted.length) h+='<tr><td colspan="6" style="text-align:center;color:var(--g300);padding:30px">科目がありません</td></tr>';
  sorted.forEach(function(c){ var cat=CATS.find(function(x){return x.id===c.cat;}); var gc=c.grade==='AA'?'gaa':c.grade==='A'?'ga':c.grade==='B'?'gb':c.grade==='C'?'gc':'gd';
    h+='<tr><td style="font-weight:500">'+c.name+'</td><td>'+c.cr+(c.grade==='D'?'<span style="font-size:.7rem;color:var(--ng)"> (不可)</span>':'')+'</td><td class="'+gc+'">'+c.grade+'</td><td style="font-size:.73rem;color:var(--g500)">'+(cat?cat.name:'?')+'</td><td style="font-size:.8rem">'+c.year+' '+c.sem+'</td><td><button class="bg-del" onclick="editCourse('+c.id+')" title="編集">✎</button><button class="bg-del" onclick="delCourse('+c.id+')" title="削除">✕</button></td></tr>';
  });
  h += '</tbody></table></div></div>';
  el.innerHTML = h;
}
function setFilter(cat) { filterCat=cat; renderList(); }
function setGradeFilter(g) { filterGrade=g; renderList(); }

/* ====================================================================
   卒業要件
   ==================================================================== */
function renderReq() {
  var el = document.getElementById('req'), h = '';
  h += '<div class="card"><div class="ct">全学教育科目 <span class="csub">必修26 ＋ 選択23 ＝ 49以上</span></div>';
  CATS.filter(function(c){return c.grp==='zen_h'||c.grp==='zen_s';}).forEach(function(cat){
    var got=earned(cat.id), req=cat.req||0, ok=req>0?got>=req:true;
    h+='<div class="rw"><div class="rn">'+cat.name+(cat.desc?'<div class="note">'+cat.desc+'</div>':'')+'</div><div class="rv">'+got+(req?' / '+req:'')+'</div><div class="rs">'+(req>0?(ok?'<span class="badge b-ok">充足</span>':'<span class="badge b-ng">不足 '+(req-got)+'</span>'):'—')+'</div></div>';
  });
  var zenST=grpEarned('zen_s');
  h+='<hr class="sep"><div class="rw"><div class="rn" style="font-weight:700">全学選択 合計</div><div class="rv" style="font-weight:700">'+zenST+' / '+GRAD.zen_s+'</div><div class="rs">'+(zenST>=GRAD.zen_s?'<span class="badge b-ok">充足</span>':'<span class="badge b-ng">不足 '+(GRAD.zen_s-zenST)+'</span>')+'</div></div></div>';
  h += '<div class="card"><div class="ct">専門教育科目 — 必修 <span class="csub">工学共通3 ＋ 学科専門15 ＝ 18</span></div>';
  CATS.filter(function(c){return c.grp==='sen_h';}).forEach(function(cat){
    var got=earned(cat.id), ok=got>=cat.req;
    h+='<div class="rw"><div class="rn">'+cat.name+(cat.desc?'<div class="note">'+cat.desc+'</div>':'')+'</div><div class="rv">'+got+' / '+cat.req+'</div><div class="rs">'+(ok?'<span class="badge b-ok">充足</span>':'<span class="badge b-wa">残 '+(cat.req-got)+'</span>')+'</div></div>';
  });
  h += '</div>';
  h += '<div class="card"><div class="ct">専門教育科目 — 選択必修 <span class="csub">複合要件あり</span></div>';
  ['s1','s2','s3','s4','s5','s6'].forEach(function(id){ var cat=CATS.find(function(c){return c.id===id;}), got=earned(id);
    h+='<div class="rw"><div class="rn">'+cat.name+'<div class="note">'+(cat.desc||'')+'</div></div><div class="rv">'+got+(cat.req?' / '+cat.req:'')+'</div><div class="rs">'+(cat.req?(got>=cat.req?'<span class="badge b-ok">充足</span>':'<span class="badge b-ng">不足 '+(cat.req-got)+'</span>'):'—')+'</div></div>';
  });
  h+='<hr class="sep"><div style="font-size:.85rem;font-weight:700;margin-bottom:10px">複合要件</div>';
  CROSS_REQS.forEach(function(cr){ var got=earnedMulti(cr.cats), ok=got>=cr.req;
    h+='<div class="sr '+(ok?'sr-ok':'sr-ng')+'" style="margin-bottom:6px"><span style="font-weight:700">'+(ok?'✓':'✗')+'</span><span style="flex:1">'+cr.label+'</span><span style="font-weight:700">'+got+' / '+cr.req+'</span></div>';
  });
  var senSMtot=grpEarned('sen_sm'), senStot=grpEarned('sen_s'), senSelAll=senSMtot+senStot;
  h+='<hr class="sep"><div class="rw"><div class="rn" style="font-weight:700">専門選択 合計（①〜⑥＋一般選択）</div><div class="rv" style="font-weight:700">'+senSelAll+' / '+GRAD.sen_s+'</div><div class="rs">'+(senSelAll>=GRAD.sen_s?'<span class="badge b-ok">充足</span>':'<span class="badge b-ng">不足 '+(GRAD.sen_s-senSelAll)+'</span>')+'</div></div></div>';
  h += '<div class="card"><div class="ct">外国語選択の計上ルール</div><div style="font-size:.83rem;line-height:1.7">';
  h += '<p><b>Part A（初修語Ⅰ）:</b> 初修語群から1外国語を選択し2単位</p>';
  h += '<p style="margin:6px 0"><b>Part B（初修語Ⅱ / 工学英語等）:</b> 基礎初修語Ⅱ（同一言語・2単位）または 工学英語Ⅰ・Ⅱ・ｱｶﾃﾞﾐｯｸ・ﾗｲﾃｨﾝｸﾞ（各1単位）から2単位</p>';
  var hasII = courses.some(function(c){return c.cat==='z_gb'&&c.cr>0;});
  if (hasII) { h+='<div class="sr sr-ok" style="margin-top:8px"><span style="font-weight:700">✓</span><span>初修語ⅡでPartB充足済 → 工学英語Ⅰは専門一般選択に計上</span></div>'; }
  else { h+='<div class="sr sr-ng" style="margin-top:8px"><span style="font-weight:700">✗</span><span>PartB未充足: 初修語Ⅱ or 工学英語Ⅰ/Ⅱ/ｱｶﾃﾞﾐｯｸ・ﾗｲﾃｨﾝｸﾞから計2単位が必要</span></div>'; }
  h += '</div></div>';
  var tot = totalEarned();
  var vZH=grpEarned('zen_h'), vZS=grpEarned('zen_s'), vSH=grpEarned('sen_h');
  function bdg(ok,y,n){return ok?'<span class="badge b-ok">'+y+'</span>':'<span class="badge b-ng">'+n+'</span>';}
  function bdgW(ok,y,n){return ok?'<span class="badge b-ok">'+y+'</span>':'<span class="badge b-wa">'+n+'</span>';}
  h += '<div class="card"><div class="ct">卒業に要する最低修得単位数</div><table style="font-size:.85rem">';
  h += '<tr><th></th><th style="text-align:right">必要</th><th style="text-align:right">修得済</th><th style="text-align:right">判定</th></tr>';
  h += '<tr><td>全学必修</td><td style="text-align:right">'+GRAD.zen_h+'</td><td style="text-align:right">'+vZH+'</td><td style="text-align:right">'+bdg(vZH>=GRAD.zen_h,'✓','✗')+'</td></tr>';
  h += '<tr><td>全学選択</td><td style="text-align:right">'+GRAD.zen_s+'</td><td style="text-align:right">'+vZS+'</td><td style="text-align:right">'+bdg(vZS>=GRAD.zen_s,'✓','✗')+'</td></tr>';
  h += '<tr><td>専門必修</td><td style="text-align:right">'+GRAD.sen_h+'</td><td style="text-align:right">'+vSH+'</td><td style="text-align:right">'+bdgW(vSH>=GRAD.sen_h,'✓','残'+(GRAD.sen_h-vSH))+'</td></tr>';
  h += '<tr><td>専門選択</td><td style="text-align:right">'+GRAD.sen_s+'</td><td style="text-align:right">'+senSelAll+'</td><td style="text-align:right">'+bdg(senSelAll>=GRAD.sen_s,'✓','残'+(GRAD.sen_s-senSelAll))+'</td></tr>';
  h += '<tr style="font-weight:700;border-top:2px solid var(--g200)"><td>合計</td><td style="text-align:right">'+GRAD.total+'</td><td style="text-align:right">'+tot+'</td><td style="text-align:right">'+bdg(tot>=GRAD.total,'✓','残'+(GRAD.total-tot))+'</td></tr>';
  h += '</table></div>';
  el.innerHTML = h;
}

/* ====================================================================
   設定タブ（PDFインポート＋コース設定）
   ==================================================================== */
function renderSet() {
  var el = document.getElementById('set');
  var tot = totalEarned(), gpa = calcGPA();
  var dCount = courses.filter(function(c){return c.grade==='D';}).length;
  var gpaCr = courses.reduce(function(s,c){ if(c.grade==='P')return s; return s+(c.origCr||c.cr); },0);
  var curInfo = COURSE_LIST.find(function(c){ return c.id === currentCourse; });
  var h = '';

  /* コース設定 */
  h += '<div class="card">';
  h += '<div class="ct">コース設定</div>';
  h += '<p style="font-size:.83rem;color:var(--g600);margin-bottom:10px">所属コースを選択してください。卒業要件の科目分類がコースに応じて切り替わります。</p>';
  h += '<select id="courseSelectSetting" style="font-size:.92rem;padding:10px 14px" onchange="switchCourse(this.value)">';
  COURSE_LIST.forEach(function(c){
    h += '<option value="'+c.id+'"'+(c.id===currentCourse?' selected':'')+'>'+c.name+'</option>';
  });
  h += '</select>';
  h += '<div class="note" style="margin-top:6px">現在: <b>'+curInfo.name+'</b> ('+curInfo.eng+')</div>';
  h += '</div>';

  /* PDF */
  h += '<div class="card">';
  h += '<div class="ct">成績証明書PDFインポート</div>';
  h += '<p style="font-size:.83rem;color:var(--g600);margin-bottom:14px">東北大学の成績証明書PDFをインポートすると、科目名・単位数・評価・年度を自動で読み取り、卒業要件カテゴリに自動分類します。</p>';
  h += '<div class="drop-zone" id="dropZone" onclick="document.getElementById(\'pdfInput\').click()">';
  h += '<div class="dz-icon">📄</div>';
  h += '<div class="dz-text">PDFファイルをドラッグ＆ドロップ</div>';
  h += '<div class="dz-sub">またはクリックしてファイルを選択</div>';
  h += '</div>';
  h += '<input type="file" id="pdfInput" accept=".pdf" style="display:none" onchange="handlePDFSelect(event)">';
  h += '<div id="pdfStatus" style="margin-top:12px"></div>';
  h += '</div>';

  h += '<div class="card"><div class="ct">データ管理</div>';
  h += '<button class="btn bd bbl" onclick="resetData()">データをリセット（初期状態に戻す）</button>';
  h += '</div>';

  h += '<div class="card"><div class="ct">統計情報</div>';
  h += '<div class="rw"><div class="rn">登録科目数</div><div class="rv">'+courses.length+'</div></div>';
  h += '<div class="rw"><div class="rn">修得単位数（D除く）</div><div class="rv">'+tot+'</div></div>';
  h += '<div class="rw"><div class="rn">不可(D)科目数</div><div class="rv">'+dCount+'</div></div>';
  h += '<div class="rw"><div class="rn">累積GPA</div><div class="rv">'+gpa.toFixed(2)+'</div></div>';
  h += '<div class="rw"><div class="rn">GPA計算対象単位</div><div class="rv">'+gpaCr+'</div></div>';
  h += '</div>';

  h += '<div class="card"><div class="ct">このアプリについて</div>';
  h += '<div style="font-size:.83rem;line-height:1.7;color:var(--g600)">';
  h += '<p>東北大学 工学部 機械知能・航空工学科の卒業要件チェッカーです。全7コースに対応しています。</p>';
  h += '<p style="margin-top:8px">学生便覧（令和5年度）の履修方法に基づき修得状況を管理します。</p>';
  h += '<p style="margin-top:8px"><b>対応コース:</b> 機械システム, ファインメカニクス, ロボティクス, 航空宇宙, 機械・医工学, 量子サイエンス, エネルギー環境</p>';
  h += '<p style="margin-top:8px"><b>GPA計算:</b> AA=4, A=3, B=2, C=1, D=0（P除外）</p>';
  h += '<p style="margin-top:8px;color:var(--warn)"><b>注意:</b> 本アプリは参考ツールです。正式な卒業判定は教務課にご確認ください。</p>';
  h += '</div></div>';
  el.innerHTML = h;
  setTimeout(setupDropZone, 0);
}

function setupDropZone() {
  var dz = document.getElementById('dropZone');
  if (!dz) return;
  dz.addEventListener('dragover', function(e){ e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', function(){ dz.classList.remove('over'); });
  dz.addEventListener('drop', function(e){
    e.preventDefault(); dz.classList.remove('over');
    var files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') { processPDF(files[0]); }
    else { alert('PDFファイルを選択してください。'); }
  });
}
function handlePDFSelect(e) {
  var file = e.target.files[0];
  if (file) processPDF(file);
  e.target.value = '';
}

/* ====================================================================
   PDF解析エンジン
   ==================================================================== */
function processPDF(file) {
  var statusEl = document.getElementById('pdfStatus');
  if (!statusEl) return;
  statusEl.innerHTML = '<div style="text-align:center;padding:16px"><span class="spin"></span> <span style="margin-left:8px;font-size:.85rem">PDFを解析中...</span></div>';
  var reader = new FileReader();
  reader.onload = function(ev) {
    var data = new Uint8Array(ev.target.result);
    if (typeof pdfjsLib === 'undefined') {
      statusEl.innerHTML = '<div class="sr sr-ng">PDF.jsライブラリの読み込みに失敗しました。インターネット接続を確認してください。</div>';
      return;
    }
    pdfjsLib.getDocument({data: data}).promise.then(function(pdf) {
      extractAllText(pdf).then(function(pageTexts) {
        var parsed = parseTranscript(pageTexts);
        if (parsed.length === 0) {
          statusEl.innerHTML = '<div class="sr sr-ng">科目データを検出できませんでした。東北大学の成績証明書PDFを使用してください。</div>';
        } else {
          showPDFPreview(parsed);
        }
      });
    }).catch(function(err) {
      statusEl.innerHTML = '<div class="sr sr-ng">PDF読み込みエラー: ' + err.message + '</div>';
    });
  };
  reader.readAsArrayBuffer(file);
}

function extractAllText(pdf) {
  var promises = [];
  for (var i = 1; i <= pdf.numPages; i++) {
    (function(pageNum){
      promises.push(
        pdf.getPage(pageNum).then(function(page) {
          return page.getTextContent().then(function(tc) {
            var items = tc.items.filter(function(it){ return it.str.trim().length > 0; });
            var lines = [], lineMap = {};
            items.forEach(function(it) {
              var y = Math.round(it.transform[5]);
              if (!lineMap[y]) { lineMap[y] = []; lines.push(y); }
              lineMap[y].push({x: it.transform[4], text: it.str});
            });
            lines.sort(function(a,b){return b-a;});
            var result = [];
            lines.forEach(function(y) {
              var sitems = lineMap[y].sort(function(a,b){return a.x-b.x;});
              result.push(sitems.map(function(it){return it.text;}).join(' '));
            });
            return {pageNum: pageNum, lines: result};
          });
        })
      );
    })(i);
  }
  return Promise.all(promises).then(function(results) {
    results.sort(function(a,b){return a.pageNum-b.pageNum;});
    return results;
  });
}

function parseTranscript(pageTexts) {
  var results = [];
  var currentSection = '';
  var gradeRe = /^(ＡＡ|Ａ|Ｂ|Ｃ|Ｄ|Ｐ)$/;
  var gradeConv = {'ＡＡ':'AA','Ａ':'A','Ｂ':'B','Ｃ':'C','Ｄ':'D','Ｐ':'P'};
  var sectionHeaders = [
    '全学教育科目','全学教育基盤科目','全学教育先進科目','全学教育言語科目','全学教育学術基礎科目',
    '学問論','人文科学','社会科学','融合型理科実験','保健体育',
    '情報教育','国際教育','キャリア教育','カレント・トピックス科目','先端学術科目','フロンティア科目',
    '英語','中国語','ドイツ語','フランス語','ロシア語','スペイン語','朝鮮語',
    '基礎数学','基礎物理学','基礎化学','基礎生物学','基礎宇宙地球科学','基礎人文科学','基礎社会科学',
    '専門教育科目','機械知能・航空工学科科目','工学部共通科目',
  ];

  pageTexts.forEach(function(pt) {
    var isStatusPage = pt.lines.some(function(l){ return l.indexOf('単位修得状況表') >= 0; });
    if (isStatusPage) return;
    pt.lines.forEach(function(line) {
      var trimmed = line.replace(/\s+/g, ' ').trim();
      if (!trimmed || trimmed.indexOf('成績一覧表') >= 0 || trimmed.indexOf('科目 単位数') >= 0
          || trimmed.indexOf('(注)') >= 0 || trimmed.match(/^\d+\/\s*\d+/) || trimmed.indexOf('GPA') >= 0
          || trimmed.match(/^C\d+TB/) || trimmed.match(/^\d+年\s/) || trimmed.indexOf('対象') >= 0) return;
      var isSection = false;
      for (var si = 0; si < sectionHeaders.length; si++) {
        if (trimmed === sectionHeaders[si] || trimmed.replace(/\s/g,'') === sectionHeaders[si].replace(/\s/g,'')) {
          currentSection = sectionHeaders[si]; isSection = true; break;
        }
      }
      if (!isSection && trimmed.match(/^保健体育/)) { currentSection = '保健体育'; isSection = true; }
      if (!isSection && trimmed.match(/^カレント/)) { currentSection = 'カレント・トピックス科目'; isSection = true; }
      if (isSection) return;
      var tokens = trimmed.split(/\s+/);
      var courseName = '', credit = 0, grade = '', year = 0, sem = '', foundGrade = false;
      var nameTokens = [];
      for (var ti = 0; ti < tokens.length; ti++) {
        var tok = tokens[ti];
        if (!foundGrade && gradeRe.test(tok)) {
          foundGrade = true; grade = gradeConv[tok] || tok;
          if (nameTokens.length > 0) {
            var last = nameTokens[nameTokens.length - 1];
            if (last.match(/^\d+\.?\d*$/)) { credit = parseFloat(last); nameTokens.pop(); }
          }
          continue;
        }
        if (foundGrade) {
          if (tok === '○') continue;
          if (tok.match(/^\d{4}$/)) { year = parseInt(tok); continue; }
          if (tok === '前期' || tok === '後期') { sem = tok; break; }
          continue;
        }
        nameTokens.push(tok);
      }
      if (!foundGrade || !year || !sem) return;
      courseName = nameTokens.join(' ').replace(/※/g, '').trim();
      if (!courseName) return;
      var cat = autoCategorize(courseName, currentSection);
      var origCr = credit || (grade === 'D' ? 2 : 0);
      if (grade === 'D' && credit === 0) {
        var def = DEFAULT_COURSES.find(function(d){ return normName(d.name) === normName(courseName); });
        origCr = def ? def.origCr : 2;
      }
      var earnedCr = grade === 'D' ? 0 : credit;
      results.push({ name: courseName, cr: earnedCr, origCr: origCr || credit, grade: grade, cat: cat, year: year, sem: sem });
    });
  });
  return results;
}

function autoCategorize(name, section) {
  var nk = normName(name);
  if (COURSE_CAT[nk]) return COURSE_CAT[nk];
  if (name.match(/基礎.+語Ⅰ/) || name.match(/基礎.+語I$/)) return 'z_ga';
  if (name.match(/基礎.+語Ⅱ/) || name.match(/基礎.+語II$/)) return 'z_gb';
  if (name.match(/^英語/) || name.match(/^English/i)) return 'z_eigo';
  if (section === '英語') return 'z_eigo';
  if (section === '中国語' || section === 'ドイツ語' || section === 'フランス語' ||
      section === 'ロシア語' || section === 'スペイン語' || section === '朝鮮語') {
    if (name.match(/Ⅰ|I$/)) return 'z_ga';
    if (name.match(/Ⅱ|II$/)) return 'z_gb';
    return 'z_ga';
  }
  if (section === '工学部共通科目') return 's_other';
  if (section === '機械知能・航空工学科科目') return 's_other';
  for (var sk in SECTION_CAT) { if (section.indexOf(sk) >= 0) return SECTION_CAT[sk]; }
  if (name.match(/スポーツ|体育/)) return 'z_s1';
  if (name.match(/学問論演習/)) return 'z_s1';
  if (section.indexOf('全学') >= 0 || section.indexOf('基礎') >= 0) return 'z_s2';
  if (section.indexOf('専門') >= 0 || section.indexOf('機械') >= 0 || section.indexOf('工学') >= 0) return 's_other';
  return 'z_s2';
}

/* ====================================================================
   PDFプレビュー表示・確認
   ==================================================================== */
function showPDFPreview(parsed) {
  var h = '<h3 style="font-size:1rem;margin-bottom:6px">PDF読み取り結果</h3>';
  h += '<p style="font-size:.82rem;color:var(--g500);margin-bottom:14px">' + parsed.length + '科目を検出しました。カテゴリを確認・修正してから取り込んでください。</p>';
  h += '<div class="preview-table"><table><thead><tr><th>科目名</th><th>単位</th><th>評価</th><th>年度</th><th>カテゴリ</th></tr></thead><tbody>';
  parsed.forEach(function(c, i) {
    var gc = c.grade==='AA'?'gaa':c.grade==='A'?'ga':c.grade==='B'?'gb':c.grade==='C'?'gc':'gd';
    h += '<tr><td style="font-weight:500;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+c.name+'">'+c.name+'</td>';
    h += '<td>'+c.cr+'</td><td class="'+gc+'">'+c.grade+'</td>';
    h += '<td style="font-size:.75rem">'+c.year+' '+c.sem+'</td>';
    h += '<td><select class="cat-sel" id="pcat_'+i+'">';
    CATS.forEach(function(cat){ h += '<option value="'+cat.id+'"'+(cat.id===c.cat?' selected':'')+'>'+cat.name+'</option>'; });
    h += '</select></td></tr>';
  });
  h += '</tbody></table></div>';
  var earnedTotal = parsed.reduce(function(s,c){return s+c.cr;}, 0);
  h += '<div style="margin-top:14px;padding:10px;background:var(--pri-bg);border-radius:8px;font-size:.83rem">';
  h += '<b>合計: '+earnedTotal+'単位</b>（'+parsed.length+'科目, D不可'+parsed.filter(function(c){return c.grade==='D';}).length+'科目含む）';
  h += '</div>';
  h += '<div style="display:flex;gap:8px;margin-top:16px">';
  h += '<button class="btn bp" style="flex:1" onclick="confirmPDFImport()">この内容で取り込む（既存データを置換）</button>';
  h += '<button class="btn bo" onclick="closeModal()">キャンセル</button>';
  h += '</div>';
  window._pdfParsed = parsed;
  document.getElementById('mdBody').innerHTML = h;
  document.getElementById('modal').classList.add('show');
}

function confirmPDFImport() {
  var parsed = window._pdfParsed;
  if (!parsed || !parsed.length) return;
  parsed.forEach(function(c, i) {
    var sel = document.getElementById('pcat_' + i);
    if (sel) c.cat = sel.value;
  });
  courses = parsed.map(function(c, i) {
    return {id: i+1, name: c.name, cr: c.cr, origCr: c.origCr, grade: c.grade, cat: c.cat, year: c.year, sem: c.sem};
  });
  save(); closeModal(); window._pdfParsed = null; renderAll();
  var statusEl = document.getElementById('pdfStatus');
  if (statusEl) {
    statusEl.innerHTML = '<div class="sr sr-ok"><span style="font-weight:700">✓</span><span>'+courses.length+'科目を取り込みました（合計'+totalEarned()+'単位）</span></div>';
  }
}

function resetData() {
  if (!confirm('全てのデータを初期状態に戻しますか？')) return;
  localStorage.removeItem('tohoku_credits_v4');
  load(); renderAll();
}

/* ====================================================================
   モーダル: 追加 / 編集
   ==================================================================== */
function openAdd() { showCourseModal('科目を追加', null); }
function editCourse(id) { var c=courses.find(function(x){return x.id===id;}); if(c) showCourseModal('科目を編集',c); }
function showCourseModal(title, c) {
  var isEdit = !!c;
  var h = '<h3 style="font-size:1rem;margin-bottom:16px">'+title+'</h3>';
  h += '<div class="fg"><label>科目名</label><input id="m_name" value="'+(c?c.name:'')+'"></div>';
  h += '<div class="fr"><div><label>単位数</label><input id="m_cr" type="number" min="0" step="1" value="'+(c?c.cr:'2')+'"></div>';
  h += '<div><label>評価</label><select id="m_grade">';
  ['AA','A','B','C','D','P'].forEach(function(g){ h+='<option'+(c&&c.grade===g?' selected':'')+'>'+g+'</option>'; });
  h += '</select></div></div>';
  h += '<div class="fg"><label>カテゴリ</label><select id="m_cat">';
  CATS.forEach(function(cat){ h+='<option value="'+cat.id+'"'+(c&&c.cat===cat.id?' selected':'')+'>'+cat.name+'</option>'; });
  h += '</select></div>';
  h += '<div class="fr"><div><label>年度</label><input id="m_year" type="number" value="'+(c?c.year:'2025')+'"></div>';
  h += '<div><label>学期</label><select id="m_sem">';
  ['前期','後期'].forEach(function(s){ h+='<option'+(c&&c.sem===s?' selected':'')+'>'+s+'</option>'; });
  h += '</select></div></div>';
  h += '<div style="display:flex;gap:8px;margin-top:16px">';
  h += '<button class="btn bp" style="flex:1" onclick="saveCourse('+(isEdit?c.id:'null')+')">'+(isEdit?'更新':'追加')+'</button>';
  h += '<button class="btn bo" onclick="closeModal()">キャンセル</button></div>';
  document.getElementById('mdBody').innerHTML = h;
  document.getElementById('modal').classList.add('show');
}
function saveCourse(id) {
  var name=document.getElementById('m_name').value.trim();
  if(!name){alert('科目名を入力してください');return;}
  var crVal=parseInt(document.getElementById('m_cr').value)||0;
  var grade=document.getElementById('m_grade').value;
  var cat=document.getElementById('m_cat').value;
  var year=parseInt(document.getElementById('m_year').value)||2025;
  var sem=document.getElementById('m_sem').value;
  var cr=grade==='D'?0:crVal, origCr=crVal;
  if(id){var c=courses.find(function(x){return x.id===id;});if(c)Object.assign(c,{name:name,cr:cr,origCr:origCr,grade:grade,cat:cat,year:year,sem:sem});}
  else{courses.push({id:nextId(),name:name,cr:cr,origCr:origCr,grade:grade,cat:cat,year:year,sem:sem});}
  save();closeModal();renderAll();
}
function delCourse(id){if(!confirm('この科目を削除しますか？'))return;courses=courses.filter(function(c){return c.id!==id;});save();renderAll();}
function closeModal(){document.getElementById('modal').classList.remove('show');}

/* ====================================================================
   タブ切り替え / 初期化
   ==================================================================== */
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('.nav button').forEach(function(b){b.classList.remove('active');});
  document.getElementById(name).classList.add('active');
  document.getElementById('t_'+name).classList.add('active');
  renderAll();
}
function renderAll() {
  var active = document.querySelector('.tab.active');
  if (!active) return;
  var id = active.id;
  if (id==='dash') renderDash();
  else if (id==='list') renderList();
  else if (id==='req') renderReq();
  else if (id==='set') renderSet();
}

/* 初期化 */
load();
updateHeader();
renderAll();
