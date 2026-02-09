const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}

const navItems = document.querySelectorAll("#main-nav a");
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    if (mainNav) {
      mainNav.classList.remove("open");
    }
  });
});

const revealElements = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealElements.forEach((element) => revealObserver.observe(element));

const motionAllowed = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function setupTiltEffects() {
  if (!motionAllowed) return;

  const tiltTargets = document.querySelectorAll(".tilt-card, .tilt-soft");
  tiltTargets.forEach((target) => {
    const baseIntensity = target.classList.contains("tilt-soft") ? 8 : 14;
    const customIntensity = Number(target.getAttribute("data-tilt-intensity"));
    const intensity = Number.isFinite(customIntensity) && customIntensity > 0 ? customIntensity : baseIntensity;

    target.addEventListener("mousemove", (event) => {
      const rect = target.getBoundingClientRect();
      const posX = (event.clientX - rect.left) / rect.width;
      const posY = (event.clientY - rect.top) / rect.height;

      const rotateY = (posX - 0.5) * intensity;
      const rotateX = (0.5 - posY) * intensity;
      target.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(0)`;
    });

    target.addEventListener("mouseleave", () => {
      target.style.transform = "";
    });
  });

  const heroPanel = document.querySelector(".hero-panel");
  if (heroPanel) {
    heroPanel.addEventListener("mousemove", (event) => {
      const rect = heroPanel.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      heroPanel.style.setProperty("--glow-x", `${x}%`);
      heroPanel.style.setProperty("--glow-y", `${y}%`);
    });

    heroPanel.addEventListener("mouseleave", () => {
      heroPanel.style.setProperty("--glow-x", "50%");
      heroPanel.style.setProperty("--glow-y", "50%");
    });
  }
}

setupTiltEffects();

const loginModal = document.getElementById("login-modal");
const loginOpenButtons = document.querySelectorAll("[data-open-login]");
const loginCloseButtons = document.querySelectorAll("[data-close-login]");
const loginForm = document.getElementById("login-form");
const loginFeedback = document.getElementById("login-feedback");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
let loginPreviousFocus = null;

function setLoginFeedback(message, type = "") {
  if (!loginFeedback) return;
  loginFeedback.classList.remove("success", "error");
  loginFeedback.textContent = message;
  if (type) {
    loginFeedback.classList.add(type);
  }
}

function openLoginModal() {
  if (!loginModal) return;
  loginPreviousFocus = document.activeElement;
  loginModal.classList.add("open");
  loginModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setLoginFeedback("");

  window.setTimeout(() => {
    if (loginEmail) {
      loginEmail.focus();
    }
  }, 40);
}

function closeLoginModal() {
  if (!loginModal) return;
  loginModal.classList.remove("open");
  loginModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (loginPreviousFocus && typeof loginPreviousFocus.focus === "function") {
    loginPreviousFocus.focus();
  }
}

loginOpenButtons.forEach((button) => {
  button.addEventListener("click", openLoginModal);
});

loginCloseButtons.forEach((button) => {
  button.addEventListener("click", closeLoginModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && loginModal && loginModal.classList.contains("open")) {
    closeLoginModal();
  }
});

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const emailValue = String(loginEmail ? loginEmail.value : "").trim();
    const passwordValue = String(loginPassword ? loginPassword.value : "").trim();
    const hasEmail = emailValue.length > 4;
    const hasPassword = passwordValue.length >= 6;

    if (loginEmail) {
      loginEmail.classList.toggle("input-error", !hasEmail);
    }
    if (loginPassword) {
      loginPassword.classList.toggle("input-error", !hasPassword);
    }

    if (!hasEmail || !hasPassword) {
      setLoginFeedback("Preencha e-mail e senha validos para continuar.", "error");
      return;
    }

    setLoginFeedback("Acesso validado. Redirecionando para o painel...", "success");

    window.setTimeout(() => {
      closeLoginModal();
      loginForm.reset();
      if (loginEmail) loginEmail.classList.remove("input-error");
      if (loginPassword) loginPassword.classList.remove("input-error");
      setLoginFeedback("");
    }, 900);
  });
}

const assessmentForm = document.getElementById("assessment-form");
const formSteps = assessmentForm ? Array.from(assessmentForm.querySelectorAll(".form-step")) : [];
const prevStepBtn = document.getElementById("prev-step");
const nextStepBtn = document.getElementById("next-step");
const stepBadge = document.getElementById("step-badge");
const stepProgressFill = document.getElementById("step-progress-fill");
const reportWrap = document.getElementById("assessment-report-wrap");
const reportBox = document.getElementById("assessment-report");
const printBtn = document.getElementById("print-report");
const downloadBtn = document.getElementById("download-report");
const relatoTrigger = document.getElementById("relato_trigger");
const applyBlockBtn = document.getElementById("apply-block");
const blocoSugestaoField = document.getElementById("bloco_sugestao");
const condutaEditavelField = document.getElementById("conduta_editavel");

let currentStep = 0;
let latestAssessmentData = null;
let latestHabitsData = null;

const blockLibrary = {
  compulsao_noturna:
    "Sugerir lanche proteico no fim da tarde + rotina de desaceleracao noturna e monitorar gatilhos emocionais.",
  constipacao:
    "Aumentar agua gradualmente, incluir fibras soluveis e frutas laxativas, revisar horario intestinal diario.",
  fome_tarde:
    "Reforcar proteina e gordura boa no almoco + lanche estruturado 2h antes do pico de fome.",
  baixa_energia:
    "Organizar cafe da manha completo, checar qualidade do sono e distribuir carboidratos ao longo do dia.",
  pouco_tempo:
    "Aplicar estrategia de preparacoes base 2x na semana e montar refeicoes com combinacoes rapidas."
};

const habitsLibrary = {
  sono: {
    goal: "Regular horario de sono com ritual noturno em pelo menos 5 dias da semana.",
    checklist: ["Desligar telas 60 min antes", "Evitar cafeina apos 16h"],
    tips: ["Jantar mais leve a noite", "Quarto escuro e temperatura agradavel"],
    swaps: ["Trocar cafe noturno por cha sem cafeina"],
    shopping: ["Cha de camomila", "Iogurte natural", "Aveia"]
  },
  compulsao: {
    goal: "Reduzir episodios de compulsao com estrutura de refeicoes e gatilhos mapeados.",
    checklist: ["Fazer 3 refeicoes base", "Incluir lanche estrategico da tarde"],
    tips: ["Usar escala de fome antes de comer", "Evitar longos jejuns nao planejados"],
    swaps: ["Trocar doces ultraprocessados por fruta com iogurte"],
    shopping: ["Frutas", "Iogurte", "Oleaginosas"]
  },
  intestino: {
    goal: "Melhorar ritmo intestinal com hidratacao e fibras distribuidas ao longo do dia.",
    checklist: ["Beber agua ao acordar", "Consumir 2 porcoes de frutas por dia"],
    tips: ["Incluir verduras no almoco e jantar", "Criar horario fixo para evacuar"],
    swaps: ["Trocar pao branco por opcoes integrais"],
    shopping: ["Mamao", "Ameixa", "Verduras", "Sementes"]
  },
  hipertensao: {
    goal: "Diminuir consumo de sodio e aumentar densidade nutricional nas refeicoes.",
    checklist: ["Evitar embutidos no dia a dia", "Temperar com ervas no lugar de excesso de sal"],
    tips: ["Priorizar alimentos in natura", "Ler rotulo de sodio"],
    swaps: ["Trocar tempero pronto por mix de ervas"],
    shopping: ["Alho", "Cebola", "Ervas", "Legumes"]
  },
  colesterol: {
    goal: "Melhorar perfil lipidico com fibras, gorduras boas e reducao de ultraprocessados.",
    checklist: ["Consumir fibra em 2 refeicoes", "Incluir gordura boa diariamente"],
    tips: ["Preferir preparacoes assadas", "Aumentar leguminosas"],
    swaps: ["Trocar frituras por preparacoes no forno"],
    shopping: ["Aveia", "Feijao", "Azeite", "Abacate"]
  },
  prediabetes: {
    goal: "Controlar picos glicemicos com distribuicao adequada de carboidratos.",
    checklist: ["Montar prato com fonte de proteina", "Evitar liquidos acucarados"],
    tips: ["Combinar carboidrato com fibra/proteina", "Fazer caminhada apos refeicao"],
    swaps: ["Trocar refrigerante por agua com limao"],
    shopping: ["Vegetais", "Ovos", "Frango", "Graos integrais"]
  },
  fadiga: {
    goal: "Melhorar energia diaria com refeicoes completas e rotina previsivel.",
    checklist: ["Nao pular cafe da manha", "Pausar para hidratar 3x ao dia"],
    tips: ["Distribuir carboidratos no dia", "Organizar lanches praticos"],
    swaps: ["Trocar snacks vazios por combinacoes com proteina"],
    shopping: ["Banana", "Iogurte", "Aveia", "Castanhas"]
  }
};

const whatsappTemplates = {
  pos_consulta:
    "Oi {nome}, foi otimo te atender hoje. Sua meta principal e {meta}. Vamos focar no habito: {habito}. Para facilitar, comeca com a receita: {receita}.",
  semana_1:
    "{nome}, fechando a semana 1: mantenha o foco em {meta}. Se conseguir cumprir {habito} hoje, ja estamos no caminho certo.",
  semana_2:
    "Semana 2, {nome}. Ajuste fino: priorize {habito} e revise sua meta ({meta}). Se precisar de praticidade, use {receita}.",
  escorreguei:
    "{nome}, um escorregao nao apaga seu progresso. Volte na proxima refeicao e retome {habito}. Seu foco continua sendo {meta}.",
  nao_consegui:
    "Sem culpa, {nome}. Vamos simplificar: hoje faca apenas {habito}. Meta da semana: {meta}. Passo pequeno, resultado real.",
  viajei:
    "Boa viagem, {nome}. Em dias corridos, mantenha o minimo viavel: {habito}. Isso protege sua meta de {meta}.",
  festa:
    "{nome}, na festa use estrategia simples: coma com atencao e mantenha {habito} no dia seguinte. Sua meta ({meta}) segue ativa."
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeText(value, fallback = "Nao informado") {
  const text = String(value || "").trim();
  return text ? escapeHtml(text) : escapeHtml(fallback);
}

function linesFromText(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function uniqueList(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

function renderList(items, fallback = "Nao informado") {
  if (!items || !items.length) {
    return `<p>${escapeHtml(fallback)}</p>`;
  }
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function getStepLabel(index) {
  return `Etapa ${index + 1} de ${formSteps.length}`;
}

function updateStepUi() {
  if (!formSteps.length) return;

  formSteps.forEach((step, index) => {
    step.classList.toggle("active", index === currentStep);
  });

  if (stepBadge) {
    stepBadge.textContent = getStepLabel(currentStep);
  }

  if (stepProgressFill) {
    const progress = ((currentStep + 1) / formSteps.length) * 100;
    stepProgressFill.style.width = `${progress}%`;
  }

  if (prevStepBtn) {
    prevStepBtn.disabled = currentStep === 0;
  }

  if (nextStepBtn) {
    nextStepBtn.textContent = currentStep === formSteps.length - 1 ? "Gerar resumo" : "Proxima etapa";
  }
}

function isFieldEmpty(field) {
  if (field.tagName === "SELECT") {
    return field.value === "";
  }
  return field.value.trim() === "";
}

function validateCurrentStep() {
  if (!formSteps.length) return false;

  const currentFields = formSteps[currentStep].querySelectorAll("[required]");
  let isValid = true;

  currentFields.forEach((field) => {
    if (isFieldEmpty(field)) {
      field.classList.add("input-error");
      isValid = false;
    } else {
      field.classList.remove("input-error");
    }
  });

  return isValid;
}

function bmiCategory(imc) {
  if (imc < 18.5) return "Baixo peso";
  if (imc < 25) return "Peso adequado";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade grau I";
  if (imc < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

function getObjectiveOrientation(objective) {
  const objectiveLower = objective.toLowerCase();
  if (objectiveLower.includes("cut") || objectiveLower.includes("emagrecimento")) {
    return "Deficit calorico progressivo, proteina alta e adesao comportamental.";
  }
  if (objectiveLower.includes("bulk") || objectiveLower.includes("massa")) {
    return "Superavit leve, controle de ganho semanal e distribuicao inteligente de carboidratos.";
  }
  if (objectiveLower.includes("recomposicao") || objectiveLower.includes("recomposi")) {
    return "Calorias proximas a manutencao, treino estruturado e proteina consistente.";
  }
  return "Plano inicial focado em saude metabolica e habitos sustentaveis.";
}

function buildPrintableDocument(title, content) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #1f2937;
      margin: 24px;
      line-height: 1.45;
    }
    h1 {
      font-size: 22px;
      margin-bottom: 10px;
      color: #0f766e;
    }
    h5 {
      margin: 14px 0 6px;
      font-size: 14px;
      color: #0f766e;
    }
    p {
      margin: 4px 0;
      font-size: 13px;
    }
    ul {
      margin: 6px 0 10px;
      padding-left: 18px;
      font-size: 13px;
    }
    li {
      margin-bottom: 4px;
    }
    .report-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 18px;
      margin: 10px 0;
    }
    .report-note {
      margin-top: 14px;
      border: 1px solid #d3ece4;
      background: #f2fbf8;
      border-radius: 8px;
      padding: 10px;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${content}
</body>
</html>
`;
}

if (assessmentForm) {
  assessmentForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}

if (applyBlockBtn) {
  applyBlockBtn.addEventListener("click", () => {
    const selected = relatoTrigger ? relatoTrigger.value : "";
    if (!selected || !blockLibrary[selected]) {
      if (blocoSugestaoField) {
        blocoSugestaoField.value = "";
      }
      return;
    }

    const suggestion = blockLibrary[selected];
    if (blocoSugestaoField) {
      blocoSugestaoField.value = suggestion;
    }
    if (condutaEditavelField && !condutaEditavelField.value.trim()) {
      condutaEditavelField.value = suggestion;
    }
  });
}

function generateAssessmentReport() {
  if (!assessmentForm || !reportBox || !reportWrap) return;

  const formData = new FormData(assessmentForm);
  const data = Object.fromEntries(formData.entries());
  const secondaryGoals = Array.from(
    assessmentForm.querySelectorAll('input[name="objetivos_secundarios"]:checked')
  ).map((item) => item.value);

  const metas = linesFromText(data.metas_semanais);
  const priorities = linesFromText(data.prioridades).slice(0, 3);
  const nextSteps = linesFromText(data.proximos_passos);
  const exams = linesFromText(data.exames_sugeridos);
  const guidance = linesFromText(data.orientacoes_iniciais);

  const finalPriorities = priorities.length
    ? priorities
    : ["Organizar horarios das refeicoes", "Ajustar hidratacao diaria", "Consolidar habito foco da semana"];

  latestAssessmentData = {
    data,
    secondaryGoals,
    metas,
    priorities: finalPriorities,
    nextSteps,
    exams,
    guidance
  };

  const peso = Number(data.peso);
  const altura = Number(data.altura);
  const alturaM = altura / 100;
  const imc = peso && alturaM ? peso / (alturaM * alturaM) : 0;
  const imcText = imc ? `${imc.toFixed(1)} (${bmiCategory(imc)})` : "N/A";
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const orientation = getObjectiveOrientation(String(data.objetivo || ""));

  reportBox.innerHTML = `
    <p><strong>Paciente:</strong> ${safeText(data.paciente_nome)} | <strong>Data:</strong> ${dateStr} as ${timeStr}</p>
    <div class="report-grid">
      <p><strong>Idade:</strong> ${safeText(data.idade)} anos</p>
      <p><strong>Sexo:</strong> ${safeText(data.sexo)}</p>
      <p><strong>Altura:</strong> ${safeText(data.altura)} cm</p>
      <p><strong>Peso:</strong> ${safeText(data.peso)} kg</p>
      <p><strong>IMC inicial:</strong> ${escapeHtml(imcText)}</p>
      <p><strong>Objetivo principal:</strong> ${safeText(data.objetivo)}</p>
    </div>

    <h5>Queixa principal</h5>
    <p>${safeText(data.queixa_principal)}</p>

    <h5>Historico clinico</h5>
    <p>${safeText(data.historico_clinico)}</p>

    <h5>Rotina e recordatorio</h5>
    <p><strong>Sono:</strong> ${safeText(data.rotina_sono)} | <strong>Trabalho:</strong> ${safeText(data.rotina_trabalho)}</p>
    <p><strong>Treino:</strong> ${safeText(data.treino_frequencia)} | <strong>Hidratacao:</strong> ${safeText(data.hidratacao)}</p>
    <p><strong>Recordatorio 24h:</strong> ${safeText(data.recordatorio_24h)}</p>

    <h5>Objetivos secundarios</h5>
    ${renderList(secondaryGoals, "Sem objetivos secundarios definidos")}

    <h5>Metas semanais</h5>
    ${renderList(metas, "Definir metas da semana")}

    <h5>3 prioridades da fase inicial</h5>
    ${renderList(finalPriorities)}

    <h5>Proximos passos</h5>
    ${renderList(nextSteps, "Agendar retorno e acompanhar adesao")}

    <h5>Lista de exames sugeridos</h5>
    ${renderList(exams, "A definir conforme evolucao clinica")}

    <h5>Orientacoes iniciais</h5>
    ${renderList(guidance)}

    <h5>Bloco inteligente aplicado</h5>
    <p><strong>Relato:</strong> ${safeText(data.relato_trigger, "Nao selecionado")}</p>
    <p><strong>Sugestao:</strong> ${safeText(data.bloco_sugestao)}</p>
    <p><strong>Conduta final:</strong> ${safeText(data.conduta_editavel)}</p>

    <div class="report-note">
      <p><strong>Direcionamento tecnico:</strong> ${escapeHtml(orientation)}</p>
      <p><strong>Entrega desta consulta:</strong> metas da semana + prioridades + plano inicial em acompanhamento.</p>
    </div>
  `;

  reportWrap.classList.remove("hidden");
  reportWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

if (prevStepBtn) {
  prevStepBtn.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep -= 1;
      updateStepUi();
    }
  });
}

if (nextStepBtn) {
  nextStepBtn.addEventListener("click", () => {
    const valid = validateCurrentStep();
    if (!valid) return;

    if (currentStep < formSteps.length - 1) {
      currentStep += 1;
      updateStepUi();
      return;
    }

    generateAssessmentReport();
  });
}

if (printBtn) {
  printBtn.addEventListener("click", () => {
    if (!reportBox || !reportBox.innerHTML.trim()) return;
    const printWindow = window.open("", "_blank", "width=920,height=780");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(buildPrintableDocument("Resumo da Consulta", reportBox.innerHTML));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  });
}

if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    if (!latestAssessmentData) return;

    const { data, secondaryGoals, metas, priorities, nextSteps, exams, guidance } = latestAssessmentData;
    const lines = [
      "Resumo da Consulta - Kit Primeira Consulta",
      `Data: ${new Date().toLocaleString("pt-BR")}`,
      "",
      `Paciente: ${String(data.paciente_nome || "")}`,
      `Idade: ${String(data.idade || "")} anos`,
      `Sexo: ${String(data.sexo || "")}`,
      `Objetivo principal: ${String(data.objetivo || "")}`,
      "",
      "Queixa principal:",
      String(data.queixa_principal || ""),
      "",
      "Metas semanais:",
      ...metas.map((item) => `- ${item}`),
      "",
      "3 prioridades:",
      ...priorities.map((item) => `- ${item}`),
      "",
      "Proximos passos:",
      ...nextSteps.map((item) => `- ${item}`),
      "",
      "Exames sugeridos:",
      ...(exams.length ? exams.map((item) => `- ${item}`) : ["- A definir conforme avaliacao"]),
      "",
      "Orientacoes iniciais:",
      ...guidance.map((item) => `- ${item}`),
      "",
      "Objetivos secundarios:",
      ...(secondaryGoals.length ? secondaryGoals.map((item) => `- ${item}`) : ["- Nao informado"]),
      "",
      "Bloco sugerido:",
      String(data.bloco_sugestao || "")
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `resumo_consulta_${String(data.paciente_nome || "paciente")
      .replace(/\s+/g, "_")
      .toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}

updateStepUi();

const habitsForm = document.getElementById("habits-form");
const habitsPlanWrap = document.getElementById("habits-plan-wrap");
const habitsPlanBox = document.getElementById("habits-plan");
const printHabitsBtn = document.getElementById("print-habits");
const downloadHabitsBtn = document.getElementById("download-habits");

function getSelectedHabitGoals() {
  if (!habitsForm) return [];
  return Array.from(habitsForm.querySelectorAll('input[name="habits_goal"]:checked')).map((item) => item.value);
}

function generateHabitsPlan() {
  if (!habitsForm || !habitsPlanBox || !habitsPlanWrap) return;

  const name = String(document.getElementById("habits-name").value || "").trim();
  const selectedGoals = getSelectedHabitGoals();
  const dailyTime = String(document.getElementById("habits-time").value || "").trim();
  const weeklyCheckins = String(document.getElementById("habits-checkins").value || "").trim();
  const habitFocus = String(document.getElementById("habits-habit").value || "").trim();
  const recipe = String(document.getElementById("habits-recipe").value || "").trim();

  const goalGrid = habitsForm.querySelector(".goal-grid");
  if (!selectedGoals.length) {
    if (goalGrid) {
      goalGrid.classList.add("input-error");
      window.setTimeout(() => {
        goalGrid.classList.remove("input-error");
      }, 1200);
    }
    return;
  }

  const weeklyGoals = [];
  const checklist = ["Hidratacao diaria registrada", "Planejar refeicoes do dia seguinte"];
  const tips = ["Manter rotina minima mesmo em dia corrido"];
  const swaps = [];
  const shopping = [];

  selectedGoals.forEach((goalKey) => {
    const preset = habitsLibrary[goalKey];
    if (!preset) return;
    weeklyGoals.push(preset.goal);
    checklist.push(...preset.checklist);
    tips.push(...preset.tips);
    swaps.push(...preset.swaps);
    shopping.push(...preset.shopping);
  });

  const checklistUnique = uniqueList(checklist);
  const tipsUnique = uniqueList(tips);
  const swapsUnique = uniqueList(swaps);
  const shoppingUnique = uniqueList(shopping);

  latestHabitsData = {
    name,
    selectedGoals,
    dailyTime,
    weeklyCheckins,
    habitFocus,
    recipe,
    weeklyGoals,
    checklistUnique,
    tipsUnique,
    swapsUnique,
    shoppingUnique
  };

  habitsPlanBox.innerHTML = `
    <p><strong>Paciente:</strong> ${safeText(name)} | <strong>Tempo diario:</strong> ${safeText(dailyTime)} | <strong>Check-ins:</strong> ${safeText(weeklyCheckins)}x/semana</p>

    <h5>Meta foco da semana</h5>
    <p>${safeText(habitFocus)}</p>

    <h5>Metas semanais</h5>
    ${renderList(weeklyGoals)}

    <h5>Checklist diario</h5>
    ${renderList(checklistUnique)}

    <h5>Dicas praticas</h5>
    ${renderList(tipsUnique)}

    <h5>Substituicoes inteligentes</h5>
    ${renderList(swapsUnique, "Definir substituicoes com o contexto do paciente")}

    <h5>Lista de compras basica</h5>
    ${renderList(shoppingUnique)}

    <div class="report-note">
      <p><strong>Receita de apoio:</strong> ${safeText(recipe, "Sem receita definida")}</p>
      <p><strong>Plano de adesao:</strong> revisar progresso nos check-ins e ajustar apenas 1 variavel por semana.</p>
    </div>
  `;

  habitsPlanWrap.classList.remove("hidden");
  habitsPlanWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

if (habitsForm) {
  habitsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    generateHabitsPlan();
  });
}

if (printHabitsBtn) {
  printHabitsBtn.addEventListener("click", () => {
    if (!habitsPlanBox || !habitsPlanBox.innerHTML.trim()) return;
    const printWindow = window.open("", "_blank", "width=920,height=780");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(buildPrintableDocument("Plano de Habitos - Semanal", habitsPlanBox.innerHTML));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  });
}

if (downloadHabitsBtn) {
  downloadHabitsBtn.addEventListener("click", () => {
    if (!latestHabitsData) return;

    const lines = [
      "Plano de Habitos - Nutrisente",
      `Data: ${new Date().toLocaleString("pt-BR")}`,
      "",
      `Paciente: ${latestHabitsData.name}`,
      `Tempo diario: ${latestHabitsData.dailyTime}`,
      `Check-ins por semana: ${latestHabitsData.weeklyCheckins}`,
      `Habito foco: ${latestHabitsData.habitFocus}`,
      "",
      "Metas semanais:",
      ...latestHabitsData.weeklyGoals.map((item) => `- ${item}`),
      "",
      "Checklist diario:",
      ...latestHabitsData.checklistUnique.map((item) => `- ${item}`),
      "",
      "Dicas praticas:",
      ...latestHabitsData.tipsUnique.map((item) => `- ${item}`),
      "",
      "Substituicoes:",
      ...latestHabitsData.swapsUnique.map((item) => `- ${item}`),
      "",
      "Lista de compras:",
      ...latestHabitsData.shoppingUnique.map((item) => `- ${item}`),
      "",
      `Receita de apoio: ${latestHabitsData.recipe || "Sem receita definida"}`
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `plano_habitos_${latestHabitsData.name.replace(/\s+/g, "_").toLowerCase() || "paciente"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}

const whatsappForm = document.getElementById("whatsapp-form");
const whatsappResult = document.getElementById("whatsapp-result");
const whatsappStatus = document.getElementById("whatsapp-status");
const whatsappOutput = document.getElementById("whatsapp-output");
const copyWhatsappBtn = document.getElementById("copy-whatsapp");

function fillTemplate(template, values) {
  return template
    .replaceAll("{nome}", values.nome)
    .replaceAll("{meta}", values.meta)
    .replaceAll("{habito}", values.habito)
    .replaceAll("{receita}", values.receita || "uma opcao simples do seu plano");
}

if (whatsappForm && whatsappResult && whatsappStatus && whatsappOutput && copyWhatsappBtn) {
  whatsappForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nome = String(document.getElementById("wa-name").value || "").trim();
    const fase = String(document.getElementById("wa-phase").value || "").trim();
    const meta = String(document.getElementById("wa-meta").value || "").trim();
    const habito = String(document.getElementById("wa-habit").value || "").trim();
    const receita = String(document.getElementById("wa-recipe").value || "").trim();

    const template = whatsappTemplates[fase] || "";
    if (!template) return;

    const message = fillTemplate(template, { nome, meta, habito, receita });

    whatsappResult.classList.remove("muted");
    whatsappStatus.textContent = "Mensagem pronta para copiar e colar:";
    whatsappOutput.value = message;
    whatsappOutput.classList.remove("hidden");
    copyWhatsappBtn.classList.remove("hidden");
  });

  copyWhatsappBtn.addEventListener("click", async () => {
    const text = whatsappOutput.value.trim();
    if (!text) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        whatsappOutput.select();
        document.execCommand("copy");
      }
      whatsappStatus.textContent = "Mensagem copiada com sucesso.";
    } catch (error) {
      whatsappStatus.textContent = "Nao foi possivel copiar automaticamente. Copie manualmente o texto abaixo.";
    }
  });
}

const calorieForm = document.getElementById("calorie-form");
const calorieResult = document.getElementById("calorie-result");

function roundValue(value) {
  return Math.round(value);
}

if (calorieForm && calorieResult) {
  calorieForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const peso = Number(document.getElementById("calc-peso").value);
    const altura = Number(document.getElementById("calc-altura").value);
    const idade = Number(document.getElementById("calc-idade").value);
    const sexo = document.getElementById("calc-sexo").value;
    const atividade = Number(document.getElementById("calc-atividade").value);
    const objetivo = document.getElementById("calc-objetivo").value;

    const bmr =
      sexo === "feminino"
        ? 10 * peso + 6.25 * altura - 5 * idade - 161
        : 10 * peso + 6.25 * altura - 5 * idade + 5;
    const tdee = bmr * atividade;

    const objectiveSettings = {
      cut: { factor: 0.85, proteinPerKg: 2.2, fatPerKg: 0.8, label: "Cut" },
      bulk: { factor: 1.12, proteinPerKg: 1.9, fatPerKg: 0.95, label: "Bulk" },
      recomp: { factor: 1.0, proteinPerKg: 2.1, fatPerKg: 0.85, label: "Recomp" }
    };

    const setting = objectiveSettings[objetivo];
    if (!setting) return;

    const targetCalories = tdee * setting.factor;
    const proteinG = peso * setting.proteinPerKg;
    let fatG = peso * setting.fatPerKg;

    let carbsG = (targetCalories - proteinG * 4 - fatG * 9) / 4;
    if (carbsG < 0) {
      fatG = Math.max(0.6 * peso, fatG + carbsG / 2.25);
      carbsG = 30;
    }

    const finalCalories = proteinG * 4 + fatG * 9 + carbsG * 4;

    const mealSplit = {
      protein: roundValue(proteinG / 4),
      carbs: roundValue(carbsG / 4),
      fat: roundValue(fatG / 4)
    };

    calorieResult.classList.remove("muted");
    calorieResult.innerHTML = `
      <p><strong>Objetivo:</strong> ${setting.label}</p>
      <p><strong>Calorias diarias alvo:</strong> ${roundValue(finalCalories)} kcal</p>
      <p><strong>TMB:</strong> ${roundValue(bmr)} kcal | <strong>Gasto total estimado:</strong> ${roundValue(
        tdee
      )} kcal</p>
      <div class="macro-grid">
        <div class="macro-item">
          <span>Proteina</span>
          <strong>${roundValue(proteinG)} g</strong>
        </div>
        <div class="macro-item">
          <span>Carboidrato</span>
          <strong>${roundValue(carbsG)} g</strong>
        </div>
        <div class="macro-item">
          <span>Gordura</span>
          <strong>${roundValue(fatG)} g</strong>
        </div>
      </div>
      <p class="small">
        Sugestao por 4 refeicoes: ${mealSplit.protein}g proteina, ${mealSplit.carbs}g carbo e
        ${mealSplit.fat}g gordura por refeicao.
      </p>
    `;
  });
}

const bmiForm = document.getElementById("bmi-form");
const bmiResult = document.getElementById("bmi-result");

if (bmiForm && bmiResult) {
  bmiForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const peso = Number(document.getElementById("imc-peso").value);
    const alturaCm = Number(document.getElementById("imc-altura").value);
    const alturaM = alturaCm / 100;
    const imc = peso / (alturaM * alturaM);
    const minIdeal = 18.5 * (alturaM * alturaM);
    const maxIdeal = 24.9 * (alturaM * alturaM);

    bmiResult.classList.remove("muted");
    bmiResult.innerHTML = `
      <p><strong>IMC:</strong> ${imc.toFixed(1)} (${bmiCategory(imc)})</p>
      <p><strong>Faixa de peso considerada saudavel:</strong> ${minIdeal.toFixed(1)}kg a ${maxIdeal.toFixed(
      1
    )}kg</p>
    `;
  });
}

const faqItems = document.querySelectorAll(".faq-item");
faqItems.forEach((item) => {
  const trigger = item.querySelector(".faq-question");
  if (!trigger) return;
  trigger.addEventListener("click", () => {
    item.classList.toggle("open");
  });
});
