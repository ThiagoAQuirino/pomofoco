# Assinatura de código (opcional, grátis via SignPath OSS)

Hoje o Pomofoco é distribuído **sem assinatura** — funciona, mas o Windows mostra o aviso do SmartScreen ("editor desconhecido"). Assinar remove esse aviso. Como o projeto é open-source (MIT), dá pra assinar **de graça** pelo programa OSS do SignPath.

## Passos (você precisa fazer — exige sua conta)

1. Crie conta em **https://about.signpath.io/** e candidate-se ao programa **"Free code signing for open-source projects"**.
   - Eles pedem: repositório público (✅ `github.com/ThiagoAQuirino/pomofoco`), licença OSI (✅ MIT), e que o build seja feito em CI público (✅ GitHub Actions já configurado).
2. Aguarde a aprovação (costuma levar alguns dias).
3. Aprovado, no painel do SignPath você terá: uma **Organization Id**, um **Project/Slug**, uma **Signing Policy** e um **API token**.
4. No GitHub do repo: **Settings → Secrets and variables → Actions** → crie o secret **`SIGNPATH_API_TOKEN`** com o token.
5. Me avise (ou abra a issue) que eu **ligo a assinatura no workflow** (`.github/workflows/release.yml`): o CI builda o instalador, envia pro SignPath assinar e publica o **artefato assinado**.

## Enquanto não assina
- O app continua 100% funcional; o instalador só mostra o aviso do SmartScreen.
- A reputação no SmartScreen melhora sozinha conforme os downloads acumulam.
- Ir de **não-assinado → assinado** numa versão futura **não quebra** o auto-update no Windows.
