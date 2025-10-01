import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const prizes = [
  { id: 1, name: '2000₽ на Озон', icon: 'Gift', color: 'from-purple-500 to-pink-500' },
  { id: 2, name: '2 месяца бесплатного обучения', icon: 'GraduationCap', color: 'from-blue-500 to-cyan-500' },
  { id: 3, name: 'Сертификат на 1000₽', icon: 'Award', color: 'from-orange-500 to-red-500' },
  { id: 4, name: 'Скидка 50% на курс', icon: 'Percent', color: 'from-green-500 to-emerald-500' },
  { id: 5, name: 'Бесплатная консультация', icon: 'MessageCircle', color: 'from-indigo-500 to-purple-500' },
];

export default function Index() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<typeof prizes[0] | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  const handleSpin = () => {
    if (hasPlayed) return;
    
    setIsSpinning(true);
    setSelectedPrize(null);
    
    setTimeout(() => {
      const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
      setSelectedPrize(randomPrize);
      setIsSpinning(false);
      setHasPlayed(true);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <img 
            src="https://cdn.poehali.dev/files/77022773-1a1b-4082-9d64-970e336eaba2.png"
            alt="100сотка"
            className="w-full h-auto"
          />
        </div>

        <Card className="w-full p-8 bg-white/95 backdrop-blur-sm shadow-2xl">
          <div className="text-center space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Беспроигрышная лотерея! 🎉
            </h1>
            <p className="text-lg text-gray-600">
              Нажми на кнопку и получи свой приз!
            </p>

            {!isSpinning && !selectedPrize && (
              <Button
                onClick={handleSpin}
                disabled={hasPlayed}
                size="lg"
                className="w-full md:w-auto px-12 py-6 text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg transform transition-all hover:scale-105"
              >
                <Icon name="Sparkles" size={24} className="mr-2" />
                {hasPlayed ? 'Вы уже участвовали' : 'Розыгрыш'}
              </Button>
            )}

            {isSpinning && (
              <div className="py-12 space-y-4">
                <div className="w-20 h-20 mx-auto border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-2xl font-bold text-blue-600 animate-pulse">
                  Выбираем приз...
                </p>
              </div>
            )}

            {selectedPrize && (
              <div className="py-8 space-y-6 animate-in fade-in zoom-in duration-500">
                <div className={`mx-auto w-32 h-32 rounded-full bg-gradient-to-br ${selectedPrize.color} flex items-center justify-center shadow-xl`}>
                  <Icon name={selectedPrize.icon as any} size={64} className="text-white" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-gray-700">
                    Поздравляем! 🎊
                  </p>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    {selectedPrize.name}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  Свяжитесь с нами для получения приза
                </p>
              </div>
            )}

            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Возможные призы: 2000₽ на Озон, 2 месяца бесплатного обучения, сертификаты и скидки
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
