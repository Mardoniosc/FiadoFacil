import { useStore, Transaction } from "@/lib/store";
import { useRoute, Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Trash2, Printer, CheckCircle, PlusCircle, AlertCircle, ShoppingBag } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CustomerDetails() {
  const [, params] = useRoute("/customer/:id");
  const { 
    customers, 
    transactions, 
    quickItems,
    addTransaction, 
    deleteTransaction, 
    deleteCustomer, 
    getCustomerBalance 
  } = useStore();
  const { toast } = useToast();
  
  const customerId = params?.id;
  const customer = customers.find((c) => c.id === customerId);
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  
  if (!customer) {
    return <div className="p-4 text-center">Cliente não encontrado <Link href="/">Voltar</Link></div>;
  }

  const customerTransactions = transactions
    .filter((t) => t.customerId === customerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const balance = getCustomerBalance(customer.id);

  const handleAddItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!description || !amount) {
        toast({ title: "Preencha a descrição e o valor", variant: "destructive" });
        return;
    }
    
    const val = typeof amount === 'number' ? amount : parseFloat(amount.replace(",", "."));
    if (isNaN(val) || val <= 0) {
        toast({ title: "Valor inválido", variant: "destructive" });
        return;
    }

    addTransaction({
        customerId: customer.id,
        description,
        amount: val,
        type: "credit"
    });
    
    setDescription("");
    setAmount("");
    setAddDialogOpen(false);
    toast({ title: "Item adicionado!" });
  };

  const handleQuickClick = (name: string, price: number) => {
    addTransaction({
        customerId: customer.id,
        description: name,
        amount: price,
        type: "credit"
    });
    setAddDialogOpen(false);
    toast({ title: `${name} adicionado!` });
  };

  const handlePayment = () => {
     if (balance <= 0) return;
     
     addTransaction({
        customerId: customer.id,
        description: "Pagamento Total",
        amount: balance,
        type: "payment"
     });
     setPaymentDialogOpen(false);
     toast({ title: "Conta paga!" });
  };

  const handlePartialPayment = (val: number) => {
      if (val <= 0) return;
      addTransaction({
        customerId: customer.id,
        description: "Pagamento Parcial",
        amount: val,
        type: "payment"
     });
     setPaymentDialogOpen(false);
     toast({ title: "Pagamento registrado!" });
  }

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    toast({ title: "Item excluído" });
  };
  
  const handlePrint = () => {
    window.print();
  };

  const handleDeleteCustomer = () => {
    deleteCustomer(customer.id);
    toast({ title: "Cliente removido" });
    window.location.href = "/FiadoFacil";
  };

  return (
    <div className="min-h-screen bg-background pb-24 paper-lines">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border shadow-sm print:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
             <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="h-6 w-6" />
             </Button>
          </Link>
          <div className="flex-1">
             <h1 className="text-2xl font-bold text-primary truncate font-hand">{customer.name}</h1>
             {customer.nickname && <p className="text-sm text-muted-foreground">Vulgo: {customer.nickname}</p>}
          </div>
          <Button variant="outline" size="icon" onClick={handlePrint}>
            <Printer className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        
        {/* Balance Card */}
        <Card className="bg-card border-2 border-primary/10 shadow-sm">
            <CardContent className="p-6 text-center space-y-2">
                <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Total a Pagar</p>
                <div className={`text-5xl font-bold font-hand ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
            </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 print:hidden">
             <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="h-20 text-lg flex flex-col gap-1 shadow-md" variant="default">
                        <PlusCircle className="h-6 w-6" />
                        Adicionar Item
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-hand text-xl">Adicionar Consumo</DialogTitle>
                    </DialogHeader>
                    
                    {/* Quick Items Area */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {quickItems.map((item) => (
                            <Button 
                                key={item.id}
                                variant="outline" 
                                className="h-16 flex flex-col items-center justify-center border-2 border-primary/20 hover:bg-primary/5 text-lg font-bold"
                                onClick={() => handleQuickClick(item.name, item.price)}
                            >
                                <span className="text-sm font-normal text-muted-foreground">{item.name}</span>
                                <span>R$ {item.price.toFixed(2)}</span>
                            </Button>
                        ))}
                    </div>

                    <div className="relative flex items-center gap-2 mb-4">
                        <div className="h-px bg-border flex-1"></div>
                        <span className="text-xs text-muted-foreground font-bold">OU PERSONALIZADO</span>
                        <div className="h-px bg-border flex-1"></div>
                    </div>

                    <form onSubmit={handleAddItem} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="desc" className="text-lg">O que foi?</Label>
                            <Input 
                                id="desc"
                                placeholder="Cerveja, etc..." 
                                className="h-14 text-lg"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-lg">Valor (R$)</Label>
                            <Input 
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0,00" 
                                className="h-14 text-lg"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                        <Button type="submit" size="lg" className="w-full text-lg h-14">Salvar</Button>
                    </form>
                </DialogContent>
             </Dialog>

             <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="h-20 text-lg flex flex-col gap-1 shadow-md" variant="outline" disabled={balance <= 0}>
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        Pagar Conta
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-hand text-xl">Registrar Pagamento</DialogTitle>
                        <DialogDescription>
                            Deseja quitar toda a dívida ou apenas uma parte?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-4">
                        <Button size="lg" className="h-16 text-xl bg-green-600 hover:bg-green-700 text-white shadow-lg" onClick={handlePayment}>
                            Pagar TUDO ({balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                        </Button>
                        <div className="relative flex items-center gap-2">
                           <div className="h-px bg-border flex-1"></div>
                           <span className="text-xs text-muted-foreground">OU PARCIAL</span>
                           <div className="h-px bg-border flex-1"></div>
                        </div>
                         <form onSubmit={(e) => {
                             e.preventDefault();
                             const form = e.target as HTMLFormElement;
                             const val = parseFloat((form.elements.namedItem('partial') as HTMLInputElement).value);
                             handlePartialPayment(val);
                         }} className="flex gap-2">
                            <Input name="partial" type="number" step="0.01" placeholder="Valor..." className="h-14 text-xl" />
                            <Button type="submit" variant="secondary" className="h-14 px-6 text-lg">Pagar</Button>
                         </form>
                    </div>
                </DialogContent>
             </Dialog>
        </div>

        {/* Transaction History */}
        <div className="space-y-3">
            <h3 className="font-hand text-xl font-bold text-muted-foreground border-b pb-2">Histórico</h3>
            
            {customerTransactions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum registro ainda.</p>
            )}

            <div className="space-y-2">
                {customerTransactions.map((t) => (
                    <div key={t.id} className="flex justify-between items-center p-4 bg-card rounded-lg border border-border shadow-sm">
                        <div className="flex-1">
                            <p className="font-bold text-lg text-foreground uppercase">
                                {t.type === 'payment' ? 'PAGAMENTO' : t.description}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(t.date), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-xl font-bold font-hand ${t.type === 'payment' ? 'text-green-600' : 'text-destructive'}`}>
                                {t.type === 'payment' ? '-' : '+'}{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive print:hidden">
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Excluir item?</DialogTitle>
                                        <DialogDescription>
                                            Isso vai remover o lançamento de R$ {t.amount.toFixed(2)}.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="destructive" size="lg" className="w-full text-lg" onClick={() => handleDeleteTransaction(t.id)}>Excluir</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="pt-10 print:hidden">
            <Dialog>
                <DialogTrigger asChild>
                     <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 h-12 text-lg">
                        <Trash2 className="mr-2 h-5 w-5" />
                        Excluir Cliente e Histórico
                     </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tem certeza?</DialogTitle>
                        <DialogDescription>
                            Isso apagará o cliente <strong>{customer.name}</strong> e todos os registros da conta dele. Não pode ser desfeito.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                         <Button variant="destructive" size="lg" className="w-full text-lg" onClick={handleDeleteCustomer}>Sim, excluir tudo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

      </main>
    </div>
  );
}
