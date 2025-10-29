// Инициализация Telegram Web App для полного размера
const tg = window.Telegram.WebApp;

// Раскрываем на весь экран
tg.expand();

// Дополнительные настройки (опционально)
tg.MainButton.hide(); // Скрываем основную кнопку
tg.enableClosingConfirmation(); // Включаем подтверждение закрытия

// Импорты после инициализации
import { renderBooking } from './pages/booking.js';
import { renderServices } from './pages/services.js';
import { renderProfile } from './pages/profile.js';
import { renderQuestionnaire } from './pages/questionnaire.js';

const content = document.getElementById('content');
const navButtons = document.querySelectorAll('.bottom-nav button');

const pages = {
  services: renderServices,
  booking: renderBooking,
  profile: renderProfile,
  questionnaire: renderQuestionnaire
};

function navigate(page) {
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
  pages[page](content);
}

navButtons.forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.page)));

navigate('services'); // стартовая страница