import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export default function TrainingTab() {
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
