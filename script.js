// ===== CONFIG & STATE =====
const CONFIG = {
    PASS: "1234", // Смени пароль здесь
    SAVE_KEY: "iplanner_pro_data"
};

let state = {
    schedule: [],
    tasks: [],
    notes: [],
    photos: [],
    lastSync: new Date().toISOString()
};

// ===== AUTH SYSTEM =====
function checkPass() {
    const val = document.getElementById('pass-input').value;
    const error = document.getElementById('auth-error');
    if (val === CONFIG.PASS) {
        document.body.classList.remove('locked');
        document.getElementById('lockscreen').classList.remove('show');
        init();
    } else {
        error.style.display = 'block';
        document.querySelector('.auth-modal').classList.add('shake');
        setTimeout(() => document.querySelector('.auth-modal').classList.remove('shake'), 500);
    }
}

// ===== AUTO-SAVE ENGINE =====
function save() {
    state.lastSync = new Date().toISOString();
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(state));
    
    // Визуальный статус "Синхронизировано"
    const status = document.getElementById('sync-status');
    status.textContent = "○ Сохранение...";
    setTimeout(() => {
        status.textContent = "● Синхронизировано";
    }, 800);
}

function load() {
    const data = localStorage.getItem(CONFIG.SAVE_KEY);
    if (data) {
        state = JSON.parse(data);
    }
}

// ===== NAVIGATION (iOS Style) =====
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const sectionId = link.dataset.section;
        
        // Плавное переключение
        document.querySelectorAll('.section').forEach(s => {
            s.style.opacity = '0';
            setTimeout(() => s.classList.remove('active'), 200);
        });

        setTimeout(() => {
            const activeSection = document.getElementById('section-' + sectionId);
            activeSection.classList.add('active');
            setTimeout(() => activeSection.style.opacity = '1', 50);
        }, 210);

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// ===== SCHEDULE (Dynamic Rows) =====
function getAllTimes() {
    const times = new Set();
    state.schedule.forEach(l => times.add(l.time));
    return Array.from(times).sort();
}

function renderSchedule() {
    const table = document.getElementById('schedule-table');
    table.innerHTML = '';
    const allTimes = getAllTimes();

    allTimes.forEach(time => {
        const row = document.createElement('div');
        row.className = 'schedule-row ios-item';
        row.innerHTML = `<div class="schedule-time-cell">${time}</div>`;

        for (let day = 0; day < 5; day++) {
            const cell = document.createElement('div');
            cell.className = 'schedule-cell';
            const lesson = state.schedule.find(l => l.day === day && l.time === time);
            if (lesson) {
                cell.innerHTML = `
                    <div class="lesson-card" style="background:${lesson.color}">
                        ${lesson.name}
                        <button onclick="deleteLesson('${lesson.id}')">✕</button>
                    </div>`;
            }
            row.appendChild(cell);
        }
        table.appendChild(row);
    });
}

function saveLesson() {
    const name = document.getElementById('lesson-name').value;
    const time = document.getElementById('lesson-time').value;
    const day = parseInt(document.getElementById('lesson-day').value);

    if(!name || !time) return;

    state.schedule.push({
        id: Date.now().toString(),
        name, time, day,
        color: selectedColor || '#6366f1'
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

// ===== NOTES (Live Input) =====
function addNote() {
    const newNote = {
        id: Date.now().toString(),
        title: '',
        body: '',
        createdAt: new Date().toISOString()
    };
    state.notes.unshift(newNote);
    save();
    renderNotes();
}

function renderNotes() {
    const grid = document.getElementById('notes-grid');
    grid.innerHTML = '';
    state.notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card ios-card';
        card.innerHTML = `
            <input type="text" value="${note.title}" placeholder="Заголовок" oninput="updateNote('${note.id}', 'title', this.value)">
            <textarea placeholder="Текст..." oninput="updateNote('${note.id}', 'body', this.value)">${note.body}</textarea>
            <button class="delete-note" onclick="deleteNote('${note.id}')">✕</button>
        `;
        grid.appendChild(card);
    });
}

function updateNote(id, field, value) {
    const note = state.notes.find(n => n.id === id);
    if(note) {
        note[field] = value;
        save(); // Автосохранение при каждом символе
    }
}

function deleteNote(id) {
    state.notes = state.notes.filter(n => n.id !== id);
    save();
    renderNotes();
}

// ===== INIT =====
function init() {
    load();
    renderSchedule();
    renderNotes();
    // Инициализация остальных функций...
    
    // Установка даты
    const d = new Date();
    document.getElementById('current-date').textContent = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'short' });
}

// Если пароль не нужен для теста, раскомментируй:
// window.onload = init;
