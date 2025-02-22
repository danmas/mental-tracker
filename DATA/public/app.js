﻿//const SKILLS_SERVICE_URL = 'http://localhost:3050/skills';
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


        // ... существующий код ...

        this.modalDrag = {
            element: null,
            offsetX: 0,
            offsetY: 0,
            isDragging: false
        };

        document.addEventListener('mousedown', (e) => this.handleModalMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleModalMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleModalMouseUp(e));

        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    showLoading() {
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }


    handleModalMouseDown(e) {
        if (e.target.classList.contains('modal-header')) {
            this.modalDrag.element = e.target.closest('.modal');
            if (this.modalDrag.element) {
                this.modalDrag.offsetX = e.clientX - this.modalDrag.element.offsetLeft;
                this.modalDrag.offsetY = e.clientY - this.modalDrag.element.offsetTop;
                this.modalDrag.isDragging = true;
            }
        }
    }

    handleModalMouseMove(e) {
        if (this.modalDrag.isDragging && this.modalDrag.element) {
            this.modalDrag.element.style.left = `${e.clientX - this.modalDrag.offsetX}px`;
            this.modalDrag.element.style.top = `${e.clientY - this.modalDrag.offsetY}px`;
        }
    }

    handleModalMouseUp(e) {
        this.modalDrag.isDragging = false;
        this.modalDrag.element = null;
    }
    //}

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


    // async handleActivitySubmit(event) {
    //     event.preventDefault();

    //     const form = event.target;
    //     const activityId = form.activity.value;
    //     const notes = form.notes.value;

    //     if (!activityId) {
    //         alert('Пожалуйста, выберите действие');
    //         return;
    //     }

    //     try {
    //         await this.addActivity(this.currentSkill.code, activityId, notes);
    //         this.hideAddActivityModal();

    //         // Обновляем данные навыка
    //         this.currentSkill = await this.loadSkillDetails(this.currentSkill.code);
    //         this.render();
    //     } catch (error) {
    //         console.error('Error adding activity:', error);
    //         alert('Произошла ошибка при добавлении активности');
    //     }
    // }

    // newActivityModal

    async handleActivitySubmit(event) {
        event.preventDefault();
        this.showLoading();
    
        const form = event.target;
        const historyId = form.historyId.value;
        const activityId = form.activity.value;
        const notes = form.notes.value;
        const date = form.date.value; // Получаем выбранную дату
        const time = form.time.value; // Получаем выбранное время
        const points = form.points.value;
    
        if (!activityId) {
            alert('Пожалуйста, выберите действие');
            return;
        }
    
        try {
            let response;
            if (historyId) {
                // Режим редактирования
                response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history/${historyId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        activityId,
                        notes,
                        points: parseInt(points),
                        timestamp: this.formatDateTime(date, time) // Используем выбранные дату и время
                    })
                });
            } else {
                // Режим добавления
                response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        activityId,
                        notes,
                        points: parseInt(points),
                        timestamp: this.formatDateTime(date, time) // Используем выбранные дату и время
                    })
                });
            }
    
            if (!response.ok) {
                throw new Error('Failed to submit activity');
            }
    
            // Обновляем данные навыка
            this.currentSkill = await this.loadSkillDetails(this.currentSkill.code);
            this.render();
            this.hideActivityFormModal();
        } catch (error) {
            console.error('Error submitting activity:', error);
            alert('Произошла ошибка при добавлении/редактировании активности');
        } finally {
            this.hideLoading();
        }
    }
    

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
        this.showLoading();
        try {
            const response = await fetch(`${SKILLS_SERVICE_URL}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            this.skills = data;
        } catch (error) {
            console.error('Error loading skills:', error);
            this.skills = [];
        } finally {
            this.hideLoading();
        }
    }

    async loadSkillDetails(code) {
        this.showLoading();
        try {
            const response = await fetch(`${SKILLS_SERVICE_URL}/${code}`);
            return await response.json();
        } finally {
            this.hideLoading();
        }
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

        grid.innerHTML = this.skills.map(skill => `
            <div class="skill-card">
                <div class="skill-header">
                    <div class="skill-icon">
                        ${this.getSkillIcon(skill.code)}
                    </div>
                    <span class="skill-level">Уровень ${skill.level} [${skill.progress}%]</span>
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
        this.backButton.style.display = 'block';
        this.pageTitle.textContent = this.currentSkill.name;
        this.render();
    }



    //-- NEW-3 
    // Добавим новые методы в класс MentalTracker
    groupHistoryByDays(history) {
        const groups = {};

        history.forEach(item => {
            // Получаем дату без времени
            const datePart = item.timestamp.split('-')[0];
            if (!groups[datePart]) {
                groups[datePart] = [];
            }
            groups[datePart].push(item);
        });

        // Сортируем даты в обратном порядке
        return Object.entries(groups)
            .sort(([dateA], [dateB]) => {
                const [dayA, monthA, yearA] = dateA.split('.');
                const [dayB, monthB, yearB] = dateB.split('.');
                return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
            });
    }

    // async handleActivityEdit(historyId, activityId, notes, date, time, points) {
    //     try {
    //         const response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history/${historyId}`, {
    //             method: 'PUT',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({
    //                 activityId,
    //                 notes,
    //                 points: parseInt(points),
    //                 timestamp: this.formatDateTime(date, time)
    //             })
    //         });

    //         if (!response.ok) throw new Error('Failed to update activity');

    //         // Получаем обновленные данные навыка
    //         const skillData = await this.loadSkillDetails(this.currentSkill.code);

    //         // Обновляем текущий навык новыми данными
    //         this.currentSkill = skillData;

    //         // Обновляем общий список навыков
    //         await this.loadSkills();

    //         // Обновляем отображение
    //         this.render();
    //         this.hideEditActivityModal();
    //     } catch (error) {
    //         console.error('Error updating activity:', error);
    //         alert('Произошла ошибка при обновлении активности');
    //     }
    // }

    // showEditActivityModal(historyItem) {
    //     const modal = document.getElementById('editActivityModal');
    //     const form = document.getElementById('editActivityForm');
    //     const activitySelect = form.querySelector('#editActivitySelect');

    //     // Заполняем список активностей
    //     activitySelect.innerHTML = '<option value="">Выберите действие</option>';
    //     Object.entries(this.activities)
    //         .filter(([_, activity]) => activity.skill_code === this.currentSkill.code)
    //         .forEach(([id, activity]) => {
    //             const option = document.createElement('option');
    //             option.value = id;
    //             option.textContent = `${activity.name} (+${activity.points} очков)`;
    //             option.selected = id === historyItem.activityId;
    //             activitySelect.appendChild(option);
    //         });

    //     // Заполняем заметки
    //     form.querySelector('#editNotesInput').value = historyItem.notes;

    //     // Заполняем очки
    //     form.querySelector('#editPointsInput').value = historyItem.points;

    //     // Заполняем дату и время
    //     const [datePart, timePart] = historyItem.timestamp.split('-');
    //     const [day, month, year] = datePart.split('.');
    //     const [hours, minutes, seconds] = timePart ? timePart.split(':') : ['00', '00', '00'];

    //     form.querySelector('#editDateInput').value = `${year}-${month}-${day}`;
    //     form.querySelector('#editTimeInput').value = `${hours}:${minutes}`;

    //     // Сохраняем ID записи для последующего обновления
    //     form.dataset.historyId = historyItem.id;

    //     modal.style.display = 'block';
    // }

    // hideEditActivityModal() {
    //     const modal = document.getElementById('editActivityModal');
    //     modal.style.display = 'none';
    // }


    showActivityFormModal(historyItemString = null) {
        const modal = document.getElementById('activityFormModal');
        const form = document.getElementById('activityForm');
        const activitySelect = document.getElementById('activitySelect');
        const modalTitle = document.getElementById('activityModalTitle');
        const historyIdInput = form.querySelector('#historyId');
        const pointsInput = form.querySelector('#pointsInput');
        const dateInput = form.querySelector('#dateInput');
        const timeInput = form.querySelector('#timeInput');

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

        // Сбрасываем форму
        form.reset();

        let historyItem = null;
        if (historyItemString) {
            historyItem = historyItemString;
        }

        if (historyItem) {
            // Режим редактирования
            modalTitle.textContent = 'Редактировать активность';
            if (historyIdInput) {
                historyIdInput.value = historyItem.id;
            }
            activitySelect.value = historyItem.activityId;
            form.querySelector('#notesInput').value = historyItem.notes;
            if (pointsInput && historyItem.points !== undefined) {
                pointsInput.value = historyItem.points;
            }

            if (dateInput && historyItem.timestamp) {
                const [datePart, timePart] = historyItem.timestamp.split('-');
                if (datePart) {
                    const [day, month, year] = datePart.split('.');
                    if (day && month && year) {
                        dateInput.value = `${year}-${month}-${day}`;
                    }
                }

                const [hours, minutes, seconds] = timePart ? timePart.split(':') : ['00', '00', '00'];
                timeInput.value = `${hours}:${minutes}`;
            }
        } else {
            // Режим добавления
            modalTitle.textContent = 'Добавить активность';
            if (historyIdInput) {
                historyIdInput.value = '';
            }

            // Устанавливаем текущую дату и время
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            if (dateInput) {
                dateInput.value = `${year}-${month}-${day}`;
            }
            if (timeInput) {
                timeInput.value = `${hours}:${minutes}`;
            }
        }

        modal.style.display = 'block';

        // Обработчик изменения выбора активности
        activitySelect.onchange = () => {
            const selectedActivityId = activitySelect.value;
            if (selectedActivityId && this.activities[selectedActivityId]) {
                pointsInput.value = this.activities[selectedActivityId].points;
            } else {
                pointsInput.value = '';
            }
        };
    }


    hideActivityFormModal() {
        const modal = document.getElementById('activityFormModal');
        modal.style.display = 'none';
    }

    async handleActivitySubmit(event) {
        event.preventDefault();
        this.showLoading();

        const form = event.target;
        const historyId = form.historyId.value;
        const activityId = form.activity.value;
        const notes = form.notes.value;
        const date = form.date.value;
        const time = form.time.value;
        const points = form.points.value;

        if (!activityId) {
            alert('Пожалуйста, выберите действие');
            return;
        }

        try {
            let response;
            if (historyId) {
                // Режим редактирования
                response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history/${historyId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        activityId,
                        notes,
                        points: parseInt(points),
                        timestamp: this.formatDateTime(date, time)
                    })
                });
            } else {
                // Режим добавления
                response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        activityId,
                        notes,
                        points: parseInt(points),
                        timestamp: this.formatDateTime(date, time)
                    })
                });
            }

            if (!response.ok) {
                throw new Error('Failed to submit activity');
            }

            // Обновляем данные навыка
            this.currentSkill = await this.loadSkillDetails(this.currentSkill.code);
            this.render();
            this.hideActivityFormModal();
        } catch (error) {
            console.error('Error submitting activity:', error);
            alert('Произошла ошибка при добавлении/редактировании активности');
        } finally {
            this.hideLoading();
        }
    }


    formatDateTime(date, time) {
        // Преобразуем HTML5 input date (YYYY-MM-DD) в наш формат (DD.MM.YYYY-HH:MM:SS)
        const [year, month, day] = date.split('-');
        const [hours, minutes] = time.split(':');
        return `${day}.${month}.${year}-${hours}:${minutes}:00`;
    }

    toggleDayHistory(date) {
        const content = document.querySelector(`#history-${date.replace(/\./g, '-')}`);
        const icon = document.querySelector(`#icon-${date.replace(/\./g, '-')}`);

        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.textContent = '▼';
        } else {
            content.style.display = 'none';
            icon.textContent = '▶';
        }
    }


    async handleActivityDelete(historyId) {
        if (!confirm('Вы уверены, что хотите удалить эту активность?')) {
            return;
        }

        try {
            const response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history/${historyId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete activity');
            }

            // Обновляем данные навыка
            this.currentSkill = await this.loadSkillDetails(this.currentSkill.code);
            this.render();
        } catch (error) {
            console.error('Error deleting activity:', error);
            alert('Произошла ошибка при удалении активности');
        }
    }

    renderSkillView() {
        const skill = this.currentSkill;
        const detail = document.createElement('div');
        detail.className = 'skill-detail';

        const progress = typeof skill.progress === 'number' ? skill.progress : 0;

        // Группируем историю по дням
        const groupedHistory = this.groupHistoryByDays(skill.history);

        const historyHTML = groupedHistory.map(([date, items]) => {
            const dateId = date.replace(/\./g, '-');
            return `
            <div class="history-day">
                <div class="day-header" onclick="app.toggleDayHistory('${date}')">
                    <span id="icon-${dateId}">▼</span>
                    <h3>${date}</h3>
                    <span class="day-points">+${items.reduce((sum, item) => sum + item.points, 0)} очков</span>
                </div>
                <div id="history-${dateId}">
                    ${items.map(item => {
                const activity = this.activities[item.activityId];
                return `
                         <div class="history-item">
                                <div class="history-item-main">
                                    <h4>${activity ? activity.name : 'Активность'}</h4>
                                    <p class="notes">${item.notes}</p>
                                </div>
                                <div class="history-item-actions">
                                    <p class="timestamp">${item.timestamp.split('-')[1]}</p>
                                    <span class="points-badge">+${item.points} очков</span>
                                    <button class="btn btn-edit" onclick="app.showActivityFormModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                                        ✎
                                    </button>
                                    <button class="btn btn-edit btn-delete" onclick="app.handleActivityDelete('${item.id}')">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                    `;
            }).join('')}
                </div>
            </div>
        `;
        }).join('');

        /*
        <div class="history-item">
            <div class="history-item-main">
                <h4>${activity ? activity.name : 'Активность'}</h4>
                <p class="notes">${item.notes}</p>
            </div>
            <div class="history-item-actions">
                <p class="timestamp">${item.timestamp.split('-')[1]}</p>
                <span class="points-badge">+${item.points} очков</span>
                <button class="btn btn-edit" onclick="app.showActivityFormModal(${JSON.stringify(item).replace(/"/g, '"')})">
                    ✎
                </button>
                <button class="btn btn-edit btn-delete" onclick="app.handleActivityDelete('${item.id}')">
                    🗑️
                </button>
            </div>
        </div>    
        */

        detail.innerHTML = `
        <div class="skill-header">
            <div>
                <div class="skill-icon">
                    ${this.getSkillIcon(skill.code)}
                </div>
                <h2>Уровень ${skill.level}(${progress}%)</h2>
                <p>До следующего уровня: ${progress}% (${skill.currentPoints}) очков</p>
            </div>
            <button class="btn btn-primary" onclick="app.showActivityFormModal()">
                + Добавить активность
            </button>
            <button class="btn btn-primary" onclick="app.showNewActivityModal()">
                + Создать активность
            </button>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        
        <h3>История</h3>
        <div class="history-list">
            ${historyHTML}
        </div>
    `;

        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(detail);
    }
    //-- NEW-3 END

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