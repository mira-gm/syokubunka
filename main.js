// ===============================
// パート2：ゲームロジック（CSV読み込み＋2画面UI）
// ===============================

// ---- 時代一覧 ----
const eras = [
  "縄文","弥生","古墳・奈良","平安・鎌倉",
  "室町・安土桃山","江戸","明治・大正","昭和・平成"
];

let currentEraIndex = 0;
let viewEra = null;
let zukanTab = "素材";

// 所持データ
const owned = {
  素材: new Set(),
  技術: new Set(),
  道具: new Set()
};

// 完成した料理
const completed = new Set();

// CSVデータ
let dataList = [];
let recipes = [];

// ===============================
// CSV 読み込み
// ===============================
async function loadCSV() {
  const sozaiText = await fetch("./data/sozai.csv").then(r => r.text());
  const ryouriText = await fetch("./data/ryouri.csv").then(r => r.text());

  dataList = parseCSV(sozaiText);
  recipes = parseCSV(ryouriText);

  renderHome();
  buildEraTabs();
  renderZukan();
}

// ===============================
// CSV パーサー
// ===============================
function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");

  return lines.slice(1).map(line => {
    const cols = line.split(",");
    const obj = {};
    header.forEach((h,i)=> obj[h] = cols[i] ?? "");
    return obj;
  });
}

// ===============================
// ログ
// ===============================
function log(msg){
  const el = document.getElementById("log");
  el.innerHTML = msg + "<br>" + el.innerHTML;
}

// ===============================
// 料理作成可能判定
// ===============================
function canCookAnyRecipe(){
  const era = eras[currentEraIndex];

  return recipes
    .filter(r => r.時代 === era && !completed.has(r.料理))
    .some(r => {
      const needM = r.必要素材 ? r.必要素材.split("・") : [];
      const needT = r.必要技術 ? r.必要技術.split("・") : [];
      const needD = r.必要道具 ? r.必要道具.split("・") : [];

      const okM = needM.length === 0 || needM.every(x => owned.素材.has(x));
      const okT = needT.length === 0 || needT.every(x => owned.技術.has(x));
      const okD = needD.length === 0 || needD.every(x => owned.道具.has(x));

      return okM && okT && okD;
    });
}

// ===============================
// ホーム画面
// ===============================
function renderHome(){
  const eraName = eras[currentEraIndex];
  document.getElementById("era").textContent = "時代：" + eraName;

  const imageMap = {
    "縄文": "./data/01jomon.png",
    "弥生": "./data/02yayoi.png",
    "古墳・奈良": "./data/03kofunnara.png",
    "平安・鎌倉": "./data/04heiankamakura.png",
    "室町・安土桃山": "./data/05muromachiadutimomoyama.png",
    "江戸": "./data/06edo.png",
    "明治・大正": "./data/07meijitaisyo.png",
    "昭和・平成": "./data/08syowaheisei.png"
  };
  document.getElementById("era-image").src = imageMap[eraName];

  const cookBtn = document.getElementById("btn-cook");
  cookBtn.disabled = !canCookAnyRecipe();
}

// ===============================
// 図鑑：時代タブ
// ===============================
function buildEraTabs(){
  const tabs = document.getElementById("era-tabs");
  tabs.innerHTML = "";

  eras.forEach((e,i)=>{
    const div = document.createElement("div");
    div.textContent = e;

    const active = viewEra ? (viewEra === e) : (currentEraIndex === i);
    div.className = "era-tab" + (active ? " active" : "");

    div.onclick = () => {
      viewEra = (e === eras[currentEraIndex]) ? null : e;
      buildEraTabs();
      renderZukan();
    };

    tabs.appendChild(div);
  });
}

// ===============================
// 図鑑：一覧
// ===============================
function renderZukan(){
  const eraName = viewEra || eras[currentEraIndex];
  const box = document.getElementById("zukan-info-box");
  box.innerHTML = "";

  if (zukanTab === "料理") {
    const eraRecipes = recipes.filter(r => r.時代 === eraName);
    eraRecipes.forEach(r => {
      const opened = completed.has(r.料理);
      const div = document.createElement("div");
      div.textContent = opened ? r.料理 : "？？？";
      box.appendChild(div);
    });
    return;
  }

  const eraItems = dataList.filter(d => d.分類 === zukanTab && d.時代 === eraName);
  const ownedSet = owned[zukanTab];

  eraItems.forEach(d => {
    const opened = ownedSet.has(d.名前);
    const div = document.createElement("div");
    div.textContent = opened ? d.名前 : "？？？";
    box.appendChild(div);
  });
}

// ===============================
// 図鑑：分類タブ
// ===============================
document.querySelectorAll("#zukan-screen .info-tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll("#zukan-screen .info-tab")
      .forEach(t => t.classList.remove("active"));

    tab.classList.add("active");
    zukanTab = tab.dataset.type;
    renderZukan();
  };
});

// ===============================
// 行動ボタン
// ===============================
document.getElementById("btn-material").onclick = () => {
  const era = eras[currentEraIndex];
  const candidates = dataList.filter(d =>
    d.分類 === "素材" &&
    d.時代 === era &&
    !owned.素材.has(d.名前)
  );

  if (candidates.length === 0) {
    log("この時代の素材はすべて発見済み。");
    return;
  }

  const item = candidates[Math.floor(Math.random() * candidates.length)];
  owned.素材.add(item.名前);

  log(`素材発見：<span class="item-name">${item.名前}</span><br>${item.メッセージ}`);
  renderHome();
  renderZukan();
};

document.getElementById("btn-tech").onclick = () => {
  const era = eras[currentEraIndex];
  const candidates = dataList.filter(d =>
    d.分類 === "技術" &&
    d.時代 === era &&
    !owned.技術.has(d.名前)
  );

  if (candidates.length === 0) {
    log("この時代の技術はすべて習得済み。");
    return;
  }

  const item = candidates[Math.floor(Math.random() * candidates.length)];
  owned.技術.add(item.名前);

  log(`技術習得：<span class="item-name">${item.名前}</span><br>${item.メッセージ}`);
  renderHome();
  renderZukan();
};

document.getElementById("btn-tool").onclick = () => {
  const era = eras[currentEraIndex];
  const candidates = dataList.filter(d =>
    d.分類 === "道具" &&
    d.時代 === era &&
    !owned.道具.has(d.名前)
  );

  if (candidates.length === 0) {
    log("この時代の道具はすべて開発済み。");
    return;
  }

  const item = candidates[Math.floor(Math.random() * candidates.length)];
  owned.道具.add(item.名前);

  log(`道具開発：<span class="item-name">${item.名前}</span><br>${item.メッセージ}`);
  renderHome();
  renderZukan();
};

// ===============================
// 料理作成
// ===============================
document.getElementById("btn-cook").onclick = () => {
  const era = eras[currentEraIndex];

  const available = recipes.filter(r => {
    const needM = r.必要素材 ? r.必要素材.split("・") : [];
    const needT = r.必要技術 ? r.必要技術.split("・") : [];
    const needD = r.必要道具 ? r.必要道具.split("・") : [];

    const okM = needM.length === 0 || needM.every(x => owned.素材.has(x));
    const okT = needT.length === 0 || needT.every(x => owned.技術.has(x));
    const okD = needD.length === 0 || needD.every(x => owned.道具.has(x));

    return (
      r.時代 === era &&
      !completed.has(r.料理) &&
      okM && okT && okD
    );
  });

  if (available.length === 0) return;

  available.forEach(r => {
    completed.add(r.料理);

    log(`<span class="recipe-msg">料理完成：<span class="recipe-name">${r.料理}</span><br> → ${r.メッセージ}</span>`);
  });

  renderHome();
  renderZukan();
};

// ===============================
// ★ 次の時代へ
// ===============================
document.getElementById("btn-next-era").onclick = () => {
  if (currentEraIndex < eras.length - 1) {
    currentEraIndex++;
    viewEra = null;
    log(`<span class="era-msg">時代が進みました：${eras[currentEraIndex]}</span>`);
    renderHome();
    buildEraTabs();
    renderZukan();
  } else {
    log("これ以上進む時代はありません。");
  }
};

// ===============================
// 画面切り替え
// ===============================
document.getElementById("btn-go-zukan").onclick = () => {
  document.getElementById("home-screen").classList.add("hidden");
  document.getElementById("zukan-screen").classList.remove("hidden");
  buildEraTabs();
  renderZukan();
};

document.getElementById("btn-go-home").onclick = () => {
  document.getElementById("zukan-screen").classList.add("hidden");
  document.getElementById("home-screen").classList.remove("hidden");
  renderHome();
};

// ===============================
// 初期化
// ===============================
loadCSV();