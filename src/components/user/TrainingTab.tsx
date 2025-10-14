import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface TrainingTabProps {
  organizationName: string;
}

export default function TrainingTab({ organizationName }: TrainingTabProps) {
  const [step, setStep] = useState(0);

  const handleStart = () => setStep(1);

  const handleReset = () => {
    setStep(0);
  };

  if (organizationName !== 'Сотка') {
    return (
      <div className="space-y-6 slide-up">
        <Card className="border-[#001f54]/20 shadow-xl bg-white hover:shadow-2xl transition-all duration-300">
          <CardHeader className="text-center">
            <CardTitle className="flex flex-col items-center gap-3 text-[#001f54] text-2xl">
              <div className="p-3 rounded-full bg-[#001f54]/10 shadow-lg">
                <Icon name="GraduationCap" size={32} className="text-[#001f54]" />
              </div>
              Обучение
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-gray-600 text-lg">
              Раздел обучения находится в разработке
            </p>
            <div className="text-center py-8">
              <Icon name="BookOpen" size={64} className="mx-auto mb-4 opacity-20 text-[#001f54]" />
              <p className="text-gray-500">
                Скоро здесь появятся обучающие материалы
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 slide-up">
      <Card className="border-[#001f54]/20 shadow-xl bg-white hover:shadow-2xl transition-all duration-300">
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center gap-3 text-[#001f54] text-2xl">
            <div className="p-3 rounded-full bg-[#001f54]/10 shadow-lg">
              <Icon name="GraduationCap" size={32} className="text-[#001f54]" />
            </div>
            Обучение - Онлайн-школа "Сотка"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-br from-[#001f54] to-[#002b6b] text-white p-8 md:p-12 rounded-2xl shadow-lg">
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Добро пожаловать!</h3>
                <p className="text-base md:text-lg mb-6 text-white/90">
                  Давайте начнем обучение по скрипту продаж онлайн-школы "Сотка"
                </p>
                <Button 
                  onClick={handleStart}
                  className="bg-white text-[#001f54] hover:bg-gray-100 font-bold text-base md:text-lg px-6 md:px-8 py-4 md:py-6 shadow-lg"
                >
                  Начать обучение
                  <Icon name="ArrowRight" size={20} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {/* Инструкция */}
              <div className="bg-[#001f54]/5 border-2 border-[#001f54]/20 p-6 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <Icon name="Info" size={24} className="text-[#001f54] flex-shrink-0" />
                  <div>
                    <p className="font-bold text-[#001f54] text-lg mb-2">
                      Инструкция для промоутера:
                    </p>
                    <p className="text-gray-700">
                      Прочитайте текст ниже родителю. Это ваш скрипт продаж. Говорите четко и с улыбкой!
                    </p>
                  </div>
                </div>
              </div>

              {/* Скрипт - Шаг 1: Приветствие */}
              <div className="bg-[#001f54]/5 border-l-4 border-[#001f54] p-6 rounded-lg">
                <div className="mb-3">
                  <p className="font-bold text-[#001f54] text-lg">ШАГ 1: Начните разговор</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-[#001f54]/20">
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Скажите родителю:
                  </p>
                  <p className="text-xl font-bold text-[#001f54] italic">
                    "Добрый день! У вас есть дети школьного возраста?"
                  </p>
                </div>
                <div className="mt-3 bg-[#001f54]/10 p-3 rounded text-sm text-gray-700">
                  <strong>Совет:</strong> Дождитесь ответа. Если "да" - переходите к шагу 2.
                </div>
              </div>

              {/* Скрипт - Шаг 2: Подарки */}
              <div className="bg-[#001f54]/5 border-l-4 border-[#001f54] p-6 rounded-lg">
                <div className="mb-3">
                  <p className="font-bold text-[#001f54] text-lg">ШАГ 2: Расскажите о подарках</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-[#001f54]/20 mb-3">
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Скажите родителю:
                  </p>
                  <p className="text-lg text-gray-900 mb-4">
                    "Онлайн-школа <span className="font-bold">"Сотка"</span> дарит подарки:"
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-[#001f54]/5 p-4 rounded-lg border-2 border-[#001f54]/30">
                      <p className="font-bold text-lg text-[#001f54] mb-2">
                        ПОДАРОК 1: 2 месяца бесплатного обучения
                      </p>
                      <p className="text-gray-700">
                        Заходите на наш сайт <span className="font-bold">sotkaonline.ru</span>, выбираете любой предмет (например русский или математика) и занимаетесь абсолютно бесплатно!
                      </p>
                    </div>
                    
                    <div className="bg-[#001f54]/5 p-4 rounded-lg border-2 border-[#001f54]/30">
                      <p className="font-bold text-lg text-[#001f54] mb-2">
                        ПОДАРОК 2: Диагностика знаний ребенка
                      </p>
                      <p className="text-gray-700">
                        Диагностика выявит пробелы в знаниях и подскажет родителям как исправить оценки и результаты
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Скрипт - Шаг 3: Сбор данных */}
              <div className="bg-[#001f54]/5 border-l-4 border-[#001f54] p-6 rounded-lg">
                <div className="mb-3">
                  <p className="font-bold text-[#001f54] text-lg">ШАГ 3: СОБЕРИТЕ ДАННЫЕ (ВАЖНО!)</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-[#001f54]/20">
                  <p className="text-lg font-semibold text-[#001f54] mb-4">
                    Теперь спросите у родителя:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-[#001f54]/5 p-3 rounded-lg border border-[#001f54]/30">
                      <p className="font-bold text-[#001f54] text-lg">
                        "Как вас зовут?"
                      </p>
                      <p className="text-sm text-gray-600 mt-1">(Запишите имя родителя)</p>
                    </div>
                    <div className="bg-[#001f54]/5 p-3 rounded-lg border border-[#001f54]/30">
                      <p className="font-bold text-[#001f54] text-lg">
                        "Ваш номер телефона?"
                      </p>
                      <p className="text-sm text-gray-600 mt-1">(Объясните: чтобы отправить ссылку на школу в WhatsApp)</p>
                    </div>
                    <div className="bg-[#001f54]/5 p-3 rounded-lg border border-[#001f54]/30">
                      <p className="font-bold text-[#001f54] text-lg">
                        "В каком классе учится ваш ребенок?"
                      </p>
                      <p className="text-sm text-gray-600 mt-1">(Запишите класс)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  onClick={handleReset}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  Пройти обучение заново
                  <Icon name="RotateCcw" size={20} className="ml-2" />
                </Button>
              </div>
            </div>
          )}


        </CardContent>
      </Card>
    </div>
  );
}