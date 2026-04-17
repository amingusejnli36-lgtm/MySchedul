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
    // close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
  });
});

// Mobile burger
document.getElementById('burgerBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
});

document.getElementById('overlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
});

// ===== DATE =====
function setDate() {
  const d = new Date();
  const days = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  document.getElementById('current-date').textContent =
    days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()];
}

// ===== SCHEDULE =====
const TIMES = [
  '8:00 - 8:45',
  '8:55 - 9:40',
  '9:55 - 10:40',
  '10:55 - 11:40',
  '12:00 - 12:45',
  '13:00 - 13:45',
  '13:55 - 14:40',
];

function renderSchedule() {
  const table = document.getElementById('schedule-table');
  table.innerHTML = '';

  TIMES.forEach((time, slot) => {
    const row = document.createElement('div');
    row.className = 'schedule-row';

    const timeCell = document.createElement('div');
    timeCell.className = 'schedule-time-cell';
    timeCell.textContent = time.split(' - ')[0];
    row.appendChild(timeCell);

    for (let day = 0; day < 5; day++) {
      const cell = document.createElement('div');
      cell.className = 'schedule-cell';

      const lesson = state.schedule.find(l => l.day === day && l.slot === slot);
      if (lesson) {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.style.background = lesson.color;
        card.style.color = '#fff';
        card.innerHTML = `
          <span class="lesson-name">${lesson.name}</span>
          <span class="lesson-time-label">${time}</span>
          <button class="lesson-delete" onclick="deleteLesson('${lesson.id}')">✕</button>
        `;
        cell.appendChild(card);
      }
      row.appendChild(cell);
    }

    table.appendChild(row);
  });

  document.getElementById('schedule-empty').style.display =
    state.schedule.length === 0 ? 'block' : 'none';
}

function openScheduleModal() {
  document.getElementById('scheduleModal').classList.add('show');
}

function closeScheduleModal() {
  document.getElementById('scheduleModal').classList.remove('show');
  document.getElementById('lesson-name').value = '';
  document.getElementById('lesson-time').value = '';
}

function selectColor(el) {
  document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedColor = el.dataset.color;
}

function saveLesson() {
  const name = document.getElementById('lesson-name').value.trim();
  const time = document.getElementById('lesson-time').value.trim();
  const day = parseInt(document.getElementById('lesson-day').value);

  if (!name) { document.getElementById('lesson-name').focus(); return; }

  // Find slot by time or assign next available
  let slot = 0;
  if (time) {
    const matchIdx = TIMES.findIndex(t => t.startsWith(time.split(' ')[0]));
    if (matchIdx >= 0) slot = matchIdx;
    else slot = state.schedule.filter(l => l.day === day).length % TIMES.length;
  } else {
    const taken = state.schedule.filter(l => l.day === day).map(l => l.slot);
    for (let i = 0; i < TIMES.length; i++) {
      if (!taken.includes(i)) { slot = i; break; }
    }
  }

  // Check if slot is taken
  const existing = state.schedule.find(l => l.day === day && l.slot === slot);
  if (existing) {
    alert('Это время уже занято! Удали существующий урок или выбери другое время.');
    return;
  }

  state.schedule.push({
    id: Date.now().toString(),
    name,
    time: time || TIMES[slot],
    day,
    slot,
    color: selectedColor,
  });

  save();
  renderSchedule();
  closeScheduleModal();
}

function deleteLesson(id) {
  state.schedule = state.schedule.filter(l => l.id !== id);
  save();
  renderSchedule();
}

// ===== TASKS =====
function renderTasks() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';

  let filtered = state.tasks;
  if (currentFilter === 'active') filtered = state.tasks.filter(t => !t.done);
  if (currentFilter === 'done') filtered = state.tasks.filter(t => t.done);

  filtered.forEach(task => {
    const item = document.createElement('div');
    item.className = 'task-item' + (task.done ? ' done' : '');
    item.innerHTML = `
      <div class="task-checkbox ${task.done ? 'checked' : ''}" onclick="toggleTask('${task.id}')">
        ${task.done ? '✓' : ''}
      </div>
      <span class="task-text">${escapeHtml(task.text)}</span>
      <span class="task-priority-badge priority-${task.priority}">${task.priority === 'high' ? 'Важная' : task.priority === 'low' ? 'Низкая' : ''}</span>
      <button class="task-delete-btn" onclick="deleteTask('${task.id}')">✕</button>
    `;
    list.appendChild(item);
  });

  const done = state.tasks.filter(t => t.done).length;
  document.getElementById('tasks-stats').textContent = done + ' / ' + state.tasks.length + ' выполнено';
  document.getElementById('tasks-empty').style.display = filtered.length === 0 ? 'block' : 'none';
}

function addTask() {
  const input = document.getElementById('task-input');
  const priority = document.getElementById('task-priority').value;
  const text = input.value.trim();
  if (!text) { input.focus(); return; }

  state.tasks.unshift({ id: Date.now().toString(), text, done: false, priority, createdAt: new Date().toISOString() });
  input.value = '';
  save();
  renderTasks();
}

function toggleTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; save(); renderTasks(); }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  save();
  renderTasks();
}

function filterTasks(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

// ===== NOTES =====
function renderNotes() {
  const grid = document.getElementById('notes-grid');
  grid.innerHTML = '';

  state.notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';
    const date = new Date(note.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    card.innerHTML = `
      <div class="note-header">
        <input class="note-title-input" placeholder="Заголовок..." value="${escapeHtml(note.title)}" oninput="updateNote('${note.id}', 'title', this.value)">
        <button class="note-delete" onclick="deleteNote('${note.id}')">✕</button>
      </div>
      <textarea class="note-body-input" placeholder="Текст заметки...">${escapeHtml(note.body)}</textarea>
      <div class="note-date">${date}</div>
    `;

    // save on textarea change
    card.querySelector('textarea').addEventListener('input', function() {
      updateNote(note.id, 'body', this.value);
    });

    grid.appendChild(card);
  });

  document.getElementById('notes-empty').style.display = state.notes.length === 0 ? 'block' : 'none';
}

function addNote() {
  state.notes.unshift({ id: Date.now().toString(), title: '', body: '', createdAt: new Date().toISOString() });
  save();
  renderNotes();
  // focus first input
  setTimeout(() => {
    const first = document.querySelector('.note-title-input');
    if (first) first.focus();
  }, 100);
}

function updateNote(id, field, value) {
  const note = state.notes.find(n => n.id === id);
  if (note) { note[field] = value; save(); }
}

function deleteNote(id) {
  state.notes = state.notes.filter(n => n.id !== id);
  save();
  renderNotes();
}

// ===== PHOTOS =====
function renderPhotos() {
  const gallery = document.getElementById('photo-gallery');
  gallery.innerHTML = '';

  state.photos.forEach(photo => {
    const item = document.createElement('div');
    item.className = 'photo-item';
    item.innerHTML = `
      <img src="${photo.data}" alt="${escapeHtml(photo.name)}" onclick="openPhotoModal('${photo.id}')">
      <button class="photo-delete-overlay" onclick="deletePhoto(event, '${photo.id}')">✕</button>
    `;
    gallery.appendChild(item);
  });

  document.getElementById('photos-empty').style.display = state.photos.length === 0 ? 'block' : 'none';
}

function addPhotos(input) {
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

// Close modals on backdrop click
document.getElementById('scheduleModal').addEventListener('click', function(e) {
  if (e.target === this) closeScheduleModal();
});
document.getElementById('photoModal').addEventListener('click', function(e) {
  if (e.target === this) closePhotoModal();
});

// ===== UTILS =====
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== INIT =====
load();
setDate();
renderSchedule();
renderTasks();
renderNotes();
renderPhotos();
