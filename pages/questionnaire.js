export function renderQuestionnaire(container) {
  container.innerHTML = `
    <div class="anketa-container">
      <div class="anketa-header">
        <h2>Анкета</h2>
        <div class="anketa-status" id="anketa-status">Проверка...</div>
      </div>

      <div class="anketa-section">
        <h3>Основная информация</h3>

        <div class="form-group">
          <label class="required">ФИО</label>
          <input type="text" id="username" placeholder="Введите ваше полное имя" required>
        </div>

        <div class="form-group">
          <label class="required">Дата рождения</label>
          <input type="date" id="birthday" required>
        </div>
      </div>

      <div class="anketa-section">
        <h3>Сбор анамнеза</h3>
        
        <div class="form-group">
          <label>Хронические заболевания</label>
          <textarea id="chronic" placeholder="Опишите ваши хронические заболевания, если есть"></textarea>
        </div>

        <div class="form-group">
          <label>Жалобы</label>
          <textarea id="complaints" placeholder="Опишите ваши жалобы и проблемы"></textarea>
        </div>
      </div>

      <div class="anketa-section">
        <h3>Косметологический анамнез</h3>
        
        <div class="checkbox-group">
          <input type="checkbox" id="makeusebefore">
          <label for="makeusebefore">Делали косметологические процедуры ранее?</label>
        </div>

        <div class="form-group">
          <label>Какие процедуры делали?</label>
          <input type="text" id="procedure" placeholder="Перечислите процедуры, которые делали">
        </div>

        <div class="form-group">
          <label>Какие средства использовали?</label>
          <input type="text" id="means" placeholder="Какие косметические средства использовали">
        </div>

        <div class="form-group">
          <label>Сфера деятельности</label>
          <input type="text" id="viewjob" placeholder="Ваша профессия и сфера деятельности">
        </div>

        <div class="form-group">
          <label>Желаемый результат</label>
          <input type="text" id="result" placeholder="Что хотите получить от процедуры">
        </div>
      </div>

      <button id="submit-anketa" class="submit-btn">Отправить анкету</button>
    </div>
  `;

  // Проверяем статус анкеты при загрузке
  checkAnketaStatus(container);

  // Добавляем обработчик отправки анкеты
  const submitAnketaBtn = container.querySelector('#submit-anketa');
  
  submitAnketaBtn.addEventListener('click', async () => {
    const telegramId = getTelegramId();
    if (!telegramId) {
      alert('Ошибка: Не удалось получить ID пользователя');
      return;
    }

    const anketaData = {
      username: container.querySelector("#username").value,
      birthday: container.querySelector("#birthday").value,
      chronic_diseases: container.querySelector("#chronic").value,
      makeusebefore: container.querySelector("#makeusebefore").checked,
      makeprocedurebefore: container.querySelector("#procedure").value,
      makemeansbefore: container.querySelector("#means").value,
      viewjob: container.querySelector("#viewjob").value,
      result: container.querySelector("#result").value,
      complaints: container.querySelector("#complaints").value
    };

    // Проверка обязательных полей
    if (!anketaData.username || !anketaData.birthday) {
      alert('Пожалуйста, заполните обязательные поля: ФИО и Дата рождения');
      return;
    }

    try {
      // Показываем состояние загрузки
      submitAnketaBtn.disabled = true;
      submitAnketaBtn.textContent = 'Отправка...';
      submitAnketaBtn.classList.add('loading');

      // Отправляем POST запрос на API для анкеты
      const response = await fetch('https://antohabeuty.store/api/api/anamnez', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegram_id: parseInt(telegramId),
          ...anketaData
        })
      });

      if (response.ok) {
        alert('✅ Анкета успешно отправлена!');
        
        // Обновляем статус анкеты
        await checkAnketaStatus(container);
        
        // Очищаем форму
        container.querySelectorAll('input, textarea').forEach(el => {
          if (el.type !== 'checkbox' && el.type !== 'submit') {
            el.value = '';
          }
        });
        container.querySelector('#makeusebefore').checked = false;
        
      } else {
        const responseText = await response.text();
        let errorDetail;
        try {
          const errorData = JSON.parse(responseText);
          errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) {
          errorDetail = responseText || `Ошибка ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorDetail);
      }
      
    } catch (error) {
      console.error('Ошибка отправки анкеты:', error);
      alert('Ошибка при отправке анкеты: ' + error.message);
    } finally {
      // Восстанавливаем кнопку
      submitAnketaBtn.disabled = false;
      submitAnketaBtn.textContent = 'Отправить анкету';
      submitAnketaBtn.classList.remove('loading');
    }
  });
}

// Функция для проверки статуса анкеты
async function checkAnketaStatus(container) {
  const telegramId = getTelegramId();
  if (!telegramId) {
    const statusElement = container.querySelector('#anketa-status');
    statusElement.textContent = 'Не заполнено';
    statusElement.className = 'anketa-status not-filled';
    return;
  }

  try {
    const response = await fetch(`https://antohabeuty.store/api/api/anamnez/${telegramId}`);
    
    if (response.ok) {
      const data = await response.json();
      const statusElement = container.querySelector('#anketa-status');
      
      if (data.anamnesis === true) {
        statusElement.textContent = 'Анкета заполнена, при желании можете заполнить еще раз';
        statusElement.className = 'anketa-status filled';
      } else {
        statusElement.textContent = 'Не заполнено';
        statusElement.className = 'anketa-status not-filled';
      }
    } else {
      throw new Error('Ошибка проверки статуса анкеты');
    }
  } catch (error) {
    console.error('Ошибка при проверке статуса анкеты:', error);
    const statusElement = container.querySelector('#anketa-status');
    statusElement.textContent = 'Ошибка проверки';
    statusElement.className = 'anketa-status error';
  }
}

// Функция для получения telegram_id из Telegram Web App
function getTelegramId() {
  try {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initDataUnsafe?.user) {
      return tg.initDataUnsafe.user.id;
    }
    return null;
  } catch (error) {
    console.error('Ошибка при получении Telegram ID:', error);
    return null;
  }
}