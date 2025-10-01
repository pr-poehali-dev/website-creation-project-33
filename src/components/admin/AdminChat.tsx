import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export default function AdminChat() {
  return (
    <Card className="bg-white shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#001f54]">
          <Icon name="MessageCircle" size={24} />
          Чат с промоутерами
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-gray-500">
          <Icon name="MessageCircle" size={48} className="mx-auto mb-4 opacity-30" />
          <p>Функционал чата в разработке</p>
        </div>
      </CardContent>
    </Card>
  );
}
