"""
Сервис-конструктор для расчета себестоимости и юнит-экономики йогурта
"""
from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime
from typing import Dict, List

app = Flask(__name__)
DATA_DIR = 'data'
CONFIGS_FILE = os.path.join(DATA_DIR, 'configurations.json')

# Категории переменных затрат
COST_CATEGORIES = {
    'raw_materials': 'Сырье',
    'packaging': 'Упаковка',
    'logistics': 'Логистика',
    'taxes': 'Налоги',
    'labor': 'Работа',
    'rent': 'Аренда',
    'other': 'Другие расходы'
}


def load_configurations() -> List[Dict]:
    """Загрузка сохраненных конфигураций"""
    if os.path.exists(CONFIGS_FILE):
        with open(CONFIGS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []


def save_configuration(config: Dict) -> bool:
    """Сохранение новой конфигурации"""
    try:
        configs = load_configurations()
        config['id'] = len(configs) + 1
        config['created_at'] = datetime.now().isoformat()
        configs.append(config)

        os.makedirs(DATA_DIR, exist_ok=True)
        with open(CONFIGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(configs, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving configuration: {e}")
        return False


def calculate_cost(config: Dict) -> Dict:
    """Расчет себестоимости на основе конфигурации"""
    total_cost = 0
    category_totals = {}

    for category, items in config.get('items', {}).items():
        category_total = 0
        for item in items:
            item_cost = float(item.get('price', 0)) * float(item.get('quantity', 1))
            category_total += item_cost
        category_totals[category] = category_total
        total_cost += category_total

    # Расчет юнит-экономики
    batch_size = config.get('batch_size', 1)
    unit_cost = total_cost / batch_size if batch_size > 0 else 0

    selling_price = config.get('selling_price', 0)
    profit_per_unit = selling_price - unit_cost
    margin = (profit_per_unit / selling_price * 100) if selling_price > 0 else 0

    return {
        'total_cost': round(total_cost, 2),
        'category_totals': {k: round(v, 2) for k, v in category_totals.items()},
        'unit_cost': round(unit_cost, 2),
        'profit_per_unit': round(profit_per_unit, 2),
        'margin_percent': round(margin, 2),
        'batch_size': batch_size,
        'selling_price': selling_price
    }


@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html', categories=COST_CATEGORIES)


@app.route('/api/configurations', methods=['GET'])
def get_configurations():
    """Получение списка всех конфигураций"""
    configs = load_configurations()
    return jsonify(configs)


@app.route('/api/configuration/<int:config_id>', methods=['GET'])
def get_configuration(config_id):
    """Получение конкретной конфигурации"""
    configs = load_configurations()
    config = next((c for c in configs if c['id'] == config_id), None)
    if config:
        return jsonify(config)
    return jsonify({'error': 'Configuration not found'}), 404


@app.route('/api/configuration', methods=['POST'])
def save_config():
    """Сохранение новой конфигурации"""
    config = request.json
    if save_configuration(config):
        return jsonify({'success': True, 'message': 'Configuration saved'})
    return jsonify({'success': False, 'message': 'Error saving configuration'}), 500


@app.route('/api/calculate', methods=['POST'])
def calculate():
    """Расчет себестоимости"""
    config = request.json
    result = calculate_cost(config)
    return jsonify(result)


@app.route('/api/configuration/<int:config_id>', methods=['DELETE'])
def delete_configuration(config_id):
    """Удаление конфигурации"""
    try:
        configs = load_configurations()
        configs = [c for c in configs if c['id'] != config_id]

        with open(CONFIGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(configs, f, ensure_ascii=False, indent=2)

        return jsonify({'success': True, 'message': 'Configuration deleted'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
