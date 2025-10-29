export async function renderServices(container) {
  container.innerHTML = `
    <h2 class="page-title">Услуги салона</h2>
    <div id="categories-container" class="categories-container">
      <div class="loading-categories">Загрузка категорий...</div>
    </div>
    <div id="services-container" class="services-container"></div>
    
    <!-- Модальное окно записи -->
    <div id="booking-modal" class="modal-overlay" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modal-service-name">КОМПЛЕКСНАЯ ЧИСТКА с пилингом ЛИЦО</h3>
          <button id="close-booking-modal" class="close-button">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Индикатор прогресса -->
          <div class="booking-progress">
            <div class="progress-step active" data-step="1">
              <div class="step-number">1</div>
              <span>Дата и время</span>
            </div>
            <div class="progress-step" data-step="2">
              <div class="step-number">2</div>
              <span>Комментарий</span>
            </div>
          </div>

          <!-- Шаг 1: Выбор даты и времени -->
          <div id="step-1" class="booking-step active">
            <div class="step-content">
              <h4>Выбор даты и времени</h4>
              <div class="date-selection">
                <label>Выберите дату:</label>
                <select id="booking-date" class="date-select">
                  <option value="">Выберите дату</option>
                </select>
              </div>
              
              <div class="time-selection" id="time-selection" style="display: none;">
                <label>Выберите время:</label>
                <div id="time-slots" class="time-slots-grid"></div>
              </div>
              
              <div class="step-actions">
                <button id="next-to-comment" class="next-step-btn" data-next="2" disabled>Далее</button>
              </div>
            </div>
          </div>

          <!-- Шаг 2: Комментарий -->
          <div id="step-2" class="booking-step">
            <div class="step-content">
              <h4>Комментарий к записи</h4>
              
              <div class="selected-slot-info" id="selected-slot-info">
                <!-- Информация о выбранном времени -->
              </div>
              
              <div class="comment-section">
                <label for="booking-comment">Комментарий (необязательно):</label>
                <textarea 
                  id="booking-comment" 
                  class="comment-textarea" 
                  placeholder="Например, особенности кожи, пожелания к процедуре..."
                  rows="3"
                ></textarea>
              </div>
              
              <div class="step-actions">
                <button class="prev-step-btn" data-prev="1">Назад</button>
                <button id="confirm-booking" class="primary-btn">Подтвердить запись</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Остальной код загрузки категорий и услуг...
  try {
    const categoriesRes = await fetch('https://antohabeuty.store/api/api/categories');
    
    if (!categoriesRes.ok) {
      throw new Error(`Ошибка загрузки категорий: ${categoriesRes.status}`);
    }
    
    const categories = await categoriesRes.json();

    if (!categories || categories.length === 0) {
      container.innerHTML = `
        <h2 class="page-title">Услуги салона</h2>
        <div class="empty-state">
          <p>Категории услуг временно недоступны</p>
        </div>
      `;
      return;
    }

    // Создаем аккордеон категорий
    const categoriesAccordion = categories.map(category => `
      <div class="category-accordion" data-id="${category.id}">
        <div class="category-header">
          <h3 class="category-title">${category.title}</h3>
          <span class="category-icon">▼</span>
        </div>
        <div class="category-content">
          <div class="services-loading">Загрузка услуг...</div>
        </div>
      </div>
    `).join('');

    container.querySelector('#categories-container').innerHTML = categoriesAccordion;

    // Добавляем обработчики для аккордеона
    container.querySelectorAll('.category-header').forEach(header => {
      header.addEventListener('click', async (e) => {
        const accordion = e.currentTarget.closest('.category-accordion');
        const categoryId = accordion.dataset.id;
        const content = accordion.querySelector('.category-content');
        const icon = accordion.querySelector('.category-icon');
        
        // Закрываем все остальные аккордеоны
        container.querySelectorAll('.category-accordion').forEach(acc => {
          if (acc !== accordion) {
            acc.classList.remove('active');
            acc.querySelector('.category-icon').style.transform = 'rotate(0deg)';
          }
        });
        
        // Переключаем текущий аккордеон
        accordion.classList.toggle('active');
        icon.style.transform = accordion.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
        
        // Если открываем и услуги еще не загружены
        if (accordion.classList.contains('active') && !content.querySelector('.service-item')) {
          await loadCategoryServices(categoryId, content, container);
        }
      });
    });

    // Инициализируем обработчики модального окна
    setupBookingModalHandlers(container);

  } catch (error) {
    console.error('Ошибка загрузки категорий:', error);
    container.innerHTML = `
      <h2 class="page-title">Услуги салона</h2>
      <div class="error-state">
        <p>Ошибка загрузки услуг</p>
        <p>Попробуйте обновить страницу</p>
      </div>
    `;
  }
}

// Настройка обработчиков модального окна
function setupBookingModalHandlers(container) {
  const modal = container.querySelector('#booking-modal');
  
  // Закрытие модального окна
  container.querySelector('#close-booking-modal').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  // Навигация по шагам
  container.querySelectorAll('.next-step-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const nextStep = e.target.dataset.next;
      navigateToStep(nextStep, container);
    });
  });
  
  container.querySelectorAll('.prev-step-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prevStep = e.target.dataset.prev;
      navigateToStep(prevStep, container);
    });
  });
  
  // Подтверждение записи
  container.querySelector('#confirm-booking').addEventListener('click', () => {
    confirmBooking(container);
  });
  
  // Закрытие при клике вне контента
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// Навигация по шагам
function navigateToStep(stepNumber, container) {
  // Обновляем индикатор прогресса
  container.querySelectorAll('.progress-step').forEach(step => {
    step.classList.remove('active');
    if (parseInt(step.dataset.step) <= parseInt(stepNumber)) {
      step.classList.add('active');
    }
  });
  
  // Скрываем все шаги
  container.querySelectorAll('.booking-step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Показываем нужный шаг
  const targetStep = container.querySelector(`#step-${stepNumber}`);
  if (targetStep) {
    targetStep.classList.add('active');
    
    // Загружаем данные для шага если нужно
    if (stepNumber === '1') {
      loadSlotsStep(container);
    } else if (stepNumber === '2') {
      loadCommentStep(container);
    }
  }
}

// Открытие модального окна записи
async function openBookingModal(service, container) {
  const tg = window.Telegram.WebApp;
  const user = tg.initDataUnsafe?.user;
  
  if (!user) {
    alert('Ошибка: не удалось получить данные пользователя');
    return;
  }
  
  const modal = container.querySelector('#booking-modal');
  const serviceName = container.querySelector('#modal-service-name');
  
  // Заполняем информацию об услуге
  serviceName.textContent = service.title;
  
  // Сохраняем данные услуги
  modal.dataset.serviceId = service.id;
  modal.dataset.serviceName = service.title;
  modal.dataset.servicePrice = service.price;
  modal.dataset.serviceDuration = service.duration_minutes || '';
  
  // Сбрасываем к первому шагу
  navigateToStep('1', container);
  
  // Показываем модальное окно
  modal.style.display = 'flex';
}

// Загрузка шага выбора слотов
async function loadSlotsStep(container) {
  const dateSelect = container.querySelector('#booking-date');
  
  // Сбрасываем форму
  dateSelect.innerHTML = '<option value="">Выберите дату</option>';
  container.querySelector('#time-selection').style.display = 'none';
  container.querySelector('#next-to-comment').disabled = true;
  
  // Загружаем доступные слоты
  await loadAvailableSlots(dateSelect, container);
}

// Загрузка доступных слотов
async function loadAvailableSlots(dateSelect, container) {
  try {
    const response = await fetch('https://antohabeuty.store/api/api/slots');
    if (!response.ok) throw new Error('Ошибка загрузки слотов');
    
    const slots = await response.json();
    
    // Группируем слоты по датам
    const slotsByDate = {};
    slots.forEach(slot => {
      const date = slot.slot_datetime.split('T')[0];
      if (!slotsByDate[date]) {
        slotsByDate[date] = [];
      }
      slotsByDate[date].push(slot);
    });
    
    // Заполняем выбор даты
    Object.keys(slotsByDate)
      .sort()
      .forEach(date => {
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('ru-RU', {
          weekday: 'short',
          day: 'numeric',
          month: 'long'
        });
        dateSelect.innerHTML += `<option value="${date}">${formattedDate}</option>`;
      });
    
    // Обработчик изменения даты
    dateSelect.onchange = (e) => {
      const selectedDate = e.target.value;
      const timeSelection = container.querySelector('#time-selection');
      const nextButton = container.querySelector('#next-to-comment');
      
      if (selectedDate) {
        showTimeSlots(slotsByDate[selectedDate], timeSelection, container);
        nextButton.disabled = true;
      } else {
        timeSelection.style.display = 'none';
        nextButton.disabled = true;
      }
    };
    
  } catch (error) {
    console.error('Ошибка загрузки слотов:', error);
    dateSelect.innerHTML = '<option value="">Ошибка загрузки дат</option>';
  }
}

// Показать временные слоты
function showTimeSlots(slots, timeSelection, container) {
  const timeSlotsGrid = timeSelection.querySelector('#time-slots');
  const nextButton = container.querySelector('#next-to-comment');
  
  // Сортируем слоты по времени
  slots.sort((a, b) => new Date(a.slot_datetime) - new Date(b.slot_datetime));
  
  timeSlotsGrid.innerHTML = slots.map(slot => {
    const time = new Date(slot.slot_datetime).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `
      <button class="time-slot-btn" data-slot-id="${slot.id}" data-datetime="${slot.slot_datetime}">
        ${time}
      </button>
    `;
  }).join('');
  
  // Обработчики для кнопок времени
  timeSlotsGrid.querySelectorAll('.time-slot-btn').forEach(btn => {
    btn.onclick = (e) => {
      timeSlotsGrid.querySelectorAll('.time-slot-btn').forEach(b => {
        b.classList.remove('selected');
      });
      e.target.classList.add('selected');
      nextButton.disabled = false;
      
      container.querySelector('#booking-modal').dataset.selectedSlotId = e.target.dataset.slotId;
      container.querySelector('#booking-modal').dataset.selectedSlotDatetime = e.target.dataset.datetime;
    };
  });
  
  timeSelection.style.display = 'block';
}

// Загрузка шага комментария
function loadCommentStep(container) {
  const modal = container.querySelector('#booking-modal');
  const slotInfo = container.querySelector('#selected-slot-info');
  
  const slotDatetime = modal.dataset.selectedSlotDatetime;
  const serviceName = modal.dataset.serviceName;
  const servicePrice = modal.dataset.servicePrice;
  
  // Форматируем дату и время
  const slotDate = new Date(slotDatetime);
  const formattedDate = slotDate.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  const formattedTime = slotDate.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  slotInfo.innerHTML = `
    <div class="slot-summary">
      <p><strong>Услуга:</strong> ${serviceName}</p>
      <p><strong>Дата:</strong> ${formattedDate}</p>
      <p><strong>Время:</strong> ${formattedTime}</p>
      <p><strong>Стоимость:</strong> ${servicePrice} ₽</p>
    </div>
  `;
}

// Подтверждение записи
async function confirmBooking(container) {
  const tg = window.Telegram.WebApp;
  const user = tg.initDataUnsafe?.user;
  const modal = container.querySelector('#booking-modal');
  const commentInput = container.querySelector('#booking-comment');
  
  const serviceId = modal.dataset.serviceId;
  const serviceName = modal.dataset.serviceName;
  const slotId = modal.dataset.selectedSlotId;
  const comment = commentInput.value.trim();
  
  if (!serviceId || !slotId) {
    alert('Ошибка: не выбран слот для записи');
    return;
  }
  
  const confirmBtn = container.querySelector('#confirm-booking');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Запись...';
  
  try {
    const response = await fetch('https://antohabeuty.store/api/api/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_id: parseInt(user.id),
        service_id: parseInt(serviceId),
        slot_id: parseInt(slotId),
        comment: comment || ''
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка записи: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    alert(`✅ Вы успешно записаны на "${serviceName}"!`);
    modal.style.display = 'none';
    
  } catch (error) {
    console.error('Ошибка записи:', error);
    alert(`❌ Ошибка записи: ${error.message}`);
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Подтвердить запись';
  }
}

// Функция загрузки услуг для категории
async function loadCategoryServices(categoryId, contentElement, container) {
  try {
    contentElement.innerHTML = '<div class="services-loading">Загрузка услуг...</div>';

    const servicesRes = await fetch(`https://antohabeuty.store/api/api/services/${categoryId}`);
    
    if (!servicesRes.ok) {
      throw new Error(`Ошибка загрузки услуг: ${servicesRes.status}`);
    }
    
    const services = await servicesRes.json();

    if (!services || services.length === 0) {
      contentElement.innerHTML = `
        <div class="no-services">
          <p>В этой категории пока нет услуг</p>
        </div>
      `;
    } else {
      const servicesList = services.map(service => `
  <div class="service-item" data-service='${JSON.stringify(service).replace(/'/g, "\\'")}'>
    <div class="service-main-info">
      <div class="service-text">
        <h4 class="service-name">${service.title}</h4>
        ${service.description ? `
          <p class="service-description">${service.description}</p>
        ` : ''}
      </div>
      ${service.duration_minutes ? `
        <div class="service-meta">
          <span class="service-duration">${service.duration_minutes} мин</span>
        </div>
      ` : ''}
    </div>
    <div class="service-actions">
      <div class="price-book-section">
        <span class="service-price">${service.price} ₽</span>
        <button class="service-book-btn">📅Записаться</button>
      </div>
    </div>
  </div>
`).join('');

      contentElement.innerHTML = `
        <div class="services-list">
          ${servicesList}
        </div>
      `;

      // Добавляем обработчики для кнопок записи
      contentElement.querySelectorAll('.service-book-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const serviceItem = e.target.closest('.service-item');
          const serviceData = JSON.parse(serviceItem.dataset.service);
          openBookingModal(serviceData, container); // ← ОТКРЫВАЕМ МОДАЛЬНОЕ ОКНО
        });
      });

      // Остальные обработчики...
      contentElement.querySelectorAll('.service-info-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const serviceItem = e.target.closest('.service-item');
          const serviceData = JSON.parse(serviceItem.dataset.service);
          showServiceDetails(serviceData);
        });
      });

      contentElement.querySelectorAll('.service-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (!e.target.classList.contains('service-info-btn') && 
              !e.target.classList.contains('service-book-btn')) {
            const serviceData = JSON.parse(item.dataset.service);
            showServiceDetails(serviceData);
          }
        });
      });
    }

  } catch (error) {
    console.error('Ошибка загрузки услуг:', error);
    contentElement.innerHTML = `
      <div class="services-error">
        <p>Ошибка загрузки услуг</p>
      </div>
    `;
  }
}

// Функция показа деталей услуги
function showServiceDetails(service) {
  const detailsHtml = `
    <div class="service-details-modal">
      <div class="service-details-content">
        <h3>${service.title}</h3>
        <div class="service-details-info">
          <p><strong>Цена:</strong> ${service.price} ₽</p>
          ${service.duration_minutes ? `<p><strong>Длительность:</strong> ${service.duration_minutes} минут</p>` : ''}
          ${service.description ? `<p><strong>Описание:</strong> ${service.description}</p>` : ''}
        </div>
        <div class="service-details-actions">
          <button class="details-close-btn">Закрыть</button>
          <button class="details-book-btn">Записаться</button>
        </div>
      </div>
    </div>
  `;
  
  const modal = document.createElement('div');
  modal.innerHTML = detailsHtml;
  document.body.appendChild(modal);
  
  modal.querySelector('.details-close-btn').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.querySelector('.details-book-btn').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}