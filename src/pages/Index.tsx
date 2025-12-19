import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const API_URL = 'https://functions.poehali.dev/0ad02a38-2c6b-4268-adec-c3bf7bb197c2';

interface Player {
  player_id: string;
  name: string;
  beans: number;
  rank: number;
}

interface PlayerData {
  player_id: string;
  name: string;
  beans: number;
  total_earned: number;
  total_withdrawn: number;
  channel_joined: boolean;
}

interface Withdrawal {
  id: number;
  player_id: string;
  player_name: string;
  amount: number;
  account_id: string;
  status: string;
  created_at: string;
}

interface SupportMessage {
  id: number;
  player_id: string;
  player_name: string;
  message: string;
  status: string;
  created_at: string;
}

interface AllPlayer {
  player_id: string;
  name: string;
  beans: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
}

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [adminTab, setAdminTab] = useState('players');
  const [playerId, setPlayerId] = useState<string>('');
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [question, setQuestion] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const [adminAmount, setAdminAmount] = useState('');
  
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [allPlayers, setAllPlayers] = useState<AllPlayer[]>([]);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem('player_id');
    const storedAdminToken = localStorage.getItem('admin_token');
    
    if (!storedPlayerId) {
      const newPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('player_id', newPlayerId);
      setPlayerId(newPlayerId);
    } else {
      setPlayerId(storedPlayerId);
    }

    if (storedAdminToken) {
      setAdminToken(storedAdminToken);
      verifyAdmin(storedAdminToken);
    }

    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (playerId) {
      loadPlayerData();
    }
  }, [playerId]);

  useEffect(() => {
    if (isAdmin && adminToken) {
      loadAdminData();
    }
  }, [isAdmin, adminToken, adminTab]);

  const verifyAdmin = async (token: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
        },
        body: JSON.stringify({ action: 'verify_admin' }),
      });
      const data = await response.json();
      setIsAdmin(data.valid);
      if (!data.valid) {
        localStorage.removeItem('admin_token');
        setAdminToken('');
      }
    } catch (error) {
      console.error('Admin verification failed:', error);
    }
  };

  const loadPlayerData = async () => {
    try {
      const response = await fetch(`${API_URL}?endpoint=player`, {
        headers: { 'X-Player-Id': playerId },
      });
      const data = await response.json();
      setPlayerData(data);
    } catch (error) {
      console.error('Failed to load player data:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}?endpoint=leaderboard`);
      const data = await response.json();
      setTopPlayers(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const loadAdminData = async () => {
    try {
      if (adminTab === 'withdrawals') {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
          },
          body: JSON.stringify({ action: 'admin_get_withdrawals' }),
        });
        const data = await response.json();
        setWithdrawals(data);
      } else if (adminTab === 'messages') {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
          },
          body: JSON.stringify({ action: 'admin_get_messages' }),
        });
        const data = await response.json();
        setMessages(data);
      } else if (adminTab === 'players') {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
          },
          body: JSON.stringify({ action: 'admin_get_all_players' }),
        });
        const data = await response.json();
        setAllPlayers(data);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const handleAdminLogin = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_login', password: adminPassword }),
      });
      const data = await response.json();
      
      if (data.success) {
        setAdminToken(data.token);
        localStorage.setItem('admin_token', data.token);
        setIsAdmin(true);
        setShowAdminDialog(false);
        setAdminPassword('');
        toast({ title: '✅ Доступ получен', description: 'Админ панель активирована' });
      } else {
        toast({ title: '❌ Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка', description: 'Не удалось войти', variant: 'destructive' });
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!accountId) {
      toast({ title: '❌ Ошибка', description: 'Укажите ID аккаунта', variant: 'destructive' });
      return;
    }
    if (!amount || amount <= 0 || amount > (playerData?.beans || 0)) {
      toast({ title: '❌ Ошибка', description: 'Некорректная сумма вывода', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Player-Id': playerId,
        },
        body: JSON.stringify({ action: 'withdraw', amount, account_id: accountId }),
      });
      const data = await response.json();

      if (data.success) {
        toast({ title: '✅ Успешно!', description: `${amount} мини бобов отправлено на аккаунт ${accountId}` });
        setWithdrawAmount('');
        setAccountId('');
        await loadPlayerData();
        await loadLeaderboard();
      } else {
        toast({ title: '❌ Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка', description: 'Не удалось выполнить вывод', variant: 'destructive' });
    }
  };

  const handleSendQuestion = async () => {
    if (!question.trim()) {
      toast({ title: '❌ Ошибка', description: 'Напишите ваш вопрос', variant: 'destructive' });
      return;
    }

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Player-Id': playerId,
        },
        body: JSON.stringify({ action: 'send_question', question }),
      });
      toast({ title: '📨 Отправлено!', description: 'Ваш вопрос отправлен администратору' });
      setQuestion('');
    } catch (error) {
      toast({ title: '❌ Ошибка', description: 'Не удалось отправить вопрос', variant: 'destructive' });
    }
  };

  const handleAdminUpdate = async (targetId: string, amount: number) => {
    if (!targetId || !amount) {
      toast({ title: '❌ Ошибка', description: 'Укажите ID игрока и сумму', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify({ action: 'admin_update_balance', target_player_id: targetId, amount }),
      });
      const data = await response.json();

      if (data.success) {
        toast({ 
          title: '✅ Баланс обновлен', 
          description: `${amount > 0 ? 'Начислено' : 'Списано'} ${Math.abs(amount)} бобов` 
        });
        setTargetPlayerId('');
        setAdminAmount('');
        await loadLeaderboard();
        await loadAdminData();
        if (targetId === playerId) {
          await loadPlayerData();
        }
      } else {
        toast({ title: '❌ Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка', description: 'Не удалось обновить баланс', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 p-4">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-2 pt-8 pb-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-scale-in">
            🎮 Mini World Beans
          </h1>
          <p className="text-muted-foreground text-lg">Зарабатывай мини бобы в игре!</p>
          {!isAdmin && (
            <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs opacity-50">
                  <Icon name="Shield" size={14} className="mr-1" />
                  Админ
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Вход администратора</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    type="password"
                    placeholder="Введите пароль"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                  />
                  <Button onClick={handleAdminLogin} className="w-full">
                    Войти
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="p-6 bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/30 hover-scale">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Ваш баланс</p>
              <p className="text-5xl font-bold text-primary pulse-glow">{playerData?.beans || 0}</p>
              <p className="text-xs text-muted-foreground">мини бобов</p>
            </div>
            <div className="text-6xl animate-pulse">🫘</div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto gap-2 bg-card/50 p-2">
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
                  <h3 className="text-2xl font-bold">{playerData?.name || 'Игрок'}</h3>
                  <Badge variant="outline" className="bg-primary/20 border-primary">
                    <Icon name="Award" size={14} className="mr-1" />
                    Активный игрок
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Всего заработано:</span>
                  <span className="font-bold text-lg">{playerData?.total_earned || 0} 🫘</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Выведено:</span>
                  <span className="font-bold text-lg">{playerData?.total_withdrawn || 0} 🫘</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Доступно:</span>
                  <span className="font-bold text-lg text-primary">{playerData?.beans || 0} 🫘</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Icon name="Trophy" size={24} className="text-secondary" />
                <h3 className="text-xl font-bold">Топ игроков</h3>
              </div>
              <div className="space-y-2">
                {topPlayers.length > 0 ? topPlayers.map((player) => (
                  <div
                    key={player.player_id}
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
                )) : (
                  <p className="text-center text-muted-foreground py-4">Пока нет игроков в рейтинге</p>
                )}
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
                    max={playerData?.beans || 0}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Доступно: {playerData?.beans || 0} 🫘
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

            <Tabs value={adminTab} onValueChange={setAdminTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto gap-2 bg-card/50 p-2">
                <TabsTrigger value="players" className="flex flex-col gap-1 py-2">
                  <Icon name="Users" size={18} />
                  <span className="text-xs">Игроки</span>
                </TabsTrigger>
                <TabsTrigger value="withdrawals" className="flex flex-col gap-1 py-2">
                  <Icon name="ArrowDownToLine" size={18} />
                  <span className="text-xs">Выводы</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex flex-col gap-1 py-2">
                  <Icon name="MessageCircle" size={18} />
                  <span className="text-xs">Сообщения</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="players" className="space-y-4 mt-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allPlayers.map((player) => (
                    <Card key={player.player_id} className="p-4 bg-background/50">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{player.name}</p>
                            <p className="text-xs text-muted-foreground">{player.player_id}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{player.beans} 🫘</p>
                            <p className="text-xs text-muted-foreground">
                              Заработано: {player.total_earned} | Выведено: {player.total_withdrawn}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="+100 или -50"
                            className="flex-1"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.currentTarget;
                                handleAdminUpdate(player.player_id, parseInt(input.value));
                                input.value = '';
                              }
                            }}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              handleAdminUpdate(player.player_id, parseInt(input.value));
                              input.value = '';
                            }}
                          >
                            <Icon name="Check" size={16} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="withdrawals" className="space-y-4 mt-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {withdrawals.length > 0 ? withdrawals.map((withdrawal) => (
                    <Card key={withdrawal.id} className="p-4 bg-background/50">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{withdrawal.player_name}</p>
                            <p className="text-xs text-muted-foreground">{withdrawal.player_id}</p>
                          </div>
                          <Badge variant={withdrawal.status === 'pending' ? 'default' : 'secondary'}>
                            {withdrawal.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Сумма: <strong>{withdrawal.amount} 🫘</strong></span>
                          <span>ID аккаунта: <strong>{withdrawal.account_id}</strong></span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(withdrawal.created_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </Card>
                  )) : (
                    <p className="text-center text-muted-foreground py-8">Нет выводов</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="messages" className="space-y-4 mt-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {messages.length > 0 ? messages.map((message) => (
                    <Card key={message.id} className="p-4 bg-background/50">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{message.player_name}</p>
                            <p className="text-xs text-muted-foreground">{message.player_id}</p>
                          </div>
                          <Badge variant={message.status === 'new' ? 'default' : 'secondary'}>
                            {message.status === 'new' ? 'Новое' : 'Прочитано'}
                          </Badge>
                        </div>
                        <p className="text-sm bg-muted/30 p-3 rounded">{message.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </Card>
                  )) : (
                    <p className="text-center text-muted-foreground py-8">Нет сообщений</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}

        <div className="text-center text-sm text-muted-foreground pb-8">
          <p className="text-xs opacity-50">ID: {playerId}</p>
          <p>Mini World Create Beans Bot 2024</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
