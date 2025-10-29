export async function renderBooking(container) {
  container.innerHTML = `
    <h2>Мои записи</h2>
    <div id="booking-list">Загрузка...</div>
  `;

  const tg = window.Telegram.WebApp;
  const user = tg.initDataUnsafe?.user;

  if (!user) {
    container.innerHTML = `<p>Не удалось получить данные пользователя.</p>`;
    return;
  }

  try {
    const res = await fetch(`https://antohabeuty.store/api/api/userbooking/${user.id}`);
    
    if (!res.ok) {
      throw new Error(`Ошибка: ${res.status}`);
    }
    
    const bookings = await res.json();

    // Исправленная проверка на пустой массив
    if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
      container.innerHTML = `
        <h2>Мои записи</h2>
        <div id="booking-list">
          <p>У вас пока нет записей</p>
          <p>Запишитесь на услугу, чтобы она появилась здесь</p>
        </div>
      `;
      return;
    }

    // Сортируем записи по дате (от ближайшей к дальнейшей)
    const sortedBookings = bookings.sort((a, b) => {
      return new Date(a.slot_datetime) - new Date(b.slot_datetime);
    });

    const bookingList = sortedBookings.map(booking => `
      <div class="booking-card">
        <div class="booking-header">
          <h3>${booking.service.name}</h3>
          <span class="price">${booking.service.price} ₽</span>
        </div>
        
        <div class="booking-details">
          <div>
            <div class="label">Дата</div>
            <div class="value">${formatDate(booking.slot_datetime)}</div>
          </div>
          <div>
            <div class="label">Время</div>
            <div class="value">${formatTime(booking.slot_datetime)}</div>
          </div>
        </div>

        <div class="booking-footer">
          <span class="status ${booking.status.toLowerCase().replace(/\s/g, '')}">${booking.status}</span>
          <button class="cancel-btn" data-id="${booking.id}" data-booking='${JSON.stringify(booking).replace(/'/g, "\\'")}'>Отменить</button>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <h2>Мои записи</h2>
      <div id="booking-list">
        ${bookingList}
      </div>
    `;

    // Добавляем обработчики для кнопок отмены
    container.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const bookingId = e.target.dataset.id;
        const bookingData = JSON.parse(e.target.dataset.booking);
        
        if (confirm('Вы уверены, что хотите отменить запись?')) {
          await cancelBooking(bookingId, container, bookingData);
        }
      });
    });

  } catch (error) {
    console.error('Ошибка загрузки записей:', error);
    container.innerHTML = `
      <h2>Мои записи</h2>
      <div id="booking-list">
        <p>Ошибка загрузки записей</p>
        <p>Попробуйте обновить страницу</p>
      </div>
    `;
  }
}

// Вспомогательные функции
function formatDate(dateTimeString) {
  if (!dateTimeString) return 'Не указана';
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatTime(dateTimeString) {
  if (!dateTimeString) return 'Не указано';
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Функция для отмены записи
async function cancelBooking(bookingId, container, bookingData) {
    try {
        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe?.user;

        const response = await fetch('https://antohabeuty.store/api/api/book/close', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slot_id: bookingId,
                telegram_id: bookingData.user_id,
                service_id: bookingData.service.id,
                service_date: formatDate(bookingData.slot_datetime),
                service_name: bookingData.service.name,
                user_username: user?.username
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log("✅ Ответ от сервера:", result);

        alert(`✅ Запись на "${bookingData.service.name}" успешно отменена!`);
        
        // Обновляем список записей
        renderBooking(container);

    } catch (error) {
        console.error("❌ Ошибка при отмене записи:", error);
        
        let errorMessage = "Не удалось отменить запись";
        if (error.message.includes("404")) {
            errorMessage = "Запись не найдена или уже отменена";
        } else if (error.message.includes("403")) {
            errorMessage = "Нет прав для отмены этой записи";
        } else if (error.message.includes("500")) {
            errorMessage = "Ошибка сервера, попробуйте позже";
        } else if (error.message.includes("NetworkError")) {
            errorMessage = "Проблемы с соединением, проверьте интернет";
        } else {
            errorMessage = `Ошибка: ${error.message}`;
        }
        
        alert(`❌ ${errorMessage}`);
    }
}