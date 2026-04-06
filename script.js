// ============================================================
//  MIT アイデア提案フォーム v2 — script.js
//  アンケート・送信・トラッキングはオリジナルから変更なし
// ============================================================

const GAS_MAIL_URL = 'https://script.google.com/macros/s/AKfycbwFnGzrkXw2EEkfhnmYzZBSmIEhVsCr6oTQMGIqdaWKTfZWUDo1fClPMvqx_RHMukLoLA/exec';
let startTime = null;

const NAME_NG_WORDS = ['匿名', '無記名', 'anonymous', 'anon', '名無し', 'なし', 'ない', 'none', 'no name'];

// ============================================================
//  UI ヘルパー
// ============================================================
const FORM_UI_IDS = ['picoRoadmap', 'progressWrap', 'navigator', 'ideaForm'];

function hideFormUI() {
  FORM_UI_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}
function showFormUI() {
  FORM_UI_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });
}

// ============================================================
//  ステップ管理
// ============================================================
let currentStep = 0;
const TOTAL_STEPS = 5;

const NAV_MESSAGES = [
  'まず<strong>あなたの情報</strong>を入力してください。検討結果をお知らせする際に使用します。',
  '<strong>誰が、どのような場面で困っているか</strong>を教えてください。日常の業務で感じていることをそのままで構いません。',
  '<strong>現在どのように対応しているか</strong>を教えてください。「とりあえずこうしている」という工夫も大切な情報です。',
  '<strong>あなたのアイデア</strong>を教えてください。思いついたことをそのままで構いません。完成していなくても歓迎です。',
  'もう少しで完了です。<strong>このアイデアで何が変わりそうか</strong>を教えてください。'
];

function showStep(step) {
  document.querySelectorAll('.step-section').forEach((s, i) => {
    s.classList.toggle('active', i === step);
  });

  // ロードマップ更新
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const rm = document.getElementById(`rm${i}`);
    if (!rm) continue;
    rm.className = 'roadmap-step';
    if (i < step)       rm.classList.add('done');
    if (i === step)     rm.classList.add('active');
    if (i < TOTAL_STEPS - 1) {
      const line = document.getElementById(`rml${i}`);
      if (line) line.className = 'roadmap-line' + (i < step ? ' done' : '');
    }
  }

  const bubble = document.getElementById('navBubble');
  if (bubble) bubble.innerHTML = NAV_MESSAGES[step];

  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentStep = step;
}

// ============================================================
//  バリデーション
// ============================================================
function isNGName(val) {
  return NAME_NG_WORDS.some(w => val.toLowerCase() === w.toLowerCase());
}

const STEP_REQUIRED = [
  () => {
    const errs = [];
    if (!getVal('q1')) errs.push('・所属部署を選択してください');
    const nameVal = getVal('q2');
    if (!nameVal) {
      errs.push('・氏名を入力してください');
    } else if (isNGName(nameVal)) {
      errs.push('・匿名での受付はできません。お名前をご記入ください');
    }
    const emailVal = getVal('q2b');
    if (!emailVal) {
      errs.push('・返信先メールアドレスを入力してください');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      errs.push('・メールアドレスの形式を確認してください（例：yamada@hospital.jp）');
    }
    if (!getRadio('q3')) errs.push('・職種を選択してください');
    return errs;
  },
  () => {
    const errs = [];
    if (!getRadio('q4'))              errs.push('・困っている対象を選択してください');
    if (!getRadio('q5'))              errs.push('・発生頻度を選択してください');
    if (getChecks('q6').length === 0) errs.push('・影響の種類を1つ以上選択してください');
    return errs;
  },
  () => [],
  () => {
    const errs = [];
    if (!getVal('q10'))   errs.push('・アイデアを入力してください');
    if (!getRadio('q11')) errs.push('・アイデアのカテゴリーを選択してください');
    return errs;
  },
  () => {
    const errs = [];
    if (getChecks('q12').length === 0) errs.push('・期待できる改善を1つ以上選択してください');
    return errs;
  }
];

function goNext(step) {
  const errs = STEP_REQUIRED[step]();
  if (errs.length > 0) {
    alert('入力内容を確認してください：\n\n' + errs.join('\n'));
    return;
  }
  sendLog('step_moved', step + 2);
  showStep(step + 1);
}
function goPrev(step) { showStep(step - 1); }

// ============================================================
//  ユーティリティ
// ============================================================
function getVal(id)    { return (document.getElementById(id) || { value: '' }).value.trim(); }
function getRadio(nm)  { const el = document.querySelector(`input[name="${nm}"]:checked`); return el ? el.value : ''; }
function getChecks(nm) { return [...document.querySelectorAll(`input[name="${nm}"]:checked`)].map(e => e.value); }

function getQ3Value() {
  const v = getRadio('q3');
  if (v === 'その他') {
    const other = getVal('q3-other-text');
    return other ? `その他（${other}）` : 'その他';
  }
  return v || '';
}

function getQ4Value() {
  const v = getRadio('q4');
  if (v === 'その他') {
    const other = getVal('q4-other-text');
    return other ? `その他（${other}）` : 'その他';
  }
  return v || '';
}

function getQ6Values() {
  return getChecks('q6').map(v => {
    if (v === 'その他') {
      const other = getVal('q6-other-text');
      return other ? `その他（${other}）` : 'その他';
    }
    return v;
  });
}

function getQ9Values() {
  return getChecks('q9').map(v => {
    if (v === 'その他') {
      const other = getVal('q9-other-text');
      return other ? `その他（${other}）` : 'その他';
    }
    return v;
  });
}

function getQ12Values() {
  return getChecks('q12').map(v => {
    if (v === 'その他') {
      const other = getVal('q12-other-text');
      return other ? `その他（${other}）` : 'その他';
    }
    return v;
  });
}
function getIdeaTypes() { return getChecks('q10_type'); }

// ===== フィードバック表示 =====
function showFeedback(id, msg, type) {
  const el = document.getElementById(`fb-${id}`);
  if (!el) return;
  el.textContent = msg;
  el.className = `field-fb fb-${type} show`;
}
function hideFeedback(id) {
  const el = document.getElementById(`fb-${id}`);
  if (el) { el.className = 'field-fb'; el.textContent = ''; }
}

// ===== ラジオ/チェック ハイライト =====
function highlightSelected(groupId) {
  document.querySelectorAll(`#${groupId} label`).forEach(lbl => {
    lbl.classList.toggle('selected', lbl.querySelector('input').checked);
  });
}
function highlightChecked(groupId) {
  document.querySelectorAll(`#${groupId} label`).forEach(lbl => {
    lbl.classList.toggle('selected', lbl.querySelector('input').checked);
  });
}

// ===== その他入力欄の開閉（チェックボックス用） =====
function toggleOtherInput(checkId, wrapId) {
  const checked = document.getElementById(checkId).checked;
  const wrap = document.getElementById(wrapId);
  wrap.classList.toggle('show', checked);
  if (!checked) {
    const ta = wrap.querySelector('textarea');
    if (ta) ta.value = '';
  }
}

// ===== その他入力欄の開閉（ラジオボタン用）
// onchangeに常時呼び出し、「その他」ラジオの現在値で開閉を判断 =====
function toggleOtherInputRadio(radioId, wrapId) {
  const isOtherSelected = document.getElementById(radioId).checked;
  const wrap = document.getElementById(wrapId);
  wrap.classList.toggle('show', isOtherSelected);
  if (!isOtherSelected) {
    const ta = wrap.querySelector('textarea');
    if (ta) ta.value = '';
  }
}

// ============================================================
//  プログレスバー（14項目）
// ============================================================
function updateProgress() {
  if (!startTime) startTime = new Date();
  const items = [
    getVal('q1'), getVal('q2'), getVal('q2b'),
    getQ3Value(), getQ4Value(),
    getRadio('q5'), getChecks('q6').length > 0 ? '1' : '',
    getVal('q7'), getVal('q8'), getQ9Values().length > 0 ? '1' : '0',
    getVal('q10'), getRadio('q11'), getChecks('q12').length > 0 ? '1' : '', getVal('q13')
  ];
  const filled = items.filter(v => v !== '').length;
  const pct    = Math.round(filled / 14 * 100);

  const label = document.getElementById('progress-label');
  const pctEl = document.getElementById('progress-pct');
  const fill  = document.getElementById('progressFill');
  if (label) label.textContent = filled === 0 ? '入力を始めましょう' : `${filled} / 14 項目入力済み`;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (fill)  fill.style.width  = `${pct}%`;
}
document.addEventListener('change', updateProgress);
document.addEventListener('input',  updateProgress);

// ============================================================
//  フィードバック関数
// ============================================================
function onSelectChange(id) {
  const v = getVal(id);
  if (v) showFeedback(id, `✅ 「${v}」で登録します`, 'good');
  else   hideFeedback(id);
}

function onTextInput(id) {
  const v = getVal(id);
  if (!v) { hideFeedback(id); return; }
  if (isNGName(v)) {
    showFeedback(id, '⚠️ 匿名での受付はできません。フルネームでご記入ください', 'warn');
    return;
  }
  if (v.length < 2) {
    showFeedback(id, 'フルネームでご記入ください', 'warn');
    return;
  }
  showFeedback(id, `✅ ${v} さん、ありがとうございます`, 'good');
}

function onEmailInput(id) {
  const v = getVal(id);
  if (!v) { hideFeedback(id); return; }
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  if (isEmail) showFeedback(id, `✅ 検討結果を「${v}」へお送りします`, 'good');
  else         showFeedback(id, '⚠️ メールアドレスの形式を確認してください（例：yamada@hospital.jp）', 'warn');
}

function onRadioChange(groupId) {
  highlightSelected(groupId);
  updateProgress();
  const v = getRadio(groupId);
  if (v) showFeedback(groupId, `✅ 「${v}」を選択しました`, 'good');
}

function onCheckChange(groupId) {
  highlightChecked(groupId);
  updateProgress();
  const vals = getChecks(groupId);
  if (vals.length > 0) showFeedback(groupId, `✅ ${vals.length}項目選択中`, 'good');
  else hideFeedback(groupId);
}

function onTextareaInput(id) {
  updateProgress();
  const v = getVal(id);
  if (v.length >= 10) showFeedback(id, '✅ 具体的な情報が伝わりやすくなります', 'tip');
  else hideFeedback(id);
}

function onIdeaInput() {
  updateProgress();
  const v = getVal('q10');
  const count = document.getElementById('ideaCharCount');
  if (count) count.textContent = `${v.length}文字`;
  if (v.length >= 20) {
    showFeedback('q10', '✅ しっかりと伝わります。このまま続けてください。', 'tip');
  } else if (v.length >= 5) {
    showFeedback('q10', 'もう少し具体的に書いてもらえると、実現に向けやすくなります', 'warn');
  } else {
    hideFeedback('q10');
  }
}

// ============================================================
//  テキスト生成（メール本文用）- 変更なし
// ============================================================
function buildText() {
  const q6v  = getQ6Values();
  const q9v  = getQ9Values();
  const q12v = getQ12Values();
  const ideaTypes = getIdeaTypes();
  const endTime = new Date();
  const diffMs  = startTime ? endTime - startTime : 0;
  const mins    = Math.floor(diffMs / 60000);
  const secs    = Math.floor((diffMs % 60000) / 1000);
  const elapsed = startTime ? `${mins}分${secs}秒` : '不明';

  const lines = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '　医療をよくするアイデア提案フォーム　',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '【研究参加同意】',
    `私、${getVal('q2') || '（氏名未記入）'}は、本研究の目的を理解し、参加に同意します。`,
    '',
    '【基本情報】',
    `所属部署　　　：${getVal('q1') || '（未選択）'}`,
    `氏　　名　　　：${getVal('q2') || '（未記入）'}`,
    `メールアドレス：${getVal('q2b') || '（未記入）'}`,
    `職　　種　　　：${getQ3Value() || '（未選択）'}`,
    '',
    '【回答者プロフィール（アンケート）】',
    `年　　齢　　　：${getVal('sq0_age') || '（未選択）'}`,
    `経験年数　　　：${getVal('sq0_experience') || '（未選択）'}`,
    `IT使用経験　　：${getItExperienceChecks().join(' / ') || '（未選択）'}`,
    `ITレベル評価　：${getItLevelLabel() || '（未評価）'}`,
    '',
    '【P：現場の困りごと・背景】',
    `困っている対象：${getQ4Value() || '（未選択）'}`,
    `発生頻度　　　：${getRadio('q5') || '（未選択）'}`,
    `困りごと・影響：${q6v.join(' / ') || '（未選択）'}`,
    `具体的な場面　：${getVal('q7') || '（未記入）'}`,
    '',
    '【C：今の対応とその限界】',
    `現在の対応　　　　：${getVal('q8') || '（未記入）'}`,
    `うまくいっていない点：${q9v.length ? q9v.join(' / ') : '特になし'}`,
    '',
    '【I：アイデア・ひらめき】',
    `アイデア内容　：${getVal('q10') || '（未記入）'}`,
    `アイデアの形　：${ideaTypes.length ? ideaTypes.join(' / ') : '（未選択）'}`,
    `具体イメージ　：${getVal('q10_detail') || '（未記入）'}`,
    `参考にしたもの：${getVal('q10_ref') || '（未記入）'}`,
    `懸念・課題　　：${getVal('q10_concern') || '（未記入）'}`,
    `カテゴリー　　：${getRadio('q11') || '（未選択）'}`,
    '',
    '【O：期待できる効果】',
    `期待される改善：${q12v.join(' / ') || '（未選択）'}`,
    `改善の規模感　：${getVal('q13') || '（未記入）'}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `送信日時　　　　：${endTime.toLocaleString('ja-JP')}`,
    `レポート作成時間：${elapsed}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ];

    lines.splice(lines.length - 1, 0,
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '　アンケート回答　',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `SQ1．整理・具体化への貢献：${getSurveyRadio('sq1')}`,
      `SQ2．役立った部分　　　　：${getSurveyChecks('sq2')}`,
      `SQ3．入力の手間　　　　　：${getSurveyRadio('sq3')}`,
      `SQ4．意欲（動機）　　　　：${getSurveyRadio('sq4')}`,
      `SQ5．自己効力感　　　　　：${getSurveyRadio('sq5_scale')}`,
      `SQ5．改善点（自由記述）　：${getVal('sq5') || '（記入なし）'}`,
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '　SUS（システムユーザビリティスケール）　',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `SUS1．頻繁に使いたい　　　　：${getSurveyRadio('sus1')}`,
      `SUS2．不必要に複雑　　　　　：${getSurveyRadio('sus2')}`,
      `SUS3．使いやすい　　　　　　：${getSurveyRadio('sus3')}`,
      `SUS4．サポートが必要　　　　：${getSurveyRadio('sus4')}`,
      `SUS5．機能がまとまっている　：${getSurveyRadio('sus5')}`,
      `SUS6．一貫性がない　　　　　：${getSurveyRadio('sus6')}`,
      `SUS7．すぐ使いこなせる　　　：${getSurveyRadio('sus7')}`,
      `SUS8．使いにくい　　　　　　：${getSurveyRadio('sus8')}`,
      `SUS9．自信を持てる　　　　　：${getSurveyRadio('sus9')}`,
      `SUS10．覚えることが多かった：${getSurveyRadio('sus10')}`,
      '',
      `【SUSスコア合計】${getSusLabel(calculateSusScore())}`,
      ''
    );
  return lines.join('\n');
}

// ============================================================
//  プレビュー用テキスト生成（プロフィールブロックを除外）
// ============================================================
function buildPreviewText() {
  // buildText() からプロフィールブロック（見出し行＋4項目＋空行）を除去
  return buildText().replace(
    /\n【回答者プロフィール（アンケート）】\n[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n/,
    '\n'
  );
}

// ============================================================
//  CSV生成 - 変更なし
// ============================================================
function escapeCSV(v) {
  if (v == null) v = '';
  v = String(v);
  if (v.includes('"') || v.includes(',') || v.includes('\n') || v.includes('\r')) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

function buildCsvText() {
  const now = new Date();
  const submissionId = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 15);
  const submittedAt  = now.toLocaleString('ja-JP');
  const q6v  = getQ6Values();
  const q9v  = getQ9Values();
  const q12v = getQ12Values();
  const ideaTypes = getIdeaTypes();
  const diffMs = startTime ? now - startTime : 0;
  const mins   = Math.floor(diffMs / 60000);
  const secs   = Math.floor((diffMs % 60000) / 1000);
  const elapsed = startTime ? `${mins}分${secs}秒` : '不明';

  const rows = [['submissionid','submittedat','fieldname','value'].join(',')];
  function addRow(fieldName, value) {
    rows.push([escapeCSV(submissionId), escapeCSV(submittedAt), escapeCSV(fieldName), escapeCSV(value)].join(','));
  }
  addRow('q1_department',       getVal('q1'));
  addRow('q2_name',             getVal('q2'));
  addRow('q2b_email',           getVal('q2b'));
  addRow('q3_occupation',       getQ3Value());
  addRow('q4_who_suffers',      getQ4Value());
  addRow('q5_frequency',        getRadio('q5'));
  if (q6v.length > 0) { q6v.forEach((v, idx) => addRow(`q6_problem_${idx+1}`, v)); }
  else addRow('q6_problem_1', '');
  addRow('q7_scene',            getVal('q7'));
  addRow('q8_current_workaround', getVal('q8'));
  if (q9v.length > 0) { q9v.forEach((v, idx) => addRow(`q9_limitation_${idx+1}`, v)); }
  else addRow('q9_limitation_1', '');
  addRow('q10_idea',            getVal('q10'));
  if (ideaTypes.length > 0) { ideaTypes.forEach((v, idx) => addRow(`q10_type_${idx+1}`, v)); }
  else addRow('q10_type_1', '');
  addRow('q10_detail',          getVal('q10_detail'));
  addRow('q10_ref',             getVal('q10_ref'));
  addRow('q10_concern',         getVal('q10_concern'));
  addRow('q11_category',        getRadio('q11'));
  if (q12v.length > 0) { q12v.forEach((v, idx) => addRow(`q12_outcome_${idx+1}`, v)); }
  else addRow('q12_outcome_1', '');
  addRow('q13_expected_improvement', getVal('q13'));
  addRow('sq0_age',             getVal('sq0_age'));
  addRow('sq0_experience',      getVal('sq0_experience'));
  addRow('sq0_it_items',        getItExperienceChecks().join(' / '));
  addRow('sq0_it_level',        getItLevelLabel() || '（未評価）');
  addRow('report_creation_time', elapsed);
  addRow('sq1_structuring',     getSurveyRadio('sq1')); // SQ1: 整理・具体化への貢献
  addRow('sq2_helpful',         getSurveyChecks('sq2'));
  addRow('sq3_effort',          getSurveyRadio('sq3'));
  addRow('sq4_motivation',      getSurveyRadio('sq4'));
  addRow('sq5_self_efficacy',   getSurveyRadio('sq5_scale'));
  addRow('sq5_improvement',     getVal('sq5'));
  for (let i = 1; i <= 10; i++) addRow(`sus${i}`, getSurveyRadio(`sus${i}`));
  const susScore = calculateSusScore();
  addRow('sus_score', susScore !== null ? susScore : '（未回答）');
  return rows.join('\n');
}

// ============================================================
//  メール送信 - 変更なし
// ============================================================
function sendMail() {
  const humanText = buildText();
  const csvText   = buildCsvText();
  const q11val    = getRadio('q11');
  const subject   = `${getVal('q2')}【${getVal('q1')}】のアイデア提案`;

  const payload = {
    type:    'sendmail',
    q11:     q11val,
    subject: subject,
    body:    humanText,
    csv:     csvText
  };

  return fetch(GAS_MAIL_URL, {
    method: 'POST',
    body:   JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(res => {
    const to = res.to || '';
    const fullBody = humanText + '\n\n--- CSV ---\n' + csvText;
    const mailtoUrl =
      'mailto:' + encodeURIComponent(to) +
      '?subject=' + encodeURIComponent(subject) +
      '&body='    + encodeURIComponent(fullBody);
    window.location.href = mailtoUrl;
    formCompleted = true;
  })
  .catch(err => {
    console.error('Mail resolve error:', err);
    alert('メール宛先の取得に失敗しました。時間をおいてもう一度お試しください。');
  });
}

function submitAll() {
  const missing = [];
  if (!getVal('sq0_age'))        missing.push('・SQ0-a（年齢）');
  if (!getVal('sq0_experience')) missing.push('・SQ0-b（経験年数）');

  ['sq1','sq2','sq3','sq4','sq5_scale'].forEach(name => {
    if (!document.querySelector(`input[name="${name}"]:checked`)) {
      missing.push(`・${name === 'sq5_scale' ? 'SQ5（自己効力感）' : name.toUpperCase()}`);
    }
  });
  if (document.querySelectorAll('input[name="sq2"]:checked').length === 0) {
    missing.push('・SQ2（役立った部分）');
  }

  if (missing.length > 0) {
    alert('以下の項目を入力してください：\n\n' + missing.join('\n'));
    return;
  }
  document.getElementById('surveyModal').classList.remove('active');
  sendLog('survey_completed', 6);
  sendMail().then(() => {
    showThankModal();
    startCloseCountdown(30);
    // 送信完了後、「入力内容を確認する」ボタンを無効化（重複送信防止）
    const previewBtn = document.querySelector('.btn-preview');
    if (previewBtn) {
      previewBtn.disabled = true;
      previewBtn.classList.add('btn-grayed');
    }
  });
}

// ============================================================
//  カウントダウン - 変更なし
// ============================================================
let _closeTimer = null;  // ウィンドウクローズタイマー（新しいアイデア提案時に停止するためスコープ外に保持）

function startCloseCountdown(seconds) {
  if (_closeTimer) { clearInterval(_closeTimer); _closeTimer = null; }
  let remaining = seconds;
  const countdownEl = document.getElementById('close-countdown');
  if (countdownEl) countdownEl.textContent = remaining;
  _closeTimer = setInterval(() => {
    remaining--;
    if (countdownEl) countdownEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(_closeTimer);
      _closeTimer = null;
      window.close();
      setTimeout(() => {
        const thankModal = document.getElementById('thankModal');
        if (thankModal && thankModal.classList.contains('active')) {
          thankModal.classList.remove('active');
          closeThankModal();
          showEndScreen();
        }
      }, 300);
    }
  }, 1000);
}

// ============================================================
//  プレビュー - 変更なし
// ============================================================
function showPreview() {
  const errs = STEP_REQUIRED[4]();
  if (errs.length > 0) {
    alert('入力内容を確認してください：\n\n' + errs.join('\n'));
    return;
  }
  document.getElementById('previewText').textContent = buildPreviewText();
  const idea     = getVal('q10');
  const who      = getQ4Value();
  const freq     = getRadio('q5');
  const category = getRadio('q11');
  const outcomes = getQ12Values();
  if (idea && who && category && outcomes.length > 0) {
    const picoText = [
      `<b>P</b>（対象・背景）：${who}が${freq}`,
      `<b>I</b>（介入・アイデア）：${idea.slice(0,120)}${idea.length>120?'…':''}`,
      `<b>C</b>（比較・現状）：${getVal('q8') || '現在の対応'}`,
      `<b>O</b>（期待する成果）：${outcomes.join('、')}`
    ].join('<br><br>');
    document.getElementById('picoContent').innerHTML = picoText;
    document.getElementById('picoBox').style.display = 'block';
  } else {
    document.getElementById('picoBox').style.display = 'none';
  }
  document.getElementById('previewModal').classList.add('active');
}

function closePreviewModal() {
  document.getElementById('previewModal').classList.remove('active');
}

// ============================================================
//  感謝モーダル - 変更なし
// ============================================================
function showThankModal() {
  const name  = getVal('q2');
  const email = getVal('q2b');
  document.getElementById('thank-name-label').textContent  = name;
  document.getElementById('thank-reply-email').textContent = email;
  document.getElementById('thankModal').classList.add('active');
}
function closeThankModal() {
  document.getElementById('thankModal').classList.remove('active');
}
function closePreviewAndThank() {
  closePreviewModal();
  showThankModal();
}

// ============================================================
//  リセット・再提案
// ============================================================
function startNewIdea() {
  // 自動クローズのカウントダウンを停止してからリセット（次の提案を正常に入力できるように）
  if (_closeTimer) { clearInterval(_closeTimer); _closeTimer = null; }
  closeThankModal();
  resetForm();
}

function resetForm() {
  document.getElementById('ideaForm').reset();

  document.querySelectorAll('.field-fb').forEach(el => {
    el.className = 'field-fb'; el.textContent = '';
  });
  document.querySelectorAll('.card-radio, .card-check, .freq-card, .icon-check').forEach(lbl => {
    lbl.classList.remove('selected');
  });
  // アンケートのラジオ/チェックも
  document.querySelectorAll('.radio-group label, .check-group label').forEach(lbl => {
    lbl.classList.remove('selected');
  });
  document.querySelectorAll('.other-input-wrap').forEach(w => {
    w.classList.remove('show');
    const ta = w.querySelector('textarea');
    if (ta) ta.value = '';
  });

  ['sq1','sq2','sq3','sq4','sq5_scale'].forEach(n =>
    document.querySelectorAll(`input[name="${n}"]`).forEach(r => r.checked = false));
  document.querySelectorAll('input[name="sq0_it"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="q10_type"]').forEach(r => r.checked = false);
  for (let i = 1; i <= 10; i++)
    document.querySelectorAll(`input[name="sus${i}"]`).forEach(r => r.checked = false);
  const sq6el = document.getElementById('sq5'); if (sq6el) sq6el.value = '';

  const charCount = document.getElementById('ideaCharCount');
  if (charCount) charCount.textContent = '0文字';

  startTime = null;
  // プレビューボタンのグレーアウトを解除（再提案時に再度確認できるように）
  const previewBtn = document.querySelector('.btn-preview');
  if (previewBtn) {
    previewBtn.disabled = false;
    previewBtn.classList.remove('btn-grayed');
  }
  showFormUI();
  document.getElementById('endScreen').classList.remove('active');
  showStep(0);
  updateProgress();
}

// ============================================================
//  終了画面
// ============================================================
function showEndScreen() {
  if (!formCompleted) sendLog('abandoned_end_btn', currentStep + 1);
  hideFormUI();
  document.getElementById('endScreen').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function restartFromEnd() {
  document.getElementById('endScreen').classList.remove('active');
  resetForm();
}

// ============================================================
//  GAS トラッキング - 変更なし
// ============================================================
const GAS_URL = 'https://script.google.com/macros/s/AKfycbx5Cf97A3SUGcfb8F3l87unhhSgjoo7TGZ1ozyRdk2JFGlxmJF9SxQN06QtjtJbJ5RV/exec';

const _urlParams  = new URLSearchParams(window.location.search);
const SESSION_ID  = _urlParams.get('sid') || 'direct_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
const FORM_TYPE   = _urlParams.get('ft')  || 'B';

let formCompleted = false;

function sendLog(status, step) {
  var payload = {
    timestamp:  new Date().toISOString(),
    form_type:  FORM_TYPE,
    last_step:  step,
    status:     status,
    session_id: SESSION_ID
  };
  fetch(GAS_URL, {
    method:    'POST',
    body:      JSON.stringify(payload),
    keepalive: true
  }).catch(function() {});
}

sendLog('form_opened', 1);

document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'hidden' && !formCompleted) {
    sendLog('abandoned', currentStep + 1);
  }
});

// ============================================================
//  SUSスコア計算 - 変更なし
// ============================================================
function getSusRadio(nm) {
  const el = document.querySelector(`input[name="${nm}"]:checked`);
  return el ? parseInt(el.value) : null;
}
function calculateSusScore() {
  const scores = [];
  for (let i = 1; i <= 10; i++) {
    const v = getSusRadio('sus' + i);
    if (v === null) return null;
    scores.push(v);
  }
  let total = 0;
  for (let i = 0; i < 10; i++) {
    total += (i % 2 === 0) ? scores[i] - 1 : 5 - scores[i];
  }
  return total * 2.5;
}
function getSusLabel(score) {
  if (score === null) return '（未回答）';
  if (score >= 85) return `${score}点（A：卓越した使いやすさ）`;
  if (score >= 80) return `${score}点（B：優れた使いやすさ）`;
  if (score >= 68) return `${score}点（C：平均的・合格水準）`;
  if (score >= 51) return `${score}点（D：改善が必要）`;
  return `${score}点（F：使いにくい）`;
}

// ============================================================
//  アンケート用ヘルパー - 変更なし
// ============================================================
function getSurveyRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '（未回答）';
}
function getSurveyChecks(name) {
  const els = document.querySelectorAll(`input[name="${name}"]:checked`);
  return els.length > 0 ? Array.from(els).map(e => e.value).join(' / ') : '（未選択）';
}

function getItExperienceChecks() {
  return Array.from(document.querySelectorAll('input[name="sq0_it"]:checked'))
    .map(e => e.value);
}
function getItLevelLabel() {
  const vals = getItExperienceChecks();
  if (vals.length === 0) return null;
  const hasMail  = vals.some(v => v.includes('メール・インターネット'));
  const hasEmr   = vals.some(v => v.includes('電子カルテ'));
  const hasApp   = vals.some(v => v.includes('スマートフォンアプリ'));
  const hasExcel = vals.some(v => v.includes('表計算ソフト'));
  const hasProg  = vals.some(v => v.includes('プログラムやスクリプト'));
  if (hasProg) return '上級';
  if (hasExcel || hasApp || hasEmr) return '中級';
  if (hasMail && vals.length === 1) return '初級';
  if (hasMail && vals.length >= 2)  return '中級';
  return '中級';
}

function showSurveyFromPreview() {
  closePreviewModal();
  sendLog('completed', 5);
  formCompleted = true;
  document.getElementById('surveyModal').classList.add('active');
}
