import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface TrainingTabProps {
  organizationName: string;
}

export default function TrainingTab({ organizationName }: TrainingTabProps) {
  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleStart = () => setStep(1);
  const handleNext = () => setStep(2);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({ 
        title: 'Ошибка доступа к микрофону',
        description: 'Разрешите доступ к микрофону для записи аудио',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!audioBlob) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо записать аудио перед отправкой',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const reader = new FileReader();
      const audioData = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      const response = await fetch('https://functions.poehali.dev/ecd9eaa3-7399-4f8b-8219-529b81f87b6a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notes.trim(),
          audio_data: audioData,
          organization_id: null,
          organization_name: organizationName
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка сети');
      }

      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
      } else {
        throw new Error(result.error || 'Неизвестная ошибка');
      }
    } catch (error) {
      console.error('Send error:', error);
      toast({ 
        title: 'Ошибка отправки',
        description: 'Не удалось отправить данные. Попробуйте снова.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setNotes('');
    setAudioBlob(null);
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
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-[#001f54] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    1
                  </div>
                  <p className="font-bold text-[#001f54] text-lg">ШАГ 1: Начните разговор</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-[#001f54]/20">
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    💬 Скажите родителю:
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
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-[#001f54] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    2
                  </div>
                  <p className="font-bold text-[#001f54] text-lg">ШАГ 2: Расскажите о подарках</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-[#001f54]/20 mb-3">
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    💬 Скажите родителю:
                  </p>
                  <p className="text-lg text-gray-900 mb-4">
                    "Онлайн-школа <span className="font-bold">"Сотка"</span> дарит подарки:"
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-[#001f54]/5 p-4 rounded-lg border-2 border-[#001f54]/30">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#002b6b] text-white flex items-center justify-center font-bold text-lg">
                          🎁
                        </div>
                        <div>
                          <p className="font-bold text-lg text-[#001f54] mb-2">
                            ПОДАРОК 1: 2 месяца бесплатного обучения
                          </p>
                          <p className="text-gray-700">
                            Заходите на наш сайт <span className="font-bold">sotkaonline.ru</span>, выбираете любой предмет (например русский или математика) и занимаетесь абсолютно бесплатно!
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#001f54]/5 p-4 rounded-lg border-2 border-[#001f54]/30">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#002b6b] text-white flex items-center justify-center font-bold text-lg">
                          🎁
                        </div>
                        <div>
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
                </div>
              </div>

              {/* Скрипт - Шаг 3: Сбор данных */}
              <div className="bg-[#001f54]/5 border-l-4 border-[#001f54] p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-[#001f54] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    3
                  </div>
                  <p className="font-bold text-[#001f54] text-lg">ШАГ 3: СОБЕРИТЕ ДАННЫЕ (ВАЖНО!)</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-[#001f54]/20">
                  <p className="text-lg font-semibold text-[#001f54] mb-4">
                    ⚠️ Теперь спросите у родителя:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-[#001f54]/5 p-3 rounded-lg border border-[#001f54]/30">
                      <p className="font-bold text-[#001f54] text-lg">
                        ❓ "Как вас зовут?"
                      </p>
                      <p className="text-sm text-gray-600 mt-1">(Запишите имя родителя)</p>
                    </div>
                    <div className="bg-[#001f54]/5 p-3 rounded-lg border border-[#001f54]/30">
                      <p className="font-bold text-[#001f54] text-lg">
                        ❓ "Ваш номер телефона?"
                      </p>
                      <p className="text-sm text-gray-600 mt-1">(Объясните: чтобы отправить ссылку на школу в WhatsApp)</p>
                    </div>
                    <div className="bg-[#001f54]/5 p-3 rounded-lg border border-[#001f54]/30">
                      <p className="font-bold text-[#001f54] text-lg">
                        ❓ "В каком классе учится ваш ребенок?"
                      </p>
                      <p className="text-sm text-gray-600 mt-1">(Запишите класс)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  Понятно! Перейти к записи данных
                  <Icon name="ArrowRight" size={20} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && !submitted && (
            <div className="space-y-4 md:space-y-6">
              {/* Блокнот */}
              <Card className="bg-white border-[#001f54]/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-[#001f54]">
                    <div className="p-1.5 md:p-2 rounded-lg bg-[#001f54]/10">
                      <Icon name="NotebookPen" size={18} className="text-[#001f54] md:w-5 md:h-5" />
                    </div>
                    Блокнот
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Введите ваши заметки здесь..."
                    className="min-h-[120px] md:min-h-[150px] bg-white border-gray-200 text-[#001f54] placeholder:text-gray-400 resize-none focus:border-[#001f54] focus:ring-[#001f54]/20 transition-all duration-300 text-sm md:text-base"
                  />
                </CardContent>
              </Card>

              {/* Аудиозапись */}
              <Card className="bg-white border-[#001f54]/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-[#001f54]">
                    <div className="p-1.5 md:p-2 rounded-lg bg-[#001f54]/10">
                      <Icon name="Star" size={18} className="text-[#001f54] md:w-5 md:h-5" />
                    </div>
                    Контроль качества
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-4">
                      {!isRecording ? (
                        <Button
                          onClick={startRecording}
                          size="lg"
                          className="bg-[#001f54] hover:bg-[#002b6b] text-white rounded-full w-16 h-16 md:w-20 md:h-20 p-0 transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl"
                        >
                          <Icon name="Star" size={24} className="md:w-8 md:h-8" />
                        </Button>
                      ) : (
                        <div className="relative">
                          <style>{`
                            @keyframes breathing {
                              0%, 100% {
                                opacity: 0.6;
                                transform: scale(1);
                              }
                              50% {
                                opacity: 1;
                                transform: scale(1.05);
                              }
                            }
                            @keyframes squareFade {
                              0%, 100% {
                                opacity: 0.3;
                                transform: scale(0.8);
                              }
                              50% {
                                opacity: 1;
                                transform: scale(1.1);
                              }
                            }
                            .breathing-animation {
                              animation: breathing 3s ease-in-out infinite;
                            }
                            .square-fade-animation {
                              animation: squareFade 3s ease-in-out infinite;
                            }
                          `}</style>
                          <Button
                            onClick={stopRecording}
                            size="lg"
                            className="bg-[#002b6b] hover:bg-[#003d8f] text-white rounded-full w-16 h-16 md:w-20 md:h-20 p-0 shadow-xl breathing-animation"
                          >
                            <div className="square-fade-animation">
                              <Icon name="Square" size={24} className="md:w-8 md:h-8" />
                            </div>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Кнопки */}
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
                  disabled={isLoading || !audioBlob}
                  className="flex-1 bg-[#001f54] hover:bg-[#002b6b] text-white font-bold disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Icon name="Loader2" size={20} className="animate-spin" />
                      <span>Отправка...</span>
                    </div>
                  ) : (
                    <>
                      Отправить
                      <Icon name="Send" size={20} className="ml-2" />
                    </>
                  )}
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
                <p className="text-sm text-gray-600">
                  Ваши данные отправлены в Telegram
                </p>
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