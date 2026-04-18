import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

import { config } from "./src/config/index.js";
import { logger } from "./src/lib/logger.js";
import { requestIdMiddleware, loggingMiddleware } from "./src/middleware/request.js";
import { corsMiddleware, securityHeadersMiddleware, rateLimitMiddleware } from "./src/middleware/security.js";
import { errorHandler, notFoundHandler, asyncHandler } from "./src/middleware/error.js";
import { ConfigurationError, ParseError, InvalidResponseError } from "./src/errors/index.js";
import { z } from "zod";

const generateQuestionsSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  subject: z.string().min(1, "Subject is required"),
  level: z.string().optional().default("Ensino Médio"),
  count: z.number().int().min(1).max(20).default(5),
  type: z.enum(["multiple_choice", "essay", "true_false"]).default("multiple_choice"),
  difficulty: z.enum(["Fácil", "Médio", "Difícil"]).default("Médio"),
  pdfText: z.string().optional(),
});

async function startServer() {
  const app = express();
  const PORT = config.server.port;

  app.use(express.json());

  app.use(requestIdMiddleware);
  app.use(loggingMiddleware);
  app.use(corsMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(rateLimitMiddleware);

  app.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      request_id: req.id 
    });
  });

  app.get("/ready", async (req, res) => {
    const checks = {
      gemini_api: config.api.geminiApiKey ? "configured" : "missing",
    };
    
    const isReady = !!config.api.geminiApiKey;
    res.status(isReady ? 200 : 503).json({
      status: isReady ? "ok" : "degraded",
      checks,
      request_id: req.id,
    });
  });

  app.post(
    "/api/generate-questions",
    asyncHandler(async (req, res) => {
      const parsedInput = generateQuestionsSchema.parse(req.body);
      const { topic, subject, level, count, type, difficulty, pdfText } = parsedInput;

      const clientApiKey = req.headers['x-gemini-api-key'] as string | undefined;
      const effectiveApiKey = (clientApiKey && clientApiKey.trim()) ? clientApiKey.trim() : config.api.geminiApiKey;

      if (!effectiveApiKey) {
        throw new ConfigurationError("Nenhuma chave Gemini configurada. Adicione sua chave em Configurações → Inteligência Artificial.");
      }

      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });

      const questionTypeText = type === 'multiple_choice'
        ? 'múltipla escolha (com 4 ou 5 alternativas)'
        : type === 'essay'
          ? 'dissertativas'
          : 'verdadeiro ou falso';

      const prompt = pdfText
        ? `Analise o conteúdo a seguir e gere ${count} questões de ${questionTypeText} sobre ele, para a disciplina de ${subject}, nível ${level}, com dificuldade ${difficulty}.\nRetorne APENAS um array de objetos JSON válido, sem markdown, sem texto adicional. Cada objeto deve ter os campos: text, options (array de strings para múltipla escolha, vazio para dissertativa), answer, explanation.\nCONTEÚDO DO DOCUMENTO:\n${pdfText.substring(0, 6000)}`
        : `Gere ${count} questões de ${questionTypeText} sobre o tema "${topic}" para a disciplina de ${subject}, nível ${level}, com dificuldade ${difficulty}.\nRetorne APENAS um array de objetos JSON válido, sem markdown, sem texto adicional. Cada objeto deve ter os campos: text, options (array de strings para múltipla escolha, vazio para dissertativa), answer, explanation.`;

      logger.info("Generating questions", {
        request_id: req.id,
        topic: pdfText ? '[from PDF content]' : topic,
        subject,
        count,
        type,
        difficulty,
        source: pdfText ? 'pdf' : 'topic',
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["text", "answer"],
            },
          },
        },
      });

      let questions: unknown[];
      try {
        questions = JSON.parse(response.text || "[]");
      } catch {
        logger.error("Failed to parse AI response", { request_id: req.id, response: response.text });
        throw new ParseError("Failed to parse generated questions");
      }

      if (!Array.isArray(questions)) {
        throw new InvalidResponseError("Invalid response format from AI");
      }

      logger.info("Questions generated successfully", {
        request_id: req.id,
        count: questions.length,
      });

      res.json({ questions });
    })
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  let server: ReturnType<typeof app.listen>;

  if (config.server.nodeEnv !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`, {
      node_env: config.server.nodeEnv,
    });
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received, starting graceful shutdown`);
    
    server.close(async () => {
      logger.info("HTTP server closed");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

startServer().catch((error) => {
  logger.error("Failed to start server", { error: error.message, stack: error.stack });
  process.exit(1);
});
