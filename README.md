# 🍅 Pomofoco

> Timer Pomodoro flutuante para estudos — foque, descanse e acompanhe seu progresso, sem sair de vista.

Um widget de desktop leve e sempre-no-topo que aplica a Técnica Pomodoro: você estuda em blocos de foco, faz pausas curtas e, a cada ciclo, uma pausa longa.

---

## ✨ Recursos

- **Timer flutuante** sempre-no-topo, arrastável e redimensionável
- **Fases com cores**: foco, pausa curta e pausa longa (ciclos configuráveis)
- **Tarefas estilo to-do**: clique numa tarefa e o foco já começa nela; conclui sozinha pela estimativa de 🍅 e vai pro histórico
- **Estatísticas**: pomodoros e tempo de foco do dia, meta diária, sequência (streak) e gráfico dos últimos 7 dias
- **Sons**: alarmes (bip / sino / digital) + **sons personalizados** (use seu próprio arquivo), volume, tique-taque e **ruído ambiente** (branco/marrom)
- **Bandeja do sistema** com ícone que mostra o tempo; minimiza pra lá
- **Notificação + piscar a barra** no fim de cada fase
- **Iniciar com o Windows** e **pausar ao bloquear a tela**
- **Manual** embutido (botão `?`)

## 📥 Instalação (Windows)

1. Baixe o `Pomofoco Setup 1.0.0.exe`.
2. Execute. Como o app não é assinado, o **SmartScreen** pode avisar — clique em **"Mais informações" → "Executar assim mesmo"**.
3. O instalador cria atalho no Menu Iniciar e na Área de Trabalho, além do desinstalador.

> Requer **Windows 10 ou 11** (64-bit).

## 🚀 Uso rápido

- **▶ / ⏸** inicia/pausa · **↺** reinicia · **⏭** pula a fase
- **Espaço** = play/pause · **R** = reiniciar
- **✓** tarefas · **📊** estatísticas · **⚙** configurações · **📌** fixar no topo · **—** bandeja · **?** manual

## 🛠️ Rodando a partir do código-fonte

```bash
npm install
npm start          # roda o app em modo dev
npm run dist       # gera o instalador Windows (NSIS) em dist/
```

> **Nota de build (Windows sem admin):** o `electron-builder` pode falhar ao extrair os symlinks de macOS do pacote `winCodeSign`. Soluções: ative o **Modo Desenvolvedor do Windows** ou rode o build uma vez como **administrador** (o `winCodeSign` fica em cache e os builds seguintes funcionam normalmente).

## 🧰 Tecnologia

Construído com **Electron**. Sem servidores e sem coleta de dados — tudo é salvo localmente na sua máquina.

## 💛 Apoie o projeto

O Pomofoco é **gratuito** e feito de forma independente. Se ele te ajuda nos estudos e você quiser agradecer, uma doação via **Pix** mantém o projeto vivo e em evolução. Não há valor mínimo — o gesto já vale muito. 🍅

**Chave Pix (aleatória):**

```
f5d89e92-9364-4c56-93c6-d9c6d472d973
```

(Você também encontra o botão **"Apoiar 💛"** dentro do app, no manual.)

## 📄 Licença

[MIT](LICENSE) © 2026 Thiago A. Quirino

## 👤 Autor

**Thiago A. Quirino** — thiangelio@gmail.com
