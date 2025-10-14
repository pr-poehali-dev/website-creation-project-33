import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface TrainingTabProps {
  organizationName: string;
}

export default function TrainingTab({ organizationName }: TrainingTabProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleStart = () => setStep(1);
  const handleNext = () => setStep(2);
  
  const handleSubmit = () => {
    if (name && phone) {
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setStep(0);
    setName('');
    setPhone('');
    setSubmitted(false);
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

          {step === 1 && !submitted && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-[#001f54] p-6 rounded-lg">
                <p className="text-lg font-semibold text-[#001f54] mb-4">
                  Добрый день! У вас есть дети школьного возраста?
                </p>
                <div className="space-y-4 text-gray-700">
                  <p className="font-medium text-lg">
                    Онлайн-школа "Сотка" дарит подарки:
                  </p>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#001f54] text-white flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-[#001f54]">
                          Бесплатный вводный урок – "Диагностика школьных знаний"
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          На этой диагностике мы выявляем пробелы в знаниях и помогаем родителям скорректировать обучение ребенка для достижения наилучших результатов.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#001f54] text-white flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-[#001f54]">
                          2 месяца обучения в нашей школе – в подарок!
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          После прохождения диагностики
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[#001f54]/10 to-[#002b6b]/10 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      Мы — одна из ведущих онлайн-школ по подготовке школьников. На рынке уже <strong>8 лет</strong>, за это время мы обучили более <strong>370 тысяч учеников</strong>. У нас более <strong>13 тысяч положительных отзывов</strong> в интернете, и мы имеем образовательную лицензию. Каждый третий наш выпускник сдает ЕГЭ на <strong>80+ баллов</strong>, а ОГЭ – на <strong>"5"</strong>!
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  onClick={handleNext}
                  className="bg-[#001f54] hover:bg-[#002b6b] text-white font-bold text-lg px-8 py-6 shadow-lg"
                >
                  Далее
                  <Icon name="ArrowRight" size={20} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && !submitted && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-[#001f54] p-6 rounded-lg">
                <p className="text-lg font-semibold text-[#001f54] mb-6">
                  Давайте запишем ваши контакты для бесплатной диагностики
                </p>
                
                <div className="space-y-4 bg-white p-6 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Как вас зовут?
                    </label>
                    <Input 
                      type="text"
                      placeholder="Ваше имя"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-[#001f54]/30 focus:border-[#001f54]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ваш номер телефона?
                    </label>
                    <Input 
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border-[#001f54]/30 focus:border-[#001f54]"
                    />
                  </div>

                  <p className="text-sm text-gray-600 italic">
                    В ближайшее время мы свяжемся с вами для прохождения бесплатной диагностики.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-[#001f54] text-[#001f54] hover:bg-[#001f54]/5"
                >
                  <Icon name="ArrowLeft" size={20} className="mr-2" />
                  Назад
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!name || !phone}
                  className="flex-1 bg-[#001f54] hover:bg-[#002b6b] text-white font-bold disabled:opacity-50"
                >
                  Отправить
                  <Icon name="Check" size={20} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {submitted && (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl border-2 border-green-300">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Check" size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-3">
                  Отлично! Обучение пройдено!
                </h3>
                <p className="text-lg text-green-700 mb-4">
                  Вы успешно освоили скрипт продаж онлайн-школы "Сотка"
                </p>
                <div className="bg-white p-4 rounded-lg shadow-sm text-left space-y-2">
                  <p className="text-sm text-gray-700">
                    <strong>Имя:</strong> {name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Телефон:</strong> {phone}
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleReset}
                className="bg-[#001f54] hover:bg-[#002b6b] text-white font-bold"
              >
                <Icon name="RotateCcw" size={20} className="mr-2" />
                Пройти заново
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}