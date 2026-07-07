#!/usr/bin/env node

/**
 * Auto-Commit e Push Script
 * Monitora mudanças em arquivos e faz commit/push automático
 * 
 * Uso: node auto-commit.js
 * Ou:  npm run auto-commit (se adicionar ao package.json)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuração
const IGNORE_PATTERNS = [
  "node_modules",
  ".git",
  "dist",
  ".output",
  ".env",
  ".env.local",
  "package-lock.json",
];

const DEBOUNCE_MS = 3000; // Aguardar 3 segundos após mudança
let lastCommitTime = 0;
let pendingCommit = false;

console.log("🚀 Auto-Commit ativado!");
console.log("📂 Monitorando mudanças em:", process.cwd());
console.log("Pressione Ctrl+C para parar\n");

/**
 * Verifica se arquivo deve ser ignorado
 */
function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(
    (pattern) =>
      filePath.includes(pattern) || filePath.includes(`\\${pattern}`)
  );
}

/**
 * Faz commit e push
 */
function commitAndPush() {
  try {
    const now = Date.now();

    // Evitar múltiplos commits em rápida sucessão
    if (now - lastCommitTime < 30000) {
      console.log("⏳ Aguardando 30s desde último commit...");
      return;
    }

    lastCommitTime = now;

    console.log("📝 Fazendo commit automático...");

    // Stage all changes
    execSync("git add -A", { stdio: "pipe" });

    // Check if there are changes to commit
    const status = execSync("git status --porcelain", { encoding: "utf8" });
    if (!status.trim()) {
      console.log("ℹ️  Nenhuma mudança para commit");
      return;
    }

    // Create commit message
    const timestamp = new Date().toLocaleTimeString("pt-BR");
    const message = `auto: update ${timestamp}`;

    // Commit
    execSync(`git commit -m "${message}"`, { stdio: "pipe" });
    console.log(`✅ Commit: ${message}`);

    // Push
    console.log("🚀 Fazendo push automático...");
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();

    execSync(`git push origin ${branch}`, { stdio: "pipe" });
    console.log(`✅ Push para origin/${branch}\n`);
  } catch (error) {
    if (error.message.includes("nothing to commit")) {
      // Silently ignore
    } else {
      console.error("❌ Erro:", error.message.split("\n")[0]);
    }
  }
}

/**
 * Monitora mudanças em arquivos
 */
function watchFiles() {
  const watcher = fs.watch(
    ".",
    { recursive: true, persistent: true },
    (eventType, filename) => {
      if (!filename || shouldIgnore(filename)) {
        return;
      }

      console.log(`📝 Detectado: ${filename}`);

      // Debounce: agrupar mudanças rápidas
      clearTimeout(watchFiles.timeout);
      watchFiles.timeout = setTimeout(() => {
        commitAndPush();
      }, DEBOUNCE_MS);
    }
  );

  // Handle errors
  watcher.on("error", (error) => {
    console.error("❌ Erro no watcher:", error);
  });

  return watcher;
}

// Iniciar
try {
  watchFiles();
  console.log("✅ Monitoramento ativo\n");
} catch (error) {
  console.error("❌ Erro ao iniciar:", error.message);
  process.exit(1);
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Auto-commit desativado");
  process.exit(0);
});
