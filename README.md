# Hexo AI 摘要插件

这是一个 Hexo 插件，用于自动生成文章的摘要。支持腾讯混元、OpenAI 或任何兼容 OpenAI 协议的模型接口，支持并发处理、自定义摘要字段、摘要覆盖控制等功能。
## 功能特点

- **自动摘要**：自动为每篇文章生成简洁的中文摘要。
- **自定义提示**：可以通过配置文件自定义摘要的生成提示。
- **支持多种模型**：支持腾讯云的 Hunyuan 模型。
- **并发控制**：支持并发请求，提高生成效率。
- **覆盖所有文章**：可以选择覆盖所有文章的摘要，即使已有摘要。
- **输入长度限制**：可以限制输入文本的长度，确保生成效果。
- **超时设置**：可以设置 API 请求的超时时间，避免长时间等待。

## 安装
```bash
npm install hexo-ai-summary-anxiaowai --save
```

## 配置项（添加到 `_config.yml` 或主题配置文件中）

```yaml
aisummary:
  enable: true                                                   # 是否启用插件
  api: https://api.hunyuan.cloud.tencent.com/v1/chat/completions # OpenAI 或腾讯云的 Hunyuan 模型
  token: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx             # OpenAI 或兼容模型的密钥
  model: hunyuan-standard                                        # 使用模型名称
  summary_field: summary                                         # 摘要字段
  cover_all: false                                               # 是否启用全部覆盖（既重新生成）
  concurrency: 2                                                 # 并发处理数
  max_input_length: 3000  # 输入文本长度限制(腾讯推荐2000字以内)
  prompt: "请用简体中文生成一段简洁的摘要，要求：1.长度在80-120字之间 2.包含文章核心观点 3.输出内容开头为“这里小歪AI，这篇文章” 4.不要包含代码和公式"
  max_tokens: 120       # 混元模型建议稍大的token限制
  temperature: 0.5      # 创造性稍高的温度值（0.1~2.0）
  timeout: 10000        # 腾讯API建议稍长的超时时间
```

## 指定文章禁用AI摘要
```markdown
---
title: xxxxxxxxxxx
summary: false
---
```


## 所需依赖

插件运行依赖以下 NPM 包：

```bash
npm install axios p-limit
```
