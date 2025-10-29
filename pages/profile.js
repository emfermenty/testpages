export function renderProfile(container) {
  const tg = window.Telegram.WebApp;
  const user = tg.initDataUnsafe?.user;

  if (!user) {
    container.innerHTML = `<p>Не удалось получить данные пользователя.</p>`;
    return;
  }

  // Формируем имя из Telegram
  const telegramName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

  container.innerHTML = `
    <div class="profile-container">
      <div class="profile-header">
        <h2>Профиль</h2>
        <p class="profile-subtitle">Ваша личная информация</p>
      </div>

      <div class="section-divider"></div>

      <div class="profile-section large-section">
        <div class="user-main-info">
          <div class="user-avatar">
            <img src="${user.photo_url}" alt="Аватар" onerror="this.style.display='none'">
          </div>
          <div class="user-details">
            <h3 class="user-name" id="profile-username">${telegramName}</h3>
            <p class="user-id">ID: ${user.id}</p>
            <p class="user-role" id="profile-role"></p>
          </div>
        </div>
      </div>

      <div class="profile-section large-section">
        <div class="info-grid">
          <div class="info-item large-item">
            <span class="info-label">Телефон</span>
            <span class="info-value" id="profile-phone">Загрузка...</span>
          </div>
          <div class="info-item large-item">
            <span class="info-label">Дата рождения</span>
            <span class="info-value" id="profile-birthday">Загрузка...</span>
          </div>
        </div>
      </div>

      <div class="profile-section large-section">
        <div class="info-item large-item">
          <span class="info-label">Анкета</span>
          <span class="info-status large-status" id="medical-status">Проверка...</span>
        </div>
      </div>

      <div class="section-divider"></div>

      <div class="profile-section large-section">
        <div class="info-item large-item">
          <span class="info-label">Хронические заболевания</span>
          <span class="info-value large-value" id="profile-chronic">Загрузка...</span>
        </div>
      </div>

      <div class="profile-section large-section">
        <div class="info-item large-item">
          <span class="info-label">Род занятий</span>
          <span class="info-value large-value" id="profile-job">Загрузка...</span>
        </div>
      </div>
    </div>
  `;

  // Загружаем данные профиля из API
  loadUserProfileData(user.id, container);
}

// Функция для загрузки данных профиля из API
async function loadUserProfileData(telegramId, container) {
  try {
    const response = await fetch(`https://antohabeuty.store/api/api/anamnez/${telegramId}`);
    
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('Данные профиля:', data);

    // Обновляем статус медицинской анкеты
    const medicalStatus = container.querySelector('#medical-status');
    if (data.anamnesis === true) {
      medicalStatus.textContent = 'Заполнена';
      medicalStatus.className = 'info-status large-status filled';
    } else {
      medicalStatus.textContent = 'Не заполнена';
      medicalStatus.className = 'info-status large-status not-filled';
    }

    // Обновляем основные данные (кроме имени - оно уже установлено из Telegram)
    updateProfileField(container, '#profile-phone', data.phone, 'Не указан');
    updateProfileField(container, '#profile-role', data.role, '');
    
    // Дата рождения
    const birthdayElement = container.querySelector('#profile-birthday');
    if (data.birthday) {
      try {
        const birthDate = new Date(data.birthday);
        if (!isNaN(birthDate.getTime())) {
          birthdayElement.textContent = birthDate.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        } else {
          birthdayElement.textContent = 'Не указана';
        }
      } catch (e) {
        birthdayElement.textContent = 'Не указана';
      }
    } else {
      birthdayElement.textContent = 'Не указана';
    }

    // Только хронические заболевания и работа
    updateProfileField(container, '#profile-chronic', data.chronic_diseases, 'Не указаны');
    updateProfileField(container, '#profile-job', data.viewjob, 'Не указан');

  } catch (error) {
    console.error('Ошибка при загрузке данных профиля:', error);
    
    const medicalStatus = container.querySelector('#medical-status');
    medicalStatus.textContent = 'Ошибка загрузки';
    medicalStatus.className = 'info-status large-status error';
    
    // Показываем сообщение об ошибке для всех полей
    container.querySelectorAll('.info-value').forEach(element => {
      if (element.textContent === 'Загрузка...') {
        element.textContent = 'Ошибка загрузки';
        element.style.color = '#ff4757';
      }
    });
  }
}

// Вспомогательная функция для обновления полей профиля
function updateProfileField(container, selector, value, defaultValue) {
  const element = container.querySelector(selector);
  if (value && value.trim() !== '') {
    element.textContent = value;
  } else {
    element.textContent = defaultValue;
  }
}