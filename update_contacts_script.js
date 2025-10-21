// Скрипт для обновления организаций контактов
// Запустите в консоли браузера на странице админ-панели

const updates = [
  // Кристина Маркаускайте - 12 контактов KIBERONE (Деловой центр) - organization_id: 2
  {
    lead_ids: [145, 146, 153, 162, 166, 168, 177, 181, 183, 187, 189, 191],
    organization_id: 2
  },
  // Владислава Долматова - 3 контакта (Сотка) - organization_id: 1
  {
    lead_ids: [130, 131, 132],
    organization_id: 1
  },
  // Владислава Долматова - 15 контактов KIBERONE (Деловой центр) - organization_id: 2
  {
    lead_ids: [140, 142, 144, 151, 155, 165, 170, 173, 176, 178, 180, 184, 185, 186, 190],
    organization_id: 2
  },
  // Ольга Алексеева - 12 контактов ТОП (Речной Вокзал) - organization_id: 8
  {
    lead_ids: [29, 38, 57, 59, 84, 85, 88, 94, 95, 96, 112, 125],
    organization_id: 8
  },
  // Диана Гумерова - 2 контакта (Сотка) - organization_id: 1
  {
    lead_ids: [127, 129],
    organization_id: 1
  }
];

async function updateOrganizations() {
  try {
    const response = await fetch('https://functions.poehali.dev/74fe1952-6feb-4b58-90d2-53adf102356a', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updates })
    });
    
    const result = await response.json();
    console.log('✅ Успешно обновлено:', result);
    alert(`Обновлено ${result.updated_count} контактов!`);
    window.location.reload();
  } catch (error) {
    console.error('❌ Ошибка:', error);
    alert('Ошибка при обновлении контактов');
  }
}

updateOrganizations();
