import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Player {
  id: number;
  name: string;
  beans: number;
  rank: number;
}

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [userBeans, setUserBeans] = useState(150);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [question, setQuestion] = useState('');
  const [isChannelJoined, setIsChannelJoined] = useState(false);
  const [isAdmin] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [adminAmount, setAdminAmount] = useState('');

  const topPlayers: Player[] = [
    { id: 1, name: 'ProGamer123', beans: 5420, rank: 1 },
    { id: 2, name: 'MiniMaster', beans: 4850, rank: 2 },
    { id: 3, name: 'BeanHunter', beans: 3990, rank: 3 },
    { id: 4, name: 'WorldBuilder', beans: 3450, rank: 4 },
    { id: 5, name: 'CraftKing', beans: 2980, rank: 5 },
  ];

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (!accountId) {
      toast({
        title: '❌ Ошибка',
        description: 'Укажите ID аккаунта',
        variant: 'destructive',
      });
      return;
    }
    if (!amount || amount <= 0 || amount > userBeans) {
      toast({
        title: '❌ Ошибка',
        description: 'Некорректная сумма вывода',
        variant: 'destructive',
      });
      return;
    }
    setUserBeans(userBeans - amount);
    toast({
      title: '✅ Успешно!',
      description: `${amount} мини бобов отправлено на аккаунт ${accountId}`,
    });
    setWithdrawAmount('');
    setAccountId('');
  };

  const handleJoinChannel = () => {
    window.open('https://t.me/miniworld_beans', '_blank');
    setTimeout(() => {
      setIsChannelJoined(true);
      toast({
        title: '🎉 Отлично!',
        description: 'Проверяем вступление в канал...',
      });
      setTimeout(() => {
        setUserBeans(userBeans + 50);
        toast({
          title: '💰 +50 мини бобов!',
          description: 'Награда за вступление в канал получена',
        });
      }, 2000);
    }, 1000);
  };

  const handleSendQuestion = () => {
    if (!question.trim()) {
      toast({
        title: '❌ Ошибка',
        description: 'Напишите ваш вопрос',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: '📨 Отправлено!',
      description: 'Ваш вопрос отправлен администратору',
    });
    setQuestion('');
  };

  const handleAdminUpdate = () => {
    const amount = parseInt(adminAmount);
    if (!selectedPlayer || !amount) {
      toast({
        title: '❌ Ошибка',
        description: 'Выберите игрока и укажите сумму',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: '✅ Баланс обновлен',
      description: `Игроку #${selectedPlayer} ${amount > 0 ? 'начислено' : 'списано'} ${Math.abs(amount)} бобов`,
    });
    setSelectedPlayer(null);
    setAdminAmount('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 p-4">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-2 pt-8 pb-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-scale-in">
            🎮 Mini World Beans
          </h1>
          <p className="text-muted-foreground text-lg">Зарабатывай мини бобы в игре!</p>
        </div>

        <Card className="p-6 bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/30 hover-scale">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Ваш баланс</p>
              <p className="text-5xl font-bold text-primary pulse-glow">{userBeans}</p>
              <p className="text-xs text-muted-foreground">мини бобов</p>
            </div>
            <div className="text-6xl animate-pulse">🫘</div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto gap-2 bg-card/50 p-2">
            <TabsTrigger 
              value="profile" 
              className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Icon name="User" size={20} />
              <span className="text-xs">Профиль</span>
            </TabsTrigger>
            <TabsTrigger 
              value="withdraw" 
              className="flex flex-col gap-1 py-3 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
            >
              <Icon name="ArrowDownToLine" size={20} />
              <span className="text-xs">Вывод</span>
            </TabsTrigger>
            <TabsTrigger 
              value="earn" 
              className="flex flex-col gap-1 py-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Icon name="TrendingUp" size={20} />
              <span className="text-xs">Заработок</span>
            </TabsTrigger>
            <TabsTrigger 
              value="help" 
              className="flex flex-col gap-1 py-3 data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              <Icon name="MessageCircle" size={20} />
              <span className="text-xs">Помощь</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-6">
            <Card className="p-6 space-y-6 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl">
                  👤
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold">Игрок #12345</h3>
                  <Badge variant="outline" className="bg-primary/20 border-primary">
                    <Icon name="Award" size={14} className="mr-1" />
                    Активный игрок
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Всего заработано:</span>
                  <span className="font-bold text-lg">750 🫘</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Выведено:</span>
                  <span className="font-bold text-lg">600 🫘</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Доступно:</span>
                  <span className="font-bold text-lg text-primary">{userBeans} 🫘</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Icon name="Trophy" size={24} className="text-secondary" />
                <h3 className="text-xl font-bold">Топ игроков</h3>
              </div>
              <div className="space-y-2">
                {topPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        player.rank === 1 ? 'bg-secondary text-secondary-foreground' :
                        player.rank === 2 ? 'bg-muted-foreground/30' :
                        player.rank === 3 ? 'bg-primary/30' : 'bg-muted'
                      }`}>
                        {player.rank}
                      </div>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <span className="font-bold text-primary">{player.beans} 🫘</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4 mt-6">
            <Card className="p-6 space-y-4 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Icon name="ArrowDownToLine" size={24} className="text-secondary" />
                <h3 className="text-xl font-bold">Вывод мини бобов</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Выведите заработанные мини бобы на ваш аккаунт Mini World Create
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID аккаунта Mini World</label>
                  <Input
                    placeholder="Введите ваш ID"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Количество бобов</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={userBeans}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Доступно: {userBeans} 🫘
                  </p>
                </div>

                <Button
                  onClick={handleWithdraw}
                  className="w-full bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-lg py-6"
                  size="lg"
                >
                  <Icon name="Send" size={20} className="mr-2" />
                  Вывести бобы
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="earn" className="space-y-4 mt-6">
            <Card className="p-6 space-y-4 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Icon name="TrendingUp" size={24} className="text-accent" />
                <h3 className="text-xl font-bold">Заработать бобы</h3>
              </div>

              <Card className="p-4 bg-gradient-to-br from-accent/20 to-primary/10 border-accent/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold text-lg">Вступи в канал</h4>
                      <p className="text-sm text-muted-foreground">
                        Присоединяйся к нашему Telegram каналу
                      </p>
                    </div>
                    <div className="text-3xl font-bold text-accent">+50</div>
                  </div>
                  <Progress value={isChannelJoined ? 100 : 0} className="h-2" />
                  <Button
                    onClick={handleJoinChannel}
                    disabled={isChannelJoined}
                    className="w-full bg-accent hover:bg-accent/90"
                    size="lg"
                  >
                    {isChannelJoined ? (
                      <>
                        <Icon name="CheckCircle" size={20} className="mr-2" />
                        Выполнено
                      </>
                    ) : (
                      <>
                        <Icon name="Users" size={20} className="mr-2" />
                        Вступить в канал
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              <div className="grid gap-3 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Icon name="Gift" size={24} className="text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Ежедневная награда</p>
                    <p className="text-xs text-muted-foreground">Скоро...</p>
                  </div>
                  <Badge variant="secondary">+20</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Icon name="Share2" size={24} className="text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Пригласи друга</p>
                    <p className="text-xs text-muted-foreground">Скоро...</p>
                  </div>
                  <Badge variant="secondary">+100</Badge>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="help" className="space-y-4 mt-6">
            <Card className="p-6 space-y-4 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Icon name="MessageCircle" size={24} className="text-primary" />
                <h3 className="text-xl font-bold">Техподдержка</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Возникли вопросы? Отправьте сообщение администратору
              </p>

              <div className="space-y-4">
                <Textarea
                  placeholder="Опишите ваш вопрос или проблему..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-32 bg-background/50"
                />
                <Button
                  onClick={handleSendQuestion}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Icon name="Send" size={20} className="mr-2" />
                  Отправить сообщение
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {isAdmin && (
          <Card className="p-6 space-y-4 bg-gradient-to-br from-destructive/20 to-destructive/10 border-2 border-destructive/30">
            <div className="flex items-center gap-2">
              <Icon name="Shield" size={24} className="text-destructive" />
              <h3 className="text-xl font-bold text-destructive">Админ панель</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ID игрока</label>
                <Input
                  type="number"
                  placeholder="Введите ID"
                  value={selectedPlayer || ''}
                  onChange={(e) => setSelectedPlayer(parseInt(e.target.value))}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Изменить баланс</label>
                <Input
                  type="number"
                  placeholder="+100 или -50"
                  value={adminAmount}
                  onChange={(e) => setAdminAmount(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <Button
                onClick={handleAdminUpdate}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <Icon name="Zap" size={20} className="mr-2" />
                Обновить баланс
              </Button>
            </div>
          </Card>
        )}

        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>Mini World Create Beans Bot 2024</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
