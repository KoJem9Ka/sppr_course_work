# СППР Семестровая
Автоматизированный расчёт связанности объектов международного/междугороднего транспортного обслуживания в городе для ряда городов

## Запуск:

1. Для работы проекта необходим [Docker](https://www.docker.com/).

2. Для начала нужно подготовить файлы osrm-backend:
   - Скачать [russia-latest.osm.pbf](https://download.geofabrik.de/russia-latest.osm.pbf) со страницы [Download OpenStreetMap Russian Federation](https://download.geofabrik.de/russia.html). Данный файл поместить в папку `OSRM_russia`.
   - Запустить сценарий `osrm_russia_init.cmd` для генерации `OSRM_russia/russia-latest.osrm.*` файлов, операция выполняется очень долго. Данные два шага после скачивания проекта достаточно выполнить один раз.

3. Запустить osrm-backend с помощью сценария `osrm_russia_start.cmd`.

4. Запустить контейнер Redis с помощью команды `docker-compose up -d`

5. Установить NodeJS пакеты командой `npm install`.

6. Запуск программы командой `npm start`
   - В `src/main.ts` можно настроить вывод программы внутри функции `main()`.
   - После выполнения скрипта в папке `result/` появятся результаты в формате `json`.