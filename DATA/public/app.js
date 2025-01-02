//const SKILLS_SERVICE_URL = 'http://localhost:3050/skills';
const SKILLS_SERVICE_URL = '/skills';

// public/app.js
class MentalTracker {
    constructor() {
        this.currentView = 'main';
        this.currentSkill = null;
        
        // DOM элементы
        this.mainContent = document.getElementById('mainContent');
        this.backButton = document.getElementById('backButton');
        this.pageTitle = document.getElementById('pageTitle');
        
        // Привязка обработчиков
        this.backButton.addEventListener('click', () => this.showMainView());
    }

    // async init() {
    //     await this.loadSkills();
    //     console.log('-- init()' + this.skills);
    //     this.render();
    // }

    async init() {
        await Promise.all([
            this.loadSkills(),
            this.loadActivities()
        ]);
        console.log('--+ init()' + this.skills);
        this.render();
    }

    async loadActivities() {
        try { 
            //const response = await fetch('http://localhost:3050/activities');
            const response = await fetch('/activities');
            this.activities = await response.json();
        } catch (error) {
            console.error('Error loading activities:', error);
            this.activities = {};
        }
    }

    async addActivity(skillCode, activityId, notes) {
        const response = await fetch(`${SKILLS_SERVICE_URL}/${skillCode}/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                activityId,
                notes
            })
        });
        return await response.json();
    }

    showAddActivityModal() {
        const modal = document.getElementById('activityModal');
        const activitySelect = document.getElementById('activitySelect');
        
        // Очищаем и заполняем список активностей
        activitySelect.innerHTML = '<option value="">Выберите действие</option>';
        
        Object.entries(this.activities)
            .filter(([_, activity]) => activity.skill_code === this.currentSkill.code)
            .forEach(([id, activity]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = `${activity.name} (+${activity.points} очков)`;
                activitySelect.appendChild(option);
            });
        
        modal.style.display = 'block';
    }

    hideAddActivityModal() {
        const modal = document.getElementById('activityModal');
        modal.style.display = 'none';
    }

    async handleActivitySubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const activityId = form.activity.value;
        const notes = form.notes.value;

        if (!activityId) {
            alert('Пожалуйста, выберите действие');
            return;
        }

        try {
            await this.addActivity(this.currentSkill.code, activityId, notes);
            this.hideAddActivityModal();
            
            // Обновляем данные навыка
            this.currentSkill = await this.loadSkillDetails(this.currentSkill.code);
            this.render();
        } catch (error) {
            console.error('Error adding activity:', error);
            alert('Произошла ошибка при добавлении активности');
        }
    }

    // newActivityModal

    showNewActivityModal() {
        const modal = document.getElementById('newActivityModal');
        modal.style.display = 'block';
        // Очищаем форму
        document.getElementById('newActivityForm').reset();
        // this.hideAddActivityModal();
    }

    hideNewActivityModal() {
        const modal = document.getElementById('newActivityModal');
        modal.style.display = 'none';
        // Очищаем форму
        document.getElementById('newActivityForm').reset();
    }


    async handleNewActivitySubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        //const activityId = form.activity.value;
        //const notes = form.notes.value;
        // alert('Новая активность создана');

        const name = form.activityName.value;
        const description = form.activityDescription.value;
        const points = form.activityPoints.value;

        try {
            console.log('---+ handleNewActivitySubmit() ');
            const response = await fetch('/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    description,
                    points,
                    skill_code: this.currentSkill.code
                    // name: "+Цифровой рисунок",
                    // description: "Создание цифрового рисунка в графическом редакторе",
                    // points: 20,
                    // skill_code: "drawing"

                })
            });

            if (!response.ok) {
                throw new Error('Error creating NEW activity');
            }

            // перегружаем активности
            await Promise.all([
                this.loadActivities()
            ]);

            // Закрываем модальное окно и показываем сообщение об успехе
            this.hideNewActivityModal();
            alert('Активность успешно создана!');
        } catch (error) {
            console.error('Error adding NEW activity:', error);
            alert('Произошла ошибка при добавлении NEW активности');
        }
    }


//
// Функции для работы с сервисом настроек
//    
async loadSkills() {
    try {
        const response = await fetch(`${SKILLS_SERVICE_URL}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Loaded skills data:', data);  // Отладочный вывод
        this.skills = data;
    } catch (error) {
        console.error('Error loading skills:', error);
        this.skills = [];
    }
}

    async loadSkillDetails(code) {
        const response = await fetch(`${SKILLS_SERVICE_URL}/${code}`);
        return await response.json();
    }

    render() {
        if (this.currentView === 'main') {
            this.renderMainView();
        } else {
            this.renderSkillView();
        }
    }

    renderMainView() {
        this.backButton.style.display = 'none';
        this.pageTitle.textContent = 'Ментальный Трекер';
        
        const grid = document.createElement('div');
        grid.className = 'skills-grid';
        
        console.log('-- renderMainView()' + this.skills);

        grid.innerHTML = this.skills.map(skill => `
            <div class="skill-card">
                <div class="skill-header">
                    <div class="skill-icon">
                        ${this.getSkillIcon(skill.code)}
                    </div>
                    <span class="skill-level">Уровень ${skill.level}</span>
                </div>
                
                <h2>${skill.name}</h2>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${skill.progress}%"></div>
                </div>
                
                <button class="details-button" data-code="${skill.code}">
                    Подробнее
                </button>
            </div>
        `).join('');
        
        grid.addEventListener('click', (e) => {
            if (e.target.classList.contains('details-button')) {
                this.showSkillView(e.target.dataset.code);
            }
        });
        
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(grid);
    }

    async showSkillView(code) {
        this.currentView = 'skill';
        this.currentSkill = await this.loadSkillDetails(code);
        console.log('this.currentSkill '+ this.currentSkill);
        this.backButton.style.display = 'block';
        this.pageTitle.textContent = this.currentSkill.name;
        this.render();
    }


    renderSkillView() {
        const skill = this.currentSkill;
        const detail = document.createElement('div');
        detail.className = 'skill-detail';
        
        // Проверяем значение прогресса
        const progress = typeof skill.progress === 'number' ? skill.progress : 0;
        console.log('Progress value:', progress);
        
        detail.innerHTML = `
            <div class="skill-header">
                <div>
                    <div class="skill-icon">
                        ${this.getSkillIcon(skill.code)}
                    </div>
                    <h2>Уровень ${skill.level}</h2>
                    <p>До следующего уровня: ${progress}% (${skill.currentPoints}) очков</p>
                </div>
                <button class="btn btn-primary" onclick="app.showNewActivityModal()">
                    + Создать активность
                </button>
                <button class="btn btn-primary" onclick="app.showAddActivityModal()">
                    + Добавить активность
                </button>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            
            <h3>История</h3>
            <div class="history-list">
                ${skill.history.map(item => {
                    const activity = this.activities[item.activityId];
                    return `
                        <div class="history-item">
                            <div>
                                <h4>${activity ? activity.name : 'Активность'}</h4>
                                <p class="notes">${item.notes}</p>
                                <p class="timestamp">${item.timestamp}</p>
                            </div>
                            <span class="points-badge">+${item.points} очков</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(detail);
    }
    showMainView() {
        this.currentView = 'main';
        this.currentSkill = null;
        this.render();
    }

    getSkillIcon(code) {
        const icons = {
            drawing: '✏️',
            music: '🎵',
            willpower: '🧠'
        };
        return icons[code] || '📚';
    }
}


let app = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    app = new MentalTracker();
    app.init();
});