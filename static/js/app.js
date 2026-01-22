// Автоматический пересчет при изменении значений
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчики событий для автоматического обновления сумм
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('item-price') || e.target.classList.contains('item-quantity')) {
            updateItemTotal(e.target);
            autoCalculate();
        }
        // Если изменились основные параметры
        if (e.target.id === 'batchSize' || e.target.id === 'sellingPrice' || e.target.id === 'containerType') {
            updateTotalVolume();
            autoCalculate();
        }
        // Если изменились параметры ингредиентов
        if (e.target.classList.contains('ingredient-dose') ||
            e.target.classList.contains('ingredient-price-per-unit') ||
            e.target.classList.contains('ingredient-package-size')) {
            calculateIngredients();
            autoCalculate();
        }
    });

    // Обработчик для чекбоксов ингредиентов
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('ingredient-checkbox')) {
            calculateIngredients();
            autoCalculate();
        }
    });

    // Первый расчет при загрузке страницы
    updateTotalVolume();
    calculateIngredients();
    autoCalculate();
});

// Обновление общего объема партии
function updateTotalVolume() {
    const containerType = parseFloat(document.getElementById('containerType').value);
    const batchSize = parseInt(document.getElementById('batchSize').value) || 0;
    const totalVolume = (containerType * batchSize).toFixed(1);
    document.getElementById('totalVolume').textContent = totalVolume + ' л';
}

// Расчет ингредиентов
function calculateIngredients() {
    const containerType = parseFloat(document.getElementById('containerType').value);
    const batchSize = parseInt(document.getElementById('batchSize').value) || 0;
    const totalVolume = containerType * batchSize; // в литрах

    let totalRawMaterialsCost = 0;

    // Молоко (в мл на 1л, цена за 1л)
    const milkCheckbox = document.querySelector('.ingredient-checkbox[data-ingredient="milk"]');
    if (milkCheckbox && milkCheckbox.checked) {
        const milkDose = parseFloat(document.querySelector('.ingredient-dose[data-ingredient="milk"]').value) || 0;
        const milkPricePerLiter = parseFloat(document.querySelector('.ingredient-price-per-unit[data-ingredient="milk"]').value) || 0;

        const milkNeeded = (milkDose / 1000) * totalVolume; // в литрах
        const milkCost = milkNeeded * milkPricePerLiter;

        document.querySelector('.ingredient-total-needed[data-ingredient="milk"]').textContent = milkNeeded.toFixed(2) + ' л';
        document.querySelector('.ingredient-cost[data-ingredient="milk"]').textContent = milkCost.toFixed(2) + ' ₽';
        totalRawMaterialsCost += milkCost;
    }

    // Закваска (в граммах на 1л, цена за пачку, грамм в пачке)
    const starterCheckbox = document.querySelector('.ingredient-checkbox[data-ingredient="starter"]');
    if (starterCheckbox && starterCheckbox.checked) {
        const starterDose = parseFloat(document.querySelector('.ingredient-dose[data-ingredient="starter"]').value) || 0;
        const starterPricePerPackage = parseFloat(document.querySelector('.ingredient-price-per-unit[data-ingredient="starter"]').value) || 0;
        const starterPackageSize = parseFloat(document.querySelector('.ingredient-package-size[data-ingredient="starter"]').value) || 1;

        const starterNeeded = starterDose * totalVolume; // в граммах
        const starterPricePerGram = starterPricePerPackage / starterPackageSize;
        const starterCost = starterNeeded * starterPricePerGram;

        document.querySelector('.ingredient-total-needed[data-ingredient="starter"]').textContent = starterNeeded.toFixed(1) + ' г';
        document.querySelector('.ingredient-cost[data-ingredient="starter"]').textContent = starterCost.toFixed(2) + ' ₽';
        totalRawMaterialsCost += starterCost;
    }

    // Инулин (в граммах на 1л, цена за пачку, грамм в пачке)
    const inulinCheckbox = document.querySelector('.ingredient-checkbox[data-ingredient="inulin"]');
    if (inulinCheckbox && inulinCheckbox.checked) {
        const inulinDose = parseFloat(document.querySelector('.ingredient-dose[data-ingredient="inulin"]').value) || 0;
        const inulinPricePerPackage = parseFloat(document.querySelector('.ingredient-price-per-unit[data-ingredient="inulin"]').value) || 0;
        const inulinPackageSize = parseFloat(document.querySelector('.ingredient-package-size[data-ingredient="inulin"]').value) || 1;

        const inulinNeeded = inulinDose * totalVolume; // в граммах
        const inulinPricePerGram = inulinPricePerPackage / inulinPackageSize;
        const inulinCost = inulinNeeded * inulinPricePerGram;

        document.querySelector('.ingredient-total-needed[data-ingredient="inulin"]').textContent = inulinNeeded.toFixed(1) + ' г';
        document.querySelector('.ingredient-cost[data-ingredient="inulin"]').textContent = inulinCost.toFixed(2) + ' ₽';
        totalRawMaterialsCost += inulinCost;
    }

    // Обновляем итого по сырью
    document.getElementById('raw_materials_total').textContent = totalRawMaterialsCost.toFixed(2) + ' ₽';
}

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
    // Автоматически пересчитываем после добавления
    autoCalculate();
}

// Удаление строки
function removeItem(button) {
    const row = button.closest('.item-row');
    row.remove();
    // Автоматически пересчитываем после удаления
    autoCalculate();
}

// Сбор данных из формы
function collectFormData() {
    const categories = ['packaging', 'logistics', 'taxes', 'labor', 'rent', 'other'];
    const items = {};

    // Сырье - собираем из новой системы ингредиентов
    items['raw_materials'] = [];
    const containerType = parseFloat(document.getElementById('containerType').value);
    const batchSize = parseInt(document.getElementById('batchSize').value) || 0;
    const totalVolume = containerType * batchSize;

    // Молоко
    const milkCheckbox = document.querySelector('.ingredient-checkbox[data-ingredient="milk"]');
    if (milkCheckbox && milkCheckbox.checked) {
        const milkDose = parseFloat(document.querySelector('.ingredient-dose[data-ingredient="milk"]').value) || 0;
        const milkPricePerLiter = parseFloat(document.querySelector('.ingredient-price-per-unit[data-ingredient="milk"]').value) || 0;
        const milkNeeded = (milkDose / 1000) * totalVolume;
        const milkCost = milkNeeded * milkPricePerLiter;
        items['raw_materials'].push({
            name: 'Молоко',
            price: milkCost,
            quantity: 1
        });
    }

    // Закваска
    const starterCheckbox = document.querySelector('.ingredient-checkbox[data-ingredient="starter"]');
    if (starterCheckbox && starterCheckbox.checked) {
        const starterDose = parseFloat(document.querySelector('.ingredient-dose[data-ingredient="starter"]').value) || 0;
        const starterPricePerPackage = parseFloat(document.querySelector('.ingredient-price-per-unit[data-ingredient="starter"]').value) || 0;
        const starterPackageSize = parseFloat(document.querySelector('.ingredient-package-size[data-ingredient="starter"]').value) || 1;
        const starterNeeded = starterDose * totalVolume;
        const starterCost = (starterNeeded / starterPackageSize) * starterPricePerPackage;
        items['raw_materials'].push({
            name: 'Закваска',
            price: starterCost,
            quantity: 1
        });
    }

    // Инулин
    const inulinCheckbox = document.querySelector('.ingredient-checkbox[data-ingredient="inulin"]');
    if (inulinCheckbox && inulinCheckbox.checked) {
        const inulinDose = parseFloat(document.querySelector('.ingredient-dose[data-ingredient="inulin"]').value) || 0;
        const inulinPricePerPackage = parseFloat(document.querySelector('.ingredient-price-per-unit[data-ingredient="inulin"]').value) || 0;
        const inulinPackageSize = parseFloat(document.querySelector('.ingredient-package-size[data-ingredient="inulin"]').value) || 1;
        const inulinNeeded = inulinDose * totalVolume;
        const inulinCost = (inulinNeeded / inulinPackageSize) * inulinPricePerPackage;
        items['raw_materials'].push({
            name: 'Инулин',
            price: inulinCost,
            quantity: 1
        });
    }

    // Остальные категории - старая система
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
        container_type: containerType,
        batch_size: batchSize,
        total_volume: totalVolume,
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

// Автоматический расчет с задержкой (debounce)
let autoCalculateTimer;
function autoCalculate() {
    // Очищаем предыдущий таймер
    clearTimeout(autoCalculateTimer);

    // Запускаем новый таймер с задержкой 300ms
    autoCalculateTimer = setTimeout(async () => {
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
            console.error('Error auto-calculating:', error);
            // Не показываем alert при автоматическом расчете
        }
    }, 300);
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
