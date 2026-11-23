/**
 * Agile Governance, Jira Board & Artifacts Hub
 * Department of Computer Science & Engineering - MIT School of Computing
 */

let agileState = null;
let currentJiraSprint = 2; // Default to Sprint 2 (matches Presentation Slide 6)

async function fetchAgileData() {
  try {
    const res = await fetch('/api/agile/data');
    const data = await res.json();
    if (data.success) {
      agileState = data.agile;
    }
  } catch (err) {
    console.error('Failed to load agile metadata:', err);
  }
}

function openAgileModal(initialTab = 'jira') {
  const modal = document.getElementById('agileModal');
  if (modal) modal.classList.remove('hidden');
  switchAgileTab(initialTab);
}

function closeAgileModal() {
  const modal = document.getElementById('agileModal');
  if (modal) modal.classList.add('hidden');
}

function switchAgileTab(tabName) {
  document.querySelectorAll('.agile-tab').forEach(tab => {
    if (tab.dataset.tab === tabName) {
      tab.className = 'agile-tab py-3 px-4 font-bold border-b-2 text-indigo-600 border-indigo-600 flex items-center gap-1.5';
    } else {
      tab.className = 'agile-tab py-3 px-4 font-semibold border-b-2 text-slate-500 border-transparent hover:text-slate-800 flex items-center gap-1.5';
    }
  });

  const container = document.getElementById('agileContentContainer');
  if (!container || !agileState) return;

  if (tabName === 'jira') {
    renderJiraBoardTab(container);
  } else if (tabName === 'tests') {
    renderTestRunnerTab(container);
  } else if (tabName === 'stories') {
    renderUserStoriesTab(container);
  } else if (tabName === 'metrics') {
    renderMetricsTab(container);
  } else if (tabName === 'defects') {
    renderDefectsTab(container);
  } else if (tabName === 'team') {
    renderTeamTab(container);
  }
}

// -------------------------------------------------------------
// TAB 1: JIRA SPRINT BOARD (Slide 6 Replica)
// -------------------------------------------------------------
function renderJiraBoardTab(container) {
  const b = agileState.jiraBoardSprint2;

  container.innerHTML = `
    <div class="space-y-5">
      <!-- Jira Header & Sprint Selector -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xl">📋</span>
            <h3 class="text-base font-extrabold text-slate-900">Jira Active Sprint Board</h3>
            <span class="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">SCRUM-2026</span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">Sprint Cadence: 2-Week Cycles • Team Velocity: 16 pts/Sprint</p>
        </div>

        <!-- Sprint Filter Pills -->
        <div class="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs">
          <button onclick="setJiraSprint(1)" class="px-3 py-1 rounded font-semibold ${currentJiraSprint === 1 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}">Sprint 1 (13 SP)</button>
          <button onclick="setJiraSprint(2)" class="px-3 py-1 rounded font-semibold ${currentJiraSprint === 2 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}">Sprint 2 (16 SP) [Slide 6]</button>
          <button onclick="setJiraSprint(3)" class="px-3 py-1 rounded font-semibold ${currentJiraSprint === 3 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}">Sprint 3 (18 SP)</button>
        </div>
      </div>

      <!-- Kanban Columns: TO DO, IN PROGRESS, CODE REVIEW / QA, DONE -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <!-- TO DO (3) -->
        <div class="jira-column p-3 flex flex-col">
          <div class="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
            <span class="text-xs font-extrabold uppercase text-slate-600 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-slate-400"></span> TO DO
            </span>
            <span class="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">${b.todo.length}</span>
          </div>
          <div class="space-y-2.5 flex-1">
            ${b.todo.map(ticket => renderJiraCard(ticket)).join('')}
          </div>
        </div>

        <!-- IN PROGRESS (1) -->
        <div class="jira-column p-3 flex flex-col">
          <div class="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
            <span class="text-xs font-extrabold uppercase text-amber-600 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span> IN PROGRESS
            </span>
            <span class="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">${b.inProgress.length}</span>
          </div>
          <div class="space-y-2.5 flex-1">
            ${b.inProgress.map(ticket => renderJiraCard(ticket)).join('')}
          </div>
        </div>

        <!-- CODE REVIEW / QA (2) -->
        <div class="jira-column p-3 flex flex-col">
          <div class="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
            <span class="text-xs font-extrabold uppercase text-indigo-600 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span> CODE REVIEW / QA
            </span>
            <span class="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">${b.codeReviewQA.length}</span>
          </div>
          <div class="space-y-2.5 flex-1">
            ${b.codeReviewQA.map(ticket => renderJiraCard(ticket)).join('')}
          </div>
        </div>

        <!-- DONE (2) -->
        <div class="jira-column p-3 flex flex-col">
          <div class="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
            <span class="text-xs font-extrabold uppercase text-emerald-600 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span> DONE
            </span>
            <span class="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">${b.done.length}</span>
          </div>
          <div class="space-y-2.5 flex-1">
            ${b.done.map(ticket => renderJiraCard(ticket, true)).join('')}
          </div>
        </div>

      </div>
    </div>
  `;
}

function renderJiraCard(ticket, isDone = false) {
  return `
    <div class="jira-card p-3 space-y-2 cursor-pointer">
      <div class="flex items-center justify-between text-[11px]">
        <span class="font-mono-code font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">${ticket.id}</span>
        <span class="font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">${ticket.points} SP</span>
      </div>
      <h4 class="text-xs font-bold text-slate-800 leading-snug">${ticket.title}</h4>
      <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
        <span class="flex items-center gap-1">👤 ${ticket.assignee || 'Engineer'}</span>
        ${isDone ? '<span class="text-emerald-600 font-bold">✔ Closed</span>' : '<span class="text-slate-400">Sprint 2</span>'}
      </div>
    </div>
  `;
}

function setJiraSprint(num) {
  currentJiraSprint = num;
  switchAgileTab('jira');
  showToast('Sprint Board Switched', `Now viewing Sprint ${num} board.`, 'info');
}

// -------------------------------------------------------------
// TAB 2: USER STORIES & BDD ACCEPTANCE CRITERIA (Slides 3, 4, 8)
// -------------------------------------------------------------
function renderUserStoriesTab(container) {
  const stories = agileState.userStories;

  container.innerHTML = `
    <div class="space-y-4">
      <div class="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-extrabold text-indigo-950">6 Core Domain User Stories & BDD Acceptance Criteria</h3>
          <p class="text-xs text-indigo-800">Total Scope: 47 Story Points across 3 Sprints • MoSCoW Prioritized</p>
        </div>
        <span class="text-xs font-extrabold bg-indigo-600 text-white px-2.5 py-1 rounded-lg">47 SP Total</span>
      </div>

      <div class="space-y-3">
        ${stories.map(s => `
          <div class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="font-mono-code font-black text-xs bg-slate-900 text-white px-2 py-0.5 rounded">${s.id}</span>
                <h4 class="text-sm font-extrabold text-slate-900">${s.feature}</h4>
                <span class="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">MoSCoW: ${s.moscow}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-600">Sprint ${s.sprint}</span>
                <span class="text-xs font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">${s.storyPoints} SP</span>
              </div>
            </div>

            <p class="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
              "${s.statement}"
            </p>

            <div class="text-[11px] text-slate-600 flex items-start gap-1.5 pt-1">
              <span class="font-bold text-indigo-600">Acceptance Criteria (BDD):</span>
              <span class="font-medium">${s.acceptance}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Slide 8 Detailed BDD Focus: US-03 -->
      <div class="bg-slate-900 text-white rounded-xl p-5 space-y-3 border border-slate-800 mt-4">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-400">Spotlight: US-03 BDD Acceptance & Definition of Done (Slide 8)</h4>
          <span class="text-xs bg-white/10 px-2 py-0.5 rounded font-mono-code">Gherkin BDD</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="bg-white/5 p-3 rounded-lg space-y-1.5 border border-white/10">
            <span class="font-bold text-indigo-300 block mb-1">BDD Gherkin Acceptance:</span>
            <p><b class="text-emerald-400">Given:</b> Active cart with items held for checkout.</p>
            <p><b class="text-emerald-400">When:</b> User selects delivery address and 30-min slot.</p>
            <p><b class="text-emerald-400">Then:</b> System verifies zip serviceability within 200ms.</p>
            <p><b class="text-emerald-400">And:</b> Locked cart price reflects taxes and delivery fee.</p>
          </div>
          <div class="bg-white/5 p-3 rounded-lg space-y-1.5 border border-white/10">
            <span class="font-bold text-indigo-300 block mb-1">Definition of Done (DoD):</span>
            <p>✔ Unit Testing: Line coverage exceeds 85% strictly.</p>
            <p>✔ Peer Review: Minimum 2 senior engineer PR approvals.</p>
            <p>✔ Security Scan: Zero high or critical SonarQube alerts.</p>
            <p>✔ Staging Deploy: Automated end-to-end regression pass.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// TAB 3: VELOCITY, PROGRESS & RETROSPECTIVES (Slides 5, 7, 11, 12, 13)
// -------------------------------------------------------------
function renderMetricsTab(container) {
  const p = agileState.project;
  const sprints = agileState.sprints;

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- Key Metric Cards (Slide 7 & 13) -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <div class="text-2xl font-black text-slate-900">15.67 SP</div>
          <div class="text-[11px] font-bold text-slate-500 uppercase mt-1">Average Velocity</div>
          <div class="text-[10px] text-slate-400 mt-0.5">(13 + 16 + 18) / 3</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <div class="text-2xl font-black text-indigo-600">47 SP</div>
          <div class="text-[11px] font-bold text-slate-500 uppercase mt-1">Committed Scope</div>
          <div class="text-[10px] text-slate-400 mt-0.5">3 Structured Sprints</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <div class="text-2xl font-black text-emerald-600">47 SP</div>
          <div class="text-[11px] font-bold text-slate-500 uppercase mt-1">Delivered Scope</div>
          <div class="text-[10px] text-slate-400 mt-0.5">100% Predictability</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <div class="text-2xl font-black text-brand-600">&gt;85%</div>
          <div class="text-[11px] font-bold text-slate-500 uppercase mt-1">Test Code Coverage</div>
          <div class="text-[10px] text-slate-400 mt-0.5">Zero Unresolved P1 Bugs</div>
        </div>
      </div>

      <!-- 3-Sprint Roadmap (Slide 5) -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 class="text-sm font-extrabold text-slate-900">3-Sprint Roadmap & Delivery Milestones</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          ${sprints.map(sp => `
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-extrabold text-slate-900">Sprint ${sp.sprintNumber}</span>
                <span class="font-mono-code font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[10px]">${sp.committedSP} PTS</span>
              </div>
              <div class="font-bold text-indigo-600">${sp.name}</div>
              <p class="text-slate-600 text-[11px]">${sp.goal}</p>
              <div class="pt-2 border-t border-slate-200 text-[10px] space-y-1">
                <div class="font-semibold text-slate-700">Stories: ${sp.stories.join(', ')}</div>
                <div class="text-slate-500">Enabler: ${sp.enabler}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Agile Change Control (Slide 11) -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <span>🛡</span> Agile Change Control: Live Tracking Request (Slide 11)
          </h3>
          <span class="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">Scrum Protocol</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span class="font-bold text-slate-800 block mb-1">📢 Context & Pressure:</span>
            <p class="text-slate-600 text-[11px]">Stakeholders requested Live Driver Tracking (13 SP) mid-way during Sprint 2.</p>
          </div>
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span class="font-bold text-rose-700 block mb-1">⚠ Impact Assessment:</span>
            <p class="text-slate-600 text-[11px]">Adding 13 SP mid-sprint would jeopardize the Sprint 2 Goal and payment quality.</p>
          </div>
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span class="font-bold text-emerald-700 block mb-1">✔ Agile Protocol Resolution:</span>
            <p class="text-slate-600 text-[11px]">Negotiated with Product Owner: Planned for Sprint 3 to protect current velocity & quality.</p>
          </div>
        </div>
      </div>

      <!-- Sprint Retrospective Findings (Slide 12) -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 class="text-sm font-extrabold text-slate-900">Sprint Retrospective Findings (Slide 12)</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div class="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
            <h4 class="font-extrabold text-emerald-900 mb-2">What Went Well:</h4>
            <ul class="space-y-1.5 text-emerald-800 text-[11px]">
              <li>• <b>Zero Spillovers:</b> Cart and search were delivered on time.</li>
              <li>• <b>Collaboration:</b> Daily standups cleared blockers rapidly.</li>
            </ul>
          </div>
          <div class="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200">
            <h4 class="font-extrabold text-rose-900 mb-2">What Could Improve:</h4>
            <ul class="space-y-1.5 text-rose-800 text-[11px]">
              <li>• <b>Sandbox Latency:</b> Payment testing delayed when 3rd-party sandbox was offline.</li>
              <li>• <b>Map Complexity:</b> Socket connection spikes during testing.</li>
            </ul>
          </div>
          <div class="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200">
            <h4 class="font-extrabold text-indigo-900 mb-2">Action Items:</h4>
            <ul class="space-y-1.5 text-indigo-800 text-[11px]">
              <li>• <b>Mock Stubs:</b> Decouple internal QA from 3rd-party sandboxes.</li>
              <li>• <b>Spike Sprints:</b> Reserve 3 SP for architecture research on live tracking.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// TAB 4: DEFECT LOG & BUG-104 (Slide 10)
// -------------------------------------------------------------
function renderDefectsTab(container) {
  const defect = agileState.defectLogs[0];

  container.innerHTML = `
    <div class="space-y-5">
      <div class="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-black uppercase text-rose-800 bg-rose-200 px-2 py-0.5 rounded">${defect.severity}</span>
          <h3 class="text-base font-extrabold text-slate-900 mt-1">${defect.id}: ${defect.title}</h3>
        </div>
        <span class="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
          ✔ ${defect.status}
        </span>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5 space-y-4 text-xs">
        <div>
          <span class="font-bold text-slate-800 block mb-1">Reproduction Steps:</span>
          <p class="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono-code">${defect.description}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
            <span class="font-bold text-rose-700">Root Cause:</span>
            <p class="text-slate-700">${defect.rootCause}</p>
          </div>
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
            <span class="font-bold text-emerald-700">Remediation:</span>
            <p class="text-slate-700">${defect.remediation}</p>
          </div>
        </div>

        <div class="bg-indigo-50/70 p-3 rounded-lg border border-indigo-100 text-indigo-900">
          <span class="font-bold">Regression & Verification:</span>
          <p class="mt-0.5">${defect.regression}</p>
        </div>

        <div class="pt-2">
          <button onclick="triggerDemo('BUG-104')" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition">
            <span>⚡ Run Interactive BUG-104 Verification in Storefront</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// TAB 5: TEAM MEMBER CONTRIBUTIONS (Slide 1)
// -------------------------------------------------------------
function renderTeamTab(container) {
  const team = agileState.project.team;

  container.innerHTML = `
    <div class="space-y-4">
      <div class="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
        <div>
          <h3 class="text-sm font-extrabold">Agile Team Engineering Contributions (Slide 1)</h3>
          <p class="text-xs text-slate-400">Department of Computer Science & Engineering - Final Jury Evaluation</p>
        </div>
        <span class="text-xs font-mono-code bg-white/10 px-2.5 py-1 rounded">5 Engineers</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        ${team.map(member => `
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2 hover:border-indigo-300 transition">
            <div class="flex items-center justify-between">
              <h4 class="font-extrabold text-sm text-slate-900">${member.name}</h4>
              <span class="font-mono-code text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Roll #${member.rollNo}</span>
            </div>
            <div class="font-semibold text-indigo-600">${member.role}</div>
            <p class="text-slate-600 text-[11px] bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed">
              <b>Primary Module:</b> ${member.module}
            </p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
