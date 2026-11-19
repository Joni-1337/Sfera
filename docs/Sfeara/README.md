# СФЕРА — пакет для инвестора

## Главный файл для встречи

**Microsoft PowerPoint:** `SFERA_Investor_Pitch.pptx`

- 16 слайдов, формат 16:9
- 3D-иллюстрации, графики роста по годам, сравнение сценариев
- Открывается в PowerPoint / Google Slides / Keynote

Пересобрать после правок скрипта:

```bash
python docs/Sfeara/build_pptx.py
```

## HTML-версия (дополнительно)

1. Откройте `index.html` в браузере.
2. **F11** / клавиша **F** — fullscreen · **N** — ноты · **→** — дальше.

## Состав папки

| Файл | Назначение |
|------|------------|
| `SFERA_Investor_Pitch.pptx` | **Основная презентация PowerPoint** |
| `build_pptx.py` | Скрипт пересборки PPTX |
| `assets/` | 3D-картинки для слайдов |
| `index.html` | Веб-версия |
| `SPEAKER-NOTES.md` | Спикер-ноты + тайминг + FAQ |
| `FINANCIAL-MODEL.md` | Финмодель Focus / Platform / Aggressive |
| `README.md` | Эта инструкция |

Дополнительно в Cursor: canvas **sfera-investor-pitch** — one-pager со графиками сценариев.

## Перед встречей с инвестором

Обязательно заполните:

1. Слайд **Тракшн** в `index.html` (paid, MRR, trial→paid).
2. Слайд **Команда** — имена и роли.
3. Слайд **Ask** — точная сумма и инструмент сделки.
4. Цифры рынка (TAM/SAM/SOM) из свежих источников.
5. Сверьте ask с `FINANCIAL-MODEL.md`.

## Рекомендуемый сценарий в питче

**Platform** (чат + рефералка + Мат + School) — базовый путь раунда.  
Focus — запасной conservative. Aggressive — только как опцион при перевыполнении.
