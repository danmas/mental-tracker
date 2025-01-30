//const SKILLS_SERVICE_URL = 'http://localhost:3050/skills';
const SKILLS_SERVICE_URL = '/skills';

// public/app.js
class MentalTracker {
    constructor() {
        this.currentView = 'main';
        this.currentSkill = null;
        this.currentUser = null; // Добавляем текущего пользователя

        // Обработчик для кнопки входа
        document.getElementById('loginButton').addEventListener('click', () => this.handleLogin());

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

    async handleLogin() {
        const login = document.getElementById('loginInput').value.trim();
        if (!login) {
            alert('Пожалуйста, введите логин');
            return;
        }
    
        this.currentUser = login;
        localStorage.setItem('currentUser', login); // Сохраняем логин в localStorage
    
        try {
            // Убеждаемся, что файлы данных для пользователя существуют
            await this.ensureUserFilesExist(login);
        } catch (error) {
            console.error('Ошибка при создании файлов данных:', error);
            alert('Произошла ошибка при создании файлов данных');
            return;
        }
    
        // Показываем основной контент
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    
        // Инициализируем приложение для выбранного пользователя
        await this.init();
    }
    
    async ensureUserFilesExist(user) {
        try {
            // Отправляем запрос на сервер для создания файлов данных
            const response = await fetch('/ensureUserFilesExist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user })
            });
    
            if (!response.ok) {
                throw new Error('Ошибка при создании файлов данных');
            }
    
            console.log('Файлы данных для пользователя созданы или уже существуют');
        } catch (error) {
            throw error;
        }
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

    async init() {
        if (!this.currentUser) {
            alert('Пользователь не выбран');
            return;
        }        

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
            const response = await fetch(`/activities?user=${this.currentUser}`);
            this.activities = await response.json();
        } catch (error) {
            console.error('Error loading activities:', error);
            this.activities = {};
        }
    }

    async addActivity(skillCode, activityId, notes) {
        const response = await fetch(`${SKILLS_SERVICE_URL}/${skillCode}/history?user=${this.currentUser}`, {
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

    // async handleActivitySubmit(event) {
    //     event.preventDefault();
    //     this.showLoading();
    
    //     const form = event.target;
    //     const historyId = form.historyId.value;
    //     const activityId = form.activity.value;
    //     const notes = form.notes.value;
    //     const date = form.date.value; // Получаем выбранную дату
    //     const time = form.time.value; // Получаем выбранное время
    //     const points = form.points.value;
    
    //     if (!activityId) {
    //         alert('Пожалуйста, выберите действие');
    //         return;
    //     }
    
    //     try {
    //         let response;
    //         if (historyId) {
    //             // Режим редактирования
    //             response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history/${historyId}`, {
    //                 method: 'PUT',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify({
    //                     activityId,
    //                     notes,
    //                     points: parseInt(points),
    //                     timestamp: this.formatDateTime(date, time) // Используем выбранные дату и время
    //                 })
    //             });
    //         } else {
    //             // Режим добавления
    //             response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history`, {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify({
    //                     activityId,
    //                     notes,
    //                     points: parseInt(points),
    //                     timestamp: this.formatDateTime(date, time) // Используем выбранные дату и время
    //                 })
    //             });
    //         }
    
    //         if (!response.ok) {
    //             throw new Error('Failed to submit activity');
    //         }
    
    //         // Обновляем данные навыка
    //         this.currentSkill = await this.loadSkillDetails(this.currentSkill.code);
    //         this.render();
    //         this.hideActivityFormModal();
    //     } catch (error) {
    //         console.error('Error submitting activity:', error);
    //         alert('Произошла ошибка при добавлении/редактировании активности');
    //     } finally {
    //         this.hideLoading();
    //     }
    // }
    
    // async handleActivitySubmit(event) {
    //     event.preventDefault();
    //     this.showLoading();
    
    //     const form = event.target;
    //     const historyId = form.historyId.value;
    //     const activityId = form.activity.value;
    //     const notes = form.notes.value;
    //     const date = form.date.value; // Получаем выбранную дату
    //     const time = form.time.value; // Получаем выбранное время
    //     const points = form.points.value;
    
    //     if (!activityId) {
    //         alert('Пожалуйста, выберите действие');
    //         return;
    //     }
    
    //     try {
    //         let response;
    //         if (historyId) {
    //             // Режим редактирования
    //             response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history/${historyId}?user=${this.currentUser}`, {
    //                 method: 'PUT',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify({
    //                     activityId,
    //                     notes,
    //                     points: parseInt(points),
    //                     timestamp: this.formatDateTime(date, time) // Используем выбранные дату и время
    //                 })
    //             });
    //         } else {
    //             // Режим добавления
    //             console.log(`this.currentUse: ${this.currentUser}`);
    //             response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history?user=${this.currentUser}`, {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify({
    //                     activityId,
    //                     notes,
    //                     points: parseInt(points),
    //                     timestamp: this.formatDateTime(date, time) // Используем выбранные дату и время
    //                 })
    //             });
    //         }
    
    //         if (!response.ok) {
    //             throw new Error('Failed to submit activity');
    //         }
    
    //         // Обновляем данные навыка
    //         this.currentSkill = await this.loadSkillDetails(this.currentSkill.code);
    //         this.render();
    //         this.hideActivityFormModal();
    //     } catch (error) {
    //         console.error('Error submitting activity:', error);
    //         alert('Произошла ошибка при добавлении/редактировании активности');
    //     } finally {
    //         this.hideLoading();
    //     }
    // }


    // showNewActivityModal() {
    //     const modal = document.getElementById('newActivityModal');
    //     modal.style.display = 'block';
    //     // Очищаем форму
    //     document.getElementById('newActivityForm').reset();
    //     // this.hideAddActivityModal();
    // }
// Добавим метод для переключения полей задачи
showNewActivityModal() {
    const modal = document.getElementById('newActivityModal');
    const form = document.getElementById('newActivityForm');
    const taskFields = document.getElementById('taskFields');
    
    // Очищаем форму
    form.reset();
    
    // Устанавливаем текущую дату как минимальную для срока выполнения
    const today = new Date().toISOString().split('T')[0];
    const dueDateInput = document.getElementById('activityDueDate');
    if (dueDateInput) {
        dueDateInput.min = today;
    }
    
    // Обработчик переключения типа активности
    const radioButtons = form.querySelectorAll('input[name="activityType"]');
    radioButtons.forEach(radio => {
        radio.onchange = (e) => {
            const isTask = e.target.value === 'task';
            taskFields.style.display = isTask ? 'block' : 'none';
        };
    });

    modal.style.display = 'block';
}


async addPoints(points) {
    try {
        // Используем путь, который ведет к существующему обработчику game.addPoints
        const response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/points?user=${this.currentUser}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ points })
        });

        if (!response.ok) {
            throw new Error('Failed to add points');
        }

        // Получаем обновленные данные навыка
        this.currentSkill = await this.loadSkillDetails(this.currentSkill.code);
        this.render();
        
        return this.currentSkill;
    } catch (error) {
        console.error('Error adding points:', error);
        throw error;
    }
}

    hideNewActivityModal() {
        const modal = document.getElementById('newActivityModal');
        modal.style.display = 'none';
        // Очищаем форму
        document.getElementById('newActivityForm').reset();
    }


    // async handleNewActivitySubmit(event) {
    //     event.preventDefault();
    
    //     const form = event.target;
    //     const name = form.activityName.value;
    //     const description = form.activityDescription.value;
    //     const points = form.activityPoints.value;
    
    //     try {
    //         const response = await fetch(`/activities?user=${this.currentUser}`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({
    //                 name,
    //                 description,
    //                 points,
    //                 skill_code: this.currentSkill.code,
    //                 user: this.currentUser // Передаем текущего пользователя
    //             })
    //         });
    
    //         if (!response.ok) {
    //             throw new Error('Error creating NEW activity');
    //         }
    
    //         // Перезагружаем активности
    //         await this.loadActivities();
    //         this.hideNewActivityModal();
    //         alert('Активность успешно создана!');
    //     } catch (error) {
    //         console.error('Error adding NEW activity:', error);
    //         alert('Произошла ошибка при добавлении NEW активности');
    //     }
    // }
    // async handleNewActivitySubmit(event) {
    //     event.preventDefault();
    
    //     const form = event.target;
    //     const name = form.activityName.value;
    //     const description = form.activityDescription.value;
    //     const points = form.activityPoints.value;
    //     const dueDate = form.activityDueDate.value || null;
    
    //     try {
    //         const response = await fetch(`/activities?user=${this.currentUser}`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({
    //                 name,
    //                 description,
    //                 points,
    //                 dueDate,
    //                 skill_code: this.currentSkill.code,
    //                 user: this.currentUser,
    //                 isTask: true,
    //                 isDone: false
    //             })
    //         });
    
    //         if (!response.ok) {
    //             throw new Error('Error creating activity');
    //         }
    
    //         // Если нет срока выполнения, начисляем очки сразу
    //         if (!dueDate) {
    //             await this.addPoints(parseInt(points));
    //         }
    
    //         await this.loadActivities();
    //         this.hideNewActivityModal();
    //         alert('Задача успешно создана!');
    //     } catch (error) {
    //         console.error('Error adding activity:', error);
    //         alert('Произошла ошибка при создании задачи');
    //     }
    // }
    
    // Новый метод для переключения статуса выполнения
    // async handleNewActivitySubmit(event) {
    //     event.preventDefault();
    
    //     const form = event.target;
    //     const name = form.activityName.value;
    //     const description = form.activityDescription.value;
    //     const points = form.activityPoints.value;
    //     const dueDate = form.activityDueDate.value || null;
    
    //     try {
    //         const response = await fetch(`/activities?user=${this.currentUser}`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({
    //                 name,
    //                 description,
    //                 points,
    //                 dueDate,
    //                 skill_code: this.currentSkill.code,
    //                 user: this.currentUser,
    //                 isTask: true,
    //                 isDone: false
    //             })
    //         });
    
    //         if (!response.ok) {
    //             throw new Error('Error creating activity');
    //         }
    
    //         // Если нет срока выполнения, начисляем очки сразу
    //         if (!dueDate) {
    //             await this.addPoints(parseInt(points));
    //         }
    
    //         await this.loadActivities();
    //         this.hideNewActivityModal();
    //         alert('Задача успешно создана!');
    //     } catch (error) {
    //         console.error('Error adding activity:', error);
    //         alert('Произошла ошибка при создании задачи');
    //     }
    // }

    // async handleNewActivitySubmit(event) {
    //     event.preventDefault();
    
    //     const form = event.target;
    //     const name = form.activityName.value;
    //     const description = form.activityDescription.value;
    //     const points = form.activityPoints.value;
    //     const dueDate = form.activityDueDate.value || null;
    
    //     try {
    //         const response = await fetch(`/activities?user=${this.currentUser}`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({
    //                 name,
    //                 description,
    //                 points,
    //                 dueDate,
    //                 skill_code: this.currentSkill.code,
    //                 user: this.currentUser,
    //                 isTask: true,
    //                 isDone: false
    //             })
    //         });
    
    //         if (!response.ok) {
    //             throw new Error('Error creating activity');
    //         }
    
    //         // Если нет срока выполнения, начисляем очки сразу
    //         if (!dueDate) {
    //             await this.addPoints(parseInt(points));
    //         }
    
    //         await this.loadActivities();
    //         this.hideNewActivityModal();
    //         alert('Задача успешно создана!');
    //     } catch (error) {
    //         console.error('Error adding activity:', error);
    //         alert('Произошла ошибка при создании задачи');
    //     }
    // }

    async handleNewActivitySubmit(event) {
        event.preventDefault();
    
        const form = event.target;
        const name = form.activityName.value;
        const description = form.activityDescription.value;
        const points = form.activityPoints.value;
        const activityType = form.activityType.value;
        const isTask = activityType === 'task';
    
        // Получаем значения срока выполнения только если это задача
        let dueDate = null;
        if (isTask && form.activityDueDate.value) {
            const date = form.activityDueDate.value;
            const time = form.activityDueTime.value || '23:59';
            dueDate = `${date}T${time}`;
        }
    
        try {
            const response = await fetch(`/activities?user=${this.currentUser}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    description,
                    points: parseInt(points),
                    dueDate,
                    skill_code: this.currentSkill.code,
                    user: this.currentUser,
                    isTask,
                    isDone: false
                })
            });
    
            if (!response.ok) {
                throw new Error('Error creating activity');
            }
    
            // Если это не задача или задача без срока выполнения, начисляем очки сразу
            if (!isTask || !dueDate) {
                await this.addPoints(parseInt(points));
            }
    
            await this.loadActivities();
            this.hideNewActivityModal();
            alert('Задача успешно создана!');
        } catch (error) {
            console.error('Error adding activity:', error);
            alert('Произошла ошибка при создании задачи');
        }
    }
    
    

//     async toggleTaskCompletion(activityId, isDone) {
//     try {
//         const activity = this.activities[activityId];
//         if (!activity) return;

//         const completedDate = isDone ? new Date().toISOString() : null;
        
//         const response = await fetch(`/activities/${activityId}?user=${this.currentUser}`, {
//             method: 'PATCH',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 isDone,
//                 completedDate
//             })
//         });

//         if (!response.ok) {
//             throw new Error('Failed to update task status');
//         }

//         // Если задача выполнена и у неё был срок выполнения, начисляем очки
//         if (isDone && activity.dueDate) {
//             await this.addPoints(parseInt(activity.points));
//         }

//         await this.loadActivities();
//         this.render();
//     } catch (error) {
//         console.error('Error updating task status:', error);
//         alert('Произошла ошибка при обновлении статуса задачи');
//     }
// }
async toggleTaskCompletion(activityId, isDone) {
    try {
        const activity = this.activities[activityId];
        if (!activity) return;

        const completedDate = isDone ? new Date().toISOString() : null;
        
        const response = await fetch(`/activities/${activityId}?user=${this.currentUser}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                isDone,
                completedDate
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update task status');
        }

        // Если задача выполнена и у неё был срок выполнения, начисляем очки
        if (isDone && activity.dueDate) {
            await this.addPoints(parseInt(activity.points));
        }

        await this.loadActivities();
        this.render();
    } catch (error) {
        console.error('Error updating task status:', error);
        alert('Произошла ошибка при обновлении статуса задачи');
    }
}

    
    async toggleTaskCompletion(activityId, isDone) {
        try {
            const activity = this.activities[activityId];
            if (!activity) return;
    
            const completedDate = isDone ? new Date().toISOString() : null;
            
            const response = await fetch(`/activities/${activityId}?user=${this.currentUser}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    isDone,
                    completedDate
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to update task status');
            }
    
            // Если задача выполнена и у неё был срок выполнения, начисляем очки
            if (isDone && activity.dueDate) {
                await this.addPoints(parseInt(activity.points));
            }
    
            await this.loadActivities();
            this.render();
        } catch (error) {
            console.error('Error updating task status:', error);
            alert('Произошла ошибка при обновлении статуса задачи');
        }
    }
    
    // Обновлённый метод отрисовки активности в истории
    // renderHistoryItem(item) {
    //     const activity = this.activities[item.activityId];
    //     if (!activity) return '';
    
    //     const isDone = activity.isDone;
    //     const dueDate = activity.dueDate ? new Date(activity.dueDate).toLocaleDateString() : '';
    //     const isOverdue = activity.dueDate && !isDone && new Date(activity.dueDate) < new Date();
    
    //     return `
    //         <div class="history-item ${isDone ? 'done' : ''} ${isOverdue ? 'overdue' : ''}">
    //             <div class="history-item-main">
    //                 <h4>${activity.name}</h4>
    //                 <p class="notes">${item.notes}</p>
    //                 ${dueDate ? `<p class="due-date">Срок: ${dueDate}</p>` : ''}
    //             </div>
    //             <div class="history-item-actions">
    //                 <p class="timestamp">${item.timestamp.split('-')[1]}</p>
    //                 <span class="points-badge">+${item.points} очков</span>
    //                 ${activity.isTask ? `
    //                     <label class="task-checkbox">
    //                         <input type="checkbox" 
    //                                ${isDone ? 'checked' : ''} 
    //                                onchange="app.toggleTaskCompletion('${item.activityId}', this.checked)">
    //                         Выполнено
    //                     </label>
    //                 ` : ''}
    //                 <button class="btn btn-edit" onclick='app.showActivityFormModal(${JSON.stringify(item).replace(/'/g, "\\'")})'>
    //                     ✎
    //                 </button>
    //                 <button class="btn btn-edit btn-delete" onclick="app.handleActivityDelete('${item.id}')">
    //                     🗑️
    //                 </button>
    //             </div>
    //         </div>
    //     `;
    // }
// Обновлённый метод отрисовки активности в истории
// renderHistoryItem(item) {
//     const activity = this.activities[item.activityId];
//     if (!activity) return '';

//     const isDone = activity.isDone;
//     const dueDate = activity.dueDate ? new Date(activity.dueDate).toLocaleDateString() : '';
//     const isOverdue = activity.dueDate && !isDone && new Date(activity.dueDate) < new Date();

//     return `
//         <div class="history-item ${isDone ? 'done' : ''} ${isOverdue ? 'overdue' : ''}">
//             <div class="history-item-main">
//                 <h4>${activity.name}</h4>
//                 <p class="notes">${item.notes}</p>
//                 ${dueDate ? `<p class="due-date">Срок: ${dueDate}</p>` : ''}
//             </div>
//             <div class="history-item-actions">
//                 <p class="timestamp">${item.timestamp.split('-')[1]}</p>
//                 <span class="points-badge">+${item.points} очков</span>
//                 ${activity.isTask ? `
//                     <label class="task-checkbox">
//                         <input type="checkbox" 
//                                ${isDone ? 'checked' : ''} 
//                                onchange="app.toggleTaskCompletion('${item.activityId}', this.checked)">
//                         Выполнено
//                     </label>
//                 ` : ''}
//                 <button class="btn btn-edit" onclick='app.showActivityFormModal(${JSON.stringify(item).replace(/'/g, "\\'")})'>
//                     ✎
//                 </button>
//                 <button class="btn btn-edit btn-delete" onclick="app.handleActivityDelete('${item.id}')">
//                     🗑️
//                 </button>
//             </div>
//         </div>
//     `;
// }
// Обновлённый метод отрисовки активности в истории
renderHistoryItem(item) {
    const activity = this.activities[item.activityId];
    if (!activity) return '';

    const isDone = activity.isDone;
    const dueDate = activity.dueDate ? new Date(activity.dueDate).toLocaleDateString() : '';
    const isOverdue = activity.dueDate && !isDone && new Date(activity.dueDate) < new Date();

    return `
        <div class="history-item ${isDone ? 'done' : ''} ${isOverdue ? 'overdue' : ''}">
            <div class="history-item-main">
                <h4>${activity.name}</h4>
                <p class="notes">${item.notes}</p>
                ${dueDate ? `<p class="due-date">Срок: ${dueDate}</p>` : ''}
            </div>
            <div class="history-item-actions">
                <p class="timestamp">${item.timestamp.split('-')[1]}</p>
                <span class="points-badge">+${item.points} очков</span>
                ${activity.isTask ? `
                    <label class="task-checkbox">
                        <input type="checkbox" 
                               ${isDone ? 'checked' : ''} 
                               onchange="app.toggleTaskCompletion('${item.activityId}', this.checked)">
                        Выполнено
                    </label>
                ` : ''}
                <button class="btn btn-edit" onclick='app.showActivityFormModal(${JSON.stringify(item).replace(/'/g, "\\'")})'>
                    ✎
                </button>
                <button class="btn btn-edit btn-delete" onclick="app.handleActivityDelete('${item.id}')">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

async loadSkills() {
        this.showLoading();
        try {
            const response = await fetch(`${SKILLS_SERVICE_URL}?user=${this.currentUser}`); // Передаем текущего пользователя
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
            const response = await fetch(`${SKILLS_SERVICE_URL}/${code}?user=${this.currentUser}`); // Передаем текущего пользователя
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
    // groupHistoryByDays(history) {
    //     const groups = {};

    //     history.forEach(item => {
    //         // Получаем дату без времени
    //         const datePart = item.timestamp.split('-')[0];
    //         if (!groups[datePart]) {
    //             groups[datePart] = [];
    //         }
    //         groups[datePart].push(item);
    //     });

    //     // Сортируем даты в обратном порядке
    //     return Object.entries(groups)
    //         .sort(([dateA], [dateB]) => {
    //             const [dayA, monthA, yearA] = dateA.split('.');
    //             const [dayB, monthB, yearB] = dateB.split('.');
    //             return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
    //         });
    // }
    //-- NEW-3
    // Добавим новые методы в класс MentalTracker
    groupHistoryByDays(history) {
        if (!history || !Array.isArray(history)) {
            return {};
        }

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


    // showActivityFormModal(historyItemString = null) {
    //     const modal = document.getElementById('activityFormModal');
    //     const form = document.getElementById('activityForm');
    //     const activitySelect = document.getElementById('activitySelect');
    //     const modalTitle = document.getElementById('activityModalTitle');
    //     const historyIdInput = form.querySelector('#historyId');
    //     const pointsInput = form.querySelector('#pointsInput');
    //     const dateInput = form.querySelector('#dateInput');
    //     const timeInput = form.querySelector('#timeInput');

    //     // Очищаем и заполняем список активностей
    //     activitySelect.innerHTML = '<option value="">Выберите действие</option>';
    //     Object.entries(this.activities)
    //         .filter(([_, activity]) => activity.skill_code === this.currentSkill.code)
    //         .forEach(([id, activity]) => {
    //             const option = document.createElement('option');
    //             option.value = id;
    //             option.textContent = `${activity.name} (+${activity.points} очков)`;
    //             activitySelect.appendChild(option);
    //         });

    //     // Сбрасываем форму
    //     form.reset();

    //     let historyItem = null;
    //     if (historyItemString) {
    //         historyItem = historyItemString;
    //     }

    //     if (historyItem) {
    //         // Режим редактирования
    //         modalTitle.textContent = 'Редактировать активность';
    //         if (historyIdInput) {
    //             historyIdInput.value = historyItem.id;
    //         }
    //         activitySelect.value = historyItem.activityId;
    //         form.querySelector('#notesInput').value = historyItem.notes;
    //         if (pointsInput && historyItem.points !== undefined) {
    //             pointsInput.value = historyItem.points;
    //         }

    //         if (dateInput && historyItem.timestamp) {
    //             const [datePart, timePart] = historyItem.timestamp.split('-');
    //             if (datePart) {
    //                 const [day, month, year] = datePart.split('.');
    //                 if (day && month && year) {
    //                     dateInput.value = `${year}-${month}-${day}`;
    //                 }
    //             }

    //             const [hours, minutes, seconds] = timePart ? timePart.split(':') : ['00', '00', '00'];
    //             timeInput.value = `${hours}:${minutes}`;
    //         }
    //     } else {
    //         // Режим добавления
    //         modalTitle.textContent = 'Добавить активность';
    //         if (historyIdInput) {
    //             historyIdInput.value = '';
    //         }

    //         // Устанавливаем текущую дату и время
    //         const now = new Date();
    //         const year = now.getFullYear();
    //         const month = String(now.getMonth() + 1).padStart(2, '0');
    //         const day = String(now.getDate()).padStart(2, '0');
    //         const hours = String(now.getHours()).padStart(2, '0');
    //         const minutes = String(now.getMinutes()).padStart(2, '0');

    //         if (dateInput) {
    //             dateInput.value = `${year}-${month}-${day}`;
    //         }
    //         if (timeInput) {
    //             timeInput.value = `${hours}:${minutes}`;
    //         }
    //     }

    //     modal.style.display = 'block';

    //     // Обработчик изменения выбора активности
    //     activitySelect.onchange = () => {
    //         const selectedActivityId = activitySelect.value;
    //         if (selectedActivityId && this.activities[selectedActivityId]) {
    //             pointsInput.value = this.activities[selectedActivityId].points;
    //         } else {
    //             pointsInput.value = '';
    //         }
    //     };
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
        const taskFields = document.getElementById('taskFieldsHistory');
        const dueDateInput = document.getElementById('activityDueDate');
        const dueTimeInput = document.getElementById('activityDueTime');
        const isDoneCheckbox = document.getElementById('isDoneCheckbox');
    
        // Очищаем и заполняем список активностей
        activitySelect.innerHTML = '<option value="">Выберите действие</option>';
        
        // Фильтруем активности в зависимости от выбранного типа
        const updateActivityList = (isTask) => {
            activitySelect.innerHTML = '<option value="">Выберите действие</option>';
            Object.entries(this.activities)
                .filter(([_, activity]) => {
                    return activity.skill_code === this.currentSkill.code && 
                           activity.isTask === isTask;
                })
                .forEach(([id, activity]) => {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = `${activity.name} (+${activity.points} очков)`;
                    activitySelect.appendChild(option);
                });
        };
    
        // Обработчик переключения типа активности
        const radioButtons = form.querySelectorAll('input[name="activityType"]');
        radioButtons.forEach(radio => {
            radio.onchange = (e) => {
                const isTask = e.target.value === 'task';
                taskFields.style.display = isTask ? 'block' : 'none';
                updateActivityList(isTask);
            };
        });
    
        // Сбрасываем форму
        form.reset();
    
        let historyItem = null;
        if (historyItemString) {
            historyItem = typeof historyItemString === 'string' ? 
                JSON.parse(historyItemString) : historyItemString;
        }
    
        if (historyItem) {
            // Режим редактирования
            modalTitle.textContent = 'Редактировать активность';
            const activity = this.activities[historyItem.activityId];
            
            if (historyIdInput) {
                historyIdInput.value = historyItem.id;
            }
    
            // Устанавливаем тип активности
            const isTask = activity && activity.isTask;
            const typeRadio = form.querySelector(`input[name="activityType"][value="${isTask ? 'task' : 'regular'}"]`);
            if (typeRadio) {
                typeRadio.checked = true;
                taskFields.style.display = isTask ? 'block' : 'none';
            }
    
            // Обновляем список активностей и выбираем нужную
            updateActivityList(isTask);
            activitySelect.value = historyItem.activityId;
            form.querySelector('#notesInput').value = historyItem.notes;
            
            if (pointsInput && historyItem.points !== undefined) {
                pointsInput.value = historyItem.points;
            }
    
            // Заполняем дату и время создания
            if (dateInput && timeInput && historyItem.timestamp) {
                const [datePart, timePart] = historyItem.timestamp.split('-');
                if (datePart) {
                    const [day, month, year] = datePart.split('.');
                    dateInput.value = `${year}-${month}-${day}`;
                }
                const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00'];
                timeInput.value = `${hours}:${minutes}`;
            }
    
            // Заполняем срок выполнения и статус для задачи
            if (isTask && activity) {
                if (activity.dueDate && dueDateInput && dueTimeInput) {
                    const dueDateTime = new Date(activity.dueDate);
                    dueDateInput.value = dueDateTime.toISOString().split('T')[0];
                    dueTimeInput.value = dueDateTime.toTimeString().slice(0, 5);
                }
                if (isDoneCheckbox) {
                    isDoneCheckbox.checked = activity.isDone || false;
                }
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
    
            // По умолчанию показываем задачи
            updateActivityList(true);
        }
    
        // Обработчик изменения выбора активности
        activitySelect.onchange = () => {
            const selectedActivityId = activitySelect.value;
            if (selectedActivityId && this.activities[selectedActivityId]) {
                pointsInput.value = this.activities[selectedActivityId].points;
            } else {
                pointsInput.value = '';
            }
        };
    
        modal.style.display = 'block';
    }
    //--1
    // async handleActivitySubmit(event) {
    //     event.preventDefault();
    //     this.showLoading();
    
    //     const form = event.target;
    //     const historyId = form.historyId.value;
    //     const activityId = form.activity.value;
    //     const notes = form.notes.value;
    //     const date = form.date.value;
    //     const time = form.time.value;
    //     let points = form.points.value;
    //     const isTask = form.activityType.value === 'task';
    //     const isDone = isTask ? form.isDone.checked : false;
        
    //     let dueDate = null;
    //     if (isTask && form.dueDate.value) {
    //         dueDate = `${form.dueDate.value}T${form.dueTime.value || '23:59'}`;
    //     }
    
    //     if (!activityId) {
    //         alert('Пожалуйста, выберите действие');
    //         return;
    //     }
    
    //     try {
    //         const requestBody = {
    //             activityId,
    //             notes,
    //             points: parseInt(points),
    //             timestamp: this.formatDateTime(date, time),
    //             isTask,
    //             isDone,
    //             dueDate
    //         };
    
    //         let response;
    //         if (historyId) {
    //             // Режим редактирования
    //             response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history/${historyId}?user=${this.currentUser}`, {
    //                 method: 'PUT',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 body: JSON.stringify(requestBody)
    //             });
    //         } else {
    //             // Режим добавления
    //             response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history?user=${this.currentUser}`, {
    //                 method: 'POST',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 body: JSON.stringify(requestBody)
    //             });
    //         }
    
    //         if (!response.ok) {
    //             throw new Error('Failed to submit activity');
    //         }
    
    //         // Начисляем очки по правилам:
    //         // - Для обычной активности всегда сразу
    //         // - Для задачи без срока сразу
    //         // - Для задачи со сроком только при выполнении
    //         if (!isTask || !dueDate || isDone) {
    //             await this.addPoints(parseInt(points));
    //         }
    
    //         // Обновляем данные навыка
    //         this.currentSkill = await this.loadSkillDetails(this.currentSkill.code);
    //         this.render();
    //         this.hideActivityFormModal();
    //     } catch (error) {
    //         console.error('Error submitting activity:', error);
    //         alert('Произошла ошибка при добавлении/редактировании активности');
    //     } finally {
    //         this.hideLoading();
    //     }
    // }

    hideActivityFormModal() {
        const modal = document.getElementById('activityFormModal');
        modal.style.display = 'none';
    }

    // async handleActivitySubmit(event) {
    //     event.preventDefault();
    //     this.showLoading();

    //     const form = event.target;
    //     const historyId = form.historyId.value;
    //     const activityId = form.activity.value;
    //     const notes = form.notes.value;
    //     const date = form.date.value;
    //     const time = form.time.value;
    //     const points = form.points.value;

    //     if (!activityId) {
    //         alert('Пожалуйста, выберите действие');
    //         return;
    //     }

    //     try {
    //         let response;
    //         if (historyId) {
    //             // Режим редактирования
    //             response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history/${historyId}?user=${this.currentUser}`, {
    //                 method: 'PUT',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify({
    //                     activityId,
    //                     notes,
    //                     points: parseInt(points),
    //                     timestamp: this.formatDateTime(date, time)
    //                 })
    //             });
    //         } else {
    //             // Режим добавления
    //             response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history?user=${this.currentUser}`, {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify({
    //                     activityId,
    //                     notes,
    //                     points: parseInt(points),
    //                     timestamp: this.formatDateTime(date, time)
    //                 })
    //             });
    //         }

    //         if (!response.ok) {
    //             throw new Error('Failed to submit activity');
    //         }

    //         // Обновляем данные навыка
    //         this.currentSkill = await this.loadSkillDetails(this.currentSkill.code);
    //         this.render();
    //         this.hideActivityFormModal();
    //     } catch (error) {
    //         console.error('Error submitting activity:', error);
    //         alert('Произошла ошибка при добавлении/редактировании активности');
    //     } finally {
    //         this.hideLoading();
    //     }
    // }
    //-2-
    // async handleActivitySubmit(event) {
    //     event.preventDefault();
    //     this.showLoading();
    
    //     const form = event.target;
    //     const historyId = form.historyId.value;
    //     const activityId = form.activity.value;
    //     const notes = form.notes.value;
    //     const date = form.date.value;
    //     const time = form.time.value;
    //     let points = form.points.value;
    
    //     if (!activityId) {
    //         alert('Пожалуйста, выберите действие');
    //         return;
    //     }

    //     // Проверяем, что points не пустая строка
    //     if (!points) {
    //         // Если points пустая, то получаем points из activities
    //         const selectedActivity = this.activities[activityId];
    //         points = selectedActivity ? selectedActivity.points : 0;
    //     }
    
    //     try {
    //         let response;
    //         if (historyId) {
    //             // Режим редактирования
    //             response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history/${historyId}?user=${this.currentUser}`, {
    //                 method: 'PUT',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify({
    //                     activityId,
    //                     notes,
    //                     points: parseInt(points),
    //                     timestamp: this.formatDateTime(date, time)
    //                 })
    //             });
    //         } else {
    //             // Режим добавления
    //             response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history?user=${this.currentUser}`, {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify({
    //                     activityId,
    //                     notes,
    //                     points: parseInt(points),
    //                     timestamp: this.formatDateTime(date, time)
    //                 })
    //             });
    //         }
    
    //         if (!response.ok) {
    //             throw new Error('Failed to submit activity');
    //         }
    
    //         // Обновляем данные навыка
    //         this.currentSkill = await this.loadSkillDetails(this.currentSkill.code);
    //         this.render();
    //         this.hideActivityFormModal();
    //     } catch (error) {
    //         console.error('Error submitting activity:', error);
    //         alert('Произошла ошибка при добавлении/редактировании активности');
    //     } finally {
    //         this.hideLoading();
    //     }
    // }

    async handleActivitySubmit(event) {
        event.preventDefault();
        this.showLoading();
    
        const form = event.target;
        const historyId = form.historyId.value;
        const activityId = form.activity.value;
        const notes = form.notes.value;
        const date = form.date.value;
        const time = form.time.value;
        let points = form.points.value;
        const isTask = form.activityType.value === 'task';
        const isDone = isTask ? form.isDone.checked : false;
        
        let dueDate = null;
        if (isTask && form.dueDate.value) {
            dueDate = `${form.dueDate.value}T${form.dueTime.value || '23:59'}`;
        }
    
        if (!activityId) {
            alert('Пожалуйста, выберите действие');
            return;
        }
    
        try {
            const requestBody = {
                activityId,
                notes,
                points: parseInt(points),
                timestamp: this.formatDateTime(date, time),
                isTask,
                isDone,
                dueDate
            };
    
            let response;
            if (historyId) {
                // Режим редактирования
                response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history/${historyId}?user=${this.currentUser}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });
            } else {
                // Режим добавления
                response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history?user=${this.currentUser}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });
            }
    
            if (!response.ok) {
                throw new Error('Failed to submit activity');
            }
    
            // Начисляем очки по правилам:
            // - Для обычной активности всегда сразу
            // - Для задачи без срока сразу
            // - Для задачи со сроком только при выполнении
            if (!isTask || !dueDate || isDone) {
                await this.addPoints(parseInt(points));
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
            const response = await fetch(`${SKILLS_SERVICE_URL}/${this.currentSkill.code}/history/${historyId}?user=${this.currentUser}`, {
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


    // renderSkillView() {
    //     const skill = this.currentSkill;
    //     const detail = document.createElement('div');
    //     detail.className = 'skill-detail';

    //     const progress = typeof skill.progress === 'number' ? skill.progress : 0;

    //     // Группируем историю по дням
    //     let groupedHistory = this.groupHistoryByDays(skill.history);

    //     // Проверяем, является ли groupedHistory массивом
    //     if (!Array.isArray(groupedHistory)) {
    //         groupedHistory = [];
    //     }

    //     const historyHTML = groupedHistory.map(([date, items]) => {
    //         const dateId = date.replace(/\./g, '-');
    //         return `
    //         <div class="history-day">
    //             <div class="day-header" onclick="app.toggleDayHistory('${date}')">
    //                 <span id="icon-${dateId}">▼</span>
    //                 <h3>${date}</h3>
    //                 <span class="day-points">+${items.reduce((sum, item) => sum + item.points, 0)} очков</span>
    //             </div>
    //             <div id="history-${dateId}">
    //                 ${items.map(item => {
    //             const activity = this.activities[item.activityId];
    //             return `
    //                      <div class="history-item">
    //                             <div class="history-item-main">
    //                                 <h4>${activity ? activity.name : 'Активность'}</h4>
    //                                 <p class="notes">${item.notes}</p>
    //                             </div>
    //                             <div class="history-item-actions">
    //                                 <p class="timestamp">${item.timestamp.split('-')[1]}</p>
    //                                 <span class="points-badge">+${item.points} очков</span>
    //                                 <button class="btn btn-edit" onclick="app.showActivityFormModal(${JSON.stringify(item).replace(/"/g, '"')})">
    //                                     ✎
    //                                 </button>
    //                                 <button class="btn btn-edit btn-delete" onclick="app.handleActivityDelete('${item.id}')">
    //                                     🗑️
    //                                 </button>
    //                             </div>
    //                         </div>
    //                 `;
    //         }).join('')}
    //             </div>
    //         </div>
    //     `;
    //     }).join('');

    //     detail.innerHTML = `
    //     <div class="skill-header">
    //         <div>
    //             <div class="skill-icon">
    //                 ${this.getSkillIcon(skill.code)}
    //             </div>
    //             <h2>Уровень ${skill.level}(${progress}%)</h2>
    //             <p>До следующего уровня: ${progress}% (${skill.currentPoints}) очков</p>
    //         </div>
    //         <button class="btn btn-primary" onclick="app.showActivityFormModal()">
    //             + Добавить активность
    //         </button>
    //         <button class="btn btn-primary" onclick="app.showNewActivityModal()">
    //             + Создать активность
    //         </button>
    //     </div>
        
    //     <div class="progress-bar">
    //         <div class="progress-fill" style="width: ${progress}%"></div>
    //     </div>
        
    //     <h3>История</h3>
    //     <div class="history-list">
    //         ${historyHTML}
    //     </div>
    // `;

    //     this.mainContent.innerHTML = '';
    //     this.mainContent.appendChild(detail);
    // }

//<button class="btn btn-edit" onclick="app.showActivityFormModal(${JSON.stringify(item).replace(/"/g, '"')})">
//     ✎
// </button>
//  <button class="btn btn-edit" onclick="app.showActivityFormModal({&quot;id&quot;:&quot;act_1737787562029&quot;,&quot;activityId&quot;:&quot;morning_exercise&quot;,&quot;name&quot;:&quot;Утренняя зарядка&quot;,&quot;description&quot;:&quot;Простые упражнения для зарядки. Каждое утро.&quot;,&quot;points&quot;:1,&quot;notes&quot;:&quot;&quot;,&quot;timestamp&quot;:&quot;25.01.2025-09:45:00&quot;})">
//                                         ✎
//                                     </button> 

// {" id":"act_1737979640316","activityid":"activity_1737978267848","name":"2222","description":"222","points":2,"notes":"","timestamp":"27.01.2025-15:07:00"}

    renderSkillView() {
        const skill = this.currentSkill;
        const detail = document.createElement('div');
        detail.className = 'skill-detail';

        const progress = typeof skill.progress === 'number' ? skill.progress : 0;

        // Группируем историю по дням
        let groupedHistory = this.groupHistoryByDays(skill.history);

        // Проверяем, является ли groupedHistory массивом
        if (!Array.isArray(groupedHistory)) {
            groupedHistory = [];
        }

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
                                    <button class="btn btn-edit" onclick='app.showActivityFormModal(${JSON.stringify(item).replace(/'/g, "\\'")})'>
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