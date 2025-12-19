import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIHelperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HELP_TOPICS = [
  {
    id: 'work-conditions',
    title: 'Условия работы',
    answer: 'УСЛОВИЯ РАБОТЫ В ОРГАНИЗАЦИИ:\n\n💰 СИСТЕМА ОПЛАТЫ:\n1. До 10 контактов — оплата составляет 200 рублей\n2. 10 контактов и более — оплата составляет 300 рублей\n\n📅 ГРАФИК РАБОТЫ:\n3. Промоутер обязан заполнять график смен в личном кабинете каждое воскресенье до 18:00. Минимальное количество смен в неделю — 3 (три).\n\n⚠️ ШТРАФНЫЕ САНКЦИИ:\n4. Невыход на смену без уважительной причины влечет за собой штраф в размере 3000 (трех тысяч) рублей.\n5. В случае невыхода на смену по причине болезни предоставляется освобождение от работы на семь календарных дней.\n\n💵 ВЫПЛАТА ЗАРАБОТНОЙ ПЛАТЫ:\n6. Заработная плата выплачивается один раз в неделю, в понедельник вечером, на общем собрании сотрудников.'
  }
];

export default function AIHelper({ open, onOpenChange }: AIHelperProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Привет! Я AI-помощник IMPERIA PROMO. Задай мне любой вопрос о работе с сайтом, и я помогу разобраться! 😊',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('услов') || 
        lowerQuestion.includes('оплат') || 
        lowerQuestion.includes('зарплат') ||
        lowerQuestion.includes('контакт') ||
        lowerQuestion.includes('штраф') ||
        lowerQuestion.includes('график') ||
        lowerQuestion.includes('смен') ||
        lowerQuestion.includes('работ')) {
      return HELP_TOPICS[0].answer;
    }
    
    return 'Я могу рассказать об условиях работы в организации:\n\n' +
           '• Система оплаты труда\n' +
           '• Требования к графику работы\n' +
           '• Штрафные санкции\n' +
           '• Порядок выплаты заработной платы\n\n' +
           'Нажмите на вопрос "Условия работы" или спросите меня об этом! 😊';
  };

  const handleSend = () => {
    if (!input.trim()) return;

    setShowWelcome(false);
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const answer = findAnswer(input);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: answer,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleTopicClick = (topic: typeof HELP_TOPICS[0]) => {
    setShowWelcome(false);
    const userMessage: Message = {
      id: Date.now().toString(),
      text: topic.title,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: topic.answer,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleResetChat = () => {
    setShowWelcome(true);
    setMessages([
      {
        id: '1',
        text: 'Привет! Я AI-помощник IMPERIA PROMO. Задай мне любой вопрос о работе с сайтом, и я помогу разобраться! 😊',
        isUser: false,
        timestamp: new Date()
      }
    ]);
    setInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[600px] flex flex-col p-0 gap-0">
        <div className="flex items-center justify-between px-4 py-3 bg-[#001f54] text-white">
          <div className="flex items-center gap-2">
            <Icon name="Bot" size={20} />
            <span className="font-medium">AI-Помощник</span>
          </div>
          <div className="flex items-center gap-1">
            {!showWelcome && (
              <Button
                onClick={handleResetChat}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 h-8 w-8 p-0"
              >
                <Icon name="ArrowLeft" size={18} />
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 h-8 w-8 p-0"
            >
              <Icon name="X" size={18} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {showWelcome && (
            <div className="grid grid-cols-1 gap-2 mb-4">
              {HELP_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic)}
                  className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-sm"
                >
                  {topic.title}
                </button>
              ))}
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.isUser
                    ? 'bg-[#001f54] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t bg-white">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Напишите ваш вопрос..."
              className="min-h-[40px] max-h-[100px] resize-none text-sm"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-[#001f54] hover:bg-[#002b6b] h-10 px-4"
            >
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}