const mainView = document.getElementById('mainView');
const skillView = document.getElementById('skillView');
const backButton = document.getElementById('backButton');
const pageTitle = document.getElementById('pageTitle');
const skillIcon = document.getElementById('skillIcon');
const skillLevel = document.getElementById('skillLevel');
const skillProgressText = document.getElementById('skillProgressText');
const skillProgressBar = document.getElementById('skillProgressBar');
const skillHistory = document.getElementById('skillHistory');
const skillAchievements = document.getElementById('skillAchievements');
const addActivityButton = document.getElementById('addActivityButton');

let currentSkillCode = null;

// Функция для загрузки данных о направлениях
async function loadSkills() {
    try {
        const response = await fetch('/skills');
        const skills = await response.json();
        displaySkills(skills);
    } catch (error) {
        console.error('Ошибка загрузки направлений:', error);
    }
}

// Функция для отображения направлений на главном экране
function displaySkills(skills) {
    mainView.innerHTML = '';
    skills.forEach(skill => {
        const skillCard = document.createElement('div');
        skillCard.className = 'bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors';
        skillCard.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div class="p-2 bg-purple-900/50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-purple-400">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042a8.967 8.967 0 00-7.063 7.063L12 17.958l7.063-4.853A8.967 8.967 0 0012 6.042z" />
                    </svg>
                </div>
                <span class="text-sm font-medium text-gray-400">Уровень ${skill.level}</span>
            </div>
            <h2 class="text-lg font-semibold text-white mb-3">${skill.name}</h2>
            <div class="mb-4">
                <div class="h-2 bg-gray-700 rounded-full">
                    <div class="h-2 bg-purple-500 rounded-full" style="width: ${skill.currentPoints / ((skill.level + 1) * 100) * 100}%"></div>
                </div>
            </div>
            <button class="w-full py-2 px-4 bg-purple-900/30 text-purple-400 rounded-lg hover:bg-purple-900/50 transition-colors" data-skill-code="${skill.code}">Подробнее</button>
        `;
        mainView.appendChild(skillCard);

        const detailButton = skillCard.querySelector('button');
        detailButton.addEventListener('click', () => {
            currentSkillCode = skill.code;
            loadSkillDetails(skill.code);
            showSkillView();
        });
    });
}

// Функция для загрузки данных о конкретном направлении
async function loadSkillDetails(skillCode) {
    try {
        const response = await fetch(`/skills/${skillCode}`);
        const skill = await response.json();
        displaySkillDetails(skill);
    } catch (error) {
        console.error('Ошибка загрузки данных о направлении:', error);
    }
}

// Функция для отображения данных о конкретном направлении
function displaySkillDetails(skill) {
    pageTitle.textContent = skill.name;
    skillIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-purple-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042a8.967 8.967 0 00-7.063 7.063L12 17.958l7.063-4.853A8.967 8.967 0 0012 6.042z" />
        </svg>
    `;
    skillLevel.textContent = `Уровень ${skill.level}`;
    skillProgressText.textContent = `До следующего уровня: ${100 - (skill.currentPoints / ((skill.level + 1) * 100) * 100).toFixed(0)}%`;
    skillProgressBar.style.width = `${skill.currentPoints / ((skill.level + 1) * 100) * 100}%`;
    skillHistory.innerHTML = '';
    skill.history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'flex items-center justify-between p-4';
        historyItem.innerHTML = `
            <div>
                <h4 class="font-medium text-white">${item.name}</h4>
                <p class="text-sm text-gray-400">${new Date(item.timestamp).toLocaleDateString()}</p>
            </div>
            <span class="px-3 py-1 bg-purple-900/30 text-purple-400 rounded-full text-sm">+${item.points} очков</span>
        `;
        skillHistory.appendChild(historyItem);
    });
    skillAchievements.textContent = skill.achievements.length > 0 ? '' : 'Пока нет достижений';
}

// Функция для отображения страницы направления
function showSkillView() {
    mainView.classList.add('hidden');
    skillView.classList.remove('hidden');
    backButton.classList.remove('hidden');
}

// Функция для отображения главного экрана
function showMainView() {
    mainView.classList.remove('hidden');
    skillView.classList.add('hidden');
    backButton.classList.add('hidden');
    pageTitle.textContent = 'Ментальный Трекер';
}

// Обработчик нажатия на кнопку "Назад"
backButton.addEventListener('click', showMainView);

// Обработчик нажатия на кнопку "Добавить задание"
addActivityButton.addEventListener('click', () => {
    const activityName = prompt('Введите название задания:');
    if (activityName) {
        addActivity(currentSkillCode, activityName);
    }
});

// Функция для добавления нового задания
async function addActivity(skillCode, activityName) {
    try {
        const response = await fetch(`/skills/${skillCode}/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                activityId: 'custom_activity',
                name: activityName,
                points: 10
            })
        });
        if (response.ok) {
            loadSkillDetails(skillCode);
        } else {
            console.error('Ошибка добавления задания:', response.statusText);
        }
    } catch (error) {
        console.error('Ошибка добавления задания:', error);
    }
}

// Загрузка данных при загрузке страницы
loadSkills();