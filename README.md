# 🤖 TrackTest - AI Testing Suite

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![AI-Testing](https://img.shields.io/badge/AI_Analysis-Experimental-blueviolet?style=for-the-badge)

**TrackTest** é uma plataforma avançada desenvolvida com **Next.js** para orquestrar e analisar interações entre modelos de Inteligência Artificial. O projeto utiliza o agente **Ragnar** para testar e auditar outros agentes de IA em cenários adversariais.

---

## 🚀 Funcionalidades Principais

- **Ragnar Agent:** Um testador de IA especializado em ataques adversariais controlados via WhatsApp.
- **Audit Reporter:** Geração automática de relatórios detalhados com score de performance e análise de segurança.
- **Gestão de Cenários:** Configure personas e instruções específicas para o Ragnar simular diferentes tipos de clientes ou atacantes.
- **Logs em Tempo Real:** Interface interativa para acompanhar o "pensamento" e a troca de mensagens.
- **Métricas de Performance:** Gráficos de tokens, tempo de resposta e pontuação de assertividade.

## 🛠️ Tech Stack

| Componente         | Tecnologia               |
| :----------------- | :----------------------- |
| **Framework**      | Next.js 16 (App Router)  |
| **ORM**            | Prisma 7                 |
| **Banco de Dados** | PostgreSQL               |
| **Mensageria**     | Socket.IO                |
| **Integração**     | Evolution API (WhatsApp) |

---

## ⚙️ Configuração e Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/TrackTest/TrackTest.git
cd TrackTest
```

### 2. Subir o ambiente com Docker

```bash
docker compose up -d --build
```
