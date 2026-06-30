# Compra completa de produtos digitais — TopDJ

Hoje o botão **Finalizar Compra** apenas mostra um aviso e esvazia o carrinho (compra simulada). O carrinho em si funciona (testei: adicionar coloca o item no carrinho e abre o drawer). O que falta é transformar o "finalizar" numa compra de verdade.

Vamos entregar 5 coisas:

1. **Dados do comprador** (nome + e-mail) antes de pagar
2. **Pagamento real** (Pix e cartão) via Stripe integrado da Lovable
3. **Pedido salvo no banco** para você acompanhar as vendas
4. **Tela de confirmação** do pedido
5. **Entrega do produto digital** (link de download liberado após o pagamento)

## Fluxo da compra

```text
Carrinho ▸ "Finalizar Compra"
   → Formulário: Nome + E-mail
   → Pagamento Stripe (Pix ou cartão)
   → Pagamento confirmado
   → Página /pedido/{id}: confirmação + links de download dos packs
   → E-mail de confirmação com os mesmos links (opcional, ver abaixo)
```

## O que será construído

### Pagamento (Stripe integrado)
- Ativação do pagamento integrado da Lovable (sem precisar criar conta nem colar chaves).
- Checkout com Pix e cartão.
- Após o pagamento aprovado, o pedido é marcado como **pago** e os downloads são liberados. Pagamentos não confirmados não liberam nada.

### Banco de dados (Lovable Cloud)
- Tabela **pedidos**: nome do comprador, e-mail, valor total, status do pagamento, referência do pagamento.
- Tabela **itens_pedido**: cada pack comprado, com nome, gênero e preço no momento da compra.
- Novo campo **arquivo_url** na tabela de packs: o link/arquivo de download do produto digital, gerenciável no Admin.
- Regras de acesso: só o backend cria/atualiza pedidos (durante o pagamento); ninguém consegue ler pedidos de outras pessoas pela internet.

### Entrega do produto digital
- No **Admin**, cada pack ganha um campo para o link de download (ex.: arquivo no armazenamento ou link externo).
- A página de confirmação `/pedido/{id}` mostra os packs comprados com botão **Baixar** — visível apenas quando o pagamento está confirmado.
- Opção de **armazenar os arquivos no próprio site** (upload no Admin) em vez de link externo — posso incluir isso se você quiser; caso contrário, começamos com link/URL.

### Tela de confirmação
- Nova rota `/pedido/{id}` com resumo do pedido (itens, total, status) e os downloads.
- Mensagem clara de "Pagamento confirmado" e os links de download.

### Carrinho
- Adicionar um passo de **checkout** (nome + e-mail) antes do pagamento, com validação.
- Botão "Finalizar Compra" passa a iniciar o pagamento real em vez do aviso simulado.

## E-mail de confirmação (opcional)
Posso enviar um e-mail automático com o resumo e os links de download. Isso precisa de um remetente de e-mail configurado. Se você quiser, incluímos; se não, a entrega fica pela tela de confirmação `/pedido/{id}` (que pode ser acessada/salva pelo comprador).

## Detalhes técnicos
- **Stripe integrado da Lovable** (Pix + cartão), com `automatic_tax` apenas para cálculo de impostos (cobertura total de compliance não está disponível para vendedor no Brasil).
- Server functions (`createServerFn`) do TanStack Start para criar a sessão de pagamento e confirmar o pedido via webhook seguro em `/api/public/...`.
- Migrações de banco para `pedidos`, `itens_pedido` e o campo `arquivo_url` em `packs`, com RLS e GRANTs.
- Validação de entrada com `zod` (nome/e-mail) no cliente e no servidor.

## Observação importante (direitos autorais)
Para vender packs de música você precisa ter os direitos/licenças do conteúdo distribuído. O provedor de pagamento pode exigir revisão. Isso é responsabilidade do lojista.
