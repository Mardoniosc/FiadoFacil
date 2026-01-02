import { useStore, QuickItem } from "@/lib/store";
import { Link } from "wouter";
import { useState } from "react";
import { Plus, Search, User, FileDown, Upload, AlertCircle, WifiOff, ShoppingBag, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type SortOption = "debt" | "name" | "oldest";

export default function Home() {
  const { 
    customers, 
    quickItems,
    getCustomerBalance, 
    getLastTransactionDate, 
    addCustomer, 
    exportData, 
    importData,
    addQuickItem,
    updateQuickItem,
    deleteQuickItem
  } = useStore();
  
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("debt");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerNickname, setNewCustomerNickname] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  
  // Quick Item Management State
  const [qiName, setQiName] = useState("");
  const [qiPrice, setQiPrice] = useState("");
  const [editingQi, setEditingQi] = useState<QuickItem | null>(null);
  const [qiDialogOpen, setQiDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const handleAddCustomer = () => {
    if (!newCustomerName.trim()) {
       toast({ title: "Nome obrigatório", variant: "destructive" });
       return;
    }
    addCustomer({
      name: newCustomerName,
      nickname: newCustomerNickname,
      phone: newCustomerPhone,
    });
    setNewCustomerName("");
    setNewCustomerNickname("");
    setNewCustomerPhone("");
    toast({ title: "Cliente adicionado!" });
  };

  const handleSaveQuickItem = () => {
    if (!qiName.trim() || !qiPrice) {
        toast({ title: "Preencha nome e preço", variant: "destructive" });
        return;
    }
    const priceNum = parseFloat(qiPrice.toString().replace(",", "."));
    if (isNaN(priceNum)) return;

    if (editingQi) {
        updateQuickItem(editingQi.id, { name: qiName, price: priceNum });
        toast({ title: "Item atualizado" });
    } else {
        addQuickItem({ name: qiName, price: priceNum });
        toast({ title: "Item adicionado" });
    }
    setQiName("");
    setQiPrice("");
    setEditingQi(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const success = importData(event.target?.result as string);
        if (success) {
          toast({ title: "Backup restaurado com sucesso!" });
        } else {
          toast({ title: "Erro ao restaurar backup", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    }
  };

  // Sort and filter customers
  const filteredCustomers = customers
    .filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.nickname && c.nickname.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const balanceA = getCustomerBalance(a.id);
      const balanceB = getCustomerBalance(b.id);
      
      if (sort === "debt") {
          return balanceB - balanceA || a.name.localeCompare(b.name);
      } else if (sort === "name") {
          return a.name.localeCompare(b.name);
      } else if (sort === "oldest") {
          const dateA = getLastTransactionDate(a.id) || a.createdAt;
          const dateB = getLastTransactionDate(b.id) || b.createdAt;
          return new Date(dateA).getTime() - new Date(dateB).getTime(); 
      }
      return 0;
    });

  const isOffline = !navigator.onLine;

  return (
    <div className="min-h-screen bg-background pb-20 paper-lines">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
             <h1 className="text-3xl font-bold text-primary font-hand">Fiado Fácil</h1>
             <p className="text-sm text-muted-foreground font-medium">Bar da leide</p>
          </div>
          <div className="flex gap-2">
             <Dialog open={qiDialogOpen} onOpenChange={setQiDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10">
                        <ShoppingBag className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-hand text-2xl">Itens Rápidos</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-muted/30 p-4 rounded-lg space-y-3 border-2 border-primary/10">
                            <h4 className="font-bold text-sm uppercase text-muted-foreground">{editingQi ? 'Editar Item' : 'Novo Item Rápido'}</h4>
                            <div className="flex flex-col gap-2">
                                <Input 
                                    placeholder="Nome (Ex: Cerveja)" 
                                    className="h-12 text-lg"
                                    value={qiName}
                                    onChange={e => setQiName(e.target.value)}
                                />
                                <Input 
                                    placeholder="Preço R$" 
                                    type="number"
                                    step="0.01"
                                    className="h-12 text-lg"
                                    value={qiPrice}
                                    onChange={e => setQiPrice(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handleSaveQuickItem} className="flex-1 h-12 text-lg">
                                        {editingQi ? 'Salvar' : 'Adicionar'}
                                    </Button>
                                    {editingQi && (
                                        <Button variant="ghost" onClick={() => {
                                            setEditingQi(null);
                                            setQiName("");
                                            setQiPrice("");
                                        }} className="h-12">Cancelar</Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-bold text-sm uppercase text-muted-foreground">Itens Cadastrados</h4>
                            {quickItems.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item rápido.</p>}
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {quickItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                                        <div>
                                            <p className="font-bold">{item.name}</p>
                                            <p className="text-sm text-green-600 font-bold">R$ {item.price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                setEditingQi(item);
                                                setQiName(item.name);
                                                setQiPrice(item.price.toString());
                                            }}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteQuickItem(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
             </Dialog>

             <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <FileDown className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Backup</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Button onClick={exportData} className="w-full text-lg h-14" variant="outline">
                      <FileDown className="mr-2 h-6 w-6" />
                      Baixar Backup
                    </Button>
                    <div className="relative">
                       <Button className="w-full text-lg h-14" variant="secondary">
                         <Upload className="mr-2 h-6 w-6" />
                         Restaurar Backup
                       </Button>
                       <Input 
                         type="file" 
                         className="absolute inset-0 opacity-0 cursor-pointer h-full" 
                         onChange={handleImport}
                         accept=".json"
                       />
                    </div>
                  </div>
                </DialogContent>
             </Dialog>
          </div>
        </div>
      </header>

      {/* Offline Indicator */}
      {isOffline && (
        <div className="bg-yellow-100 p-2 text-center text-yellow-800 font-medium flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          Modo Offline
        </div>
      )}

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-2 flex-col sm:flex-row">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Buscar cliente..." 
                className="pl-10 h-14 text-xl bg-card shadow-sm border-2 focus-visible:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-[180px] h-14 text-lg bg-card border-2">
                    <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="debt">Maior Dívida</SelectItem>
                    <SelectItem value="name">Nome (A-Z)</SelectItem>
                    <SelectItem value="oldest">Mais Antigo</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-auto py-8 text-2xl font-bold shadow-lg bg-primary hover:bg-primary/90 w-full sm:col-span-2 lg:col-span-3">
                <Plus className="mr-2 h-8 w-8" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-2xl font-hand">Novo Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xl">Nome</Label>
                  <Input 
                    id="name" 
                    value={newCustomerName} 
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="h-14 text-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-xl">Apelido</Label>
                  <Input 
                    id="nickname" 
                    value={newCustomerNickname} 
                    onChange={(e) => setNewCustomerNickname(e.target.value)}
                    className="h-14 text-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button onClick={handleAddCustomer} className="w-full h-14 text-xl">Salvar Cliente</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {filteredCustomers.map((customer) => {
            const balance = getCustomerBalance(customer.id);
            const lastDate = getLastTransactionDate(customer.id);
            const isOldDebt = lastDate && (new Date().getTime() - new Date(lastDate).getTime() > 30 * 24 * 60 * 60 * 1000);

            return (
              <Link href={`/customer/${customer.id}`} key={customer.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 active:border-primary">
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <User className="h-6 w-6 text-muted-foreground" />
                         <span className="font-bold text-xl text-foreground line-clamp-1">
                           {customer.nickname || customer.name}
                         </span>
                      </div>
                      {isOldDebt && balance > 0 && (
                        <div className="flex items-center text-destructive text-sm font-bold pl-8 mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Conta Antiga
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-bold font-hand ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
