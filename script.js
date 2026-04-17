// ===== STATE =====
let state = {
  schedule: [],
  tasks: [],
  notes: [],
  photos: [],
};

let selectedColor = '#4f46e5';
let currentFilter = 'all';

// ===== LOAD / SAVE =====
function load() {
  const saved = localStorage.getItem('planner_v1');
  if (saved) {
    try { state = JSON.parse(saved); } catch(e) {}
  }
}

function save() {
  localStorage.setItem('planner_v1', JSON.stringify(state));
}

// ===== NAVIGATION =====
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const section = link.dataset.section;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    link.classList.add('active');
    document.getElementById('section-' + section).classList.add('active');
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
  });
});

document.getElementById('burgerBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
});

document.getElementById('overlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
});

// ===== SCHEDULE (НОВАЯ ЛОГИКА) =====

function getAllTimes() {
  const times = new Set();
  state.schedule.forEach(l => times.add(l.time));
  // Сортировка по алфавиту/числам
  return Array.from(times).sort((a, b) => a.localeCompare(b));
}

function openScheduleModal() {
  document.getElementById('scheduleModal').classList.add('show');
}

function closeScheduleModal() {
  document.getElementById('scheduleModal').classList.remove('show');
}

function selectColor(el) {
  document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
  el.classList.add('selected');
  selectedColor = el.dataset.color;
}

function saveLesson() {
  const nameInput = document.getElementById('lesson-name');
  const timeInput = document.getElementById('lesson-time'); 
  const dayInput = document.getElementById('lesson-day');

  const name = nameInput.value.trim();
  const time = timeInput.value.trim();
  const day = parseInt(dayInput.value);

  if (!name) { nameInput.focus(); return; }
  if (!time) { timeInput.focus(); return; }

  state.schedule.push({
    id: Date.now().toString(),
    name: name,
    time: time, 
    day: day,
    color: selectedColor,
  });

  save();
  renderSchedule();
  closeScheduleModal();

  nameInput.value = '';
  timeInput.value = '';
}

function deleteLesson(id) {
  state.schedule = state.schedule.filter(l => l.id !== id);
  save();
  renderSchedule();
}

function renderSchedule() {
  const table = document.getElementById('schedule-table');
  if (!table) return;
  table.innerHTML = '';
  
  const allTimes = getAllTimes();

  allTimes.forEach((time) => {
    const row = document.createElement('div');
    row.className = 'schedule-row';

    const timeCell = document.createElement('div');
    timeCell.className = 'schedule-time-cell';
    timeCell.textContent = time; 
    row.appendChild(timeCell);

    for (let day = 0; day < 5; day++) {
      const cell = document.createElement('div');
      cell.className = 'schedule-cell';

      const lesson = state.schedule.find(l => l.day === day && l.time === time);
      if (lesson) {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.style.background = lesson.color;
        card.innerHTML = `
          <span class="lesson-name">${escapeHtml(lesson.name)}</span>
          <button class="lesson-delete" onclick="deleteLesson('${lesson.id}')">✕</button>
        `;
        cell.appendChild(card);
      }
      row.appendChild(cell);
    }
    table.appendChild(row);
  });

  const emptyMsg = document.getElementById('schedule-empty');
  if (emptyMsg) {
    emptyMsg.style.display = state.schedule.length === 0 ? 'block' : 'none';
  }
}

// ===== TASKS =====
function addTask() {
  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if (!text) return;

  state.tasks.push({
    id: Date.now().toString(),
    text: text,
    completed: false,
    important: false
  });

  input.value = '';
  save();
  renderTasks();
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) task.completed = !task.completed;
  save();
  renderTasks();
}

function toggleImportant(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) task.important = !task.important;
  save();
  renderTasks();
  if (document.getElementById('section-important').classList.contains('active')) {
    renderImportant();
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  save();
  renderTasks();
  renderImportant();
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderTasks();
}

function renderTasks() {
  const container = document.getElementById('tasks-list');
  if (!container) return;
  container.innerHTML = '';

  let filtered = state.tasks;
  if (currentFilter === 'active') filtered = state.tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') filtered = state.tasks.filter(t => t.completed);

  filtered.forEach(task => {
    const item = document.createElement('div');
    item.className = `task-item ${task.completed ? 'completed' : ''}`;
    item.innerHTML = `
      <div class="task-check" onclick="toggleTask('${task.id}')">${task.completed ? '✓' : ''}</div>
      <div class="task-text">${escapeHtml(task.text)}</div>
      <div class="task-actions">
        <button class="task-star ${task.important ? 'active' : ''}" onclick="toggleImportant('${task.id}')">★</button>
        <button class="task-del" onclick="deleteTask('${task.id}')">✕</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderImportant() {
  const container = document.getElementById('important-list');
  if (!container) return;
  container.innerHTML = '';

  const important = state.tasks.filter(t => t.important);
  important.forEach(task => {
    const item = document.createElement('div');
    item.className = `task-item ${task.completed ? 'completed' : ''}`;
    item.innerHTML = `
      <div class="task-check" onclick="toggleTask('${task.id}')">${task.completed ? '✓' : ''}</div>
      <div class="task-text">${escapeHtml(task.text)}</div>
      <div class="task-actions">
        <button class="task-star active" onclick="toggleImportant('${task.id}')">★</button>
        <button class="task-del" onclick="deleteTask('${task.id}')">✕</button>
      </div>
    `;
    container.appendChild(item);
  });
}

// ===== PHOTOS =====
function renderPhotos() {
  const container = document.getElementById('photos-grid');
  if (!container) return;
  container.innerHTML = '';

  state.photos.forEach(photo => {
    const item = document.createElement('div');
    item.className = 'photo-item';
    item.onclick = () => openPhotoModal(photo.id);
    item.innerHTML = `
      <img src="${photo.data}" alt="">
      <button class="photo-del" onclick="deletePhoto(event, '${photo.id}')">✕</button>
    `;
    container.appendChild(item);
  });
}

function uploadPhotos(input) {
  const files = Array.from(input.files);
  let loaded = 0;

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      state.photos.push({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        data: e.target.result,
      });
      loaded++;
      if (loaded === files.length) { save(); renderPhotos(); }
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function deletePhoto(e, id) {
  e.stopPropagation();
  state.photos = state.photos.filter(p => p.id !== id);
  save();
  renderPhotos();
}

function openPhotoModal(id) {
  const photo = state.photos.find(p => p.id === id);
  if (!photo) return;
  document.getElementById('photo-preview').src = photo.data;
  document.getElementById('photoModal').classList.add('show');
}

function closePhotoModal() {
  document.getElementById('photoModal').classList.remove('show');
}

// ===== UTILS =====
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== INIT =====
window.onload = () => {
  load();
  renderSchedule();
  renderTasks();
  renderImportant();
  renderPhotos();
};
