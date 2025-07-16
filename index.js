/* global hexo */
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const pLimit = require('p-limit');

const cfg = hexo.config.aisummary || {};
const limit = pLimit(cfg.concurrency || 3);
const processedFiles = new Set();

function split(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  return m ? { front: m[1], body: m[2] } : null;
}

function cleanBody(body) {
  return body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '')
    .replace(/{%.*?%}/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getSummary(text) {
  // 获取用户配置或使用默认值
  const maxInputLength = cfg.max_input_length || 3000; // 默认3000字符
  const systemPrompt = cfg.prompt || '用一句话中文摘要，纯文本，不超120字，无换行。';
  
  const payload = {
    model: cfg.model || 'gpt-3.5-turbo',
    messages: [
      { 
        role: 'system', 
        content: systemPrompt 
      },
      { 
        role: 'user', 
        content: text.slice(0, maxInputLength) // 使用配置的长度限制
      }
    ],
    max_tokens: cfg.max_tokens || 120,
    temperature: cfg.temperature || 0.5
  };

  try {
    const res = await axios.post(cfg.api, payload, {
      headers: { 
        Authorization: `Bearer ${cfg.token}`, 
        'Content-Type': 'application/json' 
      },
      timeout: cfg.timeout || 10000
    });
    let s = res.data?.choices?.[0]?.message?.content?.trim();
    return s ? s.replace(/"/g, "'").replace(/\n+/g, ' ') : '';
  } catch (error) {
    hexo.log.error(`[hexo-ai-summary] API请求错误: ${error.message}`);
    return '';
  }
}

hexo.extend.filter.register('before_post_render', async function (data) {
  if (data.layout !== 'post' || !data.source.startsWith('_posts/')) return data;

  return limit(async () => {
    const filePath = path.join(hexo.source_dir, data.source);
    
    if (processedFiles.has(filePath)) {
      hexo.log.debug(`[hexo-ai-summary] 跳过 ${data.title}（已处理）`);
      return data;
    }
    processedFiles.add(filePath);

    const raw = fs.readFileSync(filePath, 'utf8');
    const parts = split(raw);
    if (!parts) return data;

    const lines = parts.front.split('\n');
    let skip = false;
    let hasSummary = false;
    const key = cfg.summary_field || 'summary';

    for (const l of lines) {
      if (l.trim() === 'summary: false') skip = true;
      if (l.trim().startsWith(`${key}:`)) hasSummary = true;
    }
    
    if (skip) {
      hexo.log.debug(`[hexo-ai-summary] 跳过 ${data.title}（summary:false）`);
      return data;
    }
    
    if (!cfg.cover_all && hasSummary) {
      hexo.log.debug(`[hexo-ai-summary] 跳过 ${data.title}（已有摘要）`);
      return data;
    }

    const summary = await getSummary(cleanBody(parts.body));
    if (!summary) {
      hexo.log.warn(`[hexo-ai-summary] ${data.title} 摘要为空`);
      return data;
    }

    const newFront = lines
      .filter(l => !l.trim().startsWith(`${key}:`))
      .join('\n')
      .trimEnd() + `\n${key}: "${summary}"`;

    const newContent = `---\n${newFront}\n---\n${parts.body}`;
    fs.writeFileSync(filePath, newContent, 'utf8');

    hexo.log.info(`[hexo-ai-summary] ${data.title} 摘要已写入`);
    return data;
  });
});