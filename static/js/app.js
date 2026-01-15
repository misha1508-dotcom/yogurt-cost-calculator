// Автоматический пересчет при изменении значений
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчики событий для автоматического обновления сумм
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('item-price') || e.target.classList.contains('item-quantity')) {
            updateItemTotal(e.target);
        }
    });
});

// Обновление суммы для конкретной строки
function updateItemTotal(element) {
    const row = element.closest('.item-row');
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const total = price * quantity;
    row.querySelector('.item-total').textContent = total.toFixed(2) + ' ₽';
}

// Добавление нового поля
function addItem(containerId) {
    const container = document.getElementById(containerId);
    const newRow = document.createElement('div');
    newRow.className = 'item-row';
    newRow.innerHTML = `
        <input type="text" placeholder="Название" class="item-name">
        <input type="number" placeholder="Цена" value="0" step="0.01" class="item-price">
        <input type="number" placeholder="Кол-во" value="1" step="0.01" class="item-quantity">
        <span class="item-total">0.00 ₽</span>
        <button onclick="removeItem(this)" class="btn-remove">✕</button>
    `;
    container.appendChild(newRow);
}

// Удаление строки
function removeItem(button) {
    const row = button.closest('.item-row');
    row.remove();
}

// Сбор данных из формы
function collectFormData() {
    const categories = ['raw_materials', 'packaging', 'logistics', 'taxes', 'labor', 'rent', 'other'];
    const items = {};

    categories.forEach(category => {
        const container = document.getElementById(category + '_items');
        const rows = container.querySelectorAll('.item-row');
        items[category] = [];

        rows.forEach(row => {
            const name = row.querySelector('.item-name').value;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;

            if (name) {
                items[category].push({ name, price, quantity });
            }
        });
    });

    return {
        name: document.getElementById('configName').value || 'Без названия',
        batch_size: parseInt(document.getElementById('batchSize').value) || 1,
        selling_price: parseFloat(document.getElementById('sellingPrice').value) || 0,
        items: items
    };
}

// Расчет себестоимости
async function calculate() {
    const data = collectFormData();

    try {
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        displayResults(result);
    } catch (error) {
        console.error('Error calculating:', error);
        alert('Ошибка при расчете');
    }
}

// Отображение результатов
function displayResults(result) {
    const resultsContainer = document.getElementById('results');

    const categoryNames = {
        'raw_materials': '🥛 Сырье',
        'packaging': '📦 Упаковка',
        'logistics': '🚚 Логистика',
        'taxes': '💰 Налоги',
        'labor': '👷 Работа',
        'rent': '🏢 Аренда',
        'other': '📋 Другие расходы'
    };

    let categoriesHtml = '';
    for (const [key, value] of Object.entries(result.category_totals)) {
        if (value > 0) {
            categoriesHtml += `
                <div class="category-result">
                    <span class="category-name">${categoryNames[key] || key}</span>
                    <span class="category-value">${value.toFixed(2)} ₽</span>
                </div>
            `;
        }
    }

    const profitClass = result.profit_per_unit >= 0 ? 'profit-positive' : 'profit-negative';

    resultsContainer.innerHTML = `
        <div class="result-card">
            <h3>Общая себестоимость партии</h3>
            <div class="result-value">${result.total_cost.toFixed(2)} ₽</div>
            <div class="result-label">На партию из ${result.batch_size} шт</div>
        </div>

        <div class="result-card">
            <h3>Себестоимость единицы</h3>
            <div class="result-value">${result.unit_cost.toFixed(2)} ₽</div>
            <div class="result-label">За 1 шт</div>
        </div>

        <div class="result-card">
            <h3>Цена продажи</h3>
            <div class="result-value">${result.selling_price.toFixed(2)} ₽</div>
            <div class="result-label">За 1 шт</div>
        </div>

        <div class="result-card">
            <h3>Прибыль</h3>
            <div class="result-value ${profitClass}">${result.profit_per_unit.toFixed(2)} ₽</div>
            <div class="result-label">С одной единицы</div>
        </div>

        <div class="result-card">
            <h3>Маржинальность</h3>
            <div class="result-value ${profitClass}">${result.margin_percent.toFixed(2)}%</div>
            <div class="result-label">Процент прибыли</div>
        </div>

        <div class="result-card">
            <h3>Разбивка по категориям</h3>
            ${categoriesHtml}
        </div>

        <div class="result-card">
            <h3>Прибыль с партии</h3>
            <div class="result-value ${profitClass}">${(result.profit_per_unit * result.batch_size).toFixed(2)} ₽</div>
            <div class="result-label">Общая прибыль</div>
        </div>
    `;
}

// Сохранение конфигурации
async function saveConfiguration() {
    const data = collectFormData();

    if (!data.name || data.name === 'Без названия') {
        alert('Пожалуйста, введите название конфигурации');
        return;
    }

    try {
        const response = await fetch('/api/configuration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            alert('Конфигурация сохранена успешно!');
        } else {
            alert('Ошибка при сохранении');
        }
    } catch (error) {
        console.error('Error saving:', error);
        alert('Ошибка при сохранении');
    }
}

// Показать список сохраненных конфигураций
async function showSavedConfigs() {
    try {
        const response = await fetch('/api/configurations');
        const configs = await response.json();

        const modal = document.getElementById('configModal');
        const configsList = document.getElementById('configsList');

        if (configs.length === 0) {
            configsList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">Нет сохраненных конфигураций</p>';
        } else {
            configsList.innerHTML = configs.map(config => `
                <div class="config-item">
                    <div class="config-info">
                        <h3>${config.name}</h3>
                        <div class="config-date">
                            Создано: ${new Date(config.created_at).toLocaleString('ru-RU')}
                        </div>
                        <div class="config-date">
                            Партия: ${config.batch_size} шт | Цена: ${config.selling_price} ₽
                        </div>
                    </div>
                    <div class="config-actions">
                        <button onclick="loadConfiguration(${config.id})" class="btn-load">Загрузить</button>
                        <button onclick="deleteConfiguration(${config.id})" class="btn-delete">Удалить</button>
                    </div>
                </div>
            `).join('');
        }

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading configurations:', error);
        alert('Ошибка при загрузке конфигураций');
    }
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('configModal').style.display = 'none';
}

// Загрузка конфигурации
async function loadConfiguration(configId) {
    try {
        const response = await fetch(`/api/configuration/${configId}`);
        const config = await response.json();

        // Загружаем основные параметры
        document.getElementById('configName').value = config.name;
        document.getElementById('batchSize').value = config.batch_size;
        document.getElementById('sellingPrice').value = config.selling_price;

        // Очищаем все категории
        const categories = ['raw_materials', 'packaging', 'logistics', 'taxes', 'labor', 'rent', 'other'];
        categories.forEach(category => {
            const container = document.getElementById(category + '_items');
            container.innerHTML = '';
        });

        // Загружаем элементы
        for (const [category, items] of Object.entries(config.items)) {
            const container = document.getElementById(category + '_items');
            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'item-row';
                const total = (item.price * item.quantity).toFixed(2);
                row.innerHTML = `
                    <input type="text" placeholder="Название" value="${item.name}" class="item-name">
                    <input type="number" placeholder="Цена" value="${item.price}" step="0.01" class="item-price">
                    <input type="number" placeholder="Кол-во" value="${item.quantity}" step="0.01" class="item-quantity">
                    <span class="item-total">${total} ₽</span>
                    <button onclick="removeItem(this)" class="btn-remove">✕</button>
                `;
                container.appendChild(row);
            });
        }

        closeModal();
        alert('Конфигурация загружена!');
    } catch (error) {
        console.error('Error loading configuration:', error);
        alert('Ошибка при загрузке конфигурации');
    }
}

// Удаление конфигурации
async function deleteConfiguration(configId) {
    if (!confirm('Вы уверены, что хотите удалить эту конфигурацию?')) {
        return;
    }

    try {
        const response = await fetch(`/api/configuration/${configId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            alert('Конфигурация удалена');
            showSavedConfigs(); // Обновляем список
        } else {
            alert('Ошибка при удалении');
        }
    } catch (error) {
        console.error('Error deleting configuration:', error);
        alert('Ошибка при удалении');
    }
}

// Сброс формы
function resetForm() {
    if (confirm('Вы уверены, что хотите сбросить все данные?')) {
        location.reload();
    }
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('configModal');
    if (event.target == modal) {
        closeModal();
    }
}
